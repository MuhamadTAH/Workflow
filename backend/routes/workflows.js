const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../services/logger');

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

module.exports = router;