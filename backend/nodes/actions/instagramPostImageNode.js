/*
=================================================================
FILE: backend/nodes/actions/instagramPostImageNode.js
=================================================================
Instagram Post Image Node - Post images to Instagram
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');
const { InstagramAPI } = require('../../services/instagramAPI');

class InstagramPostImageNode {
    constructor() {
        this.name = 'Instagram Post Image';
        this.type = 'instagramPostImage';
        this.icon = 'fab fa-instagram';
        this.description = 'Post images to Instagram feed';
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
            imageUrl: {
                displayName: 'Image URL',
                name: 'imageUrl',
                type: 'string',
                default: '{{$json.image_url}}',
                required: true,
                description: 'URL of the image to post'
            },
            caption: {
                displayName: 'Caption',
                name: 'caption',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: '{{$json.caption || "Check out this amazing post! 📸 #instagram #photo"}}',
                required: false,
                description: 'Post caption with hashtags (supports expressions)'
            },
            altText: {
                displayName: 'Alt Text',
                name: 'altText',
                type: 'string',
                default: '',
                description: 'Alternative text for accessibility'
            },
            publishNow: {
                displayName: 'Publish Immediately',
                name: 'publishNow',
                type: 'boolean',
                default: true,
                description: 'Publish immediately or save as draft'
            },
            locationId: {
                displayName: 'Location ID',
                name: 'locationId',
                type: 'string',
                default: '',
                description: 'Optional location/place ID to tag'
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
     * Execute the Instagram Post Image node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Instagram Post Image Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'instagram_post_image_workflow', name: 'Instagram Post Image', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'instagram_post_image', type: 'instagramPostImage' },
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

            console.log('📸 Posting image to Instagram...');

            // Post the image
            const postResult = await this.postImage(
                instagramAPI,
                processedConfig.accountId,
                processedConfig.imageUrl,
                processedConfig.caption,
                processedConfig.altText,
                processedConfig.locationId,
                processedConfig.publishNow,
                processedConfig.accessToken
            );

            if (!postResult.success) {
                throw new Error(`Failed to post image: ${postResult.error}`);
            }

            console.log('✅ Instagram image posted successfully');

            return {
                success: true,
                data: {
                    post_id: postResult.data.id,
                    image_url: processedConfig.imageUrl,
                    caption: processedConfig.caption,
                    published: processedConfig.publishNow,
                    posted_at: new Date().toISOString(),
                    account_id: processedConfig.accountId,
                    permalink: postResult.data.permalink || null
                },
                nodeType: this.type,
                message: 'Instagram image posted successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Instagram Post Image Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Post image to Instagram
     */
    async postImage(instagramAPI, accountId, imageUrl, caption, altText, locationId, publishNow, accessToken) {
        try {
            console.log('📤 Creating Instagram media container...');

            // Step 1: Create media container
            const containerUrl = `https://graph.facebook.com/v18.0/${accountId}/media`;
            
            const containerData = {
                image_url: imageUrl,
                caption: caption || '',
                access_token: accessToken
            };

            // Add optional parameters
            if (altText) {
                containerData.alt_text = altText;
            }
            
            if (locationId) {
                containerData.location_id = locationId;
            }

            const containerResponse = await fetch(containerUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(containerData)
            });

            const containerResult = await containerResponse.json();

            if (!containerResponse.ok) {
                return {
                    success: false,
                    error: containerResult.error?.message || 'Failed to create media container'
                };
            }

            const creationId = containerResult.id;
            console.log('✅ Media container created:', creationId);

            if (!publishNow) {
                return {
                    success: true,
                    data: {
                        id: creationId,
                        status: 'draft',
                        permalink: null
                    }
                };
            }

            // Step 2: Publish the media
            console.log('📢 Publishing media container...');
            
            const publishUrl = `https://graph.facebook.com/v18.0/${accountId}/media_publish`;
            const publishData = {
                creation_id: creationId,
                access_token: accessToken
            };

            const publishResponse = await fetch(publishUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(publishData)
            });

            const publishResult = await publishResponse.json();

            if (!publishResponse.ok) {
                return {
                    success: false,
                    error: publishResult.error?.message || 'Failed to publish media'
                };
            }

            // Step 3: Get post details including permalink
            const postId = publishResult.id;
            const detailsUrl = `https://graph.facebook.com/v18.0/${postId}`;
            const detailsParams = {
                fields: 'id,media_type,media_url,permalink,timestamp,caption',
                access_token: accessToken
            };

            const detailsResponse = await fetch(`${detailsUrl}?${new URLSearchParams(detailsParams)}`);
            const detailsResult = await detailsResponse.json();

            return {
                success: true,
                data: {
                    id: postId,
                    permalink: detailsResult.permalink,
                    media_type: detailsResult.media_type,
                    timestamp: detailsResult.timestamp
                }
            };

        } catch (error) {
            console.error('Error in postImage:', error);
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
        
        const templateFields = ['accountId', 'imageUrl', 'caption', 'altText', 'locationId', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'instagram_post_image';
                
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
        
        if (!config.imageUrl || config.imageUrl.trim() === '') {
            errors.push('Image URL is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
        }

        // Validate image URL format
        if (config.imageUrl && !this.isValidUrl(config.imageUrl)) {
            errors.push('Image URL must be a valid HTTP/HTTPS URL');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate URL format
     */
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
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
            imageUrl: 'https://example.com/image.jpg',
            caption: 'Check out this amazing post! 📸 #instagram #photo',
            altText: 'A beautiful sunset over the ocean',
            publishNow: true,
            locationId: '',
            accessToken: 'your_instagram_access_token'
        };
    }
}

module.exports = new InstagramPostImageNode();