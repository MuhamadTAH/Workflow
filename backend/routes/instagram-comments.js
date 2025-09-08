const express = require('express');
const router = express.Router();
const logger = require('../services/logger');
const { generateAIReply, getAIConfig, handleMessageBatch } = require('./instagram-ai');

// Store for Instagram DM data
let instagramMessages = [];
// Store for Instagram user profiles
let instagramUsers = {};
// Store for per-user AI status (true = AI active, false = AI disabled)
let userAIStatus = {};

// Function to fetch Instagram user info
async function fetchUserInfo(userId) {
  try {
    const ACCESS_TOKEN = 'IGAASK8KNQ8bVBZAFBiWE80aG9Jck5rU1BfaGQ0bHh4QVdEWFNhQzhIS3dRY29iV25hMkR1cEt6eTkwS2ZAqLWhidk5xWXN4M0F0elRnamJTU2NGS3NqVFhUT0FGV05nRXFSVGFoTkVmcTV3TzUzZAnJDa1dNT3ZArSG5VczhjQ21kQQZDZD';
    
    logger.info('👤 Fetching user info for:', { userId });
    
    const response = await fetch(`https://graph.instagram.com/v21.0/${userId}?fields=id,username,name,profile_picture_url&access_token=${ACCESS_TOKEN}`);
    const data = await response.json();
    
    if (response.ok && data.id) {
      instagramUsers[userId] = {
        id: data.id,
        username: data.username || `user_${userId.slice(0, 8)}`,
        name: data.name || data.username || 'Instagram User',
        profile_picture_url: data.profile_picture_url || null,
        fetchedAt: new Date().toISOString()
      };
      
      logger.info('✅ User info fetched:', { 
        userId, 
        username: instagramUsers[userId].username,
        name: instagramUsers[userId].name 
      });
    } else {
      // Fallback if API fails
      instagramUsers[userId] = {
        id: userId,
        username: `user_${userId.slice(0, 8)}`,
        name: 'Instagram User',
        profile_picture_url: null,
        fetchedAt: new Date().toISOString(),
        failed: true
      };
      
      logger.warn('⚠️ Failed to fetch user info, using fallback:', { userId, error: data });
    }
  } catch (error) {
    logger.error('💥 Error fetching user info:', { userId, error: error.message });
    
    // Fallback user info
    instagramUsers[userId] = {
      id: userId,
      username: `user_${userId.slice(0, 8)}`,
      name: 'Instagram User',
      profile_picture_url: null,
      fetchedAt: new Date().toISOString(),
      failed: true
    };
  }
}

// Helper function to send Instagram reply (used by both manual replies and AI auto-replies)
async function sendInstagramReply(senderId, replyText, isAIReply = false) {
  try {
    const ACCESS_TOKEN = 'IGAASK8KNQ8bVBZAFBiWE80aG9Jck5rU1BfaGQ0bHh4QVdEWFNhQzhIS3dRY29iV25hMkR1cEt6eTkwS2ZAqLWhidk5xWXN4M0F0elRnamJTU2NGS3NqVFhUT0FGV05nRXFSVGFoTkVmcTV3TzUzZAnJDa1dNT3ZArSG5VczhjQ21kQQZDZD';
    
    // Get recipient ID from stored messages
    const recipientId = instagramMessages.length > 0 ? instagramMessages[0].recipient?.id : '17841445204646276';
    
    logger.info(`${isAIReply ? '🤖' : '📤'} Sending Instagram ${isAIReply ? 'AI auto-' : ''}reply`, { 
      senderId, 
      recipientId,
      replyText: replyText.substring(0, 50) + '...',
      isAI: isAIReply
    });

    // Send reply using Instagram Graph API
    const response = await fetch(`https://graph.instagram.com/v23.0/${recipientId}/messages`, {
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
      logger.info(`✅ Instagram ${isAIReply ? 'AI auto-' : ''}reply sent successfully!`, { 
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
      const isDuplicate = instagramMessages.some(existingMsg => 
        existingMsg.id === sentMessage.id ||
        (existingMsg.text === sentMessage.text && 
         existingMsg.sender?.id === 'me' &&
         existingMsg.recipient?.id === senderId &&
         Math.abs(new Date(existingMsg.timestamp) - new Date(sentMessage.timestamp)) < 30000)
      );
      
      if (!isDuplicate) {
        instagramMessages.push(sentMessage);
      }

      return { success: true, messageId: data.message_id };
    } else {
      logger.error(`❌ Instagram ${isAIReply ? 'AI auto-' : ''}reply failed`, { error: data });
      return { success: false, error: data.error?.message || 'Failed to send reply' };
    }
  } catch (error) {
    logger.error(`💥 Instagram ${isAIReply ? 'AI auto-' : ''}reply error`, { error: error.message });
    return { success: false, error: error.message };
  }
}

// Instagram webhook endpoint (handles both GET verification and POST messages like n8n)
router.all('/webhooks/instagram/comments', async (req, res) => {
  logger.info('🔥 INSTAGRAM WEBHOOK RECEIVED!', {
    method: req.method,
    query: req.query,
    hasBody: !!req.body,
    timestamp: new Date().toISOString()
  });

  // Handle GET verification (like n8n If node)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    logger.info('📝 Processing verification:', { mode, token, challenge: !!challenge });

    // Mark that we received the first call
    if (webhookState.isWaitingForCall && !webhookState.hasReceivedCall) {
      webhookState.hasReceivedCall = true;
      webhookState.firstCallAt = new Date().toISOString();
      logger.info('🎉 FIRST WEBHOOK CALL DETECTED!', { 
        firstCallAt: webhookState.firstCallAt 
      });
    }

    // Verify token (like n8n conditions)
    const VERIFY_TOKEN = 'muhammad';
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.info('✅ Instagram webhook verified - sending challenge');
      return res.status(200).send(challenge);
    } else {
      logger.warn('❌ Verification failed', { expectedToken: VERIFY_TOKEN, receivedToken: token });
      return res.sendStatus(403);
    }
  }

  // Handle POST messages (like n8n message processing)
  if (req.method === 'POST') {
    const body = req.body;

    logger.info('💬 INSTAGRAM MESSAGE DATA!', {
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
            if (senderId && !instagramUsers[senderId]) {
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
              timestamp: new Date().toISOString(),
              webhookTimestamp: messaging.timestamp,
              rawData: messaging
            };
            
            // Check for duplicate messages to avoid double-storing sent messages
            const isDuplicate = instagramMessages.some(existingMsg => 
              existingMsg.id === messageData.id ||
              (existingMsg.text === messageData.text && 
               existingMsg.sender?.id === messageData.sender?.id &&
               Math.abs(new Date(existingMsg.timestamp) - new Date(messageData.timestamp)) < 30000) // Within 30 seconds
            );
            
            if (!isDuplicate) {
              instagramMessages.push(messageData);
              
              // Trigger AI auto-reply for incoming messages (not echoes)
              if (messageData.text && !messaging.message?.is_echo && senderId !== 'me') {
                const aiConfig = getAIConfig();
                const userAIEnabled = userAIStatus[senderId] !== false; // Default to true if not set
                
                if (aiConfig.enabled && aiConfig.autoReply && userAIEnabled) {
                  logger.info('🤖 Adding message to batch for AI processing', {
                    senderId,
                    message: messageData.text.substring(0, 50),
                    batchDelay: '5 seconds',
                    userAIEnabled
                  });
                  
                  // Use message batching system (5-second delay)
                  handleMessageBatch(senderId, messageData.text, generateAIReply, sendInstagramReply);
                } else if (!userAIEnabled) {
                  logger.info('🚫 AI disabled for user, skipping auto-reply', {
                    senderId,
                    userAIEnabled,
                    globalAIEnabled: aiConfig.enabled && aiConfig.autoReply
                  });
                }
              }
            } else {
              logger.info('🔄 Duplicate message detected, skipping:', { 
                messageId: messageData.id,
                text: messageData.text?.substring(0, 50),
                senderId: messageData.sender?.id
              });
            }
            logger.info('✅ Instagram DM stored successfully!', { 
              messageId: messageData.id,
              senderId: messageData.sender.id,
              text: messageData.text ? messageData.text.substring(0, 50) + '...' : 'No text',
              totalMessages: instagramMessages.length
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
router.post('/webhooks/instagram/test', (req, res) => {
  logger.info('🧪 TEST POST RECEIVED!', {
    body: JSON.stringify(req.body, null, 2),
    headers: req.headers
  });
  res.json({ success: true, message: 'Test received!' });
});


// Instagram webhook state
let webhookState = {
  isWaitingForCall: false,
  hasReceivedCall: false,
  activatedAt: null,
  firstCallAt: null
};

// Get Instagram webhook status
router.get('/instagram-comments/status', (req, res) => {
  logger.info('Instagram webhook status requested');
  
  res.json({
    success: true,
    status: {
      isWaitingForCall: webhookState.isWaitingForCall,
      hasReceivedCall: webhookState.hasReceivedCall,
      activatedAt: webhookState.activatedAt,
      firstCallAt: webhookState.firstCallAt
    },
    webhookUrl: 'https://workflow-lg9z.onrender.com/api/webhooks/instagram/comments',
    verifyToken: 'muhammad'
  });
});

// Start waiting for webhook call
router.post('/instagram-comments/activate', (req, res) => {
  logger.info('🚀 Starting to wait for Instagram webhook call');

  // Start waiting for the first call
  webhookState.isWaitingForCall = true;
  webhookState.hasReceivedCall = false;
  webhookState.activatedAt = new Date().toISOString();
  webhookState.firstCallAt = null;

  logger.info('✅ Now waiting for webhook call from Meta');

  res.json({
    success: true,
    message: 'Waiting for webhook call from Meta...',
    status: {
      isWaitingForCall: true,
      hasReceivedCall: false,
      activatedAt: webhookState.activatedAt
    },
    instructions: {
      webhookUrl: 'https://workflow-lg9z.onrender.com/api/webhooks/instagram/comments',
      verifyToken: 'muhammad',
      nextStep: 'Add this URL and token to your Meta Developer Console'
    }
  });
});

// Deactivate Instagram webhook
router.post('/instagram-comments/deactivate', (req, res) => {
  logger.info('Instagram webhook deactivation requested');

  webhookState.isWaitingForCall = false;
  webhookState.hasReceivedCall = false;
  webhookState.activatedAt = null;
  webhookState.firstCallAt = null;

  logger.info('Instagram webhook deactivated successfully');

  res.json({
    success: true,
    message: 'Instagram webhook deactivated successfully',
    status: {
      isWaitingForCall: false,
      hasReceivedCall: false,
      activatedAt: null,
      firstCallAt: null
    }
  });
});

// Get Instagram messages with user profiles
router.get('/instagram-comments/comments', (req, res) => {
  logger.info('Instagram messages requested', {
    messageCount: instagramMessages.length,
    userCount: Object.keys(instagramUsers).length,
    isWaiting: webhookState.isWaitingForCall
  });

  res.json({
    success: true,
    messages: instagramMessages,
    users: instagramUsers,
    status: {
      isWaitingForCall: webhookState.isWaitingForCall,
      hasReceivedCall: webhookState.hasReceivedCall,
      activatedAt: webhookState.activatedAt,
      firstCallAt: webhookState.firstCallAt
    }
  });
});

// Get Instagram user profiles
router.get('/instagram-comments/users', (req, res) => {
  logger.info('Instagram user profiles requested', {
    userCount: Object.keys(instagramUsers).length
  });

  res.json({
    success: true,
    users: instagramUsers
  });
});

// Send reply to Instagram DM (manual replies)
router.post('/instagram-comments/reply', async (req, res) => {
  const { senderId, replyText } = req.body;

  logger.info('📤 Manual Instagram DM reply requested', {
    senderId,
    hasReplyText: !!replyText,
    isWaiting: webhookState.isWaitingForCall
  });

  if (!webhookState.isWaitingForCall) {
    return res.status(400).json({
      success: false,
      error: 'Instagram webhook is not active'
    });
  }

  if (!senderId || !replyText) {
    return res.status(400).json({
      success: false,
      error: 'Missing senderId or replyText'
    });
  }

  try {
    const result = await sendInstagramReply(senderId, replyText, false);
    
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
    logger.error('💥 Manual Instagram reply error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

// Toggle AI status for specific user
router.post('/instagram-comments/user-ai/toggle', async (req, res) => {
  const { userId, isActive } = req.body;

  logger.info('🤖 User AI toggle requested', {
    userId,
    isActive,
    currentStatus: userAIStatus[userId]
  });

  if (!userId) {
    return res.status(400).json({
      success: false,
      error: 'Missing userId'
    });
  }

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'isActive must be a boolean'
    });
  }

  try {
    // Update user AI status
    userAIStatus[userId] = isActive;
    
    logger.info('✅ User AI status updated', {
      userId,
      newStatus: isActive,
      action: isActive ? 'AI activated' : 'AI deactivated'
    });

    res.json({
      success: true,
      message: `AI ${isActive ? 'activated' : 'deactivated'} for user ${userId}`,
      data: {
        userId,
        isActive,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('💥 User AI toggle error', { 
      error: error.message, 
      userId, 
      isActive 
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

// Get AI status for all users
router.get('/instagram-comments/user-ai/status', (req, res) => {
  logger.info('User AI status requested', {
    userCount: Object.keys(userAIStatus).length
  });

  res.json({
    success: true,
    userAIStatus: userAIStatus,
    defaultStatus: true // Default is AI active for new users
  });
});

module.exports = router;