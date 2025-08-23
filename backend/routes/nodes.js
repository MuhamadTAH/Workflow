/*
=================================================================
BACKEND FILE: backend/routes/nodes.js
=================================================================
Routes for node execution.
Copied from WorkflowNode and adapted for main backend.
*/

console.log('🚀 LOADING NODES ROUTES FILE');

const express = require('express');
const router = express.Router();
const { runNode } = require('../controllers/nodeController');
const { TelegramAPI } = require('../services/telegramAPI');
// Temporarily comment out aiService import to test deployment
// const { verifyClaudeApiKey } = require('../services/aiService');

// Debug middleware to log all requests to /api/nodes/*
router.use((req, res, next) => {
  console.log('🔍 NODES ROUTE HIT:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    body: req.body,
    timestamp: new Date().toISOString()
  });
  next();
});

// POST /api/nodes/run-node - Execute a single node
router.post('/run-node', runNode);

// OPTIONS handler for telegram token validation preflight
router.options('/validate-telegram-token', (req, res) => {
  console.log('🔧 OPTIONS request for /validate-telegram-token:', {
    origin: req.headers.origin,
    method: req.headers['access-control-request-method'],
    headers: req.headers['access-control-request-headers']
  });
  
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// POST /api/nodes/validate-telegram-token - Validate Telegram bot token using getMe
console.log('📝 REGISTERING /validate-telegram-token route');
router.post('/validate-telegram-token', async (req, res) => {
  // Explicit CORS headers for this endpoint
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  try {
    const { token } = req.body || {};
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const api = new TelegramAPI(token.trim());
    const result = await api.validateToken();

    if (result && result.success) {
      return res.json({ success: true, bot: result.data });
    }

    return res.status(400).json({
      success: false,
      error: result?.error?.message || 'Invalid token'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Validation failed' });
  }
});

// POST /api/nodes/verify-claude - Verify Claude API key (TEMPORARILY DISABLED FOR TESTING)
console.log('📝 REGISTERING /verify-claude route (MOCK VERSION)');
router.post('/verify-claude', async (req, res) => {
  try {
    const { apiKey } = req.body || {};
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ ok: false, message: 'apiKey is required' });
    }
    
    // Mock validation for testing deployment
    if (!apiKey.startsWith('sk-ant-')) {
      return res.status(401).json({ ok: false, message: 'Invalid API key format' });
    }
    
    return res.json({ ok: true, model: 'claude-3-haiku-20240307' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Verification failed' });
  }
});

// OPTIONS handler for telegram get updates preflight
router.options('/telegram-get-updates', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// POST /api/nodes/telegram-get-updates - Fetch real messages from Telegram bot
console.log('📝 REGISTERING /telegram-get-updates route');
router.post('/telegram-get-updates', async (req, res) => {
  // Explicit CORS headers for this endpoint
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  try {
    const { token, limit = 5, offset } = req.body || {};
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const api = new TelegramAPI(token.trim());
    
    // Check if there's a workflow active for this bot token
    let workflowExecutor = null;
    try {
      workflowExecutor = require('../services/workflowExecutor');
    } catch (error) {
      console.warn('⚠️ WorkflowExecutor not available:', error.message);
    }
    
    let hasActiveWorkflowWithThisToken = false;
    if (workflowExecutor && workflowExecutor.activeWorkflows) {
      for (const [workflowId, workflow] of workflowExecutor.activeWorkflows) {
        if (workflow.isActive && workflow.nodes) {
          // Check if this workflow has a Telegram trigger with the same bot token
          const telegramTrigger = workflow.nodes.find(node => 
            node.data.type === 'telegramTrigger' && 
            (node.data.botToken === token.trim() || node.data.telegramBotToken === token.trim())
          );
          if (telegramTrigger) {
            hasActiveWorkflowWithThisToken = true;
            console.log(`🔍 Found active workflow ${workflowId} using this bot token`);
            break;
          }
        }
      }
    }
    
    // First, check if webhook is active at Telegram API level
    const webhookInfo = await api.getWebhookInfo();
    
    if (webhookInfo.success && webhookInfo.data.url && hasActiveWorkflowWithThisToken) {
      // Webhook is active AND we have an active workflow, provide stored/mock data
      console.log('⚠️ Webhook active with active workflow, cannot use getUpdates. Providing stored data.');
      
      // Check if we have any stored webhook messages in memory/database
      const storedMessages = getStoredTelegramMessages() || [];
      
      if (storedMessages.length > 0) {
        return res.json({
          success: true,
          updates: storedMessages.slice(0, Math.min(limit, 10)),
          count: storedMessages.length,
          source: 'webhook_storage',
          webhook_url: webhookInfo.data.url,
          message: 'Real messages from webhook storage (bot has active webhook)'
        });
      } else {
        // Generate realistic sample data based on the actual bot
        const botInfo = await api.validateToken();
        const botName = botInfo.success ? botInfo.data.first_name : 'Bot';
        
        const realisticSampleMessage = {
          update_id: Date.now(),
          message: {
            message_id: Math.floor(Math.random() * 1000) + 1,
            from: {
              id: 123456789,
              is_bot: false,
              first_name: "Test User",
              username: "testuser",
              language_code: "en"
            },
            chat: {
              id: 123456789,
              first_name: "Test User",
              username: "testuser",
              type: "private"
            },
            date: Math.floor(Date.now() / 1000),
            text: `Hello ${botName}! This is test data since webhook is active.`
          }
        };
        
        return res.json({
          success: true,
          updates: [realisticSampleMessage],
          count: 1,
          source: 'realistic_sample',
          webhook_url: webhookInfo.data.url,
          message: 'Mock data (workflow active with webhook)'
        });
      }
    } else if (webhookInfo.success && webhookInfo.data.url && !hasActiveWorkflowWithThisToken) {
      // Webhook exists but no active workflow - delete the webhook and use getUpdates
      console.log('🗑️ Webhook exists but no active workflow found. Deleting webhook to enable getUpdates.');
      
      try {
        await api.deleteWebhook();
        console.log('✅ Webhook deleted successfully');
      } catch (deleteError) {
        console.error('❌ Failed to delete webhook:', deleteError.message);
        // Continue anyway and try getUpdates
      }
    }

    // No webhook, try getUpdates
    const result = await api.getUpdates({ 
      limit: Math.min(limit, 10),
      offset: offset 
    });

    if (result && result.success) {
      return res.json({ 
        success: true, 
        updates: result.data,
        count: result.data ? result.data.length : 0,
        source: 'getUpdates',
        message: 'Real messages from Telegram getUpdates API'
      });
    }

    return res.status(400).json({
      success: false,
      error: result?.error?.message || 'Failed to fetch updates'
    });
  } catch (error) {
    console.error('Error fetching Telegram updates:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch updates' 
    });
  }
});

// Helper function to get stored telegram messages (from webhook processing)
function getStoredTelegramMessages() {
  // This would typically come from a database or in-memory store
  // For now, return empty array - can be enhanced to store webhook messages
  return [];
}

// Instagram validation endpoints for workflow builder (no authentication required)
// POST /api/nodes/find-instagram-account-id - Find Instagram Business Account ID from access token
router.post('/find-instagram-account-id', async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    console.log('🔍 Instagram Account ID lookup requested');
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Access Token is required'
      });
    }

    // Use Instagram API service to get connected Instagram accounts
    const { InstagramAPI } = require('../services/instagramAPI');
    const instagramAPI = new InstagramAPI(accessToken);
    
    console.log('🔍 Finding Instagram Business accounts from access token...');

    // First validate the access token
    const tokenValidation = await instagramAPI.validateToken(accessToken);
    if (!tokenValidation.success) {
      return res.status(400).json({
        success: false,
        error: `Invalid access token: ${tokenValidation.error.message}`
      });
    }

    // Get Instagram accounts connected to Facebook pages
    const instagramAccounts = await instagramAPI.getInstagramAccounts(accessToken);
    if (!instagramAccounts.success) {
      return res.status(400).json({
        success: false,
        error: `Failed to get Instagram accounts: ${instagramAccounts.error.message}`
      });
    }

    if (!instagramAccounts.data || instagramAccounts.data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No Instagram Business accounts found. Make sure your Facebook Page is connected to an Instagram Business account.'
      });
    }

    console.log('✅ Found Instagram Business accounts:', instagramAccounts.data.length);

    res.json({
      success: true,
      message: `Found ${instagramAccounts.data.length} Instagram Business account(s)`,
      accounts: instagramAccounts.data,
      tokenInfo: {
        userId: tokenValidation.data.id,
        userName: tokenValidation.data.name
      }
    });

  } catch (error) {
    console.error('Instagram Account ID lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find Instagram Account ID: ' + error.message
    });
  }
});

// POST /api/nodes/validate-instagram - Validate Instagram Account ID and Access Token
router.post('/validate-instagram', async (req, res) => {
  try {
    const { accountId, accessToken } = req.body;
    
    console.log('🔍 Instagram account validation requested');
    
    if (!accountId || !accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Account ID and Access Token are required'
      });
    }

    // Use Instagram API service to validate the account
    const { InstagramAPI } = require('../services/instagramAPI');
    const instagramAPI = new InstagramAPI(accessToken);
    
    console.log('🔍 Validating Instagram account:', { accountId: accountId.substring(0, 8) + '...' });

    // First validate the access token
    const tokenValidation = await instagramAPI.validateToken(accessToken);
    if (!tokenValidation.success) {
      return res.status(400).json({
        success: false,
        error: `Invalid access token: ${tokenValidation.error.message}`
      });
    }

    // Then get the account information
    const accountInfo = await instagramAPI.getAccountInfo(accountId, accessToken);
    if (!accountInfo.success) {
      return res.status(400).json({
        success: false,
        error: `Invalid account ID: ${accountInfo.error.message}`
      });
    }

    console.log('✅ Instagram account validated:', {
      username: accountInfo.data.username,
      name: accountInfo.data.name,
      followers: accountInfo.data.followers_count
    });

    res.json({
      success: true,
      message: 'Instagram account validated successfully',
      accountInfo: {
        id: accountInfo.data.id,
        username: accountInfo.data.username,
        name: accountInfo.data.name,
        profile_picture_url: accountInfo.data.profile_picture_url,
        followers_count: accountInfo.data.followers_count,
        follows_count: accountInfo.data.follows_count,
        media_count: accountInfo.data.media_count
      },
      tokenInfo: {
        userId: tokenValidation.data.id,
        userName: tokenValidation.data.name
      }
    });

  } catch (error) {
    console.error('Instagram validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate Instagram account: ' + error.message
    });
  }
});

console.log('✅ EXPORTING NODES ROUTER WITH ROUTES:', router.stack.map(r => r.route?.path).filter(Boolean));
module.exports = router;