/*
=================================================================
FILE: backend/nodes/actions/facebookPostToPageNode.js
=================================================================
Facebook Post to Page Node - Post content to Facebook page
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class FacebookPostToPageNode {
    constructor() {
        this.name = 'Facebook Post to Page';
        this.type = 'facebookPostToPage';
        this.icon = 'fab fa-facebook';
        this.description = 'Post content to Facebook page';
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
                description: 'Facebook Page ID to post to'
            },
            message: {
                displayName: 'Post Message',
                name: 'message',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: '{{$json.message || "Check out this amazing post! 🚀"}}',
                required: true,
                description: 'Post message content (supports expressions)'
            },
            postType: {
                displayName: 'Post Type',
                name: 'postType',
                type: 'options',
                options: [
                    { name: 'Text Only', value: 'text' },
                    { name: 'Photo', value: 'photo' },
                    { name: 'Video', value: 'video' },
                    { name: 'Link', value: 'link' }
                ],
                default: 'text',
                description: 'Type of post to create'
            },
            mediaUrl: {
                displayName: 'Media URL',
                name: 'mediaUrl',
                type: 'string',
                default: '{{$json.media_url}}',
                description: 'URL of photo/video (for photo/video posts)'
            },
            link: {
                displayName: 'Link URL',
                name: 'link',
                type: 'string',
                default: '{{$json.link}}',
                description: 'Link URL (for link posts)'
            },
            linkCaption: {
                displayName: 'Link Caption',
                name: 'linkCaption',
                type: 'string',
                default: '',
                description: 'Caption for link preview'
            },
            linkDescription: {
                displayName: 'Link Description',
                name: 'linkDescription',
                type: 'string',
                default: '',
                description: 'Description for link preview'
            },
            published: {
                displayName: 'Publish Immediately',
                name: 'published',
                type: 'boolean',
                default: true,
                description: 'Publish immediately or save as draft'
            },
            scheduledPublishTime: {
                displayName: 'Scheduled Time',
                name: 'scheduledPublishTime',
                type: 'string',
                default: '',
                description: 'Unix timestamp for scheduled posts (optional)'
            },
            targeting: {
                displayName: 'Audience Targeting',
                name: 'targeting',
                type: 'string',
                default: '',
                description: 'JSON targeting criteria (optional, advanced)'
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
     * Execute the Facebook Post to Page node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Facebook Post to Page Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'facebook_post_workflow', name: 'Facebook Post to Page', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'facebook_post', type: 'facebookPostToPage' },
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

            console.log('📘 Creating Facebook post...');

            // Create the post
            const postResult = await this.createPost(
                processedConfig.pageId,
                processedConfig.message,
                processedConfig.postType,
                processedConfig.mediaUrl,
                processedConfig.link,
                processedConfig.linkCaption,
                processedConfig.linkDescription,
                processedConfig.published,
                processedConfig.scheduledPublishTime,
                processedConfig.targeting,
                processedConfig.accessToken
            );

            if (!postResult.success) {
                throw new Error(`Failed to create post: ${postResult.error}`);
            }

            console.log('✅ Facebook post created successfully');

            return {
                success: true,
                data: {
                    post_id: postResult.data.id,
                    page_id: processedConfig.pageId,
                    message: processedConfig.message,
                    post_type: processedConfig.postType,
                    published: processedConfig.published,
                    created_at: new Date().toISOString(),
                    permalink_url: postResult.data.permalink_url || null
                },
                nodeType: this.type,
                message: 'Facebook post created successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Facebook Post to Page Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Create Facebook post
     */
    async createPost(pageId, message, postType, mediaUrl, link, linkCaption, linkDescription, published, scheduledPublishTime, targeting, accessToken) {
        try {
            console.log('📤 Creating Facebook post of type:', postType);

            const postUrl = `https://graph.facebook.com/v18.0/${pageId}/feed`;
            
            let postData = {
                message: message,
                published: published,
                access_token: accessToken
            };

            // Add type-specific parameters
            switch (postType) {
                case 'photo':
                    if (mediaUrl) {
                        postData.source = mediaUrl;
                        // Use photos endpoint for photo posts
                        const photoUrl = `https://graph.facebook.com/v18.0/${pageId}/photos`;
                        return await this.makePostRequest(photoUrl, postData);
                    } else {
                        throw new Error('Media URL is required for photo posts');
                    }
                    
                case 'video':
                    if (mediaUrl) {
                        postData.source = mediaUrl;
                        // Use videos endpoint for video posts
                        const videoUrl = `https://graph.facebook.com/v18.0/${pageId}/videos`;
                        return await this.makePostRequest(videoUrl, postData);
                    } else {
                        throw new Error('Media URL is required for video posts');
                    }
                    
                case 'link':
                    if (link) {
                        postData.link = link;
                        if (linkCaption) postData.caption = linkCaption;
                        if (linkDescription) postData.description = linkDescription;
                    } else {
                        throw new Error('Link URL is required for link posts');
                    }
                    break;
                    
                case 'text':
                default:
                    // Text post - no additional parameters needed
                    break;
            }

            // Add optional parameters
            if (scheduledPublishTime && !published) {
                postData.scheduled_publish_time = parseInt(scheduledPublishTime);
                postData.published = false;
            }

            if (targeting) {
                try {
                    postData.targeting = JSON.parse(targeting);
                } catch (e) {
                    console.warn('Invalid targeting JSON, ignoring:', targeting);
                }
            }

            return await this.makePostRequest(postUrl, postData);

        } catch (error) {
            console.error('Error in createPost:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Make POST request to Facebook API
     */
    async makePostRequest(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to create post'
                };
            }

            // Get additional post details if available
            let enhancedResult = result;
            if (result.id && !result.permalink_url) {
                try {
                    const detailsUrl = `https://graph.facebook.com/v18.0/${result.id}`;
                    const detailsParams = {
                        fields: 'permalink_url,created_time',
                        access_token: data.access_token
                    };
                    
                    const detailsResponse = await fetch(`${detailsUrl}?${new URLSearchParams(detailsParams)}`);
                    if (detailsResponse.ok) {
                        const detailsData = await detailsResponse.json();
                        enhancedResult = { ...result, ...detailsData };
                    }
                } catch (detailsError) {
                    console.warn('Could not fetch post details:', detailsError);
                }
            }

            return {
                success: true,
                data: enhancedResult
            };

        } catch (error) {
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
        
        const templateFields = ['pageId', 'message', 'mediaUrl', 'link', 'linkCaption', 'linkDescription', 'scheduledPublishTime', 'targeting', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'facebook_post';
                
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
        
        if (!config.message || config.message.trim() === '') {
            errors.push('Post message is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
        }

        if (config.postType === 'photo' && !config.mediaUrl) {
            errors.push('Media URL is required for photo posts');
        }

        if (config.postType === 'video' && !config.mediaUrl) {
            errors.push('Media URL is required for video posts');
        }

        if (config.postType === 'link' && !config.link) {
            errors.push('Link URL is required for link posts');
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
            message: 'Check out this amazing post! 🚀',
            postType: 'text',
            mediaUrl: '',
            link: '',
            linkCaption: '',
            linkDescription: '',
            published: true,
            scheduledPublishTime: '',
            targeting: '',
            accessToken: 'your_facebook_page_access_token'
        };
    }
}

module.exports = new FacebookPostToPageNode();