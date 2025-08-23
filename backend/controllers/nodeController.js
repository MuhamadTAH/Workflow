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
const instagramResponseNode = require('../nodes/actions/instagramResponseNode');
const instagramGetDMsNode = require('../nodes/actions/instagramGetDMsNode');
const instagramSendDMNode = require('../nodes/actions/instagramSendDMNode');
const instagramPostImageNode = require('../nodes/actions/instagramPostImageNode');
const instagramGetCommentsNode = require('../nodes/actions/instagramGetCommentsNode');
const instagramReplyCommentNode = require('../nodes/actions/instagramReplyCommentNode');
const instagramGetInsightsNode = require('../nodes/actions/instagramGetInsightsNode');
const instagramGetProfileNode = require('../nodes/actions/instagramGetProfileNode');
const ifNode = require('../nodes/logic/ifNode');
const switchNode = require('../nodes/logic/switchNode');
const waitNode = require('../nodes/logic/waitNode');
const mergeNode = require('../nodes/logic/mergeNode');
const filterNode = require('../nodes/logic/filterNode');

// Facebook Nodes
const facebookGetPageInfoNode = require('../nodes/actions/facebookGetPageInfoNode');
const facebookPostToPageNode = require('../nodes/actions/facebookPostToPageNode');
const facebookGetPagePostsNode = require('../nodes/actions/facebookGetPagePostsNode');
const facebookGetMessagesNode = require('../nodes/actions/facebookGetMessagesNode');
const facebookSendMessageNode = require('../nodes/actions/facebookSendMessageNode');
const facebookReplyMessageNode = require('../nodes/actions/facebookReplyMessageNode');
const facebookGetPostCommentsNode = require('../nodes/actions/facebookGetPostCommentsNode');
const facebookReplyCommentNode = require('../nodes/actions/facebookReplyCommentNode');
const facebookGetPageInsightsNode = require('../nodes/actions/facebookGetPageInsightsNode');

// LinkedIn Nodes
const linkedinGetProfileNode = require('../nodes/actions/linkedinGetProfileNode');
const linkedinCreatePostNode = require('../nodes/actions/linkedinCreatePostNode');
const linkedinSendMessageNode = require('../nodes/actions/linkedinSendMessageNode');
const linkedinGetCompanyNode = require('../nodes/actions/linkedinGetCompanyNode');


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
        const outputNodes = [
            'telegramSendMessage', 'instagramResponse', 'instagramSendDM', 'instagramPostImage', 'instagramReplyComment',
            'facebookPostToPage', 'facebookSendMessage', 'facebookReplyMessage', 'facebookReplyComment',
            'linkedinCreatePost', 'linkedinSendMessage'
        ];
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
                
                case 'instagramResponse':
                    // Use first item or combined data for context
                    const instagramContextItem = allInputData[0] || {};
                    itemResult = await instagramResponseNode.execute(processedConfig, instagramContextItem, connectedNodes, executionContext);
                    break;
                
                case 'instagramSendDM':
                    const dmContextItem = allInputData[0] || {};
                    itemResult = await instagramSendDMNode.execute(processedConfig, dmContextItem, connectedNodes, executionContext);
                    break;
                
                case 'instagramPostImage':
                    const postContextItem = allInputData[0] || {};
                    itemResult = await instagramPostImageNode.execute(processedConfig, postContextItem, connectedNodes, executionContext);
                    break;
                
                case 'instagramReplyComment':
                    const replyContextItem = allInputData[0] || {};
                    itemResult = await instagramReplyCommentNode.execute(processedConfig, replyContextItem, connectedNodes, executionContext);
                    break;
                
                case 'facebookPostToPage':
                    const fbPostContextItem = allInputData[0] || {};
                    itemResult = await facebookPostToPageNode.execute(processedConfig, fbPostContextItem, connectedNodes, executionContext);
                    break;
                
                case 'facebookSendMessage':
                    const fbSendMessageContextItem = allInputData[0] || {};
                    itemResult = await facebookSendMessageNode.execute(processedConfig, fbSendMessageContextItem, connectedNodes, executionContext);
                    break;
                
                case 'facebookReplyMessage':
                    const fbReplyMessageContextItem = allInputData[0] || {};
                    itemResult = await facebookReplyMessageNode.execute(processedConfig, fbReplyMessageContextItem, connectedNodes, executionContext);
                    break;
                
                case 'facebookReplyComment':
                    const fbReplyCommentContextItem = allInputData[0] || {};
                    itemResult = await facebookReplyCommentNode.execute(processedConfig, fbReplyCommentContextItem, connectedNodes, executionContext);
                    break;
                
                case 'linkedinCreatePost':
                    const linkedinPostContextItem = allInputData[0] || {};
                    itemResult = await linkedinCreatePostNode.execute(processedConfig, linkedinPostContextItem, connectedNodes, executionContext);
                    break;
                
                case 'linkedinSendMessage':
                    const linkedinMessageContextItem = allInputData[0] || {};
                    itemResult = await linkedinSendMessageNode.execute(processedConfig, linkedinMessageContextItem, connectedNodes, executionContext);
                    break;
                
                default:
                    return res.status(400).json({ 
                        message: `Unsupported output node type: ${node.type}`,
                        supportedOutputTypes: ['telegramSendMessage', 'instagramResponse', 'facebookPostToPage', 'facebookSendMessage', 'linkedinCreatePost', 'linkedinSendMessage']
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
                    
                    case 'instagramGetDMs':
                        itemResult = await instagramGetDMsNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    case 'instagramGetComments':
                        itemResult = await instagramGetCommentsNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    case 'instagramGetInsights':
                        itemResult = await instagramGetInsightsNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    case 'instagramGetProfile':
                        itemResult = await instagramGetProfileNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    case 'chatTrigger':
                        // For chat trigger test execution, generate sample chat data
                        itemResult = {
                            success: true,
                            message: 'Sample chat data generated',
                            data: {
                                message: {
                                    message_id: Date.now(),
                                    text: 'Hello from chat!',
                                    chat: {
                                        id: 'chat_session_123',
                                        type: 'private'
                                    },
                                    from: {
                                        id: 'chat_user_123',
                                        first_name: 'Chat User',
                                        username: 'chat_user'
                                    },
                                    date: Math.floor(Date.now() / 1000)
                                },
                                chat_session: {
                                    id: 'chat_session_123',
                                    session_name: processedConfig.chatSessionName || 'My Chat Bot'
                                }
                            },
                            timestamp: new Date().toISOString()
                        };
                        break;

                    case 'chatbotTrigger':
                        // For chatbot trigger test execution, generate sample chatbot data
                        itemResult = {
                            success: true,
                            message: 'Sample chatbot data generated',
                            data: {
                                message: {
                                    message_id: Date.now(),
                                    text: 'Hello from chatbot widget!',
                                    chat: {
                                        id: 'chatbot_session_456',
                                        type: 'widget'
                                    },
                                    from: {
                                        id: 'chatbot_user_456',
                                        first_name: 'Widget User',
                                        username: 'widget_user'
                                    },
                                    date: Math.floor(Date.now() / 1000)
                                },
                                chatbot_session: {
                                    id: 'chatbot_session_456',
                                    title: processedConfig.chatbotTitle || 'Customer Support',
                                    subtitle: processedConfig.chatbotSubtitle || 'How can we help you?',
                                    theme: processedConfig.chatbotTheme || '#667eea'
                                }
                            },
                            timestamp: new Date().toISOString()
                        };
                        break;

                    case 'telegramTrigger':
                        // For test execution, prioritize Telegram API for fresh data
                        if (processedConfig.botToken) {
                            try {
                                // First priority: Try Telegram API directly for fresh messages
                                try {
                                    const axios = require('axios');
                                    console.log('🔄 Execute: Trying Telegram API first for fresh data...');
                                    const response = await axios.post(`https://api.telegram.org/bot${processedConfig.botToken}/getUpdates`, {
                                        limit: 1,
                                        offset: -1
                                    });
                                    
                                    if (response.data.ok && response.data.result && response.data.result.length > 0) {
                                        const latestUpdate = response.data.result[response.data.result.length - 1];
                                        itemResult = {
                                            success: true,
                                            message: `✅ Fetched fresh message from Telegram API`,
                                            data: latestUpdate,
                                            timestamp: new Date().toISOString()
                                        };
                                    } else {
                                        throw new Error('No messages available via API');
                                    }
                                } catch (apiError) {
                                    console.log('⚠️ Telegram API failed, trying Live Chat database fallback...', apiError.message);
                                    
                                    // Second priority: Fallback to Live Chat database
                                    const db = require('../db');
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
                                        // Use cached message from Live Chat with REAL Telegram IDs
                                        const message = recentMessages[0];
                                        
                                        // Extract real Telegram data from metadata if available
                                        let realTelegramData = null;
                                        if (message.metadata) {
                                            try {
                                                const metadata = JSON.parse(message.metadata);
                                                realTelegramData = metadata.telegram_update;
                                            } catch (e) {
                                                console.log('⚠️ Could not parse metadata for real Telegram IDs');
                                            }
                                        }
                                        
                                        // Build response with real IDs if available, fallback to placeholders
                                        const telegramUpdate = {
                                            update_id: realTelegramData?.update_id || Date.now(),
                                            message: {
                                                message_id: realTelegramData?.message?.message_id || message.telegram_message_id || Date.now(),
                                                from: {
                                                    id: realTelegramData?.message?.from?.id || 123456789,
                                                    first_name: realTelegramData?.message?.from?.first_name || message.sender_name || 'Live Chat User',
                                                    last_name: realTelegramData?.message?.from?.last_name || '',
                                                    username: realTelegramData?.message?.from?.username || message.sender_name?.toLowerCase().replace(/\s+/g, '_') || 'live_chat_user'
                                                },
                                                chat: {
                                                    id: realTelegramData?.message?.chat?.id || message.conversation_id || 123456789,
                                                    type: realTelegramData?.message?.chat?.type || 'private'
                                                },
                                                text: realTelegramData?.message?.text || message.message_text,
                                                date: realTelegramData?.message?.date || Math.floor(new Date(message.timestamp).getTime() / 1000)
                                            }
                                        };
                                        
                                        // Update message to show if real IDs are used
                                        const hasRealIds = realTelegramData?.message?.from?.id && realTelegramData?.message?.chat?.id;
                                        const statusMessage = hasRealIds ? 
                                            `✅ Using cached message with REAL Telegram IDs (API unavailable)` :
                                            `✅ Using cached message from Live Chat (API unavailable)`;
                                        
                                        itemResult = {
                                            success: true,
                                            message: statusMessage,
                                            data: telegramUpdate,
                                            timestamp: new Date().toISOString()
                                        };
                                    } else {
                                        // Third priority: Sample data if both fail
                                        console.log('⚠️ No Live Chat messages, using sample data');
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
                                            message: `🧪 Using sample data (API blocked by webhook, no cached messages)`,
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
                    
                    // Facebook Input Nodes
                    case 'facebookGetPageInfo':
                        itemResult = await facebookGetPageInfoNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    case 'facebookGetPagePosts':
                        itemResult = await facebookGetPagePostsNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    case 'facebookGetMessages':
                        itemResult = await facebookGetMessagesNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    case 'facebookGetPostComments':
                        itemResult = await facebookGetPostCommentsNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    case 'facebookGetPageInsights':
                        itemResult = await facebookGetPageInsightsNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    // LinkedIn Input Nodes
                    case 'linkedinGetProfile':
                        itemResult = await linkedinGetProfileNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    case 'linkedinGetCompany':
                        itemResult = await linkedinGetCompanyNode.execute(processedConfig, currentItem, connectedNodes, executionContext);
                        break;
                    
                    default:
                        return res.status(400).json({ 
                            message: `Unsupported node type: ${node.type}`,
                            supportedTypes: [
                                'aiAgent', 'modelNode', 'googleDocs', 'dataStorage', 'telegramTrigger', 'if', 'switch', 'wait', 'merge', 'filter',
                                'facebookGetPageInfo', 'facebookPostToPage', 'facebookGetPagePosts', 'facebookGetMessages', 'facebookSendMessage', 
                                'facebookReplyMessage', 'facebookGetPostComments', 'facebookReplyComment', 'facebookGetPageInsights',
                                'linkedinGetProfile', 'linkedinCreatePost', 'linkedinSendMessage', 'linkedinGetCompany'
                            ]
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