const express = require('express');
const jwt = require('jsonwebtoken');
const workflowService = require('../../services/workflow/workflowService');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// GET /api/workflows - Get all workflows for authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const workflows = await workflowService.getUserWorkflows(req.user.userId);
    res.json({
      success: true,
      workflows
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflows',
      error: error.message
    });
  }
});

// GET /api/workflows/stats - Get workflow statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = await workflowService.getWorkflowStats(req.user.userId);
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching workflow stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflow statistics',
      error: error.message
    });
  }
});

// GET /api/workflows/:id - Get specific workflow
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    if (isNaN(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow ID'
      });
    }

    const workflow = await workflowService.getWorkflowById(workflowId, req.user.userId);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflow',
      error: error.message
    });
  }
});

// POST /api/workflows - Create new workflow
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, description, flow_data } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Workflow name is required'
      });
    }

    const workflowData = {
      name: name.trim(),
      description: description?.trim() || '',
      flow_data: flow_data || {}
    };

    const workflow = await workflowService.createWorkflow(req.user.userId, workflowData);

    res.status(201).json({
      success: true,
      message: 'Workflow created successfully',
      workflow
    });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating workflow',
      error: error.message
    });
  }
});

// PUT /api/workflows/:id - Update workflow
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    if (isNaN(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow ID'
      });
    }

    const { name, description, flow_data, status } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (flow_data !== undefined) updateData.flow_data = flow_data;
    if (status !== undefined) {
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be "active" or "inactive"'
        });
      }
      updateData.status = status;
    }

    const workflow = await workflowService.updateWorkflow(workflowId, req.user.userId, updateData);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow updated successfully',
      workflow
    });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating workflow',
      error: error.message
    });
  }
});

// DELETE /api/workflows/:id - Delete workflow
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    if (isNaN(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow ID'
      });
    }

    const deleted = await workflowService.deleteWorkflow(workflowId, req.user.userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting workflow',
      error: error.message
    });
  }
});

// POST /api/workflows/:id/toggle - Toggle workflow status
router.post('/:id/toggle', verifyToken, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    if (isNaN(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow ID'
      });
    }

    const workflow = await workflowService.toggleWorkflowStatus(workflowId, req.user.userId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: `Workflow ${workflow.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      workflow
    });
  } catch (error) {
    console.error('Error toggling workflow status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling workflow status',
      error: error.message
    });
  }
});

// POST /api/workflows/:id/duplicate - Duplicate workflow
router.post('/:id/duplicate', verifyToken, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    if (isNaN(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow ID'
      });
    }

    const duplicatedWorkflow = await workflowService.duplicateWorkflow(workflowId, req.user.userId);

    if (!duplicatedWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Workflow duplicated successfully',
      workflow: duplicatedWorkflow
    });
  } catch (error) {
    console.error('Error duplicating workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error duplicating workflow',
      error: error.message
    });
  }
});

// POST /api/workflows/:id/execute - Execute workflow
router.post('/:id/execute', verifyToken, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    if (isNaN(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow ID'
      });
    }

    const { input_data } = req.body;

    const result = await workflowService.executeWorkflow(workflowId, req.user.userId, input_data);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow execution started',
      execution: result
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Error executing workflow',
      error: error.message
    });
  }
});

// GET /api/workflows/:id/executions - Get workflow execution history
router.get('/:id/executions', verifyToken, async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    if (isNaN(workflowId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workflow ID'
      });
    }

    const limit = parseInt(req.query.limit) || 10;

    const executions = await workflowService.getWorkflowExecutions(workflowId, req.user.userId, limit);

    if (executions === null) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      executions
    });
  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workflow executions',
      error: error.message
    });
  }
});

module.exports = router;