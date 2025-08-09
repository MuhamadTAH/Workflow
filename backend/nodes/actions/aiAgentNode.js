/*
=================================================================
BACKEND FILE: backend/nodes/actions/aiAgentNode.js
=================================================================
This file defines the structure and properties of the AI Agent node.
Copied from WorkflowNode and adapted for main backend.
*/

const { callClaudeApi, verifyClaudeApiKey } = require('../../services/aiService');

const aiAgentNode = {
    description: {
        displayName: 'AI Agent',
        name: 'aiAgent',
        icon: 'fa:robot',
        group: 'actions',
        version: 1,
        description: 'Uses an LLM to process input and generate a response.',
        defaults: {
            name: 'AI Agent',
        },
        // These are the configuration fields for the node
        properties: [
            {
                displayName: 'Model',
                name: 'model',
                type: 'options',
                options: [
                    { name: 'Claude 3.5 Sonnet (Official SDK)', value: 'claude-3-5-sonnet-20241022' },
                    { name: 'GPT-4 (Coming Soon)', value: 'gpt-4' },
                ],
                default: 'claude-3-5-sonnet-20241022',
                required: true,
                description: 'AI model to use. Claude models use the official Anthropic SDK.',
            },
            {
                displayName: 'Claude API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'Claude API Key (sk-ant-...) - Enhanced with official SDK features.',
                placeholder: 'sk-ant-...'
            },
            {
                displayName: 'System Prompt',
                name: 'systemPrompt',
                type: 'string',
                typeOptions: {
                    alwaysOpenEditWindow: true,
                    rows: 4,
                },
                default: 'You are a helpful AI assistant. Process the input data and provide a relevant response.',
                description: 'System prompt that defines the AI\'s behavior and role.',
                placeholder: 'You are an expert in...'
            },
            {
                displayName: 'User Message',
                name: 'userMessage',
                type: 'string',
                typeOptions: {
                    alwaysOpenEditWindow: true,
                    rows: 3,
                },
                default: '{{ message.text }}',
                required: true,
                description: 'The user message to process. Can include templates like {{ message.text }}.',
                placeholder: 'Process this: {{ message.text }}'
            }
        ],
    },

    // This function gets called when the node is executed
    async execute(nodeData, inputData, connectedNodes = [], executionContext = null) {
        console.log('🤖 AI Agent Node Execution Starting');
        console.log('Node configuration:', {
            model: nodeData.model,
            hasApiKey: !!nodeData.apiKey,
            systemPrompt: nodeData.systemPrompt?.substring(0, 50) + '...',
            userMessage: nodeData.userMessage?.substring(0, 50) + '...'
        });

        try {
            // Validate required fields
            if (!nodeData.apiKey) {
                throw new Error('Claude API Key is required');
            }

            if (!nodeData.userMessage) {
                throw new Error('User Message is required');
            }

            // Process templates using n8n-style execution context if available
            let processedMessage;
            if (executionContext) {
                processedMessage = executionContext.evaluateExpression(nodeData.userMessage, 'ai_agent', inputData, 0);
                console.log('🔒 n8n-style processed user message:', processedMessage);
            } else {
                // Fallback to old template processing
                processedMessage = processTemplates(nodeData.userMessage, inputData);
                console.log('📜 Legacy processed user message:', processedMessage);
            }

            // Prepare AI request
            const aiRequest = {
                model: nodeData.model || 'claude-3-5-sonnet-20241022',
                apiKey: nodeData.apiKey,
                systemPrompt: nodeData.systemPrompt || 'You are a helpful AI assistant.',
                userMessage: processedMessage,
                inputData: inputData,
                connectedData: connectedNodes
            };

            console.log('Making AI API call...');
            const aiResponse = await callClaudeApi(aiRequest);
            
            console.log('✅ AI Agent completed successfully');
            console.log('Response preview:', aiResponse.substring(0, 100) + '...');

            // Return structured output
            return {
                response: aiResponse,
                model: nodeData.model,
                timestamp: new Date().toISOString(),
                inputProcessed: processedMessage
            };

        } catch (error) {
            console.error('❌ AI Agent execution failed:', error.message);
            throw new Error(`AI Agent failed: ${error.message}`);
        }
    }
};

// Helper function to process templates
function processTemplates(text, inputData) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    console.log('🤖 AI Agent processing templates in text:', text);
    console.log('📊 Available input data:', JSON.stringify(inputData, null, 2));
    
    // Handle cascading data structure similar to telegram node
    let dataToProcess;
    if (Array.isArray(inputData) && inputData.length > 0 && inputData[0].nodeId) {
        // This is cascading data structure - convert to flat object for template resolution
        dataToProcess = {};
        inputData.forEach(nodeInfo => {
            // Create entries like "1. AI Agent" for easy template access
            const nodeKey = `${nodeInfo.order}. ${nodeInfo.nodeLabel}`;
            dataToProcess[nodeKey] = nodeInfo.data;
            
            // Also create direct data entries for backwards compatibility
            if (nodeInfo.data && typeof nodeInfo.data === 'object') {
                Object.keys(nodeInfo.data).forEach(key => {
                    // Priority: Give Telegram Trigger data priority over AI Agent data for common keys
                    if (!(key in dataToProcess) || nodeInfo.nodeType === 'telegramTrigger') {
                        dataToProcess[key] = nodeInfo.data[key];
                    }
                });
            }
        });
    } else {
        // Use original data structure
        dataToProcess = inputData;
    }
    
    console.log('🤖 Processed data structure:', JSON.stringify(dataToProcess, null, 2));
    
    // Helper function to parse path with array notation
    const parsePath = (pathStr) => {
        const parts = [];
        let current = '';
        let inBracket = false;
        
        // First, check if the path starts with a numbered node key like "1. Node Name"
        const nodeKeyMatch = pathStr.match(/^(\d+\.\s+[^[.]+)/);
        if (nodeKeyMatch) {
            const nodeKey = nodeKeyMatch[1];
            parts.push(nodeKey);
            // Continue parsing the rest of the path after the node key
            pathStr = pathStr.substring(nodeKey.length);
            if (pathStr.startsWith('.')) {
                pathStr = pathStr.substring(1); // Remove leading dot
            }
        }
        
        for (let i = 0; i < pathStr.length; i++) {
            const char = pathStr[i];
            
            if (char === '[') {
                if (current) {
                    parts.push(current);
                    current = '';
                }
                inBracket = true;
            } else if (char === ']') {
                if (inBracket && current) {
                    // Parse array index as number
                    const index = parseInt(current, 10);
                    if (!isNaN(index)) {
                        parts.push(index);
                    } else {
                        parts.push(current); // Keep as string if not a number
                    }
                    current = '';
                }
                inBracket = false;
            } else if (char === '.' && !inBracket) {
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) {
            parts.push(current);
        }
        
        return parts;
    };
    
    // Helper function to traverse object/array path
    const traversePath = (obj, pathParts) => {
        let current = obj;
        console.log(`🔍 AI Agent traversePath starting with:`, current);
        console.log(`🔍 AI Agent pathParts:`, pathParts);
        
        for (let i = 0; i < pathParts.length; i++) {
            const part = pathParts[i];
            console.log(`🔍 AI Agent step ${i}: part="${part}", currentType=${Array.isArray(current) ? 'array' : typeof current}`);
            
            if (current === null || current === undefined) {
                console.log(`❌ AI Agent step ${i}: current is null/undefined`);
                return { found: false, value: undefined };
            }
            
            if (typeof part === 'number') {
                // Array index
                console.log(`🔍 AI Agent step ${i}: accessing array index ${part}`);
                if (!Array.isArray(current)) {
                    console.log(`❌ AI Agent step ${i}: expected array but got ${typeof current}`);
                    return { found: false, value: undefined };
                }
                if (part >= current.length || part < 0) {
                    console.log(`❌ AI Agent step ${i}: index ${part} out of bounds (length: ${current.length})`);
                    return { found: false, value: undefined };
                }
                current = current[part];
                console.log(`✅ AI Agent step ${i}: array access successful, new current:`, typeof current === 'object' ? 'object' : current);
            } else {
                // Object property
                console.log(`🔍 AI Agent step ${i}: accessing object property "${part}"`);
                if (typeof current !== 'object' || !(part in current)) {
                    console.log(`❌ AI Agent step ${i}: property "${part}" not found in object with keys:`, Object.keys(current || {}));
                    return { found: false, value: undefined };
                }
                current = current[part];
                console.log(`✅ AI Agent step ${i}: property access successful, new current:`, typeof current === 'object' ? 'object' : current);
            }
        }
        
        console.log(`✅ AI Agent traversePath final result:`, current);
        return { found: true, value: current };
    };

    // Enhanced template processing - replace {{ key }} with data values
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        try {
            const pathStr = path.trim();
            console.log(`🔍 AI Agent resolving path: ${pathStr}`);
            
            const pathParts = parsePath(pathStr);
            console.log(`🔧 AI Agent parsed path parts:`, pathParts);
            
            // Try direct path resolution
            const result = traversePath(dataToProcess, pathParts);
            console.log(`🎯 AI Agent direct path result:`, result);
            
            if (result.found) {
                const resolvedValue = typeof result.value === 'object' ? JSON.stringify(result.value) : String(result.value);
                console.log(`✅ AI Agent resolved: ${pathStr} = ${resolvedValue}`);
                return resolvedValue;
            }
            
            // If direct path fails, try to find in nested data (backwards compatibility)
            if (typeof dataToProcess === 'object' && dataToProcess !== null) {
                for (const [nodeKey, nodeData] of Object.entries(dataToProcess)) {
                    if (typeof nodeData === 'object' && nodeData !== null) {
                        let nestedCurrent = nodeData;
                        let nestedFound = true;
                        
                        for (const key of keys) {
                            if (nestedCurrent && typeof nestedCurrent === 'object' && key in nestedCurrent) {
                                nestedCurrent = nestedCurrent[key];
                            } else {
                                nestedFound = false;
                                break;
                            }
                        }
                        
                        if (nestedFound) {
                            const result = typeof nestedCurrent === 'object' ? JSON.stringify(nestedCurrent) : String(nestedCurrent);
                            console.log(`✅ AI Agent nested path resolved: ${pathStr} in ${nodeKey} = ${result}`);
                            return result;
                        }
                    }
                }
            }
            
            console.log(`❌ AI Agent path not found: ${pathStr}`);
            return match; // Return original if path not found anywhere
        } catch (error) {
            console.warn(`❌ AI Agent template processing error for ${match}:`, error.message);
            return match;
        }
    });
}

module.exports = aiAgentNode;