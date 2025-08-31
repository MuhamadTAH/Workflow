const express = require('express');
const router = express.Router();
const logger = require('../services/logger');

// Store for Instagram DM data
let instagramMessages = [];

// Instagram webhook endpoint (handles both GET verification and POST messages like n8n)
router.all('/webhooks/instagram/comments', (req, res) => {
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

    // Process messages (same as before)
    if (body.entry && body.entry.length > 0) {
      body.entry.forEach(entry => {
        logger.info('📝 Processing entry:', {
          id: entry.id,
          hasMessaging: !!entry.messaging,
          messagingCount: entry.messaging ? entry.messaging.length : 0
        });

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
              rawData: messaging
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

  try {
    // Use the working Instagram access token from your n8n setup
    const ACCESS_TOKEN = 'IGAASK8KNQ8bVBZAFBiWE80aG9Jck5rU1BfaGQ0bHh4QVdEWFNhQzhIS3dRY29iV25hMkR1cEt6eTkwS2ZAqLWhidk5xWXN4M0F0elRnamJTU2NGS3NqVFhUT0FGV05nRXFSVGFoTkVmcTV3TzUzZAnJDa1dNT3ZArSG5VczhjQ21kQQZDZD';
    
    // Get recipient ID (your Instagram business account) from stored messages
    const recipientId = instagramMessages.length > 0 ? instagramMessages[0].recipient?.id : '17841445204646276';
    
    logger.info('🚀 Sending Instagram DM reply', { 
      senderId, 
      recipientId,
      replyText: replyText.substring(0, 50) + '...'
    });

    // Send reply using Instagram Graph API (same as your working n8n)
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
      logger.info('✅ Instagram DM reply sent successfully!', { 
        senderId, 
        messageId: data.message_id 
      });

      // Store our sent message in the backend so it appears correctly
      const sentMessage = {
        id: data.message_id || `sent_${Date.now()}`,
        text: replyText,
        sender: { id: 'me' },
        recipient: { id: senderId },
        timestamp: new Date().toISOString(),
        isOutgoing: true,
        messageId: data.message_id
      };
      
      instagramMessages.push(sentMessage);
      logger.info('📤 Our sent message stored', { messageId: sentMessage.id });
      
      res.json({
        success: true,
        message: 'DM sent successfully!',
        data: {
          senderId,
          replyText,
          messageId: data.message_id,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      logger.error('❌ Instagram DM reply failed', { error: data });
      res.status(400).json({
        success: false,
        error: data.error?.message || 'Failed to send DM'
      });
    }
  } catch (error) {
    logger.error('💥 Instagram DM reply error', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
});

module.exports = router;