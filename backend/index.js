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
const jobsRoutes = require('./routes/jobs');
// NEW ROUTES FROM WORKFLOWNODE
const nodesRoutes = require('./routes/nodes');
// chatMessages routes removed
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
  const isWorkflowActivation = req.url.includes('/activate');
  
  if (!isChatPolling && !isHealthCheck) {
    const logLevel = isWorkflowActivation ? '🚨 WORKFLOW ACTIVATION' : '🌐 INCOMING REQUEST';
    console.log(logLevel + ':', {
      method: req.method,
      url: req.url,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 50),
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      authorization: req.headers.authorization ? 'present' : 'missing',
      timestamp: new Date().toISOString()
    });
    
    // Enhanced logging for POST requests with body data
    if (req.method === 'POST' && isWorkflowActivation) {
      console.log('📦 ACTIVATION REQUEST BODY PREVIEW:', {
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        workflowPresent: !!(req.body?.workflow),
        nodeCount: req.body?.workflow?.nodes?.length || 0,
        edgeCount: req.body?.workflow?.edges?.length || 0
      });
    }
  }
  next();
});

// More permissive CORS configuration for debugging
app.use(cors({
  origin: function(origin, callback) {
    console.log('🔍 CORS Check - Origin:', origin);
    
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ CORS: No origin header, allowing');
      return callback(null, true);
    }
    
    // Allow all localhost origins for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      console.log('✅ CORS: Localhost origin, allowing');
      return callback(null, true);
    }
    
    // Allow specific origins
    const allowedOrigins = [
      'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 
      'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 
      'http://localhost:5179', 'http://localhost:3000',
      // Production frontend and backend (for self-referencing)
      'https://frontend-dpcg.onrender.com',
      'https://workflow-lg9z.onrender.com'
    ];
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS allowed origin:', origin);
      return callback(null, true);
    }
    
    // Temporary: Allow all .onrender.com origins for debugging
    if (origin.includes('.onrender.com')) {
      console.log('⚠️ CORS: Allowing .onrender.com origin for debugging:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    console.log('🔍 Allowed origins:', allowedOrigins);
    return callback(new Error('Not allowed by CORS'), false);
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

// Create shared nodeMessages map for inter-component communication
const nodeMessages = new Map();
app.set('nodeMessages', nodeMessages);

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Serve static public files (including hosted chat page)
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
app.use('/api/jobs', jobsRoutes);
// chatMessages routes removed
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

// Root health endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '✅ Workflow Backend API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Test route
app.get('/api/hello', (req, res) => {
  res.json({ message: '✅ Hello from the backend!' });
});


// Debug endpoint to test activation flow
app.post('/api/debug/test-activation', (req, res) => {
  console.log('🧪 DEBUG ACTIVATION TEST:', {
    method: req.method,
    url: req.url,
    headers: Object.keys(req.headers),
    body: req.body,
    timestamp: new Date().toISOString()
  });
  
  res.json({
    success: true,
    message: 'Debug activation test successful',
    receivedData: {
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodySize: req.body ? JSON.stringify(req.body).length : 0
    },
    timestamp: new Date().toISOString()
  });
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
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Backend server with IF node routing fix started on port ${PORT}`);
  logger.info(`Backend server started on port ${PORT}`, { port: PORT });
  
  // Initialize scheduler and job queue with workflow executor
  try {
    const scheduler = require('./services/scheduler');
    const jobQueue = require('./services/jobQueue');
    const workflowExecutor = require('./services/workflowExecutor');
    
    scheduler.setWorkflowExecutor(workflowExecutor);
    jobQueue.setWorkflowExecutor(workflowExecutor);
    
    console.log('📅 Scheduler initialized successfully');
    console.log('🔄 Job Queue initialized successfully');
  } catch (error) {
    console.warn('⚠️ Failed to initialize scheduler/queue:', error.message);
  }
  
  // Restore active workflows from database
  try {
    const { restoreActiveWorkflowsOnStartup } = require('./controllers/workflowController');
    await restoreActiveWorkflowsOnStartup();
  } catch (error) {
    console.error('❌ Failed to restore workflows on startup:', error);
  }
});
