/*
=================================================================
FILE: backend/nodes/actions/instagramGetProfileNode.js
=================================================================
Instagram Get Profile Node - Get Instagram account profile information
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');
const { InstagramAPI } = require('../../services/instagramAPI');

class InstagramGetProfileNode {
    constructor() {
        this.name = 'Instagram Get Profile';
        this.type = 'instagramGetProfile';
        this.icon = 'fab fa-instagram';
        this.description = 'Get Instagram account profile information';
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
            fields: {
                displayName: 'Profile Fields',
                name: 'fields',
                type: 'options',
                options: [
                    { name: 'All Fields', value: 'all' },
                    { name: 'Basic Info', value: 'basic' },
                    { name: 'Metrics Only', value: 'metrics' },
                    { name: 'Custom', value: 'custom' }
                ],
                default: 'all',
                description: 'Which profile fields to retrieve'
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
                default: '{{$env.INSTAGRAM_ACCESS_TOKEN}}',
                required: true,
                description: 'Instagram API Access Token'
            }
        };
    }

    /**
     * Execute the Instagram Get Profile node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Instagram Get Profile Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'instagram_profile_workflow', name: 'Instagram Get Profile', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'instagram_profile', type: 'instagramGetProfile' },
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

            console.log('👤 Fetching Instagram profile...');

            // Get profile information
            const profileResult = await this.getProfileInfo(
                instagramAPI,
                processedConfig.accountId,
                processedConfig.fields,
                processedConfig.customFields,
                processedConfig.accessToken
            );

            if (!profileResult.success) {
                throw new Error(`Failed to get profile: ${profileResult.error}`);
            }

            console.log('✅ Profile information retrieved successfully');

            return {
                success: true,
                data: {
                    profile: profileResult.data,
                    account_id: processedConfig.accountId,
                    retrieved_at: new Date().toISOString()
                },
                nodeType: this.type,
                message: 'Instagram profile information retrieved successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Instagram Get Profile Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get Instagram profile information
     */
    async getProfileInfo(instagramAPI, accountId, fields, customFields, accessToken) {
        try {
            console.log('📋 Fetching profile information...');

            // Define available profile fields
            const profileFields = {
                all: [
                    'id', 'username', 'name', 'biography', 'website',
                    'profile_picture_url', 'followers_count', 'follows_count',
                    'media_count', 'account_type'
                ],
                basic: ['id', 'username', 'name', 'biography', 'website', 'profile_picture_url'],
                metrics: ['followers_count', 'follows_count', 'media_count']
            };

            let fieldsToRequest;
            if (fields === 'custom' && customFields) {
                fieldsToRequest = customFields.split(',').map(f => f.trim());
            } else {
                fieldsToRequest = profileFields[fields] || profileFields.all;
            }

            const profileUrl = `https://graph.facebook.com/v18.0/${accountId}`;
            const params = {
                fields: fieldsToRequest.join(','),
                access_token: accessToken
            };

            const response = await fetch(`${profileUrl}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to get profile information'
                };
            }

            // Enhance the profile data with additional computed fields
            const enhancedProfile = {
                ...result,
                engagement_rate: this.calculateEngagementRate(result),
                account_status: this.getAccountStatus(result),
                profile_completeness: this.calculateProfileCompleteness(result),
                last_updated: new Date().toISOString()
            };

            return {
                success: true,
                data: enhancedProfile
            };

        } catch (error) {
            console.error('Error in getProfileInfo:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate engagement rate (basic estimation)
     */
    calculateEngagementRate(profile) {
        if (!profile.followers_count || profile.followers_count === 0) {
            return 0;
        }

        // This is a basic estimation - in practice you'd need recent post data
        // For now, return null to indicate it needs to be calculated with actual post data
        return null;
    }

    /**
     * Get account status based on profile data
     */
    getAccountStatus(profile) {
        const status = {
            verified: profile.is_verified || false,
            business_account: profile.account_type === 'BUSINESS',
            complete_profile: !!profile.biography && !!profile.website,
            has_content: profile.media_count > 0
        };

        return status;
    }

    /**
     * Calculate profile completeness percentage
     */
    calculateProfileCompleteness(profile) {
        const fields = [
            profile.name,
            profile.biography,
            profile.website,
            profile.profile_picture_url,
            profile.media_count > 0
        ];

        const completed = fields.filter(field => !!field).length;
        return Math.round((completed / fields.length) * 100);
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['accountId', 'customFields', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'instagram_profile';
                
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
            fields: 'all',
            customFields: '',
            accessToken: 'your_instagram_access_token'
        };
    }
}

module.exports = new InstagramGetProfileNode();