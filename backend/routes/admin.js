const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all users' token usage (admin endpoint)
router.get('/user-usage', async (req, res) => {
  try {
    const userUsage = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.user_id,
          u.input_tokens,
          u.output_tokens,
          u.total_tokens,
          u.total_price,
          u.created_at,
          am.name as model_name,
          'user_' || u.user_id as user_identifier
        FROM ai_usage_tracking u
        LEFT JOIN ai_models am ON u.ai_model_id = am.id
        ORDER BY u.created_at DESC
        LIMIT 100
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // Group by user
    const userTotals = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          user_id,
          COUNT(*) as total_requests,
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens,
          SUM(total_tokens) as total_tokens,
          SUM(total_price) as total_spent,
          MAX(created_at) as last_used
        FROM ai_usage_tracking
        GROUP BY user_id
        ORDER BY total_spent DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      recentUsage: userUsage,
      userTotals: userTotals
    });
  } catch (error) {
    console.error('Error getting user usage:', error);
    res.status(500).json({ error: 'Failed to get user usage' });
  }
});

// Get specific user's detailed usage
router.get('/user-usage/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDetails = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          u.*,
          am.name as model_name,
          am.provider
        FROM ai_usage_tracking u
        LEFT JOIN ai_models am ON u.ai_model_id = am.id
        WHERE u.user_id = ?
        ORDER BY u.created_at DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({ userUsage: userDetails });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
});

// Get live usage stats (refreshes automatically)
router.get('/live-stats', async (req, res) => {
  try {
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_requests_today,
          SUM(total_tokens) as total_tokens_today,
          SUM(total_price) as total_revenue_today,
          SUM(total_cost) as total_cost_today,
          (SUM(total_price) - SUM(total_cost)) as profit_today,
          COUNT(DISTINCT user_id) as active_users_today
        FROM ai_usage_tracking
        WHERE DATE(created_at) = DATE('now')
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json(stats);
  } catch (error) {
    console.error('Error getting live stats:', error);
    res.status(500).json({ error: 'Failed to get live stats' });
  }
});

module.exports = router;