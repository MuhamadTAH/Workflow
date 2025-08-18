const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../services/logger');
const { TelegramAPI } = require('../services/telegramAPI');
const { asyncHandler } = require('../middleware/errorHandler');

// Middleware to check authentication
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const token = authHeader.substring(7);
  const jwt = require('jsonwebtoken');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded; // Make consistent with connections middleware
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// Get all conversations for the authenticated user
router.get('/conversations', authenticateUser, asyncHandler(async (req, res) => {
  console.log('📞 Live chat: Getting conversations for user', req.user.userId);

  const sql = `
    SELECT 
      tc.*,
      tm.message_text as last_message,
      tm.timestamp as last_message_time
    FROM telegram_conversations tc
    LEFT JOIN telegram_messages tm ON tc.id = tm.conversation_id 
    AND tm.id = (
      SELECT MAX(id) FROM telegram_messages 
      WHERE conversation_id = tc.id
    )
    WHERE tc.user_id = ?
    ORDER BY COALESCE(tc.last_message_timestamp, tc.created_at) DESC
  `;

  db.all(sql, [req.user.userId], (err, conversations) => {
    if (err) {
      console.error('❌ Database error in get conversations:', err);
      logger.logError(err, { context: 'get_conversations', userId: req.user.userId });
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve conversations'
      });
    }

    console.log(`📞 Live chat: Found ${conversations.length} conversations for user ${req.user.userId}`);
    
    // Debug: Let's also check if there are ANY conversations in the table
    db.all('SELECT COUNT(*) as total FROM telegram_conversations', [], (countErr, countResult) => {
      if (countErr) {
        console.error('❌ Error counting total conversations:', countErr);
      } else {
        console.log(`📊 Total conversations in database: ${countResult[0]?.total || 0}`);
      }
    });

    res.json({
      success: true,
      conversations: conversations.map(conv => ({
        id: conv.id,
        telegramChatId: conv.telegram_chat_id,
        name: `${conv.telegram_first_name || ''} ${conv.telegram_last_name || ''}`.trim() || conv.telegram_username || `User ${conv.telegram_chat_id}`,
        username: conv.telegram_username,
        firstName: conv.telegram_first_name,
        lastName: conv.telegram_last_name,
        phone: conv.phone_number,
        status: conv.status,
        lastMessage: conv.last_message || conv.last_message_text,
        lastMessageTime: conv.last_message_time || conv.last_message_timestamp,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at
      }))
    });
  });
}));

// Get messages for a specific conversation
router.get('/conversations/:conversationId/messages', authenticateUser, asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  console.log('💬 Live chat: Getting messages for conversation', conversationId);

  // First verify the conversation belongs to the user
  const verifySql = `
    SELECT id FROM telegram_conversations 
    WHERE id = ? AND user_id = ?
  `;

  db.get(verifySql, [conversationId, req.user.userId], (err, conversation) => {
    if (err) {
      logger.logError(err, { context: 'verify_conversation', conversationId, userId: req.user.userId });
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Get messages for the conversation
    const messagesSql = `
      SELECT * FROM telegram_messages 
      WHERE conversation_id = ? 
      ORDER BY timestamp ASC
    `;

    db.all(messagesSql, [conversationId], (err, messages) => {
      if (err) {
        logger.logError(err, { context: 'get_messages', conversationId });
        return res.status(500).json({
          success: false,
          error: 'Failed to retrieve messages'
        });
      }

      console.log(`💬 Live chat: Found ${messages.length} messages for conversation ${conversationId}`);

      res.json({
        success: true,
        messages: messages.map(msg => ({
          id: msg.id,
          type: msg.sender_type,
          text: msg.message_text,
          sender: msg.sender_name,
          timestamp: msg.timestamp,
          telegramMessageId: msg.telegram_message_id,
          metadata: msg.metadata ? JSON.parse(msg.metadata) : null
        }))
      });
    });
  });
}));

// Send a message through Telegram
router.post('/conversations/:conversationId/send', authenticateUser, asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { message, botToken } = req.body;

  console.log('🔍 LIVE CHAT SEND DEBUG:', {
    conversationId,
    bodyKeys: Object.keys(req.body),
    message: message,
    botToken: botToken ? `${botToken.substring(0, 10)}...` : 'MISSING',
    bodyString: JSON.stringify(req.body)
  });

  if (!message || !message.trim()) {
    console.log('❌ Message validation failed: empty message');
    return res.status(400).json({
      success: false,
      error: 'Message text is required'
    });
  }

  if (!botToken) {
    console.log('❌ Bot token validation failed: missing bot token');
    return res.status(400).json({
      success: false,
      error: 'Bot token is required'
    });
  }

  console.log('📤 Live chat: Sending message to conversation', conversationId);

  // Get conversation details
  const conversationSql = `
    SELECT * FROM telegram_conversations 
    WHERE id = ? AND user_id = ?
  `;

  db.get(conversationSql, [conversationId, req.user.userId], async (err, conversation) => {
    if (err) {
      logger.logError(err, { context: 'get_conversation_for_send', conversationId });
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    try {
      // Send message through Telegram API
      const telegramAPI = new TelegramAPI(botToken);
      const result = await telegramAPI.sendMessage(conversation.telegram_chat_id, message.trim());

      if (!result.success) {
        logger.logError(new Error(result.error.message), { 
          context: 'telegram_send_message', 
          conversationId, 
          chatId: conversation.telegram_chat_id 
        });
        return res.status(400).json({
          success: false,
          error: 'Failed to send message: ' + result.error.message
        });
      }

      // Save the sent message to database
      const insertSql = `
        INSERT INTO telegram_messages 
        (conversation_id, sender_type, sender_name, message_text, telegram_message_id, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const metadata = JSON.stringify({
        agent_id: req.user.userId,
        telegram_response: result.data
      });

      db.run(insertSql, [
        conversationId,
        'agent',
        'Agent', // TODO: Get actual agent name from user table
        message.trim(),
        result.data.result.message_id,
        metadata
      ], function(err) {
        if (err) {
          logger.logError(err, { context: 'save_sent_message', conversationId });
          // Message was sent but not saved - this is not a critical error
          console.warn('⚠️  Message sent but failed to save to database');
        }

        // Update conversation status and last message
        const updateSql = `
          UPDATE telegram_conversations 
          SET status = 'human', 
              last_message_text = ?, 
              last_message_timestamp = CURRENT_TIMESTAMP,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        db.run(updateSql, [message.trim(), conversationId], (updateErr) => {
          if (updateErr) {
            logger.logError(updateErr, { context: 'update_conversation_after_send', conversationId });
          }
        });

        console.log('✅ Live chat: Message sent successfully');
        res.json({
          success: true,
          message: 'Message sent successfully',
          messageId: this.lastID,
          telegramMessageId: result.data.result.message_id
        });
      });

    } catch (error) {
      logger.logError(error, { context: 'send_telegram_message', conversationId });
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  });
}));

// Update conversation status (for human handover)
router.patch('/conversations/:conversationId/status', authenticateUser, asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { status } = req.body;

  const validStatuses = ['automated', 'human', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
    });
  }

  console.log('🔄 Live chat: Updating conversation status', { conversationId, status });

  const sql = `
    UPDATE telegram_conversations 
    SET status = ?, 
        assigned_agent_id = ?,
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND user_id = ?
  `;

  const agentId = status === 'human' ? req.user.userId : null;

  db.run(sql, [status, agentId, conversationId, req.user.userId], function(err) {
    if (err) {
      logger.logError(err, { context: 'update_conversation_status', conversationId, status });
      return res.status(500).json({
        success: false,
        error: 'Failed to update conversation status'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Add system message about status change
    const systemMessageSql = `
      INSERT INTO telegram_messages 
      (conversation_id, sender_type, sender_name, message_text, metadata)
      VALUES (?, ?, ?, ?, ?)
    `;

    const systemMessage = status === 'human' 
      ? 'Conversation was assigned to agent. Automations have been paused.'
      : status === 'automated'
      ? 'Conversation was returned to automation.'
      : 'Conversation was closed.';

    const metadata = JSON.stringify({
      agent_id: req.user.userId,
      previous_status: 'automated', // TODO: Get actual previous status
      new_status: status
    });

    db.run(systemMessageSql, [
      conversationId,
      'system',
      'System',
      systemMessage,
      metadata
    ], (systemErr) => {
      if (systemErr) {
        logger.logError(systemErr, { context: 'add_system_message', conversationId });
      }
    });

    console.log('✅ Live chat: Conversation status updated');
    res.json({
      success: true,
      message: 'Conversation status updated',
      status: status
    });
  });
}));

// DEBUG: Test endpoint to check database connection and tables
router.get('/debug/tables', authenticateUser, asyncHandler(async (req, res) => {
  console.log('🔧 DEBUG: Checking database tables...');
  
  try {
    // Check if tables exist
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
      if (err) {
        console.error('❌ Error checking tables:', err);
        return res.status(500).json({ success: false, error: err.message });
      }
      
      console.log('📋 Available tables:', tables.map(t => t.name));
      
      // Check telegram_conversations table structure
      db.all("PRAGMA table_info(telegram_conversations)", [], (pragmaErr, columns) => {
        if (pragmaErr) {
          console.error('❌ Error checking telegram_conversations structure:', pragmaErr);
          return res.json({
            success: true,
            tables: tables.map(t => t.name),
            error: 'Could not check telegram_conversations structure'
          });
        }
        
        console.log('📊 telegram_conversations columns:', columns);
        
        res.json({
          success: true,
          tables: tables.map(t => t.name),
          telegram_conversations_columns: columns,
          user_id: req.user.userId
        });
      });
    });
  } catch (error) {
    console.error('❌ DEBUG error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}));

// Create or update conversation from Telegram webhook data
router.post('/process-webhook', asyncHandler(async (req, res) => {
  const { update, userId, workflowId } = req.body;

  if (!update || !update.message || !userId) {
    return res.status(400).json({
      success: false,
      error: 'Invalid webhook data'
    });
  }

  const { message } = update;
  const { chat, from, text } = message;

  console.log('🔄 Live chat: Processing webhook for conversation management', { 
    chatId: chat.id, 
    userId, 
    workflowId 
  });

  // Create or update conversation
  const conversationSql = `
    INSERT INTO telegram_conversations 
    (user_id, telegram_chat_id, telegram_username, telegram_first_name, telegram_last_name, 
     last_message_text, last_message_timestamp, status)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'automated')
    ON CONFLICT(user_id, telegram_chat_id) DO UPDATE SET
      telegram_username = excluded.telegram_username,
      telegram_first_name = excluded.telegram_first_name,
      telegram_last_name = excluded.telegram_last_name,
      last_message_text = excluded.last_message_text,
      last_message_timestamp = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `;

  db.run(conversationSql, [
    userId,
    chat.id.toString(),
    from.username,
    from.first_name,
    from.last_name,
    text
  ], function(err) {
    if (err) {
      logger.logError(err, { context: 'create_update_conversation', chatId: chat.id, userId });
      return res.status(500).json({
        success: false,
        error: 'Failed to process conversation'
      });
    }

    const conversationId = this.lastID || this.changes;

    // Get the conversation ID if it was an update
    if (this.changes && !this.lastID) {
      const getIdSql = `
        SELECT id FROM telegram_conversations 
        WHERE user_id = ? AND telegram_chat_id = ?
      `;
      
      db.get(getIdSql, [userId, chat.id.toString()], (getErr, row) => {
        if (getErr) {
          logger.logError(getErr, { context: 'get_conversation_id', chatId: chat.id, userId });
          return res.status(500).json({
            success: false,
            error: 'Failed to get conversation ID'
          });
        }

        if (row) {
          saveMessage(row.id);
        }
      });
    } else {
      saveMessage(conversationId);
    }

    function saveMessage(convId) {
      // Save the message
      const messageSql = `
        INSERT INTO telegram_messages 
        (conversation_id, sender_type, sender_name, message_text, telegram_message_id, metadata)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const metadata = JSON.stringify({
        telegram_update: update,
        workflow_id: workflowId,
        processed_at: new Date().toISOString()
      });

      const senderName = from.first_name ? 
        `${from.first_name} ${from.last_name || ''}`.trim() : 
        (from.username || `User ${from.id}`);

      db.run(messageSql, [
        convId,
        'user',
        senderName,
        text,
        message.message_id,
        metadata
      ], (msgErr) => {
        if (msgErr) {
          logger.logError(msgErr, { context: 'save_telegram_message', conversationId: convId });
          return res.status(500).json({
            success: false,
            error: 'Failed to save message'
          });
        }

        console.log('✅ Live chat: Webhook processed and message saved');
        res.json({
          success: true,
          message: 'Webhook processed successfully',
          conversationId: convId
        });
      });
    }
  });
}));

module.exports = router;