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

console.log('✅ EXPORTING NODES ROUTER WITH ROUTES:', router.stack.map(r => r.route?.path).filter(Boolean));
module.exports = router;