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
    registerWorkflow(workflowId, workflowConfig, credentials) {
        console.log(`Registering workflow ${workflowId} for automatic execution`);
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
            registeredAt: new Date().toISOString()
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
        console.log(`\n=== EXECUTING WORKFLOW ${workflowId} ===`);
        console.log('Trigger data:', JSON.stringify(triggerData, null, 2));

        const workflow = this.activeWorkflows.get(workflowId);
        if (!workflow || !workflow.isActive) {
            throw new Error(`Workflow ${workflowId} is not active`);
        }

        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const executionLog = {
            workflowId,
            executionId,
            startTime: new Date().toISOString(),
            steps: [],
            triggerData
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
                        
                        // Add trigger data to step tracking with proper naming
                        const triggerStepName = (node.data.label || 'Telegram_Trigger').replace(/ /g, '_');
                        stepData[`step_${i + 1}_${triggerStepName}`] = currentData;
                        console.log(`Added trigger step: step_${i + 1}_${triggerStepName}`);
                    } else {
                        // Create step-based input data that matches frontend expectations
                        const stepBasedInputData = { ...stepData }; // Include all previous step data
                        
                        console.log('Step-based input data for node:', JSON.stringify(stepBasedInputData, null, 2));
                        
                        // Execute the node
                        const result = await this.executeNode(node, stepBasedInputData, workflow);
                        currentData = result; // Use output as input for next node
                        
                        // Add this node's output to step tracking
                        const nodeStepName = (node.data.label || `${node.data.type}_${node.id.slice(-4)}`).replace(/ /g, '_');
                        stepData[`step_${i + 1}_${nodeStepName}`] = result;
                        console.log(`Added node step: step_${i + 1}_${nodeStepName}`);
                        
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
            executionLog.error = error.message;
            
            if (!this.executionHistory.has(workflowId)) {
                this.executionHistory.set(workflowId, []);
            }
            this.executionHistory.get(workflowId).push(executionLog);

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

    // Execute a single node
    async executeNode(node, inputData, workflow) {
        const nodeConfig = node.data;

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

        // Execute based on node type
        switch (nodeConfig.type) {
            case 'aiAgent':
                return await aiAgentNode.execute(nodeConfig, inputData, connectedNodes);
            
            case 'modelNode':
                return await modelNode.execute(nodeConfig, inputData);
            
            case 'googleDocs':
                return await googleDocsNode.execute(nodeConfig, inputData);
            
            case 'dataStorage':
                const dataStorageInstance = new DataStorageNode(nodeConfig);
                return await dataStorageInstance.process(inputData);
            
            case 'telegramSendMessage':
                return await telegramSendMessageNode.execute(nodeConfig, inputData, connectedNodes);
            
            case 'chatTriggerResponse':
                const chatResponseInstance = new ChatTriggerResponseNode();
                // Resolve templates in nodeConfig before execution
                const resolvedConfig = this.resolveNodeTemplates(nodeConfig, inputData, workflow);
                console.log('🔧 Chat Trigger Response resolved config:', JSON.stringify(resolvedConfig, null, 2));
                return await chatResponseInstance.execute(resolvedConfig, inputData);
            
            case 'multiLanguageChatResponse':
                const multiLangResponseInstance = new MultiLanguageChatResponseNode();
                // Resolve templates in nodeConfig before execution
                const resolvedMultiLangConfig = this.resolveNodeTemplates(nodeConfig, inputData, workflow);
                console.log('🌍 Multi-Language Chat Response resolved config:', JSON.stringify(resolvedMultiLangConfig, null, 2));
                return await multiLangResponseInstance.execute(resolvedMultiLangConfig, inputData);
            
            default:
                throw new Error(`Unsupported node type: ${nodeConfig.type}`);
        }
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
        
        // Build context with all available node data
        const context = {
            ...inputData, // Contains step data and node outputs
            $json: inputData, // Legacy compatibility
        };

        console.log('🔍 Template resolution context:', JSON.stringify(context, null, 2));

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

    // Template resolver that handles $node syntax
    resolveTemplate(template, context) {
        if (!template || typeof template !== 'string') {
            return template;
        }

        // Handle $node["NodeName"].path syntax
        return template.replace(/\{\{\s*\$node\["([^"]+)"\]\.([^}]+)\s*\}\}/g, (match, nodeName, path) => {
            try {
                console.log(`🔧 Resolving template: ${match} (looking for node: ${nodeName})`);
                
                // Look for step data that matches the node name
                for (const [stepKey, stepValue] of Object.entries(context)) {
                    if (stepKey.includes(nodeName.replace(/ /g, '_')) || stepKey.includes('Chat_Trigger')) {
                        console.log(`📍 Found matching step: ${stepKey}`, JSON.stringify(stepValue, null, 2));
                        
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
    }
}

// Create singleton instance
const workflowExecutor = new WorkflowExecutor();

module.exports = workflowExecutor;