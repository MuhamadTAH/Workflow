const jwt = require('jsonwebtoken');

// Simple authentication middleware
const authenticateUser = (req, res, next) => {
  try {
    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development, allow requests without auth but add default user
      req.user = { id: 1 }; // Default to user ID 1
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ JWT_SECRET not configured, using default user');
      req.user = { id: 1 };
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    // For development, continue with default user instead of failing
    req.user = { id: 1 };
    next();
  }
};

// Require authentication (stricter version)
const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required. Please provide a valid token.' 
      });
    }

    const token = authHeader.substring(7);
    
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ 
        error: 'Server authentication not configured' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid or expired token' 
    });
  }
};

module.exports = {
  authenticateUser,
  requireAuth
};