/*
=================================================================
BACKEND FILE: backend/controllers/workflowController.js
=================================================================
This controller handles workflow activation and management.
Copied from WorkflowNode and adapted for main backend.
*/

const workflowExecutor = require('../services/workflowExecutor');
const workflowState = require('../services/workflowState');

// Enhanced logging function for workflow events
const logWorkflowEvent = (type, message, details = {}) => {
    const timestamp = new Date().toISOString();
    const separator = '='.repeat(70);
    
    console.log('\n' + separator);
    console.log(`🎯 WORKFLOW EVENT: ${type.toUpperCase()}`);
    console.log(`📅 ${timestamp}`);
    console.log(`📝 ${message}`);
    
    if (Object.keys(details).length > 0) {
        console.log('📊 Details:');
        Object.entries(details).forEach(([key, value]) => {
            console.log(`   • ${key}: ${value}`);
        });
    }
    
    console.log(separator + '\n');
};

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
        const { workflow, dryRun = false } = req.body; 

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

        console.log('\n' + '='.repeat(60));
        console.log(`🚀 WORKFLOW ACTIVATION STARTED`);
        console.log(`🔄 Activating workflow: ${workflowId}${dryRun ? ' (DRY RUN MODE)' : ''}`);
        console.log(`📋 Found ${triggerNodes.length} trigger node(s):`, triggerNodes.map(n => n.data.type));
        console.log(`📊 Current active workflows count: ${activeWorkflows.size}`);
        if (dryRun) {
            console.log(`🧪 DRY RUN: No actual external actions will be performed`);
        }
        console.log('='.repeat(60));

        // Register trigger handlers for each trigger node (URLs handled internally)
        const triggerUrls = [];
        for (const triggerNode of triggerNodes) {
            if (triggerNode.data.type === 'chatTrigger') {
                const webhookUrl = `${process.env.BASE_URL || 'https://workflow-lg9z.onrender.com'}/api/webhooks/chatTrigger/${workflowId}/${triggerNode.id}/chat`;
                
                console.log('🔗 Registered Chat Trigger:', {
                    workflowId: workflowId,
                    nodeId: triggerNode.id,
                    webhookUrl: webhookUrl
                });
                
                triggerUrls.push({
                    nodeId: triggerNode.id,
                    type: 'chatTrigger',
                    webhookUrl: webhookUrl
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
            workflowExecutor.registerWorkflow(workflowId, workflow, { dryRun });
            console.log(`✅ Workflow ${workflowId} registered for auto-execution${dryRun ? ' (DRY RUN)' : ''}`);
            console.log(`WorkflowExecutor active workflows count: ${workflowExecutor.activeWorkflows.size}`);
        } catch (error) {
            console.error('Failed to register workflow:', error.message);
            return res.status(500).json({ message: `Failed to register workflow: ${error.message}` });
        }

        // AUTO-UPDATE TELEGRAM WEBHOOK: If this workflow has a Telegram trigger, update the webhook automatically
        const telegramTrigger = triggerNodes.find(node => node.data.type === 'telegramTrigger');
        if (telegramTrigger && !dryRun) {
            console.log(`🔄 Auto-updating Telegram webhook for workflow: ${workflowId}`);
            try {
                const axios = require('axios');
                const botToken = '8148982414:AAEPKCLwwxiMp0KH3wKqrqdTnPI3W3E_0VQ';
                const webhookUrl = `${process.env.BASE_URL || 'https://workflow-lg9z.onrender.com'}/api/webhooks/telegram/${workflowId}`;
                
                // Update Telegram webhook in the background (don't wait for response)
                axios.post(`https://api.telegram.org/bot${botToken}/setWebhook`, {
                    url: webhookUrl,
                    allowed_updates: ['message', 'callback_query']
                }).then(() => {
                    console.log(`✅ Telegram webhook auto-updated to: ${webhookUrl}`);
                }).catch((error) => {
                    console.error(`❌ Failed to auto-update Telegram webhook:`, error.message);
                });
                
            } catch (error) {
                console.error(`❌ Error during Telegram webhook auto-update:`, error.message);
            }
        } else if (telegramTrigger && dryRun) {
            console.log(`🧪 DRY RUN: Skipping Telegram webhook update for workflow: ${workflowId}`);
        }

        // Store active workflow
        activeWorkflows.set(workflowId, {
            workflowId,
            workflow,
            triggerUrls,
            activatedAt: new Date().toISOString(),
            status: 'active',
            dryRun: dryRun
        });

        console.log('\n' + '='.repeat(60));
        console.log(`✅ WORKFLOW ACTIVATION COMPLETED SUCCESSFULLY!`);
        console.log(`🎯 Workflow ID: ${workflowId}`);
        console.log(`📊 Controller active workflows: ${activeWorkflows.size}`);
        console.log(`🚀 Executor active workflows: ${workflowExecutor.activeWorkflows.size}`);
        console.log(`🔗 Trigger URLs generated: ${triggerUrls.length}`);
        triggerUrls.forEach((trigger, index) => {
            console.log(`   ${index + 1}. ${trigger.type}: ${trigger.webhookUrl}`);
        });
        console.log(`⏰ Activated at: ${new Date().toISOString()}`);
        console.log('='.repeat(60) + '\n');

        // Store in database for persistence
        await workflowState.storeActiveWorkflow(workflowId, workflow, triggerUrls);

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

        console.log('\n' + '='.repeat(60));
        console.log(`🛑 WORKFLOW DEACTIVATION STARTED`);
        console.log(`🔄 Deactivating workflow: ${workflowId}`);
        console.log(`📊 Before deactivation - Controller: ${activeWorkflows.size}, Executor: ${workflowExecutor.activeWorkflows.size}`);
        console.log('='.repeat(60));

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
        console.log('\n' + '='.repeat(60));
        console.log(`✅ WORKFLOW DEACTIVATION COMPLETED SUCCESSFULLY!`);
        console.log(`🎯 Workflow ID: ${workflowId}`);
        console.log(`📊 After deactivation - Controller: ${activeWorkflows.size}, Executor: ${workflowExecutor.activeWorkflows.size}`);
        console.log(`⏰ Deactivated at: ${new Date().toISOString()}`);
        console.log('='.repeat(60) + '\n');
        
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

// Function to log when a workflow is triggered 
const logWorkflowTriggered = (workflowId, triggerType, triggerData) => {
    logWorkflowEvent('TRIGGERED', `Workflow ${workflowId} was triggered`, {
        'Trigger Type': triggerType,
        'Trigger Data': JSON.stringify(triggerData).substring(0, 100) + '...',
        'Active Workflows': activeWorkflows.size,
        'Triggered At': new Date().toISOString()
    });
};

// Get failed executions for a workflow
const getFailedExecutions = async (req, res) => {
    try {
        const workflowId = req.params.id;
        
        console.log(`📋 Getting failed executions for workflow: ${workflowId}`);
        
        // Get failed executions from workflow executor
        const failedExecutions = workflowExecutor.getFailedExecutions(workflowId);
        
        res.json({
            success: true,
            workflowId: workflowId,
            failedExecutions: failedExecutions,
            count: failedExecutions.length
        });
        
    } catch (error) {
        console.error('❌ Failed to get failed executions:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get failed executions',
            error: error.message
        });
    }
};

// Replay a failed execution
const replayFailedExecution = async (req, res) => {
    try {
        const workflowId = req.params.id;
        const executionId = req.params.executionId;
        const { 
            fromFailedStep = false,
            useOriginalData = true,
            newTriggerData = null,
            fixNodeConfigs = {}
        } = req.body;
        
        console.log(`🔄 REPLAY REQUEST: Replaying execution ${executionId} for workflow ${workflowId}`);
        console.log(`🔄 REPLAY OPTIONS:`, {
            fromFailedStep,
            useOriginalData,
            hasNewTriggerData: !!newTriggerData,
            fixNodeConfigsCount: Object.keys(fixNodeConfigs).length
        });
        
        // Start the replay
        const replayResult = await workflowExecutor.replayFailedExecution(workflowId, executionId, {
            fromFailedStep,
            useOriginalData,
            newTriggerData,
            fixNodeConfigs
        });
        
        console.log(`✅ REPLAY SUCCESS: Execution replayed successfully`);
        
        res.json({
            success: true,
            message: 'Failed execution replayed successfully',
            workflowId: workflowId,
            originalExecutionId: executionId,
            replayExecutionId: replayResult.executionId,
            replayResult: replayResult,
            completedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error(`❌ REPLAY FAILED: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to replay execution',
            error: error.message,
            workflowId: workflowId,
            executionId: req.params.executionId
        });
    }
};

// Get execution history for a workflow
const getExecutionHistory = async (req, res) => {
    try {
        const workflowId = req.params.id;
        const limit = parseInt(req.query.limit) || 10;
        
        console.log(`📋 Getting execution history for workflow: ${workflowId} (limit: ${limit})`);
        
        // Get execution history from workflow executor
        const history = workflowExecutor.getExecutionHistory(workflowId, limit);
        
        res.json({
            success: true,
            workflowId: workflowId,
            history: history,
            count: history.length,
            limit: limit
        });
        
    } catch (error) {
        console.error('❌ Failed to get execution history:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to get execution history',
            error: error.message
        });
    }
};

module.exports = {
    activateWorkflow,
    deactivateWorkflow,
    getWorkflowStatus,
    restoreActiveWorkflowsOnStartup,
    logWorkflowEvent,
    logWorkflowTriggered,
    getFailedExecutions,
    replayFailedExecution,
    getExecutionHistory
};