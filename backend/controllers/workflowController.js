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
        const { workflow } = req.body; 

        if (!workflow || !workflow.nodes || !workflow.edges) {
            return res.status(400).json({ message: 'Complete workflow data (nodes and edges) is required for activation.' });
        }

        // Find trigger nodes in the workflow
        const triggerNodes = workflow.nodes.filter(node => 
            node.data.type === 'chatTrigger' || node.data.type === 'telegramTrigger'
        );

        if (triggerNodes.length === 0) {
            return res.status(400).json({ message: 'Workflow must contain at least one trigger node (Chat Trigger or Telegram Trigger).' });
        }

        console.log(`🔄 Activating workflow ${workflowId}...`);
        console.log(`Found ${triggerNodes.length} trigger node(s):`, triggerNodes.map(n => n.data.type));
        console.log(`Current active workflows count: ${activeWorkflows.size}`);

        // Register trigger handlers for each trigger node
        const triggerUrls = [];
        for (const triggerNode of triggerNodes) {
            if (triggerNode.data.type === 'chatTrigger') {
                const webhookUrl = `${process.env.BASE_URL || 'https://workflow-lg9z.onrender.com'}/api/webhooks/chatTrigger/${workflowId}/${triggerNode.id}/chat`;
                const hostedChatUrl = `${process.env.BASE_URL || 'https://workflow-lg9z.onrender.com'}/public/hosted-chat.html?workflowId=${workflowId}&nodeId=${triggerNode.id}&path=chat&title=Chat+Support`;
                
                console.log('🔗 Generated Chat URLs:', {
                    workflowId: workflowId,
                    nodeId: triggerNode.id,
                    webhookUrl: webhookUrl,
                    hostedChatUrl: hostedChatUrl
                });
                
                triggerUrls.push({
                    nodeId: triggerNode.id,
                    type: 'chatTrigger',
                    webhookUrl: webhookUrl,
                    hostedChatUrl: hostedChatUrl
                });
            } else if (triggerNode.data.type === 'telegramTrigger') {
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

        // Store in database for persistence
        await workflowState.storeActiveWorkflow(workflowId, workflow, triggerUrls);

        res.json({
            success: true,
            message: `✅ Workflow activated! All trigger nodes are now listening for events.`,
            workflowId: workflowId,
            triggerUrls: triggerUrls,
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