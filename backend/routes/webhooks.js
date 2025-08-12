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

// Store for active workflow configurations (in production, use database)
const workflowConfigs = new Map();

// Store for registered webhooks (in production, use database)
const registeredWebhooks = new Map();

// Basic webhook test endpoint
router.get('/test', (req, res) => {
  logger.info('Webhook test endpoint accessed');
  res.json({ 
    success: true, 
    message: 'Webhook system operational',
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/webhooks/test',
      '/webhooks/telegram/:workflowId'
    ]
  });
});

// Telegram webhook endpoint
router.post('/telegram/:workflowId', asyncHandler(async (req, res) => {
  const workflowId = req.params.workflowId;
  
  logger.info('Telegram webhook received', { 
    workflowId,
    body: req.body 
  });

  try {
    // Validate the incoming request
    if (!req.body || !req.body.message) {
      return res.status(400).json({ 
        error: 'Invalid Telegram webhook payload' 
      });
    }

    // Process the webhook through the workflow engine
    const result = await workflowEngine.processTelegramWebhook(workflowId, req.body);
    
    logger.info('Telegram webhook processed', { 
      workflowId,
      success: result.success 
    });

    res.json({
      success: true,
      message: 'Telegram webhook processed successfully',
      workflowId: workflowId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, { 
      context: 'telegramWebhook', 
      workflowId 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process Telegram webhook',
      message: error.message
    });
  }
}));

// General webhook endpoint for custom integrations
router.post('/custom/:workflowId/:hookId', asyncHandler(async (req, res) => {
  const { workflowId, hookId } = req.params;
  
  logger.info('Custom webhook received', { 
    workflowId,
    hookId,
    body: req.body 
  });

  try {
    // Process the webhook through the workflow engine
    const result = await workflowEngine.processCustomWebhook(workflowId, hookId, req.body);
    
    logger.info('Custom webhook processed', { 
      workflowId,
      hookId,
      success: result.success 
    });

    res.json({
      success: true,
      message: 'Custom webhook processed successfully',
      workflowId: workflowId,
      hookId: hookId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, { 
      context: 'customWebhook', 
      workflowId,
      hookId 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process custom webhook',
      message: error.message
    });
  }
}));

module.exports = router;