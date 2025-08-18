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
        console.log('Node ID:', node.id);
        console.log('Node structure:', JSON.stringify(node, null, 2));
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
        
        console.log('🔧 Creating execution context with:');
        console.log('- Current node ID:', node.id);
        console.log('- AllNodes keys:', Object.keys(allNodes));
        console.log('- AllNodes structure:', JSON.stringify(allNodes, null, 2));
        
        const executionContext = createBackendExecutionContext(
            node, 
            allNodes, 
            workflowData,
            req.body.executionId
        );
        
        console.log('✅ Execution context created successfully');
        
        // Process node config with isolated context (template resolution)
        const processedConfig = executionContext.processTemplates(
            node.config || {},
            node.id,
            connectedNodes
        );
        
        console.log('🔒 Processed config with isolated context - contains', Object.keys(processedConfig).length, 'fields');
        
        // Handle multi-item processing
        const inputItems = Array.isArray(inputData) ? inputData : [inputData || {}];
        const results = [];
        
        console.log(`📋 Processing ${inputItems.length} item(s) for node ${node.type}`);
        
        // Check if this is an output node that should execute once regardless of input items
        const outputNodes = ['telegramSendMessage'];
        const shouldExecuteOnce = outputNodes.includes(node.type);
        
        if (shouldExecuteOnce) {
            console.log(`🔄 Output node ${node.type} - executing once with all input data`);
            
            let itemResult;
            // Use all input data as a single execution context
            const allInputData = inputItems.length > 0 ? inputItems : [{}];
            
            // Execute output nodes once with all input data
            switch (node.type) {
                case 'telegramSendMessage':
                    // Use first item or combined data for context
                    const contextItem = allInputData[0] || {};
                    itemResult = await telegramSendMessageNode.execute(processedConfig, contextItem, connectedNodes, executionContext);
                    break;
                
                
                default:
                    return res.status(400).json({ 
                        message: `Unsupported output node type: ${node.type}`,
                        supportedOutputTypes: ['telegramSendMessage']
                    });
            }
            
            // Single result for output nodes
            if (itemResult && typeof itemResult === 'object') {
                results.push({
                    ...itemResult,
                    itemIndex: 0,
                    processedAt: new Date().toISOString(),
                    executedOnce: true
                });
            } else {
                results.push({
                    success: false,
                    error: 'Output node returned invalid result',
                    itemIndex: 0,
                    processedAt: new Date().toISOString()
                });
            }
            
        } else {
            // Process each item with its own context (for non-output nodes)
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
                        // For test execution, try to get cached messages from Live Chat first
                        if (processedConfig.botToken) {
                            try {
                                const db = require('../db');
                                
                                // First, try to get recent messages from Live Chat database
                                const recentMessages = await new Promise((resolve, reject) => {
                                    db.all(`
                                        SELECT * FROM telegram_messages 
                                        WHERE sender_type = 'user' 
                                        ORDER BY timestamp DESC 
                                        LIMIT 1
                                    `, (err, rows) => {
                                        if (err) reject(err);
                                        else resolve(rows);
                                    });
                                });
                                
                                if (recentMessages && recentMessages.length > 0) {
                                    // Use cached message from Live Chat
                                    const message = recentMessages[0];
                                    const telegramUpdate = {
                                        update_id: Date.now(),
                                        message: {
                                            message_id: message.telegram_message_id || Date.now(),
                                            from: {
                                                id: 123456789,
                                                first_name: message.sender_name || 'Live Chat User',
                                                username: message.sender_name?.toLowerCase().replace(/\s+/g, '_') || 'live_chat_user'
                                            },
                                            chat: {
                                                id: message.conversation_id || 123456789,
                                                type: 'private'
                                            },
                                            text: message.message_text,
                                            date: Math.floor(new Date(message.timestamp).getTime() / 1000)
                                        }
                                    };
                                    
                                    itemResult = {
                                        success: true,
                                        message: `✅ Using recent message from Live Chat`,
                                        data: telegramUpdate,
                                        timestamp: new Date().toISOString()
                                    };
                                } else {
                                    // No cached messages, try getUpdates (might fail if webhook is active)
                                    try {
                                        const axios = require('axios');
                                        const response = await axios.post(`https://api.telegram.org/bot${processedConfig.botToken}/getUpdates`, {
                                            limit: 1,
                                            offset: -1
                                        });
                                        
                                        if (response.data.ok && response.data.result && response.data.result.length > 0) {
                                            const latestUpdate = response.data.result[response.data.result.length - 1];
                                            itemResult = {
                                                success: true,
                                                message: `✅ Fetched real message from Telegram API`,
                                                data: latestUpdate,
                                                timestamp: new Date().toISOString()
                                            };
                                        } else {
                                            throw new Error('No messages available via API');
                                        }
                                    } catch (apiError) {
                                        // API failed (likely webhook conflict), provide sample data
                                        console.log('⚠️ getUpdates failed (webhook conflict), using sample data');
                                        const sampleUpdate = {
                                            update_id: Date.now(),
                                            message: {
                                                message_id: Date.now(),
                                                from: {
                                                    id: 123456789,
                                                    first_name: 'Sample User',
                                                    username: 'sample_user'
                                                },
                                                chat: {
                                                    id: 123456789,
                                                    type: 'private'
                                                },
                                                text: 'Hello! This is a sample message for testing your workflow.',
                                                date: Math.floor(Date.now() / 1000)
                                            }
                                        };
                                        
                                        itemResult = {
                                            success: true,
                                            message: `🧪 Using sample data (webhook active - send a real message to get actual data)`,
                                            data: sampleUpdate,
                                            timestamp: new Date().toISOString()
                                        };
                                    }
                                }
                            } catch (error) {
                                console.error('❌ Error in Telegram trigger execution:', error.message);
                                itemResult = {
                                    success: false,
                                    message: `❌ Failed to get message data: ${error.message}`,
                                    data: {},
                                    timestamp: new Date().toISOString()
                                };
                            }
                        } else {
                            // No bot token configured
                            itemResult = {
                                success: false,
                                message: '❌ Bot token not configured. Configure the bot token first.',
                                data: {},
                                timestamp: new Date().toISOString()
                            };
                        }
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
                            supportedTypes: ['aiAgent', 'modelNode', 'googleDocs', 'dataStorage', 'telegramTrigger', 'if', 'switch', 'wait', 'merge', 'filter']
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