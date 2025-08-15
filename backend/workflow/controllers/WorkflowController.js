// Main workflow controller
// Handles workflow CRUD operations
// Workflow validation and saving logic
// User permission checks for workflow access
// /backend/workflow/controllers/WorkflowController.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Simple direct database connection
const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

const WorkflowController = {
  // Get all workflows for the authenticated user
  async getAll(req, res) {
    try {
      console.log('🔍 Getting workflows for user:', req.user.userId);
      
      // Create table if not exists
      db.run(`
        CREATE TABLE IF NOT EXISTS workflows (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          data TEXT,
          is_active BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Table creation error:', err);
        } else {
          console.log('Workflow table ready');
        }
      });
      
      // Get workflows for user
      db.all(
        'SELECT id, name, data, is_active, created_at, updated_at FROM workflows WHERE user_id = ? ORDER BY updated_at DESC',
        [req.user.userId],
        (err, rows) => {
          if (err) {
            console.error('❌ Database query error:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
          }
          
          console.log('✅ Found workflows:', rows.length);
          const workflows = rows.map(workflow => ({
            ...workflow,
            data: workflow.data ? JSON.parse(workflow.data) : { nodes: [], edges: [] }
          }));
          
          res.status(200).json(workflows);
        }
      );
      
    } catch (error) {
      console.error('❌ Error in WorkflowController.getAll:', error);
      res.status(500).json({ message: 'Error fetching workflows', error: error.message });
    }
  },

  // Create a new workflow
  async create(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Workflow name is required.' });
      }
      
      db.run(
        'INSERT INTO workflows (user_id, name, data, is_active) VALUES (?, ?, ?, ?)',
        [req.user.userId, name, JSON.stringify({ nodes: [], edges: [] }), 1],
        function(err) {
          if (err) {
            console.error('❌ Create workflow error:', err);
            return res.status(500).json({ message: 'Error creating workflow', error: err.message });
          }
          
          res.status(201).json({
            id: this.lastID,
            name,
            data: { nodes: [], edges: [] },
            is_active: 1,
            created_at: new Date().toISOString()
          });
        }
      );
    } catch (error) {
      console.error('❌ Error in create:', error);
      res.status(500).json({ message: 'Error creating workflow', error: error.message });
    }
  },

  // Get a single workflow by ID  
  async getById(req, res) {
    try {
      const { id } = req.params;
      
      db.get(
        'SELECT id, name, data, is_active, created_at, updated_at FROM workflows WHERE id = ? AND user_id = ?',
        [id, req.user.userId],
        (err, row) => {
          if (err) {
            console.error('❌ Get workflow error:', err);
            return res.status(500).json({ message: 'Error fetching workflow', error: err.message });
          }
          
          if (!row) {
            return res.status(404).json({ message: 'Workflow not found' });
          }
          
          row.data = row.data ? JSON.parse(row.data) : { nodes: [], edges: [] };
          res.status(200).json(row);
        }
      );
    } catch (error) {
      console.error('❌ Error in getById:', error);
      res.status(500).json({ message: 'Error fetching workflow', error: error.message });
    }
  },

  // Update a workflow
  async update(req, res) {
    try {
      const { id } = req.params;
      const { data } = req.body;
      
      if (!data) {
        return res.status(400).json({ message: 'Workflow data is required.' });
      }

      db.run(
        'UPDATE workflows SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [JSON.stringify(data), id, req.user.userId],
        function(err) {
          if (err) {
            console.error('❌ Update workflow error:', err);
            return res.status(500).json({ message: 'Error updating workflow', error: err.message });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ message: 'Workflow not found' });
          }
          
          res.status(200).json({ message: 'Workflow saved successfully.' });
        }
      );
    } catch (error) {
      console.error('❌ Error in update:', error);
      res.status(500).json({ message: 'Error updating workflow', error: error.message });
    }
  }
};

module.exports = WorkflowController;
