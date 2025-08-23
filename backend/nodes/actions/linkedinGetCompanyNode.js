/*
=================================================================
FILE: backend/nodes/actions/linkedinGetCompanyNode.js
=================================================================
LinkedIn Get Company Node - Get LinkedIn company page information
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class LinkedInGetCompanyNode {
    constructor() {
        this.name = 'LinkedIn Get Company';
        this.type = 'linkedinGetCompany';
        this.icon = 'fab fa-linkedin';
        this.description = 'Get LinkedIn company page information';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            companyId: {
                displayName: 'Company ID',
                name: 'companyId',
                type: 'string',
                default: '{{$json.company_id}}',
                required: true,
                description: 'LinkedIn Company ID or universal name'
            },
            fields: {
                displayName: 'Company Fields',
                name: 'fields',
                type: 'options',
                options: [
                    { name: 'All Fields', value: 'all' },
                    { name: 'Basic Info', value: 'basic' },
                    { name: 'Contact Info', value: 'contact' },
                    { name: 'Statistics', value: 'statistics' },
                    { name: 'Custom', value: 'custom' }
                ],
                default: 'all',
                description: 'Which company fields to retrieve'
            },
            customFields: {
                displayName: 'Custom Fields',
                name: 'customFields',
                type: 'string',
                default: '',
                description: 'Comma-separated list of fields (for custom option)'
            },
            includeLogos: {
                displayName: 'Include Company Logos',
                name: 'includeLogos',
                type: 'boolean',
                default: true,
                description: 'Include company logo URLs'
            },
            includeFollowerCount: {
                displayName: 'Include Follower Count',
                name: 'includeFollowerCount',
                type: 'boolean',
                default: true,
                description: 'Include company follower statistics'
            },
            includeRecentUpdates: {
                displayName: 'Include Recent Updates',
                name: 'includeRecentUpdates',
                type: 'boolean',
                default: false,
                description: 'Include recent company posts and updates'
            },
            updatesLimit: {
                displayName: 'Updates Limit',
                name: 'updatesLimit',
                type: 'number',
                default: 10,
                description: 'Number of recent updates to include (1-50)'
            },
            includeEmployees: {
                displayName: 'Include Employee Info',
                name: 'includeEmployees',
                type: 'boolean',
                default: false,
                description: 'Include employee count and growth data'
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
     * Execute the LinkedIn Get Company node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing LinkedIn Get Company Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'linkedin_company_workflow', name: 'LinkedIn Get Company', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'linkedin_company', type: 'linkedinGetCompany' },
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

            console.log('🏢 Fetching LinkedIn company information...');

            // Get company information
            const companyResult = await this.getCompany(
                processedConfig.companyId,
                processedConfig.fields,
                processedConfig.customFields,
                processedConfig.includeLogos,
                processedConfig.includeFollowerCount,
                processedConfig.includeRecentUpdates,
                processedConfig.updatesLimit,
                processedConfig.includeEmployees,
                processedConfig.accessToken
            );

            if (!companyResult.success) {
                throw new Error(`Failed to get company information: ${companyResult.error}`);
            }

            console.log('✅ LinkedIn company information retrieved successfully');

            return {
                success: true,
                data: {
                    company: companyResult.data.company,
                    followers: companyResult.data.followers,
                    recent_updates: companyResult.data.recent_updates,
                    employee_data: companyResult.data.employee_data,
                    company_id: processedConfig.companyId,
                    retrieved_at: new Date().toISOString(),
                    company_stats: companyResult.data.company_stats
                },
                nodeType: this.type,
                message: 'LinkedIn company information retrieved successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ LinkedIn Get Company Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get LinkedIn company information
     */
    async getCompany(companyId, fields, customFields, includeLogos, includeFollowerCount, includeRecentUpdates, updatesLimit, includeEmployees, accessToken) {
        try {
            console.log('🏢 Fetching company information for:', companyId);

            // Define available company fields
            const companyFields = {
                all: [
                    'id', 'name', 'universalName', 'description', 'website',
                    'industry', 'companyType', 'employeeCountRange', 'founded',
                    'specialties', 'locations', 'companyPageUrl', 'logo',
                    'coverPhoto', 'tagline'
                ],
                basic: ['id', 'name', 'universalName', 'description', 'website', 'industry'],
                contact: ['id', 'name', 'website', 'locations', 'companyPageUrl'],
                statistics: ['id', 'name', 'employeeCountRange', 'founded', 'industry']
            };

            let fieldsToRequest;
            if (fields === 'custom' && customFields) {
                fieldsToRequest = customFields.split(',').map(f => f.trim());
            } else {
                fieldsToRequest = companyFields[fields] || companyFields.all;
            }

            // Add logo fields if requested
            if (includeLogos && !fieldsToRequest.some(f => f.includes('logo'))) {
                fieldsToRequest.push('logo(original~:playableStreams)');
                fieldsToRequest.push('coverPhoto(original~:playableStreams)');
            }

            // Determine if companyId is numeric (ID) or string (universal name)
            const isNumericId = /^\d+$/.test(companyId);
            const companyIdentifier = isNumericId ? `id:${companyId}` : `universalName:${companyId}`;

            const companyUrl = `https://api.linkedin.com/v2/companies/(${companyIdentifier})`;
            const params = {
                projection: `(${fieldsToRequest.join(',')})`
            };

            const response = await fetch(`${companyUrl}?${new URLSearchParams(params)}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const companyData = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: companyData.message || 'Failed to get company information'
                };
            }

            // Process company data
            const processedCompany = this.processCompanyData(companyData);

            // Get follower count if requested
            let followerData = null;
            if (includeFollowerCount) {
                followerData = await this.getFollowerCount(companyData.id, accessToken);
            }

            // Get recent updates if requested
            let recentUpdates = null;
            if (includeRecentUpdates) {
                recentUpdates = await this.getRecentUpdates(companyData.id, updatesLimit, accessToken);
            }

            // Get employee data if requested
            let employeeData = null;
            if (includeEmployees) {
                employeeData = await this.getEmployeeData(companyData.id, accessToken);
            }

            // Calculate company statistics
            const companyStats = this.calculateCompanyStats(processedCompany, followerData, employeeData);

            return {
                success: true,
                data: {
                    company: processedCompany,
                    followers: followerData,
                    recent_updates: recentUpdates,
                    employee_data: employeeData,
                    company_stats: companyStats
                }
            };

        } catch (error) {
            console.error('Error in getCompany:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process company data into organized format
     */
    processCompanyData(companyData) {
        const processed = {
            ...companyData,
            company_url: this.getCompanyUrl(companyData),
            logo_urls: this.extractLogoUrls(companyData.logo),
            cover_photo_urls: this.extractLogoUrls(companyData.coverPhoto),
            location_summary: this.summarizeLocations(companyData.locations),
            company_size: this.getCompanySize(companyData.employeeCountRange),
            founded_years_ago: this.calculateYearsSinceFounded(companyData.founded),
            specialties_list: this.processSpecialties(companyData.specialties)
        };

        return processed;
    }

    /**
     * Get company URL
     */
    getCompanyUrl(companyData) {
        if (companyData.companyPageUrl) {
            return companyData.companyPageUrl;
        }
        if (companyData.universalName) {
            return `https://www.linkedin.com/company/${companyData.universalName}`;
        }
        if (companyData.id) {
            return `https://www.linkedin.com/company/${companyData.id}`;
        }
        return null;
    }

    /**
     * Extract logo URLs from logo data
     */
    extractLogoUrls(logoData) {
        if (!logoData?.original) return null;

        const logos = {};
        const elements = logoData.original['elements'] || [];

        elements.forEach(element => {
            if (element.identifiers && element.identifiers.length > 0) {
                const identifier = element.identifiers[0].identifier;
                const size = this.determineImageSize(element);
                logos[size] = identifier;
            }
        });

        return Object.keys(logos).length > 0 ? logos : null;
    }

    /**
     * Determine image size from element data
     */
    determineImageSize(element) {
        const data = element.data || {};
        const width = data['com.linkedin.digitalmedia.mediaartifact.StillImage']?.storageSize?.width;
        
        if (!width) return 'original';
        if (width <= 100) return 'small';
        if (width <= 400) return 'medium';
        return 'large';
    }

    /**
     * Summarize company locations
     */
    summarizeLocations(locations) {
        if (!locations?.elements || locations.elements.length === 0) return null;

        return {
            total_locations: locations.elements.length,
            headquarters: locations.elements.find(loc => loc.locationType === 'HEADQUARTERS'),
            primary_location: locations.elements[0],
            all_locations: locations.elements.map(loc => ({
                country: loc.country,
                geographic_area: loc.geographicArea,
                city: loc.city,
                postal_code: loc.postalCode,
                line1: loc.line1,
                type: loc.locationType
            }))
        };
    }

    /**
     * Get company size description
     */
    getCompanySize(employeeCountRange) {
        if (!employeeCountRange) return null;

        const ranges = {
            'A': '1 employee',
            'B': '2-10 employees',
            'C': '11-50 employees',
            'D': '51-200 employees',
            'E': '201-500 employees',
            'F': '501-1000 employees',
            'G': '1001-5000 employees',
            'H': '5001-10000 employees',
            'I': '10000+ employees'
        };

        return {
            range_code: employeeCountRange,
            range_description: ranges[employeeCountRange] || 'Unknown size'
        };
    }

    /**
     * Calculate years since company was founded
     */
    calculateYearsSinceFounded(founded) {
        if (!founded?.year) return null;

        const currentYear = new Date().getFullYear();
        const yearsAgo = currentYear - founded.year;

        return {
            founded_year: founded.year,
            years_ago: yearsAgo,
            founded_date: `${founded.year}${founded.month ? '-' + founded.month : ''}${founded.day ? '-' + founded.day : ''}`
        };
    }

    /**
     * Process specialties into array
     */
    processSpecialties(specialties) {
        if (!specialties?.elements) return [];
        return specialties.elements.map(specialty => specialty.name || specialty);
    }

    /**
     * Get follower count
     */
    async getFollowerCount(companyId, accessToken) {
        try {
            const followersUrl = `https://api.linkedin.com/v2/networkSizes/${companyId}`;
            const params = { edgeType: 'CompanyFollowedByMember' };

            const response = await fetch(`${followersUrl}?${new URLSearchParams(params)}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Could not fetch follower count - may require elevated permissions');
                return null;
            }

            const followerData = await response.json();
            
            return {
                total_followers: followerData.firstDegreeSize || 0,
                last_updated: new Date().toISOString()
            };

        } catch (error) {
            console.warn('Failed to get follower count:', error);
            return null;
        }
    }

    /**
     * Get recent company updates
     */
    async getRecentUpdates(companyId, limit, accessToken) {
        try {
            const updatesUrl = 'https://api.linkedin.com/v2/shares';
            const params = {
                q: 'owners',
                owners: `urn:li:organization:${companyId}`,
                count: Math.min(limit, 50),
                sortBy: 'CREATED_TIME'
            };

            const response = await fetch(`${updatesUrl}?${new URLSearchParams(params)}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('Could not fetch recent updates - may require elevated permissions');
                return null;
            }

            const updatesData = await response.json();
            const updates = updatesData.elements || [];

            return updates.map(update => ({
                id: update.id,
                created_at: update.created?.time,
                text: update.text?.text || '',
                activity_type: this.determineActivityType(update),
                engagement: {
                    likes: update.totalSocialActivityCounts?.numLikes || 0,
                    comments: update.totalSocialActivityCounts?.numComments || 0,
                    shares: update.totalSocialActivityCounts?.numShares || 0
                },
                url: this.constructUpdateUrl(update.id)
            }));

        } catch (error) {
            console.warn('Failed to get recent updates:', error);
            return null;
        }
    }

    /**
     * Determine activity type
     */
    determineActivityType(update) {
        if (update.content?.contentEntities) return 'share';
        if (update.content?.article) return 'article';
        if (update.text) return 'post';
        return 'unknown';
    }

    /**
     * Construct update URL
     */
    constructUpdateUrl(updateId) {
        const activityId = updateId.includes('urn:li:activity:') 
            ? updateId.split('urn:li:activity:')[1] 
            : updateId;
        return `https://www.linkedin.com/feed/update/${activityId}`;
    }

    /**
     * Get employee data
     */
    async getEmployeeData(companyId, accessToken) {
        try {
            // Note: This requires specific permissions and may not be available for all apps
            console.log('Employee data requires elevated LinkedIn permissions');
            
            // Return basic employee count estimation based on range
            return {
                estimated_employee_count: 'Available with elevated permissions',
                growth_data: 'Available with elevated permissions',
                department_breakdown: 'Available with elevated permissions'
            };

        } catch (error) {
            console.warn('Failed to get employee data:', error);
            return null;
        }
    }

    /**
     * Calculate company statistics
     */
    calculateCompanyStats(company, followers, employees) {
        const stats = {
            company_age: company.founded_years_ago?.years_ago || null,
            company_size_tier: this.getCompanySizeTier(company.company_size?.range_code),
            industry: company.industry || 'Not specified',
            total_locations: company.location_summary?.total_locations || 0,
            has_headquarters: !!(company.location_summary?.headquarters),
            follower_count: followers?.total_followers || 0,
            social_presence: this.assessSocialPresence(company, followers)
        };

        return stats;
    }

    /**
     * Get company size tier
     */
    getCompanySizeTier(rangeCode) {
        const tiers = {
            'A': 'Solo',
            'B': 'Startup',
            'C': 'Small',
            'D': 'Medium',
            'E': 'Medium-Large',
            'F': 'Large',
            'G': 'Enterprise',
            'H': 'Large Enterprise',
            'I': 'Fortune 500'
        };

        return tiers[rangeCode] || 'Unknown';
    }

    /**
     * Assess social media presence
     */
    assessSocialPresence(company, followers) {
        let score = 0;
        
        score += company.logo_urls ? 20 : 0;
        score += company.cover_photo_urls ? 15 : 0;
        score += company.description ? 20 : 0;
        score += company.tagline ? 10 : 0;
        score += company.website ? 15 : 0;
        
        if (followers?.total_followers) {
            if (followers.total_followers >= 10000) score += 20;
            else if (followers.total_followers >= 1000) score += 15;
            else if (followers.total_followers >= 100) score += 10;
            else if (followers.total_followers >= 10) score += 5;
        }

        return {
            score: score,
            level: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Poor'
        };
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['companyId', 'customFields', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'linkedin_company';
                
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
        
        if (!config.companyId || config.companyId.trim() === '') {
            errors.push('Company ID is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('LinkedIn Access Token is required');
        }

        // Validate updates limit
        if (config.includeRecentUpdates) {
            const updatesLimit = parseInt(config.updatesLimit);
            if (isNaN(updatesLimit) || updatesLimit < 1 || updatesLimit > 50) {
                errors.push('Updates limit must be a number between 1 and 50');
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
            companyId: 'linkedin_company_id_or_universal_name',
            fields: 'all',
            customFields: '',
            includeLogos: true,
            includeFollowerCount: true,
            includeRecentUpdates: false,
            updatesLimit: 10,
            includeEmployees: false,
            accessToken: 'your_linkedin_access_token'
        };
    }
}

module.exports = new LinkedInGetCompanyNode();