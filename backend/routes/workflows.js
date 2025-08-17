const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../services/logger');

// Import WorkflowNode controllers
const { 
  activateWorkflow, 
  deactivateWorkflow, 
  getWorkflowStatus,
  getFailedExecutions,
  replayFailedExecution,
  getExecutionHistory
} = require('../controllers/workflowController');

// Import workflow executor
const workflowExecutor = require('../services/workflowExecutor');

// Database setup
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize workflows table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
});

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

  db.all(
    'SELECT id, name, description, created_at, updated_at FROM workflows WHERE user_id = ? ORDER BY updated_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        logger.logError(err, { context: 'getWorkflows', userId });
        return res.status(500).json({ error: 'Database error' });
      }

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
    }
  );
});

// GET /api/workflows/:id - Get specific workflow with full data
router.get('/:id', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;

  db.get(
    'SELECT * FROM workflows WHERE id = ? AND user_id = ?',
    [workflowId, userId],
    (err, row) => {
      if (err) {
        logger.logError(err, { context: 'getWorkflow', userId, workflowId });
        return res.status(500).json({ error: 'Database error' });
      }

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
    }
  );
});

// POST /api/workflows - Create new workflow
router.post('/', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const { name, description, nodes, connections } = req.body;

  // Validate required fields
  if (!name || !nodes || !connections) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, nodes, connections' 
    });
  }

  // Validate nodes and connections are arrays
  if (!Array.isArray(nodes) || !Array.isArray(connections)) {
    return res.status(400).json({ 
      error: 'Nodes and connections must be arrays' 
    });
  }

  const workflowData = {
    nodes,
    connections,
    metadata: {
      version: '1.0',
      savedAt: new Date().toISOString()
    }
  };

  db.run(
    'INSERT INTO workflows (user_id, name, description, data) VALUES (?, ?, ?, ?)',
    [userId, name, description || '', JSON.stringify(workflowData)],
    function(err) {
      if (err) {
        logger.logError(err, { context: 'createWorkflow', userId, name });
        return res.status(500).json({ error: 'Database error' });
      }

      logger.info('Workflow created', { 
        userId, 
        workflowId: this.lastID, 
        name,
        nodeCount: nodes.length,
        connectionCount: connections.length
      });

      res.status(201).json({
        success: true,
        workflow: {
          id: this.lastID,
          name,
          description: description || '',
          data: workflowData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
    }
  );
});

// PUT /api/workflows/:id - Update existing workflow
router.put('/:id', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;
  const { name, description, nodes, connections } = req.body;

  // Validate required fields
  if (!name || !nodes || !connections) {
    return res.status(400).json({ 
      error: 'Missing required fields: name, nodes, connections' 
    });
  }

  // Validate nodes and connections are arrays
  if (!Array.isArray(nodes) || !Array.isArray(connections)) {
    return res.status(400).json({ 
      error: 'Nodes and connections must be arrays' 
    });
  }

  const workflowData = {
    nodes,
    connections,
    metadata: {
      version: '1.0',
      savedAt: new Date().toISOString()
    }
  };

  db.run(
    'UPDATE workflows SET name = ?, description = ?, data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
    [name, description || '', JSON.stringify(workflowData), workflowId, userId],
    function(err) {
      if (err) {
        logger.logError(err, { context: 'updateWorkflow', userId, workflowId, name });
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      logger.info('Workflow updated', { 
        userId, 
        workflowId, 
        name,
        nodeCount: nodes.length,
        connectionCount: connections.length
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
    }
  );
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;

  db.run(
    'DELETE FROM workflows WHERE id = ? AND user_id = ?',
    [workflowId, userId],
    function(err) {
      if (err) {
        logger.logError(err, { context: 'deleteWorkflow', userId, workflowId });
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      logger.info('Workflow deleted', { userId, workflowId });
      res.json({ success: true, message: 'Workflow deleted successfully' });
    }
  );
});

// NEW ROUTES FROM WORKFLOWNODE - Advanced workflow execution

// POST /api/workflows/:id/activate - Activate workflow for automatic execution
router.post('/:id/activate', activateWorkflow);

// POST /api/workflows/:id/deactivate - Deactivate workflow  
router.post('/:id/deactivate', deactivateWorkflow);

// GET /api/workflows/:id/status - Get workflow execution status
router.get('/:id/status', getWorkflowStatus);

// GET /api/workflows/:id/failed-executions - Get failed executions for replay
router.get('/:id/failed-executions', getFailedExecutions);

// POST /api/workflows/:id/replay/:executionId - Replay a failed execution
router.post('/:id/replay/:executionId', replayFailedExecution);

// GET /api/workflows/:id/history - Get execution history
router.get('/:id/history', getExecutionHistory);

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
    const hasTrigger = workflow.nodes.some(node => node.data.type === 'trigger');
    if (!hasTrigger) {
      return res.status(400).json({
        success: false,
        error: 'Workflow must contain a trigger node for execution'
      });
    }

    console.log(`📝 Registering workflow ${workflowId} for execution`);
    console.log('Workflow structure:', {
      nodes: workflow.nodes.length,
      edges: workflow.edges.length,
      nodeTypes: workflow.nodes.map(n => n.data.type)
    });

    // Register workflow with executor
    const success = workflowExecutor.registerWorkflow(workflowId, workflow, {});
    
    if (success) {
      logger.info('Workflow registered for execution', { 
        workflowId, 
        nodeCount: workflow.nodes.length,
        edgeCount: workflow.edges.length 
      });
      
      res.json({
        success: true,
        message: `Workflow ${workflowId} registered successfully`,
        workflowId
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

// GET /api/workflows/:id/trigger-info - Get trigger node info for hosted chat (no auth required for testing)
router.get('/:id/trigger-info', (req, res) => {
  const workflowId = req.params.id;

  // Check active workflows first
  const workflowExecutor = require('../services/workflowExecutor');
  if (workflowExecutor && workflowExecutor.activeWorkflows && workflowExecutor.activeWorkflows.has(workflowId)) {
    const activeWorkflow = workflowExecutor.activeWorkflows.get(workflowId);
    const chatTrigger = activeWorkflow.nodes.find(node => node.data.type === 'chatTrigger');
    
    if (chatTrigger) {
      return res.json({
        success: true,
        workflowId: workflowId,
        triggerNodeId: chatTrigger.id,
        triggerNodeType: chatTrigger.data.type,
        webhookPath: 'chat',
        isActive: true
      });
    }
  }

  // Fallback to database for inactive workflows
  db.get(
    'SELECT * FROM workflows WHERE id = ?',
    [workflowId],
    (err, row) => {
      if (err) {
        logger.logError(err, { context: 'getTriggerInfo', workflowId });
        return res.status(500).json({ error: 'Database error' });
      }

      if (!row) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      try {
        const workflowData = JSON.parse(row.data);
        const chatTrigger = workflowData.nodes.find(node => 
          node.data.type === 'chatTrigger'
        );

        if (!chatTrigger) {
          return res.status(400).json({ 
            error: 'No chat trigger found in workflow' 
          });
        }
        
        res.json({
          success: true,
          workflowId: workflowId,
          triggerNodeId: chatTrigger.id,
          triggerNodeType: chatTrigger.data.type,
          webhookPath: 'chat',
          isActive: false
        });
      } catch (parseError) {
        logger.logError(parseError, { context: 'parseTriggerInfo', workflowId });
        res.status(500).json({ error: 'Invalid workflow data' });
      }
    }
  );
});

// GET /api/workflows/:id/hosted-url - Get hosted chat URL for workflow testing
router.get('/:id/hosted-url', verifyToken, (req, res) => {
  const userId = req.user.userId;
  const workflowId = req.params.id;

  // Get workflow to find trigger node
  db.get(
    'SELECT * FROM workflows WHERE id = ? AND user_id = ?',
    [workflowId, userId],
    (err, row) => {
      if (err) {
        logger.logError(err, { context: 'getHostedUrl', userId, workflowId });
        return res.status(500).json({ error: 'Database error' });
      }

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
    }
  );
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

module.exports = router;