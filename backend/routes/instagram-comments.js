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

// Test endpoint to check if POST works
router.post('/webhooks/instagram/test', (req, res) => {
  logger.info('🧪 TEST POST RECEIVED!', {
    body: JSON.stringify(req.body, null, 2),
    headers: req.headers
  });
  res.json({ success: true, message: 'Test received!' });
});

// Instagram webhook data reception endpoint
router.post('/webhooks/instagram/comments', (req, res) => {
  const body = req.body;

  logger.info('🔥 INSTAGRAM WEBHOOK DATA RECEIVED!', {
    hasEntry: !!body.entry,
    entryCount: body.entry ? body.entry.length : 0,
    fullBody: JSON.stringify(body, null, 2)
  });

  // Store the webhook data for processing
  if (body.entry && body.entry.length > 0) {
    body.entry.forEach(entry => {
      logger.info('📝 Processing entry:', {
        id: entry.id,
        hasMessaging: !!entry.messaging,
        messagingCount: entry.messaging ? entry.messaging.length : 0
      });

      // Process Instagram DM webhook data (like your working n8n setup)
      if (entry.messaging) {
        entry.messaging.forEach(messaging => {
          logger.info('💬 Processing messaging event:', {
            sender: messaging.sender?.id,
            recipient: messaging.recipient?.id,
            hasMessage: !!messaging.message,
            messageText: messaging.message?.text
          });

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
            rawData: messaging // Store raw data for debugging
          };
          
          instagramMessages.push(messageData);
          logger.info('✅ Instagram DM stored successfully!', { 
            messageId: messageData.id,
            senderId: messageData.sender.id,
            text: messageData.text ? messageData.text.substring(0, 50) + '...' : 'No text',
            totalMessages: instagramMessages.length
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

// Get Instagram messages
router.get('/instagram-comments/comments', (req, res) => {
  logger.info('Instagram messages requested', {
    messageCount: instagramMessages.length,
    isWaiting: webhookState.isWaitingForCall
  });

  res.json({
    success: true,
    messages: instagramMessages,
    status: {
      isWaitingForCall: webhookState.isWaitingForCall,
      hasReceivedCall: webhookState.hasReceivedCall,
      activatedAt: webhookState.activatedAt,
      firstCallAt: webhookState.firstCallAt
    }
  });
});

// Send reply to Instagram DM (using your working n8n setup)
router.post('/instagram-comments/reply', async (req, res) => {
  const { senderId, replyText } = req.body;

  logger.info('Instagram DM reply requested', {
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

  // Reply functionality not implemented yet - just return success for now
  logger.info('Instagram DM reply (placeholder)', { senderId });

  res.json({
    success: true,
    message: 'Reply functionality not implemented yet',
    data: {
      senderId,
      replyText,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;