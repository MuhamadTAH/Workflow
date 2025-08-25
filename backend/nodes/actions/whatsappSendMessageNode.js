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
     * Get node parameters structure (for UI configuration) - Match n8n exactly
     */
    getParameters() {
        return {
            accessToken: {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                default: '{{$env.WHATSAPP_ACCESS_TOKEN}}',
                required: true,
                description: 'WhatsApp Business API Access Token from Meta Developer Console',
                placeholder: 'EAAxxxxxxxx...'
            },
            businessId: {
                displayName: 'Business ID',
                name: 'businessId', 
                type: 'string',
                default: '{{$env.WHATSAPP_BUSINESS_ID}}',
                required: true,
                description: 'WhatsApp Business Account ID',
                placeholder: '1234567890123456'
            },
            phoneNumberId: {
                displayName: 'Phone Number Send ID',
                name: 'phoneNumberId',
                type: 'string',
                default: '{{$env.WHATSAPP_PHONE_NUMBER_ID}}',
                required: true,
                description: 'WhatsApp Phone Number ID (the number that sends messages)',
                placeholder: '628007790405551'
            },
            recipientPhoneNumber: {
                displayName: 'Recipient Phone Number',
                name: 'recipientPhoneNumber',
                type: 'string',
                required: true,
                description: 'Phone number to send message to (without + sign)',
                placeholder: '9647700716669'
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
                description: 'Text message to send',
                placeholder: 'Hello! This is a message from WhatsApp Business API.'
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
                    recipientPhoneNumber: processedConfig.recipientPhoneNumber,
                    messageText: processedConfig.messageText,
                    status: result.messages?.[0]?.message_status || 'sent',
                    sentAt: new Date().toISOString(),
                    whatsappResponse: result
                },
                nodeType: this.type,
                message: `📱 WhatsApp message sent to ${processedConfig.recipientPhoneNumber}`
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
        
        // Fields that support template expressions - updated for n8n-style parameters
        const templateFields = ['accessToken', 'businessId', 'phoneNumberId', 'recipientPhoneNumber', 'messageText'];
        
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
        console.log('🔍 Final messageText field value after processing:', processed.messageText);
        console.log('🔍 Final recipientPhoneNumber field value after processing:', processed.recipientPhoneNumber);

        return processed;
    }

    /**
     * Validate required parameters - updated for n8n-style parameters
     */
    validateParameters(config, inputData = null) {
        const errors = [];
        
        // Debug validation inputs
        console.log('🔍 Validating config:', {
            hasAccessToken: !!config.accessToken,
            hasBusinessId: !!config.businessId,
            hasPhoneNumberId: !!config.phoneNumberId,
            hasRecipientPhoneNumber: !!config.recipientPhoneNumber,
            hasMessageText: !!config.messageText,
            messageTextValue: config.messageText,
            allFields: Object.keys(config)
        });
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access Token is required');
        }
        
        if (!config.businessId || config.businessId.trim() === '') {
            errors.push('Business ID is required');
        }
        
        if (!config.phoneNumberId || config.phoneNumberId.trim() === '') {
            errors.push('Phone Number Send ID is required');
        }
        
        if (!config.recipientPhoneNumber || config.recipientPhoneNumber.trim() === '') {
            errors.push('Recipient Phone Number is required');
        }
        
        if (!config.messageText || config.messageText.trim() === '') {
            console.log('❌ Message text validation failed - messageText field:', config.messageText);
            errors.push('Message Text is required');
        }
        
        // Validate phone number format (basic validation for digits)
        if (config.recipientPhoneNumber && !/^\d+$/.test(config.recipientPhoneNumber.replace(/\s/g, ''))) {
            errors.push('Recipient Phone Number should contain only digits (no + sign)');
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
     * Send message to WhatsApp Business API - updated for n8n-style parameters
     */
    async sendWhatsAppMessage(config) {
        const url = `https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`;
        
        // Build request body for WhatsApp Business API
        const body = {
            messaging_product: 'whatsapp',
            to: config.recipientPhoneNumber,
            type: 'text',
            text: {
                body: config.messageText
            }
        };

        console.log('📤 Sending to WhatsApp API:', { 
            url: url.replace(/\/\d+\//, '/[PHONE_ID]/'), 
            body: {
                ...body,
                to: `***${body.to.slice(-4)}` // Only show last 4 digits
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
                console.error('❌ WhatsApp API Error Response:', data);
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
            console.error('❌ WhatsApp Send Error:', error);
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