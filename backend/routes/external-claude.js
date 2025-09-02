const express = require('express');
const router = express.Router();
const { authenticateAPIKey, trackAPIKeyUsage } = require('../middleware/apiKeyAuth');

// External Claude API endpoint for customers with API keys
router.post('/chat', authenticateAPIKey, async (req, res) => {
  try {
    const { message, model = 'claude-3-5-sonnet-20241022', max_tokens = 4000 } = req.body;

    if (!message) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    // Get AI model info for billing
    const db = require('../db');
    const aiModel = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_models 
        WHERE name = ? AND is_active = 1
      `, [model], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!aiModel) {
      return res.status(400).json({ 
        error: `Model '${model}' not available. Contact support for model options.` 
      });
    }

    // Make request to Claude API
    const axios = require('axios');
    const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: model,
      max_tokens: max_tokens,
      messages: [{ role: 'user', content: message }]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    const response = claudeResponse.data;
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;

    // Track usage for billing
    let usageTracking = null;
    try {
      usageTracking = await trackAPIKeyUsage(
        req.apiKey.id,
        aiModel.id,
        inputTokens,
        outputTokens,
        'chat'
      );
      console.log('💰 Usage tracked for API key:', {
        customer: req.apiKey.customer_name,
        tokens: usageTracking.tokens_used,
        cost: usageTracking.cost.toFixed(4),
        price: usageTracking.price.toFixed(4)
      });
    } catch (billingError) {
      console.error('❌ Billing tracking error:', billingError.message);
      // Continue without failing the request
    }

    // Response with rate limiting headers
    res.set({
      'X-RateLimit-Limit': req.apiKey.rate_limit_per_minute.toString(),
      'X-RateLimit-Remaining': req.rateLimitInfo.remaining.toString(),
      'X-RateLimit-Reset': req.rateLimitInfo.resetTime.toString(),
      'X-Customer-Name': req.apiKey.customer_name,
      'X-Usage-Tokens': inputTokens + outputTokens,
      'X-Usage-Cost': usageTracking ? usageTracking.price.toFixed(4) : '0.0000'
    });

    res.json({
      id: `msg_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: response.content,
      model: model,
      stop_reason: response.stop_reason,
      stop_sequence: response.stop_sequence,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens
      },
      billing: usageTracking ? {
        tokens_charged: usageTracking.tokens_used,
        amount_charged: usageTracking.price,
        currency: 'USD'
      } : null
    });

  } catch (error) {
    console.error('External Claude API error:', error);
    
    if (error.response?.status === 401) {
      return res.status(500).json({ 
        error: 'Claude API authentication failed. Contact support.' 
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'Claude API rate limit exceeded. Please try again later.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to process request. Please try again.' 
    });
  }
});

// Get API key usage stats (for the customer)
router.get('/usage', authenticateAPIKey, async (req, res) => {
  try {
    const db = require('../db');
    
    // Get current API key stats
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          customer_name, customer_email,
          monthly_spending_limit, current_month_spending,
          total_requests, total_tokens, total_spent,
          rate_limit_per_minute, rate_limit_per_hour,
          created_at, last_used
        FROM api_keys
        WHERE id = ?
      `, [req.apiKey.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Get recent usage (last 30 days)
    const recentUsage = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          DATE(request_timestamp) as date,
          COUNT(*) as requests,
          SUM(total_tokens) as tokens,
          SUM(total_price) as spent,
          am.name as model_name
        FROM api_key_usage aku
        LEFT JOIN ai_models am ON aku.ai_model_id = am.id
        WHERE aku.api_key_id = ?
        AND aku.request_timestamp >= date('now', '-30 days')
        GROUP BY DATE(request_timestamp), am.name
        ORDER BY date DESC
      `, [req.apiKey.id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      account: {
        customer_name: stats.customer_name,
        customer_email: stats.customer_email,
        api_key_created: stats.created_at,
        last_used: stats.last_used
      },
      usage: {
        total_requests: stats.total_requests,
        total_tokens: stats.total_tokens,
        total_spent: parseFloat(stats.total_spent || 0)
      },
      limits: {
        monthly_spending_limit: parseFloat(stats.monthly_spending_limit || 0),
        current_month_spending: parseFloat(stats.current_month_spending || 0),
        rate_limit_per_minute: stats.rate_limit_per_minute,
        rate_limit_per_hour: stats.rate_limit_per_hour
      },
      recent_usage: recentUsage
    });

  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch usage statistics' 
    });
  }
});

// Test endpoint to verify API key
router.get('/test', authenticateAPIKey, (req, res) => {
  res.json({
    success: true,
    message: 'API key is valid and working',
    customer: req.apiKey.customer_name,
    rate_limit: {
      limit: req.apiKey.rate_limit_per_minute,
      remaining: req.rateLimitInfo.remaining
    }
  });
});

module.exports = router;