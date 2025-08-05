require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const webhooksRoutes = require('./routes/webhooks');
const workflowRoutes = require('./routes/workflows');
const agentRoutes = require('./routes/agent');
const connectionsRoutes = require('./routes/connections');
const shopsRoutes = require('./routes/shops');
const productsRoutes = require('./routes/products');
const publicRoutes = require('./routes/public');
const uploadsRoutes = require('./routes/uploads');
const { errorHandler, requestLogger } = require('./middleware/errorHandler');
const logger = require('./services/logger');
require('./db'); // Initialize database

const app = express();

// Middleware
app.use(requestLogger); // Log all requests
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', authRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/uploads', uploadsRoutes);

// Test route
app.get('/api/hello', (req, res) => {
  res.json({ message: '✅ Hello from the backend!' });
});

// Test webhook route (for debugging)
app.post('/api/test-webhook', (req, res) => {
  logger.debug('Test webhook received', { body: req.body });
  res.json({ 
    received: true, 
    data: req.body,
    timestamp: new Date().toISOString()
  });
});

// Debug route to check uploads
app.get('/api/debug/routes', (req, res) => {
  const routes = app._router.stack.filter(r => r.regexp.source.includes('uploads'));
  res.json({ 
    uploadsRoutes: routes.length,
    message: routes.length > 0 ? 'Uploads routes found' : 'No uploads routes found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Backend server started on port ${PORT}`, { port: PORT });
});
