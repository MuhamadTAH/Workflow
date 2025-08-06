/*
=================================================================
BACKEND FILE: backend/routes/nodes.js
=================================================================
Routes for node execution.
Copied from WorkflowNode and adapted for main backend.
*/

const express = require('express');
const router = express.Router();
const { runNode } = require('../controllers/nodeController');

// POST /api/nodes/run-node - Execute a single node
router.post('/run-node', runNode);

module.exports = router;