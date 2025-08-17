/*
=================================================================
BACKEND FILE: backend/services/chatMessageStorage.js
=================================================================
Database service for Chat Trigger message storage and retrieval
*/

const db = require('../db');
const logger = require('./logger');

class ChatMessageStorage {
  
  // Create or update a chat session
  async createOrUpdateSession(sessionId, title = 'Chat Support', welcomeMessage = '👋 Welcome! Send a message to start the conversation.', workflowId = null) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO chat_sessions 
        (session_id, workflow_id, title, welcome_message, is_active, last_activity)
        VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `;
      
      db.run(query, [sessionId, workflowId, title, welcomeMessage], function(err) {
        if (err) {
          logger.error('Failed to create/update chat session:', { sessionId, error: err });
          reject(err);
        } else {
          logger.info('Chat session created/updated:', { sessionId, title });
          resolve({ sessionId, title, welcomeMessage });
        }
      });
    });
  }

  // Store a new chat message
  async storeMessage(sessionId, messageText, senderType = 'user', userData = null, responseData = null) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO chat_messages 
        (session_id, message_text, sender_type, user_data, response_data, timestamp)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      const userDataJson = userData ? JSON.stringify(userData) : null;
      const responseDataJson = responseData ? JSON.stringify(responseData) : null;
      
      db.run(query, [sessionId, messageText, senderType, userDataJson, responseDataJson], function(err) {
        if (err) {
          logger.error('Failed to store chat message:', { sessionId, senderType, error: err });
          reject(err);
        } else {
          logger.info('Chat message stored:', { 
            messageId: this.lastID, 
            sessionId, 
            senderType,
            messageLength: messageText.length 
          });
          
          // Update session last activity
          db.run('UPDATE chat_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = ?', [sessionId]);
          
          resolve({
            id: this.lastID,
            sessionId,
            messageText,
            senderType,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  // Get all unprocessed messages for a session
  async getUnprocessedMessages(sessionId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, message_text, sender_type, timestamp, user_data, response_data
        FROM chat_messages 
        WHERE session_id = ? AND is_processed = 0
        ORDER BY timestamp ASC
      `;
      
      db.all(query, [sessionId], (err, rows) => {
        if (err) {
          logger.error('Failed to get unprocessed messages:', { sessionId, error: err });
          reject(err);
        } else {
          const messages = rows.map(row => ({
            id: row.id,
            text: row.message_text,
            sender: row.sender_type,
            timestamp: row.timestamp,
            sessionId: sessionId,
            metadata: row.user_data ? JSON.parse(row.user_data) : {},
            responseData: row.response_data ? JSON.parse(row.response_data) : null
          }));
          
          logger.info('Retrieved unprocessed messages:', { 
            sessionId, 
            messageCount: messages.length 
          });
          resolve(messages);
        }
      });
    });
  }

  // Get all messages for a session (processed and unprocessed)
  async getAllMessages(sessionId, limit = 50) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, message_text, sender_type, timestamp, is_processed, user_data, response_data
        FROM chat_messages 
        WHERE session_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `;
      
      db.all(query, [sessionId, limit], (err, rows) => {
        if (err) {
          logger.error('Failed to get all messages:', { sessionId, error: err });
          reject(err);
        } else {
          const messages = rows.map(row => ({
            id: row.id,
            text: row.message_text,
            sender: row.sender_type,
            timestamp: row.timestamp,
            isProcessed: row.is_processed === 1,
            sessionId: sessionId,
            metadata: row.user_data ? JSON.parse(row.user_data) : {},
            responseData: row.response_data ? JSON.parse(row.response_data) : null
          })).reverse(); // Reverse to show oldest first
          
          logger.info('Retrieved all messages:', { 
            sessionId, 
            messageCount: messages.length 
          });
          resolve(messages);
        }
      });
    });
  }

  // Mark messages as processed
  async markMessagesProcessed(messageIds) {
    if (!messageIds || messageIds.length === 0) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const placeholders = messageIds.map(() => '?').join(',');
      const query = `
        UPDATE chat_messages 
        SET is_processed = 1 
        WHERE id IN (${placeholders})
      `;
      
      db.run(query, messageIds, function(err) {
        if (err) {
          logger.error('Failed to mark messages as processed:', { messageIds, error: err });
          reject(err);
        } else {
          logger.info('Messages marked as processed:', { 
            messageIds, 
            changedRows: this.changes 
          });
          resolve(this.changes);
        }
      });
    });
  }

  // Get session info
  async getSession(sessionId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT session_id, workflow_id, title, welcome_message, is_active, 
               created_at, last_activity
        FROM chat_sessions 
        WHERE session_id = ?
      `;
      
      db.get(query, [sessionId], (err, row) => {
        if (err) {
          logger.error('Failed to get session:', { sessionId, error: err });
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          resolve({
            sessionId: row.session_id,
            workflowId: row.workflow_id,
            title: row.title,
            welcomeMessage: row.welcome_message,
            isActive: row.is_active === 1,
            createdAt: row.created_at,
            lastActivity: row.last_activity
          });
        }
      });
    });
  }

  // Get message count for a session
  async getMessageCount(sessionId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN is_processed = 0 THEN 1 ELSE 0 END) as unprocessed
        FROM chat_messages 
        WHERE session_id = ?
      `;
      
      db.get(query, [sessionId], (err, row) => {
        if (err) {
          logger.error('Failed to get message count:', { sessionId, error: err });
          reject(err);
        } else {
          resolve({
            total: row.total || 0,
            unprocessed: row.unprocessed || 0
          });
        }
      });
    });
  }

  // Clean up old processed messages (optional maintenance)
  async cleanupOldMessages(daysOld = 30) {
    return new Promise((resolve, reject) => {
      const query = `
        DELETE FROM chat_messages 
        WHERE is_processed = 1 
        AND datetime(timestamp) < datetime('now', '-${daysOld} days')
      `;
      
      db.run(query, function(err) {
        if (err) {
          logger.error('Failed to cleanup old messages:', { daysOld, error: err });
          reject(err);
        } else {
          logger.info('Cleaned up old messages:', { 
            daysOld, 
            deletedCount: this.changes 
          });
          resolve(this.changes);
        }
      });
    });
  }
}

// Export singleton instance
module.exports = new ChatMessageStorage();