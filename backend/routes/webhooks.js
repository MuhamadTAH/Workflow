// Chat Trigger webhook integration with existing webhook system
const ChatTriggerNode = require('../nodes/triggers/chatTriggerNode');
const { getMessages } = require('../services/chatSessions');

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

// Initialize Chat Trigger node instance
let chatTriggerNode;
try {
  chatTriggerNode = new ChatTriggerNode();
  console.log('✅ ChatTriggerNode instance created successfully');
} catch (error) {
  console.error('❌ Failed to create ChatTriggerNode instance:', error);
  chatTriggerNode = null;
}

// Store for Chat Trigger webhook registrations
const chatTriggerWebhooks = new Map();


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

// Enhanced debug-friendly webhook handler for Chat Trigger
router.post('/chatTrigger/:workflowId/:nodeId/:path', async (req, res) => {
  try {
    const { workflowId, nodeId } = req.params;
    const key = `${workflowId}-${nodeId}`;

    // Debug log incoming request
    console.info('[webhook] Chat Trigger incoming request', { 
      workflowId, 
      nodeId, 
      path: req.params.path, 
      ip: req.ip,
      bodyKeys: Object.keys(req.body || {})
    });

    // Check if Chat Trigger node instance exists
    if (!chatTriggerNode) {
      console.error('[webhook] ChatTriggerNode instance not available');
      return res.status(500).json({ 
        error: 'ChatTriggerNode instance not initialized' 
      });
    }

    // 1) Process webhook data (normalize) - wrapped in try/catch
    let processed;
    try {
      processed = await chatTriggerNode.processWebhookData({
        body: req.body,
        headers: req.headers,
        query: req.query,
        method: req.method,
        ip: req.ip
      }, {});
      console.log('[webhook] Processed data:', JSON.stringify(processed, null, 2));
    } catch (err) {
      console.error('[webhook] processWebhookData threw:', err && err.stack ? err.stack : err);
      return res.status(500).json({ 
        error: { 
          message: 'processWebhookData error', 
          detail: err.message 
        }
      });
    }

    // Store the processed message for node retrieval
    const nodeMessages = req.app.get('nodeMessages');
    if (nodeMessages) {
      if (!nodeMessages.has(key)) {
        nodeMessages.set(key, []);
      }
      nodeMessages.get(key).push({
        text: processed.json.text,
        userId: processed.json.userId || 'user-' + Date.now(),
        sessionId: processed.json.sessionId,
        source: processed.json.source,
        metadata: processed.json.metadata,
        timestamp: processed.timestamp,
        raw: processed.json.raw
      });
      console.log('[webhook] Message stored for key:', key);
    }

    // If debug flag provided, return processed payload directly for inspection
    if (req.query._debug === '1' || req.headers['x-debug'] === '1') {
      return res.status(200).json({ 
        ok: true, 
        debugProcessed: processed,
        storedMessages: nodeMessages?.get(key)?.length || 0
      });
    }

    // 2) Check for immediate responses from Chat Trigger Response nodes
    const sessionId = processed.json.sessionId;
    let immediateResponse = null;
    
    if (sessionId) {
      // Check for stored responses for this session
      const storedMessages = getMessages(sessionId);
      if (storedMessages && storedMessages.length > 0) {
        // Get the latest response message
        immediateResponse = storedMessages[storedMessages.length - 1];
        console.log('[webhook] Found immediate response:', immediateResponse);
      }
    }
    
    // 3) Return response in format expected by n8n chat widget
    if (immediateResponse) {
      return res.status(200).json({
        ok: true,
        output: immediateResponse, // n8n chat widget expects "output" field
        data: processed.json,
        hasImmediateResponse: true
      });
    } else {
      // No immediate response - fallback chat will poll for responses
      return res.status(200).json({ 
        ok: true, 
        message: 'Chat message received and stored',
        data: processed.json,
        hasImmediateResponse: false
      });
    }

  } catch (err) {
    console.error('[webhook] Unexpected error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ 
      ok: false, 
      error: { 
        message: 'Internal server error',
        detail: err.message
      }
    });
  }
});

// Register Chat Trigger webhook
router.post('/register-chat-trigger', asyncHandler(async (req, res) => {
  const { workflowId, nodeId, config = {} } = req.body;
  
  if (!workflowId || !nodeId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: workflowId, nodeId'
    });
  }

  try {
    const key = `${workflowId}-${nodeId}`;
    
    // Generate webhook URL
    const webhookUrl = chatTriggerNode.generateWebhookUrl(workflowId, nodeId, config);
    
    // Store webhook registration
    chatTriggerWebhooks.set(key, {
      workflowId,
      nodeId,
      config,
      webhookUrl,
      registeredAt: new Date().toISOString()
    });

    logger.info(`Chat Trigger webhook registered`, { workflowId, nodeId, webhookUrl });

    res.json({
      success: true,
      message: 'Chat Trigger webhook registered successfully',
      workflowId,
      nodeId,
      webhookUrl,
      config
    });
  } catch (error) {
    logger.logError(error, { context: 'register-chat-trigger', workflowId, nodeId });
    res.status(500).json({
      success: false,
      error: 'Failed to register Chat Trigger webhook: ' + error.message
    });
  }
}));

// Get Chat Trigger webhook status
router.get('/chat-trigger-status/:workflowId/:nodeId', (req, res) => {
  const { workflowId, nodeId } = req.params;
  const key = `${workflowId}-${nodeId}`;
  const webhook = chatTriggerWebhooks.get(key);
  
  res.json({
    success: true,
    registered: !!webhook,
    webhook: webhook || null,
    workflowId,
    nodeId
  });
});

// Dev-only route to test runWorkflow existence
router.get('/_dev/check-runWorkflow', (req, res) => {
  res.json({ 
    hasRunWorkflow: typeof global.runWorkflow === 'function',
    workflowExecutorAvailable: !!workflowExecutor,
    chatTriggerNodeAvailable: !!chatTriggerNode
  });
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