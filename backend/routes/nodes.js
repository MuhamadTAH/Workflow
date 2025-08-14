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
    
    // First, check if webhook is active
    const webhookInfo = await api.getWebhookInfo();
    
    if (webhookInfo.success && webhookInfo.data.url) {
      const currentWebhookUrl = webhookInfo.data.url;
      
      // Check if we have any active workflows listening
      let workflowExecutor = null;
      try {
        workflowExecutor = require('../services/workflowExecutor');
      } catch (error) {
        console.log('⚠️ WorkflowExecutor not available, proceeding with webhook disable');
      }
      
      // Check if any workflows are actually active/listening
      const hasActiveWorkflows = workflowExecutor && workflowExecutor.activeWorkflows && workflowExecutor.activeWorkflows.size > 0;
      
      if (hasActiveWorkflows) {
        // Webhook has active workflows, temporarily disable it to get real messages
        console.log(`⚠️ Webhook active with ${workflowExecutor.activeWorkflows.size} listening workflows, temporarily disabling to fetch real messages...`);
        
        try {
          // Temporarily remove webhook
          await api.deleteWebhook();
          console.log('🔄 Webhook temporarily disabled');
          
          // Small delay to ensure webhook is fully disabled
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get real messages using getUpdates
          const result = await api.getUpdates({ 
            limit: Math.min(limit, 10),
            offset: offset 
          });
          
          // Restore webhook immediately
          await api.setWebhook(currentWebhookUrl);
          console.log('🔄 Webhook restored');
          
          if (result && result.success) {
            return res.json({ 
              success: true, 
              updates: result.data,
              count: result.data ? result.data.length : 0,
              source: 'getUpdates_temp_webhook_disable',
              message: 'Real messages from Telegram (webhook temporarily disabled)',
              webhook_restored: currentWebhookUrl,
              active_workflows: workflowExecutor.activeWorkflows.size
            });
          } else {
            return res.status(400).json({
              success: false,
              error: result?.error?.message || 'Failed to fetch updates even with webhook disabled'
            });
          }
          
        } catch (webhookError) {
          // If webhook operations fail, try to restore and return error
          try {
            await api.setWebhook(currentWebhookUrl);
            console.log('🔄 Webhook restored after error');
          } catch (restoreError) {
            console.error('❌ Failed to restore webhook:', restoreError);
          }
          
          return res.status(500).json({
            success: false,
            error: `Failed to temporarily manage webhook: ${webhookError.message}`,
            webhook_url: currentWebhookUrl
          });
        }
      } else {
        // Webhook exists but no active workflows, just disable it permanently and use getUpdates
        console.log('⚠️ Webhook exists but no workflows are active, disabling webhook and using getUpdates');
        
        try {
          await api.deleteWebhook();
          console.log('🔄 Webhook disabled (no active workflows)');
          
          // Get real messages using getUpdates
          const result = await api.getUpdates({ 
            limit: Math.min(limit, 10),
            offset: offset 
          });
          
          if (result && result.success) {
            return res.json({ 
              success: true, 
              updates: result.data,
              count: result.data ? result.data.length : 0,
              source: 'getUpdates_webhook_disabled',
              message: 'Real messages from Telegram (webhook disabled - no active workflows)',
              active_workflows: 0
            });
          } else {
            return res.status(400).json({
              success: false,
              error: result?.error?.message || 'Failed to fetch updates'
            });
          }
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: `Failed to disable webhook: ${error.message}`
          });
        }
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

console.log('✅ EXPORTING NODES ROUTER WITH ROUTES:', router.stack.map(r => r.route?.path).filter(Boolean));
module.exports = router;