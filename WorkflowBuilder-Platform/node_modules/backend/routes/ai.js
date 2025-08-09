/*
=================================================================
BACKEND FILE: backend/routes/ai.js
=================================================================
AI related routes (e.g., verifying Claude API key)
*/

const express = require('express');
const router = express.Router();
const { verifyClaudeApiKey } = require('../services/aiService');

// POST /api/ai/verify-claude - Verify Claude API key
router.post('/verify-claude', async (req, res) => {
  try {
    const { apiKey } = req.body || {};
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ ok: false, message: 'apiKey is required' });
    }
    const result = await verifyClaudeApiKey(apiKey);
    if (result.valid) {
      return res.json({ ok: true, model: result.model });
    }
    return res.status(401).json({ ok: false, message: result.error || 'Invalid Claude API key' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Verification failed' });
  }
});

module.exports = router;

