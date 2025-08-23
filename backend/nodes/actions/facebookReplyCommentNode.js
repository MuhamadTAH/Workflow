/*
=================================================================
FILE: backend/nodes/actions/facebookReplyCommentNode.js
=================================================================
Facebook Reply Comment Node - Reply to Facebook post comments
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class FacebookReplyCommentNode {
    constructor() {
        this.name = 'Facebook Reply Comment';
        this.type = 'facebookReplyComment';
        this.icon = 'fab fa-facebook';
        this.description = 'Reply to Facebook post comments';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            commentId: {
                displayName: 'Comment ID',
                name: 'commentId',
                type: 'string',
                default: '{{$json.comment_id}}',
                required: true,
                description: 'Facebook Comment ID to reply to'
            },
            replyMessage: {
                displayName: 'Reply Message',
                name: 'replyMessage',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: 'Thank you for your comment! {{$json.commenter_name ? "Hi " + $json.commenter_name + "!" : ""}}',
                required: true,
                description: 'Reply message content (supports expressions)'
            },
            replyType: {
                displayName: 'Reply Type',
                name: 'replyType',
                type: 'options',
                options: [
                    { name: 'Public Reply', value: 'public' },
                    { name: 'Private Message', value: 'private' },
                    { name: 'Like Comment Only', value: 'like' },
                    { name: 'Hide Comment', value: 'hide' }
                ],
                default: 'public',
                description: 'Type of reply action to perform'
            },
            includeContext: {
                displayName: 'Include Original Comment',
                name: 'includeContext',
                type: 'boolean',
                default: false,
                description: 'Include reference to original comment in reply'
            },
            contextTemplate: {
                displayName: 'Context Template',
                name: 'contextTemplate',
                type: 'string',
                default: '@{{$json.commenter_name}} regarding your comment: "{{$json.original_comment}}"',
                description: 'Template for including original comment context'
            },
            autoModerate: {
                displayName: 'Auto Moderate',
                name: 'autoModerate',
                type: 'boolean',
                default: false,
                description: 'Automatically moderate inappropriate comments'
            },
            moderationKeywords: {
                displayName: 'Moderation Keywords',
                name: 'moderationKeywords',
                type: 'string',
                default: '',
                description: 'Comma-separated keywords to trigger moderation (optional)'
            },
            tagPageAdmin: {
                displayName: 'Tag Page Admin',
                name: 'tagPageAdmin',
                type: 'boolean',
                default: false,
                description: 'Tag page admin in reply for urgent comments'
            },
            adminUserId: {
                displayName: 'Admin User ID',
                name: 'adminUserId',
                type: 'string',
                default: '{{$env.FACEBOOK_ADMIN_USER_ID}}',
                description: 'Facebook User ID of page admin to tag'
            },
            privateMessageTemplate: {
                displayName: 'Private Message Template',
                name: 'privateMessageTemplate',
                type: 'string',
                default: 'Hi {{$json.commenter_name}}, thanks for commenting on our post! We\'d like to follow up with you privately.',
                description: 'Template for private message (when reply type is private)'
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
     * Execute the Facebook Reply Comment node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Facebook Reply Comment Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'facebook_comment_reply_workflow', name: 'Facebook Reply Comment', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'facebook_comment_reply', type: 'facebookReplyComment' },
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

            console.log('💬 Processing Facebook comment reply...');

            // Check for moderation if enabled
            if (processedConfig.autoModerate && processedConfig.moderationKeywords) {
                const moderationResult = this.checkModeration(inputData, processedConfig.moderationKeywords);
                if (moderationResult.shouldModerate) {
                    console.log('🚨 Comment flagged for moderation:', moderationResult.reason);
                    // Hide comment first, then optionally send private message
                    await this.hideComment(processedConfig.commentId, processedConfig.accessToken);
                    
                    if (processedConfig.replyType === 'private') {
                        await this.sendPrivateMessage(inputData, processedConfig.privateMessageTemplate, processedConfig.accessToken);
                    }
                    
                    return {
                        success: true,
                        data: {
                            action: 'moderated',
                            comment_id: processedConfig.commentId,
                            moderation_reason: moderationResult.reason,
                            comment_hidden: true,
                            private_message_sent: processedConfig.replyType === 'private'
                        },
                        nodeType: this.type,
                        message: 'Comment moderated and hidden',
                        timestamp: new Date().toISOString()
                    };
                }
            }

            // Process the reply based on type
            const replyResult = await this.processCommentReply(
                processedConfig.commentId,
                processedConfig.replyMessage,
                processedConfig.replyType,
                processedConfig.includeContext,
                processedConfig.contextTemplate,
                processedConfig.tagPageAdmin,
                processedConfig.adminUserId,
                processedConfig.privateMessageTemplate,
                processedConfig.accessToken,
                inputData
            );

            if (!replyResult.success) {
                throw new Error(`Failed to process comment reply: ${replyResult.error}`);
            }

            console.log('✅ Facebook comment reply processed successfully');

            return {
                success: true,
                data: {
                    ...replyResult.data,
                    comment_id: processedConfig.commentId,
                    reply_type: processedConfig.replyType,
                    processed_at: new Date().toISOString()
                },
                nodeType: this.type,
                message: `Comment reply processed (${processedConfig.replyType})`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Facebook Reply Comment Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Process comment reply based on type
     */
    async processCommentReply(commentId, replyMessage, replyType, includeContext, contextTemplate, tagPageAdmin, adminUserId, privateMessageTemplate, accessToken, inputData) {
        try {
            switch (replyType) {
                case 'public':
                    return await this.createPublicReply(commentId, replyMessage, includeContext, contextTemplate, tagPageAdmin, adminUserId, accessToken, inputData);
                
                case 'private':
                    return await this.sendPrivateMessage(inputData, privateMessageTemplate, accessToken);
                
                case 'like':
                    return await this.likeComment(commentId, accessToken);
                
                case 'hide':
                    return await this.hideComment(commentId, accessToken);
                
                default:
                    throw new Error(`Unsupported reply type: ${replyType}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create public reply to comment
     */
    async createPublicReply(commentId, replyMessage, includeContext, contextTemplate, tagPageAdmin, adminUserId, accessToken, inputData) {
        try {
            let finalReplyMessage = replyMessage;

            // Add context if requested
            if (includeContext && contextTemplate) {
                const contextText = this.processTemplate(contextTemplate, inputData);
                finalReplyMessage = `${contextText}\n\n${replyMessage}`;
            }

            // Tag admin if requested
            if (tagPageAdmin && adminUserId) {
                finalReplyMessage = `@[${adminUserId}] ${finalReplyMessage}`;
            }

            const replyUrl = `https://graph.facebook.com/v18.0/${commentId}/comments`;
            const replyData = {
                message: finalReplyMessage,
                access_token: accessToken
            };

            const response = await fetch(replyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(replyData)
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to create public reply'
                };
            }

            return {
                success: true,
                data: {
                    action: 'public_reply',
                    reply_id: result.id,
                    reply_message: finalReplyMessage,
                    admin_tagged: tagPageAdmin && adminUserId
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send private message to commenter
     */
    async sendPrivateMessage(inputData, messageTemplate, accessToken) {
        try {
            const userId = inputData?.from?.id || inputData?.commenter_id;
            if (!userId) {
                return {
                    success: false,
                    error: 'Commenter ID not available for private message'
                };
            }

            const privateMessage = this.processTemplate(messageTemplate, inputData);

            const messageUrl = `https://graph.facebook.com/v18.0/me/messages`;
            const messageData = {
                recipient: { id: userId },
                message: { text: privateMessage },
                access_token: accessToken
            };

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
                    error: result.error?.message || 'Failed to send private message'
                };
            }

            return {
                success: true,
                data: {
                    action: 'private_message',
                    message_id: result.message_id,
                    recipient_id: userId,
                    message_text: privateMessage
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Like a comment
     */
    async likeComment(commentId, accessToken) {
        try {
            const likeUrl = `https://graph.facebook.com/v18.0/${commentId}/likes`;
            const likeData = {
                access_token: accessToken
            };

            const response = await fetch(likeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(likeData)
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to like comment'
                };
            }

            return {
                success: true,
                data: {
                    action: 'like_comment',
                    liked: result.success !== false
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Hide a comment
     */
    async hideComment(commentId, accessToken) {
        try {
            const hideUrl = `https://graph.facebook.com/v18.0/${commentId}`;
            const hideData = {
                is_hidden: true,
                access_token: accessToken
            };

            const response = await fetch(hideUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(hideData)
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to hide comment'
                };
            }

            return {
                success: true,
                data: {
                    action: 'hide_comment',
                    hidden: result.success !== false
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if comment should be moderated
     */
    checkModeration(inputData, moderationKeywords) {
        const message = inputData?.message || '';
        const keywords = moderationKeywords.split(',').map(k => k.trim().toLowerCase());
        
        const lowerMessage = message.toLowerCase();
        const flaggedKeywords = keywords.filter(keyword => lowerMessage.includes(keyword));
        
        if (flaggedKeywords.length > 0) {
            return {
                shouldModerate: true,
                reason: `Contains flagged keywords: ${flaggedKeywords.join(', ')}`
            };
        }

        // Additional moderation checks
        const spamIndicators = [
            message.length > 1000, // Very long message
            (message.match(/https?:\/\//g) || []).length > 3, // Multiple links
            message.match(/(.)\1{10,}/), // Repeated characters
            message.toUpperCase() === message && message.length > 20 // All caps
        ];

        if (spamIndicators.some(indicator => indicator)) {
            return {
                shouldModerate: true,
                reason: 'Detected spam indicators'
            };
        }

        return {
            shouldModerate: false,
            reason: null
        };
    }

    /**
     * Process template with input data
     */
    processTemplate(template, inputData) {
        let processed = template;
        
        // Simple template replacement
        const replacements = {
            '{{$json.commenter_name}}': inputData?.from?.name || inputData?.commenter_name || 'there',
            '{{$json.original_comment}}': (inputData?.message || '').substring(0, 100),
            '{{$json.commenter_id}}': inputData?.from?.id || inputData?.commenter_id || '',
            '{{$json.post_id}}': inputData?.post_id || ''
        };

        Object.entries(replacements).forEach(([placeholder, value]) => {
            processed = processed.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });

        return processed;
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['commentId', 'replyMessage', 'contextTemplate', 'adminUserId', 'privateMessageTemplate', 'moderationKeywords', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'facebook_comment_reply';
                
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
        
        if (!config.commentId || config.commentId.trim() === '') {
            errors.push('Comment ID is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
        }

        if (config.replyType === 'public' && (!config.replyMessage || config.replyMessage.trim() === '')) {
            errors.push('Reply message is required for public replies');
        }

        if (config.replyType === 'private' && (!config.privateMessageTemplate || config.privateMessageTemplate.trim() === '')) {
            errors.push('Private message template is required for private replies');
        }

        if (config.tagPageAdmin && (!config.adminUserId || config.adminUserId.trim() === '')) {
            errors.push('Admin User ID is required when tagging page admin');
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
            commentId: 'facebook_comment_id',
            replyMessage: 'Thank you for your comment!',
            replyType: 'public',
            includeContext: false,
            contextTemplate: '@{{$json.commenter_name}} regarding your comment: "{{$json.original_comment}}"',
            autoModerate: false,
            moderationKeywords: '',
            tagPageAdmin: false,
            adminUserId: '',
            privateMessageTemplate: 'Hi {{$json.commenter_name}}, thanks for commenting!',
            accessToken: 'your_facebook_page_access_token'
        };
    }
}

module.exports = new FacebookReplyCommentNode();