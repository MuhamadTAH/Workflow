const express = require('express');
const router = express.Router();
const workflowEngine = require('../workflowEngine');
const { TelegramAPI } = require('../services/telegramAPI');
const logger = require('../services/logger');
const { asyncHandler, createValidationError, handleTelegramError } = require('../middleware/errorHandler');

// Store for active webhook configurations (in production, use database)
const webhookConfigs = new Map();

// NEW: Store for Telegram-registered webhooks
const activeWebhooks = new Map(); // nodeId -> webhook registration details
const webhookStatuses = new Map(); // nodeId -> current status info

// Webhook management utility functions
class WebhookManager {
  // Track a webhook registration with Telegram
  static registerWebhook(nodeId, webhookData) {
    const registration = {
      nodeId,
      botToken: webhookData.botToken,
      webhookUrl: webhookData.webhookUrl,
      registeredAt: new Date().toISOString(),
      status: 'active',
      lastChecked: new Date().toISOString(),
      telegramResponse: webhookData.telegramResponse || null
    };

    activeWebhooks.set(nodeId, registration);
    
    // Update status
    this.updateStatus(nodeId, {
      status: 'registered',
      message: 'Webhook successfully registered with Telegram',
      registeredAt: registration.registeredAt
    });

    logger.info(`Webhook registered for node ${nodeId}`, {
      nodeId,
      webhookUrl: webhookData.webhookUrl,
      botToken: webhookData.botToken.substring(0, 10) + '...'
    });

    return registration;
  }

  // Remove webhook registration
  static unregisterWebhook(nodeId) {
    const registration = activeWebhooks.get(nodeId);
    
    if (registration) {
      activeWebhooks.delete(nodeId);
      webhookStatuses.delete(nodeId);
      
      logger.info(`Webhook unregistered for node ${nodeId}`, {
        nodeId,
        webhookUrl: registration.webhookUrl
      });
      
      return true;
    }
    
    return false;
  }

  // Update webhook status
  static updateStatus(nodeId, statusUpdate) {
    const currentStatus = webhookStatuses.get(nodeId) || {};
    
    const newStatus = {
      ...currentStatus,
      ...statusUpdate,
      lastUpdated: new Date().toISOString()
    };

    webhookStatuses.set(nodeId, newStatus);
    
    logger.debug(`Webhook status updated for node ${nodeId}`, {
      nodeId,
      status: newStatus.status,
      message: newStatus.message
    });

    return newStatus;
  }

  // Get webhook registration details
  static getWebhook(nodeId) {
    return activeWebhooks.get(nodeId) || null;
  }

  // Get webhook status
  static getStatus(nodeId) {
    return webhookStatuses.get(nodeId) || null;
  }

  // Get all active webhooks
  static getAllWebhooks() {
    return Array.from(activeWebhooks.values());
  }

  // Get all webhook statuses
  static getAllStatuses() {
    const statuses = {};
    for (const [nodeId, status] of webhookStatuses.entries()) {
      statuses[nodeId] = status;
    }
    return statuses;
  }

  // Check if webhook is registered
  static isRegistered(nodeId) {
    return activeWebhooks.has(nodeId);
  }

  // Get webhook registration count
  static getRegistrationCount() {
    return activeWebhooks.size;
  }

  // Clean up stale webhooks (for maintenance)
  static cleanupStaleWebhooks(maxAgeHours = 24) {
    const cutoffTime = new Date(Date.now() - (maxAgeHours * 60 * 60 * 1000));
    let cleanedCount = 0;

    for (const [nodeId, registration] of activeWebhooks.entries()) {
      const registeredAt = new Date(registration.registeredAt);
      
      if (registeredAt < cutoffTime && registration.status !== 'active') {
        this.unregisterWebhook(nodeId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} stale webhook registrations`);
    }

    return cleanedCount;
  }

  // Get webhook health summary
  static getHealthSummary() {
    const all = this.getAllWebhooks();
    const statuses = this.getAllStatuses();
    
    const summary = {
      total: all.length,
      active: 0,
      failed: 0,
      pending: 0,
      lastActivity: null
    };

    all.forEach(webhook => {
      const status = statuses[webhook.nodeId];
      
      if (status) {
        switch (status.status) {
          case 'registered':
          case 'active':
            summary.active++;
            break;
          case 'failed':
          case 'error':
            summary.failed++;
            break;
          case 'pending':
            summary.pending++;
            break;
        }

        // Track most recent activity
        const lastUpdated = new Date(status.lastUpdated);
        if (!summary.lastActivity || lastUpdated > summary.lastActivity) {
          summary.lastActivity = lastUpdated;
        }
      }
    });

    return summary;
  }
}

// Register a webhook configuration (legacy method)
router.post('/register-webhook', asyncHandler(async (req, res) => {
  const { nodeId, botToken, updateType, command } = req.body;
  
  if (!nodeId || !botToken) {
    throw createValidationError('Missing required fields: nodeId, botToken');
  }

  const webhookPath = `telegram-webhook-${nodeId}`;
  
  // Store webhook configuration
  webhookConfigs.set(nodeId, {
    nodeId,
    botToken,
    updateType: updateType || 'message',
    command: command || null,
    webhookPath,
    createdAt: new Date().toISOString()
  });

  logger.info(`Registered webhook for node ${nodeId}`, {
    nodeId,
    webhookPath,
    updateType: updateType || 'message'
  });
  
  res.json({
    success: true,
    webhookPath,
    webhookUrl: `${req.protocol}://${req.get('host')}/api/webhooks/${webhookPath}`
  });
}));

// NEW: Register Telegram webhook with actual Telegram API
router.post('/register-telegram-webhook', asyncHandler(async (req, res) => {
  const { 
    nodeId, 
    botToken, 
    updateType = 'message', 
    command = null,
    baseUrl = null 
  } = req.body;
  
  if (!nodeId || !botToken) {
    throw createValidationError('Missing required fields: nodeId, botToken');
  }

  // Check if webhook is already registered for this node
  if (WebhookManager.isRegistered(nodeId)) {
    return res.status(409).json({ 
      error: 'Webhook already registered for this node',
      nodeId,
      status: WebhookManager.getStatus(nodeId)
    });
  }

  // Update status to pending
  WebhookManager.updateStatus(nodeId, {
    status: 'pending',
    message: 'Starting webhook registration with Telegram...'
  });

  try {
    // Generate webhook URL
    const serverBaseUrl = baseUrl || `${req.protocol}://${req.get('host')}`;
    const webhookUrl = TelegramAPI.generateWebhookUrl(serverBaseUrl, nodeId);
    
    // Validate webhook URL format
    const validation = TelegramAPI.validateWebhookUrl(webhookUrl);
    if (!validation.valid) {
      WebhookManager.updateStatus(nodeId, {
        status: 'failed',
        message: `Invalid webhook URL: ${validation.errors.join(', ')}`
      });
      
      return res.status(400).json({
        error: 'Invalid webhook URL',
        details: validation.errors,
        webhookUrl
      });
    }

    logger.info(`Registering Telegram webhook for node ${nodeId}`, {
      nodeId,
      webhookUrl,
      botToken: botToken.substring(0, 10) + '...'
    });

    // Create Telegram API instance
    const telegramAPI = new TelegramAPI(botToken);
    
    // Test bot token first
    const botInfo = await telegramAPI.getMe();
    if (!botInfo.success) {
      WebhookManager.updateStatus(nodeId, {
        status: 'failed',
        message: `Invalid bot token: ${botInfo.error}`
      });
      
      throw new Error(`Invalid bot token: ${botInfo.error}`);
    }

    // Register webhook with Telegram
    const webhookOptions = {
      maxConnections: 40,
      allowedUpdates: ['message', 'callback_query'],
      dropPendingUpdates: true
    };

    const webhookResult = await telegramAPI.setWebhook(webhookUrl, webhookOptions);
    
    if (!webhookResult.success) {
      WebhookManager.updateStatus(nodeId, {
        status: 'failed',
        message: `Failed to register with Telegram: ${webhookResult.error.message}`,
        telegramError: webhookResult.error
      });
      
      throw handleTelegramError(webhookResult.error);
    }

    // Store local webhook configuration
    const webhookPath = `telegram-webhook-${nodeId}`;
    webhookConfigs.set(nodeId, {
      nodeId,
      botToken,
      updateType,
      command,
      webhookPath,
      createdAt: new Date().toISOString()
    });

    // Register with WebhookManager
    const registration = WebhookManager.registerWebhook(nodeId, {
      botToken,
      webhookUrl,
      telegramResponse: webhookResult.data
    });

    logger.info(`Successfully registered Telegram webhook for node ${nodeId}`, {
      nodeId,
      webhookUrl,
      botUsername: botInfo.data.result?.username,
      telegramMessageId: webhookResult.data?.result
    });

    res.json({
      success: true,
      registration,
      webhookUrl,
      botInfo: botInfo.data.result,
      telegramResponse: webhookResult.data,
      message: 'Webhook successfully registered with Telegram'
    });

  } catch (error) {
    logger.logError(error, {
      context: 'register_telegram_webhook',
      nodeId,
      botToken: botToken.substring(0, 10) + '...'
    });

    WebhookManager.updateStatus(nodeId, {
      status: 'failed',
      message: `Registration failed: ${error.message}`,
      error: error.message
    });

    if (error.name === 'TelegramError') {
      return res.status(400).json({
        error: 'Telegram API Error',
        message: error.message,
        code: error.code
      });
    }

    res.status(500).json({
      error: 'Failed to register webhook',
      message: error.message
    });
  }
}));

// Generic Telegram webhook handler
router.post('/telegram-webhook/:nodeId', asyncHandler(async (req, res) => {
  const { nodeId } = req.params;
  
  console.log(`🎯 Webhook received for node: ${nodeId}`);
  console.log(`📦 Request body:`, JSON.stringify(req.body, null, 2));
  
  if (!nodeId) {
    console.error('❌ No nodeId provided in webhook path');
    return res.status(400).json({ error: 'Invalid webhook path' });
  }
  
  const telegramUpdate = req.body;

  logger.logTelegramEvent(nodeId, 'webhook_received', {
    updateType: telegramUpdate.message ? 'message' : 'other',
    chatId: telegramUpdate.message?.chat?.id,
    messageText: telegramUpdate.message?.text?.substring(0, 100) // First 100 chars for logging
  });

  // Get webhook configuration
  const config = webhookConfigs.get(nodeId);
  console.log(`🔍 Looking for webhook config for node ${nodeId}`);
  console.log(`📋 Available configs:`, Array.from(webhookConfigs.keys()));
  
  if (!config) {
    console.warn(`⚠️ No webhook config found for node ${nodeId}`);
    logger.warn(`No webhook config found for node ${nodeId}`);
    return res.json({ ok: true }); // Always return ok to Telegram
  }
  
  console.log(`✅ Found config for node ${nodeId}:`, config);

  // Validate update based on configuration
  const shouldTrigger = validateTelegramUpdate(telegramUpdate, config);
  
  if (shouldTrigger) {
    logger.logTelegramEvent(nodeId, 'workflow_triggered', {
      updateType: config.updateType,
      command: config.command
    });
    
    // Trigger workflow execution
    await triggerWorkflowExecution(nodeId, telegramUpdate, config);
  } else {
    logger.logTelegramEvent(nodeId, 'workflow_skipped', {
      reason: 'criteria_not_matched',
      updateType: config.updateType,
      command: config.command
    });
  }

  // Always respond with ok to Telegram
  res.json({ ok: true });
}));

// Validate if Telegram update matches node configuration
function validateTelegramUpdate(update, config) {
  if (!update.message) {
    return false; // Only handle messages for now
  }

  const { updateType, command } = config;
  const message = update.message;

  switch (updateType) {
    case 'message':
      return true; // Accept any message

    case 'command':
      if (!command) return false;
      const messageText = message.text || '';
      return messageText.startsWith(command);

    case 'callback_query':
      return !!update.callback_query;

    default:
      return false;
  }
}

// Trigger workflow execution
async function triggerWorkflowExecution(nodeId, telegramUpdate, config) {
  try {
    logger.logWorkflowExecution('pending', 'trigger_requested', {
      nodeId,
      chatId: telegramUpdate.message?.chat?.id
    });
    
    // Start workflow execution
    const executionId = await workflowEngine.startExecution(
      nodeId, 
      telegramUpdate, 
      config
    );
    
    if (executionId) {
      logger.info(`Workflow execution started: ${executionId}`, {
        nodeId,
        executionId
      });
    } else {
      logger.error(`Failed to start workflow execution for node ${nodeId}`, {
        nodeId
      });
    }
    
    return executionId;
  } catch (error) {
    logger.logError(error, {
      context: 'triggerWorkflowExecution',
      nodeId
    });
    return null;
  }
}

// Get all registered webhooks (for debugging)
router.get('/list-webhooks', (req, res) => {
  const webhooks = Array.from(webhookConfigs.values()).map(config => ({
    nodeId: config.nodeId,
    webhookPath: config.webhookPath,
    updateType: config.updateType,
    command: config.command,
    createdAt: config.createdAt
  }));
  
  res.json({ webhooks });
});

// Remove webhook configuration (legacy - keeping for compatibility)
router.delete('/webhook-config/:nodeId', (req, res) => {
  const { nodeId } = req.params;
  const deleted = webhookConfigs.delete(nodeId);
  
  if (deleted) {
    console.log(`🗑️ Removed webhook config for node ${nodeId}`);
    res.json({ success: true, message: 'Webhook config removed' });
  } else {
    res.status(404).json({ error: 'Webhook config not found' });
  }
});

// Register workflow with engine
router.post('/register-workflow', (req, res) => {
  try {
    const workflowData = req.body;
    const success = workflowEngine.registerWorkflow(workflowData);
    
    if (success) {
      res.json({ success: true, message: 'Workflow registered' });
    } else {
      res.status(400).json({ error: 'Failed to register workflow' });
    }
  } catch (error) {
    console.error('Error registering workflow:', error);
    res.status(500).json({ error: 'Failed to register workflow' });
  }
});

// Get execution status
router.get('/execution/:executionId', (req, res) => {
  try {
    const { executionId } = req.params;
    const execution = workflowEngine.getExecution(executionId);
    
    if (execution) {
      res.json({ execution });
    } else {
      res.status(404).json({ error: 'Execution not found' });
    }
  } catch (error) {
    console.error('Error getting execution:', error);
    res.status(500).json({ error: 'Failed to get execution' });
  }
});

// Get all executions (debugging)
router.get('/executions', (req, res) => {
  try {
    const executions = workflowEngine.getAllExecutions();
    res.json(executions);
  } catch (error) {
    console.error('Error getting executions:', error);
    res.status(500).json({ error: 'Failed to get executions' });
  }
});

// Test Telegram API (debugging)
router.post('/test-telegram', async (req, res) => {
  try {
    const { botToken, chatId, message } = req.body;
    
    if (!botToken || !chatId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: botToken, chatId, message' 
      });
    }

    console.log(`🧪 Testing Telegram API with bot token: ${botToken.substring(0, 10)}...`);
    
    const telegramAPI = new TelegramAPI(botToken);
    
    // Test bot info first
    const botInfo = await telegramAPI.getMe();
    if (!botInfo.success) {
      return res.status(400).json({
        error: 'Invalid bot token',
        details: botInfo.error
      });
    }

    // Send test message
    const result = await telegramAPI.sendMessage(chatId, message);
    
    if (result.success) {
      res.json({
        success: true,
        botInfo: botInfo.data,
        messageResult: result.data,
        message: 'Test message sent successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error.message,
        details: result.error
      });
    }

  } catch (error) {
    console.error('Error testing Telegram API:', error);
    res.status(500).json({ error: 'Failed to test Telegram API' });
  }
});

// Get bot information - simplified version
router.post('/telegram-bot-info', (req, res) => {
  try {
    const { botToken } = req.body;
    
    if (!botToken) {
      return res.status(400).json({ 
        error: 'Bot token is required',
        success: false 
      });
    }

    // Basic token format validation
    if (!botToken.includes(':') || botToken.length < 20) {
      return res.status(400).json({ 
        error: 'Invalid bot token format. Expected format: 123456789:ABC-DEF...',
        success: false 
      });
    }

    // Create TelegramAPI instance and test
    const telegramAPI = new TelegramAPI(botToken);
    
    telegramAPI.getMe()
      .then(result => {
        if (result.success) {
          // Return the bot data directly to match frontend expectations
          res.json(result.data.result);
        } else {
          res.status(400).json({ 
            success: false,
            error: result.error || 'Invalid bot token'
          });
        }
      })
      .catch(error => {
        res.status(500).json({ 
          success: false,
          error: 'Failed to validate bot token',
          message: error.message 
        });
      });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: 'Server error during validation',
      message: error.message 
    });
  }
});

// Get logs for debugging
router.get('/logs', (req, res) => {
  try {
    const { type = 'app', lines = 100 } = req.query;
    
    const logs = logger.getRecentLogs(type, parseInt(lines));
    
    res.json({
      type,
      lines: logs.length,
      logs
    });
  } catch (error) {
    logger.logError(error, { context: 'get_logs', type: req.query.type });
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

router.get('/logs/:type', (req, res) => {
  try {
    const { type } = req.params;
    const { lines = 100 } = req.query;
    
    const logs = logger.getRecentLogs(type, parseInt(lines));
    
    res.json({
      type,
      lines: logs.length,
      logs
    });
  } catch (error) {
    logger.logError(error, { context: 'get_logs', type: req.params.type });
    res.status(500).json({ error: 'Failed to retrieve logs' });
  }
});

// Clear logs
router.delete('/logs', (req, res) => {
  try {
    const { type = 'app' } = req.query;
    
    // In production, you might want to archive logs instead of deleting
    logger.info(`Logs cleared for type: ${type}`, { type });
    
    res.json({ success: true, message: `Logs cleared for ${type}` });
  } catch (error) {
    logger.logError(error, { context: 'clear_logs', type: req.query.type });
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

router.delete('/logs/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    // In production, you might want to archive logs instead of deleting
    logger.info(`Logs cleared for type: ${type}`, { type });
    
    res.json({ success: true, message: `Logs cleared for ${type}` });
  } catch (error) {
    logger.logError(error, { context: 'clear_logs', type: req.params.type });
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// Test bot token validation - simplified like user's example
router.post('/test-bot-token', async (req, res) => {
  const { botToken } = req.body;
  
  if (!botToken) {
    return res.status(400).json({ 
      error: 'Bot token is required',
      success: false 
    });
  }

  // Use direct axios call like user's example
  const axios = require('axios');
  
  try {
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    res.json({ success: true, botInfo: response.data.result });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.response?.data || error.message 
    });
  }
});

// NEW: Webhook Management Endpoints

// Get webhook registration status for a node
router.get('/webhook-status/:nodeId', (req, res) => {
  try {
    const { nodeId } = req.params;
    
    const registration = WebhookManager.getWebhook(nodeId);
    const status = WebhookManager.getStatus(nodeId);
    
    if (!registration) {
      return res.json({
        registered: false,
        message: 'No webhook registration found for this node'
      });
    }

    res.json({
      registered: true,
      registration,
      status,
      isActive: status?.status === 'registered' || status?.status === 'active'
    });

  } catch (error) {
    logger.logError(error, { context: 'get_webhook_status', nodeId: req.params.nodeId });
    res.status(500).json({ error: 'Failed to get webhook status' });
  }
});

// Get all webhook registrations (admin/debugging)
router.get('/webhooks-overview', (req, res) => {
  try {
    const webhooks = WebhookManager.getAllWebhooks();
    const statuses = WebhookManager.getAllStatuses();
    const health = WebhookManager.getHealthSummary();
    
    res.json({
      health,
      registrations: webhooks,
      statuses,
      totalCount: WebhookManager.getRegistrationCount()
    });

  } catch (error) {
    logger.logError(error, { context: 'get_webhooks_overview' });
    res.status(500).json({ error: 'Failed to get webhooks overview' });
  }
});

// Update webhook status (internal use)
router.patch('/webhook-status/:nodeId', (req, res) => {
  try {
    const { nodeId } = req.params;
    const { status, message, ...otherData } = req.body;
    
    if (!WebhookManager.isRegistered(nodeId)) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const updatedStatus = WebhookManager.updateStatus(nodeId, {
      status,
      message,
      ...otherData
    });

    res.json({
      success: true,
      status: updatedStatus
    });

  } catch (error) {
    logger.logError(error, { context: 'update_webhook_status', nodeId: req.params.nodeId });
    res.status(500).json({ error: 'Failed to update webhook status' });
  }
});

// Cleanup stale webhooks (maintenance endpoint)
router.post('/cleanup-webhooks', (req, res) => {
  try {
    const { maxAgeHours = 24 } = req.body;
    
    const cleanedCount = WebhookManager.cleanupStaleWebhooks(maxAgeHours);
    
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} stale webhook registrations`,
      cleanedCount
    });

  } catch (error) {
    logger.logError(error, { context: 'cleanup_webhooks' });
    res.status(500).json({ error: 'Failed to cleanup webhooks' });
  }
});

// Remove webhook registration and optionally delete from Telegram
router.delete('/webhook/:nodeId', asyncHandler(async (req, res) => {
  const { nodeId } = req.params;
  const { deleteFromTelegram = true } = req.body;
  
  const registration = WebhookManager.getWebhook(nodeId);
  
  if (!registration) {
    return res.status(404).json({ error: 'Webhook registration not found' });
  }

  let telegramDeleted = false;
  let telegramError = null;

  // Optionally delete webhook from Telegram
  if (deleteFromTelegram) {
    try {
      const telegramAPI = new TelegramAPI(registration.botToken);
      const deleteResult = await telegramAPI.deleteWebhook();
      
      if (deleteResult.success) {
        telegramDeleted = true;
        logger.info(`Webhook deleted from Telegram for node ${nodeId}`);
      } else {
        telegramError = deleteResult.error;
        logger.warn(`Failed to delete webhook from Telegram for node ${nodeId}:`, deleteResult.error);
      }
    } catch (error) {
      telegramError = error.message;
      logger.error(`Error deleting webhook from Telegram for node ${nodeId}:`, error);
    }
  }

  // Remove from our tracking
  const removed = WebhookManager.unregisterWebhook(nodeId);
  
  // Also remove from legacy webhookConfigs if exists
  webhookConfigs.delete(nodeId);

  res.json({
    success: true,
    message: 'Webhook registration removed',
    details: {
      removedFromLocal: removed,
      deletedFromTelegram: telegramDeleted,
      telegramError
    }
  });
}));

module.exports = router;