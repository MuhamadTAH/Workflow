/*
=================================================================
FILE: backend/nodes/actions/linkedinGetProfileNode.js
=================================================================
LinkedIn Get Profile Node - Get LinkedIn profile information and details
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class LinkedInGetProfileNode {
    constructor() {
        this.name = 'LinkedIn Get Profile';
        this.type = 'linkedinGetProfile';
        this.icon = 'fab fa-linkedin';
        this.description = 'Get LinkedIn profile information and details';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            profileId: {
                displayName: 'Profile ID',
                name: 'profileId',
                type: 'string',
                default: '{{$json.profile_id || "me"}}',
                required: false,
                description: 'LinkedIn Profile ID (use "me" for authenticated user)'
            },
            fields: {
                displayName: 'Profile Fields',
                name: 'fields',
                type: 'options',
                options: [
                    { name: 'All Fields', value: 'all' },
                    { name: 'Basic Info', value: 'basic' },
                    { name: 'Contact Info', value: 'contact' },
                    { name: 'Experience', value: 'experience' },
                    { name: 'Education', value: 'education' },
                    { name: 'Skills', value: 'skills' },
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
            includeProfilePicture: {
                displayName: 'Include Profile Picture',
                name: 'includeProfilePicture',
                type: 'boolean',
                default: true,
                description: 'Include profile picture URLs'
            },
            includeConnections: {
                displayName: 'Include Connection Count',
                name: 'includeConnections',
                type: 'boolean',
                default: true,
                description: 'Include connection count (if available)'
            },
            includeRecentActivity: {
                displayName: 'Include Recent Activity',
                name: 'includeRecentActivity',
                type: 'boolean',
                default: false,
                description: 'Include recent posts and activity'
            },
            activityLimit: {
                displayName: 'Activity Limit',
                name: 'activityLimit',
                type: 'number',
                default: 5,
                description: 'Number of recent activities to include (1-20)'
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
     * Execute the LinkedIn Get Profile node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing LinkedIn Get Profile Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'linkedin_profile_workflow', name: 'LinkedIn Get Profile', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'linkedin_profile', type: 'linkedinGetProfile' },
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

            console.log('👤 Fetching LinkedIn profile information...');

            // Get profile information
            const profileResult = await this.getProfile(
                processedConfig.profileId,
                processedConfig.fields,
                processedConfig.customFields,
                processedConfig.includeProfilePicture,
                processedConfig.includeConnections,
                processedConfig.includeRecentActivity,
                processedConfig.activityLimit,
                processedConfig.accessToken
            );

            if (!profileResult.success) {
                throw new Error(`Failed to get profile: ${profileResult.error}`);
            }

            console.log('✅ LinkedIn profile information retrieved successfully');

            return {
                success: true,
                data: {
                    profile: profileResult.data.profile,
                    connections: profileResult.data.connections,
                    recent_activity: profileResult.data.recent_activity,
                    profile_id: processedConfig.profileId,
                    retrieved_at: new Date().toISOString(),
                    profile_stats: profileResult.data.profile_stats
                },
                nodeType: this.type,
                message: 'LinkedIn profile information retrieved successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ LinkedIn Get Profile Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get LinkedIn profile information
     */
    async getProfile(profileId, fields, customFields, includeProfilePicture, includeConnections, includeRecentActivity, activityLimit, accessToken) {
        try {
            console.log('👤 Fetching profile for:', profileId);

            // Define available profile fields
            const profileFields = {
                all: [
                    'id', 'firstName', 'lastName', 'localizedFirstName', 'localizedLastName',
                    'headline', 'summary', 'industryName', 'locationName', 'numConnections',
                    'vanityName', 'profilePicture'
                ],
                basic: ['id', 'firstName', 'lastName', 'localizedFirstName', 'localizedLastName', 'headline'],
                contact: ['id', 'firstName', 'lastName', 'locationName', 'industryName', 'numConnections'],
                experience: ['id', 'firstName', 'lastName', 'headline', 'summary', 'industryName'],
                education: ['id', 'firstName', 'lastName', 'headline'],
                skills: ['id', 'firstName', 'lastName', 'headline', 'summary']
            };

            let fieldsToRequest;
            if (fields === 'custom' && customFields) {
                fieldsToRequest = customFields.split(',').map(f => f.trim());
            } else {
                fieldsToRequest = profileFields[fields] || profileFields.all;
            }

            // Add profile picture fields if requested
            if (includeProfilePicture && !fieldsToRequest.includes('profilePicture')) {
                fieldsToRequest.push('profilePicture(displayImage~:playableStreams)');
            }

            const profileUrl = `https://api.linkedin.com/v2/people/${profileId === 'me' ? '(id~)' : `(id:${profileId})`}`;
            const params = {
                projection: `(${fieldsToRequest.join(',')})`
            };

            const response = await fetch(`${profileUrl}?${new URLSearchParams(params)}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const profileData = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: profileData.message || 'Failed to get profile information'
                };
            }

            // Process profile data
            const processedProfile = this.processProfileData(profileData);

            // Get connections data if requested
            let connectionsData = null;
            if (includeConnections && profileId === 'me') {
                connectionsData = await this.getConnectionsData(accessToken);
            }

            // Get recent activity if requested
            let recentActivity = null;
            if (includeRecentActivity && profileId === 'me') {
                recentActivity = await this.getRecentActivity(activityLimit, accessToken);
            }

            // Calculate profile stats
            const profileStats = this.calculateProfileStats(processedProfile, connectionsData);

            return {
                success: true,
                data: {
                    profile: processedProfile,
                    connections: connectionsData,
                    recent_activity: recentActivity,
                    profile_stats: profileStats
                }
            };

        } catch (error) {
            console.error('Error in getProfile:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process profile data into organized format
     */
    processProfileData(profileData) {
        const processed = {
            ...profileData,
            full_name: this.getFullName(profileData),
            profile_url: this.getProfileUrl(profileData),
            profile_picture_urls: this.extractProfilePictures(profileData.profilePicture),
            profile_completeness: this.assessProfileCompleteness(profileData)
        };

        return processed;
    }

    /**
     * Get full name from profile data
     */
    getFullName(profileData) {
        const firstName = profileData.localizedFirstName || profileData.firstName?.localized?.en_US || '';
        const lastName = profileData.localizedLastName || profileData.lastName?.localized?.en_US || '';
        return `${firstName} ${lastName}`.trim();
    }

    /**
     * Get profile URL
     */
    getProfileUrl(profileData) {
        if (profileData.vanityName) {
            return `https://www.linkedin.com/in/${profileData.vanityName}`;
        }
        if (profileData.id) {
            return `https://www.linkedin.com/profile/view?id=${profileData.id}`;
        }
        return null;
    }

    /**
     * Extract profile picture URLs
     */
    extractProfilePictures(profilePicture) {
        if (!profilePicture?.displayImage) return null;

        const pictures = {};
        const elements = profilePicture.displayImage['elements'] || [];

        elements.forEach(element => {
            if (element.identifiers && element.identifiers.length > 0) {
                const identifier = element.identifiers[0].identifier;
                const size = this.determinePictureSize(element);
                pictures[size] = identifier;
            }
        });

        return Object.keys(pictures).length > 0 ? pictures : null;
    }

    /**
     * Determine picture size from element data
     */
    determinePictureSize(element) {
        const data = element.data || {};
        const width = data['com.linkedin.digitalmedia.mediaartifact.StillImage']?.storageSize?.width;
        
        if (!width) return 'original';
        if (width <= 100) return 'small';
        if (width <= 400) return 'medium';
        return 'large';
    }

    /**
     * Assess profile completeness
     */
    assessProfileCompleteness(profileData) {
        const checks = {
            has_profile_picture: !!profileData.profilePicture,
            has_headline: !!profileData.headline,
            has_summary: !!profileData.summary,
            has_location: !!profileData.locationName,
            has_industry: !!profileData.industryName,
            has_connections: !!(profileData.numConnections && profileData.numConnections > 0)
        };

        const totalChecks = Object.keys(checks).length;
        const completedChecks = Object.values(checks).filter(Boolean).length;
        const completenessScore = Math.round((completedChecks / totalChecks) * 100);

        return {
            ...checks,
            completeness_score: completenessScore,
            completed_sections: completedChecks,
            total_sections: totalChecks
        };
    }

    /**
     * Get connections data
     */
    async getConnectionsData(accessToken) {
        try {
            // Note: LinkedIn API has limited access to connections
            // This is a basic implementation that may require elevated permissions
            const connectionsUrl = 'https://api.linkedin.com/v2/connections';
            
            const response = await fetch(connectionsUrl, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Could not fetch connections data - may require elevated permissions');
                return null;
            }

            const connectionsData = await response.json();
            return {
                total_connections: connectionsData.paging?.total || 0,
                recent_connections: connectionsData.elements?.slice(0, 5) || []
            };

        } catch (error) {
            console.warn('Failed to get connections data:', error);
            return null;
        }
    }

    /**
     * Get recent activity
     */
    async getRecentActivity(limit, accessToken) {
        try {
            // Note: This requires specific permissions and may not be available for all apps
            const activitiesUrl = 'https://api.linkedin.com/v2/shares';
            const params = {
                q: 'owners',
                owners: 'urn:li:person:(id~)',
                count: Math.min(limit, 20)
            };

            const response = await fetch(`${activitiesUrl}?${new URLSearchParams(params)}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Could not fetch recent activity - may require elevated permissions');
                return null;
            }

            const activityData = await response.json();
            const activities = activityData.elements || [];

            return activities.map(activity => ({
                id: activity.id,
                created_at: activity.created?.time,
                text: activity.text?.text || '',
                activity_type: this.determineActivityType(activity),
                engagement: {
                    likes: activity.totalSocialActivityCounts?.numLikes || 0,
                    comments: activity.totalSocialActivityCounts?.numComments || 0,
                    shares: activity.totalSocialActivityCounts?.numShares || 0
                }
            }));

        } catch (error) {
            console.warn('Failed to get recent activity:', error);
            return null;
        }
    }

    /**
     * Determine activity type
     */
    determineActivityType(activity) {
        if (activity.content?.contentEntities) return 'share';
        if (activity.content?.article) return 'article';
        if (activity.text) return 'post';
        return 'unknown';
    }

    /**
     * Calculate profile statistics
     */
    calculateProfileStats(profile, connections) {
        const stats = {
            profile_strength: this.calculateProfileStrength(profile),
            network_size: connections?.total_connections || profile.numConnections || 0,
            industry: profile.industryName || 'Not specified',
            location: profile.locationName || 'Not specified'
        };

        // Add engagement potential based on network size
        if (stats.network_size > 0) {
            stats.network_tier = this.getNetworkTier(stats.network_size);
            stats.estimated_reach = this.estimateReach(stats.network_size);
        }

        return stats;
    }

    /**
     * Calculate profile strength score
     */
    calculateProfileStrength(profile) {
        let score = 0;
        const completeness = profile.profile_completeness;

        score += completeness.has_profile_picture ? 20 : 0;
        score += completeness.has_headline ? 20 : 0;
        score += completeness.has_summary ? 25 : 0;
        score += completeness.has_location ? 10 : 0;
        score += completeness.has_industry ? 15 : 0;
        score += completeness.has_connections ? 10 : 0;

        return {
            score: score,
            level: score >= 80 ? 'Expert' : score >= 60 ? 'Intermediate' : score >= 40 ? 'Beginner' : 'Incomplete'
        };
    }

    /**
     * Get network tier based on connection count
     */
    getNetworkTier(connectionCount) {
        if (connectionCount >= 500) return 'Extensive';
        if (connectionCount >= 200) return 'Large';
        if (connectionCount >= 50) return 'Medium';
        if (connectionCount >= 10) return 'Small';
        return 'Starting';
    }

    /**
     * Estimate potential reach
     */
    estimateReach(connectionCount) {
        // Rough estimation: each connection has ~150 connections (LinkedIn average)
        return Math.round(connectionCount * 150 * 0.1); // 10% visibility rate
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['profileId', 'customFields', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'linkedin_profile';
                
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
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('LinkedIn Access Token is required');
        }

        // Validate activity limit
        if (config.includeRecentActivity) {
            const activityLimit = parseInt(config.activityLimit);
            if (isNaN(activityLimit) || activityLimit < 1 || activityLimit > 20) {
                errors.push('Activity limit must be a number between 1 and 20');
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
            profileId: 'me',
            fields: 'all',
            customFields: '',
            includeProfilePicture: true,
            includeConnections: true,
            includeRecentActivity: false,
            activityLimit: 5,
            accessToken: 'your_linkedin_access_token'
        };
    }
}

module.exports = new LinkedInGetProfileNode();