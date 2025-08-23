/*
=================================================================
FILE: backend/nodes/actions/instagramResponseNode.js
=================================================================
Instagram Response Node - Monitor and auto-respond to Instagram DMs and comments
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');
const { InstagramAPI } = require('../../services/instagramAPI');

class InstagramResponseNode {
    constructor() {
        this.name = 'Instagram Response';
        this.type = 'instagramResponse';
        this.icon = 'fab fa-instagram';
        this.description = 'Monitor and respond to Instagram DMs and comments';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            accountId: {
                displayName: 'Instagram Account',
                name: 'accountId',
                type: 'string',
                default: '',
                required: true,
                description: 'Instagram Business Account ID'
            },
            responseType: {
                displayName: 'Response Type',
                name: 'responseType',
                type: 'options',
                options: [
                    { name: 'Direct Messages', value: 'dm' },
                    { name: 'Comments', value: 'comment' },
                    { name: 'Both', value: 'both' }
                ],
                default: 'dm',
                required: true,
                description: 'What type of messages to respond to'
            },
            responseMessage: {
                displayName: 'Response Message',
                name: 'responseMessage',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: 'Hello {{$json.sender_name || "there"}}! Thanks for your message. We\'ll get back to you soon!',
                required: true,
                description: 'Auto-response message (supports expressions)'
            },
            triggerKeywords: {
                displayName: 'Trigger Keywords',
                name: 'triggerKeywords',
                type: 'string',
                default: '',
                description: 'Comma-separated keywords to trigger response (empty = respond to all)'
            },
            responseDelay: {
                displayName: 'Response Delay (seconds)',
                name: 'responseDelay',
                type: 'number',
                default: 2,
                description: 'Delay before sending response (0-300 seconds)'
            },
            enableSmartResponse: {
                displayName: 'Enable Smart Responses',
                name: 'enableSmartResponse',
                type: 'boolean',
                default: false,
                description: 'Use AI to generate contextual responses'
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
     * Execute the Instagram Response node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing Instagram Response Node');
        console.log('Config:', JSON.stringify(config, null, 2));
        console.log('Input data:', JSON.stringify(inputData, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'instagram_workflow', name: 'Instagram Response', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'instagram_response', type: 'instagramResponse' },
                    allNodes,
                    workflowData
                );
            }

            // Process templates with isolated context
            const processedConfig = this.processConfigTemplates(config, inputData, executionContext);
            
            console.log('🔒 Processed config:', processedConfig);

            // Validate required parameters
            const validation = this.validateParameters(processedConfig, inputData);
            if (!validation.valid) {
                throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
            }

            // Initialize Instagram API
            const instagramAPI = new InstagramAPI(processedConfig.accessToken);

            // Determine what type of Instagram event we're processing
            const eventType = this.determineEventType(inputData);
            console.log('📱 Instagram event type detected:', eventType);

            let result;
            switch (eventType) {
                case 'dm':
                    result = await this.handleDirectMessage(instagramAPI, processedConfig, inputData);
                    break;
                case 'comment':
                    result = await this.handleComment(instagramAPI, processedConfig, inputData);
                    break;
                case 'mention':
                    result = await this.handleMention(instagramAPI, processedConfig, inputData);
                    break;
                default:
                    // Manual execution or testing
                    result = await this.handleManualExecution(instagramAPI, processedConfig, inputData);
                    break;
            }

            return {
                success: true,
                data: result,
                nodeType: this.type,
                message: 'Instagram response processed successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Instagram Response Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        // Fields that support template expressions
        const templateFields = ['responseMessage', 'accountId', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'instagram_response_fallback';
                
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
    validateParameters(config, inputData = null) {
        const errors = [];
        
        if (!config.accountId || config.accountId.trim() === '') {
            errors.push('Instagram Account ID is required');
        }
        
        if (!config.responseMessage || config.responseMessage.trim() === '') {
            errors.push('Response message is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access token is required');
        }

        if (config.responseDelay && (config.responseDelay < 0 || config.responseDelay > 300)) {
            errors.push('Response delay must be between 0 and 300 seconds');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Determine the type of Instagram event from input data
     */
    determineEventType(inputData) {
        if (!inputData) return 'manual';

        // Check for Instagram webhook data patterns
        if (inputData.instagram_message || inputData.message) {
            return 'dm';
        }

        if (inputData.instagram_comment || inputData.comment) {
            return 'comment';
        }

        if (inputData.instagram_mention || inputData.mention) {
            return 'mention';
        }

        return 'manual';
    }

    /**
     * Handle Instagram Direct Message response
     */
    async handleDirectMessage(instagramAPI, config, inputData) {
        console.log('📨 Processing Instagram DM response');

        // Extract DM information
        const message = inputData.instagram_message || inputData.message || {};
        const senderId = message.sender_id || message.from?.id;
        const senderName = message.sender_name || message.from?.name || 'there';
        const messageText = message.text || message.content || '';

        // Check if message matches trigger keywords
        if (!this.matchesTriggerKeywords(messageText, config.triggerKeywords)) {
            console.log('🔕 Message does not match trigger keywords, skipping response');
            return {
                action: 'skipped',
                reason: 'No keyword match',
                message_text: messageText
            };
        }

        // Prepare response data for template processing
        const responseData = {
            sender_id: senderId,
            sender_name: senderName,
            original_message: messageText,
            account_id: config.accountId
        };

        // Generate response message
        let responseMessage = config.responseMessage;
        if (config.enableSmartResponse) {
            responseMessage = await this.generateSmartResponse(messageText, senderName, config);
        }

        // Apply delay if configured
        if (config.responseDelay > 0) {
            console.log(`⏳ Applying response delay: ${config.responseDelay} seconds`);
            await this.delay(config.responseDelay * 1000);
        }

        // Note: Instagram Graph API doesn't currently support sending DMs directly
        // This would require Instagram Messaging API (separate approval process)
        console.log('⚠️ Instagram DM sending requires Instagram Messaging API approval');
        
        return {
            action: 'dm_response_prepared',
            sender_id: senderId,
            sender_name: senderName,
            response_message: responseMessage,
            original_message: messageText,
            note: 'DM response prepared - requires Instagram Messaging API for actual sending'
        };
    }

    /**
     * Handle Instagram Comment response
     */
    async handleComment(instagramAPI, config, inputData) {
        console.log('💬 Processing Instagram comment response');

        const comment = inputData.instagram_comment || inputData.comment || {};
        const commentId = comment.id;
        const commentText = comment.text || comment.content || '';
        const commenterName = comment.user?.name || comment.from?.name || 'there';
        const mediaId = comment.media_id;

        // Check if comment matches trigger keywords
        if (!this.matchesTriggerKeywords(commentText, config.triggerKeywords)) {
            console.log('🔕 Comment does not match trigger keywords, skipping response');
            return {
                action: 'skipped',
                reason: 'No keyword match',
                comment_text: commentText
            };
        }

        // Generate response
        let responseMessage = config.responseMessage;
        if (config.enableSmartResponse) {
            responseMessage = await this.generateSmartResponse(commentText, commenterName, config);
        }

        // Apply delay
        if (config.responseDelay > 0) {
            await this.delay(config.responseDelay * 1000);
        }

        try {
            // Reply to comment (this would require comment reply API endpoint)
            console.log('📤 Sending comment reply:', responseMessage);
            
            // Note: Comment replies might need specific Instagram Business API endpoints
            const replyResult = await this.replyToComment(instagramAPI, commentId, responseMessage, config.accessToken);
            
            return {
                action: 'comment_reply_sent',
                comment_id: commentId,
                media_id: mediaId,
                commenter_name: commenterName,
                response_message: responseMessage,
                original_comment: commentText,
                reply_result: replyResult
            };

        } catch (error) {
            console.error('❌ Failed to reply to comment:', error);
            return {
                action: 'comment_reply_failed',
                error: error.message,
                comment_id: commentId,
                response_message: responseMessage
            };
        }
    }

    /**
     * Handle Instagram Mention response
     */
    async handleMention(instagramAPI, config, inputData) {
        console.log('📢 Processing Instagram mention response');
        
        // Similar logic to comments but for mentions in stories/posts
        const mention = inputData.instagram_mention || inputData.mention || {};
        
        return {
            action: 'mention_processed',
            mention_data: mention,
            note: 'Mention response functionality can be extended based on needs'
        };
    }

    /**
     * Handle manual execution for testing
     */
    async handleManualExecution(instagramAPI, config, inputData) {
        console.log('🧪 Manual execution mode - validating Instagram connection');

        try {
            // Validate Instagram connection
            const validation = await instagramAPI.validateToken(config.accessToken);
            
            if (!validation.success) {
                throw new Error(`Instagram connection failed: ${validation.error.message}`);
            }

            // Get account info
            const accountInfo = await instagramAPI.getAccountInfo(config.accountId, config.accessToken);
            
            return {
                action: 'manual_test',
                connection_status: 'valid',
                account_info: accountInfo.success ? accountInfo.data : null,
                response_message_template: config.responseMessage,
                configuration: {
                    response_type: config.responseType,
                    trigger_keywords: config.triggerKeywords,
                    response_delay: config.responseDelay,
                    smart_response: config.enableSmartResponse
                }
            };

        } catch (error) {
            return {
                action: 'manual_test',
                connection_status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Check if message matches trigger keywords
     */
    matchesTriggerKeywords(messageText, triggerKeywords) {
        if (!triggerKeywords || triggerKeywords.trim() === '') {
            return true; // No keywords specified = respond to all
        }

        const keywords = triggerKeywords.split(',').map(k => k.trim().toLowerCase());
        const messageTextLower = messageText.toLowerCase();

        return keywords.some(keyword => messageTextLower.includes(keyword));
    }

    /**
     * Generate smart AI response (placeholder for AI integration)
     */
    async generateSmartResponse(originalMessage, senderName, config) {
        console.log('🤖 Generating smart response...');
        
        // This could integrate with your existing AI Agent node
        // For now, return enhanced template response
        const smartTemplate = `Hello ${senderName}! I received your message about "${originalMessage}". Thanks for reaching out! 🙌`;
        
        return smartTemplate;
    }

    /**
     * Reply to Instagram comment
     */
    async replyToComment(instagramAPI, commentId, replyMessage, accessToken) {
        // Note: This is a placeholder - actual Instagram comment reply API would be needed
        console.log(`📝 Would reply to comment ${commentId}: "${replyMessage}"`);
        
        return {
            status: 'prepared',
            note: 'Comment reply prepared - requires specific Instagram API endpoint'
        };
    }

    /**
     * Utility: Add delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
            responseType: 'dm',
            responseMessage: 'Hello {{$json.sender_name}}! Thanks for your message. We\'ll get back to you soon! 🙌',
            triggerKeywords: 'hello, hi, help, support',
            responseDelay: 2,
            enableSmartResponse: false,
            accessToken: 'your_instagram_access_token'
        };
    }

    /**
     * Get mock input data for testing
     */
    getMockInputData() {
        return {
            instagram_message: {
                sender_id: '123456789',
                sender_name: 'John Doe',
                text: 'Hello! I need help with my order',
                timestamp: Date.now()
            }
        };
    }
}

module.exports = new InstagramResponseNode();