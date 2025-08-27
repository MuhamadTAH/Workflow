/*
=================================================================
AI ASSISTANT ADVANCED FEATURES - Extended API Routes
=================================================================
Advanced capabilities for the AI Assistant system including:
- Multi-language support
- Conversation analytics
- A/B testing for prompts
- Human handoff system
- Bulk operations
- Advanced file processing
*/

const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// JWT verification middleware (reuse from main routes)
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    if (token.startsWith('MOCK_TOKEN_FOR_TESTING_')) {
      req.user = { userId: 'test-user-1', email: 'mhamadtah548@gmail.com', mock: true };
      return next();
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// =================================================================
// ADVANCED ANALYTICS & REPORTING
// =================================================================

// GET /api/ai-assistant/analytics/overview - Dashboard Overview
// Frontend: Main dashboard analytics section
router.get('/analytics/overview', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30 } = req.query;

    // Get all user's assistants
    const assistants = await new Promise((resolve, reject) => {
      db.all(`
        SELECT id, name, status, total_conversations, successful_responses, 
               failed_responses, created_at
        FROM ai_assistants 
        WHERE user_id = ?
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Get conversation trends
    const conversationTrends = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          DATE(ac.created_at) as date,
          COUNT(*) as total_conversations,
          SUM(CASE WHEN ac.success = 1 THEN 1 ELSE 0 END) as successful,
          AVG(ac.response_time_ms) as avg_response_time
        FROM ai_conversations ac
        INNER JOIN ai_assistants aa ON ac.assistant_id = aa.id
        WHERE aa.user_id = ? 
        AND ac.created_at >= datetime('now', '-${days} days')
        GROUP BY DATE(ac.created_at)
        ORDER BY date DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Get top performing assistants
    const topAssistants = assistants
      .filter(a => a.total_conversations > 0)
      .map(a => ({
        ...a,
        success_rate: Math.round((a.successful_responses / a.total_conversations) * 100)
      }))
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 5);

    // Calculate totals
    const totalStats = assistants.reduce((acc, assistant) => ({
      total_assistants: acc.total_assistants + 1,
      active_assistants: acc.active_assistants + (assistant.status === 'active' ? 1 : 0),
      total_conversations: acc.total_conversations + assistant.total_conversations,
      successful_responses: acc.successful_responses + assistant.successful_responses,
      failed_responses: acc.failed_responses + assistant.failed_responses
    }), {
      total_assistants: 0,
      active_assistants: 0,
      total_conversations: 0,
      successful_responses: 0,
      failed_responses: 0
    });

    totalStats.overall_success_rate = totalStats.total_conversations > 0 
      ? Math.round((totalStats.successful_responses / totalStats.total_conversations) * 100)
      : 0;

    res.json({
      success: true,
      analytics: {
        overview: totalStats,
        trends: conversationTrends,
        top_assistants: topAssistants,
        period: `Last ${days} days`
      }
    });

  } catch (error) {
    console.error('❌ Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/ai-assistant/analytics/export - Export Analytics Data
// Frontend: "Export Data" button in analytics
router.get('/analytics/export', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { format = 'json', days = 30 } = req.query;

    // Get detailed conversation data
    const conversations = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          aa.name as assistant_name,
          ac.customer_name,
          ac.message_text,
          ac.response_text,
          ac.response_time_ms,
          ac.success,
          ac.ai_model_used,
          ac.created_at
        FROM ai_conversations ac
        INNER JOIN ai_assistants aa ON ac.assistant_id = aa.id
        WHERE aa.user_id = ? 
        AND ac.created_at >= datetime('now', '-${days} days')
        ORDER BY ac.created_at DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    if (format === 'csv') {
      // Convert to CSV
      const csv = [
        'Assistant,Customer,Message,Response,Response Time (ms),Success,AI Model,Date',
        ...conversations.map(row => [
          `"${row.assistant_name}"`,
          `"${row.customer_name || 'Unknown'}"`,
          `"${row.message_text.replace(/"/g, '""')}"`,
          `"${(row.response_text || '').replace(/"/g, '""')}"`,
          row.response_time_ms || 0,
          row.success ? 'Yes' : 'No',
          `"${row.ai_model_used || 'Unknown'}"`,
          `"${row.created_at}"`
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ai_assistant_analytics_${days}days.csv"`);
      res.send(csv);
    } else {
      // Return JSON
      res.json({
        success: true,
        export_data: {
          conversations,
          export_date: new Date().toISOString(),
          period: `Last ${days} days`,
          total_records: conversations.length
        }
      });
    }

  } catch (error) {
    console.error('❌ Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =================================================================
// MULTI-LANGUAGE SUPPORT
// =================================================================

// POST /api/ai-assistant/:id/detect-language - Auto-detect customer language
// Frontend: Language detection indicator in live chat
router.post('/:id/detect-language', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;
    const { text } = req.body;

    // Simple language detection (in production, use a proper language detection library)
    const detectLanguage = (text) => {
      const patterns = {
        'ar': /[\u0600-\u06FF]/,  // Arabic
        'es': /\b(el|la|es|en|un|una|que|de|a|y|se|no|te|lo|le|da|su|por|son|con|para|al|ha|si|todo|pero|más|hacer|muy|sin|puede|hasta|cada|esto|tiene|le|tanto|año|dos|ese|estar|este|cuando|algo|tiempo|él)\b/i,
        'fr': /\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|plus|pouvoir|par|je|son|que|qui|lui|bien|deux|même|ainsi|faire|mon|sans)\b/i,
        'de': /\b(der|die|das|und|in|den|von|zu|mit|sich|auf|für|ist|im|dem|nicht|ein|eine|als|auch|es|an|werden|aus|er|hat|dass|sie|nach|wird|bei|noch|wie|einem|über|einen|so)\b/i,
        'it': /\b(il|di|che|e|la|per|un|in|è|a|sono|si|da|sua|le|con|ma|se|non|dei|nel|al|può|più|essere|questo|alla|molto|tutti|anni|anche|sua|suo|loro|stato|quanto|anche)\b/i,
        'pt': /\b(de|a|o|que|e|do|da|em|para|é|com|não|uma|os|no|se|na|por|mais|as|dos|como|mas|foi|ao|ele|das|tem|à|seu|sua|ou|ser|quando|muito|há|nos|já|está|eu|também)\b/i,
        'ru': /[\u0400-\u04FF]/,  // Cyrillic
        'zh': /[\u4e00-\u9fff]/,  // Chinese
        'ja': /[\u3040-\u309f\u30a0-\u30ff]/,  // Japanese
        'ko': /[\uac00-\ud7af]/   // Korean
      };

      for (const [lang, pattern] of Object.entries(patterns)) {
        if (pattern.test(text)) {
          return lang;
        }
      }
      
      return 'en'; // Default to English
    };

    const detectedLanguage = detectLanguage(text);

    // Store language preference for this customer
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO customer_preferences 
        (assistant_id, customer_id, language, detected_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `, [assistantId, req.body.customer_id, detectedLanguage], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      detected_language: detectedLanguage,
      confidence: text.length > 20 ? 'high' : 'medium'
    });

  } catch (error) {
    console.error('❌ Error detecting language:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =================================================================
// HUMAN HANDOFF SYSTEM
// =================================================================

// POST /api/ai-assistant/:id/handoff - Transfer conversation to human
// Frontend: "Transfer to Human" button in live chat
router.post('/:id/handoff', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;
    const { customer_id, reason, message_history } = req.body;

    // Create handoff record
    const handoffId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO conversation_handoffs 
        (assistant_id, customer_id, reason, message_history, status, requested_at)
        VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `, [assistantId, customer_id, reason, JSON.stringify(message_history)], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Pause AI responses for this customer
    await new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO ai_paused_customers
        (assistant_id, customer_id, paused_at, reason)
        VALUES (?, ?, CURRENT_TIMESTAMP, 'human_handoff')
      `, [assistantId, customer_id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Send handoff notification to customer
    const notificationMessage = "I'm connecting you with a human agent who can better assist you. Please wait a moment.";
    
    // Get assistant's telegram token for notification
    const assistant = await new Promise((resolve, reject) => {
      db.get('SELECT telegram_token FROM ai_assistants WHERE id = ? AND user_id = ?',
        [assistantId, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (assistant && assistant.telegram_token) {
      try {
        const fetch = require('node-fetch');
        await fetch(`https://api.telegram.org/bot${assistant.telegram_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: customer_id,
            text: notificationMessage
          })
        });
      } catch (telegramError) {
        console.error('⚠️ Warning: Failed to send handoff notification:', telegramError);
      }
    }

    res.json({
      success: true,
      handoff_id: handoffId,
      message: 'Conversation transferred to human agent queue',
      status: 'pending'
    });

  } catch (error) {
    console.error('❌ Error creating handoff:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/ai-assistant/handoffs - Get pending handoffs
// Frontend: Human agent dashboard
router.get('/handoffs', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status = 'pending' } = req.query;

    const handoffs = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          ch.id,
          ch.customer_id,
          ch.reason,
          ch.message_history,
          ch.status,
          ch.requested_at,
          ch.assigned_to,
          aa.name as assistant_name
        FROM conversation_handoffs ch
        INNER JOIN ai_assistants aa ON ch.assistant_id = aa.id
        WHERE aa.user_id = ? AND ch.status = ?
        ORDER BY ch.requested_at ASC
      `, [userId, status], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      handoffs: handoffs.map(h => ({
        ...h,
        message_history: h.message_history ? JSON.parse(h.message_history) : []
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching handoffs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =================================================================
// A/B TESTING FOR PROMPTS
// =================================================================

// POST /api/ai-assistant/:id/ab-test - Create A/B test for system prompts
// Frontend: "Start A/B Test" button in prompt editor
router.post('/:id/ab-test', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;
    const {
      test_name,
      prompt_a, // Current prompt
      prompt_b, // New prompt to test
      traffic_split = 50, // Percentage for prompt B
      duration_days = 7
    } = req.body;

    // Verify assistant ownership
    const assistant = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM ai_assistants WHERE id = ? AND user_id = ?',
        [assistantId, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'AI assistant not found'
      });
    }

    // Create A/B test record
    const testId = await new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO prompt_ab_tests 
        (assistant_id, test_name, prompt_a, prompt_b, traffic_split, 
         duration_days, status, started_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `, [assistantId, test_name, prompt_a, prompt_b, traffic_split, duration_days], 
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    res.json({
      success: true,
      ab_test: {
        id: testId,
        test_name,
        traffic_split,
        duration_days,
        status: 'active',
        started_at: new Date().toISOString()
      },
      message: 'A/B test started successfully'
    });

  } catch (error) {
    console.error('❌ Error creating A/B test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/ai-assistant/:id/ab-test/results - Get A/B test results
// Frontend: A/B test results dashboard
router.get('/:id/ab-test/results', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.id;
    const userId = req.user.userId;

    // Get active A/B test
    const abTest = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM prompt_ab_tests 
        WHERE assistant_id = ? AND status = 'active'
        ORDER BY started_at DESC LIMIT 1
      `, [assistantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!abTest) {
      return res.json({
        success: true,
        ab_test: null,
        message: 'No active A/B test found'
      });
    }

    // Get results for each prompt variant
    const results = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          prompt_variant,
          COUNT(*) as total_conversations,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_responses,
          AVG(response_time_ms) as avg_response_time,
          AVG(CASE WHEN customer_rating IS NOT NULL THEN customer_rating ELSE NULL END) as avg_rating
        FROM ai_conversations 
        WHERE assistant_id = ? 
        AND created_at >= ?
        AND prompt_variant IN ('A', 'B')
        GROUP BY prompt_variant
      `, [assistantId, abTest.started_at], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const processedResults = {
      A: { conversations: 0, success_rate: 0, avg_response_time: 0, avg_rating: 0 },
      B: { conversations: 0, success_rate: 0, avg_response_time: 0, avg_rating: 0 }
    };

    results.forEach(result => {
      const variant = result.prompt_variant;
      processedResults[variant] = {
        conversations: result.total_conversations,
        success_rate: result.total_conversations > 0 
          ? Math.round((result.successful_responses / result.total_conversations) * 100)
          : 0,
        avg_response_time: Math.round(result.avg_response_time || 0),
        avg_rating: Math.round((result.avg_rating || 0) * 10) / 10
      };
    });

    // Calculate statistical significance (simplified)
    const totalA = processedResults.A.conversations;
    const totalB = processedResults.B.conversations;
    const minSampleSize = 30;
    
    const isSignificant = totalA >= minSampleSize && totalB >= minSampleSize &&
      Math.abs(processedResults.A.success_rate - processedResults.B.success_rate) >= 5;

    res.json({
      success: true,
      ab_test: {
        ...abTest,
        results: processedResults,
        is_significant: isSignificant,
        total_samples: totalA + totalB,
        days_running: Math.floor((Date.now() - new Date(abTest.started_at)) / (1000 * 60 * 60 * 24)),
        recommendation: processedResults.B.success_rate > processedResults.A.success_rate 
          ? 'Use Prompt B' 
          : 'Keep Prompt A'
      }
    });

  } catch (error) {
    console.error('❌ Error fetching A/B test results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =================================================================
// BULK OPERATIONS
// =================================================================

// POST /api/ai-assistant/bulk/activate - Activate multiple assistants
// Frontend: "Activate All" button with checkbox selection
router.post('/bulk/activate', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { assistant_ids } = req.body;

    if (!Array.isArray(assistant_ids) || assistant_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Assistant IDs array is required'
      });
    }

    const results = [];

    for (const assistantId of assistant_ids) {
      try {
        // Activate individual assistant (reuse logic from main activate endpoint)
        const assistant = await new Promise((resolve, reject) => {
          db.get(`
            SELECT * FROM ai_assistants 
            WHERE id = ? AND user_id = ?
          `, [assistantId, userId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (assistant && assistant.telegram_token && assistant.ai_api_key) {
          // Generate workflow and activate
          const workflowId = `ai_assistant_${assistantId}_${Date.now()}`;
          const webhookUrl = `${process.env.BASE_URL || 'https://workflow-lg9z.onrender.com'}/api/webhooks/ai-assistant/${assistantId}`;

          await new Promise((resolve, reject) => {
            db.run(`
              UPDATE ai_assistants 
              SET status = 'active', 
                  workflow_id = ?, 
                  webhook_url = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [workflowId, webhookUrl, assistantId], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });

          results.push({
            assistant_id: assistantId,
            name: assistant.name,
            success: true,
            message: 'Activated successfully'
          });
        } else {
          results.push({
            assistant_id: assistantId,
            name: assistant?.name || 'Unknown',
            success: false,
            message: 'Missing required configuration'
          });
        }
      } catch (error) {
        results.push({
          assistant_id: assistantId,
          success: false,
          message: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      results,
      summary: {
        total: assistant_ids.length,
        successful: successCount,
        failed: assistant_ids.length - successCount
      },
      message: `${successCount}/${assistant_ids.length} assistants activated`
    });

  } catch (error) {
    console.error('❌ Error in bulk activation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/ai-assistant/bulk/update-prompts - Update system prompts in bulk
// Frontend: "Update All Prompts" with template selection
router.post('/bulk/update-prompts', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { assistant_ids, new_system_prompt } = req.body;

    if (!Array.isArray(assistant_ids) || !new_system_prompt) {
      return res.status(400).json({
        success: false,
        error: 'Assistant IDs and new system prompt are required'
      });
    }

    const results = [];

    for (const assistantId of assistant_ids) {
      try {
        await new Promise((resolve, reject) => {
          db.run(`
            UPDATE ai_assistants 
            SET system_prompt = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
          `, [new_system_prompt, assistantId, userId], function(err) {
            if (err) reject(err);
            else if (this.changes > 0) resolve(true);
            else reject(new Error('Assistant not found'));
          });
        });

        results.push({
          assistant_id: assistantId,
          success: true,
          message: 'Prompt updated successfully'
        });
      } catch (error) {
        results.push({
          assistant_id: assistantId,
          success: false,
          message: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      results,
      summary: {
        total: assistant_ids.length,
        successful: successCount,
        failed: assistant_ids.length - successCount
      },
      message: `${successCount}/${assistant_ids.length} prompts updated`
    });

  } catch (error) {
    console.error('❌ Error in bulk prompt update:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;