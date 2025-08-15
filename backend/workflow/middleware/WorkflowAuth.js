// Workflow authentication middleware
// Validates user permissions for workflow access
// Checks workflow ownership and sharing permissions
// API key validation for webhook triggers

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Allow OPTIONS requests (CORS preflight) to pass through without authentication
  if (req.method === 'OPTIONS') {
    return next();
  }

  console.log('🔐 WorkflowAuth called for:', req.method, req.url);

  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Check if JWT_SECRET exists
  if (!process.env.JWT_SECRET) {
    console.log('❌ JWT_SECRET not set in environment');
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    console.log('🔑 JWT_SECRET available:', !!process.env.JWT_SECRET);
    console.log('🎫 Token length:', token.length);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('✅ Token valid for user:', decoded.userId);
    next();
  } catch (error) {
    console.log('❌ JWT verification error:', error.message);
    console.log('❌ Error code:', error.code);
    console.log('❌ Error name:', error.name);
    
    // If it's a JWT error, return 401, if it's something else, return 500
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Invalid or expired token.' });
    } else {
      res.status(500).json({ message: 'Authentication error', error: error.message });
    }
  }
};

module.exports = verifyToken;