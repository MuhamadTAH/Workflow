const { TelegramAPI } = require('./telegramAPI');
const db = require('../db');
const logger = require('./logger');

class TelegramMessageSync {
  constructor() {
    this.isPolling = false;
    this.pollInterval = null;
  }

  /**
   * Get the last processed update_id for a specific bot token
   */
  async getLastUpdateId(botToken) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT last_update_id FROM telegram_bot_updates WHERE bot_token = ?`,
        [botToken],
        (err, row) => {
          if (err) {
            logger.logError(err, { context: 'getLastUpdateId', botToken: 'present' });
            reject(err);
          } else {
            resolve(row ? row.last_update_id : 0);
          }
        }
      );
    });
  }

  /**
   * Update the last processed update_id for a specific bot token
   */
  async updateLastUpdateId(botToken, updateId) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO telegram_bot_updates (bot_token, last_update_id, updated_at) 
         VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [botToken, updateId],
        function(err) {
          if (err) {
            logger.logError(err, { context: 'updateLastUpdateId', botToken: 'present', updateId });
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  /**
   * Find or create conversation for a Telegram chat
   */
  async findOrCreateConversation(userId, telegramChatId, telegramUser) {
    return new Promise((resolve, reject) => {
      // First try to find existing conversation
      db.get(
        `SELECT id FROM telegram_conversations WHERE user_id = ? AND telegram_chat_id = ?`,
        [userId, telegramChatId],
        (err, row) => {
          if (err) {
            logger.logError(err, { context: 'findConversation', userId, telegramChatId });
            reject(err);
            return;
          }

          if (row) {
            resolve(row.id);
            return;
          }

          // Create new conversation if not found
          db.run(
            `INSERT INTO telegram_conversations 
             (user_id, telegram_chat_id, telegram_username, telegram_first_name, telegram_last_name, status)
             VALUES (?, ?, ?, ?, ?, 'automated')`,
            [userId, telegramChatId, telegramUser.username, telegramUser.first_name, telegramUser.last_name],
            function(err) {
              if (err) {
                logger.logError(err, { context: 'createConversation', userId, telegramChatId });
                reject(err);
              } else {
                resolve(this.lastID);
              }
            }
          );
        }
      );
    });
  }

  /**
   * Store a message in the database
   */
  async storeMessage(conversationId, message, senderType, senderName) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO telegram_messages 
         (conversation_id, sender_type, sender_name, message_text, telegram_message_id, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          conversationId,
          senderType,
          senderName,
          message.text || '[Non-text message]',
          message.message_id,
          new Date(message.date * 1000).toISOString()
        ],
        function(err) {
          if (err) {
            logger.logError(err, { 
              context: 'storeMessage', 
              conversationId, 
              messageId: message.message_id 
            });
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Get user ID from bot token (via social_connections table)
   */
  async getUserIdFromBotToken(botToken) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT user_id FROM social_connections 
         WHERE platform = 'telegram' AND access_token = ? AND is_active = 1`,
        [botToken],
        (err, row) => {
          if (err) {
            logger.logError(err, { context: 'getUserIdFromBotToken', botToken: 'present' });
            reject(err);
          } else {
            resolve(row ? row.user_id : null);
          }
        }
      );
    });
  }

  /**
   * Process updates from Telegram getUpdates API
   */
  async processUpdates(botToken, updates) {
    const userId = await this.getUserIdFromBotToken(botToken);
    if (!userId) {
      logger.warn('No user found for bot token', { botToken: 'present' });
      return { processed: 0, skipped: updates.length };
    }

    let processed = 0;
    let skipped = 0;

    for (const update of updates) {
      try {
        if (!update.message) {
          skipped++;
          continue;
        }

        const message = update.message;
        const telegramChatId = message.chat.id.toString();

        // Determine if this is an incoming or outgoing message
        const isOutgoing = message.from.is_bot === true;
        const senderType = isOutgoing ? 'agent' : 'user';
        const senderName = isOutgoing ? 'Bot' : 
          (message.from.first_name || message.from.username || 'User');

        // Find or create conversation
        const conversationId = await this.findOrCreateConversation(
          userId, 
          telegramChatId, 
          message.from
        );

        // Store the message
        await this.storeMessage(conversationId, message, senderType, senderName);

        // Update conversation's last message
        await this.updateConversationLastMessage(conversationId, message.text || '[Non-text message]');

        processed++;
        
        logger.debug('Message processed', {
          updateId: update.update_id,
          messageId: message.message_id,
          senderType,
          conversationId
        });

      } catch (error) {
        logger.logError(error, {
          context: 'processUpdate',
          updateId: update.update_id,
          messageId: update.message?.message_id
        });
        skipped++;
      }
    }

    return { processed, skipped };
  }

  /**
   * Update conversation's last message info
   */
  async updateConversationLastMessage(conversationId, messageText) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE telegram_conversations 
         SET last_message_text = ?, last_message_timestamp = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [messageText, conversationId],
        function(err) {
          if (err) {
            logger.logError(err, { context: 'updateConversationLastMessage', conversationId });
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  /**
   * Sync messages for a specific bot token
   */
  async syncMessages(botToken) {
    try {
      const telegramAPI = new TelegramAPI(botToken);
      
      // Get last processed update_id
      const lastUpdateId = await this.getLastUpdateId(botToken);
      
      // Get updates from Telegram
      const result = await telegramAPI.getUpdates({
        offset: lastUpdateId + 1,
        limit: 100,
        timeout: 10
      });

      if (!result.success) {
        logger.warn('Failed to get updates from Telegram', {
          error: result.error,
          botToken: 'present'
        });
        return { success: false, error: result.error };
      }

      const updates = result.data || [];
      
      if (updates.length === 0) {
        return { 
          success: true, 
          processed: 0, 
          skipped: 0, 
          message: 'No new updates' 
        };
      }

      // Process updates
      const { processed, skipped } = await this.processUpdates(botToken, updates);

      // Update last processed update_id
      if (updates.length > 0) {
        const maxUpdateId = Math.max(...updates.map(u => u.update_id));
        await this.updateLastUpdateId(botToken, maxUpdateId);
      }

      logger.info('Message sync completed', {
        botToken: 'present',
        totalUpdates: updates.length,
        processed,
        skipped,
        lastUpdateId: lastUpdateId + updates.length
      });

      return {
        success: true,
        processed,
        skipped,
        totalUpdates: updates.length,
        message: `Processed ${processed} messages, skipped ${skipped}`
      };

    } catch (error) {
      logger.logError(error, { 
        context: 'syncMessages', 
        botToken: 'present' 
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sync messages for all active bot connections
   */
  async syncAllBotMessages() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT DISTINCT access_token as bot_token, user_id 
         FROM social_connections 
         WHERE platform = 'telegram' AND is_active = 1 AND access_token IS NOT NULL`,
        [],
        async (err, rows) => {
          if (err) {
            logger.logError(err, { context: 'syncAllBotMessages' });
            reject(err);
            return;
          }

          const results = [];
          
          for (const row of rows) {
            try {
              const result = await this.syncMessages(row.bot_token);
              results.push({
                userId: row.user_id,
                botToken: 'present',
                ...result
              });
            } catch (error) {
              logger.logError(error, { 
                context: 'syncAllBotMessages', 
                userId: row.user_id 
              });
              results.push({
                userId: row.user_id,
                botToken: 'present',
                success: false,
                error: error.message
              });
            }
          }

          resolve(results);
        }
      );
    });
  }

  /**
   * Start automatic polling for all bots
   */
  startPolling(intervalMs = 30000) { // Poll every 30 seconds
    if (this.isPolling) {
      logger.warn('Telegram message polling is already running');
      return;
    }

    logger.info('Starting Telegram message polling', { intervalMs });
    this.isPolling = true;

    this.pollInterval = setInterval(async () => {
      try {
        await this.syncAllBotMessages();
      } catch (error) {
        logger.logError(error, { context: 'pollingInterval' });
      }
    }, intervalMs);
  }

  /**
   * Stop automatic polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    logger.info('Telegram message polling stopped');
  }
}

module.exports = TelegramMessageSync;