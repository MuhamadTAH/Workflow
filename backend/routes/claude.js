const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../services/logger');

// Store Claude API configuration (in production, use database)
const claudeConfigs = new Map();

// Connect to Claude API
router.post('/connect', asyncHandler(async (req, res) => {
  const { apiKey } = req.body;
  const userId = req.user?.id || 'default_user';

  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({
      success: false,
      error: 'API key is required'
    });
  }

  const cleanApiKey = apiKey.trim();
  
  // Validate API key format
  if (!cleanApiKey.startsWith('sk-ant-')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Claude API key format. It should start with "sk-ant-"'
    });
  }

  console.log('🔗 Connecting to Claude API for user:', userId);

  try {
    // Test the API key by making a simple request
    const axios = require('axios');
    
    const testResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Hello! Just testing the connection. Please respond with "Connection successful!"'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanApiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    if (testResponse.data && testResponse.data.content) {
      // Store the API key for this user
      claudeConfigs.set(userId, {
        apiKey: cleanApiKey,
        connectedAt: new Date().toISOString(),
        lastUsed: null,
        model: 'claude-3-sonnet-20240229'
      });

      console.log('✅ Claude API connection successful for user:', userId);
      
      logger.info(`Claude API connected successfully`, {
        userId,
        apiKeyPrefix: cleanApiKey.substring(0, 15) + '...',
        model: 'claude-3-sonnet-20240229'
      });

      res.json({
        success: true,
        message: 'Successfully connected to Claude API',
        model: 'claude-3-sonnet-20240229',
        testResponse: testResponse.data.content[0]?.text || 'Connected'
      });
    } else {
      throw new Error('Invalid response from Claude API');
    }
  } catch (error) {
    console.error('❌ Claude API connection error:', error.message);
    
    let errorMessage = 'Failed to connect to Claude API';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Invalid API key. Please check your Claude API key.';
      } else if (error.response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.response.status === 400) {
        errorMessage = 'Bad request. Please check your API key format.';
      } else {
        errorMessage = `Claude API error: ${error.response.data?.error?.message || error.message}`;
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Connection timeout. Please check your internet connection.';
    }

    logger.logError(error, { 
      context: 'claude-api-connect',
      userId,
      apiKeyPrefix: cleanApiKey.substring(0, 15) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}));

// Disconnect Claude API
router.post('/disconnect', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  console.log('🔌 Disconnecting Claude API for user:', userId);

  if (claudeConfigs.has(userId)) {
    claudeConfigs.delete(userId);
    
    logger.info(`Claude API disconnected`, { userId });
    
    res.json({
      success: true,
      message: 'Successfully disconnected from Claude API'
    });
  } else {
    res.json({
      success: true,
      message: 'No active Claude API connection found'
    });
  }
}));

// Test Claude API connection
router.post('/test', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  const config = claudeConfigs.get(userId);
  if (!config) {
    return res.status(400).json({
      success: false,
      error: 'No Claude API connection found. Please connect first.'
    });
  }

  console.log('🧪 Testing Claude API connection for user:', userId);

  try {
    const axios = require('axios');
    
    const testResponse = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: config.model,
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Please respond with "Test successful!" to confirm the connection is working.'
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      }
    );

    // Update last used time
    config.lastUsed = new Date().toISOString();

    console.log('✅ Claude API test successful for user:', userId);
    
    logger.info(`Claude API test successful`, {
      userId,
      model: config.model
    });

    res.json({
      success: true,
      message: 'Claude API test successful',
      testResponse: testResponse.data.content[0]?.text || 'Test completed',
      model: config.model,
      lastUsed: config.lastUsed
    });
  } catch (error) {
    console.error('❌ Claude API test error:', error.message);
    
    let errorMessage = 'Claude API test failed';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'API key is no longer valid. Please reconnect.';
        // Remove invalid connection
        claudeConfigs.delete(userId);
      } else if (error.response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else {
        errorMessage = `Claude API error: ${error.response.data?.error?.message || error.message}`;
      }
    }

    logger.logError(error, { 
      context: 'claude-api-test',
      userId,
      model: config.model
    });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}));

// Get Claude API status
router.get('/status', (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  const config = claudeConfigs.get(userId);
  
  res.json({
    success: true,
    connected: !!config,
    model: config?.model || null,
    connectedAt: config?.connectedAt || null,
    lastUsed: config?.lastUsed || null
  });
});

// Chat with Claude API
router.post('/chat', asyncHandler(async (req, res) => {
  const { message, maxTokens = 1000 } = req.body;
  const userId = req.user?.id || 'default_user';

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  const config = claudeConfigs.get(userId);
  if (!config) {
    return res.status(400).json({
      success: false,
      error: 'No Claude API connection found. Please connect first.'
    });
  }

  console.log('💬 Sending message to Claude API for user:', userId);

  try {
    const axios = require('axios');
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: config.model,
        max_tokens: Math.min(maxTokens, 4000),
        messages: [
          {
            role: 'user',
            content: message.trim()
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 60000 // 60 second timeout for chat
      }
    );

    // Update last used time
    config.lastUsed = new Date().toISOString();

    console.log('✅ Claude API chat successful for user:', userId);
    
    logger.info(`Claude API chat successful`, {
      userId,
      model: config.model,
      messageLength: message.length,
      responseLength: response.data.content[0]?.text?.length || 0
    });

    res.json({
      success: true,
      response: response.data.content[0]?.text || '',
      model: config.model,
      usage: response.data.usage || {}
    });
  } catch (error) {
    console.error('❌ Claude API chat error:', error.message);
    
    let errorMessage = 'Failed to get response from Claude API';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'API key is no longer valid. Please reconnect.';
        claudeConfigs.delete(userId);
      } else if (error.response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (error.response.status === 400) {
        errorMessage = `Bad request: ${error.response.data?.error?.message || 'Invalid request'}`;
      } else {
        errorMessage = `Claude API error: ${error.response.data?.error?.message || error.message}`;
      }
    }

    logger.logError(error, { 
      context: 'claude-api-chat',
      userId,
      messagePreview: message.substring(0, 100) + '...'
    });
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
}));

// Get all active Claude connections (admin only)
router.get('/connections', (req, res) => {
  const connections = Array.from(claudeConfigs.entries()).map(([userId, config]) => ({
    userId,
    model: config.model,
    connectedAt: config.connectedAt,
    lastUsed: config.lastUsed,
    apiKeyPrefix: config.apiKey.substring(0, 15) + '...'
  }));

  res.json({
    success: true,
    totalConnections: connections.length,
    connections: connections
  });
});

module.exports = router;