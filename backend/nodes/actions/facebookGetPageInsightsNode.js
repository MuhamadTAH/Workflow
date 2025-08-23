/*
=================================================================
FILE: backend/nodes/actions/facebookGetPageInsightsNode.js
=================================================================
Facebook Get Page Insights Node - Get Facebook page analytics and metrics
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class FacebookGetPageInsightsNode {
    constructor() {
        this.name = 'Facebook Get Page Insights';
        this.type = 'facebookGetPageInsights';
        this.icon = 'fab fa-facebook';
        this.description = 'Get Facebook page analytics and metrics';
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
                description: 'Facebook Page ID to get insights for'
            },
            metrics: {
                displayName: 'Metrics to Retrieve',
                name: 'metrics',
                type: 'options',
                options: [
                    { name: 'All Metrics', value: 'all' },
                    { name: 'Page Views & Reach', value: 'views_reach' },
                    { name: 'Engagement Metrics', value: 'engagement' },
                    { name: 'Fan Insights', value: 'fans' },
                    { name: 'Post Performance', value: 'posts' },
                    { name: 'Video Metrics', value: 'videos' },
                    { name: 'Custom Metrics', value: 'custom' }
                ],
                default: 'all',
                description: 'Which metrics to retrieve'
            },
            customMetrics: {
                displayName: 'Custom Metrics',
                name: 'customMetrics',
                type: 'string',
                default: '',
                description: 'Comma-separated list of metric names (for custom option)'
            },
            period: {
                displayName: 'Time Period',
                name: 'period',
                type: 'options',
                options: [
                    { name: 'Day', value: 'day' },
                    { name: 'Week', value: 'week' },
                    { name: 'Days 28', value: 'days_28' },
                    { name: 'Month', value: 'month' },
                    { name: 'Lifetime', value: 'lifetime' }
                ],
                default: 'day',
                description: 'Time period for metrics'
            },
            since: {
                displayName: 'Since Date',
                name: 'since',
                type: 'string',
                default: '',
                description: 'Start date for metrics (YYYY-MM-DD format)'
            },
            until: {
                displayName: 'Until Date',
                name: 'until',
                type: 'string',
                default: '',
                description: 'End date for metrics (YYYY-MM-DD format)'
            },
            includeDemographics: {
                displayName: 'Include Demographics',
                name: 'includeDemographics',
                type: 'boolean',
                default: true,
                description: 'Include audience demographics data'
            },
            includeBreakdowns: {
                displayName: 'Include Breakdowns',
                name: 'includeBreakdowns',
                type: 'boolean',
                default: false,
                description: 'Include metric breakdowns (age, gender, location)'
            },
            compareWithPrevious: {
                displayName: 'Compare with Previous Period',
                name: 'compareWithPrevious',
                type: 'boolean',
                default: true,
                description: 'Compare metrics with previous period'
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
     * Execute the Facebook Get Page Insights node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Facebook Get Page Insights Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'facebook_insights_workflow', name: 'Facebook Get Page Insights', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'facebook_insights', type: 'facebookGetPageInsights' },
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

            console.log('📊 Fetching Facebook page insights...');

            // Get page insights
            const insightsResult = await this.getPageInsights(
                processedConfig.pageId,
                processedConfig.metrics,
                processedConfig.customMetrics,
                processedConfig.period,
                processedConfig.since,
                processedConfig.until,
                processedConfig.includeDemographics,
                processedConfig.includeBreakdowns,
                processedConfig.compareWithPrevious,
                processedConfig.accessToken
            );

            if (!insightsResult.success) {
                throw new Error(`Failed to get page insights: ${insightsResult.error}`);
            }

            console.log('✅ Facebook page insights retrieved successfully');

            return {
                success: true,
                data: {
                    insights: insightsResult.data.insights,
                    demographics: insightsResult.data.demographics,
                    comparison: insightsResult.data.comparison,
                    summary: insightsResult.data.summary,
                    page_id: processedConfig.pageId,
                    period: processedConfig.period,
                    date_range: insightsResult.data.date_range,
                    retrieved_at: new Date().toISOString()
                },
                nodeType: this.type,
                message: 'Facebook page insights retrieved successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Facebook Get Page Insights Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get Facebook page insights
     */
    async getPageInsights(pageId, metrics, customMetrics, period, since, until, includeDemographics, includeBreakdowns, compareWithPrevious, accessToken) {
        try {
            console.log('📈 Fetching insights for page:', pageId);

            // Define available metrics by category
            const metricSets = {
                all: [
                    // Page Views & Reach
                    'page_views_total', 'page_views_unique', 'page_fan_adds', 'page_fan_removes',
                    'page_impressions', 'page_impressions_unique', 'page_impressions_paid',
                    'page_impressions_organic', 'page_reach', 'page_reach_unique',
                    // Engagement
                    'page_engaged_users', 'page_post_engagements', 'page_consumptions',
                    'page_consumptions_unique', 'page_places_checkin_total',
                    'page_negative_feedback', 'page_positive_feedback',
                    // Posts
                    'page_posts_impressions', 'page_posts_impressions_unique',
                    'page_posts_impressions_paid', 'page_posts_impressions_organic',
                    // Videos
                    'page_video_views', 'page_video_views_paid', 'page_video_views_organic',
                    'page_video_complete_views_30s'
                ],
                views_reach: [
                    'page_views_total', 'page_views_unique', 'page_impressions',
                    'page_impressions_unique', 'page_reach', 'page_reach_unique'
                ],
                engagement: [
                    'page_engaged_users', 'page_post_engagements', 'page_consumptions',
                    'page_consumptions_unique', 'page_positive_feedback', 'page_negative_feedback'
                ],
                fans: [
                    'page_fan_adds', 'page_fan_removes', 'page_fans', 'page_fans_online'
                ],
                posts: [
                    'page_posts_impressions', 'page_posts_impressions_unique',
                    'page_posts_impressions_paid', 'page_posts_impressions_organic'
                ],
                videos: [
                    'page_video_views', 'page_video_views_paid', 'page_video_views_organic',
                    'page_video_complete_views_30s'
                ]
            };

            let metricsToRequest;
            if (metrics === 'custom' && customMetrics) {
                metricsToRequest = customMetrics.split(',').map(m => m.trim());
            } else {
                metricsToRequest = metricSets[metrics] || metricSets.all;
            }

            // Build date range
            const dateRange = this.buildDateRange(period, since, until);

            const insightsUrl = `https://graph.facebook.com/v18.0/${pageId}/insights`;
            const params = {
                metric: metricsToRequest.join(','),
                period: period,
                access_token: accessToken
            };

            if (dateRange.since) params.since = dateRange.since;
            if (dateRange.until) params.until = dateRange.until;

            const response = await fetch(`${insightsUrl}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to get page insights'
                };
            }

            // Process insights data
            const processedInsights = this.processInsightsData(result.data || []);

            // Get demographics if requested
            let demographics = null;
            if (includeDemographics) {
                demographics = await this.getDemographics(pageId, dateRange, accessToken);
            }

            // Get comparison data if requested
            let comparison = null;
            if (compareWithPrevious) {
                comparison = await this.getComparisonData(pageId, metricsToRequest, period, dateRange, accessToken);
            }

            // Create summary
            const summary = this.createInsightsSummary(processedInsights, demographics, comparison);

            return {
                success: true,
                data: {
                    insights: processedInsights,
                    demographics: demographics,
                    comparison: comparison,
                    summary: summary,
                    date_range: dateRange
                }
            };

        } catch (error) {
            console.error('Error in getPageInsights:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process insights data into organized format
     */
    processInsightsData(insightsData) {
        const processed = {};

        insightsData.forEach(metric => {
            const metricName = metric.name;
            const values = metric.values || [];

            processed[metricName] = {
                name: metricName,
                title: metric.title,
                description: metric.description,
                period: metric.period,
                values: values.map(value => ({
                    value: value.value,
                    end_time: value.end_time
                })),
                total: this.calculateTotal(values),
                latest: values.length > 0 ? values[values.length - 1].value : 0,
                trend: this.calculateTrend(values)
            };
        });

        return processed;
    }

    /**
     * Calculate total for metric values
     */
    calculateTotal(values) {
        if (!values || values.length === 0) return 0;
        
        // For cumulative metrics, use latest value
        // For periodic metrics, sum all values
        const sample = values[0];
        if (typeof sample.value === 'number') {
            return values.reduce((sum, v) => sum + (v.value || 0), 0);
        }
        
        return values[values.length - 1]?.value || 0;
    }

    /**
     * Calculate trend for metric values
     */
    calculateTrend(values) {
        if (!values || values.length < 2) return { direction: 'stable', percentage: 0 };

        const latest = values[values.length - 1]?.value || 0;
        const previous = values[values.length - 2]?.value || 0;

        if (previous === 0) return { direction: 'stable', percentage: 0 };

        const percentage = ((latest - previous) / previous) * 100;
        const direction = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable';

        return {
            direction,
            percentage: Math.round(Math.abs(percentage) * 100) / 100,
            change: latest - previous
        };
    }

    /**
     * Get audience demographics
     */
    async getDemographics(pageId, dateRange, accessToken) {
        try {
            const demographicsMetrics = [
                'page_fans_gender_age',
                'page_fans_country',
                'page_fans_city',
                'page_fans_locale'
            ];

            const promises = demographicsMetrics.map(async (metric) => {
                const url = `https://graph.facebook.com/v18.0/${pageId}/insights`;
                const params = {
                    metric: metric,
                    period: 'lifetime',
                    access_token: accessToken
                };

                try {
                    const response = await fetch(`${url}?${new URLSearchParams(params)}`);
                    const result = await response.json();
                    return { metric, data: result.data?.[0] };
                } catch (error) {
                    console.warn(`Failed to get demographic metric ${metric}:`, error);
                    return { metric, data: null };
                }
            });

            const results = await Promise.all(promises);
            const demographics = {};

            results.forEach(({ metric, data }) => {
                if (data && data.values && data.values.length > 0) {
                    demographics[metric] = data.values[data.values.length - 1].value;
                }
            });

            return demographics;

        } catch (error) {
            console.warn('Failed to get demographics:', error);
            return null;
        }
    }

    /**
     * Get comparison data with previous period
     */
    async getComparisonData(pageId, metrics, period, currentDateRange, accessToken) {
        try {
            const previousDateRange = this.getPreviousDateRange(period, currentDateRange);

            const url = `https://graph.facebook.com/v18.0/${pageId}/insights`;
            const params = {
                metric: metrics.slice(0, 10).join(','), // Limit to prevent API limits
                period: period,
                since: previousDateRange.since,
                until: previousDateRange.until,
                access_token: accessToken
            };

            const response = await fetch(`${url}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) return null;

            const previousData = this.processInsightsData(result.data || []);
            return {
                previous_period: previousDateRange,
                metrics: previousData
            };

        } catch (error) {
            console.warn('Failed to get comparison data:', error);
            return null;
        }
    }

    /**
     * Build date range for insights
     */
    buildDateRange(period, since, until) {
        const dateRange = {};

        if (since) {
            const sinceDate = new Date(since);
            if (!isNaN(sinceDate.getTime())) {
                dateRange.since = Math.floor(sinceDate.getTime() / 1000);
            }
        }

        if (until) {
            const untilDate = new Date(until);
            if (!isNaN(untilDate.getTime())) {
                dateRange.until = Math.floor(untilDate.getTime() / 1000);
            }
        }

        // Set default date range if not specified
        if (!dateRange.since && !dateRange.until) {
            const now = new Date();
            const daysBack = period === 'day' ? 7 : period === 'week' ? 28 : 30;
            const pastDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

            dateRange.since = Math.floor(pastDate.getTime() / 1000);
            dateRange.until = Math.floor(now.getTime() / 1000);
        }

        return dateRange;
    }

    /**
     * Get previous period date range for comparison
     */
    getPreviousDateRange(period, currentRange) {
        if (!currentRange.since || !currentRange.until) return null;

        const duration = currentRange.until - currentRange.since;
        
        return {
            since: currentRange.since - duration,
            until: currentRange.since
        };
    }

    /**
     * Create insights summary
     */
    createInsightsSummary(insights, demographics, comparison) {
        const summary = {
            key_metrics: {},
            performance: {},
            audience: {},
            trends: {}
        };

        // Key metrics
        if (insights.page_reach) {
            summary.key_metrics.reach = insights.page_reach.latest;
        }
        if (insights.page_impressions) {
            summary.key_metrics.impressions = insights.page_impressions.latest;
        }
        if (insights.page_engaged_users) {
            summary.key_metrics.engaged_users = insights.page_engaged_users.latest;
        }
        if (insights.page_fans) {
            summary.key_metrics.total_fans = insights.page_fans.latest;
        }

        // Performance indicators
        const totalReach = insights.page_reach?.total || 0;
        const totalEngagement = insights.page_engaged_users?.total || 0;
        if (totalReach > 0) {
            summary.performance.engagement_rate = Math.round((totalEngagement / totalReach) * 10000) / 100;
        }

        // Audience insights
        if (demographics) {
            summary.audience = {
                has_demographic_data: true,
                top_countries: this.getTopFromDemographic(demographics.page_fans_country),
                gender_split: demographics.page_fans_gender_age
            };
        }

        // Trends
        summary.trends = {
            reach_trend: insights.page_reach?.trend,
            engagement_trend: insights.page_engaged_users?.trend,
            fans_trend: insights.page_fans?.trend
        };

        // Comparison with previous period
        if (comparison) {
            summary.comparison = {
                has_comparison: true,
                period_over_period: this.calculatePeriodOverPeriod(insights, comparison.metrics)
            };
        }

        return summary;
    }

    /**
     * Get top items from demographic data
     */
    getTopFromDemographic(demographicData, limit = 5) {
        if (!demographicData || typeof demographicData !== 'object') return [];

        return Object.entries(demographicData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([key, value]) => ({ name: key, count: value }));
    }

    /**
     * Calculate period-over-period comparison
     */
    calculatePeriodOverPeriod(currentInsights, previousInsights) {
        const comparison = {};

        Object.keys(currentInsights).forEach(metric => {
            if (previousInsights[metric]) {
                const current = currentInsights[metric].latest || 0;
                const previous = previousInsights[metric].latest || 0;
                
                if (previous > 0) {
                    const change = ((current - previous) / previous) * 100;
                    comparison[metric] = {
                        current,
                        previous,
                        change_percentage: Math.round(change * 100) / 100,
                        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
                    };
                }
            }
        });

        return comparison;
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['pageId', 'customMetrics', 'since', 'until', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'facebook_insights';
                
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
            metrics: 'all',
            customMetrics: '',
            period: 'day',
            since: '',
            until: '',
            includeDemographics: true,
            includeBreakdowns: false,
            compareWithPrevious: true,
            accessToken: 'your_facebook_page_access_token'
        };
    }
}

module.exports = new FacebookGetPageInsightsNode();