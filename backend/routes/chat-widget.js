const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../services/logger');

// Store for active chat widget sessions (in production, use Redis or database)
const activeSessions = new Map();

// Activate a chat widget (when embedded code loads on a website)
router.post('/activate', (req, res) => {
  try {
    const { widgetId, websiteUrl, userAgent, referrer } = req.body;
    
    if (!widgetId) {
      return res.status(400).json({ error: 'Widget ID is required' });
    }
    
    // Generate a unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    // Store session info
    const sessionData = {
      sessionId,
      widgetId,
      websiteUrl: websiteUrl || 'Unknown',
      userAgent: userAgent || 'Unknown',
      referrer: referrer || 'Direct',
      activatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true
    };
    
    activeSessions.set(sessionId, sessionData);
    
    // Log widget activation
    logger.info('Chat widget activated', { sessionId, widgetId, websiteUrl });
    console.log('💬 WIDGET ACTIVATED:', sessionData);
    
    res.json({
      success: true,
      sessionId,
      message: 'Widget activated successfully'
    });
    
  } catch (error) {
    logger.error('Error activating chat widget:', error);
    res.status(500).json({ error: 'Failed to activate widget' });
  }
});

// Send a message from the chat widget
router.post('/message', (req, res) => {
  try {
    const { sessionId, widgetId, message, senderName, senderEmail } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }
    
    // Get session info
    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Update session activity
    session.lastActivity = new Date().toISOString();
    activeSessions.set(sessionId, session);
    
    // Create message data
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      sessionId,
      widgetId: widgetId || session.widgetId,
      message,
      senderName: senderName || 'Website Visitor',
      senderEmail: senderEmail || null,
      websiteUrl: session.websiteUrl,
      userAgent: session.userAgent,
      referrer: session.referrer,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    // Store message in database
    db.run(
      `INSERT OR IGNORE INTO chat_widget_messages 
       (id, session_id, widget_id, message, sender_name, sender_email, website_url, user_agent, referrer, timestamp, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        messageData.id,
        messageData.sessionId,
        messageData.widgetId,
        messageData.message,
        messageData.senderName,
        messageData.senderEmail,
        messageData.websiteUrl,
        messageData.userAgent,
        messageData.referrer,
        messageData.timestamp,
        messageData.isRead ? 1 : 0
      ],
      function(err) {
        if (err) {
          console.error('Error storing chat widget message:', err);
        } else {
          console.log('💬 WIDGET MESSAGE STORED:', messageData);
        }
      }
    );
    
    // Log message
    logger.info('Chat widget message received', messageData);
    console.log('📨 WIDGET MESSAGE:', messageData);
    
    res.json({
      success: true,
      messageId: messageData.id,
      message: 'Message received successfully'
    });
    
  } catch (error) {
    logger.error('Error processing chat widget message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get messages for dashboard display
router.get('/messages', (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    db.all(
      `SELECT * FROM chat_widget_messages 
       ORDER BY timestamp DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)],
      (err, messages) => {
        if (err) {
          console.error('Error fetching chat widget messages:', err);
          return res.status(500).json({ error: 'Failed to fetch messages' });
        }
        
        // Convert database format to frontend format
        const formattedMessages = messages.map(msg => ({
          id: msg.id,
          sessionId: msg.session_id,
          widgetId: msg.widget_id,
          message: msg.message,
          senderName: msg.sender_name,
          senderEmail: msg.sender_email,
          websiteUrl: msg.website_url,
          userAgent: msg.user_agent,
          referrer: msg.referrer,
          timestamp: msg.timestamp,
          isRead: msg.is_read === 1
        }));
        
        res.json({
          success: true,
          messages: formattedMessages,
          count: formattedMessages.length
        });
      }
    );
    
  } catch (error) {
    logger.error('Error fetching chat widget messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get active sessions for dashboard display
router.get('/sessions', (req, res) => {
  try {
    const sessions = Array.from(activeSessions.values())
      .filter(session => session.isActive)
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
    
    res.json({
      success: true,
      sessions,
      count: sessions.length
    });
    
  } catch (error) {
    logger.error('Error fetching chat widget sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Mark messages as read
router.post('/mark-read', (req, res) => {
  try {
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: 'Message IDs array is required' });
    }
    
    const placeholders = messageIds.map(() => '?').join(',');
    
    db.run(
      `UPDATE chat_widget_messages SET is_read = 1 WHERE id IN (${placeholders})`,
      messageIds,
      function(err) {
        if (err) {
          console.error('Error marking messages as read:', err);
          return res.status(500).json({ error: 'Failed to mark messages as read' });
        }
        
        res.json({
          success: true,
          updatedCount: this.changes,
          message: 'Messages marked as read'
        });
      }
    );
    
  } catch (error) {
    logger.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Clean up inactive sessions (called periodically)
router.post('/cleanup-sessions', (req, res) => {
  try {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    
    let cleanedCount = 0;
    
    for (const [sessionId, session] of activeSessions.entries()) {
      const lastActivity = new Date(session.lastActivity);
      if (now - lastActivity > inactiveThreshold) {
        activeSessions.delete(sessionId);
        cleanedCount++;
      }
    }
    
    console.log(`🧹 Cleaned up ${cleanedCount} inactive chat widget sessions`);
    
    res.json({
      success: true,
      cleanedCount,
      remainingCount: activeSessions.size
    });
    
  } catch (error) {
    logger.error('Error cleaning up chat widget sessions:', error);
    res.status(500).json({ error: 'Failed to cleanup sessions' });
  }
});

module.exports = router;