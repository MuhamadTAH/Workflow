const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../services/logger');

// GET /api/chat-messages/:sessionId - Get chat messages for a session
router.get('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get or create chat session
    db.get('SELECT * FROM chat_sessions WHERE session_id = ?', [sessionId], (err, session) => {
      if (err) {
        logger.error('Database error getting chat session:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!session) {
        // Create new session
        db.run(
          'INSERT INTO chat_sessions (session_id, title, is_active) VALUES (?, ?, ?)',
          [sessionId, 'Chat Support', 1],
          function(err) {
            if (err) {
              logger.error('Error creating chat session:', err);
              return res.status(500).json({ error: 'Failed to create session' });
            }
            
            logger.info('Chat session created/updated:', { sessionId, title: 'Chat Support' });
          }
        );
      }
      
      // Get unprocessed messages for this session
      db.all(
        'SELECT * FROM chat_messages WHERE session_id = ? AND is_processed = 0 ORDER BY timestamp ASC',
        [sessionId],
        (err, messages) => {
          if (err) {
            logger.error('Database error getting messages:', err);
            return res.status(500).json({ error: 'Database error' });
          }
          
          logger.info('Retrieved unprocessed messages:', { sessionId, messageCount: messages.length });
          
          // Log for debugging (matching the format in data.md)
          console.log(`[chat] Session ${sessionId}: ${messages.length} messages, workflow active: ${session?.workflow_id || null}`);
          
          res.json({
            success: true,
            sessionId: sessionId,
            messages: messages || [],
            session: session,
            messageCount: messages.length
          });
        }
      );
    });
    
  } catch (error) {
    logger.error('Chat messages error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// POST /api/chat-messages/:sessionId - Send a message to chat session
router.post('/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, senderType = 'user' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Insert message into database
    db.run(
      'INSERT INTO chat_messages (session_id, message_text, sender_type, is_processed) VALUES (?, ?, ?, ?)',
      [sessionId, message, senderType, 0],
      function(err) {
        if (err) {
          logger.error('Error saving chat message:', err);
          return res.status(500).json({ error: 'Failed to save message' });
        }
        
        logger.info('Chat message saved:', { 
          sessionId, 
          messageId: this.lastID,
          senderType,
          messageLength: message.length 
        });
        
        res.json({
          success: true,
          messageId: this.lastID,
          sessionId: sessionId,
          message: 'Message saved successfully'
        });
      }
    );
    
  } catch (error) {
    logger.error('Chat message post error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;