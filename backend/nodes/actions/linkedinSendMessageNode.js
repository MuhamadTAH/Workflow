/*
=================================================================
FILE: backend/nodes/actions/linkedinSendMessageNode.js
=================================================================
LinkedIn Send Message Node - Send direct messages on LinkedIn
*/

const { createBackendExecutionContext } = require('../../utils/executionContext');

class LinkedInSendMessageNode {
    constructor() {
        this.name = 'LinkedIn Send Message';
        this.type = 'linkedinSendMessage';
        this.icon = 'fab fa-linkedin';
        this.description = 'Send direct messages on LinkedIn';
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            recipientId: {
                displayName: 'Recipient ID',
                name: 'recipientId',
                type: 'string',
                default: '{{$json.recipient_id}}',
                required: true,
                description: 'LinkedIn profile ID of message recipient'
            },
            messageText: {
                displayName: 'Message Text',
                name: 'messageText',
                type: 'string',
                typeOptions: {
                    rows: 4
                },
                default: 'Hi {{$json.recipient_name || "there"}}! I wanted to reach out and connect with you.',
                required: true,
                description: 'Message content (supports expressions)'
            },
            messageType: {
                displayName: 'Message Type',
                name: 'messageType',
                type: 'options',
                options: [
                    { name: 'Text Message', value: 'text' },
                    { name: 'Connection Request', value: 'connection_request' },
                    { name: 'InMail', value: 'inmail' },
                    { name: 'Follow Up', value: 'followup' }
                ],
                default: 'text',
                description: 'Type of message to send'
            },
            subject: {
                displayName: 'Message Subject',
                name: 'subject',
                type: 'string',
                default: '{{$json.subject || "Let\'s connect!"}}',
                description: 'Subject line for InMail and connection requests'
            },
            connectionNote: {
                displayName: 'Connection Note',
                name: 'connectionNote',
                type: 'string',
                default: 'I\'d like to add you to my professional network.',
                description: 'Personal note for connection requests'
            },
            includeProfileInfo: {
                displayName: 'Include Profile Context',
                name: 'includeProfileInfo',
                type: 'boolean',
                default: true,
                description: 'Include context about recipient\'s profile in message'
            },
            profileContext: {
                displayName: 'Profile Context Template',
                name: 'profileContext',
                type: 'string',
                default: 'I noticed your experience in {{$json.recipient_industry}} and thought we might have some common interests.',
                description: 'Template for profile context (when enabled)'
            },
            callToAction: {
                displayName: 'Call to Action',
                name: 'callToAction',
                type: 'options',
                options: [
                    { name: 'None', value: 'none' },
                    { name: 'Schedule Meeting', value: 'meeting' },
                    { name: 'Visit Website', value: 'website' },
                    { name: 'Phone Call', value: 'phone' },
                    { name: 'Custom', value: 'custom' }
                ],
                default: 'none',
                description: 'Include a call-to-action in the message'
            },
            ctaText: {
                displayName: 'CTA Text',
                name: 'ctaText',
                type: 'string',
                default: '',
                description: 'Custom call-to-action text'
            },
            ctaUrl: {
                displayName: 'CTA URL',
                name: 'ctaUrl',
                type: 'string',
                default: '',
                description: 'URL for call-to-action (if applicable)'
            },
            personalizeMessage: {
                displayName: 'Auto-Personalize',
                name: 'personalizeMessage',
                type: 'boolean',
                default: true,
                description: 'Automatically personalize message based on recipient data'
            },
            messageTemplate: {
                displayName: 'Message Template',
                name: 'messageTemplate',
                type: 'options',
                options: [
                    { name: 'Custom', value: 'custom' },
                    { name: 'Professional Introduction', value: 'intro' },
                    { name: 'Follow Up', value: 'followup' },
                    { name: 'Networking', value: 'networking' },
                    { name: 'Business Proposal', value: 'business' },
                    { name: 'Thank You', value: 'thankyou' }
                ],
                default: 'custom',
                description: 'Pre-built message template to use'
            },
            respectPrivacy: {
                displayName: 'Respect Privacy Settings',
                name: 'respectPrivacy',
                type: 'boolean',
                default: true,
                description: 'Check recipient privacy settings before sending'
            },
            trackDelivery: {
                displayName: 'Track Message Delivery',
                name: 'trackDelivery',
                type: 'boolean',
                default: true,
                description: 'Track message delivery status'
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
     * Execute the LinkedIn Send Message node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('🚀 Executing LinkedIn Send Message Node');
        console.log('Config:', JSON.stringify(config, null, 2));

        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'linkedin_message_workflow', name: 'LinkedIn Send Message', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'linkedin_message', type: 'linkedinSendMessage' },
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

            console.log('💬 Sending LinkedIn message...');

            // Check privacy settings if requested
            if (processedConfig.respectPrivacy) {
                const privacyCheck = await this.checkRecipientPrivacy(processedConfig.recipientId, processedConfig.accessToken);
                if (!privacyCheck.canMessage) {
                    throw new Error(`Cannot send message: ${privacyCheck.reason}`);
                }
            }

            // Build and send message
            const messageResult = await this.sendMessage(
                processedConfig.recipientId,
                processedConfig.messageText,
                processedConfig.messageType,
                processedConfig.subject,
                processedConfig.connectionNote,
                processedConfig.includeProfileInfo,
                processedConfig.profileContext,
                processedConfig.callToAction,
                processedConfig.ctaText,
                processedConfig.ctaUrl,
                processedConfig.personalizeMessage,
                processedConfig.messageTemplate,
                processedConfig.trackDelivery,
                processedConfig.accessToken,
                inputData
            );

            if (!messageResult.success) {
                throw new Error(`Failed to send message: ${messageResult.error}`);
            }

            console.log('✅ LinkedIn message sent successfully');

            return {
                success: true,
                data: {
                    message_id: messageResult.data.message_id,
                    conversation_id: messageResult.data.conversation_id,
                    recipient_id: processedConfig.recipientId,
                    message_type: processedConfig.messageType,
                    subject: processedConfig.subject,
                    sent_at: new Date().toISOString(),
                    delivery_status: messageResult.data.delivery_status,
                    message_stats: messageResult.data.message_stats
                },
                nodeType: this.type,
                message: 'LinkedIn message sent successfully',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ LinkedIn Send Message Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Send LinkedIn message
     */
    async sendMessage(recipientId, messageText, messageType, subject, connectionNote, includeProfileInfo, profileContext, callToAction, ctaText, ctaUrl, personalizeMessage, messageTemplate, trackDelivery, accessToken, inputData) {
        try {
            console.log('💬 Sending message to recipient:', recipientId);

            // Build final message content
            let finalMessage = await this.buildFinalMessage(
                messageText, messageTemplate, includeProfileInfo, profileContext,
                callToAction, ctaText, ctaUrl, personalizeMessage, inputData
            );

            // Prepare message payload based on type
            let messagePayload;
            let apiEndpoint;

            switch (messageType) {
                case 'connection_request':
                    return await this.sendConnectionRequest(recipientId, connectionNote || finalMessage, accessToken);
                
                case 'inmail':
                    messagePayload = this.buildInMailPayload(recipientId, subject, finalMessage);
                    apiEndpoint = 'https://api.linkedin.com/v2/messages';
                    break;
                
                case 'followup':
                case 'text':
                default:
                    messagePayload = this.buildDirectMessagePayload(recipientId, finalMessage);
                    apiEndpoint = 'https://api.linkedin.com/v2/messages';
                    break;
            }

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify(messagePayload)
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.message || 'Failed to send LinkedIn message'
                };
            }

            // Process response and track delivery if requested
            const messageData = {
                message_id: result.value || result.id,
                conversation_id: result.conversationId || null,
                delivery_status: trackDelivery ? 'sent' : 'unknown',
                message_stats: {
                    character_count: finalMessage.length,
                    has_cta: callToAction !== 'none',
                    is_personalized: personalizeMessage,
                    template_used: messageTemplate !== 'custom'
                }
            };

            return {
                success: true,
                data: messageData
            };

        } catch (error) {
            console.error('Error in sendMessage:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Send connection request
     */
    async sendConnectionRequest(recipientId, note, accessToken) {
        try {
            const connectionPayload = {
                invitee: {
                    'com.linkedin.voyager.growth.invitation.GenericInvitee': {
                        inviteeUnion: {
                            memberProfile: `urn:li:fs_miniProfile:${recipientId}`
                        }
                    }
                },
                message: note
            };

            const response = await fetch('https://api.linkedin.com/v2/invitations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify(connectionPayload)
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: result.message || 'Failed to send connection request'
                };
            }

            return {
                success: true,
                data: {
                    message_id: result.value,
                    conversation_id: null,
                    delivery_status: 'sent',
                    message_stats: {
                        character_count: note.length,
                        has_cta: false,
                        is_personalized: true,
                        template_used: false
                    }
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Build final message content
     */
    async buildFinalMessage(messageText, messageTemplate, includeProfileInfo, profileContext, callToAction, ctaText, ctaUrl, personalizeMessage, inputData) {
        let finalMessage = messageText;

        // Use template if not custom
        if (messageTemplate !== 'custom') {
            finalMessage = this.getMessageTemplate(messageTemplate, inputData);
        }

        // Add profile context if requested
        if (includeProfileInfo && profileContext) {
            const processedContext = this.processTemplate(profileContext, inputData);
            finalMessage = `${processedContext}\n\n${finalMessage}`;
        }

        // Add personalization if requested
        if (personalizeMessage) {
            finalMessage = this.personalizeMessage(finalMessage, inputData);
        }

        // Add call-to-action
        if (callToAction !== 'none') {
            const ctaContent = this.buildCallToAction(callToAction, ctaText, ctaUrl);
            if (ctaContent) {
                finalMessage = `${finalMessage}\n\n${ctaContent}`;
            }
        }

        return finalMessage;
    }

    /**
     * Get pre-built message template
     */
    getMessageTemplate(templateType, inputData) {
        const templates = {
            intro: `Hi {{recipient_name}},\n\nI hope this message finds you well. I came across your profile and was impressed by your background in {{recipient_industry}}.\n\nI'd love to connect and learn more about your experience.\n\nBest regards,\n{{sender_name}}`,
            
            followup: `Hi {{recipient_name}},\n\nI wanted to follow up on our previous conversation about {{topic}}.\n\nI believe there might be some valuable opportunities for us to collaborate.\n\nLooking forward to hearing from you.\n\nBest,\n{{sender_name}}`,
            
            networking: `Hello {{recipient_name}},\n\nI noticed we share some common connections and interests in {{industry}}.\n\nI'd be interested in expanding my professional network and learning from your expertise.\n\nWould you be open to connecting?\n\nThanks,\n{{sender_name}}`,
            
            business: `Dear {{recipient_name}},\n\nI have a business opportunity that I believe might align with your interests and expertise.\n\n{{opportunity_brief}}\n\nI'd appreciate the chance to discuss this further at your convenience.\n\nBest regards,\n{{sender_name}}`,
            
            thankyou: `Hi {{recipient_name}},\n\nThank you for {{reason}}. I really appreciate {{specific_thanks}}.\n\nI look forward to staying connected and potentially collaborating in the future.\n\nWarm regards,\n{{sender_name}}`
        };

        const template = templates[templateType] || templates.intro;
        return this.processTemplate(template, inputData);
    }

    /**
     * Process template with input data
     */
    processTemplate(template, inputData) {
        let processed = template;
        
        // Simple template replacement
        const replacements = {
            '{{recipient_name}}': inputData?.recipient_name || 'there',
            '{{recipient_industry}}': inputData?.recipient_industry || 'your field',
            '{{sender_name}}': inputData?.sender_name || 'me',
            '{{topic}}': inputData?.topic || 'our discussion',
            '{{industry}}': inputData?.industry || 'the industry',
            '{{opportunity_brief}}': inputData?.opportunity_brief || 'an exciting opportunity',
            '{{reason}}': inputData?.reason || 'your time',
            '{{specific_thanks}}': inputData?.specific_thanks || 'your assistance'
        };

        Object.entries(replacements).forEach(([placeholder, value]) => {
            processed = processed.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });

        return processed;
    }

    /**
     * Personalize message based on recipient data
     */
    personalizeMessage(message, inputData) {
        // Add basic personalization
        if (inputData?.recipient_name && !message.includes(inputData.recipient_name)) {
            message = `Hi ${inputData.recipient_name},\n\n${message}`;
        }

        // Add industry-specific context if available
        if (inputData?.recipient_industry) {
            message = message.replace(/your field/g, inputData.recipient_industry);
        }

        // Add company context if available
        if (inputData?.recipient_company) {
            message = message.replace(/your company/g, inputData.recipient_company);
        }

        return message;
    }

    /**
     * Build call-to-action content
     */
    buildCallToAction(callToAction, ctaText, ctaUrl) {
        const ctas = {
            meeting: 'Would you be available for a brief call to discuss this further?',
            website: ctaUrl ? `Feel free to check out more information here: ${ctaUrl}` : 'I\'d be happy to share more details.',
            phone: 'Feel free to give me a call if you\'d like to discuss this over the phone.',
            custom: ctaText || ''
        };

        return ctas[callToAction] || '';
    }

    /**
     * Build direct message payload
     */
    buildDirectMessagePayload(recipientId, messageContent) {
        return {
            recipients: [`urn:li:person:${recipientId}`],
            subject: 'Direct Message',
            body: messageContent
        };
    }

    /**
     * Build InMail payload
     */
    buildInMailPayload(recipientId, subject, messageContent) {
        return {
            recipients: [`urn:li:person:${recipientId}`],
            subject: subject || 'InMail Message',
            body: messageContent,
            messageType: 'INMAIL'
        };
    }

    /**
     * Check recipient privacy settings
     */
    async checkRecipientPrivacy(recipientId, accessToken) {
        try {
            // This is a simplified privacy check
            // In a real implementation, you'd check the recipient's message preferences
            const profileUrl = `https://api.linkedin.com/v2/people/(id:${recipientId})`;
            const params = { projection: '(id,firstName,lastName)' };

            const response = await fetch(`${profileUrl}?${new URLSearchParams(params)}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                return {
                    canMessage: false,
                    reason: 'Recipient profile not accessible'
                };
            }

            return {
                canMessage: true,
                reason: null
            };

        } catch (error) {
            console.warn('Could not check privacy settings:', error);
            return {
                canMessage: true, // Default to allowing messages
                reason: null
            };
        }
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        const templateFields = [
            'recipientId', 'messageText', 'subject', 'connectionNote', 
            'profileContext', 'ctaText', 'ctaUrl', 'accessToken'
        ];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'linkedin_message';
                
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
        
        if (!config.recipientId || config.recipientId.trim() === '') {
            errors.push('Recipient ID is required');
        }
        
        if (!config.messageText || config.messageText.trim() === '') {
            errors.push('Message text is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('LinkedIn Access Token is required');
        }

        // Validate message length (LinkedIn has character limits)
        if (config.messageText && config.messageText.length > 8000) {
            errors.push('Message text exceeds LinkedIn character limit (8000 characters)');
        }

        // Validate InMail subject
        if (config.messageType === 'inmail' && (!config.subject || config.subject.trim() === '')) {
            errors.push('Subject is required for InMail messages');
        }

        // Validate custom CTA
        if (config.callToAction === 'custom' && (!config.ctaText || config.ctaText.trim() === '')) {
            errors.push('CTA text is required for custom call-to-action');
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
            recipientId: 'linkedin_profile_id',
            messageText: 'Hi there! I wanted to reach out and connect with you.',
            messageType: 'text',
            subject: 'Let\'s connect!',
            connectionNote: 'I\'d like to add you to my professional network.',
            includeProfileInfo: true,
            profileContext: 'I noticed your experience in your field and thought we might have some common interests.',
            callToAction: 'none',
            ctaText: '',
            ctaUrl: '',
            personalizeMessage: true,
            messageTemplate: 'custom',
            respectPrivacy: true,
            trackDelivery: true,
            accessToken: 'your_linkedin_access_token'
        };
    }
}

module.exports = new LinkedInSendMessageNode();