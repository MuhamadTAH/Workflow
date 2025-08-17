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
                console.log('🔧 No bot token provided, using system default');
                config.botToken = '8148982414:AAEPKCLwwxiMp0KH3wKqrqdTnPI3W3E_0VQ';
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

            return data.result;

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to Telegram API');
            }
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