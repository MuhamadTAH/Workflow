const axios = require('axios');
const logger = require('./logger');

// Bot configuration - No default token, must be provided dynamically
// REMOVED: Hardcoded webhook URL that was overriding workflow-specific webhooks
// const webhookUrl = 'https://workflow-lg9z.onrender.com/api/webhooks/telegram';

// DEPRECATED: Legacy function that was setting hardcoded webhook URL
// This function is now disabled to prevent interference with workflow-specific webhooks
async function setTelegramWebhook(customWebhookUrl = null) {
  console.log('⚠️  setTelegramWebhook called but is now disabled to prevent webhook conflicts');
  console.log('📝 Webhook management is now handled by workflow activation system');
  if (customWebhookUrl) {
    console.log('📡 Custom webhook URL provided:', customWebhookUrl);
    console.log('💡 Use the workflow activation system or manual webhook update endpoints instead');
  }
  return { ok: false, description: 'Function disabled - use workflow activation system' };
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

// DISABLED: Direct webhook registration to prevent conflicts with workflow system
if (require.main === module) {
  console.log('⚠️  Direct Telegram webhook registration is now disabled');
  console.log('📝 Webhooks are automatically managed by the workflow activation system');
  console.log('💡 Activate a workflow with a Telegram trigger to set up webhooks');
  process.exit(0);
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
        timeout: 30000  // Increase timeout for getUpdates
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

  async sendPhoto(chatId, photo, options = {}) {
    try {
      const FormData = require('form-data');
      const fs = require('fs');
      
      const form = new FormData();
      form.append('chat_id', chatId);
      
      // Handle photo input (file path, URL, or Buffer)
      if (typeof photo === 'string') {
        if (photo.startsWith('http')) {
          // URL
          form.append('photo', photo);
        } else {
          // File path
          if (fs.existsSync(photo)) {
            form.append('photo', fs.createReadStream(photo));
          } else {
            throw new Error(`File not found: ${photo}`);
          }
        }
      } else if (Buffer.isBuffer(photo)) {
        form.append('photo', photo, 'image.jpg');
      } else {
        throw new Error('Invalid photo format. Use file path, URL, or Buffer.');
      }

      // Add optional parameters
      if (options.caption) form.append('caption', options.caption);
      if (options.parse_mode) form.append('parse_mode', options.parse_mode);
      if (options.disable_notification) form.append('disable_notification', options.disable_notification);
      if (options.reply_to_message_id) form.append('reply_to_message_id', options.reply_to_message_id);

      logger.debug('Sending Telegram photo', {
        chatId: chatId,
        photoType: typeof photo,
        caption: options.caption ? 'present' : 'none'
      });

      const response = await axios.post(`${this.baseURL}/sendPhoto`, form, {
        headers: form.getHeaders(),
        timeout: 30000
      });

      if (response.data && response.data.ok) {
        logger.info('Photo sent successfully', {
          chatId: chatId,
          messageId: response.data.result.message_id
        });
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: { message: response.data?.description || 'Failed to send photo' }
        };
      }
    } catch (error) {
      logger.logError(error, {
        context: 'sendPhoto',
        chatId: chatId
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.description || error.message || 'Photo sending failed'
        }
      };
    }
  }

  async sendDocument(chatId, document, options = {}) {
    try {
      const FormData = require('form-data');
      const fs = require('fs');
      const path = require('path');
      
      const form = new FormData();
      form.append('chat_id', chatId);
      
      // Handle document input (file path, URL, or Buffer)
      if (typeof document === 'string') {
        if (document.startsWith('http')) {
          // URL
          form.append('document', document);
        } else {
          // File path
          if (fs.existsSync(document)) {
            const filename = path.basename(document);
            form.append('document', fs.createReadStream(document), filename);
          } else {
            throw new Error(`File not found: ${document}`);
          }
        }
      } else if (Buffer.isBuffer(document)) {
        const filename = options.filename || 'document.pdf';
        form.append('document', document, filename);
      } else {
        throw new Error('Invalid document format. Use file path, URL, or Buffer.');
      }

      // Add optional parameters
      if (options.caption) form.append('caption', options.caption);
      if (options.parse_mode) form.append('parse_mode', options.parse_mode);
      if (options.disable_notification) form.append('disable_notification', options.disable_notification);
      if (options.reply_to_message_id) form.append('reply_to_message_id', options.reply_to_message_id);

      logger.debug('Sending Telegram document', {
        chatId: chatId,
        documentType: typeof document,
        caption: options.caption ? 'present' : 'none'
      });

      const response = await axios.post(`${this.baseURL}/sendDocument`, form, {
        headers: form.getHeaders(),
        timeout: 60000  // Longer timeout for file uploads
      });

      if (response.data && response.data.ok) {
        logger.info('Document sent successfully', {
          chatId: chatId,
          messageId: response.data.result.message_id
        });
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: { message: response.data?.description || 'Failed to send document' }
        };
      }
    } catch (error) {
      logger.logError(error, {
        context: 'sendDocument',
        chatId: chatId
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.description || error.message || 'Document sending failed'
        }
      };
    }
  }

  async sendVoice(chatId, voice, options = {}) {
    try {
      const FormData = require('form-data');
      const fs = require('fs');
      
      const form = new FormData();
      form.append('chat_id', chatId);
      
      // Handle voice input (file path, URL, or Buffer)
      if (typeof voice === 'string') {
        if (voice.startsWith('http')) {
          // URL
          form.append('voice', voice);
        } else {
          // File path
          if (fs.existsSync(voice)) {
            form.append('voice', fs.createReadStream(voice));
          } else {
            throw new Error(`File not found: ${voice}`);
          }
        }
      } else if (Buffer.isBuffer(voice)) {
        form.append('voice', voice, 'voice.ogg');
      } else {
        throw new Error('Invalid voice format. Use file path, URL, or Buffer.');
      }

      // Add optional parameters
      if (options.caption) form.append('caption', options.caption);
      if (options.parse_mode) form.append('parse_mode', options.parse_mode);
      if (options.duration) form.append('duration', options.duration);
      if (options.disable_notification) form.append('disable_notification', options.disable_notification);
      if (options.reply_to_message_id) form.append('reply_to_message_id', options.reply_to_message_id);

      logger.debug('Sending Telegram voice message', {
        chatId: chatId,
        voiceType: typeof voice,
        duration: options.duration || 'auto'
      });

      const response = await axios.post(`${this.baseURL}/sendVoice`, form, {
        headers: form.getHeaders(),
        timeout: 30000
      });

      if (response.data && response.data.ok) {
        logger.info('Voice message sent successfully', {
          chatId: chatId,
          messageId: response.data.result.message_id
        });
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: { message: response.data?.description || 'Failed to send voice message' }
        };
      }
    } catch (error) {
      logger.logError(error, {
        context: 'sendVoice',
        chatId: chatId
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.description || error.message || 'Voice message sending failed'
        }
      };
    }
  }

  async sendAudio(chatId, audio, options = {}) {
    try {
      const FormData = require('form-data');
      const fs = require('fs');
      const path = require('path');
      
      const form = new FormData();
      form.append('chat_id', chatId);
      
      // Handle audio input (file path, URL, or Buffer)
      if (typeof audio === 'string') {
        if (audio.startsWith('http')) {
          // URL
          form.append('audio', audio);
        } else {
          // File path
          if (fs.existsSync(audio)) {
            const filename = path.basename(audio);
            form.append('audio', fs.createReadStream(audio), filename);
          } else {
            throw new Error(`File not found: ${audio}`);
          }
        }
      } else if (Buffer.isBuffer(audio)) {
        const filename = options.filename || 'audio.mp3';
        form.append('audio', audio, filename);
      } else {
        throw new Error('Invalid audio format. Use file path, URL, or Buffer.');
      }

      // Add optional parameters
      if (options.caption) form.append('caption', options.caption);
      if (options.parse_mode) form.append('parse_mode', options.parse_mode);
      if (options.duration) form.append('duration', options.duration);
      if (options.performer) form.append('performer', options.performer);
      if (options.title) form.append('title', options.title);
      if (options.disable_notification) form.append('disable_notification', options.disable_notification);
      if (options.reply_to_message_id) form.append('reply_to_message_id', options.reply_to_message_id);

      logger.debug('Sending Telegram audio', {
        chatId: chatId,
        audioType: typeof audio,
        title: options.title || 'none'
      });

      const response = await axios.post(`${this.baseURL}/sendAudio`, form, {
        headers: form.getHeaders(),
        timeout: 60000  // Longer timeout for audio files
      });

      if (response.data && response.data.ok) {
        logger.info('Audio sent successfully', {
          chatId: chatId,
          messageId: response.data.result.message_id
        });
        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: { message: response.data?.description || 'Failed to send audio' }
        };
      }
    } catch (error) {
      logger.logError(error, {
        context: 'sendAudio',
        chatId: chatId
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.description || error.message || 'Audio sending failed'
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