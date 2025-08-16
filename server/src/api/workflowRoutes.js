const express = require('express');
const router = express.Router();

// Import the controller function
const { saveWorkflow } = require('../controllers/workflowController');

/**
 * @route   POST /api/workflows/save
 * @desc    Saves a workflow configuration.
 * @access  Public (for now)
 */
// The route now calls the saveWorkflow controller function to handle the request.
router.post('/save', saveWorkflow);

module.exports = router;
