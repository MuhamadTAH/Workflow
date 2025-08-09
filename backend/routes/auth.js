const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// POST /api/signup - Create new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
      db.run(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name || null, email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Error creating user' });
          }

          // Generate JWT token
          const token = jwt.sign(
            { userId: this.lastID, email: email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
          );

          res.status(201).json({
            message: 'User created successfully',
            token: token
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/login - Authenticate user
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }

      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Compare password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token: token
      });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/profile - Get user profile (protected route)
router.get('/profile', verifyToken, (req, res) => {
  try {
    db.get(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.userId],
      (err, user) => {
        if (err) {
          return res.status(500).json({ message: 'Database error' });
        }

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// TEMPORARY: Claude API verification route (moved here due to routing issues)
router.post('/verify-claude', async (req, res) => {
  try {
    const { apiKey } = req.body || {};
    
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ ok: false, message: 'apiKey is required' });
    }
    
    if (!apiKey.startsWith('sk-ant-')) {
      return res.status(401).json({ ok: false, message: 'Invalid Claude API key format. Must start with sk-ant-' });
    }

    if (apiKey.length < 50) {
      return res.status(401).json({ ok: false, message: 'Invalid Claude API key length' });
    }
    
    return res.json({ ok: true, model: 'claude-3-5-sonnet-20241022' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Verification failed' });
  }
});

// TEMPORARY: AI Agent execution route (moved here due to routing issues)
router.post('/run-ai-agent', async (req, res) => {
  try {
    const { node, inputData } = req.body;
    
    if (!node || node.type !== 'aiAgent') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request - aiAgent node required' 
      });
    }

    console.log('🤖 AI Agent execution request received');
    console.log('Config:', {
      hasApiKey: !!node.config.apiKey,
      model: node.config.model,
      systemPrompt: node.config.systemPrompt?.substring(0, 50) + '...',
      userMessage: node.config.userMessage?.substring(0, 50) + '...'
    });

    // Validate required fields
    if (!node.config.apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Claude API Key is required',
        nodeType: 'aiAgent'
      });
    }

    if (!node.config.userMessage) {
      return res.status(400).json({
        success: false,
        message: 'User Message is required',
        nodeType: 'aiAgent'
      });
    }

    // Use real Claude API integration
    try {
      const { callClaudeApi } = require('../services/aiService');
      
      // Process templates in user message before sending to Claude API
      const processedUserMessage = processTemplates(node.config.userMessage, inputData);
      console.log('🔧 Template processing:', {
        original: node.config.userMessage,
        processed: processedUserMessage
      });
      
      const aiRequest = {
        model: node.config.model || 'claude-3-5-sonnet-20241022',
        apiKey: node.config.apiKey,
        systemPrompt: node.config.systemPrompt || 'You are a helpful AI assistant.',
        userMessage: processedUserMessage, // Use processed message instead of raw template
        inputData: inputData
      };

      console.log('Making real Claude API call...');
      const aiResponse = await callClaudeApi(aiRequest);
      
      const realResponse = {
        response: aiResponse,
        model: node.config.model || 'claude-3-5-sonnet-20241022',
        timestamp: new Date().toISOString(),
        inputProcessed: processedUserMessage // Use processed message
      };
      
      console.log('✅ Real Claude API response received');
      return res.json({
        success: true,
        result: realResponse,
        nodeType: 'aiAgent',
        executedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Real Claude API failed, falling back to mock:', error.message);
      
      // Fallback to mock response if real API fails (also use processed message)
      const processedUserMessage = processTemplates(node.config.userMessage, inputData);
      const mockResponse = {
        response: `AI Response: I received your message "${processedUserMessage}". (Note: This is a fallback response because the real Claude API encountered an error: ${error.message})`,
        model: node.config.model || 'claude-3-5-sonnet-20241022',
        timestamp: new Date().toISOString(),
        inputProcessed: processedUserMessage,
        note: `Fallback response due to API error: ${error.message}`
      };
    }
    
    return res.json({
      success: true,
      result: mockResponse,
      nodeType: 'aiAgent',
      executedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ AI Agent execution failed:', error.message);
    return res.status(500).json({
      success: false,
      message: `AI Agent execution failed: ${error.message}`,
      nodeType: 'aiAgent',
      error: error.message
    });
  }
});

// Helper function to process templates (copied from telegram and AI agent nodes)
function processTemplates(text, inputData) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    console.log('🔧 AI Agent route processing templates in text:', text);
    console.log('📊 Available input data:', JSON.stringify(inputData, null, 2));
    
    // Handle cascading data structure similar to other nodes
    let dataToProcess;
    if (Array.isArray(inputData) && inputData.length > 0 && inputData[0].nodeId) {
        // This is cascading data structure - convert to flat object for template resolution
        dataToProcess = {};
        inputData.forEach(nodeInfo => {
            // Create entries like "1. AI Agent" for easy template access
            const nodeKey = `${nodeInfo.order}. ${nodeInfo.nodeLabel}`;
            dataToProcess[nodeKey] = nodeInfo.data;
            
            // Also create direct data entries for backwards compatibility
            if (nodeInfo.data && typeof nodeInfo.data === 'object') {
                Object.keys(nodeInfo.data).forEach(key => {
                    // Priority: Give Telegram Trigger data priority over AI Agent data for common keys
                    if (!(key in dataToProcess) || nodeInfo.nodeType === 'telegramTrigger') {
                        dataToProcess[key] = nodeInfo.data[key];
                    }
                });
            }
        });
    } else {
        // Use original data structure
        dataToProcess = inputData;
    }
    
    console.log('🔧 AI Agent route processed data structure:', JSON.stringify(dataToProcess, null, 2));
    
    // Enhanced template processing - replace {{ key }} with data values
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        try {
            const pathStr = path.trim();
            const keys = pathStr.split('.');
            
            console.log(`🔍 AI Agent route resolving path: ${pathStr}`);
            
            // Try direct path first (e.g., "message.text" or "1. Telegram Trigger.message.text")
            let current = dataToProcess;
            let found = true;
            
            for (const key of keys) {
                if (current && typeof current === 'object' && key in current) {
                    current = current[key];
                } else {
                    found = false;
                    break;
                }
            }
            
            if (found) {
                const result = typeof current === 'object' ? JSON.stringify(current) : String(current);
                console.log(`✅ AI Agent route direct path resolved: ${pathStr} = ${result}`);
                return result;
            }
            
            // If direct path fails, try to find in nested data (backwards compatibility)
            if (typeof dataToProcess === 'object' && dataToProcess !== null) {
                for (const [nodeKey, nodeData] of Object.entries(dataToProcess)) {
                    if (typeof nodeData === 'object' && nodeData !== null) {
                        let nestedCurrent = nodeData;
                        let nestedFound = true;
                        
                        for (const key of keys) {
                            if (nestedCurrent && typeof nestedCurrent === 'object' && key in nestedCurrent) {
                                nestedCurrent = nestedCurrent[key];
                            } else {
                                nestedFound = false;
                                break;
                            }
                        }
                        
                        if (nestedFound) {
                            const result = typeof nestedCurrent === 'object' ? JSON.stringify(nestedCurrent) : String(nestedCurrent);
                            console.log(`✅ AI Agent route nested path resolved: ${pathStr} in ${nodeKey} = ${result}`);
                            return result;
                        }
                    }
                }
            }
            
            console.log(`❌ AI Agent route path not found: ${pathStr}`);
            return match; // Return original if path not found anywhere
        } catch (error) {
            console.warn(`❌ AI Agent route template processing error for ${match}:`, error.message);
            return match;
        }
    });
}

module.exports = router;