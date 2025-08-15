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

// Define the CRUD routes
router.get('/', WorkflowController.getAll);
router.post('/', WorkflowController.create);
router.get('/:id', WorkflowController.getById);
router.put('/:id', WorkflowController.update);

module.exports = router;
