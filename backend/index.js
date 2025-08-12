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
const aiRoutes = require('./routes/ai');
const chatRoutes = require('./routes/chat');
const languageRoutes = require('./routes/language');
const debugRoutes = require('./routes/debug');
// NEW ROUTES FROM WORKFLOWNODE
const nodesRoutes = require('./routes/nodes');
const { errorHandler, requestLogger } = require('./middleware/errorHandler');
const logger = require('./services/logger');
require('./db'); // Initialize database

const app = express();

// Middleware
app.use(requestLogger); // Log all requests

// Enhanced logging middleware for debugging (filtered)
app.use((req, res, next) => {
  // Skip logging for repetitive chat polling requests
  const isChatPolling = req.url.startsWith('/api/chat-messages/');
  const isHealthCheck = req.url === '/health' || req.url === '/';
  
  if (!isChatPolling && !isHealthCheck) {
    console.log('🌐 INCOMING REQUEST:', {
      method: req.method,
      url: req.url,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 50),
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Simple CORS - allow all origins
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json()); // Parse JSON bodies

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Serve static public files
app.use('/public', express.static('public'));

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
app.use('/api/ai', aiRoutes);
app.use(chatRoutes);
app.use(languageRoutes);
app.use(debugRoutes);
// Additional middleware to debug CORS and route issues
app.use('/api/nodes', (req, res, next) => {
  console.log('🔍 NODES API REQUEST DEBUG:', {
    method: req.method,
    url: req.url,
    path: req.path,
    origin: req.headers.origin,
    headers: Object.keys(req.headers),
    body: req.method === 'POST' ? req.body : 'N/A'
  });
  next();
});

// NEW ROUTES FROM WORKFLOWNODE
app.use('/api/nodes', nodesRoutes);

// Test route
app.get('/api/hello', (req, res) => {
  res.json({ message: '✅ Hello from the backend!' });
});

// Test route for IF node routing fix
app.post('/api/test-if-routing', (req, res) => {
  const { condition } = req.body;
  const testData = { message: { text: "Hello World" } };
  
  if (condition === true) {
    res.json({
      route: 'true',
      trueOutput: {
        inputData: testData,
        message: 'Routed to TRUE output only'
      },
      falseOutput: null
    });
  } else {
    res.json({
      route: 'false',
      trueOutput: null,
      falseOutput: {
        inputData: testData,
        message: 'Routed to FALSE output only'
      }
    });
  }
});

// Test webhook route (for debugging)
app.post('/api/test-webhook', (req, res) => {
  logger.debug('Test webhook received', { body: req.body });
  console.log('🧪 TEST WEBHOOK HIT:', req.body);
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
// Health check endpoint for monitoring/wake-up
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'workflow-backend',
    version: '1.0.0'
  });
});

app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Backend server with IF node routing fix started on port ${PORT}`);
  logger.info(`Backend server started on port ${PORT}`, { port: PORT });
  
  // TODO: Temporarily disabled database restoration to prevent crashes
  // try {
  //   const { restoreActiveWorkflowsOnStartup } = require('./controllers/workflowController');
  //   await restoreActiveWorkflowsOnStartup();
  // } catch (error) {
  //   console.error('❌ Failed to restore workflows on startup:', error);
  // }
  console.log('⚠️ Database workflow restoration temporarily disabled');
});
