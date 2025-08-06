/*
=================================================================
BACKEND FILE: backend/nodes/actions/telegramSendMessageNode.js
=================================================================
Telegram Send Message node supporting text messages and basic media.
Copied from WorkflowNode and adapted for main backend.
*/

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

    // This function gets called when the node is executed
    async execute(nodeData, inputData, connectedNodes = []) {
        console.log('📱 Telegram Send Message Node Execution Starting');
        console.log('Node configuration:', {
            messageType: nodeData.messageType,
            hasBotToken: !!nodeData.botToken,
            chatId: nodeData.chatId,
            messagePreview: nodeData.messageText?.substring(0, 50) + '...'
        });

        try {
            // Validate required fields
            if (!nodeData.botToken) {
                throw new Error('Bot API Token is required');
            }

            if (!nodeData.chatId) {
                throw new Error('Chat ID is required');
            }

            // Process templates in configuration
            const processedChatId = processTemplates(nodeData.chatId, inputData);
            const processedMessage = processTemplates(nodeData.messageText, inputData);

            console.log('Processed values:', {
                chatId: processedChatId,
                message: processedMessage?.substring(0, 100) + '...'
            });

            // Send message based on type
            let result;
            switch (nodeData.messageType) {
                case 'text':
                    result = await sendTextMessage(nodeData.botToken, processedChatId, processedMessage);
                    break;
                case 'photo':
                    // For now, just send as text - can be extended later
                    result = await sendTextMessage(nodeData.botToken, processedChatId, processedMessage);
                    break;
                default:
                    throw new Error(`Unsupported message type: ${nodeData.messageType}`);
            }

            console.log('✅ Telegram message sent successfully');
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
            console.error('❌ Telegram Send Message failed:', error.message);
            throw new Error(`Telegram Send Message failed: ${error.message}`);
        }
    }
};

// Helper function to send text message
async function sendTextMessage(botToken, chatId, text) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const response = await axios.post(url, {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML' // Support basic HTML formatting
    });

    if (!response.data.ok) {
        throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return response.data.result;
}

// Helper function to process templates
function processTemplates(text, inputData) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    // Simple template processing - replace {{ key }} with data values
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        try {
            const keys = path.trim().split('.');
            let current = inputData;
            
            // Handle legacy data prefix
            if (keys[0] === 'data' && keys.length > 1 && !(keys[0] in current)) {
                keys.shift(); // Remove problematic 'data' prefix
            }
            
            for (const key of keys) {
                if (current && typeof current === 'object' && key in current) {
                    current = current[key];
                } else {
                    return match; // Return original if path not found
                }
            }
            
            return typeof current === 'object' ? JSON.stringify(current) : String(current);
        } catch (error) {
            console.warn(`Template processing error for ${match}:`, error.message);
            return match;
        }
    });
}

module.exports = telegramSendMessageNode;