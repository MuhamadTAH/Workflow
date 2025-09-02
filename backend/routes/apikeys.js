const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

// Generate a secure API key
function generateAPIKey() {
  return 'wf_' + crypto.randomBytes(32).toString('hex');
}

// Create new API key
router.post('/create', async (req, res) => {
  try {
    const { 
      customer_name, 
      customer_email, 
      monthly_spending_limit = 1000.00,
      rate_limit_per_minute = 60,
      rate_limit_per_hour = 1000,
      notes = ''
    } = req.body;

    if (!customer_name || !customer_email) {
      return res.status(400).json({ 
        error: 'Customer name and email are required' 
      });
    }

    const api_key = generateAPIKey();

    const result = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO api_keys (
          api_key, customer_name, customer_email, 
          monthly_spending_limit, rate_limit_per_minute, 
          rate_limit_per_hour, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        api_key, customer_name, customer_email,
        monthly_spending_limit, rate_limit_per_minute,
        rate_limit_per_hour, notes
      ], function(err) {
        if (err) reject(err);
        else resolve({ 
          id: this.lastID, 
          api_key,
          customer_name,
          customer_email,
          monthly_spending_limit,
          rate_limit_per_minute,
          rate_limit_per_hour
        });
      });
    });

    console.log('🔑 New API key created:', { 
      customer: customer_name, 
      key: api_key.substring(0, 10) + '...' 
    });

    res.json({
      success: true,
      api_key_info: result,
      message: 'API key created successfully'
    });

  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Get all API keys (admin only)
router.get('/list', async (req, res) => {
  try {
    const apiKeys = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          id, api_key, customer_name, customer_email,
          rate_limit_per_minute, rate_limit_per_hour,
          monthly_spending_limit, current_month_spending,
          total_requests, total_tokens, total_spent,
          is_active, created_at, last_used, notes
        FROM api_keys
        ORDER BY created_at DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ api_keys: apiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

// Get API key details
router.get('/:apiKey', async (req, res) => {
  try {
    const { apiKey } = req.params;

    const keyDetails = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          id, api_key, customer_name, customer_email,
          rate_limit_per_minute, rate_limit_per_hour,
          monthly_spending_limit, current_month_spending,
          total_requests, total_tokens, total_spent,
          is_active, created_at, last_used, notes
        FROM api_keys
        WHERE api_key = ?
      `, [apiKey], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!keyDetails) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Get recent usage
    const recentUsage = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          aku.*, am.name as model_name, am.provider
        FROM api_key_usage aku
        LEFT JOIN ai_models am ON aku.ai_model_id = am.id
        WHERE aku.api_key_id = ?
        ORDER BY aku.request_timestamp DESC
        LIMIT 50
      `, [keyDetails.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ 
      api_key: keyDetails,
      recent_usage: recentUsage
    });

  } catch (error) {
    console.error('Error fetching API key details:', error);
    res.status(500).json({ error: 'Failed to fetch API key details' });
  }
});

// Update API key settings
router.put('/:apiKey', async (req, res) => {
  try {
    const { apiKey } = req.params;
    const {
      customer_name,
      customer_email, 
      monthly_spending_limit,
      rate_limit_per_minute,
      rate_limit_per_hour,
      is_active,
      notes
    } = req.body;

    const result = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE api_keys SET
          customer_name = COALESCE(?, customer_name),
          customer_email = COALESCE(?, customer_email),
          monthly_spending_limit = COALESCE(?, monthly_spending_limit),
          rate_limit_per_minute = COALESCE(?, rate_limit_per_minute),
          rate_limit_per_hour = COALESCE(?, rate_limit_per_hour),
          is_active = COALESCE(?, is_active),
          notes = COALESCE(?, notes)
        WHERE api_key = ?
      `, [
        customer_name, customer_email, monthly_spending_limit,
        rate_limit_per_minute, rate_limit_per_hour, 
        is_active, notes, apiKey
      ], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    res.json({
      success: true,
      message: 'API key updated successfully'
    });

  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// Deactivate API key
router.delete('/:apiKey', async (req, res) => {
  try {
    const { apiKey } = req.params;

    const result = await new Promise((resolve, reject) => {
      db.run(`
        UPDATE api_keys SET is_active = 0 WHERE api_key = ?
      `, [apiKey], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    console.log('🔒 API key deactivated:', apiKey.substring(0, 10) + '...');

    res.json({
      success: true,
      message: 'API key deactivated successfully'
    });

  } catch (error) {
    console.error('Error deactivating API key:', error);
    res.status(500).json({ error: 'Failed to deactivate API key' });
  }
});

// Get API key usage stats
router.get('/:apiKey/stats', async (req, res) => {
  try {
    const { apiKey } = req.params;

    // Get API key ID first
    const keyInfo = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id FROM api_keys WHERE api_key = ?
      `, [apiKey], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!keyInfo) {
      return res.status(404).json({ error: 'API key not found' });
    }

    // Get usage statistics
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          DATE(request_timestamp) as date,
          COUNT(*) as total_requests,
          SUM(total_tokens) as total_tokens,
          SUM(total_price) as total_spent,
          AVG(total_tokens) as avg_tokens_per_request
        FROM api_key_usage
        WHERE api_key_id = ?
        AND request_timestamp >= date('now', '-30 days')
        GROUP BY DATE(request_timestamp)
        ORDER BY date DESC
      `, [keyInfo.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ 
      api_key: apiKey.substring(0, 10) + '...',
      usage_stats: stats
    });

  } catch (error) {
    console.error('Error fetching API key stats:', error);
    res.status(500).json({ error: 'Failed to fetch API key stats' });
  }
});

module.exports = router;