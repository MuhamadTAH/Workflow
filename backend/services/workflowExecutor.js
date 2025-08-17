/*
=================================================================
BACKEND FILE: services/workflowExecutor.js 
=================================================================
This service handles automatic execution of complete workflows when triggered.
Copied from WorkflowNode and adapted for main backend.
*/

const aiAgentNode = require('../nodes/actions/aiAgentNode');
const modelNode = require('../nodes/actions/modelNode');
const googleDocsNode = require('../nodes/actions/googleDocsNode');
const DataStorageNode = require('../nodes/actions/dataStorageNode');
const telegramSendMessageNode = require('../nodes/actions/telegramSendMessageNode');
const ChatTriggerResponseNode = require('../nodes/ChatTriggerResponseNode');
const MultiLanguageChatResponseNode = require('../nodes/MultiLanguageChatResponseNode');

class WorkflowExecutor {
    constructor() {
        this.activeWorkflows = new Map(); // Store active workflow configurations
        this.executionHistory = new Map(); // Store execution history for debugging
    }

    // Register a workflow for automatic execution
    registerWorkflow(workflowId, workflowConfig, options = {}) {
        const { credentials = {}, dryRun = false } = options;
        console.log(`Registering workflow ${workflowId} for automatic execution${dryRun ? ' (DRY RUN MODE)' : ''}`);
        console.log('Workflow config received:', {
            nodes: workflowConfig.nodes?.length || 0,
            edges: workflowConfig.edges?.length || 0,
            nodeTypes: workflowConfig.nodes?.map(n => `${n.data.type} (${n.id})`) || [],
            edgeConnections: workflowConfig.edges?.map(e => `${e.source} → ${e.target}`) || []
        });
        
        // Validate workflow structure
        if (!workflowConfig.nodes || !workflowConfig.edges) {
            throw new Error('Workflow must contain nodes and edges');
        }

        // Find trigger node (various types)
        const triggerNode = workflowConfig.nodes.find(node => 
            node.data.type === 'trigger' || 
            node.data.type === 'telegramTrigger' ||
            node.data.type === 'chatTrigger'
        );
        if (!triggerNode) {
            throw new Error('Workflow must contain a trigger node (trigger, telegramTrigger, or chatTrigger)');
        }

        console.log(`Found trigger node: ${triggerNode.data.label || triggerNode.data.type} (${triggerNode.id})`);

        // Store workflow configuration with credentials
        this.activeWorkflows.set(workflowId, {
            ...workflowConfig,
            triggerNodeId: triggerNode.id,
            credentials: credentials, // Store credentials for trigger access
            isActive: true,
            registeredAt: new Date().toISOString(),
            dryRun: dryRun
        });

        console.log(`Workflow ${workflowId} registered successfully with ${workflowConfig.nodes.length} nodes and ${workflowConfig.edges.length} edges`);
        return true;
    }

    // Get workflow credentials (for webhook processing)
    getWorkflowCredentials(workflowId) {
        const workflow = this.activeWorkflows.get(workflowId);
        return workflow ? workflow.credentials : null;
    }

    // Deactivate a workflow
    deactivateWorkflow(workflowId) {
        if (this.activeWorkflows.has(workflowId)) {
            const workflow = this.activeWorkflows.get(workflowId);
            workflow.isActive = false;
            workflow.deactivatedAt = new Date().toISOString();
            console.log(`Workflow ${workflowId} deactivated`);
            return true;
        }
        return false;
    }

    // Execute a complete workflow when triggered
    async executeWorkflow(workflowId, triggerData) {
        const workflow = this.activeWorkflows.get(workflowId);
        const isDryRun = workflow?.dryRun || false;
        
        console.log(`\n=== EXECUTING WORKFLOW ${workflowId}${isDryRun ? ' (DRY RUN)' : ''} ===`);
        console.log('Trigger data:', JSON.stringify(triggerData, null, 2));

        if (!workflow || !workflow.isActive) {
            throw new Error(`Workflow ${workflowId} is not active`);
        }

        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const executionLog = {
            workflowId,
            executionId,
            startTime: new Date().toISOString(),
            steps: [],
            triggerData,
            dryRun: isDryRun
        };

        try {
            // Build execution order from workflow graph
            const executionOrder = this.buildExecutionOrder(workflow);
            console.log('Execution order:', executionOrder.map(step => `${step.node.data.label || step.node.data.type} (${step.node.id})`));

            let currentData = triggerData;
            let originalTriggerData = triggerData;
            let stepData = {}; // Track all step outputs for template processing

            // Execute each node in order
            for (let i = 0; i < executionOrder.length; i++) {
                const step = executionOrder[i];
                const node = step.node;
                
                console.log(`\n--- Step ${i + 1}: Executing ${node.data.label || node.data.type} ---`);
                
                const stepLog = {
                    step: i + 1,
                    nodeId: node.id,
                    nodeType: node.data.type,
                    nodeLabel: node.data.label || node.data.type,
                    startTime: new Date().toISOString(),
                    inputData: currentData
                };

                try {
                    // Skip trigger node (already executed)
                    if (node.data.type === 'trigger' || node.data.type === 'telegramTrigger' || node.data.type === 'chatTrigger') {
                        stepLog.outputData = currentData;
                        stepLog.status = 'skipped';
                        stepLog.message = 'Trigger node - using trigger data';
                        
                        // For trigger nodes, we need to extract the actual message data
                        if (Array.isArray(currentData) && currentData[0] && currentData[0].json) {
                            currentData = currentData[0].json; // Extract the actual message object
                            originalTriggerData = currentData;
                            console.log('Extracted trigger message data:', JSON.stringify(currentData, null, 2));
                        }
                        
                        // Add trigger data to step tracking with enhanced naming
                        const triggerStepName = (node.data.label || node.data.type || 'Trigger').replace(/ /g, '_');
                        const stepKey = `step_${i + 1}_${triggerStepName}`;
                        stepData[stepKey] = currentData;
                        
                        // Also add common aliases for easier template access
                        stepData['trigger'] = currentData;
                        stepData['triggerData'] = currentData;
                        if (node.data.type === 'telegramTrigger') {
                            stepData['telegram'] = currentData;
                        } else if (node.data.type === 'chatTrigger') {
                            stepData['chat'] = currentData;
                        }
                        
                        console.log(`✅ Added trigger step: ${stepKey} with aliases: trigger, triggerData, ${node.data.type}`);
                    } else {
                        // Create step-based input data that matches frontend expectations
                        const stepBasedInputData = { ...stepData }; // Include all previous step data
                        
                        console.log('Step-based input data for node:', JSON.stringify(stepBasedInputData, null, 2));
                        
                        let result;
                        
                        // In dry run mode, simulate execution for external action nodes
                        if (isDryRun && this.shouldSimulateInDryRun(node.data.type)) {
                            console.log(`🧪 DRY RUN: Simulating execution for ${node.data.type} node`);
                            result = this.createDryRunResult(node, stepBasedInputData);
                        } else {
                            // Execute the node normally (or dry run mode for trigger/logic nodes)
                            result = await this.executeNode(node, stepBasedInputData, workflow);
                        }
                        
                        // Check for execution errors
                        if (result && result.success === false && result.error) {
                            console.error(`🚨 Node execution failed in workflow:`, result.error);
                            
                            // Update execution log with error details
                            executionLog.status = 'failed';
                            executionLog.error = result.error;
                            executionLog.failedNode = {
                                id: node.id,
                                type: node.data.type,
                                label: node.data.label || node.data.type
                            };
                            
                            // Decide whether to continue or stop workflow execution
                            const shouldContinue = this.shouldContinueAfterError(node.data, result.error);
                            
                            if (!shouldContinue) {
                                console.error(`🛑 Stopping workflow execution due to critical error`);
                                throw new Error(`Workflow stopped: ${result.error.message}`);
                            } else {
                                console.warn(`⚠️ Continuing workflow execution despite node error`);
                                // Use empty result to continue workflow
                                currentData = { success: false, error: result.error, outputData: null };
                            }
                        } else {
                            currentData = result; // Use output as input for next node
                        }
                        
                        // Add this node's output to step tracking with enhanced naming
                        const nodeStepName = (node.data.label || `${node.data.type}_${node.id.slice(-4)}`).replace(/ /g, '_');
                        const stepKey = `step_${i + 1}_${nodeStepName}`;
                        stepData[stepKey] = result;
                        
                        // Add type-based aliases for easier template access
                        stepData[node.data.type] = result;
                        if (node.data.type === 'aiAgent') {
                            stepData['ai'] = result;
                            stepData['response'] = result.response || result;
                        } else if (node.data.type === 'telegramSendMessage') {
                            stepData['sentMessage'] = result;
                        } else if (node.data.type === 'dataStorage') {
                            stepData['storage'] = result;
                            stepData['data'] = result;
                        }
                        
                        console.log(`✅ Added node step: ${stepKey} with type alias: ${node.data.type}`);
                        
                        stepLog.outputData = result;
                        stepLog.status = 'success';
                    }
                } catch (error) {
                    console.error(`Error executing node ${node.id}:`, error.message);
                    stepLog.status = 'error';
                    stepLog.error = error.message;
                    stepLog.outputData = { error: error.message };
                    
                    // Continue execution with error data (some nodes might handle errors)
                    currentData = { error: error.message, previousData: currentData };
                }

                stepLog.endTime = new Date().toISOString();
                stepLog.duration = new Date(stepLog.endTime) - new Date(stepLog.startTime) + 'ms';
                executionLog.steps.push(stepLog);

                console.log(`Step ${i + 1} completed:`, stepLog.status === 'success' ? '✅' : stepLog.status === 'error' ? '❌' : '⏭️');
            }

            executionLog.endTime = new Date().toISOString();
            executionLog.status = 'completed';
            executionLog.finalOutput = currentData;
            
            console.log(`\n=== WORKFLOW ${workflowId} COMPLETED ===`);
            console.log(`Total steps: ${executionLog.steps.length}`);
            console.log(`Duration: ${new Date(executionLog.endTime) - new Date(executionLog.startTime)}ms`);

            // Store execution history
            if (!this.executionHistory.has(workflowId)) {
                this.executionHistory.set(workflowId, []);
            }
            this.executionHistory.get(workflowId).push(executionLog);

            // Keep only last 10 executions per workflow
            const history = this.executionHistory.get(workflowId);
            if (history.length > 10) {
                history.splice(0, history.length - 10);
            }

            return executionLog;

        } catch (error) {
            console.error(`Workflow execution failed:`, error.message);
            executionLog.endTime = new Date().toISOString();
            executionLog.status = 'failed';
            executionLog.error = {
                message: error.message,
                type: error.constructor.name,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
            
            // Store detailed execution log
            if (!this.executionHistory.has(workflowId)) {
                this.executionHistory.set(workflowId, []);
            }
            this.executionHistory.get(workflowId).push(executionLog);
            
            // Log workflow-level error
            this.logWorkflowError(workflowId, error, executionLog);

            throw error;
        }
    }

    // Build execution order from workflow graph
    buildExecutionOrder(workflow) {
        const { nodes, edges } = workflow;
        const executionOrder = [];
        const visited = new Set();
        
        console.log('Building execution order from workflow:', {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            nodes: nodes.map(n => `${n.data.type} (${n.id})`),
            edges: edges.map(e => `${e.source} → ${e.target}`)
        });
        
        // Find trigger node (starting point)
        const triggerNode = nodes.find(node => 
            node.data.type === 'trigger' || 
            node.data.type === 'telegramTrigger' ||
            node.data.type === 'chatTrigger'
        );
        if (!triggerNode) {
            throw new Error('No trigger node found in workflow');
        }

        console.log(`Starting execution order with trigger: ${triggerNode.id}`);

        // Recursive function to build execution order
        const addToOrder = (nodeId) => {
            console.log(`Processing node: ${nodeId}`);
            if (visited.has(nodeId)) {
                console.log(`Node ${nodeId} already visited, skipping`);
                return;
            }
            visited.add(nodeId);

            const node = nodes.find(n => n.id === nodeId);
            if (!node) {
                console.log(`Node ${nodeId} not found in nodes array`);
                return;
            }

            console.log(`Adding node to execution order: ${node.data.type} (${node.id})`);
            executionOrder.push({
                node,
                inputEdges: edges.filter(edge => edge.target === nodeId)
            });

            // Find and add connected nodes
            const outgoingEdges = edges.filter(edge => edge.source === nodeId);
            console.log(`Found ${outgoingEdges.length} outgoing edges from ${nodeId}:`, outgoingEdges.map(e => `${e.source} → ${e.target}`));
            
            for (const edge of outgoingEdges) {
                console.log(`Following edge: ${edge.source} → ${edge.target}`);
                addToOrder(edge.target);
            }
        };

        addToOrder(triggerNode.id);
        
        console.log(`Final execution order: ${executionOrder.length} nodes`);
        executionOrder.forEach((step, i) => {
            console.log(`Step ${i + 1}: ${step.node.data.type} (${step.node.id})`);
        });
        
        return executionOrder;
    }

    // Execute a single node with error handling and retries
    async executeNode(node, inputData, workflow, retryCount = 0) {
        const nodeConfig = node.data;
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second base delay
        
        console.log(`🔧 Executing node: ${nodeConfig.type} (${node.id}) [Attempt ${retryCount + 1}/${maxRetries + 1}]`);
        console.log(`📋 Raw ConfigPanel data:`, JSON.stringify(nodeConfig, null, 2));

        try {
            // Find connected Data Storage nodes if this is an AI Agent
            let connectedNodes = [];
            if (nodeConfig.type === 'aiAgent') {
                const incomingEdges = workflow.edges.filter(edge => edge.target === node.id);
                for (const edge of incomingEdges) {
                    const sourceNode = workflow.nodes.find(n => n.id === edge.source);
                    if (sourceNode && sourceNode.data.type === 'dataStorage') {
                        connectedNodes.push({
                            type: 'dataStorage',
                            data: sourceNode.data.storedData || {},
                            nodeId: sourceNode.id
                        });
                    }
                }
            }

            // ENHANCED: Resolve templates in nodeConfig for ALL node types
            console.log(`🔍 Resolving templates for ${nodeConfig.type} node...`);
            const resolvedConfig = this.resolveNodeTemplates(nodeConfig, inputData, workflow);
            console.log(`✨ Resolved ConfigPanel data:`, JSON.stringify(resolvedConfig, null, 2));

            // Execute based on node type
            return await this.executeNodeByType(nodeConfig, resolvedConfig, inputData, connectedNodes);
            
        } catch (error) {
            console.error(`❌ Node execution failed: ${nodeConfig.type} (${node.id})`);
            console.error(`❌ Error details:`, error.message);
            console.error(`❌ Stack trace:`, error.stack);
            
            // Determine if error is retryable
            const isRetryable = this.isRetryableError(error);
            
            if (isRetryable && retryCount < maxRetries) {
                const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff
                console.log(`🔄 Retrying node execution in ${delay}ms... (${retryCount + 1}/${maxRetries})`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return await this.executeNode(node, inputData, workflow, retryCount + 1);
            } else {
                console.error(`💥 Node execution failed permanently after ${retryCount + 1} attempts`);
                
                // Create error result with detailed information
                const errorResult = {
                    success: false,
                    error: {
                        message: error.message,
                        type: error.constructor.name,
                        code: error.code || 'EXECUTION_ERROR',
                        retryCount: retryCount + 1,
                        isRetryable: isRetryable,
                        timestamp: new Date().toISOString(),
                        nodeId: node.id,
                        nodeType: nodeConfig.type,
                        nodeLabel: nodeConfig.label || nodeConfig.type
                    },
                    outputData: null
                };
                
                // Log structured error for monitoring
                this.logNodeError(nodeConfig, error, retryCount + 1);
                
                return errorResult;
            }
        }
    }
    
    // Execute node by type with enhanced error handling
    async executeNodeByType(nodeConfig, resolvedConfig, inputData, connectedNodes) {
        switch (nodeConfig.type) {
            case 'aiAgent':
                return await aiAgentNode.execute(resolvedConfig, inputData, connectedNodes);
            
            case 'modelNode':
                return await modelNode.execute(resolvedConfig, inputData);
            
            case 'googleDocs':
                return await googleDocsNode.execute(resolvedConfig, inputData);
            
            case 'dataStorage':
                const dataStorageInstance = new DataStorageNode(resolvedConfig);
                return await dataStorageInstance.process(inputData);
            
            case 'telegramSendMessage':
                return await telegramSendMessageNode.execute(resolvedConfig, inputData, connectedNodes);
            
            case 'chatTriggerResponse':
                const chatResponseInstance = new ChatTriggerResponseNode();
                
                // Filter config to only include Chat Trigger Response specific fields
                const cleanConfig = {
                    type: resolvedConfig.type,
                    sessionId: resolvedConfig.sessionId,
                    message: resolvedConfig.message,
                    chatTitle: resolvedConfig.chatTitle,
                    webhookPath: resolvedConfig.webhookPath
                };
                console.log('🧹 BEFORE CLEANING - Full resolved config contains', Object.keys(resolvedConfig).length, 'fields');
                console.log('✨ AFTER CLEANING - Clean config:', JSON.stringify(cleanConfig, null, 2));
                return await chatResponseInstance.execute(cleanConfig, inputData);
            
            case 'multiLanguageChatResponse':
                const multiLangResponseInstance = new MultiLanguageChatResponseNode();
                console.log('🌍 Multi-Language Chat Response resolved config:', JSON.stringify(resolvedConfig, null, 2));
                return await multiLangResponseInstance.execute(resolvedConfig, inputData);
            
            default:
                throw new Error(`Unsupported node type: ${nodeConfig.type}`);
        }
    }
    
    // Determine if an error is retryable
    isRetryableError(error) {
        // Network-related errors are usually retryable
        const retryableErrors = [
            'ECONNRESET',
            'ECONNREFUSED', 
            'ETIMEDOUT',
            'ENOTFOUND',
            'NETWORK_ERROR',
            'FETCH_ERROR',
            'TIMEOUT',
            'SERVICE_UNAVAILABLE'
        ];
        
        // HTTP status codes that are retryable
        const retryableHttpCodes = [408, 429, 500, 502, 503, 504];
        
        // Check error code
        if (error.code && retryableErrors.includes(error.code)) {
            return true;
        }
        
        // Check HTTP status
        if (error.response && retryableHttpCodes.includes(error.response.status)) {
            return true;
        }
        
        // Check error message for common network issues
        const errorMessage = error.message.toLowerCase();
        const retryableMessages = [
            'network error',
            'connection timeout',
            'request timeout',
            'socket hang up',
            'connect timeout',
            'read timeout',
            'service unavailable',
            'temporary failure',
            'rate limit'
        ];
        
        return retryableMessages.some(msg => errorMessage.includes(msg));
    }
    
    // Log structured error information
    logNodeError(nodeConfig, error, attemptCount) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            nodeId: nodeConfig.id,
            nodeType: nodeConfig.type,
            nodeLabel: nodeConfig.label || nodeConfig.type,
            errorType: error.constructor.name,
            errorMessage: error.message,
            errorCode: error.code,
            httpStatus: error.response?.status,
            attemptCount: attemptCount,
            isRetryable: this.isRetryableError(error),
            stackTrace: error.stack
        };
        
        console.error('📊 STRUCTURED ERROR LOG:', JSON.stringify(errorLog, null, 2));
        
        // In production, this could be sent to logging service
        // logger.error('Node execution failed', errorLog);
    }
    
    // Determine if workflow should continue after a node error
    shouldContinueAfterError(nodeConfig, error) {
        // Critical node types that should stop workflow on error
        const criticalNodeTypes = [
            'trigger',
            'telegramTrigger', 
            'chatTrigger'
        ];
        
        // If it's a critical node, stop execution
        if (criticalNodeTypes.includes(nodeConfig.type)) {
            return false;
        }
        
        // Configuration errors should usually stop execution
        const criticalErrors = [
            'INVALID_CONFIG',
            'MISSING_REQUIRED_FIELD',
            'AUTHENTICATION_ERROR',
            'PERMISSION_DENIED'
        ];
        
        if (error.code && criticalErrors.includes(error.code)) {
            return false;
        }
        
        // For other errors, continue execution
        return true;
    }
    
    // Log workflow-level errors
    logWorkflowError(workflowId, error, executionLog) {
        const workflowErrorLog = {
            timestamp: new Date().toISOString(),
            workflowId: workflowId,
            errorType: error.constructor.name,
            errorMessage: error.message,
            executionId: executionLog.executionId,
            totalSteps: executionLog.totalSteps,
            completedSteps: executionLog.completedSteps,
            failedNode: executionLog.failedNode,
            executionTime: new Date(executionLog.endTime) - new Date(executionLog.startTime),
            stackTrace: error.stack
        };
        
        console.error('🔥 WORKFLOW ERROR LOG:', JSON.stringify(workflowErrorLog, null, 2));
        
        // In production, send to monitoring service
        // logger.error('Workflow execution failed', workflowErrorLog);
    }

    // Get workflow status
    getWorkflowStatus(workflowId) {
        const workflow = this.activeWorkflows.get(workflowId);
        const history = this.executionHistory.get(workflowId) || [];
        
        return {
            isRegistered: !!workflow,
            isActive: workflow?.isActive || false,
            registeredAt: workflow?.registeredAt,
            deactivatedAt: workflow?.deactivatedAt,
            totalExecutions: history.length,
            lastExecution: history[history.length - 1]?.startTime,
            lastExecutionStatus: history[history.length - 1]?.status
        };
    }

    // Get execution history
    getExecutionHistory(workflowId, limit = 5) {
        const history = this.executionHistory.get(workflowId) || [];
        return history.slice(-limit).reverse(); // Return most recent first
    }
    
    // Get failed executions for replay
    getFailedExecutions(workflowId) {
        const history = this.executionHistory.get(workflowId) || [];
        return history.filter(execution => execution.status === 'failed').reverse();
    }
    
    // Replay a failed execution
    async replayFailedExecution(workflowId, executionId, options = {}) {
        console.log(`🔄 REPLAY: Starting replay of failed execution ${executionId} for workflow ${workflowId}`);
        
        // Find the failed execution
        const history = this.executionHistory.get(workflowId) || [];
        const failedExecution = history.find(exec => exec.executionId === executionId);
        
        if (!failedExecution) {
            throw new Error(`Failed execution ${executionId} not found for workflow ${workflowId}`);
        }
        
        if (failedExecution.status !== 'failed') {
            throw new Error(`Execution ${executionId} is not in failed state (status: ${failedExecution.status})`);
        }
        
        // Check if workflow is still active
        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow || !workflow.isActive) {
            throw new Error(`Workflow ${workflowId} is not active and cannot be replayed`);
        }
        
        console.log(`🔄 REPLAY: Found failed execution from ${failedExecution.startTime}`);
        console.log(`🔄 REPLAY: Failed at step ${failedExecution.completedSteps || 0} with error:`, failedExecution.error);
        
        // Determine replay strategy
        const { 
            fromFailedStep = false,  // If true, start from failed step; if false, start from beginning
            useOriginalData = true,  // Use original trigger data vs allow new data
            fixNodeConfigs = {}      // Object with nodeId -> new config for fixing issues
        } = options;
        
        let triggerData = failedExecution.triggerData;
        
        // Allow override of trigger data for replay
        if (!useOriginalData && options.newTriggerData) {
            triggerData = options.newTriggerData;
            console.log(`🔄 REPLAY: Using new trigger data instead of original`);
        }
        
        // Apply any node configuration fixes
        if (Object.keys(fixNodeConfigs).length > 0) {
            console.log(`🔄 REPLAY: Applying configuration fixes to ${Object.keys(fixNodeConfigs).length} nodes`);
            
            // Temporarily update node configurations
            const originalConfigs = {};
            
            for (const [nodeId, newConfig] of Object.entries(fixNodeConfigs)) {
                const node = workflow.nodes.find(n => n.id === nodeId);
                if (node) {
                    originalConfigs[nodeId] = { ...node.data };
                    Object.assign(node.data, newConfig);
                    console.log(`🔄 REPLAY: Updated config for node ${nodeId}`);
                }
            }
            
            try {
                // Execute with fixed configurations
                const replayResult = await this.executeWorkflowReplay(
                    workflowId, 
                    triggerData, 
                    failedExecution,
                    { fromFailedStep }
                );
                
                // Restore original configurations
                for (const [nodeId, originalConfig] of Object.entries(originalConfigs)) {
                    const node = workflow.nodes.find(n => n.id === nodeId);
                    if (node) {
                        node.data = originalConfig;
                    }
                }
                
                return replayResult;
                
            } catch (error) {
                // Restore original configurations on error
                for (const [nodeId, originalConfig] of Object.entries(originalConfigs)) {
                    const node = workflow.nodes.find(n => n.id === nodeId);
                    if (node) {
                        node.data = originalConfig;
                    }
                }
                throw error;
            }
        } else {
            // Execute replay without configuration changes
            return await this.executeWorkflowReplay(
                workflowId, 
                triggerData, 
                failedExecution,
                { fromFailedStep }
            );
        }
    }
    
    // Execute workflow replay with special handling
    async executeWorkflowReplay(workflowId, triggerData, originalExecution, options = {}) {
        const { fromFailedStep = false } = options;
        const workflow = this.activeWorkflows.get(workflowId);
        
        if (!workflow || !workflow.isActive) {
            throw new Error(`Workflow ${workflowId} is not active`);
        }

        const replayExecutionId = `replay_${originalExecution.executionId}_${Date.now()}`;
        const executionLog = {
            workflowId,
            executionId: replayExecutionId,
            originalExecutionId: originalExecution.executionId,
            startTime: new Date().toISOString(),
            steps: [],
            triggerData,
            isReplay: true,
            replayStrategy: fromFailedStep ? 'from_failed_step' : 'from_beginning'
        };

        console.log(`🔄 REPLAY: Starting execution ${replayExecutionId} (strategy: ${executionLog.replayStrategy})`);

        try {
            // Build execution order from workflow graph
            const executionOrder = this.buildExecutionOrder(workflow);
            
            let startStep = 0;
            let currentData = triggerData;
            let stepData = {};

            // If replaying from failed step, restore previous step data
            if (fromFailedStep && originalExecution.steps) {
                console.log(`🔄 REPLAY: Restoring data from ${originalExecution.steps.length} previous steps`);
                
                // Find the last successful step
                const lastSuccessfulStep = originalExecution.steps
                    .filter(step => step.success !== false)
                    .pop();
                
                if (lastSuccessfulStep) {
                    startStep = lastSuccessfulStep.step;
                    
                    // Restore step data up to the failed step
                    for (const step of originalExecution.steps) {
                        if (step.success !== false && step.outputData) {
                            stepData[step.stepKey] = step.outputData;
                            // Add aliases
                            if (step.nodeType) {
                                stepData[step.nodeType] = step.outputData;
                            }
                        }
                    }
                    
                    console.log(`🔄 REPLAY: Starting from step ${startStep + 1}, restored ${Object.keys(stepData).length} step data entries`);
                }
            }

            // Execute each node in order (starting from appropriate step)
            for (let i = startStep; i < executionOrder.length; i++) {
                const step = executionOrder[i];
                const node = step.node;
                
                console.log(`\n🔄 REPLAY Step ${i + 1}: Executing ${node.data.label || node.data.type} ---`);
                
                // Skip trigger nodes if replaying from failed step (already have their data)
                if (fromFailedStep && i < startStep && (
                    node.data.type === 'trigger' || 
                    node.data.type === 'telegramTrigger' || 
                    node.data.type === 'chatTrigger'
                )) {
                    console.log(`🔄 REPLAY: Skipping trigger node ${node.data.type} (using restored data)`);
                    continue;
                }

                const stepBasedInputData = { ...stepData };
                
                let result;
                try {
                    result = await this.executeNode(node, stepBasedInputData, workflow);
                    
                    if (result && result.success === false && result.error) {
                        console.error(`🔄 REPLAY: Node execution failed again:`, result.error);
                        throw new Error(`Replay failed at same node: ${result.error.message}`);
                    }
                    
                    currentData = result;
                    
                    // Add step tracking
                    const nodeStepName = (node.data.label || `${node.data.type}_${node.id.slice(-4)}`).replace(/ /g, '_');
                    const stepKey = `step_${i + 1}_${nodeStepName}`;
                    stepData[stepKey] = result;
                    stepData[node.data.type] = result;
                    
                    executionLog.steps.push({
                        step: i + 1,
                        nodeId: node.id,
                        nodeType: node.data.type,
                        nodeLabel: node.data.label || node.data.type,
                        success: true,
                        outputData: result,
                        stepKey: stepKey,
                        executedAt: new Date().toISOString()
                    });
                    
                    console.log(`🔄 REPLAY: Step ${i + 1} completed successfully`);
                    
                } catch (error) {
                    console.error(`🔄 REPLAY: Step ${i + 1} failed:`, error.message);
                    
                    executionLog.steps.push({
                        step: i + 1,
                        nodeId: node.id,
                        nodeType: node.data.type,
                        nodeLabel: node.data.label || node.data.type,
                        success: false,
                        error: error.message,
                        executedAt: new Date().toISOString()
                    });
                    
                    throw error;
                }
            }

            // Mark execution as completed
            executionLog.endTime = new Date().toISOString();
            executionLog.status = 'completed';
            executionLog.completedSteps = executionOrder.length;
            executionLog.totalSteps = executionOrder.length;

            // Store execution history
            if (!this.executionHistory.has(workflowId)) {
                this.executionHistory.set(workflowId, []);
            }
            this.executionHistory.get(workflowId).push(executionLog);

            console.log(`🔄 REPLAY: Execution ${replayExecutionId} completed successfully`);
            console.log(`🔄 REPLAY: Total steps: ${executionOrder.length}, Duration: ${new Date(executionLog.endTime) - new Date(executionLog.startTime)}ms`);

            return executionLog;

        } catch (error) {
            console.error(`🔄 REPLAY: Execution failed:`, error.message);
            executionLog.endTime = new Date().toISOString();
            executionLog.status = 'failed';
            executionLog.error = {
                message: error.message,
                type: error.constructor.name,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
            
            // Store failed replay execution
            if (!this.executionHistory.has(workflowId)) {
                this.executionHistory.set(workflowId, []);
            }
            this.executionHistory.get(workflowId).push(executionLog);
            
            throw error;
        }
    }

    // Get node prefix for template access
    getNodePrefix(nodeType) {
        const prefixMap = {
            'trigger': 'telegram',
            'aiAgent': 'aiAgent',
            'modelNode': 'model',
            'googleDocs': 'googleDocs',
            'dataStorage': 'storage',
            'telegramSendMessage': 'telegramSendMessage',
        };
        return prefixMap[nodeType] || null;
    }

    // Resolve template expressions in node configuration
    resolveNodeTemplates(nodeConfig, inputData, workflow) {
        const resolved = JSON.parse(JSON.stringify(nodeConfig)); // Deep clone
        
        // Build enhanced context with all available node data
        const context = {
            ...inputData, // Contains step data and node outputs
            $json: inputData, // Legacy compatibility
            $input: inputData, // Alternative access pattern
            // Add direct field access for common patterns
            message: inputData.message || {},
            text: inputData.text || '',
            data: inputData
        };

        console.log('🔍 Enhanced template resolution context:');
        console.log('  - Available step keys:', Object.keys(inputData).filter(k => k.startsWith('step_')));
        console.log('  - Total context keys:', Object.keys(context).length);
        console.log('  - Sample context:', JSON.stringify(context, null, 2).substring(0, 500) + '...');

        // Recursively resolve all string values in the config
        const resolveValue = (value) => {
            if (typeof value === 'string') {
                return this.resolveTemplate(value, context);
            } else if (Array.isArray(value)) {
                return value.map(resolveValue);
            } else if (value && typeof value === 'object') {
                const resolvedObj = {};
                for (const [key, val] of Object.entries(value)) {
                    resolvedObj[key] = resolveValue(val);
                }
                return resolvedObj;
            }
            return value;
        };

        // Apply resolution to all config properties
        for (const [key, value] of Object.entries(resolved)) {
            resolved[key] = resolveValue(value);
        }

        return resolved;
    }

    // Enhanced template resolver that handles multiple syntax patterns
    resolveTemplate(template, context) {
        if (!template || typeof template !== 'string') {
            return template;
        }

        let resolved = template;

        // 1. Handle simple field access: {{ message.text }}, {{ text }}, {{ data.field }}
        resolved = resolved.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*\}\}/g, (match, path) => {
            try {
                console.log(`🔍 Resolving simple template: ${match} (path: ${path})`);
                const value = this.getNestedValue(context, path);
                if (value !== undefined) {
                    console.log(`✅ Simple template resolved: ${match} → ${value}`);
                    return value;
                }
                console.log(`❌ Simple template not found: ${match}`);
                return match;
            } catch (error) {
                console.error(`Error resolving simple template ${match}:`, error.message);
                return match;
            }
        });

        // 2. Handle $node["NodeName"].path syntax
        resolved = resolved.replace(/\{\{\s*\$node\["([^"]+)"\]\.([^}]+)\s*\}\}/g, (match, nodeName, path) => {
            try {
                console.log(`🔧 Resolving template: ${match} (looking for node: ${nodeName})`);
                
                // Look for step data that matches the node name
                for (const [stepKey, stepValue] of Object.entries(context)) {
                    if (stepKey.includes(nodeName.replace(/ /g, '_')) || stepKey.includes('Chat_Trigger') || stepKey.includes('Telegram_Trigger')) {
                        console.log(`📍 Found matching step: ${stepKey}`, JSON.stringify(stepValue, null, 2));
                        
                        // Special handling for Telegram Trigger nodes
                        if (nodeName === 'Telegram Trigger' || stepKey.includes('Telegram_Trigger')) {
                            console.log(`🔍 Telegram Trigger special handling - nodeName: "${nodeName}", stepKey: "${stepKey}", path: "${path}"`);
                            
                            // For Telegram Trigger, map common template paths to actual data structure
                            if (path === 'json.0.message.text' && stepValue.message?.text) {
                                console.log(`✅ Template resolved (Telegram text): ${match} → ${stepValue.message.text}`);
                                return stepValue.message.text;
                            }
                            if (path === 'json.0.message.text' && stepValue.telegram?.text) {
                                console.log(`✅ Template resolved (Telegram text alt): ${match} → ${stepValue.telegram.text}`);
                                return stepValue.telegram.text;
                            }
                            if (path === 'json.0.message.from.id' && stepValue.telegram?.chatId) {
                                console.log(`✅ Template resolved (Telegram chatId): ${match} → ${stepValue.telegram.chatId}`);
                                return stepValue.telegram.chatId;
                            }
                            if (path === 'json.0.message.from.id' && stepValue.telegram?.from?.id) {
                                console.log(`✅ Template resolved (Telegram from.id): ${match} → ${stepValue.telegram.from.id}`);
                                return stepValue.telegram.from.id;
                            }
                            if (path === 'json.0.message.chat.id' && stepValue.telegram?.chatId) {
                                console.log(`✅ Template resolved (Telegram chat.id): ${match} → ${stepValue.telegram.chatId}`);
                                return stepValue.telegram.chatId;
                            }
                            
                            // Try accessing raw telegram data
                            if (stepValue.raw?.message) {
                                if (path === 'json.0.message.text' && stepValue.raw.message.text) {
                                    console.log(`✅ Template resolved (Raw text): ${match} → ${stepValue.raw.message.text}`);
                                    return stepValue.raw.message.text;
                                }
                                if (path === 'json.0.message.from.id' && stepValue.raw.message.from?.id) {
                                    console.log(`✅ Template resolved (Raw from.id): ${match} → ${stepValue.raw.message.from.id}`);
                                    return stepValue.raw.message.from.id;
                                }
                                if (path === 'json.0.message.chat.id' && stepValue.raw.message.chat?.id) {
                                    console.log(`✅ Template resolved (Raw chat.id): ${match} → ${stepValue.raw.message.chat.id}`);
                                    return stepValue.raw.message.chat.id;
                                }
                            }
                        }
                        
                        // Special handling for Chat Trigger nodes - they have flat data structure
                        if (nodeName === 'Chat Trigger' || stepKey.includes('Chat_Trigger')) {
                            console.log(`🔍 Chat Trigger special handling - nodeName: "${nodeName}", stepKey: "${stepKey}", path: "${path}"`);
                            console.log(`🔍 stepValue.sessionId: "${stepValue.sessionId}", stepValue.text: "${stepValue.text}"`);
                            
                            // For Chat Trigger, map common template paths to actual data structure
                            if (path === 'json.result.data[0].sessionId' && stepValue.sessionId) {
                                console.log(`✅ Template resolved (Chat Trigger sessionId): ${match} → ${stepValue.sessionId}`);
                                return stepValue.sessionId;
                            }
                            if (path === 'json.result.data[0].text' && stepValue.text) {
                                console.log(`✅ Template resolved (Chat Trigger text): ${match} → ${stepValue.text}`);
                                return stepValue.text;
                            }
                            if (path === 'json.result.data[0].userId' && stepValue.userId) {
                                console.log(`✅ Template resolved (Chat Trigger userId): ${match} → ${stepValue.userId}`);
                                return stepValue.userId;
                            }
                            // For other Chat Trigger fields, try direct access
                            const simplePath = path.split('.').pop(); // Get last part (e.g., "sessionId")
                            console.log(`🔍 Trying direct access with simplePath: "${simplePath}"`);
                            if (stepValue[simplePath]) {
                                console.log(`✅ Template resolved (Chat Trigger direct): ${match} → ${stepValue[simplePath]}`);
                                return stepValue[simplePath];
                            }
                        }
                        
                        // Special handling for AI Agent nodes
                        if (nodeName === 'AI Agent' || stepKey.includes('AI_Agent')) {
                            console.log(`🔍 AI Agent special handling - nodeName: "${nodeName}", stepKey: "${stepKey}", path: "${path}"`);
                            
                            // For AI Agent, map common template paths to actual data structure
                            if (path === 'json.result.response' && stepValue.response) {
                                console.log(`✅ Template resolved (AI Agent response): ${match} → ${stepValue.response}`);
                                return stepValue.response;
                            }
                            if (path === 'json.response' && stepValue.response) {
                                console.log(`✅ Template resolved (AI Agent response alt): ${match} → ${stepValue.response}`);
                                return stepValue.response;
                            }
                        }
                        
                        // Navigate the path for other node types (e.g., "json.result.data[0].sessionId")
                        const pathParts = path.split('.');
                        let current = stepValue;
                        
                        for (const part of pathParts) {
                            if (part.includes('[') && part.includes(']')) {
                                // Handle array access like "data[0]"
                                const arrayName = part.split('[')[0];
                                const index = parseInt(part.match(/\[(\d+)\]/)[1]);
                                current = current[arrayName] ? current[arrayName][index] : undefined;
                            } else {
                                current = current ? current[part] : undefined;
                            }
                            
                            if (current === undefined) break;
                        }
                        
                        if (current !== undefined) {
                            console.log(`✅ Template resolved: ${match} → ${current}`);
                            return current;
                        }
                    }
                }
                
                console.log(`❌ Could not resolve template: ${match}`);
                return match; // Return original if not found
            } catch (error) {
                console.error(`Error resolving template ${match}:`, error.message);
                return match;
            }
        });

        return resolved;
    }
    
    // Determine if a node type should be simulated in dry run mode
    shouldSimulateInDryRun(nodeType) {
        // External action nodes that should be simulated
        const externalActionNodes = [
            'telegramSendMessage',
            'chatTriggerResponse',
            'multiLanguageChatResponse',
            'googleDocs',
            'dataStorage' // Can still simulate data storage
        ];
        
        // Trigger nodes should execute normally to test data flow
        const triggerNodes = [
            'trigger',
            'telegramTrigger',
            'chatTrigger'
        ];
        
        return externalActionNodes.includes(nodeType);
    }
    
    // Create a simulated result for dry run mode
    createDryRunResult(node, inputData) {
        const nodeType = node.data.type;
        const nodeLabel = node.data.label || nodeType;
        
        console.log(`🧪 Creating dry run result for ${nodeType}`);
        
        switch (nodeType) {
            case 'telegramSendMessage':
                return {
                    success: true,
                    message: 'DRY RUN: Telegram message would be sent',
                    outputData: {
                        messageId: 'dry_run_message_' + Date.now(),
                        chatId: node.data.chatId || 'dry_run_chat',
                        text: node.data.messageText || 'DRY RUN: Message content',
                        sentAt: new Date().toISOString(),
                        dryRun: true
                    }
                };
                
            case 'chatTriggerResponse':
                return {
                    success: true,
                    message: 'DRY RUN: Chat response would be sent',
                    outputData: {
                        sessionId: node.data.sessionId || 'dry_run_session',
                        message: node.data.message || 'DRY RUN: Chat response',
                        sentAt: new Date().toISOString(),
                        dryRun: true
                    }
                };
                
            case 'multiLanguageChatResponse':
                return {
                    success: true,
                    message: 'DRY RUN: Multi-language chat response would be sent',
                    outputData: {
                        sessionId: node.data.sessionId || 'dry_run_session',
                        message: node.data.message || 'DRY RUN: Multi-language response',
                        language: node.data.language || 'en',
                        sentAt: new Date().toISOString(),
                        dryRun: true
                    }
                };
                
            case 'googleDocs':
                return {
                    success: true,
                    message: 'DRY RUN: Google Docs operation would be performed',
                    outputData: {
                        documentId: 'dry_run_doc_' + Date.now(),
                        operation: node.data.operation || 'read',
                        content: 'DRY RUN: Document content',
                        modifiedAt: new Date().toISOString(),
                        dryRun: true
                    }
                };
                
            case 'dataStorage':
                return {
                    success: true,
                    message: 'DRY RUN: Data would be stored',
                    outputData: {
                        stored: true,
                        data: inputData,
                        storedAt: new Date().toISOString(),
                        dryRun: true
                    }
                };
                
            default:
                return {
                    success: true,
                    message: `DRY RUN: ${nodeLabel} would execute normally`,
                    outputData: {
                        nodeType: nodeType,
                        nodeLabel: nodeLabel,
                        inputData: inputData,
                        simulatedAt: new Date().toISOString(),
                        dryRun: true
                    }
                };
        }
    }

    // Helper method to get nested values from objects using dot notation
    getNestedValue(obj, path) {
        if (!obj || !path) return undefined;
        
        const parts = path.split('.');
        let current = obj;
        
        for (const part of parts) {
            if (current === null || current === undefined) {
                return undefined;
            }
            
            // Handle array access like data[0]
            if (part.includes('[') && part.includes(']')) {
                const arrayName = part.split('[')[0];
                const index = parseInt(part.match(/\[(\d+)\]/)[1]);
                current = current[arrayName] ? current[arrayName][index] : undefined;
            } else {
                current = current[part];
            }
        }
        
        return current;
    }
}

// Create singleton instance
const workflowExecutor = new WorkflowExecutor();

module.exports = workflowExecutor;