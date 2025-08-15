// Workflow CRUD routes
// GET /api/workflows - List user's workflows
// POST /api/workflows - Create new workflow
// PUT /api/workflows/:id - Update workflow
// DELETE /api/workflows/:id - Delete workflow
// /backend/workflow/routes/workflows.js
const express = require('express');
const router = express.Router();
const WorkflowController = require('../controllers/WorkflowController');
const authMiddleware = require('../middleware/WorkflowAuth');

// Protect all workflow routes with the authentication middleware
router.use(authMiddleware);

// Test route without database to check auth
router.get('/test', (req, res) => {
  try {
    console.log('🧪 Test route called successfully');
    console.log('👤 User from token:', req.user);
    res.json({ 
      message: 'Workflow auth test successful', 
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error in test route:', error);
    res.status(500).json({ message: 'Test route error', error: error.message });
  }
});

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    console.log('🧪 Database test route called');
    const dbWrapper = require('../models/Workflow');
    
    // Simple database test - just count workflows
    const db = require('../../dbWrapper');
    const result = await db.all('SELECT COUNT(*) as count FROM workflows');
    
    console.log('✅ Database test successful:', result);
    res.json({ 
      message: 'Database test successful', 
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({ message: 'Database test error', error: error.message });
  }
});

// Define the CRUD routes
router.get('/', WorkflowController.getAll);
router.post('/', WorkflowController.create);
router.get('/:id', WorkflowController.getById);
router.put('/:id', WorkflowController.update);

module.exports = router;
