const express = require('express');
const router = express.Router();
const workflowEngine = require('../workflowEngine');
const logger = require('../services/logger');
const { asyncHandler } = require('../middleware/errorHandler');

// Try to load WorkflowExecutor, but don't fail if it doesn't exist
let WorkflowExecutor = null;
let workflowExecutor = null;
try {
  WorkflowExecutor = require('../services/workflowExecutor');
  workflowExecutor = new WorkflowExecutor();
  console.log('✅ WorkflowExecutor loaded successfully');
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

// POST: Telegram webhook endpoint
router.post('/telegram', asyncHandler(async (req, res) => {
  const update = req.body;
  const logPath = path.join(__dirname, '../logs/telegram-2025-07-27.log');
  
  try {
    // Ensure logs directory exists
    const logsDir = path.dirname(logPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Save payload to file (for now this is your node "input")
    fs.writeFileSync(logPath, JSON.stringify(update, null, 2));
    
    // Log to console
    console.log('📥 Telegram message received:', update);
    logger.logTelegramEvent('webhook', 'message_received', {
      updateId: update.update_id,
      messageId: update.message?.message_id,
      chatId: update.message?.chat?.id,
      text: update.message?.text
    });

    // Store the message for potential workflow processing
    if (update.message) {
      const messageData = {
        updateId: update.update_id,
        messageId: update.message.message_id,
        chatId: update.message.chat.id,
        text: update.message.text,
        from: update.message.from,
        date: update.message.date,
        timestamp: new Date().toISOString()
      };

      // This will be your node input data
      console.log('📦 Message data for node input:', messageData);
    }

    res.status(200).json({ ok: true, message: 'Message received successfully' });
  } catch (error) {
    logger.logError(error, { context: 'telegram_webhook' });
    res.status(500).json({ ok: false, error: 'Failed to process message' });
  }
}));

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

module.exports = router;