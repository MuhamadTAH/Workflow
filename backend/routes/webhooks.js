// Old chatSessions service removed - using chatMessageStorage instead
const { logWorkflowTriggered } = require('../controllers/workflowController');
const scheduler = require('../services/scheduler');
const TriggerDataProcessor = require('../services/triggerDataProcessor');
const jobQueue = require('../services/jobQueue');
const chatMessageStorage = require('../services/chatMessageStorage');

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
    
    // Check if workflow is active and queue for execution
    if (workflowExecutor && workflowExecutor.activeWorkflows.has(workflowId)) {
      try {
        // Log the workflow trigger event
        const summary = TriggerDataProcessor.getSummary(standardizedData);
        logWorkflowTriggered(workflowId, 'telegramTrigger', summary);
        
        // Prepare trigger data for workflow execution
        const triggerData = TriggerDataProcessor.toExecutionFormat(standardizedData);
        
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
      console.warn('[telegram-webhook] ⚠️ Workflow not found or not active:', workflowId);
      if (workflowExecutor) {
        console.log(`[telegram-webhook] 📋 Available workflows: [${Array.from(workflowExecutor.activeWorkflows.keys()).join(', ')}]`);
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

// Simple test route to verify webhook routing works
router.get('/test-chat', (req, res) => {
  console.log('🧪 Test chat route hit');
  res.json({ 
    success: true, 
    message: 'Chat webhook routing is working',
    timestamp: new Date().toISOString()
  });
});

// REMOVED: Old problematic webhook route that was causing 500 errors




// Dev-only route to test runWorkflow existence
router.get('/_dev/check-runWorkflow', (req, res) => {
  res.json({ 
    hasRunWorkflow: typeof global.runWorkflow === 'function',
    workflowExecutorAvailable: !!workflowExecutor,
    chatTriggerNodeAvailable: false
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

// Chat Trigger webhook endpoint
router.post('/chat-trigger', asyncHandler(async (req, res) => {
  try {
    const { message, nodeId, timestamp, userMetadata } = req.body;
    
    // Validate required fields
    if (!message || !nodeId) {
      return res.status(400).json({
        success: false,
        message: 'Message and nodeId are required'
      });
    }
    
    // Validate message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message too long (max 1000 characters)'
      });
    }
    
    console.log(`💬 Chat message received for node ${nodeId}:`, {
      messageLength: message.length,
      timestamp: timestamp || 'auto-generated'
    });
    
    // Create session if it doesn't exist
    const existingSession = await chatMessageStorage.getSession(nodeId);
    if (!existingSession) {
      await chatMessageStorage.createOrUpdateSession(nodeId, 'Chat Support');
    }
    
    // Store the message
    const userData = {
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      timestamp: timestamp || new Date().toISOString(),
      ...userMetadata
    };
    
    const storedMessage = await chatMessageStorage.storeMessage(
      nodeId,
      message,
      'user',
      userData
    );
    
    // Get message count for this session
    const messageCount = await chatMessageStorage.getMessageCount(nodeId);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Chat message stored successfully',
      data: {
        messageId: storedMessage.id,
        sessionId: nodeId,
        timestamp: storedMessage.timestamp,
        messageCount: messageCount
      }
    });
    
    logger.info('Chat message processed successfully', {
      nodeId,
      messageId: storedMessage.id,
      messageLength: message.length
    });
    
  } catch (error) {
    console.error('❌ Chat trigger webhook failed:', error);
    logger.error('Chat trigger webhook error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: error.message
    });
  }
}));

module.exports = router;