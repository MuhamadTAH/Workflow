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
        this.description = 'Send text messages, photos, documents, voice messages, and audio files via Telegram Bot API';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            messageType: {
                displayName: 'Message Type',
                name: 'messageType',
                type: 'options',
                options: [
                    { name: 'Text Message', value: 'text' },
                    { name: 'Photo', value: 'photo' },
                    { name: 'Document/PDF', value: 'document' },
                    { name: 'Voice Message', value: 'voice' },
                    { name: 'Audio File', value: 'audio' }
                ],
                default: 'text',
                required: true,
                description: 'Type of message to send'
            },
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
                required: false,
                description: 'Message content (supports expressions)',
                displayOptions: {
                    show: {
                        messageType: ['text']
                    }
                }
            },
            mediaFile: {
                displayName: 'Media File',
                name: 'mediaFile',
                type: 'string',
                default: '',
                required: false,
                description: 'File path or URL to media file',
                displayOptions: {
                    show: {
                        messageType: ['photo', 'document', 'voice', 'audio']
                    }
                }
            },
            caption: {
                displayName: 'Caption',
                name: 'caption',
                type: 'string',
                typeOptions: {
                    rows: 2
                },
                default: '',
                required: false,
                description: 'Caption for media (supports expressions)',
                displayOptions: {
                    show: {
                        messageType: ['photo', 'document', 'voice', 'audio']
                    }
                }
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

            // Send message to Telegram based on type
            const result = await this.sendTelegramMessage(processedConfig);
            
            return {
                success: true,
                data: {
                    messageId: result.message_id,
                    chatId: result.chat.id,
                    text: result.text || result.caption || 'Media sent',
                    date: result.date,
                    sentAt: new Date().toISOString(),
                    messageType: processedConfig.messageType || 'text'
                },
                telegram: result,
                nodeType: this.type,
                message: `${processedConfig.messageType || 'text'} message sent successfully`
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
        const templateFields = ['chatId', 'text', 'mediaFile', 'caption', 'replyToMessageId', 'botToken'];
        
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
        
        // Validate based on message type
        const messageType = config.messageType || 'text';
        
        if (messageType === 'text') {
            if (!config.text || config.text.trim() === '') {
                console.log('❌ Text validation failed - text field:', config.text);
                errors.push('Message text is required for text messages');
            }
        } else {
            // For media messages, validate mediaFile
            if (!config.mediaFile || config.mediaFile.trim() === '') {
                console.log('❌ Media validation failed - mediaFile field:', config.mediaFile);
                errors.push(`Media file is required for ${messageType} messages`);
            } else {
                // Validate file based on message type
                const fileValidation = this.validateMediaFile(config.mediaFile, messageType);
                if (!fileValidation.valid) {
                    errors.push(...fileValidation.errors);
                }
            }
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
     * Validate media file based on message type
     */
    validateMediaFile(mediaFile, messageType) {
        const errors = [];
        
        // Check if it's a URL
        if (mediaFile.startsWith('http://') || mediaFile.startsWith('https://')) {
            console.log('📡 Media file is URL, skipping local file validation');
            return { valid: true, errors: [] };
        }

        const fs = require('fs');
        const path = require('path');

        // Check if file exists (for local files)
        if (!fs.existsSync(mediaFile)) {
            errors.push(`File not found: ${mediaFile}`);
            return { valid: false, errors };
        }

        // Get file stats
        const stats = fs.statSync(mediaFile);
        const fileSize = stats.size;
        const fileExtension = path.extname(mediaFile).toLowerCase();

        // Telegram file size limits (in bytes)
        const MAX_PHOTO_SIZE = 10 * 1024 * 1024;      // 10MB for photos
        const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;    // 50MB for documents
        const MAX_VOICE_SIZE = 1 * 1024 * 1024;        // 1MB for voice (OGG/OPUS only)
        const MAX_AUDIO_SIZE = 50 * 1024 * 1024;       // 50MB for audio

        // File type validations
        const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.zip', '.rar']; // Add more as needed
        const VOICE_EXTENSIONS = ['.ogg']; // Telegram voice messages must be OGG/OPUS
        const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.aac', '.ogg', '.wav', '.flac'];

        switch (messageType) {
            case 'photo':
                if (fileSize > MAX_PHOTO_SIZE) {
                    errors.push(`Photo file too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB (max: 10MB)`);
                }
                if (!PHOTO_EXTENSIONS.includes(fileExtension)) {
                    errors.push(`Invalid photo format: ${fileExtension}. Supported: ${PHOTO_EXTENSIONS.join(', ')}`);
                }
                break;

            case 'document':
                if (fileSize > MAX_DOCUMENT_SIZE) {
                    errors.push(`Document file too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB (max: 50MB)`);
                }
                // Documents can be any file type, so no extension validation
                break;

            case 'voice':
                if (fileSize > MAX_VOICE_SIZE) {
                    errors.push(`Voice file too large: ${(fileSize / 1024).toFixed(2)}KB (max: 1MB)`);
                }
                if (!VOICE_EXTENSIONS.includes(fileExtension)) {
                    errors.push(`Invalid voice format: ${fileExtension}. Telegram voice messages must be OGG/OPUS format`);
                }
                break;

            case 'audio':
                if (fileSize > MAX_AUDIO_SIZE) {
                    errors.push(`Audio file too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB (max: 50MB)`);
                }
                if (!AUDIO_EXTENSIONS.includes(fileExtension)) {
                    errors.push(`Invalid audio format: ${fileExtension}. Supported: ${AUDIO_EXTENSIONS.join(', ')}`);
                }
                break;

            default:
                errors.push(`Unknown media type: ${messageType}`);
        }

        console.log(`📁 File validation for ${messageType}:`, {
            file: mediaFile,
            size: `${(fileSize / 1024 / 1024).toFixed(2)}MB`,
            extension: fileExtension,
            valid: errors.length === 0
        });

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
     * Send message to Telegram Bot API based on message type
     */
    async sendTelegramMessage(config) {
        console.log('📤 Sending to Telegram API with type:', config.messageType || 'text');
        
        const { TelegramAPI } = require('../../services/telegramAPI');
        const telegramAPI = new TelegramAPI(config.botToken);
        
        // Prepare options
        const options = {};
        
        if (config.parseMode && config.parseMode.trim() !== '') {
            options.parse_mode = config.parseMode;
        }
        
        if (config.disableWebPagePreview === true) {
            options.disable_web_page_preview = true;
        }
        
        if (config.disableNotification === true) {
            options.disable_notification = true;
        }
        
        if (config.replyToMessageId && config.replyToMessageId.trim() !== '') {
            options.reply_to_message_id = parseInt(config.replyToMessageId, 10);
        }

        let result;
        const messageType = config.messageType || 'text';

        try {
            switch (messageType) {
                case 'text':
                    if (!config.text || config.text.trim() === '') {
                        throw new Error('Text message requires text content');
                    }
                    result = await telegramAPI.sendMessage(config.chatId, config.text, options);
                    break;

                case 'photo':
                    if (!config.mediaFile || config.mediaFile.trim() === '') {
                        throw new Error('Photo message requires mediaFile path or URL');
                    }
                    if (config.caption) options.caption = config.caption;
                    result = await telegramAPI.sendPhoto(config.chatId, config.mediaFile, options);
                    break;

                case 'document':
                    if (!config.mediaFile || config.mediaFile.trim() === '') {
                        throw new Error('Document message requires mediaFile path or URL');
                    }
                    if (config.caption) options.caption = config.caption;
                    result = await telegramAPI.sendDocument(config.chatId, config.mediaFile, options);
                    break;

                case 'voice':
                    if (!config.mediaFile || config.mediaFile.trim() === '') {
                        throw new Error('Voice message requires mediaFile path or URL');
                    }
                    if (config.caption) options.caption = config.caption;
                    result = await telegramAPI.sendVoice(config.chatId, config.mediaFile, options);
                    break;

                case 'audio':
                    if (!config.mediaFile || config.mediaFile.trim() === '') {
                        throw new Error('Audio message requires mediaFile path or URL');
                    }
                    if (config.caption) options.caption = config.caption;
                    result = await telegramAPI.sendAudio(config.chatId, config.mediaFile, options);
                    break;

                default:
                    throw new Error(`Unsupported message type: ${messageType}`);
            }

            if (!result.success) {
                throw new Error(result.error?.message || 'Failed to send message');
            }

            const telegramResult = result.data.result;
            
            console.log('✅ Telegram API Response:', {
                messageId: telegramResult.message_id,
                chatId: telegramResult.chat.id,
                messageType: messageType,
                success: true
            });

            // CRITICAL: Save the workflow response to Live Chat database
            try {
                await this.saveTelegramResponseToLiveChat(config, telegramResult, this.inputData);
                console.log('✅ LIVE CHAT INTEGRATION: saveTelegramResponseToLiveChat completed successfully');
            } catch (liveChatError) {
                console.error('❌ LIVE CHAT INTEGRATION ERROR:', liveChatError.message);
                console.error('❌ Full error stack:', liveChatError);
            }

            return telegramResult;

        } catch (error) {
            console.error('❌ Telegram API Error:', error.message);
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
            messageType: 'text',
            chatId: '123456789',
            text: 'Hello from enhanced Telegram node!',
            mediaFile: '', // For photo/document/voice/audio
            caption: '', // For media captions
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