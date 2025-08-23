/*
=================================================================
FILE: backend/nodes/actions/instagramGetCommentsNode.js
=================================================================
Instagram Get Comments Node - Fetch comments from Instagram posts
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');
const { InstagramAPI } = require('../../services/instagramAPI');

class InstagramGetCommentsNode {
    constructor() {
        this.name = 'Instagram Get Comments';
        this.type = 'instagramGetComments';
        this.icon = 'fab fa-instagram';
        this.description = 'Fetch comments from Instagram posts';
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
            mediaId: {
                displayName: 'Media ID',
                name: 'mediaId',
                type: 'string',
                default: '{{$json.media_id}}',
                required: true,
                description: 'Instagram post/media ID to get comments from'
            },
            limit: {
                displayName: 'Comment Limit',
                name: 'limit',
                type: 'number',
                default: 25,
                description: 'Number of comments to retrieve (1-100)'
            },
            sortOrder: {
                displayName: 'Sort Order',
                name: 'sortOrder',
                type: 'options',
                options: [
                    { name: 'Newest First', value: 'newest' },
                    { name: 'Oldest First', value: 'oldest' }
                ],
                default: 'newest',
                description: 'Order to sort comments'
            },
            includeReplies: {
                displayName: 'Include Replies',
                name: 'includeReplies',
                type: 'boolean',
                default: true,
                description: 'Include reply comments'
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
     * Execute the Instagram Get Comments node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Instagram Get Comments Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'instagram_get_comments_workflow', name: 'Instagram Get Comments', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'instagram_get_comments', type: 'instagramGetComments' },
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

            console.log('💬 Fetching Instagram comments...');

            // Get comments from the media
            const commentsResult = await this.getComments(
                instagramAPI,
                processedConfig.mediaId,
                processedConfig.limit,
                processedConfig.sortOrder,
                processedConfig.includeReplies,
                processedConfig.accessToken
            );

            if (!commentsResult.success) {
                throw new Error(`Failed to get comments: ${commentsResult.error}`);
            }

            console.log(`✅ Retrieved ${commentsResult.data.length} comments`);

            return {
                success: true,
                data: {
                    comments: commentsResult.data,
                    count: commentsResult.data.length,
                    media_id: processedConfig.mediaId,
                    account_id: processedConfig.accountId,
                    retrieved_at: new Date().toISOString()
                },
                nodeType: this.type,
                message: `Retrieved ${commentsResult.data.length} Instagram comments`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Instagram Get Comments Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get comments from Instagram media
     */
    async getComments(instagramAPI, mediaId, limit = 25, sortOrder = 'newest', includeReplies = true, accessToken) {
        try {
            console.log('🔍 Fetching comments for media:', mediaId);

            const commentsUrl = `https://graph.facebook.com/v18.0/${mediaId}/comments`;
            const params = {
                access_token: accessToken,
                limit: Math.min(limit, 100),
                fields: 'id,text,timestamp,from,parent_id,like_count,replies{id,text,timestamp,from,like_count}'
            };

            // Add sorting if API supports it
            if (sortOrder === 'oldest') {
                params.order = 'chronological';
            }

            const response = await fetch(`${commentsUrl}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to get comments'
                };
            }

            let comments = result.data || [];

            // Process comments and optionally include replies
            const processedComments = comments.map(comment => {
                const processedComment = {
                    id: comment.id,
                    text: comment.text,
                    timestamp: comment.timestamp,
                    created_time: comment.timestamp,
                    from: {
                        id: comment.from?.id || 'unknown',
                        username: comment.from?.username || 'unknown'
                    },
                    like_count: comment.like_count || 0,
                    is_reply: !!comment.parent_id,
                    parent_id: comment.parent_id || null,
                    replies: []
                };

                // Include replies if requested
                if (includeReplies && comment.replies && comment.replies.data) {
                    processedComment.replies = comment.replies.data.map(reply => ({
                        id: reply.id,
                        text: reply.text,
                        timestamp: reply.timestamp,
                        from: {
                            id: reply.from?.id || 'unknown',
                            username: reply.from?.username || 'unknown'
                        },
                        like_count: reply.like_count || 0,
                        is_reply: true,
                        parent_id: comment.id
                    }));
                }

                return processedComment;
            });

            // Sort by newest/oldest if needed
            if (sortOrder === 'newest') {
                processedComments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            } else if (sortOrder === 'oldest') {
                processedComments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            }

            return {
                success: true,
                data: processedComments.slice(0, limit)
            };

        } catch (error) {
            console.error('Error in getComments:', error);
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
        
        const templateFields = ['accountId', 'mediaId', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'instagram_get_comments';
                
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
        
        if (!config.mediaId || config.mediaId.trim() === '') {
            errors.push('Media ID is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
        }

        if (config.limit && (config.limit < 1 || config.limit > 100)) {
            errors.push('Limit must be between 1 and 100');
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
            mediaId: 'instagram_media_id',
            limit: 25,
            sortOrder: 'newest',
            includeReplies: true,
            accessToken: 'your_instagram_access_token'
        };
    }
}

module.exports = new InstagramGetCommentsNode();