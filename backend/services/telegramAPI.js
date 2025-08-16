const axios = require('axios');
const logger = require('./logger');

// Bot configuration
const botToken = '8148982414:AAEPKCLwwxiMp0KH3wKqrqdTnPI3W3E_0VQ';
const webhookUrl = 'https://workflow-unlq.onrender.com/api/webhooks/telegram';

// Function to set Telegram webhook
async function setTelegramWebhook() {
  try {
    const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
    console.log('🛰️  Setting Telegram webhook...');
    console.log('📡 Webhook URL:', webhookUrl);
    
    const res = await axios.post(url, { 
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    });
    
    console.log('✅ Webhook set successfully:', res.data);
    
    if (res.data.ok) {
      console.log('🎉 Telegram bot is now ready to receive messages!');
      console.log('📨 Send a message to your bot to test the webhook');
    } else {
      console.log('❌ Failed to set webhook:', res.data.description);
    }
    
    return res.data;
  } catch (error) {
    console.error('❌ Error setting webhook:', error.response?.data || error.message);
    throw error;
  }
}

// Function to get webhook info
async function getWebhookInfo() {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const res = await axios.get(url);
    console.log('📋 Current webhook info:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Error getting webhook info:', error.response?.data || error.message);
    throw error;
  }
}

// Function to delete webhook
async function deleteWebhook() {
  try {
    const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
    const res = await axios.post(url);
    console.log('🗑️  Webhook deleted:', res.data);
    return res.data;
  } catch (error) {
    console.error('❌ Error deleting webhook:', error.response?.data || error.message);
    throw error;
  }
}

// If this file is run directly, set the webhook
if (require.main === module) {
  console.log('🚀 Registering Telegram webhook...');
  setTelegramWebhook()
    .then(() => {
      console.log('✅ Webhook registration complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Webhook registration failed:', error.message);
      process.exit(1);
    });
}

class TelegramAPI {
  constructor(botToken) {
    this.botToken = botToken;
    this.baseURL = `https://api.telegram.org/bot${botToken}`;
  }

  async validateToken() {
    try {
      const response = await axios.get(`${this.baseURL}/getMe`, {
        timeout: 5000
      });
      
      if (response.data && response.data.ok) {
        logger.info('Telegram bot token validated successfully', {
          botId: response.data.result.id,
          botUsername: response.data.result.username,
          botFirstName: response.data.result.first_name
        });
        return {
          success: true,
          data: response.data.result
        };
      } else {
        logger.warn('Telegram token validation failed', { 
          response: response.data 
        });
        return {
          success: false,
          error: { message: 'Invalid token response' }
        };
      }
    } catch (error) {
      logger.logError(error, { 
        context: 'validateToken',
        botToken: this.botToken ? 'present' : 'missing'
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.description || error.message || 'Token validation failed'
        }
      };
    }
  }

  async setWebhook(url, options = {}) {
    try {
      const payload = {
        url: url,
        ...options
      };

      const response = await axios.post(`${this.baseURL}/setWebhook`, payload, {
        timeout: 10000
      });

      if (response.data && response.data.ok) {
        logger.info('Webhook set successfully', {
          url: url,
          description: response.data.description
        });
        return {
          success: true,
          data: response.data
        };
      } else {
        logger.warn('Failed to set webhook', {
          url: url,
          response: response.data
        });
        return {
          success: false,
          error: { message: response.data?.description || 'Failed to set webhook' }
        };
      }
    } catch (error) {
      logger.logError(error, {
        context: 'setWebhook',
        url: url
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.description || error.message || 'Webhook setup failed'
        }
      };
    }
  }

  async deleteWebhook() {
    try {
      const response = await axios.post(`${this.baseURL}/deleteWebhook`, {}, {
        timeout: 5000
      });

      if (response.data && response.data.ok) {
        logger.info('Webhook deleted successfully');
        return {
          success: true,
          data: response.data
        };
      } else {
        logger.warn('Failed to delete webhook', {
          response: response.data
        });
        return {
          success: false,
          error: { message: response.data?.description || 'Failed to delete webhook' }
        };
      }
    } catch (error) {
      logger.logError(error, { context: 'deleteWebhook' });
      return {
        success: false,
        error: { 
          message: error.response?.data?.description || error.message || 'Webhook deletion failed'
        }
      };
    }
  }

  async getWebhookInfo() {
    try {
      const response = await axios.get(`${this.baseURL}/getWebhookInfo`, {
        timeout: 5000
      });

      if (response.data && response.data.ok) {
        return {
          success: true,
          data: response.data.result
        };
      } else {
        return {
          success: false,
          error: { message: response.data?.description || 'Failed to get webhook info' }
        };
      }
    } catch (error) {
      logger.logError(error, { context: 'getWebhookInfo' });
      return {
        success: false,
        error: { 
          message: error.response?.data?.description || error.message || 'Failed to get webhook info'
        }
      };
    }
  }

  async sendMessage(chatId, text, options = {}) {
    try {
      const payload = {
        chat_id: chatId,
        text: text,
        ...options
      };

      // Handle parse_mode properly
      if (options.parseMode && options.parseMode !== '') {
        payload.parse_mode = options.parseMode;
        delete payload.parseMode;
      }

      // Handle disable_web_page_preview
      if (options.disableWebPagePreview !== undefined) {
        payload.disable_web_page_preview = options.disableWebPagePreview;
        delete payload.disableWebPagePreview;
      }

      logger.debug('Sending Telegram message', {
        chatId: chatId,
        textLength: text.length,
        options: Object.keys(options)
      });

      const response = await axios.post(`${this.baseURL}/sendMessage`, payload, {
        timeout: 10000
      });

      if (response.data && response.data.ok) {
        logger.info('Message sent successfully', {
          chatId: chatId,
          messageId: response.data.result.message_id
        });
        return {
          success: true,
          data: response.data
        };
      } else {
        logger.warn('Failed to send message', {
          chatId: chatId,
          response: response.data
        });
        return {
          success: false,
          error: { message: response.data?.description || 'Failed to send message' }
        };
      }
    } catch (error) {
      logger.logError(error, {
        context: 'sendMessage',
        chatId: chatId,
        textLength: text?.length || 0
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.description || error.message || 'Message sending failed'
        }
      };
    }
  }

  async getUpdates(options = {}) {
    try {
      const response = await axios.get(`${this.baseURL}/getUpdates`, {
        params: options,
        timeout: 5000
      });

      if (response.data && response.data.ok) {
        return {
          success: true,
          data: response.data.result
        };
      } else {
        return {
          success: false,
          error: { message: response.data?.description || 'Failed to get updates' }
        };
      }
    } catch (error) {
      logger.logError(error, { context: 'getUpdates' });
      return {
        success: false,
        error: { 
          message: error.response?.data?.description || error.message || 'Failed to get updates'
        }
      };
    }
  }
}

class TemplateProcessor {
  static processTemplate(template, data) {
    if (!template || typeof template !== 'string') {
      return template;
    }

    try {
      return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const value = this.getNestedValue(data, path.trim());
        return value !== undefined ? String(value) : match;
      });
    } catch (error) {
      logger.logError(error, {
        context: 'processTemplate',
        template: template,
        dataKeys: data ? Object.keys(data) : []
      });
      return template;
    }
  }

  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  static extractVariables(template) {
    if (!template || typeof template !== 'string') {
      return [];
    }

    const matches = template.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];

    return matches.map(match => match.replace(/[{}]/g, '').trim());
  }

  static validateTemplate(template, availableData) {
    const variables = this.extractVariables(template);
    const missing = [];

    variables.forEach(variable => {
      if (this.getNestedValue(availableData, variable) === undefined) {
        missing.push(variable);
      }
    });

    return {
      isValid: missing.length === 0,
      missingVariables: missing,
      foundVariables: variables.filter(v => !missing.includes(v))
    };
  }
}

module.exports = {
  TelegramAPI,
  TemplateProcessor,
  setTelegramWebhook,
  getWebhookInfo,
  deleteWebhook
};