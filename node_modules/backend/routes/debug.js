const express = require('express');
const workflowExecutor = require('../services/workflowExecutor');
const workflowState = require('../services/workflowState');
const router = express.Router();

// Debug endpoint to check workflow status
router.get('/api/debug/workflows', async (req, res) => {
  try {
    // Get active workflows from executor
    const executorWorkflows = workflowExecutor.activeWorkflows;
    const executorKeys = Array.from(executorWorkflows.keys());
    
    // Get workflows from database
    const dbWorkflows = await workflowState.getActiveWorkflows();
    const dbKeys = dbWorkflows.map(w => w.workflowId);
    
    // Get stats
    const stats = await workflowState.getWorkflowStats();

    res.json({
      success: true,
      executor: {
        count: executorWorkflows.size,
        workflowIds: executorKeys
      },
      database: {
        count: dbWorkflows.length,
        workflowIds: dbKeys
      },
      stats,
      details: {
        executorWorkflows: Object.fromEntries(
          executorKeys.map(key => [
            key, 
            {
              isActive: executorWorkflows.get(key).isActive,
              registeredAt: executorWorkflows.get(key).registeredAt
            }
          ])
        ),
        databaseWorkflows: dbWorkflows.map(w => ({
          workflowId: w.workflowId,
          status: w.status,
          activatedAt: w.activatedAt,
          triggerUrls: w.triggerUrls
        }))
      }
    });
  } catch (error) {
    console.error('Debug workflows endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to check specific workflow
router.get('/api/debug/workflow/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    // Check in executor
    const inExecutor = workflowExecutor.activeWorkflows.has(workflowId);
    const executorData = inExecutor ? workflowExecutor.activeWorkflows.get(workflowId) : null;
    
    // Check in database
    const dbWorkflows = await workflowState.getActiveWorkflows();
    const dbWorkflow = dbWorkflows.find(w => w.workflowId === workflowId);
    
    res.json({
      success: true,
      workflowId,
      executor: {
        exists: inExecutor,
        isActive: executorData?.isActive || false,
        registeredAt: executorData?.registeredAt || null,
        nodeCount: executorData?.nodes?.length || 0,
        edgeCount: executorData?.edges?.length || 0
      },
      database: {
        exists: !!dbWorkflow,
        status: dbWorkflow?.status || null,
        activatedAt: dbWorkflow?.activatedAt || null,
        triggerUrls: dbWorkflow?.triggerUrls || []
      }
    });
  } catch (error) {
    console.error('Debug specific workflow endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to test workflow activation
router.post('/api/debug/workflow/:workflowId/test-activation', async (req, res) => {
  try {
    const { workflowId } = req.params;
    
    // Check current status
    const beforeExecutor = workflowExecutor.activeWorkflows.has(workflowId);
    const dbWorkflows = await workflowState.getActiveWorkflows();
    const beforeDB = dbWorkflows.find(w => w.workflowId === workflowId);
    
    res.json({
      success: true,
      workflowId,
      test: 'activation-status-check',
      before: {
        executor: beforeExecutor,
        database: !!beforeDB
      },
      message: `Workflow ${workflowId} - Executor: ${beforeExecutor ? 'ACTIVE' : 'NOT ACTIVE'}, Database: ${beforeDB ? 'FOUND' : 'NOT FOUND'}`
    });
  } catch (error) {
    console.error('Debug test activation endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug endpoint to clear all workflows (for testing)
router.post('/api/debug/workflows/clear-all', async (req, res) => {
  try {
    // Clear executor
    const executorCount = workflowExecutor.activeWorkflows.size;
    workflowExecutor.activeWorkflows.clear();
    
    // Clear database
    const dbWorkflows = await workflowState.getActiveWorkflows();
    for (const workflow of dbWorkflows) {
      await workflowState.removeActiveWorkflow(workflow.workflowId);
    }
    
    res.json({
      success: true,
      message: 'All workflows cleared',
      cleared: {
        executor: executorCount,
        database: dbWorkflows.length
      }
    });
  } catch (error) {
    console.error('Debug clear all workflows endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;