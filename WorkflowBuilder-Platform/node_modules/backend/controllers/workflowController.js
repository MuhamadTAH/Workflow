/*
=================================================================
BACKEND FILE: backend/controllers/workflowController.js
=================================================================
This controller handles workflow activation and management.
Copied from WorkflowNode and adapted for main backend.
*/

const workflowExecutor = require('../services/workflowExecutor');

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
        const { workflowId } = req.params;
        const { triggerNode, workflow } = req.body; 

        if (!triggerNode || triggerNode.data.type !== 'trigger') {
            return res.status(400).json({ message: 'A valid trigger node is required to activate.' });
        }

        if (!workflow || !workflow.nodes || !workflow.edges) {
            return res.status(400).json({ message: 'Complete workflow data (nodes and edges) is required for auto-execution.' });
        }
        
        if(triggerNode.data.token) {
            credentialsStore.telegram_bot_token = triggerNode.data.token;
        }

        const credentials = getCredentials('telegramTrigger');
        
        if (!credentials.botToken) {
             return res.status(400).json({ message: 'Telegram Bot API Token is missing.' });
        }

        console.log(`🔄 Activating workflow ${workflowId}...`);

        // Register workflow for automatic execution with credentials
        try {
            workflowExecutor.registerWorkflow(workflowId, workflow, credentials);
            console.log(`✅ Workflow ${workflowId} registered for auto-execution`);
        } catch (error) {
            console.error('Failed to register workflow:', error.message);
            return res.status(500).json({ message: `Failed to register workflow: ${error.message}` });
        }

        res.json({
            success: true,
            message: `✅ Workflow activated! Bot will now respond to messages automatically.`,
            workflowId: workflowId,
            webhookUrl: `${process.env.BASE_URL || 'https://workflownode.onrender.com'}/api/webhooks/telegram/${workflowId}`,
            activatedAt: new Date().toISOString()
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
        const { workflowId } = req.params;

        console.log(`🔄 Deactivating workflow ${workflowId}...`);

        const result = workflowExecutor.deactivateWorkflow(workflowId);
        
        if (result) {
            res.json({
                success: true,
                message: `✅ Workflow ${workflowId} has been deactivated.`,
                workflowId: workflowId,
                deactivatedAt: new Date().toISOString()
            });
        } else {
            res.status(404).json({
                success: false,
                message: `Workflow ${workflowId} not found.`
            });
        }

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
        const { workflowId } = req.params;
        
        const status = workflowExecutor.getWorkflowStatus(workflowId);
        
        res.json({
            success: true,
            workflowId: workflowId,
            status: status
        });

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