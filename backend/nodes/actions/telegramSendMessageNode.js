/*
=================================================================
FILE: backend/nodes/actions/telegramSendMessageNode.js
=================================================================
n8n-style Telegram Send Message node implementation with isolated contexts
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class TelegramSendMessageNode {
    constructor() {
        this.name = 'Telegram Send Message';
        this.type = 'telegramSendMessage';
        this.icon = 'fab fa-telegram';
        this.description = 'Send messages via Telegram Bot API';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            chatId: {
                displayName: 'Chat ID',
                name: 'chatId',
                type: 'string',
                default: '{{$json.message.chat.id}}',
                required: true,
                description: 'Chat ID or username to send message to'
            },
            text: {
                displayName: 'Message Text',
                name: 'text',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: 'Hello {{$json.message.from.first_name || "there"}}!',
                required: true,
                description: 'Message content (supports expressions)'
            },
            parseMode: {
                displayName: 'Parse Mode',
                name: 'parseMode',
                type: 'options',
                options: [
                    { name: 'None', value: '' },
                    { name: 'Markdown', value: 'Markdown' },
                    { name: 'MarkdownV2', value: 'MarkdownV2' },
                    { name: 'HTML', value: 'HTML' }
                ],
                default: '',
                description: 'How to parse the message text'
            },
            disableWebPagePreview: {
                displayName: 'Disable Web Page Preview',
                name: 'disableWebPagePreview',
                type: 'boolean',
                default: false,
                description: 'Disable link previews for links in this message'
            },
            disableNotification: {
                displayName: 'Disable Notification',
                name: 'disableNotification',
                type: 'boolean',
                default: false,
                description: 'Send message silently (no sound/vibration)'
            },
            replyToMessageId: {
                displayName: 'Reply To Message ID',
                name: 'replyToMessageId',
                type: 'string',
                default: '{{$json.message.message_id}}',
                description: 'Message ID to reply to (optional)'
            },
            botToken: {
                displayName: 'Bot Token',
                name: 'botToken',
                type: 'string',
                default: '{{$env.TELEGRAM_BOT_TOKEN}}',
                required: true,
                description: 'Telegram Bot API Token'
            }
        };
    }

    /**
     * Execute the Telegram Send Message node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Telegram Send Message Node');
        console.log('Config:', JSON.stringify(config, null, 2));
        console.log('Input data:', JSON.stringify(inputData, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'telegram_workflow', name: 'Telegram Send', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'telegram_send', type: 'telegramSendMessage' },
                    allNodes,
                    workflowData
                );
            }

            // Process templates with isolated context
            const processedConfig = this.processConfigTemplates(config, inputData, executionContext);
            
            console.log('🔒 Processed config with n8n context:', processedConfig);

            // Validate required parameters
            const validation = this.validateParameters(processedConfig, inputData);
            if (!validation.valid) {
                throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
            }

            // Send message to Telegram
            const result = await this.sendTelegramMessage(processedConfig);
            
            return {
                success: true,
                data: {
                    messageId: result.message_id,
                    chatId: result.chat.id,
                    text: result.text,
                    date: result.date,
                    sentAt: new Date().toISOString()
                },
                telegram: result,
                nodeType: this.type,
                message: 'Message sent successfully'
            };

        } catch (error) {
            console.error('❌ Telegram Send Message Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        // Map frontend field names to backend field names
        if (processed.messageText) {
            processed.text = processed.messageText;
            console.log(`🔄 Mapped messageText: "${processed.messageText}" → text: "${processed.text}"`);
        }
        
        // Additional debug logging
        console.log('🔍 Available config fields:', Object.keys(processed));
        console.log('🔍 Text field value before processing:', processed.text);
        console.log('🔍 MessageText field value:', processed.messageText);
        
        // Fields that support template expressions
        const templateFields = ['chatId', 'text', 'replyToMessageId', 'botToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                // Use the actual node ID from the execution context
                const actualNodeId = executionContext.currentNode?.id || 'telegram_send_fallback';
                console.log(`🔧 Telegram node using actual nodeId: ${actualNodeId} for field: ${field}`);
                
                const resolvedValue = executionContext.evaluateExpression(
                    originalValue, 
                    actualNodeId, 
                    inputData, 
                    0
                );
                
                console.log(`🔧 Template resolved: ${field}: "${originalValue}" → "${resolvedValue}"`);
                processed[field] = resolvedValue;
            }
        });
        
        // Debug final processed values
        console.log('🔍 Final text field value after processing:', processed.text);
        console.log('🔍 Final chatId field value after processing:', processed.chatId);

        return processed;
    }

    /**
     * Validate required parameters
     */
    validateParameters(config, inputData = null) {
        const errors = [];
        
        // Debug validation inputs
        console.log('🔍 Validating config:', {
            hasText: !!config.text,
            textValue: config.text,
            textType: typeof config.text,
            hasChatId: !!config.chatId,
            chatIdValue: config.chatId,
            allFields: Object.keys(config)
        });
        
        if (!config.chatId || config.chatId.trim() === '') {
            errors.push('Chat ID is required');
        }
        
        if (!config.text || config.text.trim() === '') {
            console.log('❌ Text validation failed - text field:', config.text);
            errors.push('Message text is required');
        }
        
        // Auto-provide bot token if none configured
        if (!config.botToken || config.botToken.trim() === '') {
            // Try to find bot token from trigger node in inputData
            const triggerBotToken = inputData?.trigger?.data?.botToken || 
                                   inputData?.triggerData?.data?.botToken ||
                                   inputData?.telegram?.data?.botToken;
            
            if (triggerBotToken && triggerBotToken.trim() !== '') {
                console.log('🔧 Using bot token from trigger node');
                config.botToken = triggerBotToken;
            } else {
                console.log('❌ No bot token provided - bot token is required');
                errors.push('Bot token is required. Please configure bot token in the Telegram trigger node or this node.');
            }
        }
        
        // Validate parse mode
        const validParseModes = ['', 'Markdown', 'MarkdownV2', 'HTML'];
        if (config.parseMode && !validParseModes.includes(config.parseMode)) {
            errors.push(`Invalid parse mode: ${config.parseMode}`);
        }
        
        // Validate chat ID format
        if (config.chatId && !this.isValidChatId(config.chatId)) {
            errors.push('Invalid chat ID format');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate chat ID format
     */
    isValidChatId(chatId) {
        // Numeric chat ID (positive or negative)
        if (/^-?\d+$/.test(chatId)) {
            return true;
        }
        
        // Username format (@username)
        if (/^@[a-zA-Z0-9_]{5,32}$/.test(chatId)) {
            return true;
        }
        
        // Channel username format
        if (/^[a-zA-Z0-9_]{5,32}$/.test(chatId)) {
            return true;
        }
        
        return false;
    }

    /**
     * Send message to Telegram Bot API
     */
    async sendTelegramMessage(config) {
        const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
        
        // Build request body
        const body = {
            chat_id: config.chatId,
            text: config.text
        };
        
        // Add optional parameters
        if (config.parseMode && config.parseMode.trim() !== '') {
            body.parse_mode = config.parseMode;
        }
        
        if (config.disableWebPagePreview === true) {
            body.disable_web_page_preview = true;
        }
        
        if (config.disableNotification === true) {
            body.disable_notification = true;
        }
        
        if (config.replyToMessageId && config.replyToMessageId.trim() !== '') {
            body.reply_to_message_id = parseInt(config.replyToMessageId, 10);
        }

        console.log('📤 Sending to Telegram API:', { url: url.replace(/bot\d+:/, 'bot[HIDDEN]:'), body });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Workflow-Builder/1.0'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                const errorMsg = data.description || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(`Telegram API Error: ${errorMsg}`);
            }

            console.log('✅ Telegram API Response:', {
                messageId: data.result.message_id,
                chatId: data.result.chat.id,
                success: true
            });

            console.log('🔄 CHECKPOINT 1: After Telegram API success');

            // CRITICAL: Also save the workflow response to Live Chat database
            console.log('🚨 LIVE CHAT INTEGRATION: About to call saveTelegramResponseToLiveChat...');
            console.log('🚨 Params: config.chatId =', config.chatId, ', data.result.chat.id =', data.result?.chat?.id, ', inputData exists =', !!inputData);
            try {
                await this.saveTelegramResponseToLiveChat(config, data.result, inputData);
                console.log('✅ LIVE CHAT INTEGRATION: saveTelegramResponseToLiveChat completed successfully');
            } catch (liveChatError) {
                console.error('❌ LIVE CHAT INTEGRATION ERROR:', liveChatError.message);
                console.error('❌ Full error stack:', liveChatError);
            }

            console.log('🔄 CHECKPOINT 2: Before returning data.result');
            return data.result;

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to Telegram API');
            }
            throw error;
        }
    }

    /**
     * Save Telegram response to Live Chat database - OPTION 3: API Response Interception
     */
    async saveTelegramResponseToLiveChat(config, telegramResult, inputData = null) {
        try {
            console.log('🚨 OPTION 3: API Response Interception - Starting bot message capture');
            console.log('🚨 Config chatId:', config.chatId);
            console.log('🚨 Telegram result:', telegramResult);
            
            const db = require('../../db');
            
            // Extract chat ID from successful Telegram API response
            let chatId = null;
            let chatInfo = null;
            
            // Priority 1: From successful Telegram API response (most reliable)
            if (telegramResult && telegramResult.chat && telegramResult.chat.id) {
                chatId = telegramResult.chat.id.toString();
                chatInfo = telegramResult.chat;
                console.log('🚨 OPTION 3: Found chatId from Telegram API response:', chatId);
            }
            // Priority 2: From config (manual execution)
            else if (config.chatId) {
                chatId = config.chatId.toString();
                console.log('🚨 OPTION 3: Using chatId from config (manual execution):', chatId);
            }
            
            if (!chatId) {
                console.log('🚨 OPTION 3: ⚠️ No chat ID found - skipping Live Chat integration');
                return;
            }
            
            // OPTION 3 ENHANCEMENT: Create conversation if it doesn't exist
            let conversation = await this.findOrCreateConversation(db, chatId, chatInfo, telegramResult);
            
            if (conversation) {
                // Save the bot message to Live Chat
                await this.saveBotMessageToConversation(db, conversation, telegramResult, config);
                console.log('🚨 OPTION 3: ✅ Bot message successfully saved to Live Chat');
            } else {
                console.log('🚨 OPTION 3: ❌ Failed to create/find conversation for chat ID:', chatId);
            }
            
        } catch (error) {
            console.error('🚨 OPTION 3: ❌ API Response Interception failed:', error.message);
            console.error('🚨 OPTION 3: ❌ Full error stack:', error);
            // Don't throw error to prevent workflow failure
        }
    }

    /**
     * Find existing conversation or create new one for bot message
     */
    async findOrCreateConversation(db, chatId, chatInfo = null, telegramResult = null) {
        try {
            // First, try to find existing conversation
            const findSql = `
                SELECT id, user_id FROM telegram_conversations 
                WHERE telegram_chat_id = ? 
                ORDER BY updated_at DESC 
                LIMIT 1
            `;
            
            let conversation = await new Promise((resolve, reject) => {
                db.get(findSql, [chatId], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            if (conversation) {
                console.log('🚨 OPTION 3: Found existing conversation:', conversation.id);
                return conversation;
            }
            
            // If no conversation exists, create one based on the bot interaction
            console.log('🚨 OPTION 3: No existing conversation found, creating new one for chat ID:', chatId);
            
            // Determine user info from chat data
            let firstName = 'Unknown';
            let lastName = '';
            let username = '';
            
            if (chatInfo) {
                firstName = chatInfo.first_name || 'Unknown';
                lastName = chatInfo.last_name || '';
                username = chatInfo.username || '';
            } else if (telegramResult && telegramResult.chat) {
                firstName = telegramResult.chat.first_name || 'Unknown';
                lastName = telegramResult.chat.last_name || '';
                username = telegramResult.chat.username || '';
            }
            
            // For bot-initiated conversations, we need to determine the user_id
            // Strategy: Use a default user (user_id = 2) or derive from bot token
            let userId = 2; // Default to user ID 2 (from previous data)
            
            // TODO: In the future, we could derive user_id from bot token by looking up which user owns this bot
            // For now, we'll use the default user that owns the connected bot
            
            const createSql = `
                INSERT INTO telegram_conversations 
                (user_id, telegram_chat_id, telegram_username, telegram_first_name, telegram_last_name, 
                 last_message_text, last_message_timestamp, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'automated', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;
            
            const conversationId = await new Promise((resolve, reject) => {
                db.run(createSql, [
                    userId,
                    chatId,
                    username,
                    firstName,
                    lastName,
                    telegramResult.text || ''
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });
            
            console.log('🚨 OPTION 3: ✅ Created new conversation:', conversationId);
            return { id: conversationId, user_id: userId };
            
        } catch (error) {
            console.error('🚨 OPTION 3: ❌ Error in findOrCreateConversation:', error);
            return null;
        }
    }

    /**
     * Save bot message to conversation
     */
    async saveBotMessageToConversation(db, conversation, telegramResult, config) {
        try {
            const messageSql = `
                INSERT INTO telegram_messages 
                (conversation_id, sender_type, sender_name, message_text, telegram_message_id, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const metadata = JSON.stringify({
                telegram_response: telegramResult,
                source: 'api_response_interception',
                execution_type: 'manual_execution', // Could be 'workflow_automation' or 'manual_execution'
                sent_at: new Date().toISOString(),
                message_type: 'bot_response',
                bot_info: {
                    id: telegramResult.from?.id,
                    username: telegramResult.from?.username,
                    first_name: telegramResult.from?.first_name
                }
            });
            
            const messageId = await new Promise((resolve, reject) => {
                db.run(messageSql, [
                    conversation.id,
                    'bot',
                    telegramResult.from?.first_name || 'Workflow Bot',
                    telegramResult.text,
                    telegramResult.message_id,
                    metadata
                ], function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            });
            
            // Update conversation's last message
            const updateSql = `
                UPDATE telegram_conversations 
                SET last_message_text = ?, 
                    last_message_timestamp = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            await new Promise((resolve, reject) => {
                db.run(updateSql, [telegramResult.text, conversation.id], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log('🚨 OPTION 3: ✅ Bot message saved with ID:', messageId);
            
        } catch (error) {
            console.error('🚨 OPTION 3: ❌ Error saving bot message:', error);
            throw error;
        }
    }

    /**
     * Build nodes map from connected nodes
     */
    buildNodesMap(connectedNodes) {
        const nodesMap = {};
        
        if (Array.isArray(connectedNodes)) {
            connectedNodes.forEach(nodeData => {
                if (nodeData && nodeData.nodeId) {
                    nodesMap[nodeData.nodeId] = {
                        type: nodeData.nodeType,
                        data: { label: nodeData.nodeLabel },
                        outputData: nodeData.data,
                        config: nodeData.config || {}
                    };
                }
            });
        }

        return nodesMap;
    }

    /**
     * Get sample configuration for testing
     */
    getSampleConfig() {
        return {
            chatId: '123456789',
            text: 'Hello from n8n-style Telegram node!',
            parseMode: 'MarkdownV2',
            disableWebPagePreview: false,
            disableNotification: false,
            replyToMessageId: '',
            botToken: 'YOUR_BOT_TOKEN'
        };
    }

    /**
     * Get mock input data for testing
     */
    getMockInputData() {
        return {
            message: {
                message_id: 123,
                chat: { id: 123456789, type: 'private' },
                from: { id: 987654321, first_name: 'John', username: 'johndoe' },
                text: 'Hello bot!',
                date: Math.floor(Date.now() / 1000)
            },
            update_id: 123456
        };
    }

    /**
     * Rate limiting helper (for production use)
     */
    async rateLimitDelay() {
        // Telegram allows ~30 messages per second
        // Add a small delay to prevent hitting limits
        return new Promise(resolve => setTimeout(resolve, 50));
    }
}

module.exports = new TelegramSendMessageNode();