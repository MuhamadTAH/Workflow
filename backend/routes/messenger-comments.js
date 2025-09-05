const express = require('express');
const router = express.Router();
const logger = require('../services/logger');
const { generateAIReply, getAIConfig, handleMessageBatch } = require('./messenger-ai');

// Store for Messenger DM data
let messengerMessages = [];
// Store for Messenger user profiles
let messengerUsers = {};

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
      
      // Check for duplicates and store
      const isDuplicate = messengerMessages.some(existingMsg => 
        existingMsg.id === sentMessage.id ||
        (existingMsg.text === sentMessage.text && 
         existingMsg.sender?.id === 'me' &&
         existingMsg.recipient?.id === senderId &&
         Math.abs(new Date(existingMsg.timestamp) - new Date(sentMessage.timestamp)) < 30000)
      );
      
      if (!isDuplicate) {
        messengerMessages.push(sentMessage);
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

            // Check for duplicates
            const isDuplicate = messengerMessages.some(existingMsg => 
              existingMsg.id === messageData.id ||
              existingMsg.messageId === messageData.messageId ||
              (existingMsg.text === messageData.text && 
               existingMsg.sender?.id === messageData.sender?.id &&
               Math.abs(new Date(existingMsg.timestamp) - new Date(messageData.timestamp)) < 30000)
            );

            if (!isDuplicate) {
              messengerMessages.push(messageData);
              
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
            } else {
              logger.info('🔄 Duplicate message detected, skipping:', { 
                messageId: messageData.id,
                text: messageData.text?.substring(0, 50),
                senderId: messageData.sender?.id
              });
            }
            logger.info('✅ Messenger DM stored successfully!', { 
              messageId: messageData.id,
              senderId: messageData.sender.id,
              text: messageData.text ? messageData.text.substring(0, 50) + '...' : 'No text',
              totalMessages: messengerMessages.length
            });
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
router.get('/messenger/status', (req, res) => {
  logger.info('📊 Messenger webhook status requested');
  res.json({
    success: true,
    status: webhookState,
    messages: messengerMessages,
    users: messengerUsers,
    messageCount: messengerMessages.length,
    userCount: Object.keys(messengerUsers).length
  });
});

// Activate webhook (start waiting)
router.post('/messenger/activate', (req, res) => {
  logger.info('🚀 Activating Messenger webhook receiver');
  
  webhookState.isWaitingForCall = true;
  webhookState.hasReceivedCall = false;
  webhookState.activatedAt = new Date().toISOString();
  
  res.json({
    success: true,
    message: 'Messenger webhook receiver activated',
    status: webhookState
  });
});

// Get messages
router.get('/messenger/messages', (req, res) => {
  logger.info('💬 Messenger messages requested', { count: messengerMessages.length });
  res.json({
    success: true,
    messages: messengerMessages.slice(-50), // Last 50 messages
    totalCount: messengerMessages.length
  });
});

// Get users
router.get('/messenger/users', (req, res) => {
  logger.info('👥 Messenger users requested', { count: Object.keys(messengerUsers).length });
  res.json({
    success: true,
    users: messengerUsers,
    totalCount: Object.keys(messengerUsers).length
  });
});

// Manual reply endpoint
router.post('/messenger/reply', async (req, res) => {
  const { senderId, replyText } = req.body;
  
  logger.info('📤 Manual Messenger reply requested', { senderId, replyText });

  if (!senderId || !replyText) {
    return res.status(400).json({
      success: false,
      error: 'Missing senderId or replyText'
    });
  }

  try {
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

module.exports = router;