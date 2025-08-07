const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for chat sessions (replace with database in production)
const chatSessions = new Map();
const activeWorkflows = new Map();

/**
 * Chat Webhook Endpoint
 * Receives messages from website chat widgets and triggers workflows
 * POST /api/chat/webhook/:workflowId
 */
router.post('/webhook/:workflowId', async (req, res) => {
    try {
        const { workflowId } = req.params;
        const { 
            message, 
            sessionId = uuidv4(), 
            userId, 
            userEmail,
            userName = 'Guest',
            websiteUrl,
            metadata = {}
        } = req.body;

        console.log(`🤖 Chat webhook received for workflow ${workflowId}:`, {
            message,
            sessionId,
            userId,
            websiteUrl
        });

        // Validate required fields
        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Create or update chat session
        if (!chatSessions.has(sessionId)) {
            chatSessions.set(sessionId, {
                id: sessionId,
                workflowId,
                userId,
                userEmail,
                userName,
                websiteUrl,
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            });
        }

        const session = chatSessions.get(sessionId);
        
        // Add user message to session
        const userMessage = {
            id: uuidv4(),
            type: 'user',
            content: message,
            timestamp: new Date(),
            metadata
        };
        session.messages.push(userMessage);
        session.updatedAt = new Date();

        // Prepare workflow trigger data
        const workflowData = {
            trigger: 'chat',
            sessionId,
            message: {
                id: userMessage.id,
                content: message,
                timestamp: userMessage.timestamp
            },
            user: {
                id: userId,
                email: userEmail,
                name: userName
            },
            session: {
                id: sessionId,
                messagesCount: session.messages.length,
                websiteUrl,
                createdAt: session.createdAt
            },
            metadata
        };

        // Store workflow reference for response handling
        activeWorkflows.set(sessionId, {
            workflowId,
            lastTrigger: new Date(),
            responseCallback: null
        });

        // Integrate with actual workflow execution engine
        console.log(`🔄 Triggering workflow ${workflowId} with data:`, workflowData);

        try {
            // Load the workflow from localStorage to get the actual nodes/edges
            // In production, this would come from a database
            const workflowExecutor = require('../services/workflowExecutor');
            
            // Check if this workflow is registered for execution
            const workflowStatus = workflowExecutor.getWorkflowStatus(workflowId);
            
            if (!workflowStatus.isRegistered) {
                console.log(`⚠️ Workflow ${workflowId} not registered - using simulation`);
                // Fallback to simulation if workflow not registered
                setTimeout(() => {
                    simulateWorkflowResponse(sessionId, {
                        type: 'text',
                        content: `Hello ${userName}! I received your message: "${message}". This workflow isn't active yet - please save your workflow in the builder first.`,
                        timestamp: new Date()
                    });
                }, 1000);
            } else {
                console.log(`✅ Workflow ${workflowId} is registered, executing...`);
                
                // Execute the workflow
                setTimeout(async () => {
                    try {
                        const executionResult = await workflowExecutor.executeWorkflow(workflowId, workflowData);
                        console.log('🎉 Workflow execution completed:', executionResult.status);
                        
                        // Extract response from execution result
                        if (executionResult.finalOutput && executionResult.finalOutput.response) {
                            // If workflow produced a response, use it
                            const response = {
                                type: 'text',
                                content: executionResult.finalOutput.response,
                                timestamp: new Date()
                            };
                            simulateWorkflowResponse(sessionId, response);
                        } else {
                            // Default response if no output
                            simulateWorkflowResponse(sessionId, {
                                type: 'text',
                                content: `✅ Workflow executed successfully! Final output: ${JSON.stringify(executionResult.finalOutput).substring(0, 200)}...`,
                                timestamp: new Date()
                            });
                        }
                    } catch (workflowError) {
                        console.error('❌ Workflow execution failed:', workflowError.message);
                        simulateWorkflowResponse(sessionId, {
                            type: 'text',
                            content: `❌ Workflow execution failed: ${workflowError.message}`,
                            timestamp: new Date()
                        });
                    }
                }, 500);
            }
        } catch (error) {
            console.error('❌ Workflow integration error:', error.message);
            // Fallback to simulation on error
            setTimeout(() => {
                simulateWorkflowResponse(sessionId, {
                    type: 'text',
                    content: `Hello ${userName}! I received your message: "${message}". There was an issue with workflow execution.`,
                    timestamp: new Date()
                });
            }, 1000);
        }

        res.json({
            success: true,
            sessionId,
            messageId: userMessage.id,
            status: 'processing'
        });

    } catch (error) {
        console.error('❌ Chat webhook error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Send Response from Workflow
 * Called by Chat Response nodes in workflows
 * POST /api/chat/response/:sessionId
 */
router.post('/response/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { 
            content, 
            type = 'text',
            metadata = {},
            buttons = [],
            delay = 0
        } = req.body;

        if (!chatSessions.has(sessionId)) {
            return res.status(404).json({
                success: false,
                error: 'Chat session not found'
            });
        }

        const session = chatSessions.get(sessionId);
        
        // Add bot response to session
        const botMessage = {
            id: uuidv4(),
            type: 'bot',
            content,
            messageType: type,
            timestamp: new Date(),
            metadata,
            buttons
        };

        session.messages.push(botMessage);
        session.updatedAt = new Date();

        console.log(`🤖 Sending chat response to session ${sessionId}:`, botMessage);

        res.json({
            success: true,
            messageId: botMessage.id,
            sessionId
        });

        // Store response for widget polling
        if (!session.pendingResponses) {
            session.pendingResponses = [];
        }
        session.pendingResponses.push(botMessage);

    } catch (error) {
        console.error('❌ Chat response error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Get Chat Session Messages
 * Used by chat widgets to poll for new messages
 * GET /api/chat/session/:sessionId/messages
 */
router.get('/session/:sessionId/messages', (req, res) => {
    try {
        const { sessionId } = req.params;
        const { after } = req.query; // timestamp to get messages after

        if (!chatSessions.has(sessionId)) {
            return res.status(404).json({
                success: false,
                error: 'Chat session not found'
            });
        }

        const session = chatSessions.get(sessionId);
        let messages = session.messages;

        // Filter messages after timestamp if provided
        if (after) {
            const afterDate = new Date(after);
            messages = messages.filter(msg => msg.timestamp > afterDate);
        }

        // Get pending responses and clear them
        const pendingResponses = session.pendingResponses || [];
        session.pendingResponses = [];

        res.json({
            success: true,
            sessionId,
            messages,
            pendingResponses,
            hasNewMessages: messages.length > 0 || pendingResponses.length > 0
        });

    } catch (error) {
        console.error('❌ Get messages error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Get Chat Session Info
 * GET /api/chat/session/:sessionId
 */
router.get('/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;

        if (!chatSessions.has(sessionId)) {
            return res.status(404).json({
                success: false,
                error: 'Chat session not found'
            });
        }

        const session = chatSessions.get(sessionId);
        
        res.json({
            success: true,
            session: {
                id: session.id,
                workflowId: session.workflowId,
                userName: session.userName,
                websiteUrl: session.websiteUrl,
                messagesCount: session.messages.length,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                isActive: session.isActive
            }
        });

    } catch (error) {
        console.error('❌ Get session error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * List Active Chat Sessions
 * GET /api/chat/sessions
 */
router.get('/sessions', (req, res) => {
    try {
        const sessions = Array.from(chatSessions.values()).map(session => ({
            id: session.id,
            workflowId: session.workflowId,
            userName: session.userName,
            websiteUrl: session.websiteUrl,
            messagesCount: session.messages.length,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            isActive: session.isActive
        }));

        res.json({
            success: true,
            sessions,
            count: sessions.length
        });

    } catch (error) {
        console.error('❌ List sessions error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Simulate workflow response (replace with actual workflow integration)
function simulateWorkflowResponse(sessionId, response) {
    if (chatSessions.has(sessionId)) {
        const session = chatSessions.get(sessionId);
        
        const botMessage = {
            id: uuidv4(),
            type: 'bot',
            content: response.content,
            messageType: response.type || 'text',
            timestamp: response.timestamp || new Date(),
            metadata: response.metadata || {}
        };

        session.messages.push(botMessage);
        
        if (!session.pendingResponses) {
            session.pendingResponses = [];
        }
        session.pendingResponses.push(botMessage);
        
        console.log(`🤖 Simulated workflow response for session ${sessionId}`);
    }
}

module.exports = router;