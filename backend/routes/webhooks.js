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
      '/webhooks/telegram/:workflowId',
      '/webhooks/webhookTrigger/:workflowId', 
      '/webhooks/manualTrigger/:workflowId',
      '/webhooks/chatTrigger/:workflowId',
      '/webhooks/telegram-test'
    ]
  });
});

// Simple Telegram webhook test endpoint (no workflow ID required)
router.post('/telegram-test', (req, res) => {
  logger.info('Telegram test webhook received', { 
    body: req.body,
    message: req.body?.message?.text,
    from: req.body?.message?.from?.first_name
  });

  console.log('🎯 Telegram webhook test received!', {
    text: req.body?.message?.text,
    from: req.body?.message?.from?.first_name,
    chat_id: req.body?.message?.chat?.id,
    message_id: req.body?.message?.message_id
  });

  res.json({
    success: true,
    message: 'Telegram webhook test successful!',
    received: {
      text: req.body?.message?.text,
      from: req.body?.message?.from?.first_name,
      timestamp: new Date().toISOString()
    }
  });
});

// Telegram webhook endpoint for single-run workflow activation
router.post('/telegram/:workflowId', asyncHandler(async (req, res) => {
  const workflowId = req.params.workflowId;
  
  logger.info('Telegram webhook received for single-run activation', { 
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

    // Check if workflow is activated for single-run execution
    if (!workflowExecutor || !workflowExecutor.isWorkflowActive(workflowId)) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not activated or not found',
        message: `Workflow ${workflowId} is not currently listening for triggers`
      });
    }

    // Prepare trigger data for workflow execution
    const triggerData = [{
      nodeId: 'telegram_trigger', // This will be matched with actual trigger node
      nodeType: 'telegramTrigger',
      json: {
        message: req.body.message,
        chat: req.body.message.chat,
        from: req.body.message.from,
        text: req.body.message.text,
        messageId: req.body.message.message_id,
        receivedAt: new Date().toISOString()
      }
    }];

    console.log('🎯 Triggering single-run workflow execution:', { workflowId, triggerData });

    // Execute the active workflow with trigger data (single-run mode)
    const result = await workflowExecutor.executeActiveWorkflow(workflowId, triggerData);
    
    logger.info('Single-run workflow execution completed', { 
      workflowId,
      success: result.success,
      status: result.status
    });

    res.json({
      success: true,
      message: 'Workflow triggered and executed successfully',
      workflowId: workflowId,
      executionId: result.executionId,
      status: result.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, { 
      context: 'telegramWebhookSingleRun', 
      workflowId 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to trigger workflow execution',
      message: error.message
    });
  }
}));

// Webhook trigger endpoint for single-run workflow activation
router.post('/webhookTrigger/:workflowId', asyncHandler(async (req, res) => {
  const workflowId = req.params.workflowId;
  
  logger.info('Webhook trigger received for single-run activation', { 
    workflowId,
    body: req.body,
    query: req.query,
    headers: req.headers
  });

  try {
    // Check if workflow is activated for single-run execution
    if (!workflowExecutor || !workflowExecutor.isWorkflowActive(workflowId)) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not activated or not found',
        message: `Workflow ${workflowId} is not currently listening for triggers`
      });
    }

    // Prepare trigger data for workflow execution
    const triggerData = [{
      nodeId: 'webhook_trigger',
      nodeType: 'webhookTrigger',
      json: {
        body: req.body,
        query: req.query,
        headers: req.headers,
        method: req.method,
        url: req.url,
        receivedAt: new Date().toISOString()
      }
    }];

    console.log('🎯 Triggering webhook single-run workflow execution:', { workflowId });

    // Execute the active workflow with trigger data (single-run mode)
    const result = await workflowExecutor.executeActiveWorkflow(workflowId, triggerData);
    
    logger.info('Webhook single-run workflow execution completed', { 
      workflowId,
      success: result.success,
      status: result.status
    });

    res.json({
      success: true,
      message: 'Workflow triggered via webhook and executed successfully',
      workflowId: workflowId,
      executionId: result.executionId,
      status: result.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, { 
      context: 'webhookTriggerSingleRun', 
      workflowId 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to trigger workflow execution via webhook',
      message: error.message
    });
  }
}));

// Manual trigger endpoint for single-run workflow activation
router.post('/manualTrigger/:workflowId', asyncHandler(async (req, res) => {
  const workflowId = req.params.workflowId;
  
  logger.info('Manual trigger received for single-run activation', { 
    workflowId,
    body: req.body
  });

  try {
    // Check if workflow is activated for single-run execution
    if (!workflowExecutor || !workflowExecutor.isWorkflowActive(workflowId)) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not activated or not found',
        message: `Workflow ${workflowId} is not currently listening for triggers`
      });
    }

    // Prepare trigger data for workflow execution
    const triggerData = [{
      nodeId: 'manual_trigger',
      nodeType: 'manualTrigger',
      json: {
        triggeredBy: 'manual',
        data: req.body.data || {},
        message: req.body.message || 'Manual trigger activated',
        triggeredAt: new Date().toISOString()
      }
    }];

    console.log('🎯 Triggering manual single-run workflow execution:', { workflowId });

    // Execute the active workflow with trigger data (single-run mode)
    const result = await workflowExecutor.executeActiveWorkflow(workflowId, triggerData);
    
    logger.info('Manual single-run workflow execution completed', { 
      workflowId,
      success: result.success,
      status: result.status
    });

    res.json({
      success: true,
      message: 'Workflow triggered manually and executed successfully',
      workflowId: workflowId,
      executionId: result.executionId,
      status: result.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, { 
      context: 'manualTriggerSingleRun', 
      workflowId 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to trigger workflow execution manually',
      message: error.message
    });
  }
}));

// Chat trigger endpoint for single-run workflow activation
router.post('/chatTrigger/:workflowId', asyncHandler(async (req, res) => {
  const workflowId = req.params.workflowId;
  
  logger.info('Chat trigger received for single-run activation', { 
    workflowId,
    body: req.body
  });

  try {
    // Check if workflow is activated for single-run execution
    if (!workflowExecutor || !workflowExecutor.isWorkflowActive(workflowId)) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not activated or not found',
        message: `Workflow ${workflowId} is not currently listening for triggers`
      });
    }

    // Prepare trigger data for workflow execution
    const triggerData = [{
      nodeId: 'chat_trigger',
      nodeType: 'chatTrigger',
      json: {
        sessionId: req.body.sessionId || `session_${Date.now()}`,
        message: req.body.message || req.body.text || '',
        userId: req.body.userId || 'anonymous',
        userName: req.body.userName || 'Anonymous User',
        timestamp: new Date().toISOString(),
        chatData: req.body
      }
    }];

    console.log('🎯 Triggering chat single-run workflow execution:', { workflowId });

    // Execute the active workflow with trigger data (single-run mode)
    const result = await workflowExecutor.executeActiveWorkflow(workflowId, triggerData);
    
    logger.info('Chat single-run workflow execution completed', { 
      workflowId,
      success: result.success,
      status: result.status
    });

    res.json({
      success: true,
      message: 'Workflow triggered via chat and executed successfully',
      workflowId: workflowId,
      executionId: result.executionId,
      status: result.status,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.logError(error, { 
      context: 'chatTriggerSingleRun', 
      workflowId 
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to trigger workflow execution via chat',
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