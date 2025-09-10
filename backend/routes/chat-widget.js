const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const chatWebSocket = require('../services/chatWebSocket');

// Store widget configurations
const widgetConfigs = new Map();
const chatSessions = new Map();

// Create new chat session
router.post('/session', async (req, res) => {
  try {
    const { widgetId } = req.body;
    
    if (!widgetId) {
      return res.status(400).json({
        success: false,
        error: 'Widget ID is required'
      });
    }

    // Generate session ID
    const sessionId = uuidv4();
    
    // Create session data
    const sessionData = {
      id: sessionId,
      widgetId,
      createdAt: new Date(),
      isActive: true,
      userInfo: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referer')
      }
    };

    chatSessions.set(sessionId, sessionData);

    res.json({
      success: true,
      sessionId,
      message: 'Chat session created successfully'
    });

  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create chat session'
    });
  }
});

// Get session info
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = chatSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Get WebSocket session data
    const wsSession = chatWebSocket.getSessionData(sessionId);

    res.json({
      success: true,
      session: {
        ...session,
        messages: wsSession ? wsSession.messages : []
      }
    });

  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session'
    });
  }
});

// Send message via REST (fallback if WebSocket fails)
router.post('/session/:sessionId/message', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, sender = 'user' } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const session = chatSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Try to send via WebSocket first
    const wsSession = chatWebSocket.getSessionData(sessionId);
    if (wsSession && wsSession.userSocket) {
      chatWebSocket.sendMessage(wsSession.userSocket, {
        type: 'message',
        message,
        sender,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Create or update widget configuration
router.post('/widget/config', async (req, res) => {
  try {
    const {
      name,
      primaryColor = '#007bff',
      position = 'bottom-right',
      welcomeMessage = 'Hello! How can we help you today?',
      placeholder = 'Type your message...',
      title = 'Chat with us',
      enabled = true
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Widget name is required'
      });
    }

    const widgetId = uuidv4();
    const config = {
      id: widgetId,
      name,
      primaryColor,
      position,
      welcomeMessage,
      placeholder,
      title,
      enabled,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    widgetConfigs.set(widgetId, config);

    res.json({
      success: true,
      widgetId,
      config,
      embedCode: generateEmbedCode(widgetId, config)
    });

  } catch (error) {
    console.error('Error creating widget config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create widget configuration'
    });
  }
});

// Get widget configuration
router.get('/widget/:widgetId/config', async (req, res) => {
  try {
    const { widgetId } = req.params;
    
    const config = widgetConfigs.get(widgetId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Widget configuration not found'
      });
    }

    res.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Error getting widget config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get widget configuration'
    });
  }
});

// Update widget configuration
router.put('/widget/:widgetId/config', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const updates = req.body;

    const config = widgetConfigs.get(widgetId);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Widget configuration not found'
      });
    }

    // Update config
    const updatedConfig = {
      ...config,
      ...updates,
      updatedAt: new Date()
    };

    widgetConfigs.set(widgetId, updatedConfig);

    res.json({
      success: true,
      config: updatedConfig,
      embedCode: generateEmbedCode(widgetId, updatedConfig)
    });

  } catch (error) {
    console.error('Error updating widget config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update widget configuration'
    });
  }
});

// Get all widgets
router.get('/widgets', async (req, res) => {
  try {
    const widgets = Array.from(widgetConfigs.values());
    
    res.json({
      success: true,
      widgets
    });

  } catch (error) {
    console.error('Error getting widgets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get widgets'
    });
  }
});

// Get all active sessions
router.get('/sessions', async (req, res) => {
  try {
    const sessions = chatWebSocket.getAllActiveSessions();
    
    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
});

// Get all messages from all sessions
router.get('/messages/all', async (req, res) => {
  try {
    const sessions = chatWebSocket.getAllActiveSessions();
    const allMessages = [];
    
    sessions.forEach(session => {
      if (session.messages && session.messages.length > 0) {
        session.messages.forEach(message => {
          allMessages.push({
            ...message,
            sessionId: session.id,
            widgetId: session.widgetId || 'unknown'
          });
        });
      }
    });

    // Sort by timestamp (newest first)
    allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      messages: allMessages
    });

  } catch (error) {
    console.error('Error getting all messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get messages'
    });
  }
});

// Delete widget
router.delete('/widget/:widgetId', async (req, res) => {
  try {
    const { widgetId } = req.params;
    
    if (widgetConfigs.has(widgetId)) {
      widgetConfigs.delete(widgetId);
      res.json({
        success: true,
        message: 'Widget deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Widget not found'
      });
    }

  } catch (error) {
    console.error('Error deleting widget:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete widget'
    });
  }
});

// Generate embed code for widget
function generateEmbedCode(widgetId, config) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const scriptTag = `<script>
(function() {
  var script = document.createElement('script');
  script.src = '${baseUrl}/widget.js';
  script.onload = function() {
    ChatWidget.init({
      widgetId: '${widgetId}',
      apiUrl: '${process.env.API_BASE_URL || 'https://workflow-lg9z.onrender.com'}',
      config: ${JSON.stringify(config)}
    });
  };
  document.head.appendChild(script);
})();
</script>`;

  const iframeTag = `<iframe 
  src="${baseUrl}/chat-widget/${widgetId}" 
  style="position: fixed; ${config.position.includes('bottom') ? 'bottom' : 'top'}: 20px; ${config.position.includes('right') ? 'right' : 'left'}: 20px; width: 350px; height: 500px; border: none; z-index: 9999;"
  frameborder="0">
</iframe>`;

  return {
    script: scriptTag,
    iframe: iframeTag
  };
}

module.exports = router;