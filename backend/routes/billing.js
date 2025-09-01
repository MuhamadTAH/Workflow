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

// Get user billing information
router.get('/info', requireAuth, async (req, res) => {
  try {
    const billing = await billingService.getUserBilling(req.session.userId);
    
    // Don't expose sensitive information
    const safeBilling = billing ? {
      hasPaymentMethod: !!billing.payment_method_id,
      cardLastFour: billing.card_last_four,
      cardBrand: billing.card_brand,
      spendingLimit: billing.spending_limit,
      autoBilling: billing.auto_billing,
      billingEmail: billing.billing_email
    } : null;

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

// Update spending limit
router.put('/spending-limit', requireAuth, async (req, res) => {
  try {
    const { limit } = req.body;
    
    if (!limit || limit < 0 || limit > 10000) {
      return res.status(400).json({ error: 'Invalid spending limit (must be 0-10000)' });
    }

    const db = require('../db');
    
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE user_billing 
        SET spending_limit = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `, [limit, req.session.userId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true, spendingLimit: limit });
  } catch (error) {
    console.error('Error updating spending limit:', error);
    res.status(500).json({ error: 'Failed to update spending limit' });
  }
});

// Get usage statistics
router.get('/usage', requireAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const stats = await billingService.getUserUsageStats(req.session.userId, start, end);
    
    res.json({ usage: stats });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

// Get current month spending
router.get('/current-spending', requireAuth, async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    const spending = await billingService.getMonthlySpending(req.session.userId, currentMonth);
    const billing = await billingService.getUserBilling(req.session.userId);
    
    res.json({ 
      currentSpending: spending,
      spendingLimit: billing?.spending_limit || 100,
      percentage: billing?.spending_limit ? (spending / billing.spending_limit) * 100 : 0
    });
  } catch (error) {
    console.error('Error getting current spending:', error);
    res.status(500).json({ error: 'Failed to get current spending' });
  }
});

// Get billing history
router.get('/history', requireAuth, async (req, res) => {
  try {
    const db = require('../db');
    
    const history = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          billing_month,
          total_requests,
          total_tokens,
          total_amount,
          billing_status,
          invoice_url,
          paid_at,
          created_at
        FROM monthly_billing_summaries
        WHERE user_id = ?
        ORDER BY billing_month DESC
        LIMIT 12
      `, [req.session.userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

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
        SELECT id, name, provider, price_per_input_token, price_per_output_token, is_active
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

module.exports = router;