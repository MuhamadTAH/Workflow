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
    try {
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
      
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user
      const result = await db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name || null, email, hashedPassword]);

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.lastInsertRowid, email: email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User created successfully',
        token: token
      });
    } catch (dbError) {
      return res.status(500).json({ message: 'Database error' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/login - Authenticate user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      // Find user by email
      const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

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
    } catch (dbError) {
      console.error('❌ Login database error:', dbError);
      return res.status(500).json({ message: 'Database error', error: dbError.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/profile - Get user profile (protected route)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    try {
      const user = await db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.userId]);

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
    } catch (dbError) {
      return res.status(500).json({ message: 'Database error' });
    }
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

// Temporary debug route to check if user exists
router.get('/debug/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await db.get('SELECT id, name, email, password FROM users WHERE email = ?', [email]);
    
    if (user) {
      res.json({
        exists: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          hasPassword: !!user.password,
          passwordLength: user.password ? user.password.length : 0
        }
      });
    } else {
      res.json({
        exists: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Test database connectivity
router.get('/test-db', async (req, res) => {
  try {
    const result = await db.get('SELECT COUNT(*) as count FROM users');
    res.json({
      success: true,
      userCount: result.count,
      message: 'Database connection working'
    });
  } catch (error) {
    console.error('❌ Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database connection failed'
    });
  }
});

// Create test user if it doesn't exist
router.post('/create-test-user', async (req, res) => {
  try {
    const testEmail = 'mhamadtah548@gmail.com';
    const testPassword = '1qazxsw2';
    
    // Delete existing user first
    await db.run('DELETE FROM users WHERE email = ?', [testEmail]);
    
    // Hash password and create user
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
    
    const result = await db.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
      ['Test User', testEmail, hashedPassword]
    );
    
    res.json({
      message: 'Test user created successfully',
      email: testEmail,
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('❌ Create test user error:', error);
    res.status(500).json({
      error: error.message,
      message: 'Failed to create test user'
    });
  }
});

module.exports = router;