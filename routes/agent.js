const express = require('express');
const router = express.Router();
const aiAgent = require('../services/aiAgent');
const logger = require('../services/logger');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// POST /api/agent/chat - Main chat endpoint
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user.id;

    if (!message || !sessionId) {
      return res.status(400).json({ 
        error: 'Message and sessionId are required' 
      });
    }

    logger.info('🤖 Agent chat request:', { 
      userId, 
      sessionId, 
      messageLength: message.length 
    });

    // Process with AI Agent
    const result = await aiAgent.chat(message, sessionId, userId);

    logger.info('✅ Agent chat response:', { 
      sessionId, 
      responseLength: result.response.length,
      toolsUsed: result.toolsUsed
    });

    res.json(result);

  } catch (error) {
    logger.error('❌ Agent chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/agent/memory/:sessionId - Get memory summary
router.get('/memory/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const memorySummary = aiAgent.getMemorySummary(sessionId);
    
    res.json(memorySummary);

  } catch (error) {
    logger.error('❌ Agent memory error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// POST /api/agent/clear-memory/:sessionId - Clear session memory
router.post('/clear-memory/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Clear memory for this session
    aiAgent.memory.delete(sessionId);
    
    logger.info('🗑️ Cleared memory for session:', sessionId);
    
    res.json({ 
      success: true, 
      message: 'Memory cleared successfully' 
    });

  } catch (error) {
    logger.error('❌ Agent clear memory error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/agent/tools - List available tools
router.get('/tools', authenticateToken, async (req, res) => {
  try {
    const tools = Object.values(aiAgent.tools).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }));
    
    res.json({ tools });

  } catch (error) {
    logger.error('❌ Agent tools error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/agent/status - Agent status check
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = {
      agent: 'online',
      model: aiAgent.model,
      tools: Object.keys(aiAgent.tools).length,
      activeSessions: aiAgent.memory.size,
      timestamp: new Date().toISOString()
    };
    
    res.json(status);

  } catch (error) {
    logger.error('❌ Agent status error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// POST /api/agent/test-node - Test AI Agent node execution
router.post('/test-node', authenticateToken, async (req, res) => {
  try {
    const { nodeConfig, inputData } = req.body;
    const userId = req.user.id;

    // Create mock node and execution for testing
    const mockNode = {
      id: `test_${Date.now()}`,
      type: 'AIAgent',
      label: 'Test AI Agent',
      config: nodeConfig || {}
    };

    const mockExecution = {
      id: `exec_${Date.now()}`,
      userId: userId,
      status: 'running',
      nodeOutputs: new Map()
    };

    logger.info('🧪 Testing AI Agent node:', { 
      userId, 
      nodeConfig: mockNode.config,
      inputData 
    });

    // Execute the AI Agent node using workflow engine
    const workflowEngine = require('../workflowEngine');
    const result = await workflowEngine.executeAIAgentNode(
      mockNode, 
      inputData || 'Test message for AI agent',
      mockExecution
    );

    logger.info('✅ AI Agent node test completed:', { 
      success: result.success,
      responseLength: result.data?.response?.length || 0
    });

    res.json({
      success: true,
      result: result,
      nodeId: mockNode.id,
      executionId: mockExecution.id
    });

  } catch (error) {
    logger.error('❌ Agent node test error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;