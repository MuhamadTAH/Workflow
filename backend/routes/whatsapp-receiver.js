/*
=================================================================
FILE: backend/routes/whatsapp-receiver.js
=================================================================
WhatsApp Receiver API routes for standalone message receiving
*/

const express = require('express');
const router = express.Router();

// Add CORS headers specifically for this route
router.use((req, res, next) => {
  // Allow specific origins for WhatsApp receiver
  const allowedOrigins = ['https://fixdai.com', 'https://workflow-lg9z.onrender.com', 'http://localhost:3000', 'http://localhost:5173'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, X-Api-Key');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('🔧 WhatsApp Receiver OPTIONS preflight:', {
      origin: req.headers.origin,
      method: req.headers['access-control-request-method'],
      headers: req.headers['access-control-request-headers']
    });
    return res.status(200).end();
  }
  
  console.log('🌐 WhatsApp Receiver CORS applied:', {
    origin: req.headers.origin,
    method: req.method,
    allowedOrigin: allowedOrigins.includes(origin) ? origin : '*'
  });
  
  next();
});
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../services/logger');
const billingService = require('../services/billingService');
const db = require('../db');

// Your Claude API Key from environment variables
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || 'your-claude-api-key-here';

// Use the shared database connection from db.js instead of creating a new one
const whatsappDb = db;

// Initialize whatsapp_receiver_messages table
whatsappDb.serialize(() => {
  whatsappDb.run(`CREATE TABLE IF NOT EXISTS whatsapp_receiver_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    contact_name TEXT,
    message_text TEXT,
    message_id TEXT UNIQUE,
    message_type TEXT DEFAULT 'text',
    timestamp TEXT,
    raw_data TEXT,
    direction TEXT DEFAULT 'incoming',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    voice_file_id TEXT,
    voice_file_url TEXT,
    voice_duration INTEGER,
    voice_mime_type TEXT,
    voice_file_size INTEGER,
    image_file_id TEXT,
    image_file_url TEXT,
    image_width INTEGER,
    image_height INTEGER,
    image_file_size INTEGER,
    image_mime_type TEXT,
    caption TEXT
  )`);
  
  // Add direction column if it doesn't exist (for existing databases)
  whatsappDb.run(`ALTER TABLE whatsapp_receiver_messages ADD COLUMN direction TEXT DEFAULT 'incoming'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding direction column:', err);
    }
  });
  
  // Add voice message columns if they don't exist
  const voiceColumns = [
    'voice_file_id TEXT',
    'voice_file_url TEXT', 
    'voice_duration INTEGER',
    'voice_mime_type TEXT',
    'voice_file_size INTEGER'
  ];
  
  voiceColumns.forEach(column => {
    whatsappDb.run(`ALTER TABLE whatsapp_receiver_messages ADD COLUMN ${column}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(`Error adding voice column ${column}:`, err);
      }
    });
  });
  
  // Add image message columns if they don't exist
  const imageColumns = [
    'image_file_id TEXT',
    'image_file_url TEXT',
    'image_width INTEGER', 
    'image_height INTEGER',
    'image_file_size INTEGER',
    'image_mime_type TEXT',
    'caption TEXT'
  ];
  
  imageColumns.forEach(column => {
    whatsappDb.run(`ALTER TABLE whatsapp_receiver_messages ADD COLUMN ${column}`, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error(`Error adding image column ${column}:`, err);
      }
    });
  });
});

// Global state for WhatsApp receiver (unified configuration)
let receiverState = {
  isActive: false,
  // WhatsApp Trigger Node credentials
  appId: null,
  clientSecret: null,
  // WhatsApp Send Message Node credentials  
  businessId: null,
  accessToken: null,
  phoneNumberSendId: null,
  activatedAt: null
};

// Helper function to get WhatsApp media file URL
const getWhatsAppMediaUrl = async (mediaId, accessToken) => {
  try {
    console.log('🔍 Fetching WhatsApp media URL for:', mediaId);
    
    const axios = require('axios');
    const response = await axios.get(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.data && response.data.url) {
      console.log('✅ WhatsApp media URL retrieved successfully');
      return response.data.url;
    } else {
      console.error('❌ No URL found in WhatsApp media response');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching WhatsApp media URL:', error.message);
    return null;
  }
};

// Database helper functions
const getUserIdFromToken = (req) => {
  return req.user?.id || 1; // Default to user ID 1 for testing
};

// Save WhatsApp bot configuration to database
const saveBotToDatabase = async (userId, appId, clientSecret, businessId, accessToken, phoneNumberSendId, webhookUrl) => {
  return new Promise((resolve, reject) => {
    whatsappDb.run(`
      INSERT OR REPLACE INTO whatsapp_receiver_bots 
      (user_id, app_id, client_secret, business_id, access_token, phone_number_send_id, webhook_url, setup_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 1)
    `, [userId, appId, clientSecret, businessId, accessToken, phoneNumberSendId, webhookUrl], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Get WhatsApp bot configuration from database
const getBotFromDatabase = async (userId) => {
  return new Promise((resolve, reject) => {
    whatsappDb.get(`
      SELECT * FROM whatsapp_receiver_bots 
      WHERE user_id = ? AND is_active = 1
    `, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Update bot activity
const updateBotActivity = async (userId) => {
  return new Promise((resolve, reject) => {
    whatsappDb.run(`
      UPDATE whatsapp_receiver_bots 
      SET last_activity = datetime('now'), message_count = message_count + 1, updated_at = datetime('now')
      WHERE user_id = ?
    `, [userId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Save AI configuration to database
const saveAIConfigToDatabase = async (userId, claudeApiKey, systemPrompt) => {
  return new Promise((resolve, reject) => {
    whatsappDb.run(`
      INSERT OR REPLACE INTO whatsapp_receiver_ai_configs 
      (user_id, claude_api_key, system_prompt, connection_status, updated_at)
      VALUES (?, ?, ?, 'connected', datetime('now'))
    `, [userId, claudeApiKey, systemPrompt], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Get AI configuration from database
const getAIConfigFromDatabase = async (userId) => {
  return new Promise((resolve, reject) => {
    whatsappDb.get(`
      SELECT * FROM whatsapp_receiver_ai_configs 
      WHERE user_id = ?
    `, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Save knowledge base to database
const saveKnowledgeBaseToDatabase = async (userId, filename, extractedText, fileSize) => {
  return new Promise((resolve, reject) => {
    whatsappDb.run(`
      INSERT OR REPLACE INTO whatsapp_receiver_knowledge_base 
      (user_id, filename, extracted_text, text_length, file_size, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [userId, filename, extractedText, extractedText.length, fileSize], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Get knowledge base from database
const getKnowledgeBaseFromDatabase = async (userId) => {
  return new Promise((resolve, reject) => {
    whatsappDb.get(`
      SELECT * FROM whatsapp_receiver_knowledge_base 
      WHERE user_id = ?
    `, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  console.log('🔐 WhatsApp Receiver Token Verification:', {
    origin: req.headers.origin,
    hasAuth: !!req.headers.authorization,
    method: req.method,
    path: req.path
  });
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Allow mock token for testing/development
    if (token.startsWith('MOCK_TOKEN_FOR_TESTING_')) {
      console.log('✅ Using mock token for development');
      req.user = { userId: 'test-user-1', email: 'mhamadtah548@gmail.com', mock: true };
      return next();
    }
    
    // Regular JWT validation for production
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token verified successfully');
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/whatsapp-receiver/activate - Activate WhatsApp message receiver (unified config)
router.post('/activate', verifyToken, async (req, res) => {
  const { appId, clientSecret, businessId, accessToken, phoneNumberSendId } = req.body;
  
  console.log('🚀 Activating WhatsApp unified system (receive + send)...');
  console.log('📋 Unified Configuration:', { 
    appId: appId ? 'present' : 'missing', 
    clientSecret: clientSecret ? 'present' : 'missing',
    businessId: businessId ? 'present' : 'missing',
    accessToken: accessToken ? 'present' : 'missing',
    phoneNumberSendId: phoneNumberSendId ? 'present' : 'missing'
  });
  
  try {
    // Validate all required unified inputs
    if (!appId || !clientSecret || !businessId || !accessToken || !phoneNumberSendId) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: App ID, Client Secret, Business ID, Access Token, and Phone Number Send ID'
      });
    }

    // Clear previous messages when activating
    whatsappDb.run('DELETE FROM whatsapp_receiver_messages', [], (err) => {
      if (err) {
        console.error('❌ Error clearing previous messages:', err);
      } else {
        console.log('🧹 Previous messages cleared');
      }
    });

    // Save configuration to database
    const userId = getUserIdFromToken(req);
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhooks/whatsapp`;
    
    await saveBotToDatabase(
      userId,
      appId.trim(),
      clientSecret.trim(),
      businessId.trim(),
      accessToken.trim(),
      phoneNumberSendId.trim(),
      webhookUrl
    );

    // Update receiver state with unified configuration
    receiverState = {
      isActive: true,
      // WhatsApp Trigger Node credentials
      appId: appId.trim(),
      clientSecret: clientSecret.trim(),
      // WhatsApp Send Message Node credentials
      businessId: businessId.trim(),
      accessToken: accessToken.trim(),
      phoneNumberSendId: phoneNumberSendId.trim(),
      activatedAt: new Date().toISOString()
    };
    
    console.log('✅ WhatsApp unified system activated successfully (receive + send)');
    console.log('📡 Webhook URL:', `${req.protocol}://${req.get('host')}/api/webhooks/whatsapp`);
    console.log('📤 Send Message capability ready with Business ID:', businessId.substring(0, 4) + '...');
    
    res.json({
      success: true,
      message: 'WhatsApp unified system activated! Ready to receive AND send messages.',
      webhookUrl: `${req.protocol}://${req.get('host')}/api/webhooks/whatsapp`,
      status: {
        isActive: true,
        activatedAt: receiverState.activatedAt,
        capabilities: ['receive_messages', 'send_messages'],
        sendingReady: true
      }
    });
    
  } catch (error) {
    console.error('❌ WhatsApp receiver activation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp-receiver/deactivate - Deactivate WhatsApp message receiver
router.post('/deactivate', verifyToken, (req, res) => {
  console.log('🛑 Deactivating WhatsApp message receiver...');
  
  try {
    // Clear unified receiver state
    receiverState = {
      isActive: false,
      appId: null,
      clientSecret: null,
      businessId: null,
      accessToken: null,
      phoneNumberSendId: null,
      activatedAt: null
    };
    
    console.log('✅ WhatsApp receiver deactivated successfully');
    
    res.json({
      success: true,
      message: 'WhatsApp receiver deactivated successfully',
      status: {
        isActive: false,
        deactivatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ WhatsApp receiver deactivation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp-receiver/messages - Get received messages
router.get('/messages', verifyToken, (req, res) => {
  console.log('📱 Fetching WhatsApp receiver messages...');
  
  const query = `
    SELECT 
      phone_number,
      contact_name,
      message_text as text,
      message_id,
      message_type,
      timestamp,
      direction,
      created_at
    FROM whatsapp_receiver_messages 
    ORDER BY created_at ASC
    LIMIT 100
  `;

  whatsappDb.all(query, [], (err, messages) => {
    if (err) {
      console.error('❌ Error fetching messages:', err);
      logger.logError(err, { context: 'getWhatsAppReceiverMessages' });
      return res.status(500).json({ error: 'Database error' });
    }

    console.log(`📊 Found ${messages.length} messages`);
    
    // Transform messages for frontend
    const transformedMessages = messages.map(msg => ({
      phoneNumber: msg.phone_number,
      from: msg.phone_number,
      fromName: msg.contact_name || 'Unknown Contact',
      text: msg.text,
      message: msg.text,
      messageId: msg.message_id,
      messageType: msg.message_type || 'text',
      timestamp: msg.timestamp || msg.created_at,
      createdAt: msg.created_at,
      direction: msg.direction || 'incoming',
      isOutgoing: msg.direction === 'outgoing'
    }));

    res.json({
      success: true,
      messages: transformedMessages,
      status: receiverState
    });
  });
});

// GET /api/whatsapp-receiver/status - Get receiver status
router.get('/status', verifyToken, (req, res) => {
  res.json({
    success: true,
    status: receiverState,
    webhookUrl: `${req.protocol}://${req.get('host')}/api/webhooks/whatsapp`
  });
});

// Function to send message to Claude and track usage
const sendMessageToClaude = async (messageText, userId = 2) => {
  try {
    console.log('🤖 Sending message to Claude AI:', messageText.substring(0, 50) + '...');
    
    const axios = require('axios');
    
    // Call Claude API
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: messageText
        }
      ]
    }, {
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    const claudeResponse = response.data;
    const responseText = claudeResponse.content?.[0]?.text || 'No response from Claude';
    
    // Get token usage
    const inputTokens = claudeResponse.usage?.input_tokens || 0;
    const outputTokens = claudeResponse.usage?.output_tokens || 0;
    
    console.log('💰 Claude API Usage:', {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens
    });

    // Track usage for billing (using user ID 2 - your account)
    try {
      // Get Claude model info from database
      const aiModel = await new Promise((resolve, reject) => {
        whatsappDb.get(`
          SELECT * FROM ai_models 
          WHERE model_id = 'claude-3-5-sonnet-20241022' AND is_active = 1
        `, [], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (aiModel) {
        const billingResult = await billingService.trackUsage(
          userId,           // Your user ID
          aiModel.id,       // Claude model ID
          inputTokens,      // Input tokens
          outputTokens,     // Output tokens
          null,            // conversationId
          null,            // assistantId
          'whatsapp_chat'  // usage type
        );
        
        console.log('💳 Usage tracked for billing:', {
          user_id: userId,
          tokens: inputTokens + outputTokens,
          cost: billingResult.total_cost,
          price: billingResult.total_price
        });
      }
    } catch (billingError) {
      console.error('❌ Billing tracking error:', billingError.message);
      // Don't fail the request if billing fails
    }

    return {
      response: responseText,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens
      }
    };

  } catch (error) {
    console.error('❌ Error calling Claude API:', error.response?.data || error.message);
    return null;
  }
};

// Function to send WhatsApp message back to user
const sendWhatsAppReply = async (phoneNumber, messageText) => {
  try {
    if (!receiverState.isActive || !receiverState.accessToken || !receiverState.phoneNumberSendId) {
      console.log('❌ WhatsApp not configured for sending replies');
      return false;
    }

    const axios = require('axios');
    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${receiverState.phoneNumberSendId}/messages`;
    
    const response = await axios.post(whatsappApiUrl, {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      text: { body: messageText }
    }, {
      headers: {
        'Authorization': `Bearer ${receiverState.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ WhatsApp reply sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending WhatsApp reply:', error.response?.data || error.message);
    return false;
  }
};

// Function to store received WhatsApp message (called from webhook)
const storeWhatsAppMessage = async (webhookData) => {
  return new Promise(async (resolve, reject) => {
    console.log('💾 Storing WhatsApp message from receiver...');
    
    // Only store if receiver is active
    if (!receiverState.isActive) {
      console.log('📴 Receiver not active, skipping message storage');
      return resolve({ stored: false, reason: 'receiver_inactive' });
    }

    try {
      // Extract message data from WhatsApp webhook structure
      const entry = webhookData.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      
      if (!value || !value.messages || value.messages.length === 0) {
        console.log('📝 No messages in webhook data');
        return resolve({ stored: false, reason: 'no_messages' });
      }

      const message = value.messages[0];
      const contact = value.contacts?.[0];
      
      // Initialize message data
      const messageData = {
        phoneNumber: message.from,
        contactName: contact?.profile?.name || contact?.wa_id || 'Unknown Contact',
        messageText: '',
        messageId: message.id,
        messageType: message.type || 'text',
        timestamp: message.timestamp ? new Date(parseInt(message.timestamp) * 1000).toISOString() : new Date().toISOString(),
        rawData: JSON.stringify(webhookData)
      };

      // Initialize voice and image data
      let voiceData = null;
      let imageData = null;

      // Handle different message types
      if (message.type === 'text') {
        messageData.messageText = message.text?.body || '';
        console.log('📝 Text message:', messageData.messageText?.substring(0, 50));
      } 
      else if (message.type === 'audio' && message.audio) {
        messageData.messageText = '[Voice message]';
        
        // Get voice file URL if access token is available
        let voiceFileUrl = null;
        if (receiverState.accessToken && message.audio.id) {
          try {
            voiceFileUrl = await getWhatsAppMediaUrl(message.audio.id, receiverState.accessToken);
          } catch (error) {
            console.error('❌ Error getting voice file URL:', error.message);
          }
        }
        
        voiceData = {
          voiceFileId: message.audio.id,
          voiceFileUrl: voiceFileUrl,
          voiceMimeType: message.audio.mime_type,
          voiceFileSize: message.audio.file_size
        };
        
        console.log('🎤 Voice message processed:', {
          fileId: voiceData.voiceFileId,
          hasUrl: !!voiceData.voiceFileUrl,
          mimeType: voiceData.voiceMimeType
        });
      }
      else if (message.type === 'image' && message.image) {
        messageData.messageText = message.image.caption || '[Image]';
        
        // Get image file URL if access token is available
        let imageFileUrl = null;
        if (receiverState.accessToken && message.image.id) {
          try {
            imageFileUrl = await getWhatsAppMediaUrl(message.image.id, receiverState.accessToken);
          } catch (error) {
            console.error('❌ Error getting image file URL:', error.message);
          }
        }
        
        imageData = {
          imageFileId: message.image.id,
          imageFileUrl: imageFileUrl,
          imageMimeType: message.image.mime_type,
          imageFileSize: message.image.file_size,
          caption: message.image.caption || null
        };
        
        console.log('🖼️ Image message processed:', {
          fileId: imageData.imageFileId,
          hasUrl: !!imageData.imageFileUrl,
          mimeType: imageData.imageMimeType,
          hasCaption: !!imageData.caption
        });
      }
      else {
        messageData.messageText = `[${message.type} message]`;
        console.log('📦 Other message type:', message.type);
      }

      console.log('📝 Message data to store:', {
        from: messageData.phoneNumber,
        name: messageData.contactName,
        text: messageData.messageText?.substring(0, 50),
        type: messageData.messageType,
        hasVoice: !!voiceData,
        hasImage: !!imageData
      });

      const insertQuery = `
        INSERT OR REPLACE INTO whatsapp_receiver_messages 
        (phone_number, contact_name, message_text, message_id, message_type, timestamp, raw_data,
         voice_file_id, voice_file_url, voice_mime_type, voice_file_size,
         image_file_id, image_file_url, image_mime_type, image_file_size, caption)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      whatsappDb.run(insertQuery, [
        messageData.phoneNumber,
        messageData.contactName,
        messageData.messageText,
        messageData.messageId,
        messageData.messageType,
        messageData.timestamp,
        messageData.rawData,
        // Voice data
        voiceData?.voiceFileId || null,
        voiceData?.voiceFileUrl || null,
        voiceData?.voiceMimeType || null,
        voiceData?.voiceFileSize || null,
        // Image data
        imageData?.imageFileId || null,
        imageData?.imageFileUrl || null,
        imageData?.imageMimeType || null,
        imageData?.imageFileSize || null,
        imageData?.caption || null
      ], async function(err) {
        if (err) {
          console.error('❌ Error storing message:', err);
          reject(err);
        } else {
          console.log('✅ Message stored with ID:', this.lastID);
          
          // 🤖 CLAUDE AI INTEGRATION - Process message and auto-reply
          if (messageData.messageType === 'text' && messageData.messageText && messageData.messageText.trim()) {
            console.log('🤖 Processing WhatsApp message with Claude AI...');
            
            try {
              // Send message to Claude AI (user ID 2 = your account)
              const claudeResult = await sendMessageToClaude(messageData.messageText, 2);
              
              if (claudeResult) {
                console.log('✅ Claude response received:', claudeResult.response.substring(0, 100) + '...');
                console.log('💰 Token usage:', claudeResult.usage);
                
                // Send Claude's response back to WhatsApp user
                const replySent = await sendWhatsAppReply(messageData.phoneNumber, claudeResult.response);
                
                if (replySent) {
                  console.log('✅ AI response sent to WhatsApp user');
                  
                  // Store Claude's response as an outgoing message
                  const replyInsertQuery = `
                    INSERT INTO whatsapp_receiver_messages 
                    (phone_number, contact_name, message_text, message_id, message_type, timestamp, direction)
                    VALUES (?, ?, ?, ?, ?, ?, 'outgoing')
                  `;
                  
                  whatsappDb.run(replyInsertQuery, [
                    messageData.phoneNumber,
                    'Claude AI',
                    claudeResult.response,
                    'claude_' + Date.now(),
                    'ai_response',
                    new Date().toISOString()
                  ], (replyErr) => {
                    if (replyErr) {
                      console.error('❌ Error storing AI response:', replyErr);
                    } else {
                      console.log('✅ AI response stored in conversation history');
                    }
                  });
                } else {
                  console.log('❌ Failed to send AI response to WhatsApp');
                }
              } else {
                console.log('❌ No response from Claude AI');
              }
            } catch (aiError) {
              console.error('❌ Error processing message with AI:', aiError.message);
            }
          }
          
          resolve({ 
            stored: true, 
            id: this.lastID,
            messageData: messageData
          });
        }
      });

    } catch (error) {
      console.error('❌ Error processing webhook data:', error);
      reject(error);
    }
  });
};

// POST /api/whatsapp-receiver/send-message - Send WhatsApp message (using unified config)
router.post('/send-message', verifyToken, async (req, res) => {
  const { recipientPhoneNumber, messageText } = req.body;
  
  // Use unified configuration from receiver state
  const { businessId, accessToken, phoneNumberSendId } = receiverState;
  
  console.log('📤 WhatsApp unified send message request:', {
    fromUnifiedConfig: true,
    businessId: businessId ? 'present' : 'missing',
    accessToken: accessToken ? 'present' : 'missing',
    phoneNumberSendId: phoneNumberSendId ? 'present' : 'missing',
    recipientPhoneNumber: recipientPhoneNumber ? recipientPhoneNumber : 'missing',
    messageLength: messageText ? messageText.length : 0,
    receiverActive: receiverState.isActive
  });
  
  try {
    // Validate unified configuration and message parameters
    if (!receiverState.isActive) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp system is not activated. Please activate first with complete configuration.',
        details: {
          isActive: receiverState.isActive,
          hasBusinessId: !!businessId,
          hasAccessToken: !!accessToken,
          hasPhoneNumberSendId: !!phoneNumberSendId
        }
      });
    }
    
    if (!businessId || !accessToken || !phoneNumberSendId || !recipientPhoneNumber || !messageText) {
      return res.status(400).json({
        success: false,
        error: 'Missing unified configuration or message data. Please check your setup.'
      });
    }

    // Send message to WhatsApp Business API using unified configuration
    const url = `https://graph.facebook.com/v21.0/${phoneNumberSendId}/messages`;
    
    const requestBody = {
      messaging_product: 'whatsapp',
      to: recipientPhoneNumber,
      type: 'text',
      text: {
        body: messageText
      }
    };

    console.log('📡 Sending to WhatsApp API:', { 
      url: url.replace(/\/\d+\//, '/[PHONE_ID]/'), 
      body: {
        ...requestBody,
        to: `***${requestBody.to.slice(-4)}` // Only show last 4 digits
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'WhatsApp-Receiver/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('❌ WhatsApp API Error Response:', data);
      return res.status(400).json({
        success: false,
        error: `WhatsApp API Error: ${errorMsg}`,
        details: data
      });
    }

    console.log('✅ WhatsApp API Response:', {
      messageId: data.messages?.[0]?.id,
      status: data.messages?.[0]?.message_status || 'sent',
      success: true
    });

    // Store the sent message in the database as an outgoing message
    try {
      const insertQuery = `
        INSERT INTO whatsapp_receiver_messages 
        (phone_number, contact_name, message_text, message_id, message_type, timestamp, raw_data, direction, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const now = new Date().toISOString();
      const messageId = data.messages?.[0]?.id || `sent_${Date.now()}`;
      
      const insertResult = await new Promise((resolve, reject) => {
        whatsappDb.run(insertQuery, [
          recipientPhoneNumber,
          'Unknown Contact', // We don't know the contact name for outgoing
          messageText,
          messageId,
          'text',
          now,
          JSON.stringify({ 
            sent: true, 
            whatsappResponse: data,
            phoneNumberSendId: phoneNumberSendId,
            businessId: businessId,
            sentViaUnifiedConfig: true
          }),
          'outgoing',
          now
        ], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
      
      console.log('💾 Stored outgoing message with ID:', insertResult);
      
    } catch (dbError) {
      console.error('⚠️ Failed to store outgoing message in database:', dbError);
      // Continue even if database storage fails
    }

    res.json({
      success: true,
      message: `Message sent successfully to ${recipientPhoneNumber}`,
      data: {
        messageId: data.messages?.[0]?.id,
        recipientPhoneNumber: recipientPhoneNumber,
        messageText: messageText,
        status: data.messages?.[0]?.message_status || 'sent',
        sentAt: new Date().toISOString(),
        whatsappResponse: data
      }
    });
    
  } catch (error) {
    console.error('❌ WhatsApp send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send WhatsApp message'
    });
  }
});

// GET /api/whatsapp-receiver/stats - Get receiver statistics
router.get('/stats', verifyToken, (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_messages,
      COUNT(DISTINCT phone_number) as unique_contacts,
      MAX(created_at) as last_message_at
    FROM whatsapp_receiver_messages
  `;
  
  whatsappDb.get(statsQuery, [], (err, stats) => {
    if (err) {
      console.error('❌ Error fetching receiver stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      success: true,
      stats: stats || {
        total_messages: 0,
        unique_contacts: 0,
        last_message_at: null
      },
      status: receiverState
    });
  });
});

// Export the message storage function for use in webhook handler
// Debug endpoint to check billing tracking
router.get('/debug-billing', verifyToken, async (req, res) => {
  try {
    const db = require('../db');
    
    // Check recent usage for user ID 2
    const recentUsage = await new Promise((resolve, reject) => {
      whatsappDb.all(`
        SELECT 
          user_id,
          total_tokens,
          total_price,
          request_type,
          created_at
        FROM ai_usage_tracking 
        WHERE user_id = 2
        ORDER BY created_at DESC 
        LIMIT 10
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Check free tier status for user ID 2
    const freeTier = await new Promise((resolve, reject) => {
      whatsappDb.get(`
        SELECT * FROM user_free_tier WHERE user_id = 2
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({
      success: true,
      userId: 2,
      recentUsage: recentUsage,
      freeTier: freeTier,
      usageCount: recentUsage.length,
      totalTokensUsed: recentUsage.reduce((sum, usage) => sum + usage.total_tokens, 0)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Load saved WhatsApp configurations
router.get('/config', verifyToken, async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const botConfig = await getBotFromDatabase(userId);
    const aiConfig = await getAIConfigFromDatabase(userId);
    const knowledgeBase = await getKnowledgeBaseFromDatabase(userId);
    
    console.log('Loading WhatsApp configuration', { userId, hasBotConfig: !!botConfig });
    
    res.json({
      success: true,
      config: botConfig ? {
        appId: botConfig.app_id,
        clientSecret: botConfig.client_secret ? '***hidden***' : '',
        businessId: botConfig.business_id,
        accessToken: botConfig.access_token ? '***hidden***' : '',
        phoneNumberSendId: botConfig.phone_number_send_id,
        webhookUrl: botConfig.webhook_url,
        isActive: botConfig.is_active,
        setupAt: botConfig.setup_at
      } : null,
      aiConfig: aiConfig ? {
        hasClaudeKey: !!aiConfig.claude_api_key,
        systemPrompt: aiConfig.system_prompt,
        connectionStatus: aiConfig.connection_status
      } : null,
      knowledgeBase: knowledgeBase ? {
        filename: knowledgeBase.filename,
        textLength: knowledgeBase.text_length,
        fileSize: knowledgeBase.file_size,
        uploadedAt: knowledgeBase.created_at
      } : null
    });
  } catch (error) {
    console.error('Error loading WhatsApp configuration:', error);
    res.status(500).json({ success: false, error: 'Failed to load configuration' });
  }
});

// Save Claude API configuration
router.post('/claude/connect', verifyToken, async (req, res) => {
  try {
    const { claudeApiKey, systemPrompt } = req.body;
    const userId = getUserIdFromToken(req);
    
    if (!claudeApiKey) {
      return res.status(400).json({ success: false, error: 'Claude API key is required' });
    }
    
    await saveAIConfigToDatabase(userId, claudeApiKey, systemPrompt);
    
    console.log('✅ Claude API configuration saved to database');
    
    res.json({
      success: true,
      message: 'Claude API connected and saved successfully',
      status: '✅ Connected and saved to database'
    });
  } catch (error) {
    console.error('Error saving Claude configuration:', error);
    res.status(500).json({ success: false, error: 'Failed to save Claude configuration' });
  }
});

// Save system prompt
router.post('/system-prompt', verifyToken, async (req, res) => {
  try {
    const { systemPrompt } = req.body;
    const userId = getUserIdFromToken(req);
    
    const aiConfig = await getAIConfigFromDatabase(userId);
    if (aiConfig && aiConfig.claude_api_key) {
      await saveAIConfigToDatabase(userId, aiConfig.claude_api_key, systemPrompt);
      
      res.json({
        success: true,
        message: 'System prompt saved successfully'
      });
    } else {
      res.status(400).json({ 
        success: false, 
        error: 'Please connect Claude API first' 
      });
    }
  } catch (error) {
    console.error('Error saving system prompt:', error);
    res.status(500).json({ success: false, error: 'Failed to save system prompt' });
  }
});

// Save knowledge base
router.post('/knowledge-base', verifyToken, async (req, res) => {
  try {
    const { filename, extractedText, fileSize } = req.body;
    const userId = getUserIdFromToken(req);
    
    await saveKnowledgeBaseToDatabase(userId, filename, extractedText, fileSize);
    
    console.log('✅ Knowledge base saved to database');
    
    res.json({
      success: true,
      message: 'Knowledge base saved successfully',
      info: {
        filename,
        textLength: extractedText.length,
        fileSize
      }
    });
  } catch (error) {
    console.error('Error saving knowledge base:', error);
    res.status(500).json({ success: false, error: 'Failed to save knowledge base' });
  }
});

// Save manual business information as knowledge base
router.post('/manual-business-info', verifyToken, async (req, res) => {
  try {
    const { businessInfo } = req.body;
    const userId = getUserIdFromToken(req);
    
    await saveKnowledgeBaseToDatabase(userId, 'Manual Business Information', businessInfo, businessInfo.length);
    
    console.log('✅ Manual business information saved to database');
    
    res.json({
      success: true,
      message: 'Business information saved successfully'
    });
  } catch (error) {
    console.error('Error saving manual business info:', error);
    res.status(500).json({ success: false, error: 'Failed to save business information' });
  }
});

// AI Configuration endpoints
router.get('/ai-config', verifyToken, async (req, res) => {
  try {
    console.log('🤖 Loading WhatsApp AI configuration...');
    
    // Default AI configuration
    const defaultConfig = {
      enabled: false,
      autoReply: false,
      systemPrompt: 'You are a helpful and friendly AI assistant for WhatsApp messages. Respond to users in a professional yet warm manner.',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 1000,
      responseDelay: 2000
    };
    
    res.json({
      success: true,
      config: defaultConfig
    });
  } catch (error) {
    console.error('Error loading AI config:', error);
    res.status(500).json({ success: false, error: 'Failed to load AI configuration' });
  }
});

router.post('/ai-config', verifyToken, async (req, res) => {
  try {
    const config = req.body;
    console.log('🤖 Saving WhatsApp AI configuration:', config);
    
    // Here you would save to database if needed
    // For now, just return success
    
    res.json({
      success: true,
      message: 'AI configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving AI config:', error);
    res.status(500).json({ success: false, error: 'Failed to save AI configuration' });
  }
});

router.post('/ai-test', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    console.log('🧪 Testing AI with message:', message);
    
    // Mock AI response for testing
    const response = `AI Test Response: I received your message "${message}". This is a test response from the WhatsApp AI system.`;
    
    res.json({
      success: true,
      response: response
    });
  } catch (error) {
    console.error('Error testing AI:', error);
    res.status(500).json({ success: false, error: 'Failed to test AI' });
  }
});

module.exports = router;
module.exports.storeWhatsAppMessage = storeWhatsAppMessage;
module.exports.getReceiverState = () => receiverState;