const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../services/logger');

// Store active bot listeners (in production, use database)
const activeBots = new Map();

// Store messages for each listener (in production, use database)
const listenerMessages = new Map();

// Import Claude configs from claude.js
const { claudeConfigs, systemPrompts, knowledgeBase } = require('./claude');

// Function to send message to Claude and get response using aiService for consistency
const sendMessageToClaude = async (messageText, userId = 'default_user') => {
  try {
    // Get Claude configuration for this user
    const claudeConfig = claudeConfigs.get(userId);
    if (!claudeConfig || !claudeConfig.apiKey) {
      console.log('❌ No Claude API configuration found for user:', userId);
      return null;
    }

    // Get system prompt for this user
    const systemPromptData = systemPrompts.get(userId);
    let systemPrompt = systemPromptData?.prompt || 'You are a helpful and friendly AI assistant. Respond to users in a professional yet warm manner.';
    
    // Get knowledge base for this user
    const knowledge = knowledgeBase.get(userId);
    
    console.log('🎭 Using system prompt:', systemPrompt.substring(0, 50) + '...');
    console.log('🔍 Debug - Knowledge Base Check:');
    console.log('  - knowledgeBase size:', knowledgeBase.size);
    console.log('  - Available keys:', Array.from(knowledgeBase.keys()));
    console.log('  - Looking for userId:', userId);
    console.log('  - Knowledge found:', !!knowledge);
    
    if (knowledge) {
      console.log('📚 Using knowledge base:', knowledge.filename, `(${knowledge.textLength} chars)`);
      console.log('📄 Knowledge preview:', knowledge.extractedText.substring(0, 200) + '...');
      
      // Add knowledge base to system prompt
      systemPrompt += `\n\nIMPORTANT - You have access to this business knowledge base:\n\n`;
      systemPrompt += `--- BUSINESS KNOWLEDGE BASE ---\n${knowledge.extractedText}\n--- END KNOWLEDGE BASE ---\n\n`;
      systemPrompt += `INSTRUCTIONS: When users ask questions about the business (hours, services, location, contact info, policies, etc.), use the information from the knowledge base above. This is YOUR business information. Answer as if you represent this business and have full access to this information.`;
    } else {
      console.log('❌ No knowledge base found for user:', userId);
    }
    
    console.log('🔤 Final system prompt length:', systemPrompt.length);
    console.log('🔤 System prompt preview:', systemPrompt.substring(0, 300) + '...');
    
    // Use the aiService for consistency with workflow builder
    const { callClaudeApi } = require('../services/aiService');
    
    const aiRequest = {
      model: claudeConfig.model || 'claude-3-5-sonnet-20241022',
      apiKey: claudeConfig.apiKey,
      systemPrompt: systemPrompt,
      userMessage: messageText
    };

    console.log('🚀 Using aiService.callClaudeApi for consistency with workflow builder');
    const aiResponse = await callClaudeApi(aiRequest);
    
    // Update last used time
    claudeConfig.lastUsed = new Date().toISOString();
    
    return aiResponse;
  } catch (error) {
    console.error('❌ Error sending message to Claude:', error.message);
    return null;
  }
};

// Function to send message back to Telegram user
const sendTelegramMessage = async (botToken, chatId, text) => {
  try {
    const axios = require('axios');
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await axios.post(telegramApiUrl, {
      chat_id: chatId,
      text: text
    });

    return response.data.ok;
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error.message);
    return false;
  }
};

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
    const fromName = `${fromUser.first_name || ''} ${fromUser.last_name || ''}`.trim() || 'Unknown';
    
    // Log message details
    console.log('👤 From:', fromName);
    console.log('💬 Chat ID:', chatId);
    console.log('📝 Message:', messageText);
    console.log('🕐 Date:', new Date(message.date * 1000).toISOString());
    
    // Store message for this listener
    if (!listenerMessages.has(listenerId)) {
      listenerMessages.set(listenerId, []);
    }
    
    const messageData = {
      updateId: update.update_id,
      messageId: message.message_id,
      chatId: chatId,
      text: messageText,
      fromUserId: fromUser.id,
      fromName: fromName,
      fromUsername: fromUser.username,
      date: new Date(message.date * 1000).toISOString(),
      timestamp: new Date().toISOString(),
      type: message.text ? 'text' : 'other'
    };
    
    const messages = listenerMessages.get(listenerId);
    messages.unshift(messageData); // Add to beginning (newest first)
    
    // Keep only last 100 messages per listener
    if (messages.length > 100) {
      messages.splice(100);
    }
    
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
    
    console.log(`✅ Message stored and processed successfully for listener: ${listenerId}`);
    
    // 🤖 CLAUDE AI INTEGRATION - Process message with AI and auto-respond
    if (messageText && messageText.trim()) {
      console.log('🤖 Processing message with Claude AI...');
      
      // Send message to Claude AI
      const claudeResponse = await sendMessageToClaude(messageText, 'default_user');
      
      if (claudeResponse) {
        console.log('✅ Claude response received:', claudeResponse.substring(0, 100) + '...');
        
        // Send Claude's response back to user
        const messageSent = await sendTelegramMessage(botConfig.botToken, chatId, claudeResponse);
        
        if (messageSent) {
          console.log('✅ Auto-response sent to Telegram user');
          
          // Store Claude's response as a bot message in the conversation
          const claudeMessageData = {
            updateId: 'claude_' + Date.now(),
            messageId: Date.now(),
            chatId: chatId,
            text: claudeResponse,
            fromUserId: 'bot',
            fromName: 'Claude AI',
            fromUsername: 'claude_ai',
            date: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            type: 'bot_message',
            isBotMessage: true
          };
          
          // Add Claude's response to the messages list
          const messages = listenerMessages.get(listenerId);
          if (messages) {
            messages.unshift(claudeMessageData); // Add to beginning (newest first)
            
            // Keep only last 100 messages per listener
            if (messages.length > 100) {
              messages.splice(100);
            }
          }
          
          console.log('✅ Claude response stored in conversation panel');
        } else {
          console.log('❌ Failed to send auto-response to Telegram');
        }
      } else {
        console.log('❌ No response from Claude AI - user message processed without AI response');
      }
    }
    
  } catch (error) {
    console.error('❌ Error processing webhook message:', error.message);
    logger.logError(error, { 
      context: 'telegram-listener-webhook', 
      listenerId: listenerId,
      updatePreview: JSON.stringify(update).substring(0, 200) 
    });
  }
}));

// Get messages for a specific listener
router.get('/messages/:listenerId', (req, res) => {
  const { listenerId } = req.params;
  
  try {
    const messages = listenerMessages.get(listenerId) || [];
    const botConfig = activeBots.get(listenerId);
    
    res.json({
      success: true,
      listenerId: listenerId,
      messages: messages,
      totalMessages: messages.length,
      botActive: !!botConfig,
      lastActivity: botConfig?.lastActivity || null
    });
  } catch (error) {
    console.error('❌ Error fetching messages:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
      message: error.message
    });
  }
});

// Send message endpoint
router.post('/send-message', asyncHandler(async (req, res) => {
  const { botToken, chatId, text } = req.body;
  
  if (!botToken || !chatId || !text) {
    return res.status(400).json({
      success: false,
      error: 'botToken, chatId, and text are required'
    });
  }

  console.log('📤 Sending message via Telegram API:', {
    botTokenPrefix: botToken.substring(0, 10) + '...',
    chatId: chatId,
    textLength: text.length
  });

  try {
    // Send message using Telegram Bot API
    const axios = require('axios');
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await axios.post(telegramApiUrl, {
      chat_id: chatId,
      text: text
    });

    if (response.data.ok) {
      console.log('✅ Message sent successfully:', {
        messageId: response.data.result.message_id,
        chatId: response.data.result.chat.id
      });

      // Find the listener ID for this bot token
      let targetListenerId = null;
      console.log('🔍 Looking for listener with bot token:', botToken.substring(0, 10) + '...');
      console.log('🔍 Active bots:', Array.from(activeBots.entries()).map(([id, data]) => ({
        listenerId: id,
        botTokenPrefix: data.botToken.substring(0, 10) + '...'
      })));
      
      for (const [listenerId, botData] of activeBots.entries()) {
        if (botData.botToken === botToken) {
          targetListenerId = listenerId;
          console.log('✅ Found matching listener:', listenerId);
          break;
        }
      }

      // Store the sent message as a bot message
      if (targetListenerId) {
        console.log('💾 Storing sent message for listener:', targetListenerId);
        if (!listenerMessages.has(targetListenerId)) {
          listenerMessages.set(targetListenerId, []);
        }
        
        const sentMessageData = {
          updateId: 'sent_' + Date.now(),
          messageId: response.data.result.message_id,
          chatId: response.data.result.chat.id,
          text: text,
          fromUserId: 'bot',
          fromName: 'Bot',
          fromUsername: 'workflow_bot',
          date: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          type: 'bot_message',
          isBotMessage: true
        };
        
        const messages = listenerMessages.get(targetListenerId);
        messages.unshift(sentMessageData); // Add to beginning (newest first)
        
        // Keep only last 100 messages per listener
        if (messages.length > 100) {
          messages.splice(100);
        }
        
        console.log('💾 Stored sent message as bot message for listener:', targetListenerId);
        console.log('📊 Total messages for this listener:', messages.length);
      } else {
        console.log('❌ No matching listener found for bot token:', botToken.substring(0, 10) + '...');
      }

      logger.info(`Telegram message sent successfully`, {
        chatId: chatId,
        messageId: response.data.result.message_id,
        botTokenPrefix: botToken.substring(0, 10) + '...'
      });

      res.json({
        success: true,
        message: 'Message sent successfully',
        telegramResponse: response.data.result
      });
    } else {
      console.error('❌ Telegram API error:', response.data);
      res.status(400).json({
        success: false,
        error: 'Failed to send message via Telegram API',
        telegramError: response.data
      });
    }
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    logger.logError(error, { context: 'telegram-send-message' });
    
    res.status(500).json({
      success: false,
      error: 'Failed to send message: ' + error.message
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