const axios = require('axios');

class TelegramAPI {
  constructor(botToken) {
    this.botToken = botToken;
    this.baseURL = `https://api.telegram.org/bot${botToken}`;
    
    // Create axios instance with timeout
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000, // 10 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Send a text message
  async sendMessage(chatId, text, options = {}) {
    try {
      console.log(`📤 Sending Telegram message to chat ${chatId}: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      
      const payload = {
        chat_id: chatId,
        text: text,
        ...options
      };

      // Handle parse_mode
      if (options.parseMode && options.parseMode !== 'Plain') {
        payload.parse_mode = options.parseMode;
      }

      // Handle disable_web_page_preview
      if (options.disableWebPagePreview) {
        payload.disable_web_page_preview = true;
      }

      const response = await this.api.post('/sendMessage', payload);
      
      console.log(`✅ Message sent successfully. Message ID: ${response.data.result.message_id}`);
      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Error sending Telegram message:', error.message);
      
      let errorMessage = 'Unknown error';
      let errorCode = 'UNKNOWN_ERROR';

      if (error.response) {
        // Telegram API returned an error
        const telegramError = error.response.data;
        errorMessage = telegramError.description || 'Telegram API error';
        errorCode = telegramError.error_code || error.response.status;
        
        console.error('Telegram API error:', telegramError);
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error - could not reach Telegram API';
        errorCode = 'NETWORK_ERROR';
      } else {
        // Other error
        errorMessage = error.message;
        errorCode = 'REQUEST_ERROR';
      }

      return {
        success: false,
        error: {
          message: errorMessage,
          code: errorCode,
          raw: error.response?.data || error.message
        }
      };
    }
  }

  // Get bot information
  async getMe() {
    try {
      const response = await this.api.get('/getMe');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting bot info:', error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  // Set webhook URL with enhanced options
  async setWebhook(url, options = {}) {
    try {
      console.log(`🔗 Setting Telegram webhook: ${url}`);
      
      const payload = {
        url: url,
        max_connections: options.maxConnections || 40,
        allowed_updates: options.allowedUpdates || ['message', 'callback_query'],
        drop_pending_updates: options.dropPendingUpdates || false
      };

      // Add secret token for webhook security (recommended)
      if (options.secretToken) {
        payload.secret_token = options.secretToken;
      }

      const response = await this.api.post('/setWebhook', payload);
      
      console.log(`✅ Webhook set successfully:`, response.data.result);
      return {
        success: true,
        data: response.data,
        webhookUrl: url
      };

    } catch (error) {
      console.error('❌ Error setting webhook:', error.message);
      
      let errorMessage = 'Unknown error setting webhook';
      let errorCode = 'WEBHOOK_SET_ERROR';

      if (error.response) {
        const telegramError = error.response.data;
        errorMessage = telegramError.description || 'Telegram API error';
        errorCode = telegramError.error_code || error.response.status;
        
        console.error('Telegram webhook error:', telegramError);
      } else if (error.request) {
        errorMessage = 'Network error - could not reach Telegram API';
        errorCode = 'NETWORK_ERROR';
      }

      return {
        success: false,
        error: {
          message: errorMessage,
          code: errorCode,
          raw: error.response?.data || error.message
        }
      };
    }
  }

  // Get webhook info with detailed status
  async getWebhookInfo() {
    try {
      console.log(`📋 Getting webhook info for bot ${this.botToken.substring(0, 10)}...`);
      
      const response = await this.api.get('/getWebhookInfo');
      const webhookInfo = response.data.result;
      
      console.log(`📊 Webhook status:`, {
        url: webhookInfo.url || 'Not set',
        hasCustomCertificate: webhookInfo.has_custom_certificate,
        pendingUpdateCount: webhookInfo.pending_update_count,
        lastErrorDate: webhookInfo.last_error_date,
        lastErrorMessage: webhookInfo.last_error_message,
        maxConnections: webhookInfo.max_connections
      });

      return {
        success: true,
        data: response.data,
        status: {
          isSet: !!webhookInfo.url,
          url: webhookInfo.url,
          pendingUpdates: webhookInfo.pending_update_count || 0,
          lastError: webhookInfo.last_error_message || null,
          lastErrorDate: webhookInfo.last_error_date || null,
          maxConnections: webhookInfo.max_connections || 40
        }
      };

    } catch (error) {
      console.error('❌ Error getting webhook info:', error.message);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.description || error.message,
          code: error.response?.data?.error_code || 'WEBHOOK_INFO_ERROR'
        }
      };
    }
  }

  // Delete webhook with optional cleanup
  async deleteWebhook(dropPendingUpdates = true) {
    try {
      console.log(`🗑️ Deleting webhook for bot ${this.botToken.substring(0, 10)}...`);
      
      const payload = {
        drop_pending_updates: dropPendingUpdates
      };

      const response = await this.api.post('/deleteWebhook', payload);
      
      console.log(`✅ Webhook deleted successfully`);
      return {
        success: true,
        data: response.data,
        message: 'Webhook deleted successfully'
      };

    } catch (error) {
      console.error('❌ Error deleting webhook:', error.message);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.description || error.message,
          code: error.response?.data?.error_code || 'WEBHOOK_DELETE_ERROR'
        }
      };
    }
  }

  // Utility method to validate webhook URL format
  static validateWebhookUrl(url) {
    try {
      const parsedUrl = new URL(url);
      
      // Telegram webhook requirements
      const isHttps = parsedUrl.protocol === 'https:';
      const hasValidDomain = parsedUrl.hostname && parsedUrl.hostname !== 'localhost';
      const hasValidPath = parsedUrl.pathname.length > 1;
      
      return {
        valid: isHttps && hasValidDomain && hasValidPath,
        errors: [
          ...(!isHttps ? ['URL must use HTTPS protocol'] : []),
          ...(!hasValidDomain ? ['URL must have a valid domain (not localhost)'] : []),
          ...(!hasValidPath ? ['URL must have a valid path'] : [])
        ]
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid URL format']
      };
    }
  }

  // Helper method to generate webhook URL for a node
  static generateWebhookUrl(baseUrl, nodeId) {
    const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    return `${cleanBaseUrl}/api/webhooks/telegram-webhook/${nodeId}`;
  }

  // Test webhook connectivity by sending a test update
  async testWebhook() {
    try {
      console.log(`🧪 Testing webhook connectivity...`);
      
      // Get current webhook info to verify it's set
      const webhookInfo = await this.getWebhookInfo();
      
      if (!webhookInfo.success || !webhookInfo.status.isSet) {
        return {
          success: false,
          error: {
            message: 'No webhook is currently set for this bot',
            code: 'NO_WEBHOOK_SET'
          }
        };
      }

      // Return webhook status for testing
      return {
        success: true,
        data: {
          webhookUrl: webhookInfo.status.url,
          pendingUpdates: webhookInfo.status.pendingUpdates,
          lastError: webhookInfo.status.lastError,
          message: 'Webhook is configured and ready to receive updates'
        }
      };

    } catch (error) {
      console.error('❌ Error testing webhook:', error.message);
      
      return {
        success: false,
        error: {
          message: error.message,
          code: 'WEBHOOK_TEST_ERROR'
        }
      };
    }
  }
}

// Template processing utility
class TemplateProcessor {
  static processTemplate(template, data) {
    if (!template || typeof template !== 'string') {
      return template;
    }

    try {
      // Replace {{key.path}} with actual values from data
      return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = this.getNestedValue(data, path.trim());
        return value !== undefined ? String(value) : match;
      });
    } catch (error) {
      console.error('Error processing template:', error);
      return template;
    }
  }

  static getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}

module.exports = { TelegramAPI, TemplateProcessor };