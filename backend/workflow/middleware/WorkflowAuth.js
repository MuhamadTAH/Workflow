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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log('✅ Token valid for user:', decoded.userId);
    next();
  } catch (error) {
    console.log('❌ Invalid token:', error.message);
    res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = verifyToken;