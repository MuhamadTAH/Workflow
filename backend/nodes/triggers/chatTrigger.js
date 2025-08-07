/**
 * Chat Trigger Node
 * Triggers workflows when chat messages are received from website widgets
 */

class ChatTriggerNode {
    constructor(config) {
        this.id = config.id;
        this.type = 'chatTrigger';
        this.config = config;
        
        // Default configuration
        this.workflowId = config.workflowId;
        this.filterKeywords = config.filterKeywords || [];
        this.allowedDomains = config.allowedDomains || [];
        this.requireUserInfo = config.requireUserInfo || false;
        this.autoRespond = config.autoRespond || false;
        this.autoResponseMessage = config.autoResponseMessage || 'Thank you for your message. We\'ll get back to you soon!';
    }

    /**
     * Process incoming chat webhook data
     */
    async execute(inputData) {
        try {
            console.log(`🤖 Chat Trigger executing for workflow ${this.workflowId}`);
            console.log('Input data:', inputData);

            // Validate input data
            if (!inputData || !inputData.message) {
                throw new Error('No message data received');
            }

            // Extract chat data
            const chatData = {
                trigger: 'chat',
                workflowId: this.workflowId,
                sessionId: inputData.sessionId,
                message: {
                    id: inputData.message.id,
                    content: inputData.message.content,
                    timestamp: inputData.message.timestamp
                },
                user: inputData.user || {
                    id: null,
                    name: 'Guest',
                    email: null
                },
                session: inputData.session || {
                    id: inputData.sessionId,
                    messagesCount: 1,
                    websiteUrl: inputData.websiteUrl,
                    createdAt: new Date()
                },
                metadata: inputData.metadata || {}
            };

            // Apply filters if configured
            if (this.filterKeywords.length > 0) {
                const messageText = chatData.message.content.toLowerCase();
                const hasKeyword = this.filterKeywords.some(keyword => 
                    messageText.includes(keyword.toLowerCase())
                );

                if (!hasKeyword) {
                    console.log('🔍 Message filtered out - no matching keywords');
                    return {
                        success: true,
                        filtered: true,
                        reason: 'No matching keywords'
                    };
                }
            }

            // Check domain restrictions
            if (this.allowedDomains.length > 0 && chatData.session.websiteUrl) {
                const messageUrl = new URL(chatData.session.websiteUrl);
                const isAllowedDomain = this.allowedDomains.some(domain => 
                    messageUrl.hostname.includes(domain)
                );

                if (!isAllowedDomain) {
                    console.log('🚫 Message filtered out - domain not allowed');
                    return {
                        success: true,
                        filtered: true,
                        reason: 'Domain not allowed'
                    };
                }
            }

            // Check user info requirement
            if (this.requireUserInfo && (!chatData.user.email || !chatData.user.name || chatData.user.name === 'Guest')) {
                console.log('👤 User info required but not provided');
                return {
                    success: true,
                    filtered: true,
                    reason: 'User info required',
                    requestUserInfo: true
                };
            }

            // Process the chat message
            const result = {
                success: true,
                nodeId: this.id,
                workflowId: this.workflowId,
                sessionId: chatData.sessionId,
                triggerData: chatData,
                outputs: {
                    default: chatData
                }
            };

            console.log('✅ Chat trigger executed successfully');
            return result;

        } catch (error) {
            console.error('❌ Chat Trigger execution error:', error);
            return {
                success: false,
                error: error.message,
                nodeId: this.id
            };
        }
    }

    /**
     * Get node configuration schema
     */
    static getConfigSchema() {
        return {
            id: 'chatTrigger',
            name: 'Chat Trigger',
            description: 'Triggers workflows from website chat messages',
            icon: 'fa-comments',
            color: 'green',
            inputs: [],
            outputs: [
                {
                    id: 'default',
                    name: 'Message Received',
                    type: 'chat_message'
                }
            ],
            config: [
                {
                    id: 'workflowId',
                    name: 'Workflow ID',
                    type: 'text',
                    required: true,
                    description: 'Unique ID for this chat workflow'
                },
                {
                    id: 'webhookUrl',
                    name: 'Webhook URL',
                    type: 'readonly',
                    value: function(config) {
                        const baseUrl = process.env.API_BASE_URL || 'https://workflow-lg9z.onrender.com';
                        return `${baseUrl}/api/chat/webhook/${config.workflowId || '{workflowId}'}`;
                    },
                    description: 'Use this URL in your chat widget configuration',
                    copyable: true
                },
                {
                    id: 'filterKeywords',
                    name: 'Filter Keywords',
                    type: 'array',
                    description: 'Only trigger for messages containing these keywords (optional)',
                    placeholder: 'support, help, question'
                },
                {
                    id: 'allowedDomains',
                    name: 'Allowed Domains',
                    type: 'array',
                    description: 'Only allow messages from these domains (optional)',
                    placeholder: 'yoursite.com, app.yoursite.com'
                },
                {
                    id: 'requireUserInfo',
                    name: 'Require User Info',
                    type: 'boolean',
                    default: false,
                    description: 'Require user email and name before processing'
                },
                {
                    id: 'autoRespond',
                    name: 'Auto Respond',
                    type: 'boolean',
                    default: false,
                    description: 'Send automatic response when triggered'
                },
                {
                    id: 'autoResponseMessage',
                    name: 'Auto Response Message',
                    type: 'textarea',
                    default: 'Thank you for your message. We\'ll get back to you soon!',
                    description: 'Message to send automatically (if auto respond is enabled)',
                    dependsOn: 'autoRespond'
                }
            ]
        };
    }

    /**
     * Validate node configuration
     */
    static validateConfig(config) {
        const errors = [];

        if (!config.workflowId) {
            errors.push('Workflow ID is required');
        }

        if (config.filterKeywords && !Array.isArray(config.filterKeywords)) {
            errors.push('Filter keywords must be an array');
        }

        if (config.allowedDomains && !Array.isArray(config.allowedDomains)) {
            errors.push('Allowed domains must be an array');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = ChatTriggerNode;