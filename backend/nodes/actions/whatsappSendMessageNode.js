/*
=================================================================
FILE: backend/nodes/actions/whatsappSendMessageNode.js
=================================================================
WhatsApp Send Message node implementation with WhatsApp Business API
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class WhatsAppSendMessageNode {
    constructor() {
        this.name = 'Send WhatsApp Message';
        this.type = 'whatsappSendMessage';
        this.icon = 'fab fa-whatsapp';
        this.description = 'Send WhatsApp messages via WhatsApp Business API';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            phoneNumber: {
                displayName: 'Phone Number',
                name: 'phoneNumber',
                type: 'string',
                default: '{{$json.from || $json.phoneNumber}}',
                required: true,
                description: 'Phone number to send message to (include country code)',
                placeholder: '+1234567890'
            },
            messageText: {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: 'Hello {{$json.fromName || "there"}}! Thanks for your message.',
                required: true,
                description: 'Message content (supports expressions)'
            },
            accessToken: {
                displayName: 'WhatsApp Access Token',
                name: 'accessToken',
                type: 'string',
                default: '{{$env.WHATSAPP_ACCESS_TOKEN}}',
                required: true,
                description: 'WhatsApp Business API Access Token'
            },
            phoneNumberId: {
                displayName: 'Phone Number ID',
                name: 'phoneNumberId',
                type: 'string',
                default: '{{$env.WHATSAPP_PHONE_NUMBER_ID}}',
                required: true,
                description: 'WhatsApp Business Phone Number ID from Meta'
            },
            messageType: {
                displayName: 'Message Type',
                name: 'messageType',
                type: 'options',
                options: [
                    { name: 'Text', value: 'text' },
                    { name: 'Template', value: 'template' }
                ],
                default: 'text',
                description: 'Type of WhatsApp message to send'
            }
        };
    }

    /**
     * Execute the WhatsApp Send Message node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing WhatsApp Send Message Node');
        console.log('Config:', JSON.stringify(config, null, 2));
        console.log('Input data:', JSON.stringify(inputData, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'whatsapp_workflow', name: 'WhatsApp Send', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'whatsapp_send', type: 'whatsappSendMessage' },
                    allNodes,
                    workflowData
                );
            }

            // Process templates with isolated context
            const processedConfig = this.processConfigTemplates(config, inputData, executionContext);
            
            console.log('🔒 Processed config with context:', processedConfig);

            // Validate required parameters
            const validation = this.validateParameters(processedConfig, inputData);
            if (!validation.valid) {
                throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
            }

            // Send message to WhatsApp
            const result = await this.sendWhatsAppMessage(processedConfig);
            
            return {
                success: true,
                data: {
                    messageId: result.messages?.[0]?.id,
                    phoneNumber: processedConfig.phoneNumber,
                    messageText: processedConfig.messageText,
                    status: result.messages?.[0]?.message_status || 'sent',
                    sentAt: new Date().toISOString()
                },
                whatsapp: result,
                nodeType: this.type,
                message: 'WhatsApp message sent successfully'
            };

        } catch (error) {
            console.error('❌ WhatsApp Send Message Error:', error);
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
        
        // Map frontend field names to backend field names
        if (processed.messageText) {
            processed.text = processed.messageText;
            console.log(`🔄 Mapped messageText: "${processed.messageText}" → text: "${processed.text}"`);
        }
        
        // Additional debug logging
        console.log('🔍 Available config fields:', Object.keys(processed));
        console.log('🔍 Text field value before processing:', processed.text);
        console.log('🔍 MessageText field value:', processed.messageText);
        
        // Fields that support template expressions
        const templateFields = ['phoneNumber', 'text', 'messageText', 'accessToken', 'phoneNumberId'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'whatsapp_send_fallback';
                console.log(`🔧 WhatsApp node using actual nodeId: ${actualNodeId} for field: ${field}`);
                
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
        
        // Debug final processed values
        console.log('🔍 Final text field value after processing:', processed.text);
        console.log('🔍 Final phoneNumber field value after processing:', processed.phoneNumber);

        return processed;
    }

    /**
     * Validate required parameters
     */
    validateParameters(config, inputData = null) {
        const errors = [];
        
        // Debug validation inputs
        console.log('🔍 Validating config:', {
            hasText: !!config.text,
            textValue: config.text,
            textType: typeof config.text,
            hasPhoneNumber: !!config.phoneNumber,
            phoneNumberValue: config.phoneNumber,
            allFields: Object.keys(config)
        });
        
        if (!config.phoneNumber || config.phoneNumber.trim() === '') {
            errors.push('Phone number is required');
        }
        
        if (!config.text || config.text.trim() === '') {
            console.log('❌ Text validation failed - text field:', config.text);
            errors.push('Message text is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('WhatsApp Access Token is required');
        }
        
        if (!config.phoneNumberId || config.phoneNumberId.trim() === '') {
            errors.push('Phone Number ID is required');
        }
        
        // Validate phone number format
        if (config.phoneNumber && !this.isValidPhoneNumber(config.phoneNumber)) {
            errors.push('Invalid phone number format (should include country code, e.g., +1234567890)');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Validate phone number format
     */
    isValidPhoneNumber(phoneNumber) {
        // Basic validation for international phone number format
        // Should start with + and contain only digits and spaces/dashes
        const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
        
        // Should start with + and have 10-15 digits
        if (!/^\+\d{10,15}$/.test(cleanNumber)) {
            return false;
        }
        
        return true;
    }

    /**
     * Send message to WhatsApp Business API
     */
    async sendWhatsAppMessage(config) {
        const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
        
        // Build request body based on message type
        const body = {
            messaging_product: 'whatsapp',
            to: config.phoneNumber.replace(/\D/g, ''), // Remove non-digits for API
            type: config.messageType || 'text'
        };
        
        if (config.messageType === 'template') {
            // Template message format (for initial conversations)
            body.template = {
                name: config.templateName || 'hello_world',
                language: {
                    code: config.languageCode || 'en_US'
                }
            };
        } else {
            // Text message format (default)
            body.text = {
                body: config.text
            };
        }

        console.log('📤 Sending to WhatsApp API:', { 
            url: url.replace(/\/\d+\//, '/[PHONE_ID]/'), 
            body: {
                ...body,
                to: body.to.slice(-4) // Only show last 4 digits
            }
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.accessToken}`,
                    'User-Agent': 'Workflow-Builder/1.0'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                throw new Error(`WhatsApp API Error: ${errorMsg}`);
            }

            console.log('✅ WhatsApp API Response:', {
                messageId: data.messages?.[0]?.id,
                status: data.messages?.[0]?.message_status,
                success: true
            });

            return data;

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error: Unable to connect to WhatsApp API');
            }
            throw error;
        }
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
            phoneNumber: '+1234567890',
            messageText: 'Hello from WhatsApp Business API!',
            accessToken: 'YOUR_WHATSAPP_ACCESS_TOKEN',
            phoneNumberId: 'YOUR_PHONE_NUMBER_ID',
            messageType: 'text'
        };
    }

    /**
     * Get mock input data for testing
     */
    getMockInputData() {
        return {
            from: '+1234567890',
            fromName: 'John Doe',
            phoneNumber: '+1234567890',
            message: 'Hello, I need help!',
            messageId: 'wamid.test12345',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Rate limiting helper (for production use)
     */
    async rateLimitDelay() {
        // WhatsApp Business API has rate limits
        // Add a small delay to prevent hitting limits
        return new Promise(resolve => setTimeout(resolve, 100));
    }
}

module.exports = new WhatsAppSendMessageNode();