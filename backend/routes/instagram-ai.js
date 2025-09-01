const express = require('express');
const router = express.Router();
const logger = require('../services/logger');
const claudeAI = require('../services/claudeAI');

// Instagram AI Configuration Storage
let aiConfig = {
  enabled: false,
  systemPrompt: 'You are a helpful assistant responding to Instagram direct messages. Keep responses friendly, concise, and helpful. Always respond in a conversational tone.',
  knowledgeBase: '',
  autoReply: true,
  model: 'claude-3-sonnet-20240229',
  maxTokens: 1000,
  responseDelay: 2000 // 2 seconds delay before auto-reply
};

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

    const result = await claudeAI.sendMessage(
      message,
      aiConfig.systemPrompt,
      aiConfig.knowledgeBase
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
  getAIConfig: () => aiConfig
};