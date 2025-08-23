/*
=================================================================
FILE: backend/nodes/actions/facebookGetPostCommentsNode.js
=================================================================
Facebook Get Post Comments Node - Get comments from Facebook posts
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class FacebookGetPostCommentsNode {
    constructor() {
        this.name = 'Facebook Get Post Comments';
        this.type = 'facebookGetPostComments';
        this.icon = 'fab fa-facebook';
        this.description = 'Get comments from Facebook posts';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            postId: {
                displayName: 'Post ID',
                name: 'postId',
                type: 'string',
                default: '{{$json.post_id}}',
                required: true,
                description: 'Facebook Post ID to get comments from'
            },
            commentFilter: {
                displayName: 'Comment Filter',
                name: 'commentFilter',
                type: 'options',
                options: [
                    { name: 'All Comments', value: 'stream' },
                    { name: 'Top Level Only', value: 'toplevel' },
                    { name: 'Recent Comments', value: 'recent' }
                ],
                default: 'stream',
                description: 'Type of comments to retrieve'
            },
            fields: {
                displayName: 'Comment Fields',
                name: 'fields',
                type: 'options',
                options: [
                    { name: 'All Fields', value: 'all' },
                    { name: 'Basic Info', value: 'basic' },
                    { name: 'With Reactions', value: 'reactions' },
                    { name: 'Custom', value: 'custom' }
                ],
                default: 'all',
                description: 'Which comment fields to retrieve'
            },
            customFields: {
                displayName: 'Custom Fields',
                name: 'customFields',
                type: 'string',
                default: '',
                description: 'Comma-separated list of fields (for custom option)'
            },
            limit: {
                displayName: 'Number of Comments',
                name: 'limit',
                type: 'number',
                default: 50,
                description: 'Maximum number of comments to retrieve (1-100)'
            },
            includeReplies: {
                displayName: 'Include Replies',
                name: 'includeReplies',
                type: 'boolean',
                default: true,
                description: 'Include replies to comments'
            },
            replyLimit: {
                displayName: 'Replies Per Comment',
                name: 'replyLimit',
                type: 'number',
                default: 5,
                description: 'Maximum replies per comment (1-25)'
            },
            order: {
                displayName: 'Comment Order',
                name: 'order',
                type: 'options',
                options: [
                    { name: 'Chronological', value: 'chronological' },
                    { name: 'Reverse Chronological', value: 'reverse_chronological' }
                ],
                default: 'chronological',
                description: 'Order of comments'
            },
            since: {
                displayName: 'Since Date',
                name: 'since',
                type: 'string',
                default: '',
                description: 'Get comments since this date (YYYY-MM-DD format)'
            },
            until: {
                displayName: 'Until Date',
                name: 'until',
                type: 'string',
                default: '',
                description: 'Get comments until this date (YYYY-MM-DD format)'
            },
            accessToken: {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                default: '{{$env.FACEBOOK_ACCESS_TOKEN}}',
                required: true,
                description: 'Facebook Access Token'
            }
        };
    }

    /**
     * Execute the Facebook Get Post Comments node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Facebook Get Post Comments Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'facebook_comments_workflow', name: 'Facebook Get Post Comments', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'facebook_comments', type: 'facebookGetPostComments' },
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

            console.log('💬 Fetching Facebook post comments...');

            // Get post comments
            const commentsResult = await this.getPostComments(
                processedConfig.postId,
                processedConfig.commentFilter,
                processedConfig.fields,
                processedConfig.customFields,
                processedConfig.limit,
                processedConfig.includeReplies,
                processedConfig.replyLimit,
                processedConfig.order,
                processedConfig.since,
                processedConfig.until,
                processedConfig.accessToken
            );

            if (!commentsResult.success) {
                throw new Error(`Failed to get post comments: ${commentsResult.error}`);
            }

            console.log('✅ Facebook post comments retrieved successfully');

            return {
                success: true,
                data: {
                    comments: commentsResult.data.comments,
                    paging: commentsResult.data.paging,
                    post_id: processedConfig.postId,
                    total_comments: commentsResult.data.comments?.length || 0,
                    comment_filter: processedConfig.commentFilter,
                    retrieved_at: new Date().toISOString(),
                    summary: commentsResult.data.summary
                },
                nodeType: this.type,
                message: `Retrieved ${commentsResult.data.comments?.length || 0} comments`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Facebook Get Post Comments Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get Facebook post comments
     */
    async getPostComments(postId, commentFilter, fields, customFields, limit, includeReplies, replyLimit, order, since, until, accessToken) {
        try {
            console.log('💬 Fetching comments for post:', postId);

            // Define available comment fields
            const commentFields = {
                all: [
                    'id', 'message', 'created_time', 'like_count', 'comment_count',
                    'from', 'attachment', 'can_comment', 'can_remove', 'can_like',
                    'can_reply', 'is_hidden', 'is_private', 'message_tags',
                    'parent', 'permalink_url', 'user_likes'
                ],
                basic: ['id', 'message', 'created_time', 'from', 'like_count'],
                reactions: ['id', 'message', 'created_time', 'from', 'like_count', 'comment_count', 'user_likes']
            };

            let fieldsToRequest;
            if (fields === 'custom' && customFields) {
                fieldsToRequest = customFields.split(',').map(f => f.trim());
            } else {
                fieldsToRequest = commentFields[fields] || commentFields.all;
            }

            // Add comments field with sub-fields for replies if requested
            if (includeReplies && replyLimit > 0) {
                const replyFields = fieldsToRequest.join(',');
                fieldsToRequest.push(`comments.limit(${Math.min(replyLimit, 25)}){${replyFields}}`);
            }

            const commentsUrl = `https://graph.facebook.com/v18.0/${postId}/comments`;
            const params = {
                fields: fieldsToRequest.join(','),
                limit: Math.min(Math.max(parseInt(limit) || 50, 1), 100),
                filter: commentFilter,
                order: order,
                access_token: accessToken
            };

            // Add date filters
            if (since) {
                const sinceDate = new Date(since);
                if (!isNaN(sinceDate.getTime())) {
                    params.since = Math.floor(sinceDate.getTime() / 1000);
                }
            }

            if (until) {
                const untilDate = new Date(until);
                if (!isNaN(untilDate.getTime())) {
                    params.until = Math.floor(untilDate.getTime() / 1000);
                }
            }

            const response = await fetch(`${commentsUrl}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to get post comments'
                };
            }

            // Enhance comments with additional data
            let comments = result.data || [];
            comments = comments.map(comment => ({
                ...comment,
                comment_stats: this.calculateCommentStats(comment),
                comment_age: this.calculateCommentAge(comment.created_time),
                sentiment: this.analyzeSentiment(comment.message),
                author_info: this.enhanceAuthorInfo(comment.from)
            }));

            // Create summary
            const summary = this.createCommentsSummary(comments);

            return {
                success: true,
                data: {
                    comments: comments,
                    paging: result.paging,
                    summary: summary
                }
            };

        } catch (error) {
            console.error('Error in getPostComments:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate comment statistics
     */
    calculateCommentStats(comment) {
        const likes = comment.like_count || 0;
        const replies = comment.comment_count || 0;
        const hasReplies = (comment.comments?.data?.length || 0) > 0;

        return {
            total_likes: likes,
            total_replies: replies,
            has_replies: hasReplies,
            engagement_score: likes + replies,
            is_popular: likes > 5 || replies > 2
        };
    }

    /**
     * Calculate comment age
     */
    calculateCommentAge(createdTime) {
        if (!createdTime) return null;
        
        const commentDate = new Date(createdTime);
        const now = new Date();
        const diffTime = Math.abs(now - commentDate);
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d`;
        if (diffHours > 0) return `${diffHours}h`;
        return `${diffMinutes}m`;
    }

    /**
     * Basic sentiment analysis
     */
    analyzeSentiment(message) {
        if (!message) return 'neutral';

        const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'like', 'excellent', 'wonderful', 'fantastic', '👍', '❤️', '😍', '🔥'];
        const negativeWords = ['bad', 'terrible', 'hate', 'dislike', 'awful', 'horrible', 'worst', 'stupid', '👎', '😡', '😤'];

        const lowerMessage = message.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    /**
     * Enhance author information
     */
    enhanceAuthorInfo(from) {
        if (!from) return null;

        return {
            ...from,
            display_name: from.name || `${from.first_name || ''} ${from.last_name || ''}`.trim(),
            is_verified: !!from.verified,
            profile_url: `https://facebook.com/${from.id}`
        };
    }

    /**
     * Create comments summary
     */
    createCommentsSummary(comments) {
        const total = comments.length;
        const totalLikes = comments.reduce((sum, c) => sum + (c.like_count || 0), 0);
        const totalReplies = comments.reduce((sum, c) => sum + (c.comment_count || 0), 0);
        const withReplies = comments.filter(c => (c.comment_count || 0) > 0).length;
        
        const sentimentCounts = comments.reduce((counts, c) => {
            const sentiment = c.sentiment || 'neutral';
            counts[sentiment] = (counts[sentiment] || 0) + 1;
            return counts;
        }, {});

        const topComments = comments
            .filter(c => c.comment_stats?.is_popular)
            .sort((a, b) => (b.comment_stats?.engagement_score || 0) - (a.comment_stats?.engagement_score || 0))
            .slice(0, 5);

        return {
            total_comments: total,
            total_likes: totalLikes,
            total_replies: totalReplies,
            comments_with_replies: withReplies,
            average_likes_per_comment: total > 0 ? Math.round(totalLikes / total * 10) / 10 : 0,
            sentiment_breakdown: sentimentCounts,
            top_comments: topComments.map(c => ({
                id: c.id,
                message: c.message?.substring(0, 100) + (c.message?.length > 100 ? '...' : ''),
                author: c.from?.name,
                likes: c.like_count || 0,
                replies: c.comment_count || 0
            }))
        };
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['postId', 'customFields', 'since', 'until', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'facebook_comments';
                
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
        
        if (!config.postId || config.postId.trim() === '') {
            errors.push('Facebook Post ID is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
        }

        // Validate limits
        const limit = parseInt(config.limit);
        if (isNaN(limit) || limit < 1 || limit > 100) {
            errors.push('Limit must be a number between 1 and 100');
        }

        const replyLimit = parseInt(config.replyLimit);
        if (isNaN(replyLimit) || replyLimit < 0 || replyLimit > 25) {
            errors.push('Reply limit must be a number between 0 and 25');
        }

        // Validate date formats
        if (config.since && config.since.trim() !== '') {
            const sinceDate = new Date(config.since);
            if (isNaN(sinceDate.getTime())) {
                errors.push('Since date must be in valid date format (YYYY-MM-DD)');
            }
        }

        if (config.until && config.until.trim() !== '') {
            const untilDate = new Date(config.until);
            if (isNaN(untilDate.getTime())) {
                errors.push('Until date must be in valid date format (YYYY-MM-DD)');
            }
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
            postId: 'facebook_post_id',
            commentFilter: 'stream',
            fields: 'all',
            customFields: '',
            limit: 50,
            includeReplies: true,
            replyLimit: 5,
            order: 'chronological',
            since: '',
            until: '',
            accessToken: 'your_facebook_access_token'
        };
    }
}

module.exports = new FacebookGetPostCommentsNode();