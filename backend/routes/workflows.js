const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../services/logger');

// Remove async database helpers - using synchronous db directly

// Name sanitizer function
const sanitizeName = (raw) => typeof raw === 'string' ? raw.trim() : '';

// Import workflow executor
const workflowExecutor = require('../services/workflowExecutor');

// Workflows table is now initialized in dbWrapper.js

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/workflows - Get all workflows for the authenticated user
router.get('/', verifyToken, (req, res) => {
  const userId = req.user.userId;

  try {
    const rows = await db.all(
      'SELECT id, name, description, created_at, updated_at FROM workflows WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    logger.info('Workflows retrieved', { userId, count: rows.length });
    res.json({
      success: true,
      workflows: rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }))
    });
  } catch (err) {
    logger.logError(err, { context: 'getWorkflows', userId });
    return res.status(500).json({ error: 'Database error' });
  }
});

// GET /api/workflows/:id - Get specific workflow with full data
router.get('/:id', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;

  try {
    const row = await db.get('SELECT * FROM workflows WHERE id = ? AND user_id = ?', [workflowId, userId]);

    if (!row) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    try {
      const workflowData = JSON.parse(row.data);
      logger.info('Workflow retrieved', { userId, workflowId, name: row.name });
      
      res.json({
        success: true,
        workflow: {
          id: row.id,
          name: row.name,
          description: row.description,
          data: workflowData,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }
      });
    } catch (parseError) {
      logger.logError(parseError, { context: 'parseWorkflowData', userId, workflowId });
      res.status(500).json({ error: 'Invalid workflow data' });
    }
  } catch (err) {
    logger.logError(err, { context: 'getWorkflow', userId, workflowId });
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/workflows - Create new workflow
router.post('/', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const { name, description, nodes, edges, connections } = req.body;

  // Support both edges (frontend format) and connections (legacy format)
  const workflowEdges = edges || connections || [];
  const workflowNodes = nodes || [];

  // Strong validation BEFORE touching DB
  const safeName = sanitizeName(name);
  if (!safeName) {
    return res.status(400).json({ 
      error: 'Workflow name is required and cannot be empty' 
    });
  }

  // Validate nodes and edges are arrays
  if (!Array.isArray(workflowNodes) || !Array.isArray(workflowEdges)) {
    return res.status(400).json({ 
      error: 'Nodes and edges must be arrays' 
    });
  }

  const workflowData = {
    nodes: workflowNodes,
    edges: workflowEdges,
    metadata: {
      version: '1.0',
      savedAt: new Date().toISOString()
    }
  };

  const safeDescription = typeof description === 'string' ? description : '';
  const dataJson = JSON.stringify(workflowData);

  try {
    // Use synchronous database operation
    db.run(
      'INSERT INTO workflows (user_id, name, description, data) VALUES (?, ?, ?, ?)',
      [userId, safeName, safeDescription, dataJson],
      function(err) {
        if (err) {
          logger.logError(err, { context: 'createWorkflow', userId });
          return res.status(500).json({ 
            success: false,
            error: 'Failed to create workflow', 
            details: err.message 
          });
        }

        const workflowId = this.lastID;

        logger.info('Workflow created successfully', { 
          userId, 
          workflowId: workflowId, 
          name: safeName,
          nodeCount: workflowNodes.length,
          edgeCount: workflowEdges.length
        });

        res.status(201).json({
          success: true,
          workflow: {
            id: workflowId,
            name: safeName,
            description: safeDescription,
            data: workflowData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        });
      }
    );

  } catch (error) {
    logger.logError(error, { context: 'createWorkflow', userId });
    res.status(500).json({ 
      success: false,
      error: 'Failed to create workflow', 
      details: error.message 
    });
  }
});

// PUT /api/workflows/:id - Update existing workflow
router.put('/:id', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;
  const { name, description, nodes, edges, connections } = req.body;

  // Support both edges (frontend format) and connections (legacy format)
  const workflowEdges = edges || connections || [];
  const workflowNodes = nodes || [];

  // Validate required fields
  if (!name || !workflowNodes) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, nodes' 
    });
  }

  // Validate nodes and edges are arrays
  if (!Array.isArray(workflowNodes) || !Array.isArray(workflowEdges)) {
    return res.status(400).json({ 
      error: 'Nodes and edges must be arrays' 
    });
  }

  const workflowData = {
    nodes: workflowNodes,
    edges: workflowEdges,
    metadata: {
      version: '1.0',
      savedAt: new Date().toISOString()
    }
  };

  try {
    const result = await db.run('UPDATE workflows SET name = ?, description = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [name, description || '', JSON.stringify(workflowData), workflowId, userId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    logger.info('Workflow updated', { 
      userId, 
      workflowId, 
      name,
      nodeCount: workflowNodes.length,
      edgeCount: workflowEdges.length
    });

    res.json({
      success: true,
      workflow: {
        id: parseInt(workflowId),
        name,
        description: description || '',
        data: workflowData,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    logger.logError(err, { context: 'updateWorkflow', userId, workflowId, name });
    return res.status(500).json({ error: 'Database error' });
  }
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;

  try {
    const result = await db.run('DELETE FROM workflows WHERE id = ? AND user_id = ?', [workflowId, userId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    logger.info('Workflow deleted', { userId, workflowId });
    res.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (err) {
    logger.logError(err, { context: 'deleteWorkflow', userId, workflowId });
    return res.status(500).json({ error: 'Database error' });
  }
});

// NEW ROUTES FROM WORKFLOWNODE - Advanced workflow execution



// POST /api/workflows/register - Register workflow for chat execution
router.post('/register', (req, res) => {
  try {
    const { workflowId, workflow } = req.body;
    
    if (!workflowId || !workflow) {
      return res.status(400).json({
        success: false,
        error: 'Missing workflowId or workflow data'
      });
    }

    if (!workflow.nodes || !workflow.edges) {
      return res.status(400).json({
        success: false,
        error: 'Workflow must contain nodes and edges'
      });
    }

    // Check if workflow has a trigger
    const hasTrigger = workflow.nodes.some(node => node.data.type === 'trigger' || node.data.type === 'telegramTrigger');
    if (!hasTrigger) {
      return res.status(400).json({
        success: false,
        error: 'Workflow must contain a trigger node for execution'
      });
    }

    // Check if workflow has a Telegram trigger - if so, set up webhook
    const hasTelegramTrigger = workflow.nodes.some(node => node.data.type === 'telegramTrigger');
    
    console.log(`📝 Registering workflow ${workflowId} for execution`);
    console.log('Workflow structure:', {
      nodes: workflow.nodes.length,
      edges: workflow.edges.length,
      nodeTypes: workflow.nodes.map(n => n.data.type),
      hasTelegramTrigger: hasTelegramTrigger
    });

    // Register workflow with executor
    const success = workflowExecutor.registerWorkflow(workflowId, workflow, { mode: 'single-run' });
    
    if (success) {
      // Set up Telegram webhook if needed
      if (hasTelegramTrigger) {
        try {
          const { TelegramAPI } = require('../services/telegramAPI');
          const telegramAPI = new TelegramAPI('8148982414:AAEPKCLwwxiMp0KH3wKqrqdTnPI3W3E_0VQ');
          const webhookUrl = `https://workflow-lg9z.onrender.com/api/webhooks/telegram/${workflowId}`;
          
          // Set webhook asynchronously (don't wait for response)
          telegramAPI.setWebhook(webhookUrl).then(result => {
            if (result.success) {
              console.log(`✅ Telegram webhook set for workflow ${workflowId}: ${webhookUrl}`);
            } else {
              console.error(`❌ Failed to set Telegram webhook for workflow ${workflowId}:`, result.error);
            }
          }).catch(error => {
            console.error('❌ Error setting up Telegram webhook:', error);
          });
          
        } catch (error) {
          console.error('❌ Error loading TelegramAPI:', error);
        }
      }
      
      logger.info('Workflow registered for execution', { 
        workflowId, 
        nodeCount: workflow.nodes.length,
        edgeCount: workflow.edges.length,
        hasTelegramTrigger: hasTelegramTrigger
      });
      
      res.json({
        success: true,
        message: `Workflow ${workflowId} registered successfully`,
        workflowId,
        webhookSetup: hasTelegramTrigger ? 'telegram_webhook_configured' : 'no_webhook_needed'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to register workflow'
      });
    }

  } catch (error) {
    console.error('❌ Workflow registration error:', error.message);
    logger.logError(error, { context: 'workflowRegistration' });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});


// GET /api/workflows/:id/hosted-url - Get hosted chat URL for workflow testing
router.get('/:id/hosted-url', verifyToken, async (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;

  // Get workflow to find trigger node
  try {
    const row = await db.get('SELECT * FROM workflows WHERE id = ? AND user_id = ?', [workflowId, userId]);

    if (!row) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    try {
      const workflowData = JSON.parse(row.data);
      
      // Find chat trigger node
      const chatTrigger = workflowData.nodes.find(node => 
        node.data.type === 'chatTrigger'
      );

      if (!chatTrigger) {
        return res.status(400).json({ 
          error: 'No chat trigger found in workflow. Add a Chat Trigger node to get a hosted URL.' 
        });
      }

      const baseUrl = process.env.BASE_URL || 'https://workflow-lg9z.onrender.com';
      const hostedUrl = `${baseUrl}/public/hosted-chat.html?workflowId=${workflowId}`;
      
      res.json({
        success: true,
        workflowId: workflowId,
        workflowName: row.name,
        hostedUrl: hostedUrl,
        triggerNodeId: chatTrigger.id,
        triggerNodeType: chatTrigger.data.type
      });
    } catch (parseError) {
      logger.logError(parseError, { context: 'parseWorkflowDataForUrl', userId, workflowId });
      res.status(500).json({ error: 'Invalid workflow data' });
    }
  } catch (err) {
    logger.logError(err, { context: 'getHostedUrl', userId, workflowId });
    return res.status(500).json({ error: 'Database error' });
  }
});

// Simple status endpoint for checking workflow activation
router.get('/workflows/:id/simple-status', async (req, res) => {
  try {
    const workflowId = req.params.id;
    const workflowExecutor = require('../services/workflowExecutor');
    
    const isActive = workflowExecutor && workflowExecutor.activeWorkflows && workflowExecutor.activeWorkflows.has(workflowId);
    const totalActive = workflowExecutor && workflowExecutor.activeWorkflows ? workflowExecutor.activeWorkflows.size : 0;
    const allWorkflows = workflowExecutor && workflowExecutor.activeWorkflows ? 
      Array.from(workflowExecutor.activeWorkflows.keys()) : [];
    
    res.json({
      workflowId,
      isActive,
      totalActiveWorkflows: totalActive,
      allActiveWorkflows: allWorkflows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      workflowId: req.params.id
    });
  }
});

// POST /api/workflows/:id/activate - Activate workflow for single-run execution
router.post('/:id/activate', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;
  
  // Use direct database call with callback
  db.get('SELECT * FROM workflows WHERE id = ? AND user_id = ?', [workflowId, userId], (err, workflow) => {
    if (err) {
      logger.logError(err, { context: 'activateWorkflow', userId, workflowId });
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }
    
    if (!workflow) {
      return res.status(404).json({ 
        success: false, 
        error: 'Workflow not found or access denied' 
      });
    }

    // Parse workflow data
    console.log('[workflows.activate] Raw workflow data:', {
      dataType: typeof workflow.data,
      dataLength: workflow.data?.length,
      dataPreview: workflow.data?.substring(0, 100)
    });
    
    let workflowData;
    try {
      workflowData = JSON.parse(workflow.data);
    } catch (parseError) {
      console.error('[workflows.activate] JSON parse error:', parseError.message);
      console.error('[workflows.activate] Invalid data:', workflow.data);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid workflow data format' 
      });
    }

    // Check if workflow has trigger nodes - look for trigger types instead of category
    console.log('[workflows.activate] All nodes:', workflowData.nodes?.map(node => ({
      id: node.id,
      type: node.data?.type,
      category: node.data?.category,
      label: node.data?.label
    })));
    
    // List of trigger node types
    const triggerTypes = [
      'telegramTrigger',
      'webhookTrigger', 
      'chatTrigger',
      'manualTrigger',
      'scheduleTrigger'
    ];
    
    const triggerNodes = workflowData.nodes?.filter(node => 
      triggerTypes.includes(node.data?.type)
    ) || [];
    
    console.log('[workflows.activate] Found trigger nodes:', triggerNodes.length, 
               'Types:', triggerNodes.map(n => n.data?.type));

    if (triggerNodes.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Workflow must have at least one trigger node to activate' 
      });
    }

    // Import workflow state service
    const workflowState = require('../services/workflowState');
    
    // Register workflow with executor for listening
    workflowExecutor.registerWorkflow(workflowId, workflowData, {
      userId,
      activatedAt: new Date().toISOString(),
      mode: 'single-run'
    });

    // Store activation state and generate trigger URLs
    const triggerUrls = triggerNodes.map(node => {
      const nodeType = node.data?.type;
      let webhookUrl;
      
      // Generate correct webhook URLs for single-run triggers
      switch (nodeType) {
        case 'telegramTrigger':
          webhookUrl = `/api/webhooks/telegram/${workflowId}`;
          break;
        case 'webhookTrigger':
          webhookUrl = `/api/webhooks/webhookTrigger/${workflowId}`;
          break;
        case 'manualTrigger':
          webhookUrl = `/api/webhooks/manualTrigger/${workflowId}`;
          break;
        case 'chatTrigger':
          webhookUrl = `/api/webhooks/chatTrigger/${workflowId}`;
          break;
        default:
          webhookUrl = `/api/webhooks/custom/${workflowId}/${node.id}`;
      }
      
      return {
        nodeId: node.id,
        type: nodeType,
        url: webhookUrl,
        fullUrl: `${process.env.BASE_URL || 'https://workflow-unlq.onrender.com'}${webhookUrl}`
      };
    });

    // workflowState.storeActiveWorkflow(workflowId, workflowData, triggerUrls);

    logger.info('Workflow activated for single-run execution', { 
      userId, 
      workflowId, 
      triggerCount: triggerNodes.length,
      mode: 'single-run'
    });

    res.json({
      success: true,
      workflowId,
      status: 'listening',
      message: 'Workflow activated and listening for trigger data',
      triggerNodes: triggerNodes.length,
      triggerUrls,
      activatedAt: new Date().toISOString()
    });
  }); // Close database callback
});

// POST /api/workflows/:id/deactivate - Deactivate workflow 
router.post('/:id/deactivate', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;
  
  // Use direct database call with callback
  db.get('SELECT * FROM workflows WHERE id = ? AND user_id = ?', [workflowId, userId], (err, workflow) => {
    if (err) {
      logger.logError(err, { context: 'deactivateWorkflow', userId, workflowId });
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }
    
    if (!workflow) {
      return res.status(404).json({ 
        success: false, 
        error: 'Workflow not found or access denied' 
      });
    }

    // Import workflow state service
    const workflowState = require('../services/workflowState');
    
    // Remove from executor
    workflowExecutor.unregisterWorkflow(workflowId);

    // Remove from database
    // workflowState.removeActiveWorkflow(workflowId);

    logger.info('Workflow deactivated', { userId, workflowId });

    res.json({
      success: true,
      workflowId,
      status: 'inactive',
      message: 'Workflow deactivated successfully',
      deactivatedAt: new Date().toISOString()
    });
  }); // Close database callback
});

// GET /api/workflows/:id/status - Get workflow activation status
router.get('/:id/status', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;
  
  // Use direct database call with callback
  db.get('SELECT * FROM workflows WHERE id = ? AND user_id = ?', [workflowId, userId], (err, workflow) => {
    if (err) {
      logger.logError(err, { context: 'getWorkflowStatus', userId, workflowId });
      return res.status(500).json({ 
        success: false, 
        error: 'Database error' 
      });
    }
    
    if (!workflow) {
      return res.status(404).json({ 
        success: false, 
        error: 'Workflow not found or access denied' 
      });
    }

    // Check executor status
    const isRegistered = workflowExecutor.activeWorkflows.has(workflowId);
    const executorData = isRegistered ? workflowExecutor.activeWorkflows.get(workflowId) : null;

    // Check database status - simplified for now
    // const workflowState = require('../services/workflowState');
    // const activeWorkflows = workflowState.getActiveWorkflows();
    // const dbWorkflow = activeWorkflows.find(w => w.workflowId === workflowId);
    const dbWorkflow = null;

    let status = 'inactive';
    if (isRegistered && dbWorkflow) {
      status = 'listening';
    } else if (executorData?.isExecuting) {
      status = 'executing';
    }

    res.json({
      success: true,
      workflowId,
      status,
      executor: {
        registered: isRegistered,
        activatedAt: executorData?.activatedAt || null
      },
      database: {
        stored: !!dbWorkflow,
        activatedAt: dbWorkflow?.activatedAt || null,
        triggerUrls: dbWorkflow?.triggerUrls || []
      },
      timestamp: new Date().toISOString()
    });
  }); // Close database callback
});

module.exports = router;