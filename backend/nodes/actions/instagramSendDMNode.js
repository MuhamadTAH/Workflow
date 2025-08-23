/*
=================================================================
FILE: backend/nodes/actions/instagramSendDMNode.js
=================================================================
Instagram Send DM Node - Send direct messages via Instagram
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');
const { InstagramAPI } = require('../../services/instagramAPI');

class InstagramSendDMNode {
    constructor() {
        this.name = 'Instagram Send DM';
        this.type = 'instagramSendDM';
        this.icon = 'fab fa-instagram';
        this.description = 'Send direct messages via Instagram';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            accountId: {
                displayName: 'Instagram Account ID',
                name: 'accountId',
                type: 'string',
                default: '',
                required: true,
                description: 'Instagram Business Account ID'
            },
            recipientId: {
                displayName: 'Recipient ID',
                name: 'recipientId',
                type: 'string',
                default: '{{$json.sender_id}}',
                required: true,
                description: 'Instagram User ID to send message to'
            },
            messageText: {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: 'Hello {{$json.sender_name || "there"}}! Thanks for your message.',
                required: true,
                description: 'Message content (supports expressions)'
            },
            messageType: {
                displayName: 'Message Type',
                name: 'messageType',
                type: 'options',
                options: [
                    { name: 'Text', value: 'text' },
                    { name: 'Image', value: 'image' },
                    { name: 'Video', value: 'video' },
                    { name: 'Audio', value: 'audio' }
                ],
                default: 'text',
                description: 'Type of message to send'
            },
            mediaUrl: {
                displayName: 'Media URL',
                name: 'mediaUrl',
                type: 'string',
                default: '',
                description: 'URL of media file (for image/video/audio messages)'
            },
            accessToken: {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                default: '{{$env.INSTAGRAM_ACCESS_TOKEN}}',
                required: true,
                description: 'Instagram API Access Token'
            }
        };
    }

    /**
     * Execute the Instagram Send DM node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Instagram Send DM Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'instagram_send_dm_workflow', name: 'Instagram Send DM', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'instagram_send_dm', type: 'instagramSendDM' },
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

            // Initialize Instagram API
            const instagramAPI = new InstagramAPI(processedConfig.accessToken);

            console.log('📤 Sending Instagram DM...');

            // Send the direct message
            const sendResult = await this.sendDirectMessage(
                instagramAPI,
                processedConfig.accountId,
                processedConfig.recipientId,
                processedConfig.messageText,
                processedConfig.messageType,
                processedConfig.mediaUrl,
                processedConfig.accessToken
            );

            if (!sendResult.success) {
                throw new Error(`Failed to send DM: ${sendResult.error}`);
            }

            console.log('✅ Instagram DM sent successfully');

            return {
                success: true,
                data: {
                    message_id: sendResult.data.message_id,
                    recipient_id: processedConfig.recipientId,
                    message_text: processedConfig.messageText,
                    message_type: processedConfig.messageType,
                    sent_at: new Date().toISOString(),
                    account_id: processedConfig.accountId
                },
                nodeType: this.type,
                message: 'Instagram DM sent successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Instagram Send DM Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Send direct message via Instagram API
     */
    async sendDirectMessage(instagramAPI, accountId, recipientId, messageText, messageType, mediaUrl, accessToken) {
        try {
            console.log('📨 Sending DM to recipient:', recipientId);

            // Note: Instagram Messaging API requires special permissions and app review
            // This is a placeholder implementation for the messaging structure

            const messageUrl = `https://graph.facebook.com/v18.0/${accountId}/messages`;
            
            let messageData = {
                recipient: {
                    id: recipientId
                },
                message: {}
            };

            // Build message based on type
            switch (messageType) {
                case 'text':
                    messageData.message.text = messageText;
                    break;
                    
                case 'image':
                    if (!mediaUrl) {
                        throw new Error('Media URL is required for image messages');
                    }
                    messageData.message.attachment = {
                        type: 'image',
                        payload: {
                            url: mediaUrl
                        }
                    };
                    if (messageText) {
                        messageData.message.text = messageText;
                    }
                    break;
                    
                case 'video':
                    if (!mediaUrl) {
                        throw new Error('Media URL is required for video messages');
                    }
                    messageData.message.attachment = {
                        type: 'video',
                        payload: {
                            url: mediaUrl
                        }
                    };
                    if (messageText) {
                        messageData.message.text = messageText;
                    }
                    break;
                    
                case 'audio':
                    if (!mediaUrl) {
                        throw new Error('Media URL is required for audio messages');
                    }
                    messageData.message.attachment = {
                        type: 'audio',
                        payload: {
                            url: mediaUrl
                        }
                    };
                    break;
                    
                default:
                    messageData.message.text = messageText;
            }

            const response = await fetch(messageUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...messageData,
                    access_token: accessToken
                })
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
                    message_id: result.message_id || 'sent',
                    recipient_id: recipientId
                }
            };

        } catch (error) {
            console.error('Error in sendDirectMessage:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['accountId', 'recipientId', 'messageText', 'mediaUrl', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'instagram_send_dm';
                
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
        
        if (!config.accountId || config.accountId.trim() === '') {
            errors.push('Instagram Account ID is required');
        }
        
        if (!config.recipientId || config.recipientId.trim() === '') {
            errors.push('Recipient ID is required');
        }
        
        if (!config.messageText || config.messageText.trim() === '') {
            if (config.messageType === 'text') {
                errors.push('Message text is required for text messages');
            }
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
        }

        if (['image', 'video', 'audio'].includes(config.messageType) && !config.mediaUrl) {
            errors.push(`Media URL is required for ${config.messageType} messages`);
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
            accountId: 'your_instagram_business_account_id',
            recipientId: 'recipient_instagram_user_id',
            messageText: 'Hello! Thanks for your message.',
            messageType: 'text',
            mediaUrl: '',
            accessToken: 'your_instagram_access_token'
        };
    }
}

module.exports = new InstagramSendDMNode();