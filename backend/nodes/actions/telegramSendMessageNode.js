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
                    result = await sendTextMessage(
                        nodeData.botToken,
                        processedChatId,
                        processedMessage,
                        nodeData.parseMode,
                        nodeData.disableWebPagePreview
                    );
                    break;
                case 'photo':
                    result = await sendPhoto(
                        nodeData.botToken,
                        processedChatId,
                        processTemplates(nodeData.photoUrl, inputData),
                        processTemplates(nodeData.photoCaption, inputData)
                    );
                    break;
                case 'video':
                    result = await sendVideo(
                        nodeData.botToken,
                        processedChatId,
                        processTemplates(nodeData.videoUrl, inputData),
                        processTemplates(nodeData.videoCaption, inputData),
                        toNumber(processTemplates(nodeData.videoDuration, inputData))
                    );
                    break;
                case 'audio':
                    result = await sendAudio(
                        nodeData.botToken,
                        processedChatId,
                        processTemplates(nodeData.audioUrl, inputData),
                        processTemplates(nodeData.audioCaption, inputData)
                    );
                    break;
                case 'voice':
                    result = await sendVoice(
                        nodeData.botToken,
                        processedChatId,
                        processTemplates(nodeData.voiceUrl, inputData)
                    );
                    break;
                case 'document':
                    result = await sendDocument(
                        nodeData.botToken,
                        processedChatId,
                        processTemplates(nodeData.documentUrl, inputData)
                    );
                    break;
                case 'animation':
                    result = await sendAnimation(
                        nodeData.botToken,
                        processedChatId,
                        processTemplates(nodeData.animationUrl, inputData)
                    );
                    break;
                case 'sticker':
                    result = await sendSticker(
                        nodeData.botToken,
                        processedChatId,
                        processTemplates(nodeData.stickerFileId, inputData)
                    );
                    break;
                case 'location':
                    result = await sendLocation(
                        nodeData.botToken,
                        processedChatId,
                        toNumber(processTemplates(nodeData.latitude, inputData)),
                        toNumber(processTemplates(nodeData.longitude, inputData)),
                        toNumber(processTemplates(nodeData.locationHorizontalAccuracy, inputData))
                    );
                    break;
                case 'contact':
                    result = await sendContact(
                        nodeData.botToken,
                        processedChatId,
                        processTemplates(nodeData.contactPhoneNumber, inputData),
                        processTemplates(nodeData.contactFirstName, inputData),
                        processTemplates(nodeData.contactLastName, inputData)
                    );
                    break;
                case 'poll':
                    result = await sendPoll(
                        nodeData.botToken,
                        processedChatId,
                        processTemplates(nodeData.pollQuestion, inputData),
                        processTemplates(nodeData.pollOptions, inputData)
                    );
                    break;
                case 'banUser':
                    result = await banUser(
                        nodeData.botToken,
                        processedChatId,
                        processTemplates(nodeData.banUserId, inputData)
                    );
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
async function sendTextMessage(botToken, chatId, text, parseMode = '', disableWebPagePreview = false) {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    const payload = {
        chat_id: chatId,
        text: text
    };
    if (parseMode) payload.parse_mode = parseMode;
    if (disableWebPagePreview) payload.disable_web_page_preview = true;

    const response = await axios.post(url, payload);

    if (!response.data.ok) {
        throw new Error(`Telegram API error: ${response.data.description}`);
    }

    return response.data.result;
}

async function sendPhoto(botToken, chatId, photoUrl, caption = '') {
    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    const response = await axios.post(url, { chat_id: chatId, photo: photoUrl, caption });
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return response.data.result;
}

async function sendVideo(botToken, chatId, videoUrl, caption = '', duration = undefined) {
    const url = `https://api.telegram.org/bot${botToken}/sendVideo`;
    const payload = { chat_id: chatId, video: videoUrl, caption };
    if (typeof duration === 'number' && !Number.isNaN(duration) && duration > 0) payload.duration = duration;
    const response = await axios.post(url, payload);
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return response.data.result;
}

async function sendAudio(botToken, chatId, audioUrl, caption = '') {
    const url = `https://api.telegram.org/bot${botToken}/sendAudio`;
    const response = await axios.post(url, { chat_id: chatId, audio: audioUrl, caption });
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return response.data.result;
}

async function sendVoice(botToken, chatId, voiceUrl) {
    const url = `https://api.telegram.org/bot${botToken}/sendVoice`;
    const response = await axios.post(url, { chat_id: chatId, voice: voiceUrl });
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return response.data.result;
}

async function sendDocument(botToken, chatId, documentUrl) {
    const url = `https://api.telegram.org/bot${botToken}/sendDocument`;
    const response = await axios.post(url, { chat_id: chatId, document: documentUrl });
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return response.data.result;
}

async function sendAnimation(botToken, chatId, animationUrl) {
    const url = `https://api.telegram.org/bot${botToken}/sendAnimation`;
    const response = await axios.post(url, { chat_id: chatId, animation: animationUrl });
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return response.data.result;
}

async function sendSticker(botToken, chatId, stickerFileId) {
    const url = `https://api.telegram.org/bot${botToken}/sendSticker`;
    const response = await axios.post(url, { chat_id: chatId, sticker: stickerFileId });
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return response.data.result;
}

async function sendLocation(botToken, chatId, latitude, longitude, horizontalAccuracy) {
    const url = `https://api.telegram.org/bot${botToken}/sendLocation`;
    const payload = { chat_id: chatId, latitude, longitude };
    if (typeof horizontalAccuracy === 'number' && !Number.isNaN(horizontalAccuracy) && horizontalAccuracy > 0) {
        payload.horizontal_accuracy = horizontalAccuracy;
    }
    const response = await axios.post(url, payload);
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return response.data.result;
}

async function sendContact(botToken, chatId, phoneNumber, firstName, lastName) {
    const url = `https://api.telegram.org/bot${botToken}/sendContact`;
    const response = await axios.post(url, { chat_id: chatId, phone_number: phoneNumber, first_name: firstName, last_name: lastName });
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return response.data.result;
}

async function sendPoll(botToken, chatId, question, optionsString) {
    const url = `https://api.telegram.org/bot${botToken}/sendPoll`;
    let options;
    try {
        // Allows either JSON array string or comma-separated values
        if (optionsString && optionsString.trim().startsWith('[')) {
            options = JSON.parse(optionsString);
        } else {
            options = String(optionsString || '')
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
        }
    } catch (e) {
        throw new Error('Invalid poll options format. Provide JSON array or comma-separated values.');
    }
    const response = await axios.post(url, { chat_id: chatId, question, options });
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return response.data.result;
}

async function banUser(botToken, chatId, userId) {
    const url = `https://api.telegram.org/bot${botToken}/banChatMember`;
    const response = await axios.post(url, { chat_id: chatId, user_id: userId });
    if (!response.data.ok) throw new Error(`Telegram API error: ${response.data.description}`);
    return { banned: response.data.ok };
}

// Helper function to process templates
function processTemplates(text, inputData) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    console.log('🔧 Processing templates in text:', text);
    console.log('📊 Available input data:', JSON.stringify(inputData, null, 2));
    
    // Handle cascading data structure similar to frontend
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
    
    console.log('🔧 Processed data structure:', JSON.stringify(dataToProcess, null, 2));
    
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
        
        for (const part of pathParts) {
            if (current === null || current === undefined) {
                return { found: false, value: undefined };
            }
            
            if (typeof part === 'number') {
                // Array index
                if (!Array.isArray(current) || part >= current.length || part < 0) {
                    return { found: false, value: undefined };
                }
                current = current[part];
            } else {
                // Object property
                if (typeof current !== 'object' || !(part in current)) {
                    return { found: false, value: undefined };
                }
                current = current[part];
            }
        }
        
        return { found: true, value: current };
    };

    // Enhanced template processing - replace {{ key }} with data values
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        try {
            const pathStr = path.trim();
            console.log(`🔍 Telegram resolving path: ${pathStr}`);
            
            const pathParts = parsePath(pathStr);
            console.log(`🔧 Telegram parsed path parts:`, pathParts);
            
            // Try direct path resolution
            const result = traversePath(dataToProcess, pathParts);
            console.log(`🎯 Telegram direct path result:`, result);
            
            if (result.found) {
                const resolvedValue = typeof result.value === 'object' ? JSON.stringify(result.value) : String(result.value);
                console.log(`✅ Telegram resolved: ${pathStr} = ${resolvedValue}`);
                return resolvedValue;
            }
            
            // If direct path fails, try nested search in each data node
            for (const [nodeKey, nodeData] of Object.entries(dataToProcess)) {
                if (typeof nodeData === 'object' && nodeData !== null) {
                    const nestedResult = traversePath(nodeData, pathParts);
                    if (nestedResult.found) {
                        const resolvedValue = typeof nestedResult.value === 'object' ? JSON.stringify(nestedResult.value) : String(nestedResult.value);
                        console.log(`✅ Telegram nested resolved: ${pathStr} = ${resolvedValue}`);
                        return resolvedValue;
                    }
                }
            }
            
            console.log(`❌ Telegram path not found: ${pathStr}`);
            return match; // Return original if path not found anywhere
        } catch (error) {
            console.warn(`❌ Template processing error for ${match}:`, error.message);
            return match;
        }
    });
}

function toNumber(value) {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
}

module.exports = telegramSendMessageNode;