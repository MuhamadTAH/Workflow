const axios = require('axios');

const telegramSendMessageNode = {
    description: {
        displayName: 'Telegram Send Message',
        name: 'telegramSendMessage',
        icon: 'fa:telegram',
        group: 'actions',
        version: 1,
        description: 'Sends messages to Telegram bot chats - supports text, images, and basic media.',
        defaults: {
            name: 'Telegram Send Message',
        },
        properties: [
            {
                displayName: 'Bot API Token',
                name: 'botToken',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                required: true,
                description: 'The API token for your Telegram bot.',
                placeholder: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
            },
            {
                displayName: 'Chat ID',
                name: 'chatId',
                type: 'string',
                default: '{{message.chat.id}}',
                required: true,
                description: 'Chat ID where to send the message. Use template variables like {{message.chat.id}}',
                placeholder: '123456789 or {{message.chat.id}}',
            },
            {
                displayName: 'Message Type',
                name: 'messageType',
                type: 'options',
                options: [
                    { name: 'Text Message', value: 'text' },
                    { name: 'Photo/Image', value: 'photo' },
                ],
                default: 'text',
                required: true,
                description: 'Type of message to send.',
            },
            {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                typeOptions: {
                    alwaysOpenEditWindow: true,
                    rows: 4,
                },
                default: 'Hello! This is an automated response from the workflow.',
                required: true,
                description: 'The text message to send. Supports templates like {{message.text}}.',
                placeholder: 'Hello {{message.from.first_name}}!',
                displayOptions: {
                    show: {
                        messageType: ['text'],
                    },
                },
            }
        ],
    },

    async execute(nodeData, inputData, connectedNodes = []) {
        console.log('📱 NEW Telegram Send Message Node Execution Starting');
        console.log('Node configuration:', {
            messageType: nodeData.messageType,
            hasBotToken: !!nodeData.botToken,
            chatId: nodeData.chatId,
            messageText: nodeData.messageText
        });

        try {
            // Validate required fields
            if (!nodeData.botToken) {
                throw new Error('Bot API Token is required');
            }

            if (!nodeData.chatId) {
                throw new Error('Chat ID is required');
            }

            // Process templates with improved resolution
            const processedChatId = resolveTemplates(nodeData.chatId, inputData);
            const processedMessage = resolveTemplates(nodeData.messageText, inputData);

            console.log('🔧 NEW Template Resolution Results:');
            console.log('Original message:', nodeData.messageText);
            console.log('Resolved message:', processedMessage);
            console.log('Templates were resolved:', processedMessage !== nodeData.messageText);

            // Send the message
            const result = await sendTextMessage(
                nodeData.botToken,
                processedChatId,
                processedMessage
            );

            console.log('✅ NEW Telegram message sent successfully');
            console.log('Response:', result);

            return {
                success: true,
                messageId: result.message_id,
                chatId: processedChatId,
                sentAt: new Date().toISOString(),
                messageType: nodeData.messageType,
                response: result
            };

        } catch (error) {
            console.error('❌ NEW Telegram Send Message failed:', error.message);
            throw new Error(`Telegram Send Message failed: ${error.message}`);
        }
    }
};

// Simple but robust template resolution function
function resolveTemplates(text, inputData) {
    if (!text || typeof text !== 'string') {
        return text;
    }

    console.log('🔍 NEW Template resolver - Input text:', text);
    console.log('🔍 NEW Template resolver - Available data:', JSON.stringify(inputData, null, 2));

    // Handle different input data structures
    let dataToSearch = {};

    // If inputData is an array (cascading structure)
    if (Array.isArray(inputData)) {
        console.log('📋 Processing array input data...');
        inputData.forEach((item, index) => {
            if (item && typeof item === 'object') {
                // If it's a node info object
                if (item.nodeId && item.data) {
                    const nodeKey = `${item.order || index + 1}. ${item.nodeLabel || item.nodeType || 'Node'}`;
                    dataToSearch[nodeKey] = item.data;
                    console.log(`📋 Added node data: ${nodeKey}`);
                    
                    // Also add direct access to nested data
                    if (item.data && typeof item.data === 'object') {
                        Object.assign(dataToSearch, item.data);
                    }
                } else {
                    // Direct data object
                    Object.assign(dataToSearch, item);
                }
            }
        });
    } else if (inputData && typeof inputData === 'object') {
        // Direct object
        dataToSearch = inputData;
    }

    console.log('🔍 NEW Data structure for template resolution:', JSON.stringify(dataToSearch, null, 2));

    // Replace templates using a more robust approach
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        const trimmedPath = path.trim();
        console.log(`🎯 NEW Resolving template: ${trimmedPath}`);

        // Try multiple resolution strategies
        const strategies = [
            // Strategy 1: Direct key access
            () => dataToSearch[trimmedPath],
            
            // Strategy 2: Dot notation traversal
            () => {
                const parts = trimmedPath.split('.');
                let current = dataToSearch;
                
                for (const part of parts) {
                    if (current && typeof current === 'object' && part in current) {
                        current = current[part];
                    } else {
                        return undefined;
                    }
                }
                return current;
            },
            
            // Strategy 3: Search in all node data
            () => {
                for (const [key, value] of Object.entries(dataToSearch)) {
                    if (key.includes('Agent') || key.includes('AI')) {
                        const parts = trimmedPath.split('.');
                        let current = value;
                        
                        for (const part of parts) {
                            if (current && typeof current === 'object' && part in current) {
                                current = current[part];
                            } else {
                                break;
                            }
                        }
                        
                        if (current !== value && current !== undefined) {
                            return current;
                        }
                    }
                }
                return undefined;
            },
            
            // Strategy 4: Deep search for specific patterns
            () => {
                if (trimmedPath.includes('result.response')) {
                    // Look for result.response in any nested object
                    const searchNested = (obj) => {
                        if (!obj || typeof obj !== 'object') return undefined;
                        
                        if (obj.result && obj.result.response) {
                            return obj.result.response;
                        }
                        
                        for (const value of Object.values(obj)) {
                            if (typeof value === 'object') {
                                const found = searchNested(value);
                                if (found !== undefined) return found;
                            }
                        }
                        return undefined;
                    };
                    
                    return searchNested(dataToSearch);
                }
                return undefined;
            }
        ];

        // Try each strategy until we find a value
        for (let i = 0; i < strategies.length; i++) {
            try {
                const result = strategies[i]();
                if (result !== undefined && result !== null) {
                    const resolvedValue = typeof result === 'object' ? JSON.stringify(result) : String(result);
                    console.log(`✅ NEW Resolved ${trimmedPath} = ${resolvedValue} (strategy ${i + 1})`);
                    return resolvedValue;
                }
            } catch (error) {
                console.warn(`⚠️ Strategy ${i + 1} failed for ${trimmedPath}:`, error.message);
            }
        }

        console.log(`❌ NEW Could not resolve template: ${trimmedPath}`);
        return match; // Return original if not found
    });
}

// Helper function to send text message
async function sendTextMessage(botToken, chatId, text) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const payload = {
        chat_id: chatId,
        text: text
    };

    const response = await axios.post(url, payload);

    if (!response.data.ok) {
        throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return response.data.result;
}

module.exports = telegramSendMessageNode;