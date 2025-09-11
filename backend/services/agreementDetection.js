const logger = require('./logger');
const db = require('../db');

/**
 * Agreement Detection Service
 * 
 * This service analyzes conversations to detect when a client agrees to a service or product.
 * It extracts relevant information like phone numbers, locations, services, pricing, etc.
 */

// Keywords that typically indicate agreement
const AGREEMENT_KEYWORDS = [
  // Direct agreement
  'yes', 'yeah', 'yep', 'okay', 'ok', 'sure', 'alright', 'definitely',
  'absolutely', 'i agree', 'agreed', 'deal', 'sounds good', 'perfect',
  'lets do it', "let's do it", 'i want', 'i need', 'i would like',
  
  // Commitment phrases
  'when can you start', 'how do we proceed', 'what are the next steps',
  'when do we begin', 'lets start', "let's start", 'i am ready',
  'count me in', 'sign me up', 'book me', 'schedule me',
  
  // Payment/pricing acceptance
  'how much', 'what is the price', 'what does it cost', 'i can pay',
  'i will pay', 'when do i pay', 'payment', 'deposit', 'down payment',
  
  // Arabic agreement words
  'نعم', 'حسناً', 'موافق', 'ممتاز', 'تمام', 'ان شاء الله'
];

// Keywords that indicate disagreement or hesitation
const DISAGREEMENT_KEYWORDS = [
  'no', 'nah', 'not interested', 'maybe later', 'i will think about it',
  'too expensive', 'too much', 'cant afford', "can't afford", 'not now',
  'not ready', 'need to think', 'maybe', 'perhaps', 'possibly'
];

// Regular expressions for extracting information
const PATTERNS = {
  // Phone numbers (various formats)
  phone: [
    /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
    /(?:\+?966|0)?[-.\s]?([0-9]{2,3})[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{4})/g,
    /(?:\+?[0-9]{1,4}[-.\s]?)?([0-9]{2,4})[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{3,4})/g
  ],
  
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Price/money mentions
  price: [
    /\$[\d,]+(?:\.\d{2})?/g,
    /[\d,]+\s*(?:dollars?|usd|sar|riyal|riyals?)/gi,
    /[\d,]+\s*(?:ريال|دولار)/g
  ],
  
  // Location mentions
  location: [
    /(?:in|at|from|near|around)\s+([A-Za-z\s]+(?:city|town|street|avenue|road|district))/gi,
    /(?:الرياض|جدة|الدمام|مكة|المدينة|الطائف|أبها|تبوك|القصيم|حائل)/g
  ],
  
  // Time/timeline mentions
  timeline: [
    /(?:within|in|after|by)\s+(\d+\s*(?:days?|weeks?|months?|years?))/gi,
    /(?:today|tomorrow|next week|next month|this week|this month|asap|immediately)/gi,
    /(?:اليوم|غداً|الأسبوع القادم|الشهر القادم|قريباً)/g
  ]
};

/**
 * Analyze conversation messages to detect agreement
 * @param {Array} messages - Array of conversation messages
 * @param {Object} customerInfo - Customer information
 * @returns {Object} Detection result
 */
async function detectAgreementFromConversation(messages, triggerMessage = null, customerInfo = {}) {
  try {
    logger.info('Starting agreement detection analysis', {
      messageCount: messages.length,
      customerId: customerInfo.customer_id
    });

    // Analyze each message for agreement indicators
    let totalConfidence = 0;
    let agreementMessages = [];
    let extractedInfo = {
      phone_numbers: [],
      emails: [],
      locations: [],
      prices: [],
      timelines: [],
      services: []
    };

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const messageAnalysis = analyzeMessageForAgreement(message, i);
      
      if (messageAnalysis.hasAgreement) {
        agreementMessages.push({
          ...message,
          confidence: messageAnalysis.confidence,
          agreementKeywords: messageAnalysis.keywords,
          extractedData: messageAnalysis.extractedData
        });
        totalConfidence += messageAnalysis.confidence;
      }

      // Extract information from all messages
      const info = extractInformationFromMessage(message);
      mergeExtractedInfo(extractedInfo, info);
    }

    // Calculate overall confidence (average with bonus for multiple agreement messages)
    const averageConfidence = agreementMessages.length > 0 
      ? totalConfidence / agreementMessages.length 
      : 0;
    
    const bonusMultiplier = Math.min(1.2, 1 + (agreementMessages.length - 1) * 0.1);
    const finalConfidence = Math.min(1.0, averageConfidence * bonusMultiplier);

    // Determine if agreement was detected (threshold: 0.6)
    const agreementDetected = finalConfidence >= 0.6;

    if (agreementDetected) {
      // Generate summaries using AI
      const summaries = await generateAgreementSummaries(messages, extractedInfo, customerInfo);
      
      // Prepare agreement data
      const agreementData = {
        user_id: customerInfo.user_id,
        customer_id: customerInfo.customer_id,
        customer_name: customerInfo.customer_name,
        customer_username: customerInfo.customer_username,
        platform: customerInfo.platform || 'telegram',
        agreement_confidence: finalConfidence,
        agreement_trigger_message: triggerMessage || agreementMessages[agreementMessages.length - 1]?.message_text,
        agreement_keywords: agreementMessages.map(m => m.agreementKeywords).flat(),
        phone_number: extractedInfo.phone_numbers[0] || null,
        email_address: extractedInfo.emails[0] || null,
        location: extractedInfo.locations[0] || null,
        service_requested: extractedInfo.services[0] || inferServiceFromMessages(messages),
        service_description: summaries.serviceDescription,
        budget_mentioned: extractedInfo.prices[0] || null,
        price_agreed: extractedInfo.prices[0] || null,
        timeline_mentioned: extractedInfo.timelines[0] || null,
        agreement_summary: summaries.agreementSummary,
        conversation_summary: summaries.conversationSummary,
        full_conversation_json: JSON.stringify(messages),
        status: 'pending'
      };

      // Save to database
      const agreementId = await saveAgreementToDatabase(agreementData, messages);

      logger.info('Agreement detected and saved', {
        agreementId,
        confidence: finalConfidence,
        customerId: customerInfo.customer_id
      });

      return {
        agreementDetected: true,
        confidence: finalConfidence,
        agreementData,
        agreementId,
        extractedInfo,
        agreementMessages
      };
    } else {
      logger.info('No agreement detected', {
        confidence: finalConfidence,
        customerId: customerInfo.customer_id
      });

      return {
        agreementDetected: false,
        confidence: finalConfidence,
        extractedInfo,
        messages: agreementMessages
      };
    }

  } catch (error) {
    logger.logError(error, { 
      context: 'agreement-detection',
      customerId: customerInfo.customer_id 
    });
    throw error;
  }
}

/**
 * Analyze a single message for agreement indicators
 * @param {Object} message - Message object
 * @param {number} index - Message index in conversation
 * @returns {Object} Analysis result
 */
function analyzeMessageForAgreement(message, index) {
  const text = (message.message_text || message.text || '').toLowerCase();
  
  let confidence = 0;
  let foundKeywords = [];
  let hasDisagreement = false;

  // Check for agreement keywords
  for (const keyword of AGREEMENT_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      foundKeywords.push(keyword);
      confidence += 0.15; // Base confidence per keyword
    }
  }

  // Check for disagreement keywords (reduces confidence)
  for (const keyword of DISAGREEMENT_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      hasDisagreement = true;
      confidence -= 0.3; // Penalty for disagreement
    }
  }

  // Context-based confidence adjustments
  if (foundKeywords.length > 0) {
    // Boost confidence for longer messages (more context)
    if (text.length > 50) confidence += 0.1;
    if (text.length > 100) confidence += 0.1;
    
    // Boost confidence for messages later in conversation (more likely to be decisive)
    if (index > 5) confidence += 0.1;
    if (index > 10) confidence += 0.1;
    
    // Boost confidence if multiple agreement words are used
    if (foundKeywords.length > 1) confidence += 0.2;
    if (foundKeywords.length > 2) confidence += 0.3;
  }

  // Extract additional data from message
  const extractedData = extractInformationFromMessage(message);

  // Boost confidence if contact info or pricing is mentioned alongside agreement
  if (foundKeywords.length > 0) {
    if (extractedData.phone_numbers.length > 0) confidence += 0.2;
    if (extractedData.emails.length > 0) confidence += 0.2;
    if (extractedData.prices.length > 0) confidence += 0.3;
    if (extractedData.timelines.length > 0) confidence += 0.2;
  }

  // Ensure confidence is between 0 and 1
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    hasAgreement: confidence > 0.3 && !hasDisagreement,
    confidence,
    keywords: foundKeywords,
    extractedData,
    hasDisagreement
  };
}

/**
 * Extract information from a message using patterns
 * @param {Object} message - Message object
 * @returns {Object} Extracted information
 */
function extractInformationFromMessage(message) {
  const text = message.message_text || message.text || '';
  
  const extracted = {
    phone_numbers: [],
    emails: [],
    locations: [],
    prices: [],
    timelines: [],
    services: []
  };

  // Extract phone numbers
  for (const pattern of PATTERNS.phone) {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      if (match[0] && match[0].length >= 8) { // Minimum reasonable phone length
        extracted.phone_numbers.push(match[0]);
      }
    });
  }

  // Extract emails
  const emailMatches = [...text.matchAll(PATTERNS.email)];
  emailMatches.forEach(match => extracted.emails.push(match[0]));

  // Extract prices
  for (const pattern of PATTERNS.price) {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => extracted.prices.push(match[0]));
  }

  // Extract locations
  for (const pattern of PATTERNS.location) {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      if (match[1]) {
        extracted.locations.push(match[1].trim());
      } else {
        extracted.locations.push(match[0]);
      }
    });
  }

  // Extract timelines
  for (const pattern of PATTERNS.timeline) {
    const matches = [...text.matchAll(pattern)];
    matches.forEach(match => {
      if (match[1]) {
        extracted.timelines.push(match[1]);
      } else {
        extracted.timelines.push(match[0]);
      }
    });
  }

  // Extract services (basic keyword matching)
  const serviceKeywords = [
    'website', 'design', 'development', 'marketing', 'advertising',
    'consulting', 'training', 'coaching', 'photography', 'video',
    'writing', 'translation', 'cleaning', 'repair', 'installation',
    'موقع', 'تصميم', 'تطوير', 'تسويق', 'إعلان', 'استشارة'
  ];
  
  serviceKeywords.forEach(service => {
    if (text.toLowerCase().includes(service)) {
      extracted.services.push(service);
    }
  });

  return extracted;
}

/**
 * Merge extracted information objects
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 */
function mergeExtractedInfo(target, source) {
  Object.keys(source).forEach(key => {
    if (Array.isArray(target[key]) && Array.isArray(source[key])) {
      // Add unique items only
      source[key].forEach(item => {
        if (!target[key].includes(item)) {
          target[key].push(item);
        }
      });
    }
  });
}

/**
 * Infer service type from conversation messages
 * @param {Array} messages - Conversation messages
 * @returns {string} Inferred service
 */
function inferServiceFromMessages(messages) {
  const allText = messages.map(m => m.message_text || m.text || '').join(' ').toLowerCase();
  
  // Service inference patterns
  const servicePatterns = {
    'Website Development': ['website', 'web', 'site', 'online', 'domain', 'hosting'],
    'Mobile App': ['app', 'mobile', 'android', 'ios', 'application'],
    'Digital Marketing': ['marketing', 'social media', 'facebook', 'instagram', 'ads'],
    'Graphic Design': ['logo', 'design', 'graphics', 'branding', 'poster'],
    'Consulting': ['consulting', 'advice', 'consultation', 'help', 'guidance'],
    'Training/Coaching': ['training', 'coaching', 'course', 'learn', 'teach'],
    'Photography': ['photo', 'photography', 'pictures', 'camera', 'shoot'],
    'Video Production': ['video', 'filming', 'editing', 'production', 'youtube'],
    'Translation': ['translate', 'translation', 'language', 'arabic', 'english'],
    'Writing': ['writing', 'content', 'blog', 'article', 'copy']
  };

  let maxMatches = 0;
  let inferredService = 'General Service';

  Object.keys(servicePatterns).forEach(service => {
    let matches = 0;
    servicePatterns[service].forEach(keyword => {
      if (allText.includes(keyword)) matches++;
    });
    
    if (matches > maxMatches) {
      maxMatches = matches;
      inferredService = service;
    }
  });

  return maxMatches > 0 ? inferredService : 'General Service';
}

/**
 * Generate agreement summaries using AI (simplified version)
 * @param {Array} messages - Conversation messages
 * @param {Object} extractedInfo - Extracted information
 * @param {Object} customerInfo - Customer information
 * @returns {Object} Generated summaries
 */
async function generateAgreementSummaries(messages, extractedInfo, customerInfo) {
  // For now, we'll create basic summaries
  // In a full implementation, you'd use Claude API here
  
  const conversationText = messages.map(m => 
    `${m.sender_type === 'customer' ? 'Customer' : 'Assistant'}: ${m.message_text || m.text || ''}`
  ).join('\n');

  const serviceInfo = extractedInfo.services.length > 0 
    ? extractedInfo.services.join(', ') 
    : inferServiceFromMessages(messages);

  const agreementSummary = `Client ${customerInfo.customer_name || 'Customer'} has agreed to proceed with ${serviceInfo}. ` +
    (extractedInfo.prices.length > 0 ? `Budget discussed: ${extractedInfo.prices[0]}. ` : '') +
    (extractedInfo.timelines.length > 0 ? `Timeline mentioned: ${extractedInfo.timelines[0]}.` : '');

  const conversationSummary = `Conversation with ${customerInfo.customer_name || 'Customer'} regarding ${serviceInfo}. ` +
    `Total messages: ${messages.length}. ` +
    (extractedInfo.phone_numbers.length > 0 ? `Contact provided: ${extractedInfo.phone_numbers[0]}. ` : '') +
    (extractedInfo.locations.length > 0 ? `Location mentioned: ${extractedInfo.locations[0]}.` : '');

  const serviceDescription = `${serviceInfo} service as discussed in the conversation. ` +
    (extractedInfo.services.length > 1 ? `Additional services mentioned: ${extractedInfo.services.slice(1).join(', ')}.` : '');

  return {
    agreementSummary: agreementSummary.trim(),
    conversationSummary: conversationSummary.trim(),
    serviceDescription: serviceDescription.trim()
  };
}

/**
 * Save agreement to database
 * @param {Object} agreementData - Agreement data
 * @param {Array} messages - Conversation messages
 * @returns {number} Agreement ID
 */
async function saveAgreementToDatabase(agreementData, messages) {
  return new Promise((resolve, reject) => {
    // Save main agreement record
    db.run(`
      INSERT INTO client_agreements (
        user_id, customer_id, customer_name, customer_username, platform,
        agreement_confidence, agreement_trigger_message, agreement_keywords,
        phone_number, email_address, location, address,
        service_requested, service_description, budget_mentioned, price_agreed, timeline_mentioned,
        agreement_summary, conversation_summary, full_conversation_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      agreementData.user_id,
      agreementData.customer_id,
      agreementData.customer_name,
      agreementData.customer_username,
      agreementData.platform,
      agreementData.agreement_confidence,
      agreementData.agreement_trigger_message,
      JSON.stringify(agreementData.agreement_keywords),
      agreementData.phone_number,
      agreementData.email_address,
      agreementData.location,
      agreementData.address,
      agreementData.service_requested,
      agreementData.service_description,
      agreementData.budget_mentioned,
      agreementData.price_agreed,
      agreementData.timeline_mentioned,
      agreementData.agreement_summary,
      agreementData.conversation_summary,
      agreementData.full_conversation_json,
      agreementData.status
    ], function(err) {
      if (err) {
        reject(err);
        return;
      }

      const agreementId = this.lastID;

      // Save conversation messages
      if (messages && messages.length > 0) {
        const stmt = db.prepare(`
          INSERT INTO agreement_conversation_messages (
            agreement_id, message_index, sender_type, sender_name,
            message_text, message_timestamp, is_agreement_trigger
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        messages.forEach((message, index) => {
          const isCustomer = message.sender_type === 'customer' || 
                           message.from_user_id !== 'bot' && message.from_user_id !== 'claude_ai';
          
          stmt.run([
            agreementId,
            index,
            isCustomer ? 'customer' : 'ai',
            message.sender_name || message.from_name || (isCustomer ? 'Customer' : 'Assistant'),
            message.message_text || message.text || '',
            message.message_timestamp || message.date || new Date().toISOString(),
            (message.message_text || message.text || '') === agreementData.agreement_trigger_message ? 1 : 0
          ]);
        });

        stmt.finalize((finalizeErr) => {
          if (finalizeErr) {
            logger.logError(finalizeErr, { context: 'save-conversation-messages', agreementId });
          }
          resolve(agreementId);
        });
      } else {
        resolve(agreementId);
      }
    });
  });
}

/**
 * Quick agreement check for real-time processing
 * @param {string} messageText - Single message text
 * @returns {Object} Quick analysis result
 */
function quickAgreementCheck(messageText) {
  const text = messageText.toLowerCase();
  let confidence = 0;
  let keywords = [];

  // Check for direct agreement phrases
  const strongAgreementPhrases = [
    'yes', 'ok', 'okay', 'sure', 'deal', 'agreed', 'lets do it',
    "let's do it", 'i want', 'i agree', 'sounds good', 'perfect'
  ];

  for (const phrase of strongAgreementPhrases) {
    if (text.includes(phrase)) {
      keywords.push(phrase);
      confidence += 0.3;
    }
  }

  // Check for commitment indicators
  if (text.includes('when') && (text.includes('start') || text.includes('begin'))) {
    confidence += 0.4;
  }

  if (text.includes('how much') || text.includes('price') || text.includes('cost')) {
    confidence += 0.2;
  }

  return {
    hasAgreement: confidence > 0.5,
    confidence: Math.min(1.0, confidence),
    keywords
  };
}

module.exports = {
  detectAgreementFromConversation,
  quickAgreementCheck,
  analyzeMessageForAgreement,
  extractInformationFromMessage,
  generateAgreementSummaries
};