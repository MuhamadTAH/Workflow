/*
=================================================================
FILE: backend/nodes/actions/facebookReplyMessageNode.js
=================================================================
Facebook Reply Message Node - Reply to specific Facebook Messenger messages
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class FacebookReplyMessageNode {
    constructor() {
        this.name = 'Facebook Reply Message';
        this.type = 'facebookReplyMessage';
        this.icon = 'fab fa-facebook-messenger';
        this.description = 'Reply to specific Facebook Messenger messages';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            pageId: {
                displayName: 'Page ID',
                name: 'pageId',
                type: 'string',
                default: '{{$json.page_id}}',
                required: true,
                description: 'Facebook Page ID'
            },
            originalMessageId: {
                displayName: 'Original Message ID',
                name: 'originalMessageId',
                type: 'string',
                default: '{{$json.message_id}}',
                required: true,
                description: 'ID of the message to reply to'
            },
            senderId: {
                displayName: 'Original Sender ID',
                name: 'senderId',
                type: 'string',
                default: '{{$json.sender_id}}',
                required: true,
                description: 'ID of the original message sender'
            },
            replyText: {
                displayName: 'Reply Message',
                name: 'replyText',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: 'Thank you for your message! {{$json.sender_name ? "Hi " + $json.sender_name + "!" : ""}}',
                required: false,
                description: 'Reply message text (supports expressions)'
            },
            replyType: {
                displayName: 'Reply Type',
                name: 'replyType',
                type: 'options',
                options: [
                    { name: 'Text Reply', value: 'text' },
                    { name: 'Image Reply', value: 'image' },
                    { name: 'Video Reply', value: 'video' },
                    { name: 'Audio Reply', value: 'audio' },
                    { name: 'File Reply', value: 'file' },
                    { name: 'Template Reply', value: 'template' },
                    { name: 'Quick Reply', value: 'quick_reply' },
                    { name: 'Reaction Only', value: 'reaction' }
                ],
                default: 'text',
                description: 'Type of reply to send'
            },
            mediaUrl: {
                displayName: 'Media URL',
                name: 'mediaUrl',
                type: 'string',
                default: '{{$json.media_url}}',
                description: 'URL of media file (for image/video/audio/file replies)'
            },
            reaction: {
                displayName: 'Reaction Emoji',
                name: 'reaction',
                type: 'options',
                options: [
                    { name: 'Like 👍', value: 'like' },
                    { name: 'Love ❤️', value: 'love' },
                    { name: 'Laugh 😆', value: 'haha' },
                    { name: 'Wow 😮', value: 'wow' },
                    { name: 'Sad 😢', value: 'sad' },
                    { name: 'Angry 😠', value: 'angry' },
                    { name: 'Remove Reaction', value: 'remove' }
                ],
                default: 'like',
                description: 'Reaction emoji to add to the original message'
            },
            template: {
                displayName: 'Template Data',
                name: 'template',
                type: 'string',
                default: '',
                description: 'JSON template data (for template replies)'
            },
            quickReplies: {
                displayName: 'Quick Replies',
                name: 'quickReplies',
                type: 'string',
                default: '',
                description: 'JSON array of quick reply options'
            },
            includeContext: {
                displayName: 'Include Original Context',
                name: 'includeContext',
                type: 'boolean',
                default: false,
                description: 'Include reference to original message in reply'
            },
            contextText: {
                displayName: 'Context Text',
                name: 'contextText',
                type: 'string',
                default: 'Regarding your message: "{{$json.original_message}}"',
                description: 'Context text template (when include context is enabled)'
            },
            notificationType: {
                displayName: 'Notification Type',
                name: 'notificationType',
                type: 'options',
                options: [
                    { name: 'Regular', value: 'REGULAR' },
                    { name: 'Silent Push', value: 'SILENT_PUSH' },
                    { name: 'No Push', value: 'NO_PUSH' }
                ],
                default: 'REGULAR',
                description: 'Type of push notification'
            },
            accessToken: {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                default: '{{$env.FACEBOOK_PAGE_ACCESS_TOKEN}}',
                required: true,
                description: 'Facebook Page Access Token'
            }
        };
    }

    /**
     * Execute the Facebook Reply Message node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Facebook Reply Message Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'facebook_reply_workflow', name: 'Facebook Reply Message', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'facebook_reply', type: 'facebookReplyMessage' },
                    allNodes,
                    workflowData
                );
            }

            // Process templates with isolated context
            const processedConfig = this.processConfigTemplates(config, inputData, executionContext);
            
            console.log('🔒 Processed config:', processedConfig);

            // Validate required parameters
            const validation = this.validateParameters(processedConfig);
            if (!validation.valid) {
                throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
            }

            console.log('💬 Sending Facebook Messenger reply...');

            // Send the reply
            const replyResult = await this.sendReply(
                processedConfig.pageId,
                processedConfig.originalMessageId,
                processedConfig.senderId,
                processedConfig.replyText,
                processedConfig.replyType,
                processedConfig.mediaUrl,
                processedConfig.reaction,
                processedConfig.template,
                processedConfig.quickReplies,
                processedConfig.includeContext,
                processedConfig.contextText,
                processedConfig.notificationType,
                processedConfig.accessToken
            );

            if (!replyResult.success) {
                throw new Error(`Failed to send reply: ${replyResult.error}`);
            }

            console.log('✅ Facebook Messenger reply sent successfully');

            return {
                success: true,
                data: {
                    reply_message_id: replyResult.data.reply_message_id,
                    reaction_success: replyResult.data.reaction_success,
                    original_message_id: processedConfig.originalMessageId,
                    sender_id: processedConfig.senderId,
                    page_id: processedConfig.pageId,
                    reply_text: processedConfig.replyText,
                    reply_type: processedConfig.replyType,
                    sent_at: new Date().toISOString()
                },
                nodeType: this.type,
                message: 'Facebook Messenger reply sent successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Facebook Reply Message Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Send Facebook Messenger reply
     */
    async sendReply(pageId, originalMessageId, senderId, replyText, replyType, mediaUrl, reaction, template, quickReplies, includeContext, contextText, notificationType, accessToken) {
        try {
            console.log('📤 Sending reply to sender:', senderId);

            let replyMessageId = null;
            let reactionSuccess = false;

            // First, add reaction to original message if reaction type is specified
            if (replyType === 'reaction' || (replyType !== 'reaction' && reaction !== 'remove')) {
                try {
                    const reactionResult = await this.addReaction(originalMessageId, reaction, accessToken);
                    reactionSuccess = reactionResult.success;
                    
                    if (replyType === 'reaction') {
                        // If only reaction, return here
                        return {
                            success: true,
                            data: {
                                reply_message_id: null,
                                reaction_success: reactionSuccess,
                                reaction_type: reaction
                            }
                        };
                    }
                } catch (reactionError) {
                    console.warn('Failed to add reaction:', reactionError.message);
                }
            }

            // Prepare reply message content
            let finalReplyText = replyText;
            if (includeContext && contextText) {
                finalReplyText = `${contextText}\n\n${replyText}`;
            }

            // Send reply message
            const messageUrl = `https://graph.facebook.com/v18.0/me/messages`;
            
            let messageData = {
                recipient: {
                    id: senderId
                },
                message: {},
                notification_type: notificationType,
                access_token: accessToken
            };

            // Build message based on reply type
            switch (replyType) {
                case 'text':
                    messageData.message.text = finalReplyText;
                    break;
                    
                case 'image':
                case 'video':
                case 'audio':
                case 'file':
                    if (!mediaUrl) {
                        throw new Error(`Media URL is required for ${replyType} replies`);
                    }
                    messageData.message.attachment = {
                        type: replyType,
                        payload: {
                            url: mediaUrl,
                            is_reusable: true
                        }
                    };
                    if (finalReplyText) {
                        // Send text in a separate message for media replies
                        await this.sendTextMessage(senderId, finalReplyText, accessToken);
                    }
                    break;
                    
                case 'template':
                    if (!template) {
                        throw new Error('Template data is required for template replies');
                    }
                    try {
                        const templateData = JSON.parse(template);
                        messageData.message.attachment = {
                            type: 'template',
                            payload: templateData
                        };
                    } catch (e) {
                        throw new Error('Invalid template JSON format');
                    }
                    break;
                    
                case 'quick_reply':
                    messageData.message.text = finalReplyText || 'Please choose an option:';
                    if (quickReplies) {
                        try {
                            const replies = JSON.parse(quickReplies);
                            messageData.message.quick_replies = replies;
                        } catch (e) {
                            throw new Error('Invalid quick replies JSON format');
                        }
                    }
                    break;
                    
                default:
                    messageData.message.text = finalReplyText;
            }

            const response = await fetch(messageUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to send reply message'
                };
            }

            replyMessageId = result.message_id;

            return {
                success: true,
                data: {
                    reply_message_id: replyMessageId,
                    reaction_success: reactionSuccess,
                    sender_id: senderId
                }
            };

        } catch (error) {
            console.error('Error in sendReply:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Add reaction to original message
     */
    async addReaction(messageId, reactionType, accessToken) {
        try {
            const reactionUrl = `https://graph.facebook.com/v18.0/${messageId}/reactions`;
            
            const reactionData = {
                type: reactionType,
                access_token: accessToken
            };

            const method = reactionType === 'remove' ? 'DELETE' : 'POST';
            
            const response = await fetch(reactionUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reactionData)
            });

            const result = await response.json();

            return {
                success: response.ok,
                data: result
            };

        } catch (error) {
            console.error('Error adding reaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send simple text message (helper for media replies)
     */
    async sendTextMessage(recipientId, text, accessToken) {
        try {
            const messageUrl = `https://graph.facebook.com/v18.0/me/messages`;
            const messageData = {
                recipient: { id: recipientId },
                message: { text: text },
                access_token: accessToken
            };

            await fetch(messageUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });
        } catch (error) {
            console.error('Error sending text message:', error);
        }
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['pageId', 'originalMessageId', 'senderId', 'replyText', 'mediaUrl', 'template', 'quickReplies', 'contextText', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'facebook_reply';
                
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

        return processed;
    }

    /**
     * Validate required parameters
     */
    validateParameters(config) {
        const errors = [];
        
        if (!config.pageId || config.pageId.trim() === '') {
            errors.push('Facebook Page ID is required');
        }
        
        if (!config.originalMessageId || config.originalMessageId.trim() === '') {
            errors.push('Original Message ID is required');
        }
        
        if (!config.senderId || config.senderId.trim() === '') {
            errors.push('Sender ID is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
        }

        // Validate reply content based on type
        const requiresText = ['text', 'quick_reply'];
        const requiresMedia = ['image', 'video', 'audio', 'file'];
        const requiresTemplate = ['template'];

        if (requiresText.includes(config.replyType) && !config.replyText) {
            errors.push(`Reply text is required for ${config.replyType} replies`);
        }

        if (requiresMedia.includes(config.replyType) && !config.mediaUrl) {
            errors.push(`Media URL is required for ${config.replyType} replies`);
        }

        if (requiresTemplate.includes(config.replyType) && !config.template) {
            errors.push(`Template data is required for ${config.replyType} replies`);
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
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
            pageId: 'your_facebook_page_id',
            originalMessageId: 'original_message_id_to_reply_to',
            senderId: 'sender_facebook_user_id',
            replyText: 'Thank you for your message!',
            replyType: 'text',
            mediaUrl: '',
            reaction: 'like',
            template: '',
            quickReplies: '',
            includeContext: false,
            contextText: 'Regarding your message: "{{$json.original_message}}"',
            notificationType: 'REGULAR',
            accessToken: 'your_facebook_page_access_token'
        };
    }
}

module.exports = new FacebookReplyMessageNode();