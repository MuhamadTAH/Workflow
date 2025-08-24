/*
=================================================================
FILE: backend/nodes/actions/instagramReplyCommentNode.js
=================================================================
Instagram Reply Comment Node - Reply to comments on Instagram posts
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');
const { InstagramAPI } = require('../../services/instagramAPI');

class InstagramReplyCommentNode {
    constructor() {
        this.name = 'Instagram Reply Comment';
        this.type = 'instagramReplyComment';
        this.icon = 'fab fa-instagram';
        this.description = 'Reply to comments on Instagram posts';
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
            commentId: {
                displayName: 'Comment ID',
                name: 'commentId',
                type: 'string',
                default: '{{$json.comment_id}}',
                required: true,
                description: 'ID of the comment to reply to'
            },
            replyText: {
                displayName: 'Reply Text',
                name: 'replyText',
                type: 'string',
                typeOptions: {
                    rows: 3
                },
                default: 'Thanks for your comment!',
                required: true,
                description: 'Reply text (supports expressions)'
            },
            includeUsername: {
                displayName: 'Include @username',
                name: 'includeUsername',
                type: 'boolean',
                default: true,
                description: 'Automatically include @username in reply'
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
     * Execute the Instagram Reply Comment node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Instagram Reply Comment Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'instagram_reply_comment_workflow', name: 'Instagram Reply Comment', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'instagram_reply_comment', type: 'instagramReplyComment' },
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

            console.log('💬 Replying to Instagram comment...');

            // Reply to the comment
            const replyResult = await this.replyToComment(
                instagramAPI,
                processedConfig.commentId,
                processedConfig.replyText,
                processedConfig.includeUsername,
                inputData,
                processedConfig.accessToken
            );

            if (!replyResult.success) {
                throw new Error(`Failed to reply to comment: ${replyResult.error}`);
            }

            console.log('✅ Reply posted successfully');

            return {
                success: true,
                data: {
                    reply_id: replyResult.data.id,
                    comment_id: processedConfig.commentId,
                    reply_text: replyResult.data.reply_text,
                    replied_at: new Date().toISOString(),
                    account_id: processedConfig.accountId
                },
                nodeType: this.type,
                message: 'Instagram comment reply posted successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Instagram Reply Comment Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Reply to Instagram comment
     */
    async replyToComment(instagramAPI, commentId, replyText, includeUsername, inputData, accessToken) {
        try {
            console.log('📤 Posting reply to comment:', commentId);

            // Build reply text with username if requested
            let finalReplyText = replyText;
            
            if (includeUsername && inputData) {
                const commenterUsername = inputData.commenter_username || 
                                        inputData.comment?.from?.username ||
                                        inputData.from?.username;
                
                if (commenterUsername && !finalReplyText.includes('@' + commenterUsername)) {
                    finalReplyText = `@${commenterUsername} ${finalReplyText}`;
                }
            }

            // Post reply using Instagram API
            const replyUrl = `https://graph.facebook.com/v18.0/${commentId}/replies`;
            const replyData = {
                message: finalReplyText,
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
                    error: result.error?.message || 'Failed to post reply'
                };
            }

            return {
                success: true,
                data: {
                    id: result.id,
                    reply_text: finalReplyText
                }
            };

        } catch (error) {
            console.error('Error in replyToComment:', error);
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
        
        const templateFields = ['accountId', 'commentId', 'replyText', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'instagram_reply_comment';
                
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
        
        if (!config.commentId || config.commentId.trim() === '') {
            errors.push('Comment ID is required');
        }
        
        if (!config.replyText || config.replyText.trim() === '') {
            errors.push('Reply text is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
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
            commentId: 'instagram_comment_id',
            replyText: 'Thanks for your comment!',
            includeUsername: true,
            accessToken: 'your_instagram_access_token'
        };
    }
}

// Fixed syntax error - deployment timestamp: 2025-08-24
module.exports = new InstagramReplyCommentNode();