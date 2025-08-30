const express = require('express');
const router = express.Router();
const logger = require('../services/logger');

// Store for Instagram comment data
let instagramComments = [];

// Instagram webhook verification endpoint
router.get('/webhooks/instagram/comments', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('Instagram webhook verification attempt', {
    mode,
    token,
    challenge: challenge ? 'present' : 'missing'
  });

  // Verify the token (you should set this in environment variables or use the one from frontend)
  const VERIFY_TOKEN = process.env.INSTAGRAM_VERIFY_TOKEN || 'custom_verification_token';
  
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.info('Instagram webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      logger.warn('Instagram webhook verification failed', { 
        expectedToken: VERIFY_TOKEN,
        receivedToken: token,
        mode 
      });
      res.sendStatus(403);
    }
  } else {
    logger.warn('Instagram webhook verification missing required parameters');
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
      // Process Instagram comment webhook data
      if (entry.changes) {
        entry.changes.forEach(change => {
          if (change.field === 'comments') {
            const commentData = {
              id: change.value.id,
              text: change.value.text,
              from: change.value.from,
              timestamp: new Date().toISOString(),
              media_id: change.value.media?.id,
              parent_id: change.value.parent_id
            };
            
            instagramComments.push(commentData);
            logger.info('Instagram comment stored', { commentId: commentData.id });
          }
        });
      }
    });
  }

  res.status(200).send('EVENT_RECEIVED');
});

// Instagram comment management state
let commentManagerState = {
  isActive: false,
  appId: null,
  appSecret: null,
  accessToken: null,
  instagramBusinessId: null,
  webhookToken: null,
  activatedAt: null
};

// Get Instagram comment manager status
router.get('/instagram-comments/status', (req, res) => {
  logger.info('Instagram comment manager status requested');
  
  res.json({
    success: true,
    status: {
      isActive: commentManagerState.isActive,
      activatedAt: commentManagerState.activatedAt,
      hasCredentials: !!(commentManagerState.appId && commentManagerState.accessToken)
    },
    comments: instagramComments
  });
});

// Activate Instagram comment manager
router.post('/instagram-comments/activate', (req, res) => {
  const { appId, appSecret, accessToken, instagramBusinessId, webhookToken } = req.body;

  logger.info('Instagram comment manager activation requested', {
    hasAppId: !!appId,
    hasAppSecret: !!appSecret,
    hasAccessToken: !!accessToken,
    hasBusinessId: !!instagramBusinessId,
    hasWebhookToken: !!webhookToken
  });

  if (!appId || !appSecret || !accessToken || !instagramBusinessId || !webhookToken) {
    return res.status(400).json({
      success: false,
      error: 'Missing required Instagram API credentials'
    });
  }

  // Store credentials and activate
  commentManagerState = {
    isActive: true,
    appId: appId.trim(),
    appSecret: appSecret.trim(),
    accessToken: accessToken.trim(),
    instagramBusinessId: instagramBusinessId.trim(),
    webhookToken: webhookToken.trim(),
    activatedAt: new Date().toISOString()
  };

  logger.info('Instagram comment manager activated successfully');

  res.json({
    success: true,
    message: 'Instagram comment manager activated successfully',
    status: {
      isActive: true,
      activatedAt: commentManagerState.activatedAt
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
  logger.info('Instagram comments requested', {
    commentCount: instagramComments.length,
    isActive: commentManagerState.isActive
  });

  res.json({
    success: true,
    comments: instagramComments,
    status: {
      isActive: commentManagerState.isActive,
      activatedAt: commentManagerState.activatedAt
    }
  });
});

// Send reply to Instagram comment (placeholder for future implementation)
router.post('/instagram-comments/reply', (req, res) => {
  const { commentId, replyText } = req.body;

  logger.info('Instagram comment reply requested', {
    commentId,
    hasReplyText: !!replyText,
    isActive: commentManagerState.isActive
  });

  if (!commentManagerState.isActive) {
    return res.status(400).json({
      success: false,
      error: 'Instagram comment manager is not active'
    });
  }

  if (!commentId || !replyText) {
    return res.status(400).json({
      success: false,
      error: 'Missing commentId or replyText'
    });
  }

  // TODO: Implement actual Instagram Graph API comment reply
  // For now, just return success (placeholder)
  
  logger.info('Instagram comment reply sent successfully (placeholder)', { commentId });

  res.json({
    success: true,
    message: 'Reply sent successfully',
    data: {
      commentId,
      replyText,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;