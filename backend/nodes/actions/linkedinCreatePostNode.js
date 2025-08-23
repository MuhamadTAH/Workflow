/*
=================================================================
FILE: backend/nodes/actions/linkedinCreatePostNode.js
=================================================================
LinkedIn Create Post Node - Create posts on LinkedIn
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class LinkedInCreatePostNode {
    constructor() {
        this.name = 'LinkedIn Create Post';
        this.type = 'linkedinCreatePost';
        this.icon = 'fab fa-linkedin';
        this.description = 'Create posts on LinkedIn';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            postType: {
                displayName: 'Post Type',
                name: 'postType',
                type: 'options',
                options: [
                    { name: 'Personal Post', value: 'personal' },
                    { name: 'Company Post', value: 'company' },
                    { name: 'Article', value: 'article' }
                ],
                default: 'personal',
                description: 'Type of LinkedIn post to create'
            },
            companyId: {
                displayName: 'Company ID',
                name: 'companyId',
                type: 'string',
                default: '{{$json.company_id}}',
                description: 'LinkedIn Company ID (required for company posts)'
            },
            postText: {
                displayName: 'Post Text',
                name: 'postText',
                type: 'string',
                typeOptions: {
                    rows: 5
                },
                default: '{{$json.message || "Exciting news to share with my network! 🚀"}}',
                required: true,
                description: 'Main text content of the post'
            },
            visibility: {
                displayName: 'Post Visibility',
                name: 'visibility',
                type: 'options',
                options: [
                    { name: 'Public', value: 'PUBLIC' },
                    { name: 'Connections Only', value: 'CONNECTIONS' },
                    { name: 'Dark Post (Company Only)', value: 'DARK' }
                ],
                default: 'PUBLIC',
                description: 'Who can see this post'
            },
            includeMedia: {
                displayName: 'Include Media',
                name: 'includeMedia',
                type: 'boolean',
                default: false,
                description: 'Include image or video with the post'
            },
            mediaType: {
                displayName: 'Media Type',
                name: 'mediaType',
                type: 'options',
                options: [
                    { name: 'Image', value: 'image' },
                    { name: 'Video', value: 'video' },
                    { name: 'Document', value: 'document' }
                ],
                default: 'image',
                description: 'Type of media to include'
            },
            mediaUrl: {
                displayName: 'Media URL',
                name: 'mediaUrl',
                type: 'string',
                default: '{{$json.media_url}}',
                description: 'URL of the media file to include'
            },
            mediaTitle: {
                displayName: 'Media Title',
                name: 'mediaTitle',
                type: 'string',
                default: '',
                description: 'Title for the media (optional)'
            },
            mediaDescription: {
                displayName: 'Media Description',
                name: 'mediaDescription',
                type: 'string',
                default: '',
                description: 'Description for the media (optional)'
            },
            includeLink: {
                displayName: 'Include Link',
                name: 'includeLink',
                type: 'boolean',
                default: false,
                description: 'Include a clickable link in the post'
            },
            linkUrl: {
                displayName: 'Link URL',
                name: 'linkUrl',
                type: 'string',
                default: '{{$json.link_url}}',
                description: 'URL of the link to include'
            },
            linkTitle: {
                displayName: 'Link Title',
                name: 'linkTitle',
                type: 'string',
                default: '',
                description: 'Title for the link preview'
            },
            linkDescription: {
                displayName: 'Link Description',
                name: 'linkDescription',
                type: 'string',
                default: '',
                description: 'Description for the link preview'
            },
            hashtags: {
                displayName: 'Hashtags',
                name: 'hashtags',
                type: 'string',
                default: '',
                description: 'Comma-separated hashtags (without #)'
            },
            mentions: {
                displayName: 'Mentions',
                name: 'mentions',
                type: 'string',
                default: '',
                description: 'LinkedIn profile URLs or IDs to mention'
            },
            scheduledTime: {
                displayName: 'Schedule Post',
                name: 'scheduledTime',
                type: 'string',
                default: '',
                description: 'ISO timestamp to schedule post (leave empty for immediate)'
            },
            trackEngagement: {
                displayName: 'Track Engagement',
                name: 'trackEngagement',
                type: 'boolean',
                default: true,
                description: 'Enable engagement tracking for this post'
            },
            accessToken: {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                default: '{{$env.LINKEDIN_ACCESS_TOKEN}}',
                required: true,
                description: 'LinkedIn Access Token'
            }
        };
    }

    /**
     * Execute the LinkedIn Create Post node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing LinkedIn Create Post Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'linkedin_post_workflow', name: 'LinkedIn Create Post', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'linkedin_post', type: 'linkedinCreatePost' },
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

            console.log('📝 Creating LinkedIn post...');

            // Create the post
            const postResult = await this.createPost(
                processedConfig.postType,
                processedConfig.companyId,
                processedConfig.postText,
                processedConfig.visibility,
                processedConfig.includeMedia,
                processedConfig.mediaType,
                processedConfig.mediaUrl,
                processedConfig.mediaTitle,
                processedConfig.mediaDescription,
                processedConfig.includeLink,
                processedConfig.linkUrl,
                processedConfig.linkTitle,
                processedConfig.linkDescription,
                processedConfig.hashtags,
                processedConfig.mentions,
                processedConfig.scheduledTime,
                processedConfig.trackEngagement,
                processedConfig.accessToken
            );

            if (!postResult.success) {
                throw new Error(`Failed to create post: ${postResult.error}`);
            }

            console.log('✅ LinkedIn post created successfully');

            return {
                success: true,
                data: {
                    post_id: postResult.data.id,
                    post_url: postResult.data.url,
                    post_type: processedConfig.postType,
                    visibility: processedConfig.visibility,
                    scheduled: !!processedConfig.scheduledTime,
                    scheduled_time: processedConfig.scheduledTime,
                    created_at: new Date().toISOString(),
                    engagement_tracking: processedConfig.trackEngagement,
                    post_stats: postResult.data.stats
                },
                nodeType: this.type,
                message: 'LinkedIn post created successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ LinkedIn Create Post Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Create LinkedIn post
     */
    async createPost(postType, companyId, postText, visibility, includeMedia, mediaType, mediaUrl, mediaTitle, mediaDescription, includeLink, linkUrl, linkTitle, linkDescription, hashtags, mentions, scheduledTime, trackEngagement, accessToken) {
        try {
            console.log('📝 Creating LinkedIn post of type:', postType);

            // Process post text with hashtags and mentions
            const processedText = this.processPostText(postText, hashtags, mentions);

            // Build post payload based on type
            let postPayload;
            if (postType === 'company') {
                postPayload = await this.buildCompanyPostPayload(
                    companyId, processedText, visibility, includeMedia, mediaType, mediaUrl, 
                    mediaTitle, mediaDescription, includeLink, linkUrl, linkTitle, linkDescription
                );
            } else {
                postPayload = await this.buildPersonalPostPayload(
                    processedText, visibility, includeMedia, mediaType, mediaUrl,
                    mediaTitle, mediaDescription, includeLink, linkUrl, linkTitle, linkDescription
                );
            }

            // Add scheduling if specified
            if (scheduledTime) {
                const scheduleTime = new Date(scheduledTime).getTime();
                postPayload.lifecycleState = 'PUBLISHED';
                postPayload.publishedAt = scheduleTime;
            }

            // Determine API endpoint
            const apiEndpoint = postType === 'company' 
                ? 'https://api.linkedin.com/v2/ugcPosts'
                : 'https://api.linkedin.com/v2/ugcPosts';

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify(postPayload)
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.message || 'Failed to create LinkedIn post'
                };
            }

            // Extract post information
            const postData = {
                id: result.id,
                url: this.constructPostUrl(result.id, postType),
                stats: {
                    created_at: new Date().toISOString(),
                    character_count: processedText.length,
                    has_media: includeMedia,
                    has_link: includeLink,
                    hashtag_count: this.countHashtags(hashtags),
                    mention_count: this.countMentions(mentions)
                }
            };

            return {
                success: true,
                data: postData
            };

        } catch (error) {
            console.error('Error in createPost:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process post text with hashtags and mentions
     */
    processPostText(postText, hashtags, mentions) {
        let processedText = postText;

        // Add hashtags
        if (hashtags && hashtags.trim()) {
            const hashtagList = hashtags.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)
                .map(tag => `#${tag.replace('#', '')}`)
                .join(' ');
            
            if (hashtagList) {
                processedText += `\n\n${hashtagList}`;
            }
        }

        // Note: LinkedIn mentions require specific URN format
        // This is a simplified implementation
        if (mentions && mentions.trim()) {
            console.log('Note: LinkedIn mentions require specific URN format for full functionality');
        }

        return processedText;
    }

    /**
     * Build company post payload
     */
    async buildCompanyPostPayload(companyId, text, visibility, includeMedia, mediaType, mediaUrl, mediaTitle, mediaDescription, includeLink, linkUrl, linkTitle, linkDescription) {
        const payload = {
            author: `urn:li:organization:${companyId}`,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: text
                    },
                    shareMediaCategory: includeMedia ? 'IMAGE' : (includeLink ? 'ARTICLE' : 'NONE')
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': visibility
            }
        };

        // Add media content
        if (includeMedia && mediaUrl) {
            const mediaPayload = await this.buildMediaPayload(mediaType, mediaUrl, mediaTitle, mediaDescription);
            payload.specificContent['com.linkedin.ugc.ShareContent'].media = [mediaPayload];
        }

        // Add link content
        if (includeLink && linkUrl) {
            payload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
                status: 'READY',
                description: {
                    text: linkDescription || ''
                },
                originalUrl: linkUrl,
                title: {
                    text: linkTitle || ''
                }
            }];
        }

        return payload;
    }

    /**
     * Build personal post payload
     */
    async buildPersonalPostPayload(text, visibility, includeMedia, mediaType, mediaUrl, mediaTitle, mediaDescription, includeLink, linkUrl, linkTitle, linkDescription) {
        const payload = {
            author: 'urn:li:person:(id~)',
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: text
                    },
                    shareMediaCategory: includeMedia ? 'IMAGE' : (includeLink ? 'ARTICLE' : 'NONE')
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': visibility
            }
        };

        // Add media content
        if (includeMedia && mediaUrl) {
            const mediaPayload = await this.buildMediaPayload(mediaType, mediaUrl, mediaTitle, mediaDescription);
            payload.specificContent['com.linkedin.ugc.ShareContent'].media = [mediaPayload];
        }

        // Add link content
        if (includeLink && linkUrl) {
            payload.specificContent['com.linkedin.ugc.ShareContent'].media = [{
                status: 'READY',
                description: {
                    text: linkDescription || ''
                },
                originalUrl: linkUrl,
                title: {
                    text: linkTitle || ''
                }
            }];
        }

        return payload;
    }

    /**
     * Build media payload
     */
    async buildMediaPayload(mediaType, mediaUrl, mediaTitle, mediaDescription) {
        // Note: LinkedIn requires media to be uploaded first to get media URN
        // This is a simplified implementation
        return {
            status: 'READY',
            description: {
                text: mediaDescription || ''
            },
            media: mediaUrl, // In real implementation, this should be a media URN
            title: {
                text: mediaTitle || ''
            }
        };
    }

    /**
     * Construct post URL
     */
    constructPostUrl(postId, postType) {
        // Extract activity ID from URN if needed
        const activityId = postId.includes('urn:li:activity:') 
            ? postId.split('urn:li:activity:')[1] 
            : postId;
        
        return `https://www.linkedin.com/feed/update/${activityId}`;
    }

    /**
     * Count hashtags
     */
    countHashtags(hashtags) {
        if (!hashtags || !hashtags.trim()) return 0;
        return hashtags.split(',').filter(tag => tag.trim().length > 0).length;
    }

    /**
     * Count mentions
     */
    countMentions(mentions) {
        if (!mentions || !mentions.trim()) return 0;
        return mentions.split(',').filter(mention => mention.trim().length > 0).length;
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = [
            'companyId', 'postText', 'mediaUrl', 'mediaTitle', 'mediaDescription',
            'linkUrl', 'linkTitle', 'linkDescription', 'hashtags', 'mentions', 
            'scheduledTime', 'accessToken'
        ];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'linkedin_post';
                
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
        
        if (!config.postText || config.postText.trim() === '') {
            errors.push('Post text is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('LinkedIn Access Token is required');
        }

        if (config.postType === 'company' && (!config.companyId || config.companyId.trim() === '')) {
            errors.push('Company ID is required for company posts');
        }

        if (config.includeMedia && (!config.mediaUrl || config.mediaUrl.trim() === '')) {
            errors.push('Media URL is required when including media');
        }

        if (config.includeLink && (!config.linkUrl || config.linkUrl.trim() === '')) {
            errors.push('Link URL is required when including links');
        }

        // Validate post text length (LinkedIn limit is ~3000 characters)
        if (config.postText && config.postText.length > 3000) {
            errors.push('Post text exceeds LinkedIn character limit (3000 characters)');
        }

        // Validate scheduled time format
        if (config.scheduledTime && config.scheduledTime.trim() !== '') {
            const scheduleDate = new Date(config.scheduledTime);
            if (isNaN(scheduleDate.getTime())) {
                errors.push('Scheduled time must be in valid ISO format');
            } else if (scheduleDate <= new Date()) {
                errors.push('Scheduled time must be in the future');
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
            postType: 'personal',
            companyId: '',
            postText: 'Excited to share some great news with my network! 🚀',
            visibility: 'PUBLIC',
            includeMedia: false,
            mediaType: 'image',
            mediaUrl: '',
            mediaTitle: '',
            mediaDescription: '',
            includeLink: false,
            linkUrl: '',
            linkTitle: '',
            linkDescription: '',
            hashtags: 'linkedin,networking,professional',
            mentions: '',
            scheduledTime: '',
            trackEngagement: true,
            accessToken: 'your_linkedin_access_token'
        };
    }
}

module.exports = new LinkedInCreatePostNode();