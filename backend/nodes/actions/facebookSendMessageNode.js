/*
=================================================================
FILE: backend/nodes/actions/facebookSendMessageNode.js
=================================================================
Facebook Send Message Node - Send messages via Facebook Messenger
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class FacebookSendMessageNode {
    constructor() {
        this.name = 'Facebook Send Message';
        this.type = 'facebookSendMessage';
        this.icon = 'fab fa-facebook-messenger';
        this.description = 'Send messages via Facebook Messenger';
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
                description: 'Facebook Page ID (for Messenger)'
            },
            recipientId: {
                displayName: 'Recipient ID',
                name: 'recipientId',
                type: 'string',
                default: '{{$json.sender_id}}',
                required: true,
                description: 'Facebook User ID to send message to'
            },
            messageText: {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: 'Hello {{$json.sender_name || "there"}}! Thanks for your message.',
                required: false,
                description: 'Message text content (supports expressions)'
            },
            messageType: {
                displayName: 'Message Type',
                name: 'messageType',
                type: 'options',
                options: [
                    { name: 'Text', value: 'text' },
                    { name: 'Image', value: 'image' },
                    { name: 'Video', value: 'video' },
                    { name: 'Audio', value: 'audio' },
                    { name: 'File', value: 'file' },
                    { name: 'Template', value: 'template' },
                    { name: 'Quick Reply', value: 'quick_reply' }
                ],
                default: 'text',
                description: 'Type of message to send'
            },
            mediaUrl: {
                displayName: 'Media URL',
                name: 'mediaUrl',
                type: 'string',
                default: '{{$json.media_url}}',
                description: 'URL of media file (for image/video/audio/file)'
            },
            quickReplies: {
                displayName: 'Quick Replies',
                name: 'quickReplies',
                type: 'string',
                default: '',
                description: 'JSON array of quick reply options'
            },
            template: {
                displayName: 'Template Data',
                name: 'template',
                type: 'string',
                default: '',
                description: 'JSON template data (for template messages)'
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
     * Execute the Facebook Send Message node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Facebook Send Message Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'facebook_message_workflow', name: 'Facebook Send Message', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'facebook_message', type: 'facebookSendMessage' },
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

            console.log('💬 Sending Facebook Messenger message...');

            // Send the message
            const messageResult = await this.sendMessage(
                processedConfig.pageId,
                processedConfig.recipientId,
                processedConfig.messageText,
                processedConfig.messageType,
                processedConfig.mediaUrl,
                processedConfig.quickReplies,
                processedConfig.template,
                processedConfig.notificationType,
                processedConfig.accessToken
            );

            if (!messageResult.success) {
                throw new Error(`Failed to send message: ${messageResult.error}`);
            }

            console.log('✅ Facebook Messenger message sent successfully');

            return {
                success: true,
                data: {
                    message_id: messageResult.data.message_id,
                    recipient_id: processedConfig.recipientId,
                    page_id: processedConfig.pageId,
                    message_text: processedConfig.messageText,
                    message_type: processedConfig.messageType,
                    sent_at: new Date().toISOString()
                },
                nodeType: this.type,
                message: 'Facebook Messenger message sent successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Facebook Send Message Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Send Facebook Messenger message
     */
    async sendMessage(pageId, recipientId, messageText, messageType, mediaUrl, quickReplies, template, notificationType, accessToken) {
        try {
            console.log('📤 Sending message to recipient:', recipientId);

            const messageUrl = `https://graph.facebook.com/v18.0/me/messages`;
            
            let messageData = {
                recipient: {
                    id: recipientId
                },
                message: {},
                notification_type: notificationType,
                access_token: accessToken
            };

            // Build message based on type
            switch (messageType) {
                case 'text':
                    messageData.message.text = messageText;
                    break;
                    
                case 'image':
                case 'video':
                case 'audio':
                case 'file':
                    if (!mediaUrl) {
                        throw new Error(`Media URL is required for ${messageType} messages`);
                    }
                    messageData.message.attachment = {
                        type: messageType,
                        payload: {
                            url: mediaUrl,
                            is_reusable: true
                        }
                    };
                    if (messageText) {
                        // Send text in a separate message for media messages
                        await this.sendTextMessage(recipientId, messageText, accessToken);
                    }
                    break;
                    
                case 'template':
                    if (!template) {
                        throw new Error('Template data is required for template messages');
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
                    messageData.message.text = messageText || 'Please choose an option:';
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
                    messageData.message.text = messageText;
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
                    error: result.error?.message || 'Failed to send message'
                };
            }

            return {
                success: true,
                data: {
                    message_id: result.message_id,
                    recipient_id: recipientId
                }
            };

        } catch (error) {
            console.error('Error in sendMessage:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send simple text message (helper for media messages)
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
        
        const templateFields = ['pageId', 'recipientId', 'messageText', 'mediaUrl', 'quickReplies', 'template', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'facebook_message';
                
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
        
        if (!config.recipientId || config.recipientId.trim() === '') {
            errors.push('Recipient ID is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
        }

        // Validate message content
        const requiresText = ['text', 'quick_reply'];
        const requiresMedia = ['image', 'video', 'audio', 'file'];
        const requiresTemplate = ['template'];

        if (requiresText.includes(config.messageType) && !config.messageText) {
            errors.push(`Message text is required for ${config.messageType} messages`);
        }

        if (requiresMedia.includes(config.messageType) && !config.mediaUrl) {
            errors.push(`Media URL is required for ${config.messageType} messages`);
        }

        if (requiresTemplate.includes(config.messageType) && !config.template) {
            errors.push(`Template data is required for ${config.messageType} messages`);
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
            recipientId: 'recipient_facebook_user_id',
            messageText: 'Hello! Thanks for your message.',
            messageType: 'text',
            mediaUrl: '',
            quickReplies: '',
            template: '',
            notificationType: 'REGULAR',
            accessToken: 'your_facebook_page_access_token'
        };
    }
}

module.exports = new FacebookSendMessageNode();