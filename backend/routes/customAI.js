const express = require('express');
const router = express.Router();
const billingService = require('../services/billingService');
const db = require('../db');

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Create custom AI model
router.post('/models', requireAuth, async (req, res) => {
  try {
    const {
      name,
      provider,
      modelId,
      costPerInputToken,
      costPerOutputToken,
      markupPercentage = 100
    } = req.body;

    // Validate required fields
    if (!name || !provider || !modelId || !costPerInputToken || !costPerOutputToken) {
      return res.status(400).json({ 
        error: 'All fields are required: name, provider, modelId, costPerInputToken, costPerOutputToken' 
      });
    }

    // Calculate prices with markup
    const pricePerInputToken = costPerInputToken * (1 + markupPercentage / 100);
    const pricePerOutputToken = costPerOutputToken * (1 + markupPercentage / 100);

    // Insert new AI model
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO ai_models (
          name, provider, model_id, 
          cost_per_input_token, cost_per_output_token,
          price_per_input_token, price_per_output_token,
          markup_percentage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        name, provider, modelId,
        costPerInputToken, costPerOutputToken,
        pricePerInputToken, pricePerOutputToken,
        markupPercentage
      ], function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });

    res.json({ 
      success: true, 
      message: 'Custom AI model created successfully',
      model: {
        name,
        provider,
        modelId,
        costPerInputToken,
        costPerOutputToken,
        pricePerInputToken,
        pricePerOutputToken,
        markupPercentage
      }
    });
  } catch (error) {
    console.error('Error creating custom AI model:', error);
    res.status(500).json({ error: 'Failed to create custom AI model' });
  }
});

// Get all AI models
router.get('/models', requireAuth, async (req, res) => {
  try {
    const models = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM ai_models 
        WHERE is_active = 1
        ORDER BY provider, name
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ success: true, models });
  } catch (error) {
    console.error('Error fetching AI models:', error);
    res.status(500).json({ error: 'Failed to fetch AI models' });
  }
});

// Update AI model pricing
router.put('/models/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      costPerInputToken,
      costPerOutputToken,
      markupPercentage
    } = req.body;

    if (!costPerInputToken || !costPerOutputToken || markupPercentage === undefined) {
      return res.status(400).json({ 
        error: 'costPerInputToken, costPerOutputToken, and markupPercentage are required' 
      });
    }

    // Calculate new prices
    const pricePerInputToken = costPerInputToken * (1 + markupPercentage / 100);
    const pricePerOutputToken = costPerOutputToken * (1 + markupPercentage / 100);

    // Update model
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE ai_models SET 
          cost_per_input_token = ?,
          cost_per_output_token = ?,
          price_per_input_token = ?,
          price_per_output_token = ?,
          markup_percentage = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        costPerInputToken,
        costPerOutputToken,
        pricePerInputToken,
        pricePerOutputToken,
        markupPercentage,
        id
      ], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ 
      success: true, 
      message: 'AI model pricing updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI model:', error);
    res.status(500).json({ error: 'Failed to update AI model' });
  }
});

// Toggle AI model active status
router.patch('/models/:id/toggle', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE ai_models SET 
          is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [id], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ 
      success: true, 
      message: 'AI model status updated successfully'
    });
  } catch (error) {
    console.error('Error toggling AI model status:', error);
    res.status(500).json({ error: 'Failed to update AI model status' });
  }
});

// Custom AI chat endpoint
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const {
      message,
      modelId,
      maxTokens = 1000,
      systemPrompt = 'You are a helpful AI assistant.',
      temperature = 0.7
    } = req.body;

    const userId = req.session.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!modelId) {
      return res.status(400).json({ error: 'Model ID is required' });
    }

    // Get AI model for billing
    const aiModel = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM ai_models WHERE id = ? AND is_active = 1', 
        [modelId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!aiModel) {
      return res.status(404).json({ error: 'AI model not found or inactive' });
    }

    let response;
    let inputTokens = 0;
    let outputTokens = 0;

    // Route to different AI providers based on model provider
    switch (aiModel.provider) {
      case 'openai':
        response = await callOpenAI(aiModel, message, systemPrompt, maxTokens, temperature);
        inputTokens = response.usage?.prompt_tokens || 0;
        outputTokens = response.usage?.completion_tokens || 0;
        break;
      
      case 'claude':
        response = await callClaude(aiModel, message, systemPrompt, maxTokens);
        inputTokens = response.usage?.input_tokens || 0;
        outputTokens = response.usage?.output_tokens || 0;
        break;
      
      case 'custom':
        response = await callCustomAI(aiModel, message, systemPrompt, maxTokens, temperature);
        // Estimate tokens for custom models (you may want to implement proper counting)
        inputTokens = Math.ceil(message.length / 4); // Rough estimate
        outputTokens = Math.ceil((response.response?.length || 0) / 4);
        break;
      
      default:
        return res.status(400).json({ error: 'Unsupported AI provider' });
    }

    // Track usage for billing
    let billingResult = null;
    try {
      billingResult = await billingService.trackUsage(
        userId,
        aiModel.id,
        inputTokens,
        outputTokens,
        null, // conversationId
        null, // assistantId
        'custom_chat'
      );
      console.log('💰 Custom AI usage tracked for billing:', billingResult);
    } catch (billingError) {
      console.error('❌ Custom AI billing tracking error:', billingError.message);
    }

    res.json({
      success: true,
      response: response.response,
      model: aiModel.name,
      provider: aiModel.provider,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        billing: billingResult ? {
          totalPrice: billingResult.billablePrice,
          freeTierUsed: billingResult.freeTierUsed
        } : null
      }
    });

  } catch (error) {
    console.error('Custom AI chat error:', error);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

// OpenAI API call
async function callOpenAI(model, message, systemPrompt, maxTokens, temperature) {
  const axios = require('axios');
  
  // You would need to store OpenAI API keys in environment or database
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: model.model_id,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: maxTokens,
      temperature
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return {
    response: response.data.choices[0]?.message?.content || '',
    usage: response.data.usage
  };
}

// Claude API call
async function callClaude(model, message, systemPrompt, maxTokens) {
  const axios = require('axios');
  
  // You would need to store Claude API keys in environment or database
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    throw new Error('Claude API key not configured');
  }

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: model.model_id,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        { role: 'user', content: message }
      ]
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    }
  );

  return {
    response: response.data.content[0]?.text || '',
    usage: response.data.usage
  };
}

// Custom AI implementation (your own AI models)
async function callCustomAI(model, message, systemPrompt, maxTokens, temperature) {
  // This is where you would implement your custom AI logic
  // For now, we'll return a mock response
  
  console.log(`🤖 Custom AI Model ${model.name} called with message: ${message.substring(0, 50)}...`);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock response based on the message
  let response = `This is a response from your custom AI model "${model.name}". `;
  
  if (message.toLowerCase().includes('hello')) {
    response += 'Hello! How can I help you today?';
  } else if (message.toLowerCase().includes('price') || message.toLowerCase().includes('cost')) {
    response += 'I can help you with pricing information. What specific pricing details do you need?';
  } else if (message.toLowerCase().includes('help')) {
    response += 'I\'m here to help! You can ask me about our products, services, pricing, or any general questions.';
  } else {
    response += `I understand you're asking about "${message.substring(0, 30)}...". Let me provide you with a helpful response based on my training data.`;
  }
  
  response += `\n\n(Powered by ${model.name} - Custom AI Model)`;
  
  return {
    response,
    usage: null // Custom models may not provide usage stats
  };
}

// Get AI model usage statistics
router.get('/models/:id/stats', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          DATE(created_at) as usage_date,
          COUNT(*) as requests,
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens,
          SUM(total_tokens) as total_tokens,
          SUM(total_cost) as total_cost,
          SUM(total_price) as total_revenue,
          SUM(profit) as total_profit
        FROM ai_usage_tracking
        WHERE ai_model_id = ? 
        AND DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY usage_date DESC
      `, [id, start, end], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Get overall statistics
    const overall = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens,
          SUM(total_tokens) as total_tokens,
          SUM(total_cost) as total_cost,
          SUM(total_price) as total_revenue,
          SUM(profit) as total_profit,
          COUNT(DISTINCT user_id) as unique_users
        FROM ai_usage_tracking
        WHERE ai_model_id = ?
        AND DATE(created_at) BETWEEN ? AND ?
      `, [id, start, end], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({ 
      success: true, 
      dailyStats: stats,
      overallStats: overall
    });
  } catch (error) {
    console.error('Error fetching AI model stats:', error);
    res.status(500).json({ error: 'Failed to fetch AI model statistics' });
  }
});

module.exports = router;