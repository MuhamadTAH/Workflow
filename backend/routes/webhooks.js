const { logWorkflowTriggered } = require('../controllers/workflowController');
const scheduler = require('../services/scheduler');
const TriggerDataProcessor = require('../services/triggerDataProcessor');
const jobQueue = require('../services/jobQueue');
const webhookStateManager = require('../services/webhookStateManager');

const express = require('express');
const router = express.Router();
const workflowEngine = require('../workflowEngine');
const logger = require('../services/logger');
const { asyncHandler } = require('../middleware/errorHandler');

// Try to load WorkflowExecutor singleton, but don't fail if it doesn't exist
let workflowExecutor = null;
try {
  workflowExecutor = require('../services/workflowExecutor'); // Import singleton instance
  console.log('✅ WorkflowExecutor singleton loaded successfully');
} catch (error) {
  console.warn('⚠️ WorkflowExecutor not available:', error.message);
}
const fs = require('fs');
const path = require('path');

// Store for active workflow configurations (in production, use database)
const workflowConfigs = new Map();

// Store for node-specific messages (in production, use database)
// Use shared nodeMessages from main app
let nodeMessages = new Map();

// Middleware to get shared nodeMessages from app
router.use((req, res, next) => {
  if (req.app.get('nodeMessages')) {
    nodeMessages = req.app.get('nodeMessages');
  }
  next();
});

// Store for registered webhooks (in production, use database)
const registeredWebhooks = new Map();



// WorkflowExecutor is conditionally initialized above

// Basic webhook test endpoint
router.get('/test', (req, res) => {
  logger.info('Webhook test endpoint accessed');
  res.json({ 
    success: true, 
    message: 'Webhook system is running',
    timestamp: new Date().toISOString() 
  });
});

// Telegram webhook endpoints
// GET for testing if webhook is set
router.get('/telegram', (req, res) => {
  logger.info('Telegram webhook test endpoint accessed');
  res.send('✅ Telegram webhook is live.');
});

// POST: Live Chat specific Telegram webhook endpoint
router.post('/telegram-livechat/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const update = req.body;
  
  console.log(`📞 LIVE CHAT: Message received for user: ${userId}`);
  console.log('📦 Update data:', JSON.stringify(update, null, 2));
  console.log('🔍 Webhook called at:', new Date().toISOString());
  
  // Validate Telegram update format
  if (!update || !update.message) {
    console.log('❌ Invalid Telegram update format');
    return res.status(400).json({ ok: false, error: 'Invalid update format' });
  }

  try {
    const db = require('../db');
    const { message } = update;
    const { chat, from, text } = message;

    // Create or update conversation
    const conversationSql = `
      INSERT INTO telegram_conversations 
      (user_id, telegram_chat_id, telegram_username, telegram_first_name, telegram_last_name, 
       last_message_text, last_message_timestamp, status)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'automated')
      ON CONFLICT(user_id, telegram_chat_id) DO UPDATE SET
        telegram_username = excluded.telegram_username,
        telegram_first_name = excluded.telegram_first_name,
        telegram_last_name = excluded.telegram_last_name,
        last_message_text = excluded.last_message_text,
        last_message_timestamp = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `;

    console.log('💾 Attempting to create/update conversation for user:', userId, 'chat:', chat.id.toString());
    
    const conversationResult = await new Promise((resolve, reject) => {
      db.run(conversationSql, [
        userId,
        chat.id.toString(),
        from.username,
        from.first_name,
        from.last_name,
        text
      ], function(err) {
        if (err) {
          console.error('❌ Error creating conversation:', err);
          reject(err);
        } else {
          console.log('✅ Conversation created/updated successfully. LastID:', this.lastID, 'Changes:', this.changes);
          resolve(this.lastID);
        }
      });
    });

    // Get conversation ID
    const getConvSql = `
      SELECT id FROM telegram_conversations 
      WHERE user_id = ? AND telegram_chat_id = ?
    `;

    console.log('🔍 Looking up conversation ID for user:', userId, 'chat:', chat.id.toString());
    
    const conversationId = await new Promise((resolve, reject) => {
      db.get(getConvSql, [userId, chat.id.toString()], (err, row) => {
        if (err) {
          console.error('❌ Error getting conversation ID:', err);
          reject(err);
        } else {
          console.log('📋 Conversation lookup result:', row);
          resolve(row?.id);
        }
      });
    });

    if (conversationId) {
      // Save the message
      const messageSql = `
        INSERT INTO telegram_messages 
        (conversation_id, sender_type, sender_name, message_text, telegram_message_id, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const senderName = from.first_name ? 
        `${from.first_name} ${from.last_name || ''}`.trim() : 
        (from.username || `User ${from.id}`);

      const metadata = JSON.stringify({
        telegram_update: update,
        source: 'live_chat_webhook',
        processed_at: new Date().toISOString()
      });

      console.log('💬 Saving message to conversation:', conversationId);
      
      await new Promise((resolve, reject) => {
        db.run(messageSql, [
          conversationId,
          'user',
          senderName,
          text,
          message.message_id,
          metadata
        ], function(err) {
          if (err) {
            console.error('❌ Error saving message:', err);
            reject(err);
          } else {
            console.log('✅ Message saved successfully. LastID:', this.lastID);
            resolve(this.lastID);
          }
        });
      });

      console.log('✅ LIVE CHAT: Message stored successfully');
    } else {
      console.error('❌ No conversation ID found - cannot save message');
    }

    // Always respond success to Telegram
    res.status(200).json({ ok: true, message: 'Live chat message processed successfully' });
    
  } catch (error) {
    console.error('❌ LIVE CHAT: Webhook processing failed:', error.message);
    logger.logError(error, { context: 'telegram_livechat_webhook', userId });
    res.status(500).json({ ok: false, error: 'Failed to process telegram update' });
  }
}));

// POST: General Telegram webhook endpoint (Legacy - redirects to active workflows)
router.post('/telegram', asyncHandler(async (req, res) => {
  const update = req.body;
  
  console.log('📥 LEGACY TELEGRAM ENDPOINT: Message received at general /telegram endpoint');
  console.log('📦 Update data:', JSON.stringify(update, null, 2));
  
  // Check if there are any active workflows with Telegram triggers
  if (workflowExecutor && workflowExecutor.activeWorkflows.size > 0) {
    const activeWorkflows = Array.from(workflowExecutor.activeWorkflows.keys());
    
    // Find the first active workflow with a Telegram trigger
    let targetWorkflow = null;
    for (const workflowId of activeWorkflows) {
      const workflow = workflowExecutor.activeWorkflows.get(workflowId);
      if (workflow && workflow.nodes) {
        const hasTelegramTrigger = workflow.nodes.some(node => 
          node.data.type === 'telegramTrigger'
        );
        if (hasTelegramTrigger) {
          targetWorkflow = workflowId;
          break;
        }
      }
    }
    
    if (targetWorkflow) {
      console.log(`🔄 LEGACY REDIRECT: Forwarding message to active workflow: ${targetWorkflow}`);
      
      // Forward the request to the workflow-specific endpoint
      req.url = `/telegram/${targetWorkflow}`;
      req.params = { workflowId: targetWorkflow };
      
      // Call the workflow-specific handler
      return router.handle(req, res, () => {
        console.log('📨 LEGACY REDIRECT: Message forwarded successfully');
        res.status(200).json({ ok: true, message: 'Message forwarded to active workflow', workflowId: targetWorkflow });
      });
    } else {
      console.log('⚠️  LEGACY ENDPOINT: No active workflows with Telegram triggers found');
      console.log(`📋 Available workflows: [${activeWorkflows.join(', ')}]`);
    }
  } else {
    console.log('⚠️  LEGACY ENDPOINT: No active workflows found');
  }
  
  // Legacy logging for backwards compatibility
  const logPath = path.join(__dirname, '../logs/telegram-2025-07-27.log');
  try {
    const logsDir = path.dirname(logPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.writeFileSync(logPath, JSON.stringify(update, null, 2));
  } catch (logError) {
    console.error('❌ Legacy logging failed:', logError.message);
  }

  // Respond with guidance for new workflow system
  res.status(200).json({ 
    ok: true, 
    message: 'Message received at legacy endpoint',
    guidance: 'For workflow execution, activate a workflow with Telegram trigger to get workflow-specific webhook URL'
  });
}));

// Workflow-specific Telegram trigger endpoint
router.post('/telegram/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const update = req.body;
    
    console.log(`📥 Telegram trigger received for workflow: ${workflowId}`);
    console.log('📦 Update data:', JSON.stringify(update, null, 2));
    
    // Validate Telegram update format
    if (!update || !update.message) {
      console.log('❌ Invalid Telegram update format');
      return res.status(400).json({ ok: false, error: 'Invalid update format' });
    }
    
    // Standardize trigger data using processor
    const standardizedData = TriggerDataProcessor.standardizeTriggerData(
      'telegramTrigger', 
      update, 
      `telegram-trigger-${workflowId}`
    );
    
    // Validate the data
    const validation = TriggerDataProcessor.validateTriggerData(standardizedData);
    if (!validation.isValid) {
      console.log('❌ Invalid trigger data:', validation.errors);
      return res.status(400).json({ ok: false, errors: validation.errors });
    }
    
    // Find user ID associated with this workflow to store in live chat
    let userId = null;
    if (workflowExecutor && workflowExecutor.activeWorkflows.has(workflowId)) {
      const workflowData = workflowExecutor.activeWorkflows.get(workflowId);
      userId = workflowData?.metadata?.userId || null;
    }

    // Store message in live chat database if we can identify the user
    if (userId) {
      try {
        console.log('[telegram-webhook] 💬 Storing message in live chat database');
        
        const db = require('../db');
        const { message } = update;
        const { chat, from, text } = message;

        // Create or update conversation
        const conversationSql = `
          INSERT INTO telegram_conversations 
          (user_id, telegram_chat_id, telegram_username, telegram_first_name, telegram_last_name, 
           last_message_text, last_message_timestamp, status)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'automated')
          ON CONFLICT(user_id, telegram_chat_id) DO UPDATE SET
            telegram_username = excluded.telegram_username,
            telegram_first_name = excluded.telegram_first_name,
            telegram_last_name = excluded.telegram_last_name,
            last_message_text = excluded.last_message_text,
            last_message_timestamp = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        `;

        await new Promise((resolve, reject) => {
          db.run(conversationSql, [
            userId,
            chat.id.toString(),
            from.username,
            from.first_name,
            from.last_name,
            text
          ], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        });

        // Get conversation ID
        const getConvSql = `
          SELECT id FROM telegram_conversations 
          WHERE user_id = ? AND telegram_chat_id = ?
        `;

        const conversationId = await new Promise((resolve, reject) => {
          db.get(getConvSql, [userId, chat.id.toString()], (err, row) => {
            if (err) reject(err);
            else resolve(row?.id);
          });
        });

        if (conversationId) {
          // Save the message
          const messageSql = `
            INSERT INTO telegram_messages 
            (conversation_id, sender_type, sender_name, message_text, telegram_message_id, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          const senderName = from.first_name ? 
            `${from.first_name} ${from.last_name || ''}`.trim() : 
            (from.username || `User ${from.id}`);

          const metadata = JSON.stringify({
            telegram_update: update,
            workflow_id: workflowId,
            processed_at: new Date().toISOString()
          });

          await new Promise((resolve, reject) => {
            db.run(messageSql, [
              conversationId,
              'user',
              senderName,
              text,
              message.message_id,
              metadata
            ], function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            });
          });

          console.log('[telegram-webhook] ✅ Message stored in live chat database');
        }
      } catch (storageError) {
        console.error('[telegram-webhook] ⚠️ Failed to store in live chat database:', storageError.message);
        // Continue processing even if storage fails
      }
    }

    // Check if this specific conversation allows automation
    let shouldProcessAutomation = true;
    if (userId) {
      try {
        const db = require('../db');
        const conversationStatus = await new Promise((resolve, reject) => {
          db.get(
            'SELECT status FROM telegram_conversations WHERE user_id = ? AND telegram_chat_id = ?',
            [userId, update.message.chat.id.toString()],
            (err, row) => {
              if (err) reject(err);
              else resolve(row?.status || 'automated'); // Default to automated if no record
            }
          );
        });
        
        shouldProcessAutomation = conversationStatus === 'automated';
        console.log(`[telegram-webhook] 🔍 Conversation status check: ${conversationStatus} (userId: ${userId}, chatId: ${update.message.chat.id})`);
        
        if (!shouldProcessAutomation) {
          console.log(`[telegram-webhook] 🛑 Skipping automation - conversation is under human control`);
        }
      } catch (statusError) {
        console.warn('[telegram-webhook] ⚠️ Failed to check conversation status, defaulting to automation:', statusError.message);
        shouldProcessAutomation = true; // Default to automation if check fails
      }
    }

    // Check if workflow is active and queue for execution (only if automation is allowed)
    if (workflowExecutor && workflowExecutor.activeWorkflows.has(workflowId) && shouldProcessAutomation) {
      try {
        console.log('[telegram-webhook] 🚀 WORKFLOW EXECUTION TRIGGERED');
        console.log('[telegram-webhook] 📋 Workflow ID:', workflowId);
        console.log('[telegram-webhook] 👤 User ID:', userId);
        console.log('[telegram-webhook] 💬 Message:', update.message.text);
        console.log('[telegram-webhook] 💭 Chat ID:', update.message.chat.id);
        
        // Log the workflow trigger event
        const summary = TriggerDataProcessor.getSummary(standardizedData);
        logWorkflowTriggered(workflowId, 'telegramTrigger', summary);
        
        // Prepare trigger data for workflow execution
        const triggerData = TriggerDataProcessor.toExecutionFormat(standardizedData);
        
        console.log('[telegram-webhook] 📦 Trigger data prepared:', JSON.stringify(triggerData, null, 2));
        console.log('[telegram-webhook] 📥 Queuing workflow for execution:', workflowId);
        
        // Add job to queue instead of direct execution
        const jobResult = await jobQueue.addJob({
          workflowId,
          triggerData,
          triggerType: 'telegramTrigger',
          priority: 'normal',
          metadata: {
            source: 'telegram_webhook',
            chatId: standardizedData.telegram?.chatId,
            updateId: standardizedData.telegram?.updateId,
            messageText: standardizedData.message?.text
          }
        });
        
        console.log('[telegram-webhook] ✅ Job queued successfully:', jobResult.jobId);
        
        // Store the successful execution
        logger.logTelegramEvent('workflow_triggered', 'execution_success', {
          workflowId: workflowId,
          updateId: update.update_id,
          chatId: update.message?.chat?.id,
          executionStatus: 'completed'
        });
        
      } catch (execError) {
        console.error('[telegram-webhook] ❌ Workflow execution failed:', execError.message);
        logger.logError(execError, { 
          context: 'telegram_workflow_execution', 
          workflowId: workflowId,
          updateId: update.update_id 
        });
        // Continue processing even if execution fails
      }
    } else {
      if (!shouldProcessAutomation) {
        console.log('[telegram-webhook] ✅ Message stored for human agent - automation skipped for this conversation');
      } else {
        console.warn('[telegram-webhook] ⚠️ Workflow not found or not active:', workflowId);
        if (workflowExecutor) {
          console.log(`[telegram-webhook] 📋 Available workflows: [${Array.from(workflowExecutor.activeWorkflows.keys()).join(', ')}]`);
        }
      }
    }
    
    // Always respond success to Telegram to prevent retries
    res.status(200).json({ ok: true, message: 'Update processed successfully' });
    
  } catch (error) {
    console.error('❌ Telegram webhook processing failed:', error.message);
    logger.logError(error, { context: 'telegram_workflow_webhook' });
    res.status(500).json({ ok: false, error: 'Failed to process telegram update' });
  }
});

// Manual trigger endpoint for testing workflows
router.post('/manual/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { triggerData, nodeId } = req.body;
    
    console.log(`🎯 Manual trigger received for workflow: ${workflowId}`);
    console.log('📦 Manual trigger data:', JSON.stringify(triggerData, null, 2));
    
    // Default trigger data if none provided
    const defaultTriggerData = {
      message: 'Manual workflow execution',
      source: 'api_endpoint',
      triggeredBy: 'api_user'
    };
    
    const rawTriggerData = triggerData || defaultTriggerData;
    
    // Standardize trigger data using processor
    const standardizedData = TriggerDataProcessor.standardizeTriggerData(
      'manualTrigger', 
      rawTriggerData, 
      nodeId || `manual-trigger-${workflowId}`
    );
    
    // Validate the data
    const validation = TriggerDataProcessor.validateTriggerData(standardizedData);
    if (!validation.isValid) {
      console.log('❌ Invalid manual trigger data:', validation.errors);
      return res.status(400).json({ success: false, errors: validation.errors });
    }
    
    // Check if workflow is active and queue for execution
    if (workflowExecutor && workflowExecutor.activeWorkflows.has(workflowId)) {
      try {
        // Log the workflow trigger event
        const summary = TriggerDataProcessor.getSummary(standardizedData);
        logWorkflowTriggered(workflowId, 'manualTrigger', summary);
        
        // Prepare trigger data for workflow execution
        const executionTriggerData = TriggerDataProcessor.toExecutionFormat(standardizedData);
        
        console.log('[manual-trigger] 📥 Queuing workflow for execution:', workflowId);
        
        // Add job to queue instead of direct execution
        const jobResult = await jobQueue.addJob({
          workflowId,
          triggerData: executionTriggerData,
          triggerType: 'manualTrigger',
          priority: 'high', // Manual triggers get high priority
          metadata: {
            source: 'manual_api',
            triggeredBy: 'user',
            ip: req.ip
          }
        });
        
        console.log('[manual-trigger] ✅ Job queued successfully:', jobResult.jobId);
        
        res.status(200).json({
          success: true,
          message: 'Workflow queued for execution',
          workflowId: workflowId,
          job: jobResult,
          triggeredAt: new Date().toISOString()
        });
        
      } catch (execError) {
        console.error('[manual-trigger] ❌ Workflow execution failed:', execError.message);
        res.status(500).json({
          success: false,
          message: 'Workflow execution failed',
          error: execError.message,
          workflowId: workflowId
        });
      }
    } else {
      console.warn('[manual-trigger] ⚠️ Workflow not found or not active:', workflowId);
      if (workflowExecutor) {
        console.log(`[manual-trigger] 📋 Available workflows: [${Array.from(workflowExecutor.activeWorkflows.keys()).join(', ')}]`);
      }
      
      res.status(404).json({
        success: false,
        message: 'Workflow not found or not active',
        workflowId: workflowId,
        availableWorkflows: workflowExecutor ? Array.from(workflowExecutor.activeWorkflows.keys()) : []
      });
    }
    
  } catch (error) {
    console.error('❌ Manual trigger processing failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process manual trigger',
      error: error.message
    });
  }
});

// Schedule management endpoints
router.post('/schedule/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { intervalMinutes, enabled = true, description } = req.body;
    
    console.log(`⏰ Schedule request for workflow ${workflowId}:`, { intervalMinutes, enabled, description });
    
    if (!intervalMinutes || intervalMinutes <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid intervalMinutes is required (must be > 0)'
      });
    }
    
    // Check if workflow is active
    if (!workflowExecutor || !workflowExecutor.activeWorkflows.has(workflowId)) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found or not active',
        workflowId: workflowId
      });
    }
    
    const scheduleConfig = {
      intervalMinutes,
      enabled,
      description: description || `Run every ${intervalMinutes} minutes`,
      createdAt: new Date().toISOString()
    };
    
    const success = scheduler.scheduleWorkflow(workflowId, scheduleConfig);
    
    if (success) {
      res.status(200).json({
        success: true,
        message: 'Workflow scheduled successfully',
        workflowId: workflowId,
        schedule: scheduler.getScheduleInfo(workflowId)
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to schedule workflow'
      });
    }
    
  } catch (error) {
    console.error('❌ Schedule creation failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule',
      error: error.message
    });
  }
});

// Get schedule info
router.get('/schedule/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const scheduleInfo = scheduler.getScheduleInfo(workflowId);
    
    res.status(200).json({
      success: true,
      schedule: scheduleInfo
    });
  } catch (error) {
    console.error('❌ Failed to get schedule info:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get schedule info',
      error: error.message
    });
  }
});

// Delete schedule
router.delete('/schedule/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    scheduler.unscheduleWorkflow(workflowId);
    
    res.status(200).json({
      success: true,
      message: 'Schedule removed successfully',
      workflowId: workflowId
    });
  } catch (error) {
    console.error('❌ Failed to remove schedule:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to remove schedule',
      error: error.message
    });
  }
});

// List all schedules
router.get('/schedules', async (req, res) => {
  try {
    const allSchedules = scheduler.getAllSchedules();
    
    res.status(200).json({
      success: true,
      schedules: allSchedules,
      count: allSchedules.length
    });
  } catch (error) {
    console.error('❌ Failed to list schedules:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to list schedules',
      error: error.message
    });
  }
});

// Register Telegram webhook for specific node
router.post('/register-telegram', asyncHandler(async (req, res) => {
  const { botToken, nodeId, webhookUrl } = req.body;
  
  if (!botToken || !nodeId || !webhookUrl) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: botToken, nodeId, webhookUrl'
    });
  }

  try {
    // Register webhook with Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const axios = require('axios');
    
    const telegramResponse = await axios.post(telegramUrl, {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    });

    if (telegramResponse.data.ok) {
      // Store webhook registration
      registeredWebhooks.set(nodeId, {
        botToken,
        webhookUrl,
        registeredAt: new Date().toISOString()
      });

      logger.info(`Telegram webhook registered for node ${nodeId}`, {
        nodeId,
        webhookUrl
      });

      res.json({
        success: true,
        message: 'Webhook registered successfully',
        nodeId,
        webhookUrl
      });
    } else {
      res.status(400).json({
        success: false,
        error: telegramResponse.data.description || 'Failed to register webhook with Telegram'
      });
    }
  } catch (error) {
    logger.logError(error, { context: 'register-telegram', nodeId });
    res.status(500).json({
      success: false,
      error: 'Failed to register webhook: ' + error.message
    });
  }
}));

// Node-specific Telegram webhook endpoint
router.post('/telegram-:nodeId', asyncHandler(async (req, res) => {
  const { nodeId } = req.params;
  const update = req.body;
  
  try {
    const logPath = path.join(__dirname, `../logs/telegram-node-${nodeId}-${new Date().toISOString().split('T')[0]}.log`);
    
    // Ensure logs directory exists
    const logsDir = path.dirname(logPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Save message for this specific node
    if (update.message) {
      const messageData = {
        updateId: update.update_id,
        messageId: update.message.message_id,
        chatId: update.message.chat.id,
        text: update.message.text,
        from: update.message.from,
        date: update.message.date,
        timestamp: new Date().toISOString(),
        nodeId: nodeId
      };

      // Store latest message for this node
      nodeMessages.set(nodeId, messageData);

      // Log to file
      fs.writeFileSync(logPath, JSON.stringify(messageData, null, 2));
      
      console.log(`📥 Telegram message received for node ${nodeId}:`, messageData);
      logger.logTelegramEvent(nodeId, 'message_received', {
        updateId: update.update_id,
        messageId: update.message?.message_id,
        chatId: update.message?.chat?.id,
        text: update.message?.text
      });
    }

    res.status(200).json({ ok: true, message: `Message received for node ${nodeId}` });
  } catch (error) {
    logger.logError(error, { context: 'telegram-node-webhook', nodeId });
    res.status(500).json({ ok: false, error: 'Failed to process message' });
  }
}));

// Get latest message for specific node
router.get('/latest-message/:nodeId', (req, res) => {
  const { nodeId } = req.params;
  const latestMessage = nodeMessages.get(nodeId);
  
  if (latestMessage) {
    res.json({
      success: true,
      message: latestMessage,
      nodeId
    });
  } else {
    res.json({
      success: true,
      message: null,
      nodeId
    });
  }
});

// Get webhook status for node
router.get('/webhook-status/:nodeId', (req, res) => {
  const { nodeId } = req.params;
  const webhook = registeredWebhooks.get(nodeId);
  
  res.json({
    success: true,
    registered: !!webhook,
    webhook: webhook || null,
    nodeId
  });
});

// Register workflow with backend engine
router.post('/register-workflow', asyncHandler(async (req, res) => {
  const { id, name, nodes, connections, configs } = req.body;
  
  if (!id || !name || !nodes) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: id, name, nodes'
    });
  }

  // Store workflow configuration
  workflowConfigs.set(id, {
    id,
    name,
    nodes,
    connections: connections || [],
    configs: configs || {},
    registeredAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  });

  logger.info(`Registered workflow: ${name}`, { 
    workflowId: id, 
    nodeCount: nodes.length 
  });

  res.json({
    success: true,
    message: `Workflow "${name}" registered successfully`,
    workflowId: id,
    nodeCount: nodes.length
  });
}));

// Get workflow status
router.get('/workflows', (req, res) => {
  const workflows = Array.from(workflowConfigs.values()).map(workflow => ({
    id: workflow.id,
    name: workflow.name,
    nodeCount: workflow.nodes.length,
    connectionCount: workflow.connections.length,
    registeredAt: workflow.registeredAt,
    lastUpdated: workflow.lastUpdated
  }));

  res.json({
    success: true,
    workflows,
    total: workflows.length
  });
});

// Get specific workflow
router.get('/workflows/:id', (req, res) => {
  const { id } = req.params;
  const workflow = workflowConfigs.get(id);
  
  if (!workflow) {
    return res.status(404).json({
      success: false,
      error: 'Workflow not found'
    });
  }

  res.json({
    success: true,
    workflow
  });
});

// Delete workflow
router.delete('/workflows/:id', (req, res) => {
  const { id } = req.params;
  
  if (workflowConfigs.has(id)) {
    const workflow = workflowConfigs.get(id);
    workflowConfigs.delete(id);
    
    logger.info(`Deleted workflow: ${workflow.name}`, { workflowId: id });
    
    res.json({
      success: true,
      message: `Workflow "${workflow.name}" deleted successfully`
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Workflow not found'
    });
  }
});

// POST /api/webhooks/chat-trigger - General chat webhook (not chat trigger nodes)
router.post('/chat-trigger', async (req, res) => {
  try {
    const { sessionId, message, userData } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'sessionId and message are required'
      });
    }
    
    console.log('💬 Chat webhook received:', { sessionId, messageLength: message.length });
    
    // Save message to database
    const db = require('../db');
    db.run(
      'INSERT INTO chat_messages (session_id, message_text, sender_type, user_data, is_processed) VALUES (?, ?, ?, ?, ?)',
      [sessionId, message, 'user', JSON.stringify(userData || {}), 0],
      function(err) {
        if (err) {
          console.error('Error saving chat webhook message:', err);
          return res.status(500).json({
            success: false,
            error: 'Failed to save message'
          });
        }
        
        console.log('✅ Chat webhook message saved:', { sessionId, messageId: this.lastID });
        
        res.json({
          success: true,
          messageId: this.lastID,
          sessionId: sessionId,
          message: 'Chat webhook processed successfully'
        });
      }
    );
    
  } catch (error) {
    console.error('❌ Chat webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// REMOVED: Old problematic webhook route that was causing 500 errors




// Dev-only route to test runWorkflow existence
router.get('/_dev/check-runWorkflow', (req, res) => {
  res.json({ 
    hasRunWorkflow: typeof global.runWorkflow === 'function',
    workflowExecutorAvailable: !!workflowExecutor,
    systemReady: true
  });
});

// Test endpoint to verify workflow-specific webhook URL
router.get('/test-telegram/:workflowId', (req, res) => {
  const { workflowId } = req.params;
  console.log(`🧪 TEST: Telegram webhook test for workflow: ${workflowId}`);
  
  res.json({
    success: true,
    message: `Webhook endpoint is reachable for workflow: ${workflowId}`,
    url: `/api/webhooks/telegram/${workflowId}`,
    timestamp: new Date().toISOString()
  });
});

// Dry run test endpoint for workflows
router.post('/dry-run/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { triggerData } = req.body;
        
        console.log(`🧪 DRY RUN: Testing workflow: ${workflowId}`);
        console.log('🧪 DRY RUN: Trigger data:', JSON.stringify(triggerData, null, 2));
        
        // Default trigger data if none provided
        const defaultTriggerData = {
            message: 'DRY RUN: Test workflow execution',
            source: 'dry_run_test',
            triggeredBy: 'test_user',
            testMode: true
        };
        
        const rawTriggerData = triggerData || defaultTriggerData;
        
        // Standardize trigger data using processor
        const standardizedData = TriggerDataProcessor.standardizeTriggerData(
            'manualTrigger', 
            rawTriggerData, 
            `dry-run-trigger-${workflowId}`
        );
        
        // Check if workflow is active and queue for execution in dry run mode
        if (workflowExecutor && workflowExecutor.activeWorkflows.has(workflowId)) {
            console.log(`🧪 DRY RUN: Workflow ${workflowId} is active, starting dry run execution`);
            
            // Prepare trigger data for workflow execution
            const executionTriggerData = TriggerDataProcessor.toExecutionFormat(standardizedData);
            
            // Add job to queue with dry run flag
            const jobResult = await jobQueue.addJob({
                workflowId,
                triggerData: executionTriggerData,
                triggerType: 'dryRunTest',
                priority: 'high',
                metadata: {
                    source: 'dry_run_api',
                    testMode: true,
                    triggeredBy: 'user',
                    ip: req.ip
                }
            });
            
            console.log(`🧪 DRY RUN: Job queued successfully:`, jobResult.jobId);
            
            res.json({
                success: true,
                message: `DRY RUN: Workflow test execution triggered for: ${workflowId}`,
                jobId: jobResult.jobId,
                triggerData: executionTriggerData,
                dryRun: true,
                timestamp: new Date().toISOString()
            });
        } else {
            console.log(`🧪 DRY RUN: Workflow ${workflowId} not found or not active`);
            const availableWorkflows = workflowExecutor ? Array.from(workflowExecutor.activeWorkflows.keys()) : [];
            
            res.json({
                success: false,
                message: `DRY RUN: Workflow ${workflowId} not found or not active`,
                availableWorkflows: availableWorkflows,
                timestamp: new Date().toISOString()
            });
        }
        
    } catch (error) {
        console.error('🧪 DRY RUN: Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            dryRun: true,
            timestamp: new Date().toISOString()
        });
    }
});

// Test POST endpoint with fake Telegram data that actually triggers workflow
router.post('/test-telegram-post/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    console.log(`🧪 TEST POST: Simulating Telegram message for workflow: ${workflowId}`);
    
    // Create fake Telegram update
    const fakeUpdate = {
      update_id: 123456789,
      message: {
        message_id: 1,
        from: {
          id: 12345,
          is_bot: false,
          first_name: "Test",
          username: "testuser"
        },
        chat: {
          id: 12345,
          first_name: "Test",
          username: "testuser",
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: "Test message from API endpoint"
      }
    };
    
    console.log('🧪 TEST POST: Fake update:', JSON.stringify(fakeUpdate, null, 2));
    
    // Standardize trigger data using processor
    const standardizedData = TriggerDataProcessor.standardizeTriggerData(
      'telegramTrigger', 
      fakeUpdate, 
      `telegram-trigger-${workflowId}`
    );
    
    // Check if workflow is active and queue for execution
    if (workflowExecutor && workflowExecutor.activeWorkflows.has(workflowId)) {
      console.log(`🧪 TEST POST: Workflow ${workflowId} is active, triggering execution`);
      
      // Prepare trigger data for workflow execution
      const triggerData = TriggerDataProcessor.toExecutionFormat(standardizedData);
      
      // Add job to queue
      const jobResult = await jobQueue.addJob({
        workflowId,
        triggerData,
        triggerType: 'telegramTrigger',
        priority: 'high',
        metadata: {
          source: 'test_api',
          chatId: fakeUpdate.message.chat.id,
          messageText: fakeUpdate.message.text
        }
      });
      
      console.log(`🧪 TEST POST: Job queued successfully:`, jobResult.jobId);
      
      res.json({
        success: true,
        message: `Test workflow execution triggered for: ${workflowId}`,
        jobId: jobResult.jobId,
        fakeUpdate: fakeUpdate,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`🧪 TEST POST: Workflow ${workflowId} not found or not active`);
      const availableWorkflows = workflowExecutor ? Array.from(workflowExecutor.activeWorkflows.keys()) : [];
      
      res.json({
        success: false,
        message: `Workflow ${workflowId} not found or not active`,
        availableWorkflows: availableWorkflows,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('🧪 TEST POST: Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Update Telegram webhook for a specific workflow
router.post('/update-telegram-webhook/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { botToken } = req.body;
    
    if (!botToken) {
      return res.status(400).json({
        success: false,
        error: 'Bot token is required in request body'
      });
    }
    
    const webhookUrl = `https://workflow-lg9z.onrender.com/api/webhooks/telegram/${workflowId}`;
    
    console.log(`🔄 Updating Telegram webhook for workflow: ${workflowId}`);
    console.log(`🔧 Using bot token: ${botToken.substring(0, 10)}...`);
    console.log(`📡 New webhook URL: ${webhookUrl}`);
    
    const axios = require('axios');
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
    
    const response = await axios.post(telegramApiUrl, {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    });
    
    if (response.data.ok) {
      console.log('✅ Telegram webhook updated successfully');
      res.json({
        success: true,
        message: 'Telegram webhook updated successfully',
        workflowId: workflowId,
        botToken: botToken.substring(0, 10) + '...',
        webhookUrl: webhookUrl,
        telegramResponse: response.data
      });
    } else {
      console.error('❌ Telegram webhook update failed:', response.data);
      res.status(400).json({
        success: false,
        error: 'Failed to update Telegram webhook',
        telegramError: response.data
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating Telegram webhook:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Delete Telegram webhook for a specific bot token
router.post('/delete-telegram-webhook', async (req, res) => {
  try {
    const { botToken } = req.body;
    
    if (!botToken) {
      return res.status(400).json({
        success: false,
        error: 'Bot token is required in request body'
      });
    }
    
    console.log(`🗑️ Deleting Telegram webhook for bot: ${botToken.substring(0, 10)}...`);
    
    const axios = require('axios');
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
    
    const response = await axios.post(telegramApiUrl);
    
    if (response.data.ok) {
      console.log('✅ Telegram webhook deleted successfully');
      res.json({
        success: true,
        message: 'Telegram webhook deleted successfully',
        botToken: botToken.substring(0, 10) + '...',
        telegramResponse: response.data
      });
    } else {
      console.error('❌ Telegram webhook deletion failed:', response.data);
      res.status(400).json({
        success: false,
        error: 'Failed to delete Telegram webhook',
        telegramError: response.data
      });
    }
    
  } catch (error) {
    console.error('❌ Error deleting Telegram webhook:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});


// Instagram webhook endpoints
router.post('/instagram/:workflowId', asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const update = req.body;

  console.log('📷 Instagram webhook received for workflow:', workflowId);
  console.log('📷 Instagram update data:', JSON.stringify(update, null, 2));

  // Validate Instagram webhook signature (in production, verify webhook signature)
  if (!update || typeof update !== 'object') {
    console.log('❌ Invalid Instagram webhook data');
    return res.status(400).json({ error: 'Invalid webhook data' });
  }

  try {
    // Check if WorkflowExecutor is available
    if (!workflowExecutor) {
      console.log('⚠️ WorkflowExecutor not available for Instagram webhook');
      return res.status(503).json({ 
        success: false, 
        error: 'WorkflowExecutor service unavailable' 
      });
    }

    // Find the target workflow
    const workflow = workflowExecutor.activeWorkflows.get(workflowId);
    if (!workflow) {
      console.log('❌ Instagram webhook: workflow not found:', workflowId);
      return res.status(404).json({ 
        success: false, 
        error: 'Workflow not found or not active' 
      });
    }

    // Process Instagram webhook data
    const instagramData = processInstagramWebhook(update);
    
    if (instagramData) {
      console.log('🚀 Triggering workflow execution for Instagram event:', instagramData.type);
      
      // Execute the workflow with Instagram data
      await workflowExecutor.executeWorkflow(workflowId, instagramData);
      
      res.status(200).json({ 
        success: true, 
        message: 'Instagram webhook processed',
        eventType: instagramData.type
      });
    } else {
      console.log('⚠️ Instagram webhook: no processable data found');
      res.status(200).json({ 
        success: true, 
        message: 'Instagram webhook received but no action needed' 
      });
    }

  } catch (error) {
    console.error('❌ Instagram webhook processing error:', error);
    logger.logError(error, {
      context: 'instagram_webhook',
      workflowId: workflowId,
      updatePreview: JSON.stringify(update).substring(0, 200)
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error processing Instagram webhook'
    });
  }
}));

// Legacy Instagram webhook endpoint (for backwards compatibility)
router.post('/instagram', asyncHandler(async (req, res) => {
  const update = req.body;
  
  console.log('📷 Legacy Instagram webhook received');
  console.log('📷 Update:', JSON.stringify(update, null, 2));

  // Try to find an active workflow with Instagram trigger
  if (workflowExecutor && workflowExecutor.activeWorkflows.size > 0) {
    const activeWorkflows = Array.from(workflowExecutor.activeWorkflows.keys());
    
    let targetWorkflow = null;
    for (const workflowId of activeWorkflows) {
      const workflow = workflowExecutor.activeWorkflows.get(workflowId);
      if (workflow && workflow.nodes) {
        const hasInstagramTrigger = workflow.nodes.some(node => 
          node.data.type === 'instagramTrigger' || node.data.type === 'instagramResponse'
        );
        if (hasInstagramTrigger) {
          targetWorkflow = workflowId;
          break;
        }
      }
    }
    
    if (targetWorkflow) {
      console.log(`🔄 LEGACY REDIRECT: Forwarding Instagram event to workflow: ${targetWorkflow}`);
      
      // Forward to workflow-specific endpoint
      req.url = `/instagram/${targetWorkflow}`;
      req.params = { workflowId: targetWorkflow };
      
      return router.handle(req, res, () => {
        console.log('📷 LEGACY REDIRECT: Instagram event forwarded successfully');
        res.status(200).json({ 
          success: true, 
          message: 'Instagram event forwarded to active workflow', 
          workflowId: targetWorkflow 
        });
      });
    } else {
      console.log('⚠️ LEGACY ENDPOINT: No active workflows with Instagram triggers found');
    }
  }

  res.status(200).json({ 
    success: true, 
    message: 'Instagram webhook received but no active workflows' 
  });
}));

// Register Instagram webhook for specific workflow
router.post('/register-instagram', asyncHandler(async (req, res) => {
  const { accessToken, accountId, nodeId, webhookUrl } = req.body;
  
  if (!accessToken || !accountId || !nodeId || !webhookUrl) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: accessToken, accountId, nodeId, webhookUrl'
    });
  }

  try {
    // Note: Instagram webhooks require app review and special permissions
    // This is a placeholder for webhook registration logic
    console.log('📷 Instagram webhook registration requested:', {
      accountId,
      nodeId,
      webhookUrl: webhookUrl.substring(0, 50) + '...'
    });

    // Store webhook registration locally
    registeredWebhooks.set(nodeId, {
      platform: 'instagram',
      accessToken,
      accountId,
      webhookUrl,
      registeredAt: new Date().toISOString()
    });

    logger.info(`Instagram webhook registered for node ${nodeId}`, {
      nodeId,
      accountId,
      webhookUrl
    });

    res.json({
      success: true,
      message: 'Instagram webhook registration prepared (requires app review for production)',
      nodeId,
      accountId,
      webhookUrl,
      note: 'Instagram webhooks require Facebook app review for production use'
    });

  } catch (error) {
    console.error('❌ Instagram webhook registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

// Process Instagram webhook data
function processInstagramWebhook(update) {
  if (!update || typeof update !== 'object') {
    return null;
  }

  // Instagram webhook structure varies by event type
  if (update.entry && Array.isArray(update.entry)) {
    const entry = update.entry[0];
    
    // Instagram messaging (requires special permissions)
    if (entry.messaging && Array.isArray(entry.messaging)) {
      const message = entry.messaging[0];
      return {
        type: 'dm',
        instagram_message: {
          sender_id: message.sender?.id,
          sender_name: message.sender?.name || 'Unknown',
          text: message.message?.text || '',
          timestamp: message.timestamp,
          message_id: message.message?.mid
        },
        raw_data: update
      };
    }
    
    // Instagram comments
    if (entry.changes && Array.isArray(entry.changes)) {
      const change = entry.changes.find(c => c.field === 'comments');
      if (change && change.value) {
        return {
          type: 'comment',
          instagram_comment: {
            id: change.value.id,
            text: change.value.text,
            user: change.value.from,
            media_id: change.value.media?.id,
            parent_id: change.value.parent_id,
            created_time: change.value.created_time
          },
          raw_data: update
        };
      }
    }
    
    // Instagram mentions
    if (entry.changes && Array.isArray(entry.changes)) {
      const change = entry.changes.find(c => c.field === 'mentions');
      if (change && change.value) {
        return {
          type: 'mention',
          instagram_mention: {
            comment_id: change.value.comment_id,
            media_id: change.value.media_id,
            text: change.value.text || '',
            user: change.value.user
          },
          raw_data: update
        };
      }
    }
  }

  return null;
}

// ============================================
// WHATSAPP WEBHOOKS
// ============================================

// WhatsApp webhook verification (GET request from Meta)
router.get('/whatsapp', (req, res) => {
  console.log('📱 WhatsApp webhook verification request:', req.query);
  
  const hubMode = req.query['hub.mode'];
  const hubChallenge = req.query['hub.challenge'];
  const hubVerifyToken = req.query['hub.verify_token'];
  
  // Use environment variable for verify token
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'whatsapp_verify_token_12345';
  
  if (hubMode === 'subscribe' && hubVerifyToken === expectedToken) {
    console.log('✅ WhatsApp webhook verification successful');
    res.status(200).send(hubChallenge);
  } else {
    console.log('❌ WhatsApp webhook verification failed');
    res.status(403).json({ error: 'Forbidden: Invalid verification token' });
  }
});

// WhatsApp webhook for receiving messages (POST request from Meta)
router.post('/whatsapp', asyncHandler(async (req, res) => {
  console.log('📱 WhatsApp webhook received:', JSON.stringify(req.body, null, 2));
  
  try {
    const webhookData = req.body;
    
    // Check if any executions are waiting for this webhook
    const matchedExecution = webhookStateManager.matchAndResolve({
      success: true,
      data: extractWhatsAppMessageData(webhookData),
      rawWebhookData: webhookData,
      timestamp: new Date().toISOString(),
      isRealMessage: true
    });
    
    if (matchedExecution) {
      console.log(`✅ WhatsApp webhook matched to waiting execution: ${matchedExecution}`);
      res.status(200).json({ success: true, matchedExecution });
      return;
    }
    
    // Acknowledge webhook immediately
    res.status(200).json({ success: true });
    
    // Process webhook asynchronously for active workflows
    await processWhatsAppWebhook(webhookData);
    
  } catch (error) {
    console.error('❌ WhatsApp webhook processing error:', error);
    // Still return 200 to prevent Meta from retrying
    res.status(200).json({ success: false, error: error.message });
  }
}));

// WhatsApp webhook for specific workflows
router.post('/whatsapp/:workflowId', asyncHandler(async (req, res) => {
  const workflowId = req.params.workflowId;
  console.log(`📱 WhatsApp webhook for workflow ${workflowId}:`, JSON.stringify(req.body, null, 2));
  
  try {
    const webhookData = req.body;
    
    // Acknowledge webhook immediately
    res.status(200).json({ success: true });
    
    // Process webhook for specific workflow
    await processWhatsAppWebhookForWorkflow(webhookData, workflowId);
    
  } catch (error) {
    console.error('❌ WhatsApp webhook processing error:', error);
    res.status(200).json({ success: false, error: error.message });
  }
}));

/**
 * Process WhatsApp webhook data
 */
async function processWhatsAppWebhook(webhookData) {
  try {
    console.log('🔄 Processing WhatsApp webhook...');
    
    // Find all workflows with WhatsApp trigger nodes
    const whatsappWorkflows = findWhatsAppTriggerWorkflows();
    
    if (whatsappWorkflows.length === 0) {
      console.log('📱 No WhatsApp trigger workflows found');
      return;
    }
    
    for (const workflow of whatsappWorkflows) {
      try {
        await processWhatsAppWebhookForWorkflow(webhookData, workflow.id);
      } catch (error) {
        console.error(`❌ Error processing WhatsApp webhook for workflow ${workflow.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error in processWhatsAppWebhook:', error);
  }
}

/**
 * Process WhatsApp webhook for specific workflow
 */
async function processWhatsAppWebhookForWorkflow(webhookData, workflowId) {
  try {
    console.log(`🔄 Processing WhatsApp webhook for workflow ${workflowId}...`);
    
    // Validate webhook data
    if (!webhookData || webhookData.object !== 'whatsapp_business_account') {
      console.log('📱 Invalid WhatsApp webhook data, ignoring');
      return;
    }
    
    // Extract message data
    const messageData = extractWhatsAppMessageData(webhookData);
    if (!messageData) {
      console.log('📱 No valid message data found in WhatsApp webhook');
      return;
    }
    
    console.log('📱 Extracted WhatsApp message data:', messageData);
    
    // Trigger workflow execution
    if (workflowExecutor) {
      const triggerData = {
        trigger: 'whatsapp',
        data: messageData,
        whatsappWebhook: webhookData,
        timestamp: new Date().toISOString()
      };
      
      console.log(`🚀 Triggering workflow ${workflowId} with WhatsApp data`);
      await workflowExecutor.executeWorkflow(workflowId, triggerData);
    } else {
      console.warn('⚠️ WorkflowExecutor not available for WhatsApp webhook');
    }
    
  } catch (error) {
    console.error(`❌ Error processing WhatsApp webhook for workflow ${workflowId}:`, error);
  }
}

/**
 * Find workflows with WhatsApp trigger nodes
 */
function findWhatsAppTriggerWorkflows() {
  const whatsappWorkflows = [];
  
  // Check active workflows from workflowExecutor
  if (workflowExecutor && workflowExecutor.activeWorkflows) {
    console.log(`🔍 Checking ${workflowExecutor.activeWorkflows.size} active workflows for WhatsApp triggers`);
    
    for (const [workflowId, workflowConfig] of workflowExecutor.activeWorkflows.entries()) {
      console.log(`   📋 Workflow ${workflowId}: ${workflowConfig.nodes?.length || 0} nodes`);
      
      if (workflowConfig && workflowConfig.nodes) {
        const hasWhatsAppTrigger = workflowConfig.nodes.some(node => 
          node.data && (node.data.type === 'whatsappTrigger' || node.data.type === 'whatsapp_trigger')
        );
        
        if (hasWhatsAppTrigger) {
          console.log(`   ✅ Found WhatsApp trigger in workflow ${workflowId}`);
          whatsappWorkflows.push({ id: workflowId, config: workflowConfig });
        } else {
          console.log(`   ❌ No WhatsApp trigger in workflow ${workflowId}`);
        }
      }
    }
  } else {
    console.log('❌ workflowExecutor or activeWorkflows not available');
  }
  
  return whatsappWorkflows;
}

/**
 * Extract message data from WhatsApp webhook
 */
function extractWhatsAppMessageData(webhookData) {
  try {
    if (!webhookData.entry || !Array.isArray(webhookData.entry) || webhookData.entry.length === 0) {
      return null;
    }
    
    const entry = webhookData.entry[0];
    if (!entry.changes || !Array.isArray(entry.changes) || entry.changes.length === 0) {
      return null;
    }
    
    const change = entry.changes[0];
    const value = change.value;
    
    if (!value.messages || !Array.isArray(value.messages) || value.messages.length === 0) {
      return null;
    }
    
    const message = value.messages[0];
    const contact = value.contacts && value.contacts.length > 0 ? value.contacts[0] : null;
    
    return {
      messageId: message.id,
      from: message.from,
      phoneNumber: message.from,
      fromName: contact?.profile?.name || contact?.wa_id || message.from,
      text: message.text?.body || message.type || 'Unknown message type',
      messageType: message.type,
      timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      contact: contact,
      rawMessage: message,
      rawWebhook: webhookData
    };
    
  } catch (error) {
    console.error('❌ Error extracting WhatsApp message data:', error);
    return null;
  }
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    workflowCount: workflowConfigs.size,
    workflowExecutorAvailable: !!workflowExecutor
  });
});

// =================================================================
// AI ASSISTANT WEBHOOK HANDLER
// =================================================================

// AI Assistant Telegram webhook - handles messages for AI assistants  
router.post('/ai-assistant/:assistantId', asyncHandler(async (req, res) => {
  const assistantId = req.params.assistantId;
  const update = req.body;

  console.log('🤖 AI Assistant webhook received:', assistantId);
  console.log('📦 Update data:', JSON.stringify(update, null, 2));

  try {
    // Acknowledge Telegram immediately
    res.status(200).json({ ok: true });

    // Validate update structure
    if (!update || !update.message) {
      console.log('❌ Invalid update structure - no message');
      return;
    }

    const message = update.message;
    const chatId = message.chat.id;
    const messageText = message.text;
    const customerName = message.from.first_name || message.from.username || 'Unknown';

    // Prepare customer info
    const customerInfo = {
      chatId: chatId.toString(),
      name: customerName,
      username: message.from.username,
      firstName: message.from.first_name,
      lastName: message.from.last_name
    };

    // Prepare customer message
    const customerMessage = {
      text: messageText,
      messageId: message.message_id,
      timestamp: new Date(message.date * 1000).toISOString()
    };

    // Use Advanced AI Processor for enhanced conversation handling
    const advancedAIProcessor = require('../services/advancedAIProcessor');
    const startTime = Date.now();
    
    console.log('🧠 Using Advanced AI Processing for assistant:', assistantId);
    console.log('👤 Customer:', customerName, `(${chatId})`);
    console.log('💬 Message:', messageText);

    // Get assistant info
    const db = require('../db');
    const assistant = await new Promise((resolve, reject) => {
      db.get('SELECT telegram_token, user_id FROM ai_assistants WHERE id = ?', 
        [assistantId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    // SIMPLIFIED: Skip AI processing, just save message to database
    console.log('📝 Skipping AI processing - saving message directly to database');
    
    // Save conversation to database without AI response
    console.log('💾 Saving simple message to database...');
    console.log(`🔍 DEBUG: Saving with assistantId: ${assistantId}, chatId: ${chatId}, customerName: ${customerName}, messageText: ${messageText}`);
    db.run(`
      INSERT INTO ai_conversations 
      (assistant_id, customer_id, customer_name, message_text, response_text, 
       response_time_ms, success, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      assistantId,
      chatId.toString(),
      customerName,
      messageText,
      'Message received (AI processing disabled)',
      Date.now() - startTime,
      1 // success = true
    ], function(err) {
      if (err) {
        console.error('❌ Failed to save message to database:', err);
        console.error('❌ Database error details:', err.message);
      } else {
        console.log('✅ Message saved to database with ID:', this.lastID);
        console.log(`✅ DEBUG: Saved conversation - assistant_id: ${assistantId}, customer_id: ${chatId}, message: "${messageText}"`);
      }
    });

    // Send simple acknowledgment back to customer
    if (assistant && assistant.telegram_token) {
      console.log('📤 Sending acknowledgment to customer...');
      const axios = require('axios');
      const telegramResponse = await axios.post(`https://api.telegram.org/bot${assistant.telegram_token}/sendMessage`, {
        chat_id: chatId,
        text: `✅ Message received: "${messageText}"`
      });

      console.log('📤 Acknowledgment sent:', telegramResponse.data.ok);
    }

    // OLD AI PROCESSING CODE (commented out for now):
    /*
    const result = await advancedAIProcessor.processAdvancedConversation(
      assistantId,
      customerMessage,
      customerInfo
    );

    if (result.success) {
      // Send response back to Telegram

      if (assistant && assistant.telegram_token) {
        const telegramResponse = await fetch(`https://api.telegram.org/bot${assistant.telegram_token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: result.response,
            parse_mode: 'Markdown'
          })
        });

        const telegramData = await telegramResponse.json();
        
        if (telegramData.ok) {
          console.log('✅ Enhanced AI response sent successfully');
          result.metadata.processing_time = Date.now() - startTime;
          
          // Save conversation to database for frontend display
          console.log('💾 Saving conversation to database...');
          db.run(`
            INSERT INTO ai_conversations 
            (assistant_id, customer_id, customer_name, message_text, response_text, 
             response_time_ms, success, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `, [
            assistantId,
            chatId.toString(),
            customerName,
            messageText,
            result.response,
            result.metadata.processing_time,
            1
          ], function(err) {
            if (err) {
              console.error('❌ Failed to save conversation to database:', err);
            } else {
              console.log('✅ Conversation saved to database with ID:', this.lastID);
            }
          });
          
          // Broadcast to real-time monitors
          try {
            const { realtimeManager } = require('./aiAssistantRealtime');
            realtimeManager.broadcastNewConversation(assistantId, {
              customer_id: chatId.toString(),
              customer_name: customerName,
              message_text: messageText,
              response_text: result.response,
              response_time_ms: result.metadata.processing_time,
              language: result.metadata.language,
              sentiment: result.metadata.sentiment,
              prompt_variant: result.metadata.prompt_variant,
              success: true,
              created_at: new Date().toISOString()
            });
          } catch (broadcastError) {
            console.error('⚠️ Failed to broadcast conversation:', broadcastError);
          }
        } else {
          throw new Error(`Telegram API error: ${telegramData.description}`);
        }
      }
    } else {
      console.error('❌ Advanced AI processing failed:', result.error);
      
      // Save failed conversation to database
      console.log('💾 Saving failed conversation to database...');
      db.run(`
        INSERT INTO ai_conversations 
        (assistant_id, customer_id, customer_name, message_text, response_text, 
         response_time_ms, success, error_message, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        assistantId,
        chatId.toString(),
        customerName,
        messageText,
        result.fallback_response || 'Error processing request',
        Date.now() - startTime,
        0, // success = false
        result.error
      ], function(err) {
        if (err) {
          console.error('❌ Failed to save failed conversation to database:', err);
        } else {
          console.log('✅ Failed conversation saved to database with ID:', this.lastID);
        }
      });
      
      // Send fallback response
      if (result.fallback_response && assistant && assistant.telegram_token) {
        try {
          const fetch = require('node-fetch');
          await fetch(`https://api.telegram.org/bot${assistant.telegram_token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: result.fallback_response
            })
          });
        } catch (telegramError) {
          console.error('❌ Failed to send fallback message:', telegramError);
        }
      }
    }
    */

  } catch (error) {
    console.error('❌ AI Assistant webhook processing failed:', error);
    // Response already sent, so just log the error
  }
}));


module.exports = router;