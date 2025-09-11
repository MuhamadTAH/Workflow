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
    // Allow mock token for testing/development
    if (token.startsWith('MOCK_TOKEN_FOR_TESTING_')) {
      req.user = { userId: 'test-user-1', email: 'mhamadtah548@gmail.com', mock: true };
      return next();
    }
    
    // Regular JWT validation for production
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

  // 💾 DETAILED SAVE LOGGING - Show what's being saved
  console.log('💾 ========================================');
  console.log('💾 WORKFLOW SAVE DETAILS (CREATE)');
  console.log('💾 ========================================');
  console.log(`💾 Workflow Name: ${name}`);
  console.log(`💾 Node Count: ${nodes.length}`);
  console.log(`💾 Connection Count: ${connections.length}`);
  console.log('💾 Node Details:');
  
  nodes.forEach((node, index) => {
    console.log(`💾   Node ${index + 1}:`);
    console.log(`💾     - ID: ${node.id}`);
    console.log(`💾     - Type: ${node.data?.type || 'unknown'}`);
    console.log(`💾     - Label: ${node.data?.label || 'no label'}`);
    
    // Show all node data properties
    if (node.data) {
      const dataKeys = Object.keys(node.data);
      console.log(`💾     - Data Properties: [${dataKeys.join(', ')}]`);
      
      // Show specific important properties
      if (node.data.appId) console.log(`💾     - App ID: ${node.data.appId}`);
      if (node.data.clientSecret) console.log(`💾     - Client Secret: ${node.data.clientSecret ? '[SET]' : '[NOT SET]'}`);
      if (node.data.accessToken) console.log(`💾     - Access Token: ${node.data.accessToken ? '[SET]' : '[NOT SET]'}`);
      if (node.data.phoneNumberId) console.log(`💾     - Phone Number ID: ${node.data.phoneNumberId}`);
      if (node.data.messageText) console.log(`💾     - Message Text: ${node.data.messageText}`);
    }
  });
  
  connections.forEach((conn, index) => {
    console.log(`💾   Connection ${index + 1}: ${conn.source} → ${conn.target}`);
  });
  console.log('💾 ========================================');

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

  // 💾 DETAILED SAVE LOGGING - Show what's being updated
  console.log('💾 ========================================');
  console.log('💾 WORKFLOW SAVE DETAILS (UPDATE)');
  console.log('💾 ========================================');
  console.log(`💾 Workflow ID: ${workflowId}`);
  console.log(`💾 Workflow Name: ${name}`);
  console.log(`💾 Node Count: ${nodes.length}`);
  console.log(`💾 Connection Count: ${connections.length}`);
  console.log('💾 Node Details:');
  
  nodes.forEach((node, index) => {
    console.log(`💾   Node ${index + 1}:`);
    console.log(`💾     - ID: ${node.id}`);
    console.log(`💾     - Type: ${node.data?.type || 'unknown'}`);
    console.log(`💾     - Label: ${node.data?.label || 'no label'}`);
    
    // Show all node data properties
    if (node.data) {
      const dataKeys = Object.keys(node.data);
      console.log(`💾     - Data Properties: [${dataKeys.join(', ')}]`);
      
      // Show specific important properties
      if (node.data.appId) console.log(`💾     - App ID: ${node.data.appId}`);
      if (node.data.clientSecret) console.log(`💾     - Client Secret: ${node.data.clientSecret ? '[SET]' : '[NOT SET]'}`);
      if (node.data.accessToken) console.log(`💾     - Access Token: ${node.data.accessToken ? '[SET]' : '[NOT SET]'}`);
      if (node.data.phoneNumberId) console.log(`💾     - Phone Number ID: ${node.data.phoneNumberId}`);
      if (node.data.messageText) console.log(`💾     - Message Text: ${node.data.messageText}`);
    }
  });
  
  connections.forEach((conn, index) => {
    console.log(`💾   Connection ${index + 1}: ${conn.source} → ${conn.target}`);
  });
  console.log('💾 ========================================');

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

// Debug middleware for workflow routes
router.use((req, res, next) => {
  console.log('🔧 WORKFLOW ROUTE DEBUG:', {
    method: req.method,
    originalUrl: req.originalUrl,
    params: req.params,
    query: req.query,
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    timestamp: new Date().toISOString()
  });
  
  // Special logging for activation requests
  if (req.url.includes('/activate')) {
    console.log('🎯 WORKFLOW ACTIVATION ROUTE HIT:', {
      workflowId: req.params.id,
      method: req.method,
      hasWorkflowData: !!(req.body?.workflow),
      triggerNodeTypes: req.body?.workflow?.nodes?.map(n => n.data?.type).filter(t => t?.includes('Trigger')) || []
    });
  }
  
  next();
});

// POST /api/workflows/:id/activate - Activate workflow for automatic execution
router.post('/:id/activate', verifyToken, activateWorkflow);

// POST /api/workflows/:id/deactivate - Deactivate workflow  
router.post('/:id/deactivate', verifyToken, deactivateWorkflow);

// GET /api/workflows/:id/status - Get workflow execution status
router.get('/:id/status', verifyToken, getWorkflowStatus);

// GET /api/workflows/:id/failed-executions - Get failed executions for replay
router.get('/:id/failed-executions', getFailedExecutions);

// POST /api/workflows/:id/replay/:executionId - Replay a failed execution
router.post('/:id/replay/:executionId', replayFailedExecution);

// GET /api/workflows/:id/history - Get execution history
router.get('/:id/history', getExecutionHistory);

// POST /api/workflows/register - Register workflow for execution
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

// Get real Telegram virtual workflow - connects to actual running Telegram system
router.get('/telegram-workflow', verifyToken, async (req, res) => {
  try {
    console.log('🔄 Loading actual Telegram workflow for user:', req.user.userId);
    
    // Connect to actual Telegram listener system - no mock data
    const db = require('../db');
    
    // Get user's actual active Telegram bot
    const userBot = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM telegram_listener_bots 
        WHERE user_id = ? AND is_active = 1 
        ORDER BY setup_at DESC 
        LIMIT 1
      `, [req.user.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!userBot) {
      return res.status(404).json({
        success: false,
        error: 'No active Telegram bot found. Please setup a Telegram bot first.'
      });
    }
    
    // Get actual message processing stats
    const messageStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT COUNT(*) as total_messages, 
               MAX(timestamp) as last_message 
        FROM telegram_listener_messages 
        WHERE listener_id = ?
      `, [userBot.listener_id], (err, row) => {
        if (err) reject(err);
        else resolve(row || { total_messages: 0, last_message: null });
      });
    });
    
    // Get user's actual Claude configuration
    const claudeConfig = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM telegram_claude_configs 
        WHERE user_id = ?
      `, [req.user.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Get user's actual system prompt
    const systemPromptData = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM telegram_system_prompts 
        WHERE user_id = ?
      `, [req.user.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Get user's actual knowledge base
    const knowledgeBase = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM telegram_knowledge_base 
        WHERE user_id = ?
      `, [req.user.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // Create real virtual workflow nodes representing actual Telegram components
    const virtualWorkflowNodes = [
      {
        id: 'telegram-message-receiver',
        type: 'custom',
        position: { x: 100, y: 100 },
        data: {
          label: 'Message Receiver',
          type: 'telegram-message-receiver',
          description: 'Receives messages from your Telegram bot',
          config: {
            botToken: userBot.bot_token.substring(0, 10) + '...',
            listenerId: userBot.listener_id,
            isActive: userBot.is_active,
            messageCount: messageStats.total_messages
          },
          isVirtualNode: true,
          isProtected: true
        }
      },
      {
        id: 'claude-ai-processor',
        type: 'custom',
        position: { x: 400, y: 100 },
        data: {
          label: 'Claude AI',
          type: 'claude-ai-processor',
          description: 'AI processing with your Claude configuration',
          config: {
            hasApiKey: !!claudeConfig?.api_key,
            model: claudeConfig?.model || 'claude-3-5-sonnet-20241022',
            systemPrompt: systemPromptData?.prompt || 'You are a helpful and friendly AI assistant.',
            hasKnowledgeBase: !!knowledgeBase,
            knowledgeBaseFile: knowledgeBase?.filename || null
          },
          isVirtualNode: true,
          realSettings: {
            userId: req.user.userId,
            claudeConfigId: claudeConfig?.id || null,
            systemPromptId: systemPromptData?.id || null,
            knowledgeBaseId: knowledgeBase?.id || null
          }
        }
      },
      {
        id: 'telegram-message-sender',
        type: 'custom',
        position: { x: 700, y: 100 },
        data: {
          label: 'Message Sender',
          type: 'telegram-message-sender',
          description: 'Sends responses back to Telegram users',
          config: {
            botToken: userBot.bot_token.substring(0, 10) + '...',
            autoReply: true,
            connectedToClaude: !!claudeConfig?.api_key
          },
          isVirtualNode: true,
          isProtected: true
        }
      }
    ];

    const virtualWorkflowEdges = [
      {
        id: 'receiver-to-claude',
        source: 'telegram-message-receiver',
        target: 'claude-ai-processor',
        type: 'default'
      },
      {
        id: 'claude-to-sender',
        source: 'claude-ai-processor',
        target: 'telegram-message-sender',
        type: 'default'
      }
    ];

    // Return the actual workflow structure based on real data
    const actualWorkflow = {
      id: `telegram-workflow-${userBot.listener_id}`,
      name: 'Telegram Workflow',
      description: `Virtual workflow for bot: ${userBot.bot_token.substring(0, 10)}...`,
      botConfig: {
        listenerId: userBot.listener_id,
        isActive: userBot.is_active,
        setupAt: userBot.setup_at,
        messageCount: messageStats.total_messages,
        lastActivity: messageStats.last_message
      },
      nodes: virtualWorkflowNodes,
      edges: virtualWorkflowEdges,
      isLiveWorkflow: true,
      connectedToTelegram: true
    };
    
    console.log('✅ Serving actual Telegram workflow data:', {
      listenerId: userBot.listener_id,
      messageCount: messageStats.total_messages
    });
    
    res.json({
      success: true,
      workflow: actualWorkflow,
      message: 'Connected to actual running Telegram workflow'
    });
    
  } catch (error) {
    console.error('❌ Error loading actual Telegram workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to Telegram workflow'
    });
  }
});

// Update Telegram virtual workflow settings - syncs changes back to actual Telegram page
router.put('/telegram-workflow/update', verifyToken, async (req, res) => {
  try {
    const { nodeId, nodeType, config } = req.body;
    const userId = req.user.userId;
    
    console.log('🔄 Updating Telegram virtual workflow:', { nodeId, nodeType, userId });
    
    const db = require('../db');
    
    switch (nodeType) {
      case 'claude-ai-processor':
        // Update actual Claude configuration
        if (config.systemPrompt) {
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT OR REPLACE INTO telegram_system_prompts 
              (user_id, prompt, updated_at)
              VALUES (?, ?, datetime('now'))
            `, [userId, config.systemPrompt], function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            });
          });
          console.log('✅ Updated system prompt in Telegram page');
        }
        
        if (config.apiKey) {
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT OR REPLACE INTO telegram_claude_configs 
              (user_id, api_key, model, connection_status, updated_at)
              VALUES (?, ?, ?, 'connected', datetime('now'))
            `, [userId, config.apiKey, config.model || 'claude-3-5-sonnet-20241022'], function(err) {
              if (err) reject(err);
              else resolve(this.lastID);
            });
          });
          console.log('✅ Updated Claude API configuration in Telegram page');
        }
        break;
        
      case 'telegram-message-receiver':
      case 'telegram-message-sender':
        // These are read-only nodes representing bot status
        console.log('ℹ️ Bot configuration nodes are read-only');
        break;
        
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown node type: ${nodeType}`
        });
    }
    
    res.json({
      success: true,
      message: 'Workflow updated and synced to Telegram page',
      synced: true
    });
    
  } catch (error) {
    console.error('❌ Error updating Telegram virtual workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update workflow'
    });
  }
});

module.exports = router;