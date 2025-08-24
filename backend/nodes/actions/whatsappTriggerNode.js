/*
=================================================================
FILE: backend/nodes/actions/whatsappTriggerNode.js
=================================================================
WhatsApp Trigger Node - Receives messages from specific WhatsApp number
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class WhatsAppTriggerNode {
    constructor() {
        this.name = 'WhatsApp Trigger';
        this.type = 'whatsappTrigger';
        this.icon = 'fab fa-whatsapp';
        this.description = 'Trigger workflow when receiving WhatsApp message from specific number';
        this.isTrigger = true;
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
                default: '',
                required: true,
                description: 'WhatsApp phone number to listen for messages from (e.g., +1234567890)',
                placeholder: '+1234567890'
            },
            webhookUrl: {
                displayName: 'Webhook URL',
                name: 'webhookUrl',
                type: 'string',
                default: 'https://workflow-lg9z.onrender.com/api/webhooks/whatsapp',
                required: true,
                description: 'Webhook URL for WhatsApp messages'
            },
            accessToken: {
                displayName: 'WhatsApp Access Token',
                name: 'accessToken',
                type: 'string',
                default: '{{$env.WHATSAPP_ACCESS_TOKEN}}',
                required: true,
                description: 'WhatsApp Business API Access Token'
            },
            verifyToken: {
                displayName: 'Webhook Verify Token',
                name: 'verifyToken',
                type: 'string',
                default: '{{$env.WHATSAPP_VERIFY_TOKEN}}',
                required: true,
                description: 'Token used to verify webhook (set in WhatsApp Business API dashboard)'
            },
            filterMessages: {
                displayName: 'Filter Messages',
                name: 'filterMessages',
                type: 'boolean',
                default: true,
                description: 'Only trigger for messages from the specified phone number'
            }
        };
    }

    /**
     * Execute the WhatsApp Trigger Node (called when webhook receives data)
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing WhatsApp Trigger Node');
        console.log('Config:', JSON.stringify(config, null, 2));
        console.log('Input data:', JSON.stringify(inputData, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'whatsapp_workflow', name: 'WhatsApp Trigger', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'whatsapp_trigger', type: 'whatsappTrigger' },
                    allNodes,
                    workflowData
                );
            }

            // Process templates with isolated context
            const processedConfig = this.processConfigTemplates(config, inputData, executionContext);
            
            console.log('🔒 Processed config with context:', processedConfig);

            // Validate webhook data
            const validation = this.validateWebhookData(inputData, processedConfig);
            if (!validation.valid) {
                console.log(`⚠️ Webhook validation failed: ${validation.errors.join(', ')}`);
                return {
                    success: false,
                    error: `Webhook validation failed: ${validation.errors.join(', ')}`,
                    nodeType: this.type,
                    timestamp: new Date().toISOString()
                };
            }

            // Extract message data from WhatsApp webhook
            const messageData = this.extractMessageData(inputData);
            
            // Check if message is from the specified phone number (if filtering enabled)
            if (processedConfig.filterMessages && processedConfig.phoneNumber) {
                if (!this.isFromSpecificNumber(messageData, processedConfig.phoneNumber)) {
                    console.log(`📱 Message not from specified number ${processedConfig.phoneNumber}, ignoring`);
                    return {
                        success: true,
                        data: null,
                        message: 'Message not from specified number, workflow not triggered',
                        nodeType: this.type,
                        timestamp: new Date().toISOString()
                    };
                }
            }
            
            return {
                success: true,
                data: {
                    message: messageData.text,
                    from: messageData.from,
                    fromName: messageData.fromName,
                    phoneNumber: messageData.phoneNumber,
                    messageId: messageData.messageId,
                    timestamp: messageData.timestamp,
                    messageType: messageData.messageType,
                    whatsappData: inputData
                },
                trigger: true,
                nodeType: this.type,
                message: `WhatsApp message received from ${messageData.phoneNumber}`
            };

        } catch (error) {
            console.error('❌ WhatsApp Trigger Error:', error);
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
        const templateFields = ['phoneNumber', 'accessToken', 'verifyToken', 'webhookUrl'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'whatsapp_trigger_fallback';
                
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
     * Validate WhatsApp webhook data
     */
    validateWebhookData(inputData, config) {
        const errors = [];
        
        // Check if we have webhook data
        if (!inputData) {
            errors.push('No webhook data received');
            return { valid: false, errors };
        }

        // WhatsApp Business API webhook structure validation
        if (inputData.object !== 'whatsapp_business_account') {
            // This might be a verification request
            if (inputData['hub.challenge']) {
                console.log('📱 Webhook verification request received');
                return { valid: true, errors: [], isVerification: true };
            }
            errors.push('Invalid webhook object type');
        }

        // Check for entry data
        if (!inputData.entry || !Array.isArray(inputData.entry) || inputData.entry.length === 0) {
            errors.push('No entry data in webhook');
        }

        // Check for messages in entry
        if (inputData.entry && inputData.entry[0] && 
            (!inputData.entry[0].changes || !Array.isArray(inputData.entry[0].changes))) {
            errors.push('No changes data in webhook entry');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Extract message data from WhatsApp webhook
     */
    extractMessageData(inputData) {
        try {
            const entry = inputData.entry[0];
            const change = entry.changes[0];
            const value = change.value;
            
            if (value.messages && value.messages.length > 0) {
                const message = value.messages[0];
                const contact = value.contacts ? value.contacts[0] : null;
                
                return {
                    text: message.text?.body || message.type || 'Unknown message type',
                    from: message.from,
                    fromName: contact?.profile?.name || contact?.wa_id || message.from,
                    phoneNumber: message.from,
                    messageId: message.id,
                    timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                    messageType: message.type,
                    rawMessage: message,
                    rawContact: contact
                };
            }
            
            // If no messages, return empty data
            return {
                text: '',
                from: '',
                fromName: '',
                phoneNumber: '',
                messageId: '',
                timestamp: new Date().toISOString(),
                messageType: 'unknown'
            };
            
        } catch (error) {
            console.error('❌ Error extracting message data:', error);
            return {
                text: 'Error parsing message',
                from: '',
                fromName: '',
                phoneNumber: '',
                messageId: '',
                timestamp: new Date().toISOString(),
                messageType: 'error'
            };
        }
    }

    /**
     * Check if message is from specific phone number
     */
    isFromSpecificNumber(messageData, targetPhoneNumber) {
        if (!targetPhoneNumber || !messageData.phoneNumber) {
            return false;
        }
        
        // Normalize phone numbers for comparison
        const normalizePhone = (phone) => {
            return phone.replace(/\D/g, ''); // Remove all non-digits
        };
        
        const normalizedTarget = normalizePhone(targetPhoneNumber);
        const normalizedFrom = normalizePhone(messageData.phoneNumber);
        
        // Check if numbers match (allowing for country code variations)
        return normalizedFrom.endsWith(normalizedTarget.slice(-10)) || 
               normalizedTarget.endsWith(normalizedFrom.slice(-10)) ||
               normalizedFrom === normalizedTarget;
    }

    /**
     * Handle webhook verification (for WhatsApp Business API setup)
     */
    handleWebhookVerification(query, config) {
        const hubChallenge = query['hub.challenge'];
        const hubVerifyToken = query['hub.verify_token'];
        const hubMode = query['hub.mode'];
        
        console.log('📱 WhatsApp webhook verification:', { hubMode, hubVerifyToken });
        
        if (hubMode === 'subscribe' && hubVerifyToken === config.verifyToken) {
            console.log('✅ WhatsApp webhook verification successful');
            return { success: true, challenge: hubChallenge };
        }
        
        console.log('❌ WhatsApp webhook verification failed');
        return { success: false, error: 'Verification token mismatch' };
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
            webhookUrl: 'https://workflow-lg9z.onrender.com/api/webhooks/whatsapp',
            accessToken: 'YOUR_WHATSAPP_ACCESS_TOKEN',
            verifyToken: 'YOUR_VERIFY_TOKEN',
            filterMessages: true
        };
    }

    /**
     * Get mock webhook data for testing
     */
    getMockWebhookData() {
        return {
            object: 'whatsapp_business_account',
            entry: [{
                id: '123456789',
                changes: [{
                    value: {
                        messaging_product: 'whatsapp',
                        metadata: {
                            display_phone_number: '+1234567890',
                            phone_number_id: '123456789'
                        },
                        contacts: [{
                            profile: {
                                name: 'John Doe'
                            },
                            wa_id: '1234567890'
                        }],
                        messages: [{
                            from: '1234567890',
                            id: 'wamid.abcd1234',
                            timestamp: Math.floor(Date.now() / 1000).toString(),
                            text: {
                                body: 'Hello from WhatsApp!'
                            },
                            type: 'text'
                        }]
                    },
                    field: 'messages'
                }]
            }]
        };
    }
}

module.exports = new WhatsAppTriggerNode();