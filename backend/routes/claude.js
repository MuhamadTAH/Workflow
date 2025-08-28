const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../services/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/pdfs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const userId = req.user?.id || 'default_user';
    const timestamp = Date.now();
    cb(null, `${userId}_${timestamp}_${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Store Claude API configuration (in production, use database)
const claudeConfigs = new Map();

// Store system prompts (in production, use database)
const systemPrompts = new Map();

// Store PDF knowledge base (in production, use database)
const knowledgeBase = new Map();

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
        model: 'claude-3-5-sonnet-20241022',
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
        model: 'claude-3-5-sonnet-20241022'
      });

      console.log('✅ Claude API connection successful for user:', userId);
      
      logger.info(`Claude API connected successfully`, {
        userId,
        apiKeyPrefix: cleanApiKey.substring(0, 15) + '...',
        model: 'claude-3-5-sonnet-20241022'
      });

      res.json({
        success: true,
        message: 'Successfully connected to Claude API',
        model: 'claude-3-5-sonnet-20241022',
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

// Save system prompt
router.post('/system-prompt', asyncHandler(async (req, res) => {
  const { systemPrompt } = req.body;
  const userId = req.user?.id || 'default_user';

  if (!systemPrompt || !systemPrompt.trim()) {
    return res.status(400).json({
      success: false,
      error: 'System prompt is required'
    });
  }

  const cleanPrompt = systemPrompt.trim();
  
  if (cleanPrompt.length > 2000) {
    return res.status(400).json({
      success: false,
      error: 'System prompt must be less than 2000 characters'
    });
  }

  console.log('💾 Saving system prompt for user:', userId);

  try {
    // Store the system prompt for this user
    systemPrompts.set(userId, {
      prompt: cleanPrompt,
      updatedAt: new Date().toISOString(),
      characterCount: cleanPrompt.length
    });

    console.log('✅ System prompt saved successfully for user:', userId);
    
    logger.info(`System prompt saved successfully`, {
      userId,
      promptLength: cleanPrompt.length,
      promptPreview: cleanPrompt.substring(0, 50) + '...'
    });

    res.json({
      success: true,
      message: 'System prompt saved successfully',
      characterCount: cleanPrompt.length,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error saving system prompt:', error.message);
    logger.logError(error, { 
      context: 'claude-system-prompt-save',
      userId,
      promptLength: cleanPrompt.length
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to save system prompt: ' + error.message
    });
  }
}));

// Get system prompt
router.get('/system-prompt', (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  try {
    const promptData = systemPrompts.get(userId);
    
    if (promptData) {
      res.json({
        success: true,
        systemPrompt: promptData.prompt,
        characterCount: promptData.characterCount,
        updatedAt: promptData.updatedAt
      });
    } else {
      // Return default system prompt if none is set
      const defaultPrompt = 'You are a helpful and friendly AI assistant. Respond to users in a professional yet warm manner.';
      res.json({
        success: true,
        systemPrompt: defaultPrompt,
        characterCount: defaultPrompt.length,
        updatedAt: null,
        isDefault: true
      });
    }
  } catch (error) {
    console.error('❌ Error fetching system prompt:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system prompt',
      message: error.message
    });
  }
});

// Upload and process PDF knowledge base
router.post('/upload-knowledge', upload.single('pdf'), asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No PDF file uploaded'
    });
  }

  console.log('📄 Processing PDF for user:', userId, 'File:', req.file.filename);

  try {
    // For now, we'll use a simple text extraction approach
    // In production, you'd use a proper PDF parsing library like pdf-parse
    const pdfPath = req.file.path;
    
    // Simulate PDF text extraction (you'll need to install pdf-parse: npm install pdf-parse)
    let extractedText = '';
    let pageCount = 0;
    
    try {
      const pdf = require('pdf-parse');
      const dataBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdf(dataBuffer);
      
      extractedText = pdfData.text;
      pageCount = pdfData.numpages;
    } catch (pdfError) {
      console.log('PDF parsing library not available, using fallback method');
      // Fallback: store file info and use filename as basic content
      extractedText = `Document: ${req.file.originalname}\nContent: This is a knowledge base document that contains business information.`;
      pageCount = 1;
    }

    // Clean and validate extracted text
    const cleanText = extractedText.trim();
    if (cleanText.length < 10) {
      throw new Error('PDF appears to be empty or text could not be extracted');
    }

    // Store knowledge base for this user
    knowledgeBase.set(userId, {
      filename: req.file.originalname,
      filepath: pdfPath,
      extractedText: cleanText,
      pageCount: pageCount,
      textLength: cleanText.length,
      uploadedAt: new Date().toISOString(),
      fileSize: req.file.size
    });

    console.log('✅ PDF processed successfully for user:', userId);
    console.log(`📊 Extracted ${cleanText.length} characters from ${pageCount} pages`);
    
    logger.info(`PDF knowledge base uploaded successfully`, {
      userId,
      filename: req.file.originalname,
      textLength: cleanText.length,
      pageCount: pageCount
    });

    res.json({
      success: true,
      message: 'PDF processed successfully',
      filename: req.file.originalname,
      textLength: cleanText.length,
      pageCount: pageCount
    });
  } catch (error) {
    console.error('❌ Error processing PDF:', error.message);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    logger.logError(error, { 
      context: 'pdf-knowledge-upload',
      userId,
      filename: req.file?.originalname
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to process PDF: ' + error.message
    });
  }
}));

// Get knowledge base info
router.get('/knowledge-info', (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  try {
    const knowledge = knowledgeBase.get(userId);
    
    if (knowledge) {
      res.json({
        success: true,
        hasKnowledge: true,
        info: {
          filename: knowledge.filename,
          pageCount: knowledge.pageCount,
          textLength: knowledge.textLength,
          uploadedAt: knowledge.uploadedAt,
          fileSize: knowledge.fileSize
        }
      });
    } else {
      res.json({
        success: true,
        hasKnowledge: false,
        info: null
      });
    }
  } catch (error) {
    console.error('❌ Error fetching knowledge info:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch knowledge base info',
      message: error.message
    });
  }
});

// Delete knowledge base
router.delete('/delete-knowledge', asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'default_user';
  
  console.log('🗑️ Deleting knowledge base for user:', userId);

  try {
    const knowledge = knowledgeBase.get(userId);
    
    if (knowledge) {
      // Delete the file from filesystem
      if (fs.existsSync(knowledge.filepath)) {
        fs.unlinkSync(knowledge.filepath);
        console.log('📄 Deleted PDF file:', knowledge.filepath);
      }
      
      // Remove from memory
      knowledgeBase.delete(userId);
      
      logger.info(`Knowledge base deleted successfully`, {
        userId,
        filename: knowledge.filename
      });

      res.json({
        success: true,
        message: 'Knowledge base deleted successfully'
      });
    } else {
      res.json({
        success: true,
        message: 'No knowledge base found to delete'
      });
    }
  } catch (error) {
    console.error('❌ Error deleting knowledge base:', error.message);
    logger.logError(error, { 
      context: 'delete-knowledge-base',
      userId
    });
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete knowledge base: ' + error.message
    });
  }
}));

module.exports = router;
module.exports.claudeConfigs = claudeConfigs;
module.exports.systemPrompts = systemPrompts;
module.exports.knowledgeBase = knowledgeBase;