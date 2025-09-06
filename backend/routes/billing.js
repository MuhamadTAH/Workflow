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
    // Return default billing data for new users
    const safeBilling = {
      hasPaymentMethod: false,
      cardLastFour: null,
      cardBrand: null,
      spendingLimit: null, // null = unlimited
      autoBilling: true,
      billingEmail: null
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
    
    // Allow null for unlimited, or validate numeric limits
    if (limit !== null && (limit < 0 || limit > 100000)) {
      return res.status(400).json({ error: 'Invalid spending limit (must be 0-100000 or null for unlimited)' });
    }

    // For testing, just return success without database update
    const displayLimit = limit === null ? 'unlimited' : limit;
    
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
    // Return actual spending data (currently no usage)
    res.json({ 
      currentSpending: 0.00,
      spendingLimit: null, // null = unlimited
      percentage: 0
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

// Get free tier status (no auth required for testing)
router.get('/free-tier', async (req, res) => {
  try {
    // Return default free tier for testing
    res.json({ 
      remainingTokens: 1000,
      totalLimit: 1000
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

module.exports = router;