const WebSocket = require('ws');
const http = require('http');

class ChatWebSocketServer {
  constructor() {
    this.sessions = new Map();
    this.agents = new Map();
    this.wss = null;
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ 
      server
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    console.log('Chat WebSocket server initialized');
  }

  handleConnection(ws, req) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      ws.close(1008, 'Session ID required');
      return;
    }

    console.log(`New WebSocket connection for session: ${sessionId}`);

    // Store session connection
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        id: sessionId,
        userSocket: null,
        agentSocket: null,
        messages: [],
        createdAt: new Date(),
        isActive: true
      });
    }

    const session = this.sessions.get(sessionId);

    // Determine if this is a user or agent connection
    const isAgent = url.searchParams.get('type') === 'agent';
    
    if (isAgent) {
      // Agent connection - no specific session
      this.agents.set(ws, true);
      ws.isAgent = true;
      ws.sessionId = 'agent';
      
      this.sendMessage(ws, {
        type: 'connected',
        message: 'Agent connected to chat system',
        timestamp: new Date()
      });
      return;
    }
    
    session.userSocket = ws;
    ws.sessionId = sessionId;
    ws.isAgent = false;

    // Handle incoming messages
    ws.on('message', (data) => {
      this.handleMessage(ws, data);
    });

    // Handle connection close
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    // Send connection confirmation
    this.sendMessage(ws, {
      type: 'connected',
      sessionId: sessionId,
      timestamp: new Date()
    });
  }

  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      const session = this.sessions.get(ws.sessionId);

      if (!session) return;

      switch (message.type) {
        case 'message':
          this.handleChatMessage(ws, message, session);
          break;
        case 'typing':
          this.handleTypingIndicator(ws, message, session);
          break;
        case 'agent_join':
          this.handleAgentJoin(ws, session);
          break;
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  handleChatMessage(ws, message, session) {
    const chatMessage = {
      id: Date.now() + Math.random(),
      text: message.message,
      sender: ws.isAgent ? 'agent' : 'user',
      timestamp: new Date(),
      sessionId: ws.sessionId
    };

    // Store message in session
    session.messages.push(chatMessage);

    // Forward to the other party
    if (ws.isAgent && session.userSocket) {
      this.sendMessage(session.userSocket, {
        type: 'message',
        message: chatMessage.text,
        sender: 'agent',
        timestamp: chatMessage.timestamp
      });
    } else if (!ws.isAgent && session.agentSocket) {
      this.sendMessage(session.agentSocket, {
        type: 'message',
        message: chatMessage.text,
        sender: 'user',
        timestamp: chatMessage.timestamp,
        sessionId: ws.sessionId
      });
    } else if (!ws.isAgent && !session.agentSocket) {
      // No agent available, could trigger AI response here
      this.handleAIResponse(session, chatMessage);
    }

    // Notify all connected agents about new message
    this.notifyAgents(chatMessage);
  }

  handleTypingIndicator(ws, message, session) {
    const targetSocket = ws.isAgent ? session.userSocket : session.agentSocket;
    
    if (targetSocket) {
      this.sendMessage(targetSocket, {
        type: 'typing',
        isTyping: message.isTyping
      });
    }
  }

  handleAgentJoin(ws, session) {
    session.agentSocket = ws;
    
    // Send chat history to agent
    this.sendMessage(ws, {
      type: 'chat_history',
      messages: session.messages,
      sessionId: session.id
    });

    // Notify user that agent joined
    if (session.userSocket) {
      this.sendMessage(session.userSocket, {
        type: 'agent_joined',
        message: 'An agent has joined the chat'
      });
    }
  }

  async handleAIResponse(session, userMessage) {
    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + Math.random(),
        text: "Thank you for your message. An agent will be with you shortly.",
        sender: 'bot',
        timestamp: new Date(),
        sessionId: session.id
      };

      session.messages.push(aiResponse);

      if (session.userSocket) {
        this.sendMessage(session.userSocket, {
          type: 'message',
          message: aiResponse.text,
          sender: 'bot',
          timestamp: aiResponse.timestamp
        });
      }
    }, 1000);
  }

  handleDisconnection(ws) {
    if (ws.isAgent && ws.sessionId === 'agent') {
      // Remove from agents map
      this.agents.delete(ws);
      console.log('Agent disconnected from chat system');
      return;
    }

    const session = this.sessions.get(ws.sessionId);
    if (!session) return;

    if (ws.isAgent) {
      session.agentSocket = null;
      // Notify user that agent left
      if (session.userSocket) {
        this.sendMessage(session.userSocket, {
          type: 'agent_left',
          message: 'Agent has disconnected'
        });
      }
    } else {
      session.userSocket = null;
    }

    // Clean up empty sessions after 1 hour
    if (!session.userSocket && !session.agentSocket) {
      setTimeout(() => {
        this.sessions.delete(ws.sessionId);
      }, 3600000);
    }

    console.log(`WebSocket disconnected for session: ${ws.sessionId}`);
  }

  sendMessage(ws, message) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  notifyAgents(message) {
    // Notify all connected agents about new messages
    this.agents.forEach((agentWs) => {
      if (agentWs.readyState === WebSocket.OPEN) {
        this.sendMessage(agentWs, {
          type: 'new_message_notification',
          sessionId: message.sessionId,
          message: message.text,
          sender: message.sender,
          timestamp: message.timestamp
        });
      }
    });
  }

  getSessionData(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  getAllActiveSessions() {
    return Array.from(this.sessions.values()).filter(session => session.isActive);
  }

  closeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      
      if (session.userSocket) {
        session.userSocket.close();
      }
      
      if (session.agentSocket) {
        session.agentSocket.close();
      }
      
      this.sessions.delete(sessionId);
    }
  }
}

module.exports = new ChatWebSocketServer();