const { Telegram } = require('telegram');
const { StringSession } = require('telegram/sessions');
const logger = require('./logger');

// Telegram API credentials - these need to be obtained from https://my.telegram.org
const API_ID = process.env.TELEGRAM_API_ID || '94575'; // Default test API ID
const API_HASH = process.env.TELEGRAM_API_HASH || 'a3406de8d171bb422bb6ddf3bbd800e2'; // Default test API hash

class TelegramClientService {
  constructor() {
    this.clients = new Map(); // Store client sessions by user ID
  }

  /**
   * Send verification code to phone number
   */
  async sendVerificationCode(phoneNumber) {
    try {
      logger.info('📱 Sending verification code to:', phoneNumber);
      
      // Create a new Telegram client
      const stringSession = new StringSession('');
      const client = new Telegram(stringSession, API_ID, API_HASH, {
        connectionRetries: 5,
      });

      await client.connect();
      
      // Send code request
      const result = await client.invoke({
        _: 'auth.sendCode',
        phoneNumber: phoneNumber,
        apiId: API_ID,
        apiHash: API_HASH,
        settings: {
          _: 'codeSettings',
          allowFlashcall: false,
          currentNumber: false,
          allowAppHash: false,
        },
      });

      // Store the phone code hash for verification
      const phoneCodeHash = result.phoneCodeHash;
      
      logger.info('✅ Verification code sent successfully', {
        phoneNumber,
        phoneCodeHash: phoneCodeHash.substring(0, 10) + '...' // Log partial hash for debugging
      });

      await client.disconnect();

      return {
        success: true,
        phoneCodeHash: phoneCodeHash,
        message: 'Verification code sent to your phone'
      };

    } catch (error) {
      logger.logError(error, { 
        context: 'sendVerificationCode', 
        phoneNumber 
      });

      return {
        success: false,
        error: error.message || 'Failed to send verification code'
      };
    }
  }

  /**
   * Verify code and create authenticated session
   */
  async verifyCodeAndConnect(phoneNumber, verificationCode, phoneCodeHash) {
    try {
      logger.info('🔐 Verifying code for:', phoneNumber);
      
      // Create a new client for authentication
      const stringSession = new StringSession('');
      const client = new Telegram(stringSession, API_ID, API_HASH, {
        connectionRetries: 5,
      });

      await client.connect();

      // Sign in with the verification code
      const result = await client.invoke({
        _: 'auth.signIn',
        phoneNumber: phoneNumber,
        phoneCodeHash: phoneCodeHash,
        phoneCode: verificationCode,
      });

      // Get the session string to store for future use
      const sessionString = client.session.save();
      
      // Get user information
      const me = await client.getMe();
      
      logger.info('✅ Telegram Client authenticated successfully', {
        phoneNumber,
        userId: me.id,
        username: me.username,
        firstName: me.firstName
      });

      await client.disconnect();

      return {
        success: true,
        sessionString: sessionString,
        userInfo: {
          id: me.id,
          username: me.username,
          firstName: me.firstName,
          lastName: me.lastName,
          phoneNumber: phoneNumber
        }
      };

    } catch (error) {
      logger.logError(error, { 
        context: 'verifyCodeAndConnect', 
        phoneNumber 
      });

      // Handle specific Telegram errors
      let errorMessage = 'Failed to verify code';
      if (error.message.includes('PHONE_CODE_INVALID')) {
        errorMessage = 'Invalid verification code';
      } else if (error.message.includes('PHONE_CODE_EXPIRED')) {
        errorMessage = 'Verification code has expired';
      } else if (error.message.includes('PHONE_NUMBER_INVALID')) {
        errorMessage = 'Invalid phone number';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get chat history for a specific chat using stored session
   */
  async getChatHistory(sessionString, chatId, limit = 100) {
    try {
      logger.info('📚 Getting chat history for chat:', chatId);
      
      // Create client with stored session
      const stringSession = new StringSession(sessionString);
      const client = new Telegram(stringSession, API_ID, API_HASH, {
        connectionRetries: 5,
      });

      await client.connect();

      // Get chat history
      const messages = await client.getMessages(chatId, {
        limit: limit,
      });

      await client.disconnect();

      logger.info('📚 Retrieved chat history', {
        chatId,
        messageCount: messages.length
      });

      return {
        success: true,
        messages: messages.map(msg => ({
          id: msg.id,
          text: msg.text,
          fromId: msg.fromId?.userId,
          date: msg.date,
          isOutgoing: msg.out,
          isBot: msg.fromId?.userId ? false : true // Will need to check against known bot IDs
        }))
      };

    } catch (error) {
      logger.logError(error, { 
        context: 'getChatHistory', 
        chatId 
      });

      return {
        success: false,
        error: error.message || 'Failed to get chat history'
      };
    }
  }

  /**
   * Get all dialogs (conversations) for the authenticated user
   */
  async getDialogs(sessionString, limit = 50) {
    try {
      logger.info('💬 Getting user dialogs');
      
      const stringSession = new StringSession(sessionString);
      const client = new Telegram(stringSession, API_ID, API_HASH, {
        connectionRetries: 5,
      });

      await client.connect();

      // Get dialogs
      const dialogs = await client.getDialogs({
        limit: limit,
      });

      await client.disconnect();

      logger.info('💬 Retrieved dialogs', {
        dialogCount: dialogs.length
      });

      return {
        success: true,
        dialogs: dialogs.map(dialog => ({
          id: dialog.id,
          title: dialog.title,
          isChannel: dialog.isChannel,
          isGroup: dialog.isGroup,
          isUser: dialog.isUser,
          lastMessage: dialog.message?.text,
          unreadCount: dialog.unreadCount
        }))
      };

    } catch (error) {
      logger.logError(error, { 
        context: 'getDialogs' 
      });

      return {
        success: false,
        error: error.message || 'Failed to get dialogs'
      };
    }
  }
}

module.exports = new TelegramClientService();