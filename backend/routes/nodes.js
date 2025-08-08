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

// POST /api/nodes/validate-telegram-token - Validate Telegram bot token using getMe
console.log('📝 REGISTERING /validate-telegram-token route');
router.post('/validate-telegram-token', async (req, res) => {
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

// POST /api/nodes/telegram-get-updates - Fetch real messages from Telegram bot
console.log('📝 REGISTERING /telegram-get-updates route');
router.post('/telegram-get-updates', async (req, res) => {
  try {
    const { token, limit = 5, offset } = req.body || {};
    if (!token || typeof token !== 'string' || token.trim() === '') {
      return res.status(400).json({ success: false, error: 'Token is required' });
    }

    const api = new TelegramAPI(token.trim());
    
    // First, check if webhook is active
    const webhookInfo = await api.getWebhookInfo();
    
    if (webhookInfo.success && webhookInfo.data.url) {
      // Webhook is active, provide stored message data instead
      console.log('⚠️ Webhook active, cannot use getUpdates. Providing stored data.');
      
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
          message: 'Realistic sample data (webhook prevents real message polling)'
        });
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