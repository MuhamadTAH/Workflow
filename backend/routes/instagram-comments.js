const express = require('express');
const router = express.Router();
const logger = require('../services/logger');

// Store for Instagram DM data
let instagramMessages = [];

// Instagram webhook verification endpoint  
router.get('/webhooks/instagram/comments', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('🔥 INSTAGRAM WEBHOOK CALL RECEIVED!', {
    mode,
    token,
    challenge: challenge ? 'present' : 'missing',
    timestamp: new Date().toISOString()
  });

  // Mark that we received the first call
  if (webhookState.isWaitingForCall && !webhookState.hasReceivedCall) {
    webhookState.hasReceivedCall = true;
    webhookState.firstCallAt = new Date().toISOString();
    logger.info('🎉 FIRST WEBHOOK CALL DETECTED!', { 
      firstCallAt: webhookState.firstCallAt 
    });
  }

  // Verify the token
  const VERIFY_TOKEN = 'muhammad';
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.info('✅ Instagram webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.warn('❌ Instagram webhook verification failed', { 
        expectedToken: VERIFY_TOKEN,
        receivedToken: token,
        mode 
      });
      res.sendStatus(403);
    }
  } else {
    logger.warn('⚠️ Instagram webhook verification missing required parameters');
    res.sendStatus(400);
  }
});

// Instagram webhook data reception endpoint
router.post('/webhooks/instagram/comments', (req, res) => {
  const body = req.body;

  logger.info('Instagram webhook data received', {
    hasEntry: !!body.entry,
    entryCount: body.entry ? body.entry.length : 0
  });

  // Store the webhook data for processing
  if (body.entry && body.entry.length > 0) {
    body.entry.forEach(entry => {
      // Process Instagram DM webhook data (like your working n8n setup)
      if (entry.messaging) {
        entry.messaging.forEach(messaging => {
          const messageData = {
            id: messaging.message?.mid || Date.now().toString(),
            text: messaging.message?.text,
            sender: {
              id: messaging.sender?.id
            },
            recipient: {
              id: messaging.recipient?.id
            },
            timestamp: new Date().toISOString(),
            webhookTimestamp: messaging.timestamp
          };
          
          instagramMessages.push(messageData);
          logger.info('Instagram DM stored', { 
            messageId: messageData.id,
            senderId: messageData.sender.id,
            text: messageData.text ? messageData.text.substring(0, 50) + '...' : 'No text'
          });
        });
      }
    });
  }

  res.status(200).send('EVENT_RECEIVED');
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

// Deactivate Instagram comment manager
router.post('/instagram-comments/deactivate', (req, res) => {
  logger.info('Instagram comment manager deactivation requested');

  commentManagerState.isActive = false;
  commentManagerState.activatedAt = null;

  logger.info('Instagram comment manager deactivated successfully');

  res.json({
    success: true,
    message: 'Instagram comment manager deactivated successfully',
    status: {
      isActive: false,
      activatedAt: null
    }
  });
});

// Get Instagram comments
router.get('/instagram-comments/comments', (req, res) => {
  logger.info('Instagram messages requested', {
    messageCount: instagramMessages.length,
    isActive: commentManagerState.isActive
  });

  res.json({
    success: true,
    messages: instagramMessages,
    status: {
      isActive: commentManagerState.isActive,
      activatedAt: commentManagerState.activatedAt
    }
  });
});

// Send reply to Instagram DM (using your working n8n setup)
router.post('/instagram-comments/reply', async (req, res) => {
  const { senderId, replyText } = req.body;

  logger.info('Instagram DM reply requested', {
    senderId,
    hasReplyText: !!replyText,
    isActive: commentManagerState.isActive
  });

  if (!commentManagerState.isActive) {
    return res.status(400).json({
      success: false,
      error: 'Instagram manager is not active'
    });
  }

  if (!senderId || !replyText) {
    return res.status(400).json({
      success: false,
      error: 'Missing senderId or replyText'
    });
  }

  try {
    // Use Instagram Graph API to send DM (same as your working n8n setup)
    const response = await fetch(`https://graph.instagram.com/v21.0/${commentManagerState.instagramBusinessId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${commentManagerState.accessToken}`,
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
      logger.info('Instagram DM reply sent successfully', { senderId, messageId: data.message_id });
      
      res.json({
        success: true,
        message: 'DM sent successfully',
        data: {
          senderId,
          replyText,
          messageId: data.message_id,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      logger.error('Instagram DM reply failed', { error: data });
      res.status(400).json({
        success: false,
        error: data.error?.message || 'Failed to send DM'
      });
    }
  } catch (error) {
    logger.error('Instagram DM reply error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;