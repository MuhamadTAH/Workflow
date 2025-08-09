/**
 * Chat Response Node
 * Sends responses back to website chat widgets
 */

class ChatResponseNode {
    constructor(config) {
        this.id = config.id;
        this.type = 'chatResponse';
        this.config = config;
        
        // Configuration options
        this.responseText = config.responseText || 'Hello! How can I help you?';
        this.responseType = config.responseType || 'text';
        this.delay = config.delay || 0;
        this.buttons = config.buttons || [];
        this.useTemplate = config.useTemplate || false;
        this.templateText = config.templateText || '';
    }

    /**
     * Execute the chat response node
     */
    async execute(inputData) {
        try {
            console.log(`💬 Chat Response executing for node ${this.id}`);
            console.log('Input data:', inputData);

            // Validate input data
            if (!inputData || !inputData.sessionId) {
                throw new Error('No session ID provided');
            }

            // Determine response content
            let responseContent;
            if (this.useTemplate && this.templateText) {
                responseContent = this.processTemplate(this.templateText, inputData);
            } else {
                responseContent = this.responseText;
            }

            // Process any template variables in buttons
            const processedButtons = this.buttons.map(button => ({
                text: this.processTemplate(button.text || '', inputData),
                value: this.processTemplate(button.value || '', inputData),
                url: button.url ? this.processTemplate(button.url, inputData) : undefined
            }));

            // Prepare response data
            const responseData = {
                content: responseContent,
                type: this.responseType,
                buttons: processedButtons,
                delay: this.delay,
                metadata: {
                    nodeId: this.id,
                    timestamp: new Date().toISOString(),
                    responseType: this.responseType
                }
            };

            // Send response via API
            const response = await this.sendChatResponse(inputData.sessionId, responseData);

            if (!response.success) {
                throw new Error(response.error || 'Failed to send chat response');
            }

            console.log('✅ Chat response sent successfully');

            return {
                success: true,
                nodeId: this.id,
                sessionId: inputData.sessionId,
                messageId: response.messageId,
                sentContent: responseContent,
                outputs: {
                    default: {
                        ...inputData,
                        lastResponse: {
                            messageId: response.messageId,
                            content: responseContent,
                            type: this.responseType,
                            timestamp: new Date()
                        }
                    }
                }
            };

        } catch (error) {
            console.error('❌ Chat Response execution error:', error);
            return {
                success: false,
                error: error.message,
                nodeId: this.id
            };
        }
    }

    /**
     * Send chat response via API
     */
    async sendChatResponse(sessionId, responseData) {
        try {
            const fetch = require('node-fetch');
            const apiUrl = process.env.API_BASE_URL || 'http://localhost:3001';
            
            const response = await fetch(`${apiUrl}/api/chat/response/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(responseData)
            });

            return await response.json();

        } catch (error) {
            console.error('❌ Error sending chat response:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Process template variables in text
     */
    processTemplate(template, data) {
        if (!template || typeof template !== 'string') {
            return template;
        }

        // Replace common template variables
        return template
            .replace(/\{\{user\.name\}\}/g, data.user?.name || 'Guest')
            .replace(/\{\{user\.email\}\}/g, data.user?.email || '')
            .replace(/\{\{message\.content\}\}/g, data.message?.content || '')
            .replace(/\{\{session\.websiteUrl\}\}/g, data.session?.websiteUrl || '')
            .replace(/\{\{session\.messagesCount\}\}/g, data.session?.messagesCount || 0)
            .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString())
            .replace(/\{\{date\}\}/g, new Date().toLocaleDateString())
            .replace(/\{\{time\}\}/g, new Date().toLocaleTimeString());
    }

    /**
     * Get node configuration schema
     */
    static getConfigSchema() {
        return {
            id: 'chatResponse',
            name: 'Chat Response',
            description: 'Send responses to website chat widgets',
            icon: 'fa-reply',
            color: 'green',
            inputs: [
                {
                    id: 'default',
                    name: 'Trigger',
                    type: 'any',
                    required: true
                }
            ],
            outputs: [
                {
                    id: 'default',
                    name: 'Response Sent',
                    type: 'any'
                }
            ],
            config: [
                {
                    id: 'useTemplate',
                    name: 'Use Template',
                    type: 'boolean',
                    default: false,
                    description: 'Use template with variables instead of static text'
                },
                {
                    id: 'responseText',
                    name: 'Response Text',
                    type: 'textarea',
                    required: true,
                    default: 'Hello! How can I help you?',
                    description: 'Message to send to the user',
                    dependsOn: { useTemplate: false }
                },
                {
                    id: 'templateText',
                    name: 'Template Text',
                    type: 'textarea',
                    required: true,
                    description: 'Template with variables like {{user.name}}, {{message.content}}',
                    placeholder: 'Hello {{user.name}}! I received your message: "{{message.content}}"',
                    dependsOn: { useTemplate: true }
                },
                {
                    id: 'responseType',
                    name: 'Response Type',
                    type: 'select',
                    options: [
                        { value: 'text', label: 'Text' },
                        { value: 'html', label: 'HTML' },
                        { value: 'markdown', label: 'Markdown' }
                    ],
                    default: 'text',
                    description: 'Format of the response message'
                },
                {
                    id: 'delay',
                    name: 'Delay (seconds)',
                    type: 'number',
                    default: 0,
                    min: 0,
                    max: 30,
                    description: 'Delay before sending response (0-30 seconds)'
                },
                {
                    id: 'buttons',
                    name: 'Quick Reply Buttons',
                    type: 'array',
                    description: 'Add interactive buttons to the response',
                    itemSchema: {
                        text: { type: 'text', required: true, placeholder: 'Button Text' },
                        value: { type: 'text', required: true, placeholder: 'Button Value' },
                        url: { type: 'url', placeholder: 'Optional URL' }
                    }
                }
            ]
        };
    }

    /**
     * Validate node configuration
     */
    static validateConfig(config) {
        const errors = [];

        if (config.useTemplate) {
            if (!config.templateText) {
                errors.push('Template text is required when using templates');
            }
        } else {
            if (!config.responseText) {
                errors.push('Response text is required');
            }
        }

        if (config.delay < 0 || config.delay > 30) {
            errors.push('Delay must be between 0 and 30 seconds');
        }

        if (config.buttons && !Array.isArray(config.buttons)) {
            errors.push('Buttons must be an array');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = ChatResponseNode;