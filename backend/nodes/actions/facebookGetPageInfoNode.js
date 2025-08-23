/*
=================================================================
FILE: backend/nodes/actions/facebookGetPageInfoNode.js
=================================================================
Facebook Get Page Info Node - Get Facebook page information and metrics
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class FacebookGetPageInfoNode {
    constructor() {
        this.name = 'Facebook Get Page Info';
        this.type = 'facebookGetPageInfo';
        this.icon = 'fab fa-facebook';
        this.description = 'Get Facebook page information and metrics';
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
            fields: {
                displayName: 'Page Fields',
                name: 'fields',
                type: 'options',
                options: [
                    { name: 'All Fields', value: 'all' },
                    { name: 'Basic Info', value: 'basic' },
                    { name: 'Metrics Only', value: 'metrics' },
                    { name: 'Custom', value: 'custom' }
                ],
                default: 'all',
                description: 'Which page fields to retrieve'
            },
            customFields: {
                displayName: 'Custom Fields',
                name: 'customFields',
                type: 'string',
                default: '',
                description: 'Comma-separated list of fields (for custom option)'
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
     * Execute the Facebook Get Page Info node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Facebook Get Page Info Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'facebook_page_info_workflow', name: 'Facebook Get Page Info', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'facebook_page_info', type: 'facebookGetPageInfo' },
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

            console.log('📘 Fetching Facebook page information...');

            // Get page information
            const pageResult = await this.getPageInfo(
                processedConfig.pageId,
                processedConfig.fields,
                processedConfig.customFields,
                processedConfig.accessToken
            );

            if (!pageResult.success) {
                throw new Error(`Failed to get page info: ${pageResult.error}`);
            }

            console.log('✅ Facebook page information retrieved successfully');

            return {
                success: true,
                data: {
                    page: pageResult.data,
                    page_id: processedConfig.pageId,
                    retrieved_at: new Date().toISOString()
                },
                nodeType: this.type,
                message: 'Facebook page information retrieved successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Facebook Get Page Info Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get Facebook page information
     */
    async getPageInfo(pageId, fields, customFields, accessToken) {
        try {
            console.log('📋 Fetching page information for:', pageId);

            // Define available page fields
            const pageFields = {
                all: [
                    'id', 'name', 'username', 'about', 'description', 'category',
                    'website', 'phone', 'emails', 'fan_count', 'followers_count',
                    'picture', 'cover', 'location', 'hours', 'link', 'verification_status',
                    'page_token', 'talking_about_count', 'were_here_count', 'checkins'
                ],
                basic: ['id', 'name', 'username', 'about', 'category', 'website', 'picture', 'link'],
                metrics: ['fan_count', 'followers_count', 'talking_about_count', 'were_here_count', 'checkins']
            };

            let fieldsToRequest;
            if (fields === 'custom' && customFields) {
                fieldsToRequest = customFields.split(',').map(f => f.trim());
            } else {
                fieldsToRequest = pageFields[fields] || pageFields.all;
            }

            const pageUrl = `https://graph.facebook.com/v18.0/${pageId}`;
            const params = {
                fields: fieldsToRequest.join(','),
                access_token: accessToken
            };

            const response = await fetch(`${pageUrl}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to get page information'
                };
            }

            // Enhance the page data with additional computed fields
            const enhancedPage = {
                ...result,
                engagement_rate: this.calculateEngagementRate(result),
                page_health: this.assessPageHealth(result),
                last_updated: new Date().toISOString()
            };

            return {
                success: true,
                data: enhancedPage
            };

        } catch (error) {
            console.error('Error in getPageInfo:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate engagement rate
     */
    calculateEngagementRate(page) {
        if (!page.fan_count || !page.talking_about_count) {
            return null;
        }

        const engagementRate = (page.talking_about_count / page.fan_count) * 100;
        return Math.round(engagementRate * 100) / 100; // Round to 2 decimal places
    }

    /**
     * Assess page health
     */
    assessPageHealth(page) {
        const health = {
            has_profile_picture: !!page.picture,
            has_cover_photo: !!page.cover,
            has_about_info: !!page.about,
            has_contact_info: !!(page.website || page.phone || page.emails?.length),
            is_verified: page.verification_status === 'blue_verified' || page.verification_status === 'gray_verified',
            has_followers: (page.fan_count || 0) > 0,
            is_active: (page.talking_about_count || 0) > 0
        };

        // Calculate completeness score
        const totalChecks = Object.keys(health).length;
        const completedChecks = Object.values(health).filter(Boolean).length;
        health.completeness_score = Math.round((completedChecks / totalChecks) * 100);

        return health;
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['pageId', 'customFields', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'facebook_page_info';
                
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
            fields: 'all',
            customFields: '',
            accessToken: 'your_facebook_page_access_token'
        };
    }
}

module.exports = new FacebookGetPageInfoNode();