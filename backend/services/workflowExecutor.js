/*
=================================================================
BACKEND FILE: services/workflowExecutor.js 
=================================================================
This service handles execution of complete workflows when triggered.
Simplified version without activation - workflows execute on-demand only.
*/

const aiAgentNode = require('../nodes/actions/aiAgentNode');
const modelNode = require('../nodes/actions/modelNode');
const googleDocsNode = require('../nodes/actions/googleDocsNode');
const DataStorageNode = require('../nodes/actions/dataStorageNode');
const telegramSendMessageNode = require('../nodes/actions/telegramSendMessageNode');
const MultiLanguageChatResponseNode = require('../nodes/MultiLanguageChatResponseNode');

class WorkflowExecutor {
    constructor() {
        this.executionHistory = new Map(); // Store execution history for debugging
    }

    // Execute a complete workflow on-demand
    async executeWorkflow(workflowId, workflowConfig, triggerData) {
        console.log(`\n=== EXECUTING WORKFLOW ${workflowId} ===`);
        console.log('Trigger data:', JSON.stringify(triggerData, null, 2));

        // Validate workflow structure
        if (!workflowConfig || !workflowConfig.nodes || !workflowConfig.edges) {
            throw new Error('Workflow must contain nodes and edges');
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
            const executionOrder = this.buildExecutionOrder(workflowConfig);
            console.log('Execution order:', executionOrder.map(node => `${node.data.label || node.data.type} (${node.id})`));

            // Execute nodes in order
            let currentData = triggerData || [{}];
            
            for (let i = 0; i < executionOrder.length; i++) {
                const node = executionOrder[i];
                console.log(`--- Step ${i + 1}: Executing ${node.data.label || node.data.type} ---`);
                
                const stepLog = {
                    stepNumber: i + 1,
                    nodeId: node.id,
                    nodeType: node.data.type,
                    nodeLabel: node.data.label,
                    inputData: currentData,
                    startTime: new Date().toISOString()
                };

                try {
                    // Skip trigger node (already executed)
                    if (node.data.type === 'trigger' || node.data.type === 'telegramTrigger') {
                        stepLog.outputData = currentData;
                        stepLog.status = 'skipped';
                        stepLog.message = 'Trigger node - using trigger data';
                        
                        // Extract trigger message for proper flow
                        if (Array.isArray(currentData) && currentData.length > 0 && currentData[0].json) {
                            console.log('Extracted trigger message data:', JSON.stringify(currentData[0].json, null, 2));
                            currentData = [currentData[0].json]; // Pass trigger data to next node
                            
                            // Store a workflow step for trigger
                            const triggerStepId = `step_${i + 1}_${node.data.label?.replace(/\s+/g, '_') || node.data.type}`;
                            console.log(`Added trigger step: ${triggerStepId}`);
                        }
                        
                        console.log(`Step ${i + 1} completed: ⏭️`);
                        stepLog.endTime = new Date().toISOString();
                        executionLog.steps.push(stepLog);
                        continue;
                    }

                    // Execute the node
                    const nodeResult = await this.executeNode(node, currentData, workflowConfig);
                    
                    if (nodeResult && nodeResult.success !== false) {
                        stepLog.outputData = nodeResult;
                        stepLog.status = 'completed';
                        stepLog.message = `Node executed successfully`;
                        
                        // Prepare data for next node
                        if (nodeResult.data !== undefined) {
                            currentData = Array.isArray(nodeResult.data) ? nodeResult.data : [nodeResult.data];
                        } else {
                            currentData = [nodeResult];
                        }
                        
                        console.log(`Step ${i + 1} completed: ✅`);
                    } else {
                        throw new Error(nodeResult?.message || 'Node execution failed');
                    }

                } catch (error) {
                    stepLog.status = 'failed';
                    stepLog.error = error.message;
                    stepLog.message = `Node execution failed: ${error.message}`;
                    console.error(`Step ${i + 1} failed: ❌ ${error.message}`);
                    throw error;
                } finally {
                    stepLog.endTime = new Date().toISOString();
                    executionLog.steps.push(stepLog);
                }
            }

            executionLog.endTime = new Date().toISOString();
            executionLog.status = 'completed';
            executionLog.finalData = currentData;
            
            const duration = Date.now() - new Date(executionLog.startTime).getTime();
            console.log(`=== WORKFLOW ${workflowId} COMPLETED ===`);
            console.log(`Total steps: ${executionLog.steps.length}`);
            console.log(`Duration: ${duration}ms`);

            // Store execution history
            this.executionHistory.set(executionId, executionLog);

            return {
                success: true,
                executionId,
                workflowId,
                status: 'completed',
                steps: executionLog.steps.length,
                duration: `${duration}ms`,
                finalData: currentData,
                executionLog
            };

        } catch (error) {
            executionLog.endTime = new Date().toISOString();
            executionLog.status = 'failed';
            executionLog.error = error.message;
            
            this.executionHistory.set(executionId, executionLog);
            
            console.error(`=== WORKFLOW ${workflowId} FAILED ===`);
            console.error(`Error: ${error.message}`);
            
            throw error;
        }
    }

    // Build execution order using topological sort
    buildExecutionOrder(workflow) {
        const { nodes, edges } = workflow;
        
        console.log('Building execution order from workflow:', {
            totalNodes: nodes.length,
            totalEdges: edges.length,
            nodes: nodes.map(n => `${n.data.type} (${n.id})`),
            edges: edges.map(e => `${e.source} → ${e.target}`)
        });
        
        // Find trigger node (starting point)
        const triggerNode = nodes.find(node => 
            node.data.type === 'trigger' || 
            node.data.type === 'telegramTrigger'
        );
        if (!triggerNode) {
            throw new Error('No trigger node found in workflow');
        }

        console.log(`Starting execution order with trigger: ${triggerNode.id}`);
        
        const visited = new Set();
        const executionOrder = [];
        
        // Depth-first traversal starting from trigger
        const visit = (nodeId) => {
            if (visited.has(nodeId)) {
                return;
            }
            
            visited.add(nodeId);
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                console.log(`Processing node: ${nodeId}`);
                console.log(`Adding node to execution order: ${node.data.type} (${node.id})`);
                executionOrder.push(node);
                
                // Find outgoing edges from this node
                const outgoingEdges = edges.filter(edge => edge.source === nodeId);
                console.log(`Found ${outgoingEdges.length} outgoing edges from ${nodeId}:`, outgoingEdges.map(e => `${e.source} → ${e.target}`));
                
                // Visit connected nodes
                outgoingEdges.forEach(edge => {
                    visit(edge.target);
                });
            }
        };
        
        visit(triggerNode.id);
        
        console.log(`Final execution order: ${executionOrder.length} nodes`);
        executionOrder.forEach((node, index) => {
            console.log(`Step ${index + 1}: ${node.data.type} (${node.id})`);
        });
        
        return executionOrder;
    }

    // Execute a single node with given input data
    async executeNode(node, inputData, workflow) {
        const nodeConfig = node.data;
        console.log(`Executing ${nodeConfig.type} node with config:`, Object.keys(nodeConfig));

        switch (nodeConfig.type) {
            case 'aiAgent':
                return await aiAgentNode.execute(nodeConfig, inputData);
            
            case 'modelNode':
                return await modelNode.execute(nodeConfig, inputData);
            
            case 'googleDocs':
                return await googleDocsNode.execute(nodeConfig, inputData);
            
            case 'dataStorage':
                const dataStorageInstance = new DataStorageNode(nodeConfig);
                return await dataStorageInstance.process(inputData);
            
            case 'telegramSendMessage':
                return await telegramSendMessageNode.execute(nodeConfig, inputData, connectedNodes);
            
            case 'multiLanguageChatResponse':
                const multiLangResponseInstance = new MultiLanguageChatResponseNode();
                // Resolve templates in nodeConfig before execution
                const resolvedMultiLangConfig = this.resolveNodeTemplates(nodeConfig, inputData, workflow);
                
                // Filter config to only include Multi-Language Chat Response specific fields
                const cleanMultiLangConfig = {
                    type: resolvedMultiLangConfig.type,
                    sessionId: resolvedMultiLangConfig.sessionId,
                    message: resolvedMultiLangConfig.message,
                    language: resolvedMultiLangConfig.language,
                    chatTitle: resolvedMultiLangConfig.chatTitle,
                    webhookPath: resolvedMultiLangConfig.webhookPath
                };
                console.log('🧹 BEFORE CLEANING - Full multi-lang resolved config contains', Object.keys(resolvedMultiLangConfig).length, 'fields');
                console.log('✨ AFTER CLEANING - Clean multi-lang config:', JSON.stringify(cleanMultiLangConfig, null, 2));
                return await multiLangResponseInstance.execute(cleanMultiLangConfig, inputData);
            
            default:
                throw new Error(`Unsupported node type: ${nodeConfig.type}`);
        }
    }

    // Resolve template variables in node configuration
    resolveNodeTemplates(nodeConfig, inputData, workflow) {
        // Simple template resolution - replace {{$json.field}} with actual values
        const resolvedConfig = JSON.parse(JSON.stringify(nodeConfig));
        
        if (Array.isArray(inputData) && inputData.length > 0) {
            const firstItem = inputData[0];
            
            // Recursively resolve templates in config
            const resolve = (obj) => {
                if (typeof obj === 'string') {
                    // Replace {{$json.field}} patterns
                    return obj.replace(/\{\{\$json\.([^}]+)\}\}/g, (match, fieldPath) => {
                        try {
                            const value = this.getNestedValue(firstItem, fieldPath);
                            return value !== undefined ? value : match;
                        } catch {
                            return match;
                        }
                    });
                } else if (Array.isArray(obj)) {
                    return obj.map(resolve);
                } else if (obj && typeof obj === 'object') {
                    const resolved = {};
                    for (const [key, value] of Object.entries(obj)) {
                        resolved[key] = resolve(value);
                    }
                    return resolved;
                }
                return obj;
            };
            
            return resolve(resolvedConfig);
        }
        
        return resolvedConfig;
    }

    // Get nested value from object using dot notation
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    // Get execution history for debugging
    getExecutionHistory(executionId) {
        return this.executionHistory.get(executionId);
    }

    // Get all execution history
    getAllExecutionHistory() {
        return Array.from(this.executionHistory.values());
    }
}

// Create singleton instance
const workflowExecutor = new WorkflowExecutor();

module.exports = workflowExecutor;