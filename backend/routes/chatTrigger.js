const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../services/logger');

// Database setup
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize chat trigger tables
db.serialize(() => {
  // Chat trigger sessions table
  db.run(`CREATE TABLE IF NOT EXISTS chat_trigger_sessions (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    workflow_id TEXT NOT NULL,
    session_name TEXT NOT NULL,
    welcome_message TEXT DEFAULT '👋 Welcome! How can I help you today?',
    allow_file_uploads BOOLEAN DEFAULT 0,
    allowed_file_types TEXT DEFAULT '*',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Chat trigger messages table
  db.run(`CREATE TABLE IF NOT EXISTS chat_trigger_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    sender_name TEXT,
    message_text TEXT NOT NULL,
    file_url TEXT,
    file_type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT,
    FOREIGN KEY (session_id) REFERENCES chat_trigger_sessions(id)
  )`);
});

// POST /api/chat-trigger/register - Register a chat trigger node
router.post('/register', async (req, res) => {
  try {
    const { nodeId, workflowId, config } = req.body;
    
    if (!nodeId || !workflowId || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: nodeId, workflowId, config'
      });
    }

    const sessionId = `chat_${nodeId}_${Date.now()}`;
    
    db.run(
      `INSERT OR REPLACE INTO chat_trigger_sessions 
       (id, node_id, workflow_id, session_name, welcome_message, allow_file_uploads, allowed_file_types, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        nodeId,
        workflowId,
        config.chatSessionName || 'My Chat Bot',
        config.welcomeMessage || '👋 Welcome! How can I help you today?',
        config.allowFileUploads ? 1 : 0,
        config.allowedFileTypes || '*',
        1
      ],
      function(err) {
        if (err) {
          logger.logError(err, { context: 'registerChatTriggerSession', nodeId, workflowId });
          return res.status(500).json({ success: false, error: 'Database error' });
        }

        logger.info('Chat trigger session registered', { 
          sessionId, 
          nodeId, 
          workflowId,
          sessionName: config.chatSessionName 
        });

        res.json({
          success: true,
          sessionId,
          chatUrl: `/api/chat/${nodeId}`,
          message: 'Chat trigger registered successfully'
        });
      }
    );

  } catch (error) {
    logger.logError(error, { context: 'registerChatTrigger' });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/chat-trigger/:nodeId - Serve chat interface
router.get('/:nodeId', async (req, res) => {
  try {
    const nodeId = req.params.nodeId;
    
    // Get chat session info
    db.get(
      'SELECT * FROM chat_trigger_sessions WHERE node_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1',
      [nodeId],
      (err, session) => {
        if (err) {
          logger.logError(err, { context: 'getChatTriggerSession', nodeId });
          return res.status(500).send('Database error');
        }

        if (!session) {
          return res.status(404).send(`
            <html>
              <head><title>Chat Not Found</title></head>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1>Chat Session Not Found</h1>
                <p>No active chat session found for this URL.</p>
                <p>Please make sure the workflow is activated with a Chat Trigger node.</p>
              </body>
            </html>
          `);
        }

        // Serve the chat interface HTML
        const chatHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${session.session_name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .chat-container {
            width: 400px;
            height: 600px;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .chat-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .chat-header h1 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        
        .chat-header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .message {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            line-height: 1.4;
            word-wrap: break-word;
        }
        
        .message.user {
            background: #007AFF;
            color: white;
            align-self: flex-end;
        }
        
        .message.bot {
            background: #F0F0F0;
            color: #333;
            align-self: flex-start;
        }
        
        .message.system {
            background: #FFE4B5;
            color: #8B4513;
            align-self: center;
            font-size: 14px;
            font-style: italic;
        }
        
        .chat-input-area {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 25px;
            outline: none;
            font-size: 14px;
        }
        
        .chat-input:focus {
            border-color: #007AFF;
        }
        
        .send-button {
            background: #007AFF;
            color: white;
            border: none;
            border-radius: 50%;
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .send-button:hover {
            background: #0056CC;
            transform: scale(1.05);
        }
        
        .send-button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        
        .typing-indicator {
            display: none;
            padding: 12px 16px;
            background: #F0F0F0;
            border-radius: 18px;
            align-self: flex-start;
            max-width: 80px;
        }
        
        .typing-dots {
            display: flex;
            gap: 4px;
        }
        
        .typing-dots span {
            width: 8px;
            height: 8px;
            background: #999;
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
        }
        
        .typing-dots span:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .typing-dots span:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes typing {
            0%, 60%, 100% {
                transform: translateY(0);
                opacity: 0.5;
            }
            30% {
                transform: translateY(-10px);
                opacity: 1;
            }
        }
        
        .file-upload-area {
            display: ${session.allow_file_uploads ? 'block' : 'none'};
            padding: 10px 20px 0;
        }
        
        .file-input {
            display: none;
        }
        
        .file-button {
            background: #f8f8f8;
            border: 1px dashed #ccc;
            border-radius: 10px;
            padding: 10px;
            text-align: center;
            cursor: pointer;
            font-size: 14px;
            color: #666;
            transition: all 0.2s;
        }
        
        .file-button:hover {
            background: #f0f0f0;
            border-color: #007AFF;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h1>${session.session_name}</h1>
            <p>Powered by Workflow Automation</p>
        </div>
        
        <div class="chat-messages" id="messages">
            <div class="message system">
                ${session.welcome_message}
            </div>
        </div>
        
        <div class="typing-indicator" id="typingIndicator">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
        
        ${session.allow_file_uploads ? `
        <div class="file-upload-area">
            <input type="file" id="fileInput" class="file-input" accept="${session.allowed_file_types}" />
            <label for="fileInput" class="file-button">
                📎 Upload File (${session.allowed_file_types})
            </label>
        </div>
        ` : ''}
        
        <div class="chat-input-area">
            <input 
                type="text" 
                id="messageInput" 
                class="chat-input" 
                placeholder="Type your message..."
                maxlength="1000"
            />
            <button id="sendButton" class="send-button">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                </svg>
            </button>
        </div>
    </div>

    <script>
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const typingIndicator = document.getElementById('typingIndicator');
        const fileInput = document.getElementById('fileInput');
        
        const sessionId = '${session.id}';
        const nodeId = '${nodeId}';
        
        let isTyping = false;
        
        // Auto-scroll to bottom
        function scrollToBottom() {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Add message to chat
        function addMessage(text, type = 'user', sender = null) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${type}\`;
            messageDiv.textContent = text;
            messagesContainer.appendChild(messageDiv);
            scrollToBottom();
        }
        
        // Show/hide typing indicator
        function setTyping(typing) {
            isTyping = typing;
            typingIndicator.style.display = typing ? 'block' : 'none';
            if (typing) scrollToBottom();
        }
        
        // Send message
        async function sendMessage() {
            const text = messageInput.value.trim();
            if (!text || isTyping) return;
            
            // Add user message
            addMessage(text, 'user');
            messageInput.value = '';
            sendButton.disabled = true;
            setTyping(true);
            
            try {
                const response = await fetch(\`/api/chat-trigger/\${nodeId}/message\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionId: sessionId,
                        message: text,
                        sender: 'user'
                    })
                });
                
                const result = await response.json();
                
                if (result.success && result.response) {
                    addMessage(result.response, 'bot', 'Assistant');
                } else {
                    addMessage('Sorry, I encountered an error. Please try again.', 'bot', 'System');
                }
                
            } catch (error) {
                console.error('Error sending message:', error);
                addMessage('Connection error. Please check your internet and try again.', 'bot', 'System');
            }
            
            setTyping(false);
            sendButton.disabled = false;
            messageInput.focus();
        }
        
        // Event listeners
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // File upload handling (if enabled)
        if (fileInput) {
            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                // Add file message
                addMessage(\`📎 Uploaded: \${file.name}\`, 'user');
                setTyping(true);
                
                // Here you would implement file upload logic
                // For now, just simulate processing
                setTimeout(() => {
                    addMessage('File received! Processing...', 'bot', 'Assistant');
                    setTyping(false);
                }, 1000);
                
                fileInput.value = '';
            });
        }
        
        // Focus on input
        messageInput.focus();
    </script>
</body>
</html>
        `;

        res.send(chatHtml);
      }
    );

  } catch (error) {
    logger.logError(error, { context: 'serveChatTriggerInterface', nodeId });
    res.status(500).send('Server error');
  }
});

// POST /api/chat-trigger/:nodeId/message - Process chat message and trigger workflow
router.post('/:nodeId/message', async (req, res) => {
  try {
    const nodeId = req.params.nodeId;
    const { sessionId, message, sender = 'user' } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, message'
      });
    }

    // Store the message
    db.run(
      'INSERT INTO chat_trigger_messages (session_id, sender_type, message_text, sender_name) VALUES (?, ?, ?, ?)',
      [sessionId, sender, message, sender === 'user' ? 'User' : 'Assistant'],
      function(err) {
        if (err) {
          logger.logError(err, { context: 'storeChatTriggerMessage', sessionId, nodeId });
        }
      }
    );

    // Get session info for workflow execution
    db.get(
      'SELECT * FROM chat_trigger_sessions WHERE id = ? AND node_id = ?',
      [sessionId, nodeId],
      async (err, session) => {
        if (err || !session) {
          logger.logError(err || new Error('Session not found'), { context: 'getChatTriggerSession', sessionId, nodeId });
          return res.status(404).json({
            success: false,
            error: 'Chat session not found'
          });
        }

        try {
          // Trigger workflow execution
          const workflowExecutor = require('../services/workflowExecutor');
          
          // Create chat trigger data similar to Telegram trigger format
          const chatTriggerData = {
            message: {
              message_id: Date.now(),
              text: message,
              chat: {
                id: sessionId,
                type: 'private'
              },
              from: {
                id: sessionId,
                first_name: 'User',
                username: 'chat_user'
              },
              date: Math.floor(Date.now() / 1000)
            },
            chat_session: {
              id: sessionId,
              node_id: nodeId,
              session_name: session.session_name
            }
          };

          // Execute the workflow with chat trigger data
          const executionResult = await workflowExecutor.executeWorkflowFromTrigger(
            session.workflow_id,
            nodeId,
            chatTriggerData
          );

          let response = 'Thank you for your message!';
          
          if (executionResult && executionResult.success) {
            // Extract response from workflow execution result
            // Look for AI Agent or other response nodes
            if (executionResult.outputs && executionResult.outputs.length > 0) {
              const lastOutput = executionResult.outputs[executionResult.outputs.length - 1];
              if (lastOutput.response) {
                response = lastOutput.response;
              } else if (lastOutput.content) {
                response = lastOutput.content;
              } else if (typeof lastOutput === 'string') {
                response = lastOutput;
              }
            }
          }

          // Store bot response
          db.run(
            'INSERT INTO chat_trigger_messages (session_id, sender_type, message_text, sender_name) VALUES (?, ?, ?, ?)',
            [sessionId, 'bot', response, 'Assistant'],
            function(err) {
              if (err) {
                logger.logError(err, { context: 'storeChatTriggerBotResponse', sessionId, nodeId });
              }
            }
          );

          logger.info('Chat trigger message processed', {
            sessionId,
            nodeId,
            workflowId: session.workflow_id,
            messageLength: message.length,
            responseLength: response.length
          });

          res.json({
            success: true,
            response: response,
            executionId: executionResult?.executionId
          });

        } catch (executionError) {
          logger.logError(executionError, { context: 'chatTriggerWorkflowExecution', sessionId, nodeId });
          
          // Store error response
          const errorResponse = 'I apologize, but I encountered an error processing your request. Please try again.';
          db.run(
            'INSERT INTO chat_trigger_messages (session_id, sender_type, message_text, sender_name) VALUES (?, ?, ?, ?)',
            [sessionId, 'bot', errorResponse, 'System'],
            function(err) {
              if (err) logger.logError(err, { context: 'storeChatTriggerErrorResponse', sessionId, nodeId });
            }
          );

          res.json({
            success: true,
            response: errorResponse
          });
        }
      }
    );

  } catch (error) {
    logger.logError(error, { context: 'processChatTriggerMessage' });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/chat-trigger/:nodeId/history - Get chat history
router.get('/:nodeId/history', async (req, res) => {
  try {
    const nodeId = req.params.nodeId;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing sessionId parameter'
      });
    }

    db.all(
      'SELECT * FROM chat_trigger_messages WHERE session_id = ? ORDER BY timestamp ASC',
      [sessionId],
      (err, messages) => {
        if (err) {
          logger.logError(err, { context: 'getChatTriggerHistory', sessionId, nodeId });
          return res.status(500).json({ success: false, error: 'Database error' });
        }

        res.json({
          success: true,
          messages: messages.map(msg => ({
            id: msg.id,
            sender: msg.sender_type,
            senderName: msg.sender_name,
            text: msg.message_text,
            timestamp: msg.timestamp,
            fileUrl: msg.file_url,
            fileType: msg.file_type
          }))
        });
      }
    );

  } catch (error) {
    logger.logError(error, { context: 'getChatTriggerHistory' });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;