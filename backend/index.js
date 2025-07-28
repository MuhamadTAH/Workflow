require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const webhooksRoutes = require('./routes/webhooks');
const workflowRoutes = require('./routes/workflows');
const agentRoutes = require('./routes/agent');
const connectionsRoutes = require('./routes/connections');
const { errorHandler, requestLogger } = require('./middleware/errorHandler');
const logger = require('./services/logger');
require('./db'); // Initialize database

const app = express();

// Middleware
app.use(requestLogger); // Log all requests
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Routes
app.use('/api', authRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/connections', connectionsRoutes);

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
