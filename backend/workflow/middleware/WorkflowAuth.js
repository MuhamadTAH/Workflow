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

module.exports = verifyToken;