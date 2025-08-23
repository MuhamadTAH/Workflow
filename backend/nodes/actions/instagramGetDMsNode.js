/*
=================================================================
FILE: backend/nodes/actions/instagramGetDMsNode.js
=================================================================
Instagram Get DMs Node - Fetch incoming direct messages from Instagram
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');
const { InstagramAPI } = require('../../services/instagramAPI');

class InstagramGetDMsNode {
    constructor() {
        this.name = 'Instagram Get DMs';
        this.type = 'instagramGetDMs';
        this.icon = 'fab fa-instagram';
        this.description = 'Fetch incoming direct messages from Instagram';
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
            accessToken: {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                default: '{{$env.INSTAGRAM_ACCESS_TOKEN}}',
                required: true,
                description: 'Instagram API Access Token'
            },
            limit: {
                displayName: 'Message Limit',
                name: 'limit',
                type: 'number',
                default: 10,
                description: 'Number of messages to retrieve (1-50)'
            },
            includeRead: {
                displayName: 'Include Read Messages',
                name: 'includeRead',
                type: 'boolean',
                default: false,
                description: 'Include already read messages'
            }
        };
    }

    /**
     * Execute the Instagram Get DMs node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Instagram Get DMs Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'instagram_get_dms_workflow', name: 'Instagram Get DMs', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'instagram_get_dms', type: 'instagramGetDMs' },
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

            console.log('📨 Fetching Instagram DMs...');

            // Get direct messages (Note: This requires instagram_manage_messages permission)
            const dmsResult = await this.getDirectMessages(
                instagramAPI, 
                processedConfig.accountId, 
                processedConfig.accessToken,
                processedConfig.limit,
                processedConfig.includeRead
            );

            if (!dmsResult.success) {
                throw new Error(`Failed to get DMs: ${dmsResult.error}`);
            }

            console.log(`✅ Retrieved ${dmsResult.data.length} direct messages`);

            return {
                success: true,
                data: {
                    messages: dmsResult.data,
                    count: dmsResult.data.length,
                    account_id: processedConfig.accountId,
                    retrieved_at: new Date().toISOString()
                },
                nodeType: this.type,
                message: `Retrieved ${dmsResult.data.length} Instagram direct messages`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Instagram Get DMs Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get direct messages from Instagram
     */
    async getDirectMessages(instagramAPI, accountId, accessToken, limit = 10, includeRead = false) {
        try {
            // Note: Instagram Messaging API requires special permissions and app review
            // This is a placeholder implementation - actual implementation depends on permissions
            
            console.log('🔍 Fetching Instagram conversations...');
            
            // Get conversations for the account
            const conversationsUrl = `https://graph.facebook.com/v18.0/${accountId}/conversations`;
            const params = {
                access_token: accessToken,
                limit: Math.min(limit, 50),
                fields: 'participants,updated_time,message_count'
            };

            const response = await fetch(`${conversationsUrl}?${new URLSearchParams(params)}`);
            const conversationsData = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: conversationsData.error?.message || 'Failed to get conversations'
                };
            }

            const messages = [];
            
            // Get messages from each conversation
            if (conversationsData.data && conversationsData.data.length > 0) {
                for (const conversation of conversationsData.data.slice(0, 5)) { // Limit conversations
                    try {
                        const messagesUrl = `https://graph.facebook.com/v18.0/${conversation.id}/messages`;
                        const messageParams = {
                            access_token: accessToken,
                            limit: 10,
                            fields: 'message,from,created_time,id'
                        };

                        const messageResponse = await fetch(`${messagesUrl}?${new URLSearchParams(messageParams)}`);
                        const messageData = await messageResponse.json();

                        if (messageResponse.ok && messageData.data) {
                            messages.push(...messageData.data.map(msg => ({
                                id: msg.id,
                                conversation_id: conversation.id,
                                message: msg.message || '',
                                from: msg.from,
                                created_time: msg.created_time,
                                timestamp: new Date(msg.created_time).getTime()
                            })));
                        }
                    } catch (msgError) {
                        console.error('Error fetching messages for conversation:', msgError);
                    }
                }
            }

            // Sort messages by timestamp (newest first)
            messages.sort((a, b) => b.timestamp - a.timestamp);

            return {
                success: true,
                data: messages.slice(0, limit)
            };

        } catch (error) {
            console.error('Error in getDirectMessages:', error);
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
        
        const templateFields = ['accountId', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'instagram_get_dms';
                
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

        if (config.limit && (config.limit < 1 || config.limit > 50)) {
            errors.push('Limit must be between 1 and 50');
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
            accessToken: 'your_instagram_access_token',
            limit: 10,
            includeRead: false
        };
    }
}

module.exports = new InstagramGetDMsNode();