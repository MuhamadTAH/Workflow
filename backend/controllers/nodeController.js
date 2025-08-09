/*
=================================================================
BACKEND FILE: backend/controllers/nodeController.js
=================================================================
This controller contains the logic to execute a specific node.
Copied from WorkflowNode and adapted for main backend.
Updated with n8n-style isolated execution contexts.
*/

const aiAgentNode = require('../nodes/actions/aiAgentNode');
const modelNode = require('../nodes/actions/modelNode');
const googleDocsNode = require('../nodes/actions/googleDocsNode');
const DataStorageNode = require('../nodes/actions/dataStorageNode');
const telegramSendMessageNode = require('../nodes/actions/telegramSendMessageNode');
const ifNode = require('../nodes/logic/ifNode');
const switchNode = require('../nodes/logic/switchNode');
const waitNode = require('../nodes/logic/waitNode');
const mergeNode = require('../nodes/logic/mergeNode');
const filterNode = require('../nodes/logic/filterNode');
const { createBackendExecutionContext } = require('../utils/executionContext');

const runNode = async (req, res) => {
    try {
        const { node, inputData, connectedNodes } = req.body;

        if (!node || !node.type) {
            return res.status(400).json({ message: 'A valid node object is required.' });
        }

        let result;

        console.log('=== n8n-style Node Execution ===');
        console.log('Node type:', node.type);
        console.log('Connected nodes:', connectedNodes ? connectedNodes.length : 0);
        console.log('Input data preview:', JSON.stringify(inputData, null, 2).substring(0, 200) + '...');
        
        // Create isolated execution context for this node
        const workflowData = {
            id: req.body.workflowId || 'current_workflow',
            name: req.body.workflowName || 'Current Workflow',
            active: true,
            runIndex: req.body.runIndex || 0
        };
        
        // Build allNodes map from connectedNodes
        const allNodes = {};
        if (Array.isArray(connectedNodes)) {
            connectedNodes.forEach(nodeData => {
                if (nodeData && nodeData.nodeId) {
                    allNodes[nodeData.nodeId] = {
                        type: nodeData.nodeType,
                        data: { label: nodeData.nodeLabel },
                        outputData: nodeData.data,
                        config: nodeData.config || {}
                    };
                }
            });
        }
        
        // Add current node to allNodes
        allNodes[node.id] = {
            type: node.type,
            data: node.data || {},
            config: node.config || {},
            outputData: inputData
        };
        
        const executionContext = createBackendExecutionContext(
            node, 
            allNodes, 
            workflowData,
            req.body.executionId
        );
        
        // Process node config with isolated context (template resolution)
        const processedConfig = executionContext.processTemplates(
            node.config || {},
            node.id,
            connectedNodes
        );
        
        console.log('🔒 Processed config with isolated context:', processedConfig);
        
        // Handle multi-item processing
        const inputItems = Array.isArray(inputData) ? inputData : [inputData || {}];
        const results = [];
        
        console.log(`📋 Processing ${inputItems.length} item(s) for node ${node.type}`);
        
        // Process each item with its own context
        for (let itemIndex = 0; itemIndex < inputItems.length; itemIndex++) {
            const currentItem = inputItems[itemIndex];
            console.log(`🔄 Processing item ${itemIndex + 1}/${inputItems.length}`);
            
            let itemResult;
            
            // Execute different node types with processed config and isolated context
            switch (node.type) {
                case 'aiAgent':
                    itemResult = await aiAgentNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                    break;
                
                case 'modelNode':
                    itemResult = await modelNode.execute(processedConfig, currentItem, executionContext);
                    break;
                
                case 'googleDocs':
                    itemResult = await googleDocsNode.execute(processedConfig, currentItem, executionContext);
                    break;
                
                case 'dataStorage':
                    const dataStorageInstance = new DataStorageNode(processedConfig);
                    itemResult = await dataStorageInstance.process(currentItem, executionContext);
                    break;
                
                case 'telegramTrigger':
                    // Trigger nodes don't execute - they start workflows
                    itemResult = {
                        success: true,
                        message: 'Telegram trigger node activated',
                        data: currentItem || processedConfig.outputData || null,
                        timestamp: new Date().toISOString()
                    };
                    break;
                
                case 'telegramSendMessage':
                    itemResult = await telegramSendMessageNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                    break;
                
                case 'if':
                    itemResult = await ifNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                    break;
                
                case 'switch':
                    itemResult = await switchNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                    break;
                
                case 'wait':
                    itemResult = await waitNode.execute(processedConfig, currentItem, executionContext);
                    break;
                
                case 'merge':
                    // Merge node processes all items at once, not per-item
                    if (itemIndex === 0) {
                        itemResult = await mergeNode.execute(processedConfig, inputData, executionContext);
                    } else {
                        continue; // Skip subsequent items for merge node
                    }
                    break;
                
                case 'filter':
                    itemResult = await filterNode.execute(processedConfig, currentItem, executionContext);
                    break;
                
                default:
                    return res.status(400).json({ 
                        message: `Unsupported node type: ${node.type}`,
                        supportedTypes: ['aiAgent', 'modelNode', 'googleDocs', 'dataStorage', 'telegramTrigger', 'telegramSendMessage', 'if', 'switch', 'wait', 'merge', 'filter']
                    });
            }
            
            // Handle multi-output routing (for If/Switch nodes)
            if (itemResult && typeof itemResult === 'object') {
                // Check if result has multiple output paths
                if (itemResult.outputPath !== undefined) {
                    console.log(`🔀 Item ${itemIndex + 1} routed to output: ${itemResult.outputPath}`);
                }
                
                results.push({
                    ...itemResult,
                    itemIndex: itemIndex,
                    processedAt: new Date().toISOString()
                });
            } else {
                results.push({
                    success: false,
                    error: 'Node returned invalid result',
                    itemIndex: itemIndex,
                    processedAt: new Date().toISOString()
                });
            }
        }
        
        // Combine results based on node type
        if (results.length === 1 && node.type !== 'merge') {
            // Single item result
            result = results[0];
        } else {
            // Multi-item result
            result = {
                success: true,
                items: results,
                totalItems: results.length,
                processedItems: results.filter(r => r.success).length,
                failedItems: results.filter(r => !r.success).length,
                nodeType: node.type,
                multiItemProcessing: true
            };
        }

        console.log(`✅ n8n-style execution completed: processed ${results.length} item(s)`);
        console.log('Result preview:', JSON.stringify(result, null, 2).substring(0, 200) + '...');

        res.json({
            success: true,
            result: result,
            nodeType: node.type,
            executedAt: new Date().toISOString(),
            executionContext: {
                nodeId: node.id,
                executionId: executionContext.executionId,
                runIndex: executionContext.runIndex,
                itemsProcessed: results.length,
                isolatedContext: true
            }
        });

    } catch (error) {
        console.error('❌ Node execution failed:', error.message);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: `Node execution failed: ${error.message}`,
            nodeType: req.body.node?.type,
            error: error.message
        });
    }
};

module.exports = {
    runNode
};