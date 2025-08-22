/*
=================================================================
FILE: backend/routes/chatbot.js - CHATBOT TRIGGER ROUTES
=================================================================
This file handles routes for the floating chatbot widget functionality
created by Chatbot Trigger nodes.
*/
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../services/logger');
const { executeWorkflowFromTrigger } = require('../services/workflowExecutor');

// Database setup
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Ensure chatbot messages table exists
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS chatbot_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        node_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        message TEXT NOT NULL,
        sender TEXT NOT NULL DEFAULT 'user',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        workflow_id TEXT,
        processed BOOLEAN DEFAULT FALSE
    )`);
    
    db.run(`CREATE INDEX IF NOT EXISTS idx_chatbot_node_id ON chatbot_messages(node_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_chatbot_session_id ON chatbot_messages(session_id)`);
});

// GET /api/chatbot/:nodeId - Serve chatbot widget interface
router.get('/:nodeId', async (req, res) => {
    const { nodeId } = req.params;
    
    try {
        // Fetch node configuration from database
        const nodeQuery = `SELECT * FROM nodes WHERE id = ?`;
        db.get(nodeQuery, [nodeId], (err, node) => {
            if (err) {
                logger.error('❌ Error fetching chatbot node:', err);
                return res.status(500).json({ error: 'Failed to fetch chatbot configuration' });
            }
            
            if (!node) {
                return res.status(404).json({ error: 'Chatbot not found' });
            }
            
            const nodeData = JSON.parse(node.data || '{}');
            
            // Return simple HTML page with embedded chatbot widget
            const htmlPage = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${nodeData.chatbotTitle || 'Customer Support'}</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .demo-container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            max-width: 600px;
        }
        .demo-title {
            color: #374151;
            margin-bottom: 16px;
            font-size: 24px;
            font-weight: 600;
        }
        .demo-description {
            color: #6b7280;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        .widget-preview {
            background: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1 class="demo-title">${nodeData.chatbotTitle || 'Customer Support'}</h1>
        <p class="demo-description">
            This is a preview of your chatbot widget. In a real implementation, 
            this would be embedded on your website as a floating widget.
        </p>
        <div class="widget-preview">
            <p><strong>Widget Configuration:</strong></p>
            <p>Title: ${nodeData.chatbotTitle || 'Customer Support'}</p>
            <p>Subtitle: ${nodeData.chatbotSubtitle || 'How can we help you?'}</p>
            <p>Theme: ${nodeData.chatbotTheme || '#667eea'}</p>
            <p>Status: ${nodeData.enableChatbot ? 'Enabled' : 'Disabled'}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
            To embed this chatbot on your website, use the provided embed code 
            from the node configuration panel.
        </p>
    </div>
</body>
</html>`;
            
            res.send(htmlPage);
        });
    } catch (error) {
        logger.error('❌ Error serving chatbot widget:', error);
        res.status(500).json({ error: 'Failed to serve chatbot widget' });
    }
});

// POST /api/chatbot/:nodeId/message - Send message to chatbot
router.post('/:nodeId/message', async (req, res) => {
    const { nodeId } = req.params;
    const { message, sessionId } = req.body;
    
    if (!message || !sessionId) {
        return res.status(400).json({ error: 'Message and session ID are required' });
    }
    
    try {
        // Store the message in database
        const insertQuery = `INSERT INTO chatbot_messages (node_id, session_id, message, sender) VALUES (?, ?, ?, ?)`;
        
        db.run(insertQuery, [nodeId, sessionId, message, 'user'], async function(err) {
            if (err) {
                logger.error('❌ Error storing chatbot message:', err);
                return res.status(500).json({ error: 'Failed to store message' });
            }
            
            const messageId = this.lastID;
            logger.info(`✅ Stored chatbot message for node ${nodeId}: ${message}`);
            
            try {
                // Trigger workflow execution with the chatbot message data
                const triggerData = {
                    message: {
                        message_id: messageId,
                        text: message,
                        chat: {
                            id: sessionId,
                            type: 'chatbot_widget'
                        },
                        from: {
                            id: `chatbot_user_${Date.now()}`,
                            first_name: 'Chatbot User',
                            username: 'chatbot_user'
                        },
                        date: Math.floor(Date.now() / 1000)
                    },
                    chatbot_session: {
                        id: sessionId,
                        node_id: nodeId,
                        timestamp: new Date().toISOString()
                    }
                };
                
                logger.info(`🚀 Triggering workflow for chatbot node ${nodeId} with message: ${message}`);
                
                // Execute workflow starting from this chatbot trigger node
                const executionResult = await executeWorkflowFromTrigger(nodeId, triggerData);
                
                logger.info(`✅ Workflow execution completed for chatbot node ${nodeId}:`, executionResult);
                
                res.json({
                    success: true,
                    messageId: messageId,
                    response: "Message received and workflow triggered!",
                    timestamp: new Date().toISOString(),
                    executionId: executionResult?.executionId
                });
                
            } catch (workflowError) {
                logger.error('❌ Error executing workflow for chatbot message:', workflowError);
                
                // Still return success for message storage, but indicate workflow error
                res.json({
                    success: true,
                    messageId: messageId,
                    response: "Message received, but workflow execution failed.",
                    timestamp: new Date().toISOString(),
                    workflowError: workflowError.message
                });
            }
        });
    } catch (error) {
        logger.error('❌ Error processing chatbot message:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// GET /api/chatbot/:nodeId/messages - Get messages for a chatbot
router.get('/:nodeId/messages', async (req, res) => {
    const { nodeId } = req.params;
    const { sessionId, limit = 50 } = req.query;
    
    try {
        let query = `SELECT * FROM chatbot_messages WHERE node_id = ?`;
        let params = [nodeId];
        
        if (sessionId) {
            query += ` AND session_id = ?`;
            params.push(sessionId);
        }
        
        query += ` ORDER BY timestamp DESC LIMIT ?`;
        params.push(parseInt(limit));
        
        db.all(query, params, (err, messages) => {
            if (err) {
                logger.error('❌ Error fetching chatbot messages:', err);
                return res.status(500).json({ error: 'Failed to fetch messages' });
            }
            
            res.json({
                success: true,
                messages: messages.reverse(), // Return in chronological order
                count: messages.length
            });
        });
    } catch (error) {
        logger.error('❌ Error fetching chatbot messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

module.exports = router;