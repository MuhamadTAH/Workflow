const express = require('express');
const router = express.Router();
const billingService = require('../services/billingService');
// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get user billing information (no auth required for testing)
router.get('/info', async (req, res) => {
  try {
    const db = require('../db-smart');
    const userId = 2; // Default user ID for testing
    
    // Get user's billing info from database
    const billingInfo = await db.get(`
      SELECT * FROM user_billing WHERE user_id = ?
    `, [userId]);
    
    const safeBilling = {
      hasPaymentMethod: billingInfo ? !!billingInfo.payment_method_id : false,
      cardLastFour: billingInfo ? billingInfo.card_last_four : null,
      cardBrand: billingInfo ? billingInfo.card_brand : null,
      spendingLimit: billingInfo ? billingInfo.spending_limit : null,
      autoBilling: billingInfo ? !!billingInfo.auto_billing : true,
      billingEmail: billingInfo ? billingInfo.billing_email : null
    };

    res.json({ billing: safeBilling });
  } catch (error) {
    console.error('Error getting billing info:', error);
    res.status(500).json({ error: 'Failed to get billing information' });
  }
});

// Create setup intent for adding payment method
router.post('/setup-intent', requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payment processing not configured' });
  }

  try {
    let billing = await billingService.getUserBilling(req.session.userId);
    
    // Create Stripe customer if doesn't exist
    if (!billing || !billing.stripe_customer_id) {
      // Get user info (assuming you have user info in session or database)
      const user = await getUserById(req.session.userId); // You'll need to implement this
      const customer = await billingService.createStripeCustomer(
        req.session.userId, 
        user.email, 
        user.name
      );
      billing = { stripe_customer_id: customer.id };
    }

    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: billing.stripe_customer_id,
      payment_method_types: ['card'],
      usage: 'off_session' // For future payments
    });

    res.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating setup intent:', error);
    res.status(500).json({ error: 'Failed to create setup intent' });
  }
});

// Confirm payment method setup
router.post('/confirm-payment-method', requireAuth, async (req, res) => {
  try {
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'Payment method ID required' });
    }

    const paymentMethod = await billingService.addPaymentMethod(
      req.session.userId, 
      paymentMethodId
    );

    res.json({ 
      success: true, 
      paymentMethod: {
        id: paymentMethod.id,
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year
      }
    });
  } catch (error) {
    console.error('Error confirming payment method:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update spending limit (no auth required for testing)
router.put('/spending-limit', async (req, res) => {
  try {
    const { limit } = req.body;
    const userId = 2; // Default user ID for testing
    
    // Allow null for unlimited, or validate numeric limits
    if (limit !== null && (limit < 0 || limit > 100000)) {
      return res.status(400).json({ error: 'Invalid spending limit (must be 0-100000 or null for unlimited)' });
    }

    const db = require('../db');
    
    // Update or insert user billing record
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO user_billing (user_id, spending_limit, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [userId, limit], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    const displayLimit = limit === null ? 'unlimited' : `$${limit}`;
    
    res.json({ 
      success: true, 
      spendingLimit: limit,
      message: `Spending limit updated to ${displayLimit}`
    });
  } catch (error) {
    console.error('Error updating spending limit:', error);
    res.status(500).json({ error: 'Failed to update spending limit' });
  }
});

// Get usage statistics (no mock data)
router.get('/usage', async (req, res) => {
  try {
    // Return empty usage data for new users
    res.json({ usage: [] });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

// Get current month spending (no mock data)
router.get('/current-spending', async (req, res) => {
  try {
    const db = require('../db');
    const userId = 2; // Default user ID for testing
    
    // Get user's spending limit from database
    const billingInfo = await new Promise((resolve, reject) => {
      db.get(`
        SELECT spending_limit FROM user_billing WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    const spendingLimit = billingInfo ? billingInfo.spending_limit : null;
    const currentSpending = 0.00; // TODO: Calculate actual spending
    const percentage = spendingLimit ? (currentSpending / spendingLimit) * 100 : 0;
    
    res.json({ 
      currentSpending,
      spendingLimit,
      percentage: Math.min(percentage, 100)
    });
  } catch (error) {
    console.error('Error getting current spending:', error);
    res.status(500).json({ error: 'Failed to get current spending' });
  }
});

// Get billing history (mock data for testing)
router.get('/history', async (req, res) => {
  try {
    // Return mock billing history
    const history = [];

    res.json({ history });
  } catch (error) {
    console.error('Error getting billing history:', error);
    res.status(500).json({ error: 'Failed to get billing history' });
  }
});

// Get AI models and pricing (no auth required for testing)
router.get('/models', async (req, res) => {
  try {
    const db = require('../db');
    
    const models = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, name, provider, model_id, price_per_input_token, price_per_output_token, is_active
        FROM ai_models
        WHERE is_active = 1
        ORDER BY name
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ models });
  } catch (error) {
    console.error('Error getting AI models:', error);
    res.status(500).json({ error: 'Failed to get AI models' });
  }
});

// Get AI response count for user
router.get('/response-count', async (req, res) => {
  try {
    const db = require('../db');
    const userId = 2; // Default user ID for testing
    
    // Count total AI responses for this user
    const responseCount = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as total_responses
        FROM ai_usage_tracking 
        WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.total_responses : 0);
      });
    });
    
    // Get response count for current month
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const monthlyCount = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as monthly_responses
        FROM ai_usage_tracking 
        WHERE user_id = ? 
        AND DATE(created_at) >= ? 
        AND DATE(created_at) < DATE(?, '+1 month')
      `, [userId, currentMonth, currentMonth], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.monthly_responses : 0);
      });
    });

    res.json({ 
      totalResponses: responseCount,
      monthlyResponses: monthlyCount
    });
  } catch (error) {
    console.error('Error getting AI response count:', error);
    res.status(500).json({ error: 'Failed to get response count' });
  }
});

// Get free tier status (no auth required for testing)
router.get('/free-tier', async (req, res) => {
  try {
    const db = require('../db');
    const userId = 2; // Default user ID for testing
    
    // Get user's free tier data from database
    const freeTier = await new Promise((resolve, reject) => {
      db.get(`
        SELECT free_tokens_used, free_tokens_limit, is_active, reset_date
        FROM user_free_tier 
        WHERE user_id = ? AND is_active = 1
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!freeTier) {
      // Create new free tier record if doesn't exist
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1, 1); // First day of next month
      
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO user_free_tier (user_id, free_tokens_used, free_tokens_limit, reset_date)
          VALUES (?, 0, 1000, ?)
        `, [userId, resetDate.toISOString().split('T')[0]], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      
      return res.json({ 
        remainingTokens: 1000,
        totalLimit: 1000
      });
    }

    // Check if free tier has reset (monthly)
    const now = new Date();
    const resetDate = new Date(freeTier.reset_date);
    
    if (now >= resetDate) {
      // Reset free tier
      const nextResetDate = new Date(resetDate);
      nextResetDate.setMonth(nextResetDate.getMonth() + 1);
      
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE user_free_tier 
          SET free_tokens_used = 0, reset_date = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [nextResetDate.toISOString().split('T')[0], userId], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
      
      freeTier.free_tokens_used = 0;
    }

    const remainingTokens = Math.max(0, freeTier.free_tokens_limit - freeTier.free_tokens_used);
    
    res.json({ 
      remainingTokens,
      totalLimit: freeTier.free_tokens_limit
    });
  } catch (error) {
    console.error('Error getting free tier status:', error);
    res.status(500).json({ error: 'Failed to get free tier status' });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'invoice.payment_succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      // Update billing status in database
      break;
    case 'invoice.payment_failed':
      console.log('Payment failed:', event.data.object.id);
      // Handle failed payment, disable services if needed
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription cancelled:', event.data.object.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// Helper function to get user by ID (implement based on your user model)
async function getUserById(userId) {
  return new Promise((resolve, reject) => {
    const db = require('../db');
    db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
      if (err) reject(err);
      else resolve(user);
    });
  });
}

// Debug endpoint to check model lookup
router.get('/debug-model-lookup/:modelName', async (req, res) => {
  try {
    const { modelName } = req.params;
    const db = require('../db');
    
    const aiModel = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_models 
        WHERE (name = ? OR model_id = ?) AND is_active = 1
      `, [modelName, modelName], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({
      searchTerm: modelName,
      found: !!aiModel,
      model: aiModel
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      searchTerm: req.params.modelName
    });
  }
});

// Test endpoint to manually trigger billing
router.post('/test-track-usage', async (req, res) => {
  try {
    const billingService = require('../services/billingService');
    
    // Get Claude model for testing
    const db = require('../db');
    const aiModel = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_models 
        WHERE model_id = 'claude-3-5-sonnet-20241022' AND is_active = 1
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!aiModel) {
      return res.status(404).json({
        success: false,
        error: 'Claude model not found in database'
      });
    }

    // Test billing with 50 tokens
    const billingResult = await billingService.trackUsage(
      2,           // Your user ID
      aiModel.id,  // Claude model ID
      30,          // Input tokens (test)
      20,          // Output tokens (test)  
      null,        // conversationId
      null,        // assistantId
      'test_usage' // usage type
    );

    res.json({
      success: true,
      message: 'Test billing tracked successfully',
      billingResult: billingResult,
      aiModel: {
        id: aiModel.id,
        name: aiModel.name
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

// Manual endpoint to insert missing AI models
router.post('/fix-missing-models', async (req, res) => {
  try {
    const db = require('../db');
    
    // Insert the Claude model that's being used for WhatsApp
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO ai_models 
        (name, provider, model_id, cost_per_input_token, cost_per_output_token, 
         price_per_input_token, price_per_output_token, markup_percentage, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `, [
        'Claude Sonnet',
        'claude', 
        'claude-3-5-sonnet-20241022',
        0.000003, // $3 per 1M input tokens
        0.000015, // $15 per 1M output tokens  
        0.000006, // $6 per 1M input tokens (2x markup)
        0.000030, // $30 per 1M output tokens (2x markup)
        100.00
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
    
    // Verify the model was inserted
    const insertedModel = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_models 
        WHERE model_id = 'claude-3-5-sonnet-20241022'
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    res.json({
      success: true,
      message: 'Claude model inserted successfully',
      model: insertedModel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Database health check endpoint
router.get('/db-health', async (req, res) => {
  try {
    const DatabaseInitializer = require('../services/dbInitializer');
    const healthCheck = await DatabaseInitializer.healthCheck();
    
    res.json({
      success: true,
      ...healthCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      healthy: false,
      error: error.message
    });
  }
});

// Debug endpoint to check user and usage data
router.get('/debug-user-data', async (req, res) => {
  try {
    const db = require('../db');
    const userId = 2;
    
    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Get AI usage tracking count
    const usageCount = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as total_records, 
               MIN(created_at) as oldest_record,
               MAX(created_at) as newest_record
        FROM ai_usage_tracking 
        WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    // Get recent usage records
    const recentUsage = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, ai_model_id, request_type, input_tokens, output_tokens, 
               created_at, billing_status
        FROM ai_usage_tracking 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 5
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    // Get free tier data
    const freeTier = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM user_free_tier WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    res.json({
      userId,
      userExists: !!user,
      user: user,
      usageStats: usageCount,
      recentUsage: recentUsage,
      freeTier: freeTier,
      debugTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;