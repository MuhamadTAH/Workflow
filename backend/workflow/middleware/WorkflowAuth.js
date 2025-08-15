// /backend/workflow/middleware/WorkflowAuth.js
const jwt = require('jsonwebtoken');

// This middleware will protect our workflow routes
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // In a real app, use a secret from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret'); 
    req.user = decoded; // Add user payload to the request object
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;
