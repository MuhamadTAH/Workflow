const logger = require('../../services/logger');

/**
 * Chat Trigger Node - Webhook-based workflow trigger
 * Generates unique webhook URLs and processes incoming messages
 */
class ChatTriggerNode {
    constructor() {
        this.type = 'chatTrigger';
        this.name = 'Chat Trigger';
        this.description = 'Start workflow from webhook messages';
        this.category = 'trigger';
        this.icon = 'fa-comments';
        this.color = 'text-green-500';
    }

    /**
     * Generate webhook URL for this trigger node
     * @param {string} workflowId - The workflow ID
     * @param {string} nodeId - The node ID
     * @param {object} config - Node configuration
     * @returns {string} - Webhook URL
     */
    generateWebhookUrl(workflowId, nodeId, config = {}) {
        const path = config.webhookPath || 'chat';
        const baseUrl = process.env.BASE_URL || 'https://workflow-lg9z.onrender.com';
        return `${baseUrl}/api/webhooks/chat/${nodeId}/${path}`;
    }

    /**
     * Process incoming webhook data
     * This is called when a webhook request comes in
     * @param {object} requestData - The incoming request data
     * @param {object} config - Node configuration
     * @returns {object} - Processed data for workflow
     */
    async processWebhookData(requestData, config = {}) {
        try {
            const { body, headers, query, method } = requestData;

            logger.info(`Chat Trigger processing webhook data`, {
                method,
                hasBody: !!body,
                bodyType: typeof body,
                headerCount: Object.keys(headers || {}).length
            });

            // Validate HTTP method if specified
            if (config.httpMethod && config.httpMethod !== method) {
                throw new Error(`Method ${method} not allowed. Expected ${config.httpMethod}.`);
            }

            // Validate secret token if provided
            if (config.secretToken) {
                const providedSecret = headers['x-secret'] || headers['X-Secret'];
                if (providedSecret !== config.secretToken) {
                    throw new Error('Invalid or missing secret token');
                }
            }

            // Process the incoming data
            const processedData = {
                // Raw data
                json: body || {},
                headers: headers || {},
                query: query || {},
                method: method,
                
                // Convenient fields for common chatbot formats
                text: this.extractText(body),
                userId: this.extractUserId(body),
                sessionId: this.extractSessionId(body),
                timestamp: new Date().toISOString(),
                
                // Node metadata
                nodeId: config.nodeId,
                nodeType: this.type,
                webhookPath: config.webhookPath || 'chat'
            };

            logger.info(`Chat Trigger processed data successfully`, {
                hasText: !!processedData.text,
                userId: processedData.userId,
                method: processedData.method
            });

            return processedData;

        } catch (error) {
            logger.logError(error, { 
                context: 'chat_trigger_process', 
                nodeId: config.nodeId 
            });
            throw error;
        }
    }

    /**
     * Extract text from various chatbot payload formats
     * @param {object} body - Request body
     * @returns {string|null} - Extracted text
     */
    extractText(body) {
        if (!body) return null;
        
        // Direct text field
        if (body.text) return body.text;
        
        // Telegram format
        if (body.message?.text) return body.message.text;
        
        // Facebook Messenger format
        if (body.entry?.[0]?.messaging?.[0]?.message?.text) {
            return body.entry[0].messaging[0].message.text;
        }
        
        // WhatsApp format
        if (body.messages?.[0]?.text?.body) {
            return body.messages[0].text.body;
        }
        
        // Generic message field
        if (body.message && typeof body.message === 'string') {
            return body.message;
        }
        
        // Content field
        if (body.content) return body.content;
        
        return null;
    }

    /**
     * Extract user ID from various chatbot payload formats
     * @param {object} body - Request body
     * @returns {string|null} - Extracted user ID
     */
    extractUserId(body) {
        if (!body) return null;
        
        // Direct userId field
        if (body.userId) return String(body.userId);
        if (body.user_id) return String(body.user_id);
        
        // Telegram format
        if (body.message?.from?.id) return String(body.message.from.id);
        
        // Facebook Messenger format
        if (body.entry?.[0]?.messaging?.[0]?.sender?.id) {
            return String(body.entry[0].messaging[0].sender.id);
        }
        
        // WhatsApp format
        if (body.messages?.[0]?.from) {
            return String(body.messages[0].from);
        }
        
        // Generic from field
        if (body.from) return String(body.from);
        
        return null;
    }

    /**
     * Extract session ID from payload
     * @param {object} body - Request body
     * @returns {string|null} - Extracted session ID
     */
    extractSessionId(body) {
        if (!body) return null;
        
        if (body.sessionId) return String(body.sessionId);
        if (body.session_id) return String(body.session_id);
        if (body.chatId) return String(body.chatId);
        if (body.chat_id) return String(body.chat_id);
        
        // Telegram chat ID
        if (body.message?.chat?.id) return String(body.message.chat.id);
        
        return null;
    }

    /**
     * Validate node configuration
     * @param {object} config - Node configuration
     * @returns {object} - Validation result
     */
    validateConfig(config) {
        const errors = [];
        
        // Webhook path validation
        if (config.webhookPath) {
            if (!/^[a-zA-Z0-9_-]+$/.test(config.webhookPath)) {
                errors.push('Webhook path must contain only letters, numbers, hyphens, and underscores');
            }
            if (config.webhookPath.length > 50) {
                errors.push('Webhook path must be 50 characters or less');
            }
        }
        
        // HTTP method validation
        if (config.httpMethod) {
            const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
            if (!allowedMethods.includes(config.httpMethod)) {
                errors.push(`HTTP method must be one of: ${allowedMethods.join(', ')}`);
            }
        }
        
        // Secret token validation
        if (config.secretToken) {
            if (config.secretToken.length < 8) {
                errors.push('Secret token must be at least 8 characters long');
            }
            if (config.secretToken.length > 200) {
                errors.push('Secret token must be 200 characters or less');
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get node execution information
     * @param {object} config - Node configuration
     * @returns {object} - Node info for display
     */
    getNodeInfo(config = {}) {
        const webhookPath = config.webhookPath || 'chat';
        const method = config.httpMethod || 'POST';
        const hasSecret = !!config.secretToken;
        
        return {
            type: this.type,
            name: this.name,
            status: 'ready',
            webhookPath,
            method,
            hasSecret,
            webhookUrl: this.generateWebhookUrl('workflow', 'node', config)
        };
    }
}

module.exports = ChatTriggerNode;