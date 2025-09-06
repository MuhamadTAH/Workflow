const db = require('../db');

class BillingService {
  constructor() {
    // Initialize Stripe only if API key is provided
    if (process.env.STRIPE_SECRET_KEY) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      this.stripe = stripe;
    } else {
      console.log('⚠️  Stripe API key not provided - payment processing disabled');
      this.stripe = null;
    }
  }

  // Initialize Stripe customer for user
  async createStripeCustomer(userId, email, name) {
    if (!this.stripe) {
      throw new Error('Stripe not configured - payment processing unavailable');
    }
    
    try {
      const customer = await this.stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          user_id: userId.toString()
        }
      });

      // Update user_billing table
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO user_billing (user_id, stripe_customer_id, billing_email)
          VALUES (?, ?, ?)
        `, [userId, customer.id, email], function(err) {
          if (err) reject(err);
          else resolve(customer);
        });
      });
    } catch (error) {
      throw new Error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  // Add payment method to customer
  async addPaymentMethod(userId, paymentMethodId) {
    try {
      // Get user's Stripe customer ID
      const billing = await this.getUserBilling(userId);
      if (!billing || !billing.stripe_customer_id) {
        throw new Error('User does not have a Stripe customer account');
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: billing.stripe_customer_id,
      });

      // Set as default payment method
      await this.stripe.customers.update(billing.stripe_customer_id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Get payment method details
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);
      
      // Update database
      return new Promise((resolve, reject) => {
        db.run(`
          UPDATE user_billing 
          SET payment_method_id = ?, card_last_four = ?, card_brand = ?, 
              card_exp_month = ?, card_exp_year = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `, [
          paymentMethodId,
          paymentMethod.card.last4,
          paymentMethod.card.brand,
          paymentMethod.card.exp_month,
          paymentMethod.card.exp_year,
          userId
        ], function(err) {
          if (err) reject(err);
          else resolve(paymentMethod);
        });
      });
    } catch (error) {
      throw new Error(`Failed to add payment method: ${error.message}`);
    }
  }

  // Get user billing information
  async getUserBilling(userId) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM user_billing WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Track AI usage and calculate billing
  async trackUsage(userId, aiModelId, inputTokens, outputTokens, conversationId = null, assistantId = null, requestType = 'chat') {
    try {
      // Get AI model pricing
      const model = await this.getAiModel(aiModelId);
      if (!model) {
        throw new Error('AI model not found');
      }

      // Calculate costs and prices
      const costInput = inputTokens * model.cost_per_input_token;
      const costOutput = outputTokens * model.cost_per_output_token;
      const priceInput = inputTokens * model.price_per_input_token;
      const priceOutput = outputTokens * model.price_per_output_token;
      
      const totalCost = costInput + costOutput;
      const totalPrice = priceInput + priceOutput;
      const profit = totalPrice - totalCost;
      const totalTokens = inputTokens + outputTokens;

      // Check if user has free tier credits
      const freeTierUsage = await this.checkFreeTier(userId, totalTokens);
      
      // Calculate actual billable amount (after free tier)
      const billableTokens = Math.max(0, totalTokens - freeTierUsage.remainingTokens);
      const billableRatio = billableTokens / totalTokens;
      const billablePrice = totalPrice * billableRatio;

      // Insert usage record
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO ai_usage_tracking (
            user_id, ai_model_id, conversation_id, assistant_id, request_type,
            input_tokens, output_tokens, total_tokens,
            cost_input, cost_output, price_input, price_output,
            total_cost, total_price, profit
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId, aiModelId, conversationId, assistantId, requestType,
          inputTokens, outputTokens, totalTokens,
          costInput, costOutput, priceInput, priceOutput,
          totalCost, billablePrice, profit * billableRatio
        ], function(err) {
          if (err) {
            reject(err);
          } else {
            // Update free tier usage
            if (freeTierUsage.tokensToDeduct > 0) {
              db.run(`
                UPDATE user_free_tier 
                SET free_tokens_used = free_tokens_used + ?, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
              `, [freeTierUsage.tokensToDeduct, userId]);
            }

            resolve({
              usageId: this.lastID,
              totalTokens,
              billablePrice,
              freeTierUsed: freeTierUsage.tokensToDeduct
            });
          }
        });
      }).then(result => {
        // Check spending limits and send alerts (run async without blocking)
        this.checkSpendingLimits(userId).catch(err => {
          console.error('Error checking spending limits:', err);
        });
        return result;
      });
    } catch (error) {
      throw new Error(`Failed to track usage: ${error.message}`);
    }
  }

  // Get AI model by ID
  async getAiModel(modelId) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_models WHERE id = ? AND is_active = 1
      `, [modelId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Check free tier availability
  async checkFreeTier(userId, tokensNeeded) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM user_free_tier WHERE user_id = ? AND is_active = 1
      `, [userId], (err, freeTier) => {
        if (err) {
          reject(err);
          return;
        }

        // Create free tier record if doesn't exist
        if (!freeTier) {
          const resetDate = new Date();
          resetDate.setMonth(resetDate.getMonth() + 1, 1); // First day of next month
          
          db.run(`
            INSERT INTO user_free_tier (user_id, reset_date)
            VALUES (?, ?)
          `, [userId, resetDate.toISOString().split('T')[0]], function(insertErr) {
            if (insertErr) {
              reject(insertErr);
            } else {
              resolve({
                remainingTokens: 1000,
                tokensToDeduct: Math.min(tokensNeeded, 1000)
              });
            }
          });
          return;
        }

        // Check if free tier has reset
        const now = new Date();
        const resetDate = new Date(freeTier.reset_date);
        
        if (now >= resetDate) {
          // Reset free tier
          const nextResetDate = new Date(resetDate);
          nextResetDate.setMonth(nextResetDate.getMonth() + 1);
          
          db.run(`
            UPDATE user_free_tier 
            SET free_tokens_used = 0, reset_date = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
          `, [nextResetDate.toISOString().split('T')[0], userId]);
          
          freeTier.free_tokens_used = 0;
        }

        const remainingTokens = Math.max(0, freeTier.free_tokens_limit - freeTier.free_tokens_used);
        const tokensToDeduct = Math.min(tokensNeeded, remainingTokens);

        resolve({
          remainingTokens,
          tokensToDeduct
        });
      });
    });
  }

  // Check spending limits and send alerts
  async checkSpendingLimits(userId) {
    try {
      const billing = await this.getUserBilling(userId);
      if (!billing || !billing.spending_limit) return;

      // Get current month spending
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      const monthlySpending = await this.getMonthlySpending(userId, currentMonth);

      const spendingPercentage = (monthlySpending / billing.spending_limit) * 100;

      // Send alerts at 50%, 75%, 90%, and 100%
      const alertThresholds = [50, 75, 90, 100];
      
      for (const threshold of alertThresholds) {
        if (spendingPercentage >= threshold) {
          await this.sendSpendingAlert(userId, threshold, monthlySpending, billing.spending_limit);
        }
      }
    } catch (error) {
      console.error('Error checking spending limits:', error);
    }
  }

  // Get monthly spending for user
  async getMonthlySpending(userId, month) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT COALESCE(SUM(total_price), 0) as total_spending
        FROM ai_usage_tracking 
        WHERE user_id = ? AND DATE(created_at) >= ? 
        AND DATE(created_at) < DATE(?, '+1 month')
      `, [userId, month, month], (err, row) => {
        if (err) reject(err);
        else resolve(row.total_spending || 0);
      });
    });
  }

  // Send spending alert
  async sendSpendingAlert(userId, threshold, currentAmount, spendingLimit) {
    // Check if alert already sent for this threshold this month
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT id FROM user_spending_alerts 
        WHERE user_id = ? AND threshold_percentage = ? 
        AND billing_month = ? AND alert_sent = 1
      `, [userId, threshold, currentMonth], (err, existingAlert) => {
        if (err) {
          reject(err);
          return;
        }

        if (existingAlert) {
          resolve(); // Alert already sent
          return;
        }

        // Insert new alert
        db.run(`
          INSERT INTO user_spending_alerts (
            user_id, alert_type, threshold_percentage, 
            current_amount, spending_limit, billing_month, alert_sent, sent_at
          ) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        `, [
          userId, 'threshold', threshold, 
          currentAmount, spendingLimit, currentMonth
        ], function(insertErr) {
          if (insertErr) reject(insertErr);
          else {
            // Here you would send actual email/notification
            console.log(`📧 Spending alert sent to user ${userId}: ${threshold}% of limit reached`);
            resolve();
          }
        });
      });
    });
  }

  // Process monthly billing
  async processMonthlyBilling(userId, billingMonth) {
    try {
      const billing = await this.getUserBilling(userId);
      if (!billing || !billing.stripe_customer_id || !billing.payment_method_id) {
        throw new Error('User billing not properly configured');
      }

      // Calculate monthly usage
      const monthlyUsage = await this.calculateMonthlyUsage(userId, billingMonth);
      
      if (monthlyUsage.total_amount <= 0) {
        console.log(`No charges for user ${userId} in ${billingMonth}`);
        return;
      }

      // Create Stripe invoice
      const invoice = await this.stripe.invoices.create({
        customer: billing.stripe_customer_id,
        description: `AI Usage for ${billingMonth}`,
        metadata: {
          user_id: userId.toString(),
          billing_month: billingMonth
        }
      });

      // Add line item
      await this.stripe.invoiceItems.create({
        customer: billing.stripe_customer_id,
        invoice: invoice.id,
        amount: Math.round(monthlyUsage.total_amount * 100), // Convert to cents
        currency: 'usd',
        description: `AI API Usage - ${monthlyUsage.total_requests} requests, ${monthlyUsage.total_tokens} tokens`
      });

      // Finalize and pay invoice
      const finalizedInvoice = await this.stripe.invoices.finalizeInvoice(invoice.id);
      const paidInvoice = await this.stripe.invoices.pay(invoice.id);

      // Update billing summary
      await this.updateBillingSummary(userId, billingMonth, monthlyUsage, paidInvoice);

      return paidInvoice;
    } catch (error) {
      throw new Error(`Failed to process monthly billing: ${error.message}`);
    }
  }

  // Calculate monthly usage
  async calculateMonthlyUsage(userId, billingMonth) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens,
          SUM(total_tokens) as total_tokens,
          SUM(total_cost) as total_cost,
          SUM(total_price) as total_amount,
          SUM(profit) as total_profit,
          ai_model_id,
          COUNT(*) as model_requests
        FROM ai_usage_tracking
        WHERE user_id = ? 
        AND DATE(created_at) >= ? 
        AND DATE(created_at) < DATE(?, '+1 month')
        AND billing_status = 'pending'
        GROUP BY ai_model_id
      `, [userId, billingMonth, billingMonth], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        // Aggregate totals
        const totals = rows.reduce((acc, row) => ({
          total_requests: acc.total_requests + row.total_requests,
          total_input_tokens: acc.total_input_tokens + (row.total_input_tokens || 0),
          total_output_tokens: acc.total_output_tokens + (row.total_output_tokens || 0),
          total_tokens: acc.total_tokens + (row.total_tokens || 0),
          total_cost: acc.total_cost + (row.total_cost || 0),
          total_amount: acc.total_amount + (row.total_amount || 0),
          total_profit: acc.total_profit + (row.total_profit || 0)
        }), {
          total_requests: 0,
          total_input_tokens: 0,
          total_output_tokens: 0,
          total_tokens: 0,
          total_cost: 0,
          total_amount: 0,
          total_profit: 0
        });

        totals.breakdown_by_model = JSON.stringify(rows);
        resolve(totals);
      });
    });
  }

  // Update billing summary
  async updateBillingSummary(userId, billingMonth, monthlyUsage, invoice) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO monthly_billing_summaries (
          user_id, billing_month, total_requests, total_input_tokens, 
          total_output_tokens, total_tokens, total_cost, total_amount, 
          total_profit, breakdown_by_model, billing_status, 
          stripe_invoice_id, invoice_url, paid_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, billingMonth, monthlyUsage.total_requests,
        monthlyUsage.total_input_tokens, monthlyUsage.total_output_tokens,
        monthlyUsage.total_tokens, monthlyUsage.total_cost,
        monthlyUsage.total_amount, monthlyUsage.total_profit,
        monthlyUsage.breakdown_by_model, 'paid',
        invoice.id, invoice.hosted_invoice_url, new Date().toISOString()
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          // Mark usage records as billed
          db.run(`
            UPDATE ai_usage_tracking 
            SET billing_status = 'billed', billed_at = CURRENT_TIMESTAMP
            WHERE user_id = ? 
            AND DATE(created_at) >= ? 
            AND DATE(created_at) < DATE(?, '+1 month')
            AND billing_status = 'pending'
          `, [userId, billingMonth, billingMonth]);
          
          resolve();
        }
      });
    });
  }

  // Get user usage statistics
  async getUserUsageStats(userId, startDate, endDate) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          DATE(created_at) as usage_date,
          COUNT(*) as requests,
          SUM(total_tokens) as tokens,
          SUM(total_price) as amount,
          ai_model_id
        FROM ai_usage_tracking
        WHERE user_id = ? AND DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at), ai_model_id
        ORDER BY usage_date DESC
      `, [userId, startDate, endDate], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = new BillingService();