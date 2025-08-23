/*
=================================================================
FILE: backend/nodes/actions/facebookGetMessagesNode.js
=================================================================
Facebook Get Messages Node - Get Facebook Messenger conversations and messages
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class FacebookGetMessagesNode {
    constructor() {
        this.name = 'Facebook Get Messages';
        this.type = 'facebookGetMessages';
        this.icon = 'fab fa-facebook-messenger';
        this.description = 'Get Facebook Messenger conversations and messages';
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
            conversationType: {
                displayName: 'Conversation Type',
                name: 'conversationType',
                type: 'options',
                options: [
                    { name: 'All Conversations', value: 'all' },
                    { name: 'Unread Only', value: 'unread' },
                    { name: 'Open Only', value: 'open' },
                    { name: 'Specific Conversation', value: 'specific' }
                ],
                default: 'all',
                description: 'Type of conversations to retrieve'
            },
            conversationId: {
                displayName: 'Conversation ID',
                name: 'conversationId',
                type: 'string',
                default: '{{$json.conversation_id}}',
                description: 'Specific conversation ID (for specific conversation type)'
            },
            fields: {
                displayName: 'Message Fields',
                name: 'fields',
                type: 'options',
                options: [
                    { name: 'All Fields', value: 'all' },
                    { name: 'Basic Info', value: 'basic' },
                    { name: 'Messages Only', value: 'messages' },
                    { name: 'Custom', value: 'custom' }
                ],
                default: 'all',
                description: 'Which message fields to retrieve'
            },
            customFields: {
                displayName: 'Custom Fields',
                name: 'customFields',
                type: 'string',
                default: '',
                description: 'Comma-separated list of fields (for custom option)'
            },
            limit: {
                displayName: 'Number of Conversations',
                name: 'limit',
                type: 'number',
                default: 25,
                description: 'Maximum number of conversations to retrieve (1-100)'
            },
            messageLimit: {
                displayName: 'Messages Per Conversation',
                name: 'messageLimit',
                type: 'number',
                default: 10,
                description: 'Maximum messages per conversation (1-100)'
            },
            includeAttachments: {
                displayName: 'Include Attachments',
                name: 'includeAttachments',
                type: 'boolean',
                default: true,
                description: 'Include message attachments in response'
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
     * Execute the Facebook Get Messages node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Facebook Get Messages Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'facebook_messages_workflow', name: 'Facebook Get Messages', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'facebook_messages', type: 'facebookGetMessages' },
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

            console.log('💬 Fetching Facebook Messenger conversations...');

            // Get conversations and messages
            const messagesResult = await this.getMessages(
                processedConfig.pageId,
                processedConfig.conversationType,
                processedConfig.conversationId,
                processedConfig.fields,
                processedConfig.customFields,
                processedConfig.limit,
                processedConfig.messageLimit,
                processedConfig.includeAttachments,
                processedConfig.accessToken
            );

            if (!messagesResult.success) {
                throw new Error(`Failed to get messages: ${messagesResult.error}`);
            }

            console.log('✅ Facebook Messenger conversations retrieved successfully');

            return {
                success: true,
                data: {
                    conversations: messagesResult.data.conversations,
                    paging: messagesResult.data.paging,
                    page_id: processedConfig.pageId,
                    total_conversations: messagesResult.data.conversations?.length || 0,
                    conversation_type: processedConfig.conversationType,
                    retrieved_at: new Date().toISOString(),
                    summary: messagesResult.data.summary
                },
                nodeType: this.type,
                message: `Retrieved ${messagesResult.data.conversations?.length || 0} conversations`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Facebook Get Messages Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Get Facebook Messenger conversations and messages
     */
    async getMessages(pageId, conversationType, conversationId, fields, customFields, limit, messageLimit, includeAttachments, accessToken) {
        try {
            console.log('📋 Fetching conversations for page:', pageId);

            if (conversationType === 'specific' && conversationId) {
                return await this.getSpecificConversation(conversationId, fields, customFields, messageLimit, includeAttachments, accessToken);
            }

            // Define available conversation fields
            const conversationFields = {
                all: [
                    'id', 'updated_time', 'message_count', 'unread_count',
                    'participants', 'former_participants', 'senders',
                    'can_reply', 'is_subscribed', 'link'
                ],
                basic: ['id', 'updated_time', 'message_count', 'unread_count', 'participants'],
                messages: ['id', 'updated_time', 'participants']
            };

            const messageFields = {
                all: [
                    'id', 'created_time', 'from', 'to', 'message',
                    'attachments', 'sticker', 'tags', 'reactions'
                ],
                basic: ['id', 'created_time', 'from', 'message'],
                messages: ['id', 'created_time', 'from', 'message', 'attachments']
            };

            let fieldsToRequest;
            let messageFieldsToRequest;

            if (fields === 'custom' && customFields) {
                fieldsToRequest = customFields.split(',').map(f => f.trim());
                messageFieldsToRequest = fieldsToRequest;
            } else {
                fieldsToRequest = conversationFields[fields] || conversationFields.all;
                messageFieldsToRequest = messageFields[fields] || messageFields.all;
            }

            // Add messages field with sub-fields
            const messagesSubFields = messageFieldsToRequest.join(',');
            fieldsToRequest.push(`messages.limit(${messageLimit}){${messagesSubFields}}`);

            const conversationsUrl = `https://graph.facebook.com/v18.0/${pageId}/conversations`;
            const params = {
                fields: fieldsToRequest.join(','),
                limit: Math.min(Math.max(parseInt(limit) || 25, 1), 100),
                access_token: accessToken
            };

            // Add conversation type filters
            if (conversationType === 'unread') {
                // Filter will be applied post-fetch since Graph API doesn't directly support unread filter
                params.fields = fieldsToRequest.join(',');
            } else if (conversationType === 'open') {
                // Filter for conversations that can be replied to
                params.fields = fieldsToRequest.join(',');
            }

            const response = await fetch(`${conversationsUrl}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to get conversations'
                };
            }

            // Process and filter conversations
            let conversations = result.data || [];

            // Apply post-fetch filters
            if (conversationType === 'unread') {
                conversations = conversations.filter(conv => (conv.unread_count || 0) > 0);
            } else if (conversationType === 'open') {
                conversations = conversations.filter(conv => conv.can_reply !== false);
            }

            // Enhance conversations with additional data
            conversations = conversations.map(conversation => ({
                ...conversation,
                conversation_stats: this.calculateConversationStats(conversation),
                last_activity: this.getLastActivity(conversation),
                participant_info: this.enhanceParticipantInfo(conversation.participants)
            }));

            // Create summary
            const summary = this.createConversationSummary(conversations);

            return {
                success: true,
                data: {
                    conversations: conversations,
                    paging: result.paging,
                    summary: summary
                }
            };

        } catch (error) {
            console.error('Error in getMessages:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get specific conversation details
     */
    async getSpecificConversation(conversationId, fields, customFields, messageLimit, includeAttachments, accessToken) {
        try {
            const messageFields = [
                'id', 'created_time', 'from', 'to', 'message',
                'attachments', 'sticker', 'tags', 'reactions'
            ];

            let fieldsToRequest;
            if (fields === 'custom' && customFields) {
                fieldsToRequest = customFields.split(',').map(f => f.trim());
            } else {
                fieldsToRequest = messageFields;
            }

            const conversationUrl = `https://graph.facebook.com/v18.0/${conversationId}`;
            const params = {
                fields: `id,updated_time,message_count,unread_count,participants,messages.limit(${messageLimit}){${fieldsToRequest.join(',')}}`,
                access_token: accessToken
            };

            const response = await fetch(`${conversationUrl}?${new URLSearchParams(params)}`);
            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.error?.message || 'Failed to get specific conversation'
                };
            }

            // Enhance conversation data
            const enhancedConversation = {
                ...result,
                conversation_stats: this.calculateConversationStats(result),
                last_activity: this.getLastActivity(result),
                participant_info: this.enhanceParticipantInfo(result.participants)
            };

            return {
                success: true,
                data: {
                    conversations: [enhancedConversation],
                    paging: null,
                    summary: this.createConversationSummary([enhancedConversation])
                }
            };

        } catch (error) {
            console.error('Error in getSpecificConversation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calculate conversation statistics
     */
    calculateConversationStats(conversation) {
        const messageCount = conversation.message_count || 0;
        const unreadCount = conversation.unread_count || 0;
        const participantCount = conversation.participants?.data?.length || 0;
        const messages = conversation.messages?.data || [];

        return {
            total_messages: messageCount,
            unread_messages: unreadCount,
            read_messages: messageCount - unreadCount,
            total_participants: participantCount,
            recent_messages: messages.length,
            has_unread: unreadCount > 0,
            last_message_time: messages.length > 0 ? messages[0].created_time : null
        };
    }

    /**
     * Get last activity information
     */
    getLastActivity(conversation) {
        const messages = conversation.messages?.data || [];
        if (messages.length === 0) {
            return {
                last_message_time: conversation.updated_time,
                time_since_last_message: null,
                last_sender: null
            };
        }

        const lastMessage = messages[0];
        const lastMessageTime = new Date(lastMessage.created_time);
        const now = new Date();
        const timeSince = Math.floor((now - lastMessageTime) / (1000 * 60)); // minutes

        return {
            last_message_time: lastMessage.created_time,
            time_since_last_message: timeSince,
            last_sender: lastMessage.from?.name || lastMessage.from?.id,
            last_message_preview: lastMessage.message ? 
                lastMessage.message.substring(0, 100) + (lastMessage.message.length > 100 ? '...' : '') : 
                '[Media or Sticker]'
        };
    }

    /**
     * Enhance participant information
     */
    enhanceParticipantInfo(participants) {
        if (!participants?.data) return [];

        return participants.data.map(participant => ({
            ...participant,
            is_page: !!participant.name && !participant.first_name,
            display_name: participant.name || `${participant.first_name || ''} ${participant.last_name || ''}`.trim()
        }));
    }

    /**
     * Create conversation summary
     */
    createConversationSummary(conversations) {
        const total = conversations.length;
        const unreadConversations = conversations.filter(c => (c.unread_count || 0) > 0).length;
        const totalUnreadMessages = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        const totalMessages = conversations.reduce((sum, c) => sum + (c.message_count || 0), 0);

        return {
            total_conversations: total,
            unread_conversations: unreadConversations,
            read_conversations: total - unreadConversations,
            total_messages: totalMessages,
            total_unread_messages: totalUnreadMessages,
            average_messages_per_conversation: total > 0 ? Math.round(totalMessages / total) : 0
        };
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = ['pageId', 'conversationId', 'customFields', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'facebook_messages';
                
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

        if (config.conversationType === 'specific' && (!config.conversationId || config.conversationId.trim() === '')) {
            errors.push('Conversation ID is required for specific conversation type');
        }

        // Validate limits
        const limit = parseInt(config.limit);
        if (isNaN(limit) || limit < 1 || limit > 100) {
            errors.push('Limit must be a number between 1 and 100');
        }

        const messageLimit = parseInt(config.messageLimit);
        if (isNaN(messageLimit) || messageLimit < 1 || messageLimit > 100) {
            errors.push('Message limit must be a number between 1 and 100');
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
            conversationType: 'all',
            conversationId: '',
            fields: 'all',
            customFields: '',
            limit: 25,
            messageLimit: 10,
            includeAttachments: true,
            accessToken: 'your_facebook_page_access_token'
        };
    }
}

module.exports = new FacebookGetMessagesNode();