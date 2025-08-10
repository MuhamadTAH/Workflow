/*
=================================================================
BACKEND FILE: backend/controllers/workflowController.js
=================================================================
This controller handles workflow activation and management.
Copied from WorkflowNode and adapted for main backend.
*/

const workflowExecutor = require('../services/workflowExecutor');

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

        // Debug: Log what we received
        console.log('🔍 WORKFLOW DEBUG:', {
            workflowId,
            workflowKeys: Object.keys(workflow),
            nodesCount: workflow.nodes?.length || 0,
            edgesCount: workflow.edges?.length || 0,
            nodeTypes: workflow.nodes?.map(n => `${n.data?.type} (${n.id})`) || []
        });

        // Find trigger nodes in the workflow
        const triggerNodes = workflow.nodes.filter(node => 
            node.data.type === 'chatTrigger' || node.data.type === 'telegramTrigger'
        );

        console.log('🔍 TRIGGER NODES FOUND:', triggerNodes.map(n => `${n.data.type} (${n.id})`));

        if (triggerNodes.length === 0) {
            console.log('❌ NO TRIGGER NODES - Available node types:', workflow.nodes?.map(n => n.data?.type));
            return res.status(400).json({ message: 'A valid trigger node is required to activate.' });
        }

        console.log(`🔄 Activating workflow ${workflowId}...`);
        console.log(`Found ${triggerNodes.length} trigger node(s):`, triggerNodes.map(n => n.data.type));

        // Register trigger handlers for each trigger node
        const triggerUrls = [];
        for (const triggerNode of triggerNodes) {
            if (triggerNode.data.type === 'chatTrigger') {
                const webhookUrl = `${process.env.BASE_URL || 'https://workflow-lg9z.onrender.com'}/api/webhooks/chatTrigger/${workflowId}/${triggerNode.id}/chat`;
                triggerUrls.push({
                    nodeId: triggerNode.id,
                    type: 'chatTrigger',
                    webhookUrl: webhookUrl,
                    hostedChatUrl: `${process.env.BASE_URL || 'https://workflow-lg9z.onrender.com'}/public/hosted-chat.html?workflowId=${workflowId}&nodeId=${triggerNode.id}`
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

        // Check if workflow is active
        if (!activeWorkflows.has(workflowId)) {
            return res.status(404).json({
                success: false,
                message: `Workflow ${workflowId} is not currently active.`
            });
        }

        // Deactivate in executor
        const result = workflowExecutor.deactivateWorkflow(workflowId);
        
        // Remove from active workflows
        activeWorkflows.delete(workflowId);
        
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

module.exports = {
    activateWorkflow,
    deactivateWorkflow,
    getWorkflowStatus
};