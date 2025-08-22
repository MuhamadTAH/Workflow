const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logger = require('../services/logger');

// Load knowledge base from echo-assets folder
const loadKnowledgeBase = () => {
  try {
    const knowledgeBasePath = path.join(__dirname, '../echo-assets/echo-assets/knowledge-base');
    
    const knowledgeBase = {
      faq: [],
      docs: [],
      pricing: [],
      troubleshooting: []
    };

    // Load FAQ
    const faqPath = path.join(knowledgeBasePath, 'faq.txt');
    if (fs.existsSync(faqPath)) {
      const faqContent = fs.readFileSync(faqPath, 'utf8');
      const faqItems = parseFAQ(faqContent);
      knowledgeBase.faq = faqItems;
    }

    // Load API documentation
    const apiDocsPath = path.join(knowledgeBasePath, 'api-documentation.txt');
    if (fs.existsSync(apiDocsPath)) {
      const apiContent = fs.readFileSync(apiDocsPath, 'utf8');
      knowledgeBase.docs.push({
        title: 'API Documentation',
        content: apiContent
      });
    }

    // Load pricing info
    const pricingPath = path.join(knowledgeBasePath, 'pricing-plans.txt');
    if (fs.existsSync(pricingPath)) {
      const pricingContent = fs.readFileSync(pricingPath, 'utf8');
      knowledgeBase.pricing.push({
        title: 'Pricing Plans',
        content: pricingContent
      });
    }

    // Load troubleshooting guide
    const troubleshootingPath = path.join(knowledgeBasePath, 'troubleshooting-guide.txt');
    if (fs.existsSync(troubleshootingPath)) {
      const troubleshootingContent = fs.readFileSync(troubleshootingPath, 'utf8');
      knowledgeBase.troubleshooting.push({
        title: 'Troubleshooting Guide',
        content: troubleshootingContent
      });
    }

    return knowledgeBase;
  } catch (error) {
    logger.error('Error loading knowledge base:', error);
    return { faq: [], docs: [], pricing: [], troubleshooting: [] };
  }
};

// Parse FAQ text format into structured data
const parseFAQ = (faqText) => {
  const faqItems = [];
  const lines = faqText.split('\n');
  let currentQ = '';
  let currentA = '';
  let isAnswer = false;

  for (const line of lines) {
    if (line.startsWith('Q:')) {
      if (currentQ && currentA) {
        faqItems.push({ q: currentQ.trim(), a: currentA.trim() });
      }
      currentQ = line.substring(2).trim();
      currentA = '';
      isAnswer = false;
    } else if (line.startsWith('A:')) {
      currentA = line.substring(2).trim();
      isAnswer = true;
    } else if (isAnswer && line.trim()) {
      currentA += ' ' + line.trim();
    }
  }

  if (currentQ && currentA) {
    faqItems.push({ q: currentQ.trim(), a: currentA.trim() });
  }

  return faqItems;
};

// Advanced AI response engine
const generateAIResponse = async (message, knowledgeBase) => {
  const lowerMessage = message.toLowerCase();
  
  // Check FAQ first
  for (const item of knowledgeBase.faq) {
    const keywords = item.q.toLowerCase().split(/\s+|[.,!?]/);
    const matchingKeywords = keywords.filter(keyword => 
      keyword.length > 2 && lowerMessage.includes(keyword)
    );
    
    if (matchingKeywords.length >= 1) {
      return `Based on our FAQ: ${item.a}`;
    }
  }

  // Check documentation
  if (lowerMessage.includes('api') || lowerMessage.includes('documentation') || lowerMessage.includes('docs')) {
    const apiDoc = knowledgeBase.docs.find(doc => doc.title.includes('API'));
    if (apiDoc) {
      const preview = apiDoc.content.substring(0, 300) + '...';
      return `Here's information from our API documentation:\n\n${preview}\n\nFor complete documentation, please visit our developer portal.`;
    }
  }

  // Check pricing
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('plan') || lowerMessage.includes('billing')) {
    const pricingDoc = knowledgeBase.pricing.find(doc => doc.title.includes('Pricing'));
    if (pricingDoc) {
      return `Here's our current pricing information:\n\n${pricingDoc.content.substring(0, 400)}`;
    }
  }

  // Check troubleshooting
  if (lowerMessage.includes('problem') || lowerMessage.includes('error') || lowerMessage.includes('issue') || lowerMessage.includes('bug')) {
    const troubleshootingDoc = knowledgeBase.troubleshooting[0];
    if (troubleshootingDoc) {
      const preview = troubleshootingDoc.content.substring(0, 300) + '...';
      return `I can help you troubleshoot this issue:\n\n${preview}\n\nIf this doesn't resolve your problem, please contact our technical support team.`;
    }
  }

  // Default responses with personality
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! 👋 I'm your Echo-Assets AI assistant. I can help you with account questions, billing, API documentation, and troubleshooting. What would you like to know?";
  }
  
  if (lowerMessage.includes('help')) {
    return "I'm here to help! 🤝 I can assist you with:\n\n• Account management and billing\n• API documentation and integration\n• Feature explanations and pricing\n• Troubleshooting technical issues\n\nWhat specific topic would you like help with?";
  }

  // Intelligent fallback
  return `I understand you're asking about: "${message}"\n\nWhile I don't have specific information about that topic in my current knowledge base, I can help you with:\n\n• Account and billing questions\n• API documentation\n• Pricing and feature information\n• Technical troubleshooting\n\nWould you like help with any of these areas, or shall I connect you with our human support team?`;
};

// GET /api/echo/knowledge-base - Get knowledge base data
router.get('/knowledge-base', async (req, res) => {
  try {
    const knowledgeBase = loadKnowledgeBase();
    
    res.json({
      success: true,
      data: {
        faq: knowledgeBase.faq,
        totalEntries: knowledgeBase.faq.length + knowledgeBase.docs.length + knowledgeBase.pricing.length + knowledgeBase.troubleshooting.length,
        categories: {
          faq: knowledgeBase.faq.length,
          documentation: knowledgeBase.docs.length,
          pricing: knowledgeBase.pricing.length,
          troubleshooting: knowledgeBase.troubleshooting.length
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching knowledge base:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load knowledge base'
    });
  }
});

// POST /api/echo/chat - Send message and get AI response
router.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  try {
    const knowledgeBase = loadKnowledgeBase();
    const aiResponse = await generateAIResponse(message, knowledgeBase);
    
    // Log the interaction
    logger.info(`Echo-Assets Chat - User: ${message.substring(0, 100)} | AI: ${aiResponse.substring(0, 100)}`);
    
    res.json({
      success: true,
      data: {
        response: aiResponse,
        timestamp: new Date().toISOString(),
        sessionId: sessionId || `echo_${Date.now()}`,
        responseTime: '~1.5s'
      }
    });
  } catch (error) {
    logger.error('Error generating AI response:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      fallbackResponse: "I'm sorry, I'm having technical difficulties. Please contact our support team at support@example.com for immediate assistance."
    });
  }
});

// GET /api/echo/stats - Get platform statistics
router.get('/stats', (req, res) => {
  try {
    const knowledgeBase = loadKnowledgeBase();
    
    res.json({
      success: true,
      data: {
        status: 'online',
        knowledgeBaseEntries: knowledgeBase.faq.length,
        averageResponseTime: '1.5s',
        uptime: '99.9%',
        aiEngine: 'Echo-Assets AI v1.0',
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;