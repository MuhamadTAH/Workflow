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
const chatRoutes = require('./routes/chat');
const aiRoutes = require('./routes/ai');
// NEW ROUTES FROM WORKFLOWNODE
const nodesRoutes = require('./routes/nodes');
const { errorHandler, requestLogger } = require('./middleware/errorHandler');
const logger = require('./services/logger');
require('./db'); // Initialize database

const app = express();

// Middleware
app.use(requestLogger); // Log all requests

// Enhanced logging middleware for debugging
app.use((req, res, next) => {
  console.log('🌐 INCOMING REQUEST:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    timestamp: new Date().toISOString()
  });
  next();
});

// More permissive CORS configuration for debugging
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all localhost origins for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    // Allow specific origins
    const allowedOrigins = [
      'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 
      'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 
      'http://localhost:5179', 'http://localhost:3000'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'X-Requested-With', 
    'Access-Control-Allow-Headers', 
    'Access-Control-Request-Headers',
    'Access-Control-Request-Method',
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Explicit preflight handler for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('🔧 Handling OPTIONS preflight request:', {
      origin: req.headers.origin,
      method: req.headers['access-control-request-method'],
      headers: req.headers['access-control-request-headers']
    });
    
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With, Access-Control-Allow-Headers, Origin, Cache-Control, Pragma');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
    return;
  }
  next();
});
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
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);
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

// Debug route specifically for chat webhooks
app.post('/api/chat/webhook/debug', (req, res) => {
  console.log('🐛 DEBUG WEBHOOK HIT - Chat webhook working!');
  console.log('Request body:', req.body);
  res.json({
    success: true,
    message: 'Debug webhook hit successfully!',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Universal debug route to catch ALL webhook requests
app.use('/api/chat/webhook/*', (req, res, next) => {
  console.log('🔍 WEBHOOK REQUEST INTERCEPTED:', {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    params: req.params,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers['origin'],
      'referer': req.headers['referer']
    },
    timestamp: new Date().toISOString()
  });
  next();
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
  console.log(`🚀 Backend server with IF node routing fix started on port ${PORT}`);
  logger.info(`Backend server started on port ${PORT}`, { port: PORT });
});
