/*
=================================================================
FILE: backend/services/triggerDataProcessor.js
=================================================================
Standardizes and validates trigger data from various sources
*/

class TriggerDataProcessor {
    
    // Standardize trigger data format
    static standardizeTriggerData(triggerType, rawData, nodeId = null) {
        const timestamp = new Date().toISOString();
        const baseData = {
            timestamp,
            triggerType,
            nodeId: nodeId || `${triggerType}-${Date.now()}`,
            source: 'webhook_system'
        };

        switch (triggerType) {
            case 'chatTrigger':
                return this.processChatTriggerData(rawData, baseData);
            
            case 'telegramTrigger':
                return this.processTelegramTriggerData(rawData, baseData);
            
            case 'manualTrigger':
                return this.processManualTriggerData(rawData, baseData);
            
            case 'scheduleTrigger':
                return this.processScheduleTriggerData(rawData, baseData);
            
            case 'webhookTrigger':
                return this.processWebhookTriggerData(rawData, baseData);
            
            default:
                return this.processGenericTriggerData(rawData, baseData);
        }
    }

    // Process chat trigger data
    static processChatTriggerData(rawData, baseData) {
        return {
            ...baseData,
            type: 'chat_message',
            message: {
                text: rawData.message || rawData.text || '',
                userId: rawData.userId || rawData.user_id || 'anonymous',
                sessionId: rawData.sessionId || rawData.session_id || `session-${Date.now()}`,
                metadata: rawData.metadata || {}
            },
            raw: rawData
        };
    }

    // Process Telegram trigger data
    static processTelegramTriggerData(rawData, baseData) {
        const message = rawData.message || {};
        return {
            ...baseData,
            type: 'telegram_message',
            telegram: {
                updateId: rawData.update_id || rawData.updateId,
                messageId: message.message_id || message.messageId,
                chatId: message.chat?.id || message.chatId,
                text: message.text || '',
                from: {
                    id: message.from?.id || message.from?.user_id,
                    username: message.from?.username,
                    firstName: message.from?.first_name,
                    lastName: message.from?.last_name
                },
                date: message.date || Math.floor(Date.now() / 1000)
            },
            message: {
                text: message.text || '',
                userId: message.from?.id?.toString() || 'unknown',
                platform: 'telegram'
            },
            raw: rawData
        };
    }

    // Process manual trigger data
    static processManualTriggerData(rawData, baseData) {
        return {
            ...baseData,
            type: 'manual_execution',
            manual: {
                source: rawData.source || 'api_call',
                reason: rawData.reason || 'Manual trigger',
                parameters: rawData.parameters || {},
                triggeredBy: rawData.triggeredBy || 'system'
            },
            message: {
                text: rawData.message || 'Manual workflow execution',
                userId: rawData.userId || 'system'
            },
            raw: rawData
        };
    }

    // Process scheduled trigger data
    static processScheduleTriggerData(rawData, baseData) {
        return {
            ...baseData,
            type: 'scheduled_execution',
            schedule: {
                intervalMinutes: rawData.intervalMinutes,
                description: rawData.description,
                executionNumber: rawData.executionNumber || 1,
                nextExecution: rawData.nextExecution
            },
            message: {
                text: `Scheduled execution #${rawData.executionNumber || 1}`,
                userId: 'scheduler'
            },
            raw: rawData
        };
    }

    // Process generic webhook trigger data
    static processWebhookTriggerData(rawData, baseData) {
        return {
            ...baseData,
            type: 'webhook_call',
            webhook: {
                headers: rawData.headers || {},
                query: rawData.query || {},
                body: rawData.body || rawData,
                method: rawData.method || 'POST'
            },
            message: {
                text: rawData.message || JSON.stringify(rawData).substring(0, 100),
                userId: rawData.userId || 'webhook'
            },
            raw: rawData
        };
    }

    // Process generic/unknown trigger data
    static processGenericTriggerData(rawData, baseData) {
        return {
            ...baseData,
            type: 'generic_trigger',
            data: rawData,
            message: {
                text: rawData.message || rawData.text || 'Generic trigger data',
                userId: rawData.userId || 'unknown'
            },
            raw: rawData
        };
    }

    // Validate trigger data
    static validateTriggerData(triggerData) {
        const errors = [];

        if (!triggerData) {
            errors.push('Trigger data is required');
            return { isValid: false, errors };
        }

        if (!triggerData.timestamp) {
            errors.push('Timestamp is required');
        }

        if (!triggerData.triggerType) {
            errors.push('Trigger type is required');
        }

        if (!triggerData.nodeId) {
            errors.push('Node ID is required');
        }

        if (!triggerData.message || !triggerData.message.text) {
            errors.push('Message text is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Convert to execution format expected by workflow executor
    static toExecutionFormat(standardizedData) {
        return [{
            json: standardizedData,
            nodeId: standardizedData.nodeId,
            nodeType: standardizedData.triggerType
        }];
    }

    // Extract user-friendly summary from trigger data
    static getSummary(triggerData) {
        const type = triggerData.type || 'unknown';
        const text = triggerData.message?.text || 'No message';
        const user = triggerData.message?.userId || 'unknown';
        const time = new Date(triggerData.timestamp).toLocaleString();

        return {
            type,
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            user,
            time,
            platform: triggerData.telegram ? 'telegram' : 
                     triggerData.schedule ? 'scheduler' :
                     triggerData.manual ? 'manual' : 'webhook'
        };
    }
}

module.exports = TriggerDataProcessor;