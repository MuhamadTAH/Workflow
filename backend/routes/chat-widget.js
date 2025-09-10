const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../services/logger');
const ClaudeAI = require('../services/claudeAI');

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
  console.log('🔥 CHAT WIDGET MESSAGE ENDPOINT HIT - PRODUCTION CHECK');
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
    
    // Trigger AI auto-reply if enabled
    processAIReply(messageData);
    
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

// Send reply from dashboard
router.post('/reply', (req, res) => {
  try {
    const { widgetId, websiteUrl, message, senderName = 'Support Agent' } = req.body;
    
    if (!widgetId || !message) {
      return res.status(400).json({ error: 'Widget ID and message are required' });
    }
    
    // Create reply message data
    const messageData = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      sessionId: `dashboard_reply_${Date.now()}`,
      widgetId,
      message,
      senderName,
      senderEmail: null,
      websiteUrl: websiteUrl || 'Dashboard Reply',
      userAgent: 'Dashboard',
      referrer: 'Support Dashboard',
      timestamp: new Date().toISOString(),
      isRead: true,
      isReply: true // Mark as dashboard reply
    };
    
    // Store reply in database
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
          console.error('Error storing dashboard reply:', err);
          return res.status(500).json({ error: 'Failed to store reply' });
        } else {
          console.log('💬 DASHBOARD REPLY STORED:', messageData);
        }
      }
    );
    
    // Log reply
    logger.info('Dashboard reply sent', messageData);
    console.log('📤 DASHBOARD REPLY:', messageData);
    
    res.json({
      success: true,
      messageId: messageData.id,
      message: 'Reply sent successfully'
    });
    
  } catch (error) {
    logger.error('Error sending dashboard reply:', error);
    res.status(500).json({ error: 'Failed to send reply' });
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

// Initialize Claude AI (lazy initialization to avoid constructor errors)
let claudeAI = null;
const getClaudeAI = () => {
  if (!claudeAI) {
    claudeAI = new ClaudeAI();
  }
  return claudeAI;
};

// Store AI configuration in memory (in production, use database)
let aiConfigCache = {
  aiEnabled: false,
  autoReply: false,
  apiKey: '',
  systemPrompt: 'You are a helpful customer support assistant for a website chat widget. Respond professionally and helpfully to visitor questions.',
  knowledgeBase: '',
  responseDelay: 2000,
  model: 'claude-3-5-sonnet-20241022'
};

// Get AI configuration
router.get('/ai-config', async (req, res) => {
  try {
    console.log('🤖 Loading Chat Widget AI configuration...');
    
    // Return current config, but mask the API key for security
    const configToSend = {
      ...aiConfigCache,
      apiKey: aiConfigCache.apiKey ? '••••••••••••••••••••' + aiConfigCache.apiKey.slice(-4) : ''
    };

    res.json({
      success: true,
      config: configToSend
    });
  } catch (error) {
    console.error('Error loading AI config:', error);
    res.status(500).json({ success: false, error: 'Failed to load AI configuration' });
  }
});

// Save AI configuration
router.post('/ai-config', async (req, res) => {
  try {
    const config = req.body;
    console.log('🤖 Saving Chat Widget AI configuration...');
    
    // Update the cached configuration
    // Only update API key if a new one is provided (not masked)
    if (config.apiKey && !config.apiKey.includes('••••')) {
      aiConfigCache.apiKey = config.apiKey;
    }
    
    aiConfigCache.aiEnabled = config.aiEnabled;
    aiConfigCache.autoReply = config.autoReply;
    aiConfigCache.systemPrompt = config.systemPrompt;
    aiConfigCache.knowledgeBase = config.knowledgeBase;
    aiConfigCache.responseDelay = config.responseDelay;
    
    console.log('✅ AI configuration updated:', {
      aiEnabled: aiConfigCache.aiEnabled,
      autoReply: aiConfigCache.autoReply,
      hasApiKey: !!aiConfigCache.apiKey,
      systemPromptLength: aiConfigCache.systemPrompt.length,
      knowledgeBaseLength: aiConfigCache.knowledgeBase.length,
      responseDelay: aiConfigCache.responseDelay
    });
    
    res.json({
      success: true,
      message: 'AI configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving AI config:', error);
    res.status(500).json({ success: false, error: 'Failed to save AI configuration' });
  }
});

// Function to send message to Claude (same pattern as WhatsApp)
const sendMessageToClaude = async (messageText, systemPrompt = '', knowledgeBase = '', apiKey = null) => {
  try {
    console.log('🤖 Sending message to Claude AI:', messageText.substring(0, 50) + '...');
    
    const claudeApiKey = apiKey || aiConfigCache.apiKey || process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    
    if (!claudeApiKey) {
      throw new Error('Claude API key not configured');
    }

    // Combine system prompt with knowledge base
    let fullSystemPrompt = systemPrompt || aiConfigCache.systemPrompt;
    if (knowledgeBase && knowledgeBase.trim()) {
      fullSystemPrompt += `\n\nKnowledge Base:\n${knowledgeBase}`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: aiConfigCache.model || 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: fullSystemPrompt || 'You are a helpful customer support assistant for a website chat widget.',
        messages: [
          {
            role: 'user',
            content: messageText
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Claude API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const responseText = data.content?.[0]?.text;

    console.log('✅ Claude AI response received:', {
      responseLength: responseText?.length || 0,
      usage: data.usage
    });

    return {
      success: true,
      response: responseText || 'Sorry, I could not generate a response.',
      usage: data.usage
    };

  } catch (error) {
    console.error('❌ Error calling Claude API:', error.message);
    return {
      success: false,
      error: error.message,
      response: 'Sorry, I encountered an error processing your message.'
    };
  }
};

// AI Auto-reply functionality
async function processAIReply(messageData) {
  try {
    // Use the cached AI configuration
    if (!aiConfigCache.aiEnabled || !aiConfigCache.autoReply) {
      console.log('🤖 AI auto-reply skipped: AI disabled or auto-reply disabled');
      return;
    }

    if (!aiConfigCache.apiKey && !process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_API_KEY) {
      console.log('🤖 AI auto-reply skipped: No API key configured');
      return;
    }

    // Add delay before responding
    setTimeout(async () => {
      try {
        console.log('🤖 Generating AI reply for message:', messageData.message);
        
        // Generate AI response using same pattern as WhatsApp
        const claudeResult = await sendMessageToClaude(
          messageData.message,
          aiConfigCache.systemPrompt,
          aiConfigCache.knowledgeBase,
          aiConfigCache.apiKey
        );

        if (claudeResult && claudeResult.success) {
          console.log('✅ Claude response received:', claudeResult.response.substring(0, 100) + '...');
          console.log('💰 Token usage:', claudeResult.usage);
          
          // Create AI reply message
          const aiReplyData = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substring(2)}`,
            sessionId: `ai_reply_${Date.now()}`,
            widgetId: messageData.widgetId,
            message: claudeResult.response,
            senderName: 'AI Assistant',
            senderEmail: null,
            websiteUrl: messageData.websiteUrl || 'AI Reply',
            userAgent: 'AI Assistant',
            referrer: 'Auto Reply System',
            timestamp: new Date().toISOString(),
            isRead: true,
            isAIReply: true
          };

          // Store AI reply in database
          db.run(
            `INSERT OR IGNORE INTO chat_widget_messages 
             (id, session_id, widget_id, message, sender_name, sender_email, website_url, user_agent, referrer, timestamp, is_read)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              aiReplyData.id,
              aiReplyData.sessionId,
              aiReplyData.widgetId,
              aiReplyData.message,
              aiReplyData.senderName,
              aiReplyData.senderEmail,
              aiReplyData.websiteUrl,
              aiReplyData.userAgent,
              aiReplyData.referrer,
              aiReplyData.timestamp,
              aiReplyData.isRead ? 1 : 0
            ],
            function(err) {
              if (err) {
                console.error('❌ Error storing AI reply:', err);
              } else {
                console.log('🤖 AI REPLY STORED:', aiReplyData);
                logger.info('AI reply generated and stored', aiReplyData);
              }
            }
          );
        } else {
          console.log('❌ No response from Claude AI');
        }
      } catch (error) {
        console.error('Error generating AI reply:', error);
        logger.error('AI reply generation failed:', error);
      }
    }, aiConfigCache.responseDelay);

  } catch (error) {
    console.error('Error in AI reply processing:', error);
  }
}

// Claude connection test endpoint (same pattern as WhatsApp)
router.post('/claude/connect', async (req, res) => {
  try {
    const { claudeApiKey, systemPrompt } = req.body;
    
    if (!claudeApiKey) {
      return res.status(400).json({ success: false, error: 'Claude API key is required' });
    }
    
    console.log('🤖 Testing Claude API connection...');
    
    // Test the API key by sending a simple message
    const testResult = await sendMessageToClaude(
      'Hello, this is a connection test.',
      systemPrompt || 'Respond with just "Connection successful"',
      '',
      claudeApiKey
    );
    
    if (testResult.success) {
      // Update the cached configuration with the new API key
      aiConfigCache.apiKey = claudeApiKey;
      if (systemPrompt) {
        aiConfigCache.systemPrompt = systemPrompt;
      }
      
      console.log('✅ Claude API connection successful');
      
      res.json({
        success: true,
        message: 'Claude API connected successfully',
        status: '✅ Connected and ready for auto-replies',
        testResponse: testResult.response
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Claude API connection failed: ${testResult.error}`,
        status: '❌ Connection failed'
      });
    }
  } catch (error) {
    console.error('Error testing Claude connection:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test Claude connection',
      details: error.message
    });
  }
});

// AI test endpoint
router.post('/ai-test', async (req, res) => {
  try {
    const { message } = req.body;
    console.log('🧪 Testing Chat Widget AI with message:', message);
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Test message is required' });
    }
    
    // Test AI response using current configuration
    const testResult = await sendMessageToClaude(
      message,
      aiConfigCache.systemPrompt,
      aiConfigCache.knowledgeBase,
      aiConfigCache.apiKey
    );
    
    if (testResult.success) {
      res.json({
        success: true,
        response: testResult.response,
        usage: testResult.usage,
        config: {
          aiEnabled: aiConfigCache.aiEnabled,
          autoReply: aiConfigCache.autoReply,
          hasApiKey: !!aiConfigCache.apiKey,
          model: aiConfigCache.model
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: testResult.error,
        response: testResult.response
      });
    }
  } catch (error) {
    console.error('Error testing AI:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to test AI',
      details: error.message
    });
  }
});

module.exports = router;