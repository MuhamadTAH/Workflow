const db = require('../db');

// Rate limiting storage (in production, use Redis)
const rateLimitStorage = new Map();

// Clean old rate limit entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStorage.entries()) {
    if (now - data.resetTime > 60000) { // 1 minute
      rateLimitStorage.delete(key);
    }
  }
}, 60000);

// API Key authentication middleware
async function authenticateAPIKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'API key required. Use: Authorization: Bearer wf_your_api_key' 
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer '

    if (!apiKey.startsWith('wf_')) {
      return res.status(401).json({ 
        error: 'Invalid API key format. Must start with wf_' 
      });
    }

    // Get API key details from database
    const keyDetails = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          id, api_key, customer_name, customer_email,
          rate_limit_per_minute, rate_limit_per_hour,
          monthly_spending_limit, current_month_spending,
          total_requests, is_active, last_used
        FROM api_keys
        WHERE api_key = ?
      `, [apiKey], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!keyDetails) {
      return res.status(401).json({ 
        error: 'Invalid API key' 
      });
    }

    if (!keyDetails.is_active) {
      return res.status(401).json({ 
        error: 'API key is deactivated. Contact support for assistance.' 
      });
    }

    // Check spending limits
    if (keyDetails.monthly_spending_limit && 
        keyDetails.current_month_spending >= keyDetails.monthly_spending_limit) {
      return res.status(429).json({ 
        error: 'Monthly spending limit exceeded. Upgrade your plan or wait for next billing cycle.',
        current_spending: keyDetails.current_month_spending,
        limit: keyDetails.monthly_spending_limit
      });
    }

    // Rate limiting check
    const rateLimitKey = `${apiKey}_rate_limit`;
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);
    
    let rateLimitData = rateLimitStorage.get(rateLimitKey);
    if (!rateLimitData || rateLimitData.minute !== currentMinute) {
      rateLimitData = {
        minute: currentMinute,
        requests: 0,
        resetTime: now
      };
      rateLimitStorage.set(rateLimitKey, rateLimitData);
    }

    rateLimitData.requests++;

    if (rateLimitData.requests > keyDetails.rate_limit_per_minute) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Too many requests per minute.',
        limit: keyDetails.rate_limit_per_minute,
        reset_in_seconds: 60 - (Math.floor(now / 1000) % 60)
      });
    }

    // Update last used timestamp
    db.run(`
      UPDATE api_keys 
      SET last_used = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [keyDetails.id], (err) => {
      if (err) console.error('Error updating last_used:', err);
    });

    // Attach API key details to request
    req.apiKey = keyDetails;
    req.rateLimitInfo = {
      remaining: keyDetails.rate_limit_per_minute - rateLimitData.requests,
      limit: keyDetails.rate_limit_per_minute,
      resetTime: rateLimitData.resetTime + 60000
    };

    console.log('🔑 API Key authenticated:', {
      customer: keyDetails.customer_name,
      key: apiKey.substring(0, 10) + '...',
      remaining_requests: req.rateLimitInfo.remaining
    });

    next();

  } catch (error) {
    console.error('API Key authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed. Please try again.' 
    });
  }
}

// Track API key usage for billing
async function trackAPIKeyUsage(apiKeyId, aiModelId, inputTokens, outputTokens, endpoint) {
  try {
    const totalTokens = inputTokens + outputTokens;
    
    // Get model pricing
    const modelInfo = await new Promise((resolve, reject) => {
      db.get(`
        SELECT price_per_input_token, price_per_output_token 
        FROM ai_models WHERE id = ?
      `, [aiModelId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!modelInfo) {
      throw new Error('Model pricing not found');
    }

    // Calculate costs with markup
    const costPerInputToken = parseFloat(modelInfo.price_per_input_token);
    const costPerOutputToken = parseFloat(modelInfo.price_per_output_token);
    
    const totalCost = (inputTokens * costPerInputToken) + (outputTokens * costPerOutputToken);
    const totalPrice = totalCost * 2; // 100% markup

    // Insert usage record
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO api_key_usage (
          api_key_id, ai_model_id, input_tokens, output_tokens,
          total_tokens, total_price, total_cost, endpoint
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        apiKeyId, aiModelId, inputTokens, outputTokens,
        totalTokens, totalPrice, totalCost, endpoint
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Update API key totals
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE api_keys SET
          total_requests = total_requests + 1,
          total_tokens = total_tokens + ?,
          total_spent = total_spent + ?,
          current_month_spending = current_month_spending + ?
        WHERE id = ?
      `, [totalTokens, totalPrice, totalPrice, apiKeyId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('💰 API Key usage tracked:', {
      api_key_id: apiKeyId,
      tokens: totalTokens,
      cost: totalCost.toFixed(4),
      price: totalPrice.toFixed(4),
      endpoint
    });

    return {
      tokens_used: totalTokens,
      cost: totalCost,
      price: totalPrice,
      markup: totalPrice - totalCost
    };

  } catch (error) {
    console.error('Error tracking API key usage:', error);
    throw error;
  }
}

module.exports = {
  authenticateAPIKey,
  trackAPIKeyUsage
};