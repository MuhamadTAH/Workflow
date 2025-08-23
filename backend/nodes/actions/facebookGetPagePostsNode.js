/*
=================================================================
FILE: backend/nodes/actions/facebookGetPagePostsNode.js
=================================================================
Facebook Get Page Posts Node - Get posts from Facebook page
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class FacebookGetPagePostsNode {
    constructor() {
        this.name = 'Facebook Get Page Posts';
        this.type = 'facebookGetPagePosts';
        this.icon = 'fab fa-facebook';
        this.description = 'Get posts from Facebook page';
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
            postType: {
                displayName: 'Post Type Filter',
                name: 'postType',
                type: 'options',
                options: [
                    { name: 'All Posts', value: 'all' },
                    { name: 'Published Only', value: 'published' },
                    { name: 'Scheduled Only', value: 'scheduled' },
                    { name: 'Drafts Only', value: 'draft' }
                ],
                default: 'published',
                description: 'Filter posts by type'
            },
            fields: {
                displayName: 'Post Fields',
                name: 'fields',
                type: 'options',
                options: [
                    { name: 'All Fields', value: 'all' },
                    { name: 'Basic Info', value: 'basic' },
                    { name: 'Engagement', value: 'engagement' },
                    { name: 'Custom', value: 'custom' }
                ],
                default: 'all',
                description: 'Which post fields to retrieve'
            },
            customFields: {
                displayName: 'Custom Fields',
                name: 'customFields',
                type: 'string',
                default: '',
                description: 'Comma-separated list of fields (for custom option)'
            },
            limit: {
                displayName: 'Number of Posts',
                name: 'limit',
                type: 'number',
                default: 25,
                description: 'Maximum number of posts to retrieve (1-100)'
            },
            since: {
                displayName: 'Since Date',
                name: 'since',
                type: 'string',
                default: '',
                description: 'Retrieve posts since this date (YYYY-MM-DD format)'
            },
            until: {
                displayName: 'Until Date',
                name: 'until',
                type: 'string',
                default: '',
                description: 'Retrieve posts until this date (YYYY-MM-DD format)'
            },
            accessToken: {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                default: '{{$env.FACEBOOK_ACCESS_TOKEN}}',
                required: true,
                description: 'Facebook Page Access Token'
            }
        };
    }

    /**
     * Execute the Facebook Get Page Posts node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Facebook Get Page Posts Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'facebook_posts_workflow', name: 'Facebook Get Page Posts', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'facebook_posts', type: 'facebookGetPagePosts' },
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

            console.log('📘 Fetching Facebook page posts...');

            // Get page posts
            const postsResult = await this.getPagePosts(
                processedConfig.pageId,
                processedConfig.postType,
                processedConfig.fields,
                processedConfig.customFields,
                processedConfig.limit,
                processedConfig.since,
                processedConfig.until,
                processedConfig.accessToken
            );

            if (!postsResult.success) {
                throw new Error(`Failed to get page posts: ${postsResult.error}`);
            }

            console.log('✅ Facebook page posts retrieved successfully');

            return {
                success: true,
                data: {
                    posts: postsResult.data.data,
                    paging: postsResult.data.paging,
                    page_id: processedConfig.pageId,
                    total_posts: postsResult.data.data?.length || 0,
                    post_type_filter: processedConfig.postType,
                    retrieved_at: new Date().toISOString()
                },
                nodeType: this.type,
                message: `Retrieved ${postsResult.data.data?.length || 0} Facebook posts`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Facebook Get Page Posts Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get Facebook page posts
     */
    async getPagePosts(pageId, postType, fields, customFields, limit, since, until, accessToken) {
        try {
            console.log('📋 Fetching posts for page:', pageId);

            // Define available post fields
            const postFields = {
                all: [
                    'id', 'message', 'story', 'created_time', 'updated_time',
                    'type', 'status_type', 'permalink_url', 'is_published',
                    'scheduled_publish_time', 'backdated_time', 'likes.summary(true)',
                    'comments.summary(true)', 'shares', 'reactions.summary(true)',
                    'attachments', 'picture', 'full_picture', 'name', 'caption',
                    'description', 'source', 'link', 'place', 'privacy',
                    'targeting', 'is_popular', 'is_eligible_for_promotion'
                ],
                basic: ['id', 'message', 'created_time', 'type', 'permalink_url', 'is_published'],
                engagement: [
                    'id', 'message', 'created_time', 'likes.summary(true)', 
                    'comments.summary(true)', 'shares', 'reactions.summary(true)'
                ]
            };

            let fieldsToRequest;
            if (fields === 'custom' && customFields) {
                fieldsToRequest = customFields.split(',').map(f => f.trim());
            } else {
                fieldsToRequest = postFields[fields] || postFields.all;
            }

            const postsUrl = `https://graph.facebook.com/v18.0/${pageId}/posts`;
            const params = {
                fields: fieldsToRequest.join(','),
                limit: Math.min(Math.max(parseInt(limit) || 25, 1), 100),
                access_token: accessToken
            };

            // Add post type filter
            if (postType !== 'all') {
                if (postType === 'published') {
                    params.is_published = 'true';
                } else if (postType === 'scheduled') {
                    params.is_published = 'false';
                    params.include_hidden = 'true';
                } else if (postType === 'draft') {
                    params.is_published = 'false';
                    params.include_hidden = 'true';
                }
            }

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

            const response = await fetch(`${postsUrl}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to get page posts'
                };
            }

            // Enhance posts with additional computed fields
            if (result.data && Array.isArray(result.data)) {
                result.data = result.data.map(post => ({
                    ...post,
                    engagement_stats: this.calculateEngagementStats(post),
                    post_age_days: this.calculatePostAge(post.created_time),
                    content_type: this.determineContentType(post)
                }));
            }

            return {
                success: true,
                data: result
            };

        } catch (error) {
            console.error('Error in getPagePosts:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate engagement statistics for a post
     */
    calculateEngagementStats(post) {
        const likes = post.likes?.summary?.total_count || 0;
        const comments = post.comments?.summary?.total_count || 0;
        const shares = post.shares?.count || 0;
        const reactions = post.reactions?.summary?.total_count || 0;

        const totalEngagement = likes + comments + shares + reactions;

        return {
            total_likes: likes,
            total_comments: comments,
            total_shares: shares,
            total_reactions: reactions,
            total_engagement: totalEngagement,
            engagement_score: totalEngagement > 0 ? Math.round((totalEngagement / 100) * 100) / 100 : 0
        };
    }

    /**
     * Calculate post age in days
     */
    calculatePostAge(createdTime) {
        if (!createdTime) return null;
        
        const postDate = new Date(createdTime);
        const now = new Date();
        const diffTime = Math.abs(now - postDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }

    /**
     * Determine content type of post
     */
    determineContentType(post) {
        if (post.attachments?.data?.length > 0) {
            const attachment = post.attachments.data[0];
            return attachment.type || 'unknown';
        }
        
        if (post.picture || post.full_picture) {
            return 'photo';
        }
        
        if (post.source) {
            return 'video';
        }
        
        if (post.link) {
            return 'link';
        }
        
        return 'text';
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['pageId', 'customFields', 'since', 'until', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'facebook_posts';
                
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
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
        }

        // Validate limit
        const limit = parseInt(config.limit);
        if (isNaN(limit) || limit < 1 || limit > 100) {
            errors.push('Limit must be a number between 1 and 100');
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
            pageId: 'your_facebook_page_id',
            postType: 'published',
            fields: 'all',
            customFields: '',
            limit: 25,
            since: '',
            until: '',
            accessToken: 'your_facebook_page_access_token'
        };
    }
}

module.exports = new FacebookGetPagePostsNode();