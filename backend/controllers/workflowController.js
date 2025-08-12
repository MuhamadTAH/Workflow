/*
=================================================================
BACKEND FILE: backend/controllers/workflowController.js
=================================================================
This controller handles workflow activation and management.
Copied from WorkflowNode and adapted for main backend.
*/

const workflowExecutor = require('../services/workflowExecutor');
const workflowState = require('../services/workflowState');

// Simple in-memory storage for active workflows (in production, use database)
const activeWorkflows = new Map();

const credentialsStore = {
    'telegram_bot_token': ''
};

const getCredentials = (nodeType) => {
    if (nodeType === 'telegramTrigger') {
        return { botToken: credentialsStore.telegram_bot_token };
    }
    return {};
};

const activateWorkflow = async (req, res) => {
    try {
        const workflowId = req.params.id;
        let { workflow } = req.body; 

        // If no workflow data provided, try to load from database
        if (!workflow) {
            console.log(`⚠️ No workflow data in request body, attempting to load from database for ${workflowId}`);
            try {
                const db = require('../db');
                const stmt = db.prepare('SELECT * FROM workflows WHERE id = ?');
                const row = stmt.get(workflowId);
                
                if (row && row.data) {
                    workflow = JSON.parse(row.data);
                    console.log(`✅ Loaded workflow data from database: ${workflow.nodes?.length || 0} nodes`);
                } else {
                    return res.status(400).json({ message: 'Workflow not found in database. Please save the workflow first.' });
                }
            } catch (dbError) {
                console.error('❌ Failed to load workflow from database:', dbError);
                return res.status(400).json({ message: 'Complete workflow data (nodes and edges) is required for activation.' });
            }
        }

        if (!workflow || !workflow.nodes || !workflow.edges) {
            return res.status(400).json({ message: 'Complete workflow data (nodes and edges) is required for activation.' });
        }

        // Find trigger nodes in the workflow
        const triggerNodes = workflow.nodes.filter(node => 
            node.data.type === 'telegramTrigger'
        );

        if (triggerNodes.length === 0) {
            return res.status(400).json({ message: 'Workflow must contain at least one trigger node (Telegram Trigger).' });
        }

        console.log(`🔄 Activating workflow ${workflowId}...`);
        console.log(`Found ${triggerNodes.length} trigger node(s):`, triggerNodes.map(n => n.data.type));
        console.log(`Current active workflows count: ${activeWorkflows.size}`);

        // Register trigger handlers for each trigger node (URLs handled internally)
        const triggerUrls = [];
        for (const triggerNode of triggerNodes) {
            if (triggerNode.data.type === 'telegramTrigger') {
                const webhookUrl = `${process.env.BASE_URL || 'https://workflow-lg9z.onrender.com'}/api/webhooks/telegram/${workflowId}`;
                triggerUrls.push({
                    nodeId: triggerNode.id,
                    type: 'telegramTrigger',
                    webhookUrl: webhookUrl
                });
            }
        }

        // Register workflow for automatic execution
        try {
            workflowExecutor.registerWorkflow(workflowId, workflow, {});
            console.log(`✅ Workflow ${workflowId} registered for auto-execution`);
            console.log(`WorkflowExecutor active workflows count: ${workflowExecutor.activeWorkflows.size}`);
        } catch (error) {
            console.error('Failed to register workflow:', error.message);
            return res.status(500).json({ message: `Failed to register workflow: ${error.message}` });
        }

        // Store active workflow
        activeWorkflows.set(workflowId, {
            workflowId,
            workflow,
            triggerUrls,
            activatedAt: new Date().toISOString(),
            status: 'active'
        });

        console.log(`📊 Activation complete - Controller active workflows: ${activeWorkflows.size}, Executor active workflows: ${workflowExecutor.activeWorkflows.size}`);

        // TODO: Temporarily disabled database storage to prevent crashes
        // await workflowState.storeActiveWorkflow(workflowId, workflow, triggerUrls);
        console.log(`⚠️ Database storage temporarily disabled - workflow active in memory only`);

        res.json({
            success: true,
            message: `✅ Workflow Activated`,
            workflowId: workflowId,
            activatedAt: new Date().toISOString(),
            status: 'active'
        });

    } catch (error) {
        console.error('Workflow activation failed:', error.message);
        res.status(500).json({
            success: false,
            message: `Failed to activate workflow: ${error.message}`,
            error: error.message
        });
    }
};

const deactivateWorkflow = async (req, res) => {
    try {
        const workflowId = req.params.id;

        console.log(`🔄 Deactivating workflow ${workflowId}...`);
        console.log(`Before deactivation - Controller active workflows: ${activeWorkflows.size}, Executor active workflows: ${workflowExecutor.activeWorkflows.size}`);

        // Check if workflow is active
        if (!activeWorkflows.has(workflowId)) {
            console.log(`❌ Workflow ${workflowId} not found in controller active workflows`);
            return res.status(404).json({
                success: false,
                message: `Workflow ${workflowId} is not currently active.`
            });
        }

        // Deactivate in executor
        const result = workflowExecutor.deactivateWorkflow(workflowId);
        console.log(`🔧 Executor deactivation result: ${result}`);
        
        // Remove from active workflows
        activeWorkflows.delete(workflowId);
        console.log(`📊 After deactivation - Controller active workflows: ${activeWorkflows.size}, Executor active workflows: ${workflowExecutor.activeWorkflows.size}`);
        
        // Remove from database
        await workflowState.removeActiveWorkflow(workflowId);
        
        res.json({
            success: true,
            message: `✅ Workflow ${workflowId} has been deactivated.`,
            workflowId: workflowId,
            deactivatedAt: new Date().toISOString(),
            status: 'inactive'
        });

    } catch (error) {
        console.error('Workflow deactivation failed:', error.message);
        res.status(500).json({
            success: false,
            message: `Failed to deactivate workflow: ${error.message}`,
            error: error.message
        });
    }
};

const getWorkflowStatus = async (req, res) => {
    try {
        const workflowId = req.params.id;
        
        const activeWorkflow = activeWorkflows.get(workflowId);
        
        if (activeWorkflow) {
            res.json({
                success: true,
                workflowId: workflowId,
                status: 'active',
                activatedAt: activeWorkflow.activatedAt,
                triggerUrls: activeWorkflow.triggerUrls
            });
        } else {
            res.json({
                success: true,
                workflowId: workflowId,
                status: 'inactive'
            });
        }

    } catch (error) {
        console.error('Failed to get workflow status:', error.message);
        res.status(500).json({
            success: false,
            message: `Failed to get workflow status: ${error.message}`,
            error: error.message
        });
    }
};

// Restore active workflows on server startup
const restoreActiveWorkflowsOnStartup = async () => {
    console.log('🔄 Restoring active workflows from database...');
    try {
        const restoredCount = await workflowState.restoreActiveWorkflows(workflowExecutor, activeWorkflows);
        console.log(`✅ Restored ${restoredCount} active workflows on startup`);
        
        // Clean up old failed workflows
        await workflowState.cleanupFailedWorkflows();
        
        return restoredCount;
    } catch (error) {
        console.error('❌ Failed to restore workflows on startup:', error);
        return 0;
    }
};

module.exports = {
    activateWorkflow,
    deactivateWorkflow,
    getWorkflowStatus,
    restoreActiveWorkflowsOnStartup
};