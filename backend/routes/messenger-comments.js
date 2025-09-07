const express = require('express');
const router = express.Router();
const logger = require('../services/logger');
const db = require('../db');
const { generateAIReply, getAIConfig, handleMessageBatch } = require('./messenger-ai');

// Simple auth function for development
const authenticateUser = (req, res, next) => {
  req.user = { id: 1 }; // Default to user ID 1 for development
  next();
};

// Database helper functions
const getUserIdFromToken = (req) => {
  return req.user?.id || 1; // Default to user ID 1 for testing
};

// Save Messenger bot configuration to database
const saveBotToDatabase = async (userId, appId, appSecret, accessToken, pageId, webhookToken, webhookUrl) => {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT OR REPLACE INTO messenger_comment_bots 
      (user_id, app_id, app_secret, access_token, page_id, webhook_token, webhook_url, setup_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 1)
    `, [userId, appId, appSecret, accessToken, pageId, webhookToken, webhookUrl], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Get Messenger bot configuration from database
const getBotFromDatabase = async (userId) => {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT * FROM messenger_comment_bots 
      WHERE user_id = ? AND is_active = 1
    `, [userId], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Save Messenger message to database
const saveMessageToDatabase = async (userId, messageData) => {
  return new Promise((resolve, reject) => {
    db.run(`
      INSERT INTO messenger_comment_messages 
      (user_id, messenger_message_id, messenger_user_id, messenger_name, messenger_first_name, 
       messenger_last_name, profile_pic, message_text, message_type, post_id, comment_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      messageData.id,
      messageData.from?.id,
      messageData.from?.name,
      messageData.from?.first_name,
      messageData.from?.last_name,
      messageData.from?.profile_pic,
      messageData.text,
      messageData.type || 'message',
      messageData.post_id,
      messageData.comment_id,
      new Date().toISOString()
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Get messages from database
const getMessagesFromDatabase = async (userId, limit = 50) => {
  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM messenger_comment_messages 
      WHERE user_id = ? 
      ORDER BY received_at DESC 
      LIMIT ?
    `, [userId, limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Update bot activity
const updateBotActivity = async (userId) => {
  return new Promise((resolve, reject) => {
    db.run(`
      UPDATE messenger_comment_bots 
      SET last_activity = datetime('now'), message_count = message_count + 1, updated_at = datetime('now')
      WHERE user_id = ?
    `, [userId], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Function to fetch Messenger user info
async function fetchUserInfo(userId) {
  try {
    const ACCESS_TOKEN = 'EAALAZC7uBACYBPQZCU17YxWX1z8FnSqN7DhcX3oIZAUGrBk4rO9J2nDsJ0Ta7IZBL9QzX0B8wo2F1CGAZBmCJywwA1cgSgWUEv7LupNM3ZAMAfFSQzjQSMzy8g7ZBTa7BfWZAXZBes6Gxzq0siduMn0VEbAgZALqZBZCKxAYuxfQTA8JfAQOQLUt4wqZAdee8oz1LGpURswYB0NhPSgZDZD';
    
    logger.info('👤 Fetching user info for:', { userId });
    
    const response = await fetch(`https://graph.facebook.com/v21.0/${userId}?fields=id,name,first_name,last_name,profile_pic&access_token=${ACCESS_TOKEN}`);
    const data = await response.json();
    
    if (response.ok && data.id) {
      messengerUsers[userId] = {
        id: data.id,
        name: data.name || 'Messenger User',
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        profile_pic: data.profile_pic || null,
        fetchedAt: new Date().toISOString()
      };
      
      logger.info('✅ User info fetched:', { 
        userId, 
        name: messengerUsers[userId].name
      });
    } else {
      // Fallback if API fails
      messengerUsers[userId] = {
        id: userId,
        name: 'Messenger User',
        first_name: '',
        last_name: '',
        profile_pic: null,
        fetchedAt: new Date().toISOString(),
        failed: true
      };
      
      logger.warn('⚠️ Failed to fetch user info, using fallback:', { userId, error: data });
    }
  } catch (error) {
    logger.error('💥 Error fetching user info:', { userId, error: error.message });
    
    // Fallback user data
    messengerUsers[userId] = {
      id: userId,
      name: 'Messenger User',
      first_name: '',
      last_name: '',
      profile_pic: null,
      fetchedAt: new Date().toISOString(),
      error: true
    };
  }
}

// Helper function to send Messenger reply (used by both manual replies and AI auto-replies)
async function sendMessengerReply(senderId, replyText, isAIReply = false) {
  try {
    const ACCESS_TOKEN = 'EAALAZC7uBACYBPQZCU17YxWX1z8FnSqN7DhcX3oIZAUGrBk4rO9J2nDsJ0Ta7IZBL9QzX0B8wo2F1CGAZBmCJywwA1cgSgWUEv7LupNM3ZAMAfFSQzjQSMzy8g7ZBTa7BfWZAXZBes6Gxzq0siduMn0VEbAgZALqZBZCKxAYuxfQTA8JfAQOQLUt4wqZAdee8oz1LGpURswYB0NhPSgZDZD';
    
    // Get recipient ID from stored messages
    const recipientId = messengerMessages.length > 0 ? messengerMessages[0].recipient?.id : 'me';
    
    logger.info(`${isAIReply ? '🤖' : '📤'} Sending Messenger ${isAIReply ? 'AI auto-' : ''}reply`, { 
      senderId, 
      recipientId,
      replyText: replyText.substring(0, 50) + '...',
      isAI: isAIReply
    });

    // Send reply using Facebook Graph API (KEY CHANGE: facebook.com instead of instagram.com)
    const response = await fetch(`https://graph.facebook.com/v23.0/${recipientId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient: {
          id: senderId
        },
        message: {
          text: replyText
        }
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      logger.info(`✅ Messenger ${isAIReply ? 'AI auto-' : ''}reply sent successfully!`, { 
        senderId, 
        messageId: data.message_id,
        isAI: isAIReply
      });

      // Store the sent message
      const sentMessage = {
        id: data.message_id || `sent_${Date.now()}`,
        text: replyText,
        sender: { id: 'me' },
        recipient: { id: senderId },
        timestamp: new Date().toISOString(),
        isOutgoing: true,
        isAIReply: isAIReply,
        messageId: data.message_id
      };
      
      // Save sent message to database
      try {
        const userId = 1; // Default user ID for development
        await saveMessageToDatabase(userId, {
          id: sentMessage.id,
          from: { id: 'me', name: 'Messenger Bot' },
          text: sentMessage.text,
          type: 'sent_message',
          post_id: null,
          comment_id: null
        });
        
        logger.info('✅ Sent message saved to database', { 
          messageId: data.message_id,
          recipientId: senderId,
          isAIReply: isAIReply
        });
      } catch (dbError) {
        logger.error('💥 Error saving sent message to database:', dbError);
      }

      return { success: true, messageId: data.message_id };
    } else {
      logger.error(`❌ Messenger ${isAIReply ? 'AI auto-' : ''}reply failed`, { error: data });
      return { success: false, error: data.error?.message || 'Failed to send reply' };
    }
  } catch (error) {
    logger.error(`💥 Messenger ${isAIReply ? 'AI auto-' : ''}reply error`, { error: error.message });
    return { success: false, error: error.message };
  }
}

// Messenger webhook endpoint (handles both GET verification and POST messages)
router.all('/webhooks/messenger/comments', async (req, res) => {
  logger.info('🔥 MESSENGER WEBHOOK RECEIVED!', {
    method: req.method,
    query: req.query,
    hasBody: !!req.body,
    timestamp: new Date().toISOString()
  });

  // Handle GET verification (like Facebook webhook verification)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('🔍 GET verification request:', { mode, token, challenge });

    // Verify the token matches what you set in Facebook
    if (mode === 'subscribe' && token === 'muhammad') {
      logger.info('✅ Webhook verified successfully!');
      return res.status(200).send(challenge);
    } else {
      logger.warn('❌ Webhook verification failed!');
      return res.status(403).send('Forbidden');
    }
  }

  // Handle POST webhook data
  if (req.method === 'POST') {
    const body = req.body;
    
    logger.info('📨 POST webhook data received:', {
      hasEntry: !!body.entry,
      entryCount: body.entry ? body.entry.length : 0,
      fullBody: JSON.stringify(body, null, 2)
    });

    // Process messages (fixed async handling - using for...of instead of forEach)
    if (body.entry && body.entry.length > 0) {
      for (const entry of body.entry) {
        logger.info('📝 Processing entry:', {
          id: entry.id,
          hasMessaging: !!entry.messaging,
          messagingCount: entry.messaging ? entry.messaging.length : 0
        });

        if (entry.messaging) {
          for (const messaging of entry.messaging) {
            try {
              logger.info('💬 Processing messaging event:', {
              sender: messaging.sender?.id,
              recipient: messaging.recipient?.id,
              hasMessage: !!messaging.message,
              messageText: messaging.message?.text,
              hasRead: !!messaging.read,
              hasDelivery: !!messaging.delivery,
              isEcho: messaging.message?.is_echo
            });

            // Skip non-message events (read receipts, delivery confirmations, etc.)
            if (!messaging.message || !messaging.message.text) {
              logger.info('🔄 Skipping non-message event (read receipt/delivery/etc.)');
              return;
            }

            const senderId = messaging.sender?.id;
            
            // Fetch user info if we don't have it
            if (senderId && !messengerUsers[senderId]) {
              await fetchUserInfo(senderId);
            }

            const messageData = {
              id: messaging.message?.mid || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              text: messaging.message?.text || '',
              sender: {
                id: messaging.sender?.id
              },
              recipient: {
                id: messaging.recipient?.id
              },
              timestamp: messaging.timestamp ? new Date(messaging.timestamp).toISOString() : new Date().toISOString(),
              isIncoming: true,
              messageId: messaging.message?.mid,
              isEcho: messaging.message?.is_echo
            };

            // Save message to database instead of memory array
            try {
              const userId = 1; // Default user ID for development
              await saveMessageToDatabase(userId, {
                id: messageData.id,
                from: messageData.sender,
                text: messageData.text,
                type: 'messenger_dm',
                post_id: null,
                comment_id: null
              });
              
              // Update bot activity
              await updateBotActivity(userId);
              
              // Trigger AI auto-reply for incoming messages (not echoes)
              if (messageData.text && !messaging.message?.is_echo && senderId !== 'me') {
                const aiConfig = getAIConfig();
                if (aiConfig.enabled && aiConfig.autoReply) {
                  logger.info('🤖 Adding message to batch for AI processing', {
                    senderId,
                    message: messageData.text.substring(0, 50),
                    batchDelay: '5 seconds'
                  });
                  
                  // Use message batching system (5-second delay)
                  handleMessageBatch(senderId, messageData.text, generateAIReply, sendMessengerReply);
                }
              }
              
              logger.info('✅ Messenger DM stored to database successfully!', { 
                messageId: messageData.id,
                senderId: messageData.sender.id,
                text: messageData.text ? messageData.text.substring(0, 50) + '...' : 'No text',
                userId: userId
              });
            } catch (dbError) {
              logger.error('💥 Error saving message to database:', dbError);
            }
            } catch (error) {
              logger.error('💥 Error processing messaging event:', {
                error: error.message,
                senderId: messaging.sender?.id,
                messageText: messaging.message?.text
              });
            }
          }
        }
      }
    }

    return res.status(200).send('EVENT_RECEIVED');
  }
});

// Test endpoint to check if POST works
router.post('/webhooks/messenger/test', (req, res) => {
  logger.info('🧪 TEST POST RECEIVED!', {
    body: JSON.stringify(req.body, null, 2),
    headers: req.headers
  });
  res.json({ success: true, message: 'Test received!' });
});

// Messenger webhook state
let webhookState = {
  isWaitingForCall: false,
  hasReceivedCall: false,
  activatedAt: null,
  firstCallAt: null
};

// Get webhook status
router.get('/messenger/status', authenticateUser, async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const botConfig = await getBotFromDatabase(userId);
    const messages = await getMessagesFromDatabase(userId);
    
    // Get unique users from messages
    const users = {};
    messages.forEach(msg => {
      if (msg.messenger_user_id && !users[msg.messenger_user_id]) {
        users[msg.messenger_user_id] = {
          id: msg.messenger_user_id,
          name: msg.messenger_name,
          first_name: msg.messenger_first_name,
          last_name: msg.messenger_last_name,
          profile_pic: msg.profile_pic
        };
      }
    });
    
    logger.info('📊 Messenger webhook status requested', { userId, hasBotConfig: !!botConfig });
    
    res.json({
      success: true,
      status: {
        ...webhookState,
        isActive: !!botConfig,
        botConfigured: !!botConfig
      },
      config: botConfig ? {
        app_id: botConfig.app_id,
        page_id: botConfig.page_id,
        webhook_url: botConfig.webhook_url,
        setup_at: botConfig.setup_at
      } : null,
      messages: messages,
      users: users,
      messageCount: messages.length,
      userCount: Object.keys(users).length
    });
  } catch (error) {
    logger.error('Error getting Messenger status:', error);
    res.status(500).json({ success: false, error: 'Failed to get status' });
  }
});

// Activate webhook (start waiting)
router.post('/messenger/activate', authenticateUser, async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { appId, appSecret, accessToken, pageId, webhookToken = 'muhammad' } = req.body;
    
    logger.info('🚀 Activating Messenger webhook', { userId, appId, pageId });

    // Validate required fields
    if (!appId || !appSecret || !accessToken || !pageId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: appId, appSecret, accessToken, pageId'
      });
    }

    const webhookUrl = `${process.env.BASE_URL || 'https://workflow-lg9z.onrender.com'}/api/webhooks/messenger/comments`;
    
    // Save configuration to database
    await saveBotToDatabase(userId, appId, appSecret, accessToken, pageId, webhookToken, webhookUrl);
    
    webhookState.isWaitingForCall = true;
    webhookState.hasReceivedCall = false;
    webhookState.activatedAt = new Date().toISOString();
    
    logger.info('✅ Messenger bot configuration saved and waiting for webhook call');
    
    res.json({
      success: true,
      message: 'Messenger bot configured and webhook receiver activated',
      status: {
        ...webhookState,
        botConfigured: true
      },
      instructions: {
        webhookUrl: webhookUrl,
        verifyToken: webhookToken,
        nextStep: 'Add this URL and token to your Meta Developer Console'
      }
    });
  } catch (error) {
    logger.error('Error activating Messenger webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to activate webhook' });
  }
});

// Get messages
router.get('/messenger/messages', authenticateUser, async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const messages = await getMessagesFromDatabase(userId);
    
    logger.info('💬 Messenger messages requested', { userId, count: messages.length });
    
    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.messenger_message_id,
        text: msg.message_text,
        timestamp: msg.timestamp,
        from: {
          id: msg.messenger_user_id,
          name: msg.messenger_name,
          first_name: msg.messenger_first_name,
          last_name: msg.messenger_last_name,
          profile_pic: msg.profile_pic
        },
        type: msg.message_type,
        post_id: msg.post_id,
        comment_id: msg.comment_id,
        is_replied: msg.is_replied,
        reply_text: msg.reply_text,
        replied_at: msg.replied_at
      })),
      totalCount: messages.length
    });
  } catch (error) {
    logger.error('Error getting Messenger messages:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
});

// Get users
router.get('/messenger/users', authenticateUser, async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const messages = await getMessagesFromDatabase(userId);
    
    // Get unique users from messages
    const users = {};
    messages.forEach(msg => {
      if (msg.messenger_user_id && !users[msg.messenger_user_id]) {
        users[msg.messenger_user_id] = {
          id: msg.messenger_user_id,
          name: msg.messenger_name,
          first_name: msg.messenger_first_name,
          last_name: msg.messenger_last_name,
          profile_pic: msg.profile_pic
        };
      }
    });
    
    logger.info('👥 Messenger users requested', { userId, count: Object.keys(users).length });
    
    res.json({
      success: true,
      users: users,
      totalCount: Object.keys(users).length
    });
  } catch (error) {
    logger.error('Error getting Messenger users:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

// Manual reply endpoint
router.post('/messenger/reply', authenticateUser, async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { senderId, replyText } = req.body;
    
    logger.info('📤 Manual Messenger reply requested', { senderId, replyText });

    if (!senderId || !replyText) {
      return res.status(400).json({
        success: false,
        error: 'Missing senderId or replyText'
      });
    }

    const result = await sendMessengerReply(senderId, replyText, false);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Manual reply sent successfully!',
        data: {
          senderId,
          replyText,
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    logger.error('💥 Manual reply error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Load saved Messenger configurations
router.get('/messenger/config', authenticateUser, async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const botConfig = await getBotFromDatabase(userId);
    
    logger.info('Loading Messenger configuration', { userId, hasBotConfig: !!botConfig });
    
    res.json({
      success: true,
      config: botConfig ? {
        appId: botConfig.app_id,
        appSecret: botConfig.app_secret ? '***hidden***' : '',
        accessToken: botConfig.access_token ? '***hidden***' : '',
        pageId: botConfig.page_id,
        webhookToken: botConfig.webhook_token,
        webhookUrl: botConfig.webhook_url,
        isActive: botConfig.is_active,
        setupAt: botConfig.setup_at
      } : null
    });
  } catch (error) {
    logger.error('Error loading Messenger configuration:', error);
    res.status(500).json({ success: false, error: 'Failed to load configuration' });
  }
});

// Save Messenger AI configuration
router.post('/messenger/ai-config', authenticateUser, async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    const { claudeApiKey, openaiApiKey, aiProvider = 'claude', model, systemPrompt, autoReply = false } = req.body;
    
    logger.info('Saving Messenger AI configuration', { userId, aiProvider, autoReply });
    
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO messenger_ai_configs 
        (user_id, claude_api_key, openai_api_key, ai_provider, model, system_prompt, auto_reply, 
         connection_status, last_used, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'connected', datetime('now'), datetime('now'))
      `, [userId, claudeApiKey, openaiApiKey, aiProvider, model, systemPrompt, autoReply], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    res.json({
      success: true,
      message: 'AI configuration saved successfully'
    });
  } catch (error) {
    logger.error('Error saving Messenger AI configuration:', error);
    res.status(500).json({ success: false, error: 'Failed to save AI configuration' });
  }
});

// Get Messenger AI configuration
router.get('/messenger/ai-config', authenticateUser, async (req, res) => {
  try {
    const userId = getUserIdFromToken(req);
    
    const aiConfig = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM messenger_ai_configs 
        WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    logger.info('Loading Messenger AI configuration', { userId, hasAIConfig: !!aiConfig });
    
    res.json({
      success: true,
      config: aiConfig ? {
        aiProvider: aiConfig.ai_provider,
        model: aiConfig.model,
        systemPrompt: aiConfig.system_prompt,
        autoReply: aiConfig.auto_reply,
        connectionStatus: aiConfig.connection_status,
        hasClaudeKey: !!aiConfig.claude_api_key,
        hasOpenAIKey: !!aiConfig.openai_api_key
      } : null
    });
  } catch (error) {
    logger.error('Error loading Messenger AI configuration:', error);
    res.status(500).json({ success: false, error: 'Failed to load AI configuration' });
  }
});

module.exports = router;