const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../services/logger');

// Store active bot listeners (in production, use database)
const activeBots = new Map();

// Setup webhook for a bot token
router.post('/setup', asyncHandler(async (req, res) => {
  const { botToken } = req.body;
  
  if (!botToken || !botToken.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Bot token is required'
    });
  }

  const token = botToken.trim();
  console.log('🔧 Setting up webhook for bot:', token.substring(0, 10) + '...');

  try {
    // Generate a unique listener ID for this bot
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // Create webhook URL for this specific bot
    const webhookUrl = `https://workflow-lg9z.onrender.com/api/telegram-listener/webhook/${listenerId}`;
    
    console.log('📡 Setting webhook URL:', webhookUrl);

    // Set webhook with Telegram
    const axios = require('axios');
    const telegramApiUrl = `https://api.telegram.org/bot${token}/setWebhook`;
    
    const response = await axios.post(telegramApiUrl, {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    });

    if (response.data.ok) {
      // Store the bot configuration
      activeBots.set(listenerId, {
        botToken: token,
        webhookUrl: webhookUrl,
        setupAt: new Date().toISOString(),
        lastActivity: null,
        messageCount: 0
      });

      console.log('✅ Webhook setup successful for listener:', listenerId);
      
      logger.info(`Telegram listener webhook setup successful`, {
        listenerId,
        webhookUrl,
        botTokenPrefix: token.substring(0, 10) + '...'
      });

      res.json({
        success: true,
        message: 'Webhook setup successful',
        listenerId: listenerId,
        webhookUrl: webhookUrl,
        botToken: token.substring(0, 10) + '...',
        telegramResponse: response.data
      });
    } else {
      console.error('❌ Telegram webhook setup failed:', response.data);
      res.status(400).json({
        success: false,
        error: 'Failed to setup webhook with Telegram',
        telegramError: response.data
      });
    }
  } catch (error) {
    console.error('❌ Error setting up webhook:', error.message);
    logger.logError(error, { context: 'telegram-listener-setup' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to setup webhook: ' + error.message
    });
  }
}));

// Delete webhook for a bot token
router.post('/delete', asyncHandler(async (req, res) => {
  const { botToken } = req.body;
  
  if (!botToken || !botToken.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Bot token is required'
    });
  }

  const token = botToken.trim();
  console.log('🗑️ Deleting webhook for bot:', token.substring(0, 10) + '...');

  try {
    // Delete webhook from Telegram
    const axios = require('axios');
    const telegramApiUrl = `https://api.telegram.org/bot${token}/deleteWebhook`;
    
    const response = await axios.post(telegramApiUrl);

    if (response.data.ok) {
      // Remove from active bots (find by token)
      let removedListenerId = null;
      for (const [listenerId, botData] of activeBots.entries()) {
        if (botData.botToken === token) {
          activeBots.delete(listenerId);
          removedListenerId = listenerId;
          break;
        }
      }

      console.log('✅ Webhook deleted successfully');
      
      logger.info(`Telegram listener webhook deleted`, {
        removedListenerId,
        botTokenPrefix: token.substring(0, 10) + '...'
      });

      res.json({
        success: true,
        message: 'Webhook deleted successfully',
        botToken: token.substring(0, 10) + '...',
        removedListenerId: removedListenerId,
        telegramResponse: response.data
      });
    } else {
      console.error('❌ Telegram webhook deletion failed:', response.data);
      res.status(400).json({
        success: false,
        error: 'Failed to delete webhook with Telegram',
        telegramError: response.data
      });
    }
  } catch (error) {
    console.error('❌ Error deleting webhook:', error.message);
    logger.logError(error, { context: 'telegram-listener-delete' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete webhook: ' + error.message
    });
  }
}));

// Webhook endpoint to receive messages from Telegram
router.post('/webhook/:listenerId', asyncHandler(async (req, res) => {
  const { listenerId } = req.params;
  const update = req.body;
  
  console.log(`📥 Telegram message received for listener: ${listenerId}`);
  console.log('📦 Update data:', JSON.stringify(update, null, 2));
  
  // Always respond to Telegram immediately
  res.status(200).json({ ok: true });
  
  try {
    // Validate update format
    if (!update || !update.message) {
      console.log('❌ Invalid Telegram update format - no message');
      return;
    }
    
    // Get bot configuration
    const botConfig = activeBots.get(listenerId);
    if (!botConfig) {
      console.log('❌ Bot configuration not found for listener:', listenerId);
      return;
    }
    
    // Update activity tracking
    botConfig.lastActivity = new Date().toISOString();
    botConfig.messageCount = (botConfig.messageCount || 0) + 1;
    
    const message = update.message;
    const chatId = message.chat.id;
    const messageText = message.text || '';
    const fromUser = message.from;
    
    // Log message details
    console.log('👤 From:', `${fromUser.first_name || ''} ${fromUser.last_name || ''}`.trim() || fromUser.username || `User ${fromUser.id}`);
    console.log('💬 Chat ID:', chatId);
    console.log('📝 Message:', messageText);
    console.log('🕐 Date:', new Date(message.date * 1000).toISOString());
    
    // Log to logger service
    logger.logTelegramEvent(`listener-${listenerId}`, 'message_received', {
      updateId: update.update_id,
      messageId: message.message_id,
      chatId: chatId,
      text: messageText,
      fromUserId: fromUser.id,
      fromUsername: fromUser.username,
      messageCount: botConfig.messageCount
    });
    
    // Here you can add more processing if needed
    // For now, just log that we received the message
    console.log(`✅ Message processed successfully for listener: ${listenerId}`);
    
  } catch (error) {
    console.error('❌ Error processing webhook message:', error.message);
    logger.logError(error, { 
      context: 'telegram-listener-webhook', 
      listenerId: listenerId,
      updatePreview: JSON.stringify(update).substring(0, 200) 
    });
  }
}));

// Get status of all active bot listeners
router.get('/status', (req, res) => {
  const listeners = Array.from(activeBots.entries()).map(([listenerId, botData]) => ({
    listenerId,
    botTokenPrefix: botData.botToken.substring(0, 10) + '...',
    webhookUrl: botData.webhookUrl,
    setupAt: botData.setupAt,
    lastActivity: botData.lastActivity,
    messageCount: botData.messageCount || 0
  }));

  res.json({
    success: true,
    activeListeners: listeners.length,
    listeners: listeners
  });
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Telegram Listener API is running',
    timestamp: new Date().toISOString(),
    activeListeners: activeBots.size
  });
});

module.exports = router;