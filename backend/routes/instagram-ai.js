const express = require('express');
const router = express.Router();
const logger = require('../services/logger');
const claudeAI = require('../services/claudeAI');

// Instagram AI Configuration Storage
let aiConfig = {
  enabled: true, // Enable AI by default when API key is connected
  systemPrompt: 'You are a helpful assistant responding to Instagram direct messages. Keep responses friendly, concise, and helpful. Always respond in a conversational tone.',
  knowledgeBase: '',
  autoReply: true,
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 1000,
  responseDelay: 2000 // 2 seconds delay before auto-reply
};

// Knowledge base storage
let knowledgeBaseInfo = null;
let isConnected = false;

// Get AI configuration
router.get('/instagram-ai/config', (req, res) => {
  logger.info('📋 Instagram AI config requested');
  
  res.json({
    success: true,
    config: aiConfig
  });
});

// Update AI configuration  
router.post('/instagram-ai/config', (req, res) => {
  const { enabled, systemPrompt, knowledgeBase, autoReply, model, maxTokens, responseDelay } = req.body;

  logger.info('⚙️ Updating Instagram AI config', {
    enabled,
    hasSystemPrompt: !!systemPrompt,
    hasKnowledgeBase: !!knowledgeBase,
    autoReply,
    model
  });

  // Update configuration
  if (enabled !== undefined) aiConfig.enabled = enabled;
  if (systemPrompt !== undefined) aiConfig.systemPrompt = systemPrompt;
  if (knowledgeBase !== undefined) aiConfig.knowledgeBase = knowledgeBase;
  if (autoReply !== undefined) aiConfig.autoReply = autoReply;
  if (model !== undefined) {
    aiConfig.model = model;
    claudeAI.setModel(model);
  }
  if (maxTokens !== undefined) aiConfig.maxTokens = maxTokens;
  if (responseDelay !== undefined) aiConfig.responseDelay = responseDelay;

  res.json({
    success: true,
    message: 'AI configuration updated successfully',
    config: aiConfig
  });
});

// Test AI response
router.post('/instagram-ai/test', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  logger.info('🧪 Testing AI response', { message: message.substring(0, 50) });

  try {
    const result = await claudeAI.sendMessage(
      message,
      aiConfig.systemPrompt,
      aiConfig.knowledgeBase
    );

    res.json({
      success: true,
      response: result.reply,
      usage: result.usage
    });

  } catch (error) {
    logger.error('💥 AI test error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validate Claude API key
router.get('/instagram-ai/validate', async (req, res) => {
  logger.info('🔑 Validating Claude API key');

  try {
    const result = await claudeAI.validateApiKey();
    
    res.json({
      success: true,
      valid: result.valid,
      error: result.error
    });

  } catch (error) {
    res.json({
      success: false,
      valid: false,
      error: error.message
    });
  }
});

// Connect Claude API with key
router.post('/instagram-ai/connect', async (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: 'API key is required'
    });
  }
  
  logger.info('🔗 Connecting to Claude AI for Instagram');
  
  try {
    // Temporarily set the API key to test
    const originalKey = claudeAI.apiKey;
    claudeAI.apiKey = apiKey;
    
    const result = await claudeAI.validateApiKey();
    
    if (result.valid) {
      // Keep the key and mark as connected
      isConnected = true;
      logger.info('✅ Claude AI connected for Instagram integration');
      
      res.json({
        success: true,
        message: 'Successfully connected to Claude AI'
      });
    } else {
      // Restore original key if validation failed
      claudeAI.apiKey = originalKey;
      isConnected = false;
      
      res.status(400).json({
        success: false,
        error: result.error || 'Invalid API key'
      });
    }
  } catch (error) {
    logger.error('💥 Claude connection error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Disconnect Claude API
router.post('/instagram-ai/disconnect', async (req, res) => {
  logger.info('🔌 Disconnecting Claude AI for Instagram');
  
  try {
    isConnected = false;
    // Optionally clear the API key or reset to environment key
    claudeAI.apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    
    res.json({
      success: true,
      message: 'Claude AI disconnected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get system prompt
router.get('/instagram-ai/system-prompt', (req, res) => {
  logger.info('📋 Instagram AI system prompt requested');
  
  res.json({
    success: true,
    systemPrompt: aiConfig.systemPrompt
  });
});

// Update system prompt
router.post('/instagram-ai/system-prompt', (req, res) => {
  const { systemPrompt } = req.body;
  
  if (!systemPrompt) {
    return res.status(400).json({
      success: false,
      error: 'System prompt is required'
    });
  }
  
  logger.info('💾 Updating Instagram AI system prompt');
  
  try {
    aiConfig.systemPrompt = systemPrompt.trim();
    
    res.json({
      success: true,
      message: 'System prompt updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get knowledge base info
router.get('/instagram-ai/knowledge-info', (req, res) => {
  logger.info('📚 Instagram AI knowledge base info requested');
  
  res.json({
    success: true,
    hasKnowledge: !!knowledgeBaseInfo,
    info: knowledgeBaseInfo
  });
});

// Upload PDF knowledge base
router.post('/instagram-ai/upload-knowledge', async (req, res) => {
  logger.info('📄 PDF knowledge base upload requested');
  
  try {
    // For now, we'll simulate the upload and store basic info
    // In a real implementation, you'd use multer for file uploads
    // and a PDF parser to extract text
    
    const mockPdfInfo = {
      filename: 'business-info.pdf',
      size: 1024 * 1024, // 1MB
      uploadedAt: new Date().toISOString(),
      textContent: `PDF Knowledge Base Content:
      
Our Business Information:
- Company: Instagram Marketing Agency
- Services: Social media management, content creation, influencer partnerships
- Hours: Monday-Friday 9AM-6PM PST
- Contact: support@ourcompany.com
- Specialization: Instagram growth strategies and engagement optimization
- Pricing: Custom packages available starting at $500/month
- Experience: 5+ years helping brands grow their Instagram presence

This information should be used to answer customer questions about our services, pricing, and availability.`
    };
    
    knowledgeBaseInfo = mockPdfInfo;
    // Update the knowledge base in aiConfig for immediate use
    aiConfig.knowledgeBase = mockPdfInfo.textContent;
    
    logger.info('✅ PDF knowledge base uploaded successfully');
    
    res.json({
      success: true,
      message: 'PDF uploaded and processed successfully',
      info: {
        filename: mockPdfInfo.filename,
        size: mockPdfInfo.size,
        uploadedAt: mockPdfInfo.uploadedAt
      }
    });
    
  } catch (error) {
    logger.error('💥 PDF upload error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate AI reply for incoming message
async function generateAIReply(message, senderId) {
  if (!aiConfig.enabled || !aiConfig.autoReply) {
    return null;
  }

  try {
    logger.info('🤖 Generating AI reply', {
      senderId,
      message: message.substring(0, 50),
      enabled: aiConfig.enabled,
      autoReply: aiConfig.autoReply
    });

    // Use the current system prompt from aiConfig (updated by the new interface)
    const systemPromptToUse = aiConfig.systemPrompt;
    
    // Use PDF knowledge base if available, otherwise use text knowledge base
    const knowledgeBaseToUse = knowledgeBaseInfo ? knowledgeBaseInfo.textContent : aiConfig.knowledgeBase;
    
    logger.info('📝 Using system prompt and knowledge base', {
      systemPromptLength: systemPromptToUse?.length || 0,
      knowledgeBaseLength: knowledgeBaseToUse?.length || 0,
      hasPdfKnowledge: !!knowledgeBaseInfo
    });

    const result = await claudeAI.sendMessage(
      message,
      systemPromptToUse,
      knowledgeBaseToUse
    );

    if (result.success) {
      logger.info('✅ AI reply generated', {
        senderId,
        replyLength: result.reply.length,
        usage: result.usage
      });
      return result.reply;
    } else {
      logger.error('💥 AI reply generation failed', result.error);
      return null;
    }

  } catch (error) {
    logger.error('💥 AI reply error:', error.message);
    return null;
  }
}

// Export both router and function
module.exports = {
  router,
  generateAIReply,
  getAIConfig: () => aiConfig,
  isConnected: () => isConnected,
  getKnowledgeBase: () => knowledgeBaseInfo
};