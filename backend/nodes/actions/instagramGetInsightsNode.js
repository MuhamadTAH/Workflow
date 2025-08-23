/*
=================================================================
FILE: backend/nodes/actions/instagramGetInsightsNode.js
=================================================================
Instagram Get Insights Node - Get analytics and insights for Instagram account/posts
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');
const { InstagramAPI } = require('../../services/instagramAPI');

class InstagramGetInsightsNode {
    constructor() {
        this.name = 'Instagram Get Insights';
        this.type = 'instagramGetInsights';
        this.icon = 'fab fa-instagram';
        this.description = 'Get analytics and insights for Instagram account or posts';
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
            insightType: {
                displayName: 'Insight Type',
                name: 'insightType',
                type: 'options',
                options: [
                    { name: 'Account Insights', value: 'account' },
                    { name: 'Media Insights', value: 'media' }
                ],
                default: 'account',
                description: 'Type of insights to retrieve'
            },
            mediaId: {
                displayName: 'Media ID',
                name: 'mediaId',
                type: 'string',
                default: '{{$json.media_id}}',
                required: false,
                description: 'Media ID (required for media insights)'
            },
            metrics: {
                displayName: 'Metrics',
                name: 'metrics',
                type: 'options',
                options: [
                    { name: 'All Available', value: 'all' },
                    { name: 'Engagement', value: 'engagement' },
                    { name: 'Reach & Impressions', value: 'reach' },
                    { name: 'Custom', value: 'custom' }
                ],
                default: 'all',
                description: 'Which metrics to include'
            },
            customMetrics: {
                displayName: 'Custom Metrics',
                name: 'customMetrics',
                type: 'string',
                default: '',
                description: 'Comma-separated list of metrics (for custom option)'
            },
            period: {
                displayName: 'Time Period',
                name: 'period',
                type: 'options',
                options: [
                    { name: 'Last 7 Days', value: 'day' },
                    { name: 'Last 28 Days', value: 'week' },
                    { name: 'Lifetime', value: 'lifetime' }
                ],
                default: 'day',
                description: 'Time period for insights (account insights only)'
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
     * Execute the Instagram Get Insights node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Instagram Get Insights Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'instagram_insights_workflow', name: 'Instagram Get Insights', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'instagram_insights', type: 'instagramGetInsights' },
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

            console.log('📊 Fetching Instagram insights...');

            let insightsResult;
            
            if (processedConfig.insightType === 'account') {
                insightsResult = await this.getAccountInsights(
                    instagramAPI,
                    processedConfig.accountId,
                    processedConfig.metrics,
                    processedConfig.customMetrics,
                    processedConfig.period,
                    processedConfig.accessToken
                );
            } else {
                insightsResult = await this.getMediaInsights(
                    instagramAPI,
                    processedConfig.mediaId,
                    processedConfig.metrics,
                    processedConfig.customMetrics,
                    processedConfig.accessToken
                );
            }

            if (!insightsResult.success) {
                throw new Error(`Failed to get insights: ${insightsResult.error}`);
            }

            console.log('✅ Insights retrieved successfully');

            return {
                success: true,
                data: {
                    insights: insightsResult.data,
                    insight_type: processedConfig.insightType,
                    account_id: processedConfig.accountId,
                    media_id: processedConfig.mediaId || null,
                    period: processedConfig.period,
                    retrieved_at: new Date().toISOString()
                },
                nodeType: this.type,
                message: `Instagram ${processedConfig.insightType} insights retrieved successfully`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Instagram Get Insights Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get account insights
     */
    async getAccountInsights(instagramAPI, accountId, metrics, customMetrics, period, accessToken) {
        try {
            console.log('📈 Fetching account insights...');

            // Define available account metrics
            const accountMetrics = {
                all: ['impressions', 'reach', 'profile_views', 'website_clicks'],
                engagement: ['likes', 'comments', 'shares', 'saves'],
                reach: ['impressions', 'reach', 'profile_views']
            };

            let metricsToRequest;
            if (metrics === 'custom' && customMetrics) {
                metricsToRequest = customMetrics.split(',').map(m => m.trim());
            } else {
                metricsToRequest = accountMetrics[metrics] || accountMetrics.all;
            }

            const insightsUrl = `https://graph.facebook.com/v18.0/${accountId}/insights`;
            const params = {
                metric: metricsToRequest.join(','),
                period: period,
                access_token: accessToken
            };

            const response = await fetch(`${insightsUrl}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to get account insights'
                };
            }

            // Process insights data
            const insights = {};
            if (result.data) {
                result.data.forEach(insight => {
                    insights[insight.name] = {
                        value: insight.values[0]?.value || 0,
                        period: insight.period,
                        end_time: insight.values[0]?.end_time
                    };
                });
            }

            return {
                success: true,
                data: insights
            };

        } catch (error) {
            console.error('Error in getAccountInsights:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get media insights
     */
    async getMediaInsights(instagramAPI, mediaId, metrics, customMetrics, accessToken) {
        try {
            console.log('📊 Fetching media insights for:', mediaId);

            // Define available media metrics
            const mediaMetrics = {
                all: ['impressions', 'reach', 'likes', 'comments', 'shares', 'saves'],
                engagement: ['likes', 'comments', 'shares', 'saves'],
                reach: ['impressions', 'reach']
            };

            let metricsToRequest;
            if (metrics === 'custom' && customMetrics) {
                metricsToRequest = customMetrics.split(',').map(m => m.trim());
            } else {
                metricsToRequest = mediaMetrics[metrics] || mediaMetrics.all;
            }

            const insightsUrl = `https://graph.facebook.com/v18.0/${mediaId}/insights`;
            const params = {
                metric: metricsToRequest.join(','),
                access_token: accessToken
            };

            const response = await fetch(`${insightsUrl}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to get media insights'
                };
            }

            // Process insights data
            const insights = {};
            if (result.data) {
                result.data.forEach(insight => {
                    insights[insight.name] = {
                        value: insight.values[0]?.value || 0,
                        title: insight.title,
                        description: insight.description
                    };
                });
            }

            return {
                success: true,
                data: insights
            };

        } catch (error) {
            console.error('Error in getMediaInsights:', error);
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
        
        const templateFields = ['accountId', 'mediaId', 'customMetrics', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'instagram_insights';
                
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
        
        if (config.insightType === 'media' && (!config.mediaId || config.mediaId.trim() === '')) {
            errors.push('Media ID is required for media insights');
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
            insightType: 'account',
            mediaId: '',
            metrics: 'all',
            customMetrics: '',
            period: 'day',
            accessToken: 'your_instagram_access_token'
        };
    }
}

module.exports = new InstagramGetInsightsNode();