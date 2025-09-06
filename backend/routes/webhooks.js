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
const billingService = require('../services/billingService');

// Try to load WorkflowExecutor singleton, but don't fail if it doesn't exist
let workflowExecutor = null;
try {
  workflowExecutor = require('../services/workflowExecutor'); // Import singleton instance
  console.log('✅ WorkflowExecutor singleton loaded successfully');
} catch (error) {
  console.warn('⚠️ WorkflowExecutor not available:', error.message);
}

// Import WhatsApp receiver functions
const { storeWhatsAppMessage, getReceiverState } = require('./whatsapp-receiver');
const fs = require('fs');
const path = require('path');

// Add fetch support for Node.js
let fetch;
try {
  fetch = require('node-fetch');
} catch (e) {
  // Use built-in fetch if available (Node 18+)
  if (typeof globalThis.fetch !== 'undefined') {
    fetch = globalThis.fetch;
  } else {
    console.warn('⚠️ Fetch not available - AI responses may not work');
  }
}

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


// WhatsApp webhook endpoint
router.post('/whatsapp', asyncHandler(async (req, res) => {
  const webhookData = req.body;
  const query = req.query;

  console.log('📱 WhatsApp webhook received:', JSON.stringify(webhookData, null, 2));
  console.log('📱 WhatsApp query params:', JSON.stringify(query, null, 2));

  try {
    // Handle webhook verification (GET request simulation via query params)
    if (query['hub.mode'] === 'subscribe' && query['hub.verify_token'] && query['hub.challenge']) {
      console.log('📱 WhatsApp webhook verification request');
      
      // For now, accept all verification requests (in production, verify the token)
      const challenge = query['hub.challenge'];
      console.log('✅ WhatsApp webhook verification successful, returning challenge:', challenge);
      
      return res.status(200).send(challenge);
    }

    // Handle webhook verification via POST body (alternative method)
    if (webhookData && webhookData['hub.challenge']) {
      console.log('📱 WhatsApp webhook verification via POST body');
      const challenge = webhookData['hub.challenge'];
      return res.status(200).send(challenge);
    }

    // Store message in WhatsApp receiver if active
    let storeResult = null;
    try {
      storeResult = await storeWhatsAppMessage(webhookData);
      console.log('💾 WhatsApp message storage result:', storeResult);
    } catch (storeError) {
      console.error('❌ Failed to store WhatsApp message:', storeError);
      // Continue processing even if storage fails
    }

    // CLAUDE AI AUTO-RESPONSE FOR WHATSAPP (Similar to Telegram system)
    try {
      // Import axios at the beginning for both Claude API and WhatsApp API calls
      const axios = require('axios');
      console.log('🔧 DEBUG: axios loaded successfully for WhatsApp AI processing');
      const receiverState = getReceiverState();
      
      console.log('🔍 DEBUG: Receiver state:', {
        isActive: receiverState.isActive,
        storeResult: storeResult ? { stored: storeResult.stored, hasMessageData: !!storeResult.messageData } : 'null'
      });
      
      // TEST MODE: Force AI processing for billing debug (even if receiver inactive)
      const isTestBilling = webhookData.message && (webhookData.message.includes('test billing') || webhookData.message.includes('debug'));
      
      // Only process AI responses if WhatsApp receiver is active and we have stored a message
      // OR if this is a test billing message
      if ((receiverState.isActive && storeResult && storeResult.stored && storeResult.messageData) || isTestBilling) {
        console.log('🤖 Processing WhatsApp message for Claude AI auto-response...');
        
        // Use actual messageData if available, otherwise create mock data for testing
        let messageData, phoneNumber, messageText, contactName;
        
        if (storeResult && storeResult.messageData) {
          messageData = storeResult.messageData;
          phoneNumber = messageData.phoneNumber;
          messageText = messageData.messageText;
          contactName = messageData.contactName || 'Unknown Contact';
        } else if (isTestBilling) {
          // Create mock data for test billing
          console.log('🧪 Creating mock message data for test billing');
          phoneNumber = webhookData.phone || '+1234567890';
          messageText = webhookData.message;
          contactName = 'Test User';
          messageData = {
            phoneNumber,
            messageText,
            contactName,
            messageId: 'test_message_' + Date.now(),
            timestamp: new Date().toISOString()
          };
        }
        
        console.log('📱 WhatsApp AI Processing:', {
          from: phoneNumber,
          name: contactName,
          text: messageText?.substring(0, 50)
        });

        // Use Advanced AI Processor for enhanced conversation handling (same as Telegram)
        const advancedAIProcessor = require('../services/advancedAIProcessor');
        const startTime = Date.now();
        
        console.log('🧠 Using Advanced AI Processing for WhatsApp message');
        
        // Prepare customer info (WhatsApp format)
        const customerInfo = {
          chatId: phoneNumber, // Use phone number as chat ID for WhatsApp
          name: contactName,
          username: null, // WhatsApp doesn't have usernames
          firstName: contactName,
          lastName: null
        };

        // Prepare customer message (WhatsApp format)
        const customerMessage = {
          text: messageText,
          messageId: messageData.messageId,
          timestamp: messageData.timestamp
        };

        // Get Claude configuration from the same system used by Telegram
        const { claudeConfigs, systemPrompts, knowledgeBase } = require('./claude');
        
        // For now, we'll use the first available Claude configuration
        // In production, this should be configurable per WhatsApp business account
        let claudeConfig = null;
        let userId = null;
        
        // Find the first user with a Claude API configuration
        for (const [id, config] of claudeConfigs.entries()) {
          if (config && config.apiKey) {
            claudeConfig = config;
            userId = id;
            console.log('🔍 Using Claude config from user:', userId);
            break;
          }
        }

        if (!claudeConfig || !claudeConfig.apiKey) {
          console.log('⚠️ No Claude API configuration found - skipping AI response');
          console.log('🔧 Available Claude configs:', Array.from(claudeConfigs.keys()));
        } else {
          console.log('✅ Found Claude API key for WhatsApp AI responses');
          
          // Get system prompt and knowledge base for this user
          const systemPromptData = systemPrompts.get(userId);
          let systemPrompt = systemPromptData?.prompt || `You are a helpful WhatsApp assistant. Respond to customer messages in a friendly, professional manner. 
          
Key guidelines:
- Keep responses concise and helpful  
- Use emojis appropriately for WhatsApp
- Be conversational but professional
- If you cannot help with something specific, offer to connect them with a human agent
- Always be polite and understanding`;

          // Get knowledge base for this user
          const knowledge = knowledgeBase.get(userId);
          if (knowledge) {
            console.log('📚 Adding knowledge base to WhatsApp AI:', knowledge.filename);
            systemPrompt += `\n\nIMPORTANT - You have access to this business knowledge base:\n\n`;
            systemPrompt += `--- BUSINESS KNOWLEDGE BASE ---\n${knowledge.extractedText}\n--- END KNOWLEDGE BASE ---\n\n`;
            systemPrompt += `INSTRUCTIONS: When users ask questions about the business (hours, services, location, contact info, policies, etc.), use the information from the knowledge base above. This is YOUR business information. Answer as if you represent this business and have full access to this information.`;
          }

          const mockWhatsAppAssistant = {
            id: 'whatsapp_auto_responder',
            system_prompt: systemPrompt,
            ai_provider: 'claude',
            ai_api_key: claudeConfig.apiKey,
            ai_model: 'claude-3-5-sonnet-20241022'
          };

          console.log('🔄 Processing WhatsApp message with Claude AI...');
          
          // Use direct Claude API call instead of AdvancedAIProcessor to avoid database dependency
          let result = null;
          try {
            console.log('📞 Making direct Claude API call for WhatsApp...');
            const response = await axios.post('https://api.anthropic.com/v1/messages', {
              model: mockWhatsAppAssistant.ai_model,
              max_tokens: 500,
              messages: [
                {
                  role: 'user',
                  content: `${mockWhatsAppAssistant.system_prompt}\n\nCustomer: ${messageText}`
                }
              ]
            }, {
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': mockWhatsAppAssistant.ai_api_key,
                'anthropic-version': '2023-06-01'
              }
            });

            const data = response.data;
            
            if (!response || response.status !== 200) {
              console.error('❌ Claude API error:', data);
              throw new Error(`Claude API error: ${data.error?.message || response.statusText}`);
            }
            
            const aiResponseText = data.content[0].text;
            console.log('✅ Claude API response generated:', aiResponseText?.substring(0, 100));
            
            // Track usage for billing (userId = 2 for your account)
            try {
              const inputTokens = data.usage?.input_tokens || 0;
              const outputTokens = data.usage?.output_tokens || 0;
              
              console.log('💰 WhatsApp Claude API Usage:', {
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                total_tokens: inputTokens + outputTokens
              });
              
              console.log('🔍 DEBUG: Starting billing process...');
              
              // Get Claude model info from database for billing
              const db = require('../db');
              console.log('🔍 DEBUG: Looking for AI model:', mockWhatsAppAssistant.ai_model);
              
              const aiModel = await new Promise((resolve, reject) => {
                db.get(`
                  SELECT * FROM ai_models 
                  WHERE (name = ? OR model_id = ?) AND is_active = 1
                `, [mockWhatsAppAssistant.ai_model, mockWhatsAppAssistant.ai_model], (err, row) => {
                  if (err) reject(err);
                  else resolve(row);
                });
              });

              console.log('🔍 DEBUG: AI Model found:', aiModel ? `ID: ${aiModel.id}, Name: ${aiModel.name}` : 'NOT FOUND');
              
              if (!aiModel) {
                console.error('❌ AI model not found in database for billing:', mockWhatsAppAssistant.ai_model);
                return; // Skip billing if model not found
              }
              
              if (inputTokens > 0 || outputTokens > 0) {
                console.log('🔍 DEBUG: Calling billingService.trackUsage...');
                
                const billingResult = await billingService.trackUsage(
                  2,                // Your user ID
                  aiModel.id,       // Claude model ID
                  inputTokens,      // Input tokens
                  outputTokens,     // Output tokens
                  null,            // conversationId
                  null,            // assistantId
                  'whatsapp_webhook' // usage type
                );
                
                console.log('💳 WhatsApp usage tracked for billing:', {
                  user_id: 2,
                  tokens: inputTokens + outputTokens,
                  billable_price: billingResult.billablePrice,
                  free_tier_used: billingResult.freeTierUsed
                });
              } else {
                console.log('🔍 DEBUG: No tokens to bill (inputTokens=0, outputTokens=0)');
              }
            } catch (billingError) {
              console.error('❌ WhatsApp billing tracking error:', billingError.message);
              console.error('❌ Full billing error:', billingError);
              // Don't fail the request if billing fails
            }
            
            result = {
              success: true,
              response: aiResponseText,
              metadata: {
                processing_time: Date.now() - startTime,
                ai_model: mockWhatsAppAssistant.ai_model
              }
            };
          
          } catch (claudeError) {
            console.error('❌ Claude API call failed:', claudeError);
            result = {
              success: false,
              error: claudeError.message,
              fallback_response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment."
            };
          }

          if (result && result.success) {
            console.log('✅ Claude AI generated response for WhatsApp:', result.response?.substring(0, 100));
            
            // Send response back via WhatsApp using the unified configuration
            if (receiverState.accessToken && receiverState.phoneNumberSendId) {
              console.log('📤 Sending AI response via WhatsApp...');
              console.log('🔧 DEBUG: About to use axios for WhatsApp sending, axios defined:', typeof axios);
              
              // Use WhatsApp Business API to send the response
              const url = `https://graph.facebook.com/v21.0/${receiverState.phoneNumberSendId}/messages`;
              
              const requestBody = {
                messaging_product: 'whatsapp',
                to: phoneNumber,
                type: 'text',
                text: {
                  body: result.response
                }
              };

              const response = await axios.post(url, requestBody, {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${receiverState.accessToken}`,
                  'User-Agent': 'WhatsApp-AI-Bot/1.0'
                }
              });

              const data = response.data;

              if (response.status !== 200) {
                const errorMsg = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                console.error('❌ WhatsApp AI Response Send Error:', data);
              } else {
                console.log('✅ WhatsApp AI Response sent successfully:', {
                  messageId: data.messages?.[0]?.id,
                  status: data.messages?.[0]?.message_status || 'sent'
                });

                // Store the AI response as an outgoing message in the database
                try {
                  const db = require('../db');
                  const insertQuery = `
                    INSERT INTO whatsapp_receiver_messages 
                    (phone_number, contact_name, message_text, message_id, message_type, timestamp, raw_data, direction, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `;
                  
                  const now = new Date().toISOString();
                  const responseMessageId = data.messages?.[0]?.id || `ai_response_${Date.now()}`;
                  
                  await new Promise((resolve, reject) => {
                    db.run(insertQuery, [
                      phoneNumber,
                      contactName,
                      result.response,
                      responseMessageId,
                      'text',
                      now,
                      JSON.stringify({ 
                        ai_generated: true, 
                        whatsappResponse: data,
                        phoneNumberSendId: receiverState.phoneNumberSendId,
                        processing_time: Date.now() - startTime,
                        ai_model: mockWhatsAppAssistant.ai_model
                      }),
                      'outgoing',
                      now
                    ], function(err) {
                      if (err) reject(err);
                      else resolve(this.lastID);
                    });
                  });
                  
                  console.log('💾 Stored AI response message in WhatsApp database');
                  
                } catch (dbError) {
                  console.error('⚠️ Failed to store AI response in database:', dbError);
                }
              }
              
            } else {
              console.log('⚠️ WhatsApp sending credentials not available - AI response not sent');
            }
            
          } else if (result) {
            console.error('❌ WhatsApp AI processing failed:', result.error);
          }
        } // End of Claude configuration check
      } else {
        console.log('📴 WhatsApp AI processing skipped - receiver inactive or no stored message');
      }
      
    } catch (aiError) {
      console.error('❌ WhatsApp AI processing error:', aiError);
      // Continue processing even if AI fails
    }

    // Process regular webhook data for active workflows
    if (workflowExecutor && webhookData.object === 'whatsapp_business_account') {
      console.log('🔍 Checking for active WhatsApp workflows...');
      
      // Find workflows with WhatsApp triggers
      const whatsappWorkflows = [];
      for (const [workflowId, workflow] of workflowExecutor.activeWorkflows.entries()) {
        if (workflow && workflow.nodes) {
          const hasWhatsAppTrigger = workflow.nodes.some(node => 
            node.data && node.data.type === 'whatsappTrigger'
          );
          
          if (hasWhatsAppTrigger) {
            whatsappWorkflows.push({ workflowId, workflow });
          }
        }
      }

      console.log(`📊 Found ${whatsappWorkflows.length} active WhatsApp workflows`);

      // Process each matching workflow
      if (whatsappWorkflows.length > 0) {
        for (const { workflowId, workflow } of whatsappWorkflows) {
          try {
            console.log(`🚀 Triggering WhatsApp workflow: ${workflowId}`);
            
            // Standardize trigger data
            const standardizedData = TriggerDataProcessor.standardizeTriggerData(
              'whatsappTrigger', 
              webhookData, 
              `whatsapp-trigger-${workflowId}`
            );
            
            // Log the workflow trigger event
            const summary = TriggerDataProcessor.getSummary(standardizedData);
            logWorkflowTriggered(workflowId, 'whatsappTrigger', summary);
            
            // Prepare trigger data for workflow execution
            const triggerData = TriggerDataProcessor.toExecutionFormat(standardizedData);
            
            // Add job to queue
            const jobResult = await jobQueue.addJob({
              workflowId,
              triggerData: triggerData,
              triggerType: 'whatsappTrigger',
              priority: 'normal',
              metadata: {
                source: 'whatsapp_webhook',
                messageFrom: webhookData.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from,
                messageType: webhookData.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.type,
                ip: req.ip
              }
            });
            
            console.log(`✅ WhatsApp workflow job queued: ${jobResult.jobId}`);
            
          } catch (workflowError) {
            console.error(`❌ Error processing WhatsApp workflow ${workflowId}:`, workflowError);
          }
        }
      }
    }

    // Always return success to WhatsApp
    res.status(200).json({
      success: true,
      message: 'WhatsApp webhook processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error);
    
    // Still return 200 to WhatsApp to avoid retries
    res.status(200).json({
      success: false,
      error: 'Internal processing error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

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

// WhatsApp webhooks removed - use workflow builder WhatsApp nodes instead

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