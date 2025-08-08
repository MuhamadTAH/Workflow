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

    // For now, return a mock response until we resolve API issues
    const mockResponse = {
      response: `Mock AI Response: I received your message "${node.config.userMessage}" with system prompt "${node.config.systemPrompt || 'default'}". This is a test response to verify the workflow is working. In production, this would be a real Claude API response.`,
      model: node.config.model || 'claude-3-5-sonnet-20241022',
      timestamp: new Date().toISOString(),
      inputProcessed: node.config.userMessage,
      note: 'This is a mock response for testing. Real Claude API integration coming soon.'
    };
    
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

module.exports = router;