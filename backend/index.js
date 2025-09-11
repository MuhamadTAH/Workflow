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
const languageRoutes = require('./routes/language');
const debugRoutes = require('./routes/debug');
const jobsRoutes = require('./routes/jobs');
const chatRoutes = require('./routes/chat');
const chatTriggerRoutes = require('./routes/chatTrigger');
const chatbotRoutes = require('./routes/chatbot');
const chatWidgetRoutes = require('./routes/chat-widget');
// AI ASSISTANT SYSTEM - New Addition
// AI Assistant routes removed
// WHATSAPP ROUTES
const whatsappRoutes = require('./routes/whatsapp');
// WHATSAPP RECEIVER ROUTES  
const whatsappReceiverRoutes = require('./routes/whatsapp-receiver');
// TELEGRAM LISTENER ROUTES
const telegramListenerRoutes = require('./routes/telegramListener');
// CLAUDE API ROUTES
const claudeRoutes = require('./routes/claude');
// INSTAGRAM COMMENT ROUTES
const { router: instagramCommentRoutes } = require('./routes/instagram-comments');
// INSTAGRAM AI ROUTES
const { router: instagramAIRoutes } = require('./routes/instagram-ai');
// MESSENGER COMMENT ROUTES
const messengerCommentRoutes = require('./routes/messenger-comments');
// MESSENGER AI ROUTES
const { router: messengerAIRoutes } = require('./routes/messenger-ai');
// BILLING ROUTES
const billingRoutes = require('./routes/billing');
// CUSTOM AI ROUTES
const customAIRoutes = require('./routes/customAI');
// ADMIN ROUTES
const adminRoutes = require('./routes/admin');
// API KEYS ROUTES
const apiKeysRoutes = require('./routes/apikeys');
// EXTERNAL CLAUDE API ROUTES (for API key customers)
const externalClaudeRoutes = require('./routes/external-claude');
// NEW ROUTES FROM WORKFLOWNODE
const nodesRoutes = require('./routes/nodes');
// CLIENT AGREEMENTS ROUTES
const clientAgreementsRoutes = require('./routes/clientAgreements');
const { errorHandler, requestLogger } = require('./middleware/errorHandler');
const logger = require('./services/logger');
const DatabaseInitializer = require('./services/dbInitializer');
require('./db'); // Initialize database

const app = express();

// Middleware
app.use(requestLogger); // Log all requests

// Enhanced logging middleware for debugging (filtered)
app.use((req, res, next) => {
  // Skip logging for repetitive polling requests
  const isPollingRequest = req.url.includes('/api/') && req.url.includes('/poll');
  const isHealthCheck = req.url === '/health' || req.url === '/';
  const isWorkflowActivation = req.url.includes('/activate');
  
  if (!isPollingRequest && !isHealthCheck) {
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

// Enhanced CORS fix: Allow all origins including fixdai.com
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // Allow all origins for chat widget functionality
    const allowedOrigins = [
      'https://fixdai.com',
      'https://workflow-lg9z.onrender.com', 
      'https://frontend-dpcg.onrender.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8000',
      'http://127.0.0.1:8000',
      'file://'
    ];
    
    // Allow any localhost port
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow allowed origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow all origins for chat widget (since it's embeddable)
    return callback(null, true);
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
    
    const allowedOrigins = ['https://fixdai.com', 'https://workflow-lg9z.onrender.com', 'http://localhost:3000', 'http://localhost:5173'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin) || !origin) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
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

// AI Assistant Dashboard - REMOVED


// Routes
app.use('/api', authRoutes);
// INSTAGRAM COMMENT ROUTES (must be before webhooks to avoid conflict)
app.use('/api', instagramCommentRoutes);
// INSTAGRAM AI ROUTES
app.use('/api', instagramAIRoutes);
// MESSENGER COMMENT ROUTES (must be before webhooks to avoid conflict)
app.use('/api', messengerCommentRoutes);
// MESSENGER AI ROUTES
app.use('/api', messengerAIRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat-messages', chatRoutes);
app.use('/api/chat-trigger', chatTriggerRoutes);
app.use('/api/v1/chatbot', chatbotRoutes);
app.use('/api/chat-widget', chatWidgetRoutes);
// AI ASSISTANT SYSTEM ROUTES - REMOVED
// WHATSAPP ROUTES
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/whatsapp-receiver', whatsappReceiverRoutes);
// TELEGRAM LISTENER ROUTES
app.use('/api/telegram-listener', telegramListenerRoutes);
// CLAUDE API ROUTES
app.use('/api/claude', claudeRoutes);
// BILLING ROUTES
app.use('/api/billing', billingRoutes);
// CUSTOM AI ROUTES
app.use('/api/custom-ai', customAIRoutes);
// ADMIN ROUTES
app.use('/api/admin', adminRoutes);
// API KEYS ROUTES
app.use('/api/apikeys', apiKeysRoutes);
// EXTERNAL CLAUDE API ROUTES (for API key customers)
app.use('/api/v1', externalClaudeRoutes);

// Chat trigger alias route for frontend compatibility
app.get('/api/chat/:nodeId', (req, res) => {
  // Redirect to chat trigger route
  req.url = `/api/chat-trigger/${req.params.nodeId}`;
  chatTriggerRoutes(req, res, () => {});
});
app.use(languageRoutes);
app.use(debugRoutes);
app.use('/api/jobs', jobsRoutes);
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
// CLIENT AGREEMENTS ROUTES
app.use('/api/client-agreements', clientAgreementsRoutes);

// Root health endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '✅ Workflow Backend API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    dashboard_url: '/dashboard-removed',
    launcher_url: '/dashboard-removed'
  });
});

// AI Assistant Dashboard Routes - REMOVED

// Test route
app.get('/api/hello', (req, res) => {
  res.json({ message: '✅ Hello from the backend!' });
});

// Test endpoint for development changes
app.get('/api/test-change', (req, res) => {
  res.json({ 
    message: '🔥 LIVE RELOAD TEST: Changes work instantly!', 
    timestamp: new Date().toISOString(),
    change: 'Backend changes are now reflected instantly!',
    status: 'Development environment is ready!',
    hotReload: 'Working perfectly! 🎉'
  });
});

// Authentication health check
app.get('/api/auth/health', (req, res) => {
  const db = require('./db');
  
  // Check if user exists
  db.get('SELECT id, email, name FROM users WHERE email = ?', ['mhamadtah548@gmail.com'], (err, user) => {
    if (err) {
      return res.status(500).json({
        status: 'error',
        message: 'Database error',
        error: err.message
      });
    }
    
    res.json({
      status: 'ok',
      message: 'Authentication system healthy',
      userExists: !!user,
      user: user ? { id: user.id, email: user.email, name: user.name } : null,
      jwtSecret: process.env.JWT_SECRET ? 'configured' : 'missing',
      timestamp: new Date().toISOString()
    });
  });
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

// Function to restore Telegram connections on server startup
async function restoreTelegramConnections() {
  console.log('🔄 Restoring Telegram bot connections...');
  
  const db = require('./db');
  const { TelegramAPI } = require('./services/telegramAPI');
  
  return new Promise((resolve) => {
    db.all(
      `SELECT user_id, access_token, platform_username 
       FROM social_connections 
       WHERE platform = 'telegram' AND is_active = 1 AND access_token IS NOT NULL`,
      [],
      async (err, connections) => {
        if (err) {
          console.error('❌ Error fetching Telegram connections:', err);
          return resolve();
        }
        
        console.log(`📱 Found ${connections.length} active Telegram connections to restore`);
        
        for (const connection of connections) {
          try {
            const telegramAPI = new TelegramAPI(connection.access_token);
            
            // Validate the bot token is still valid
            const validation = await telegramAPI.validateToken();
            if (!validation.success) {
              console.warn(`⚠️ Invalid token for user ${connection.user_id}, bot: ${connection.platform_username}`);
              continue;
            }
            
            // DISABLED: Live chat webhook restoration - let AI Assistant control webhooks instead
            console.log(`🚫 SKIPPING webhook restoration for user ${connection.user_id}, bot: ${connection.platform_username}`);
            console.log(`📝 Webhook control transferred to AI Assistant system`);
            
          } catch (error) {
            console.warn(`⚠️ Failed to restore connection for user ${connection.user_id}: ${error.message}`);
          }
        }
        
        console.log('✅ Telegram connection restoration completed');
        resolve();
      }
    );
  });
}

const PORT = process.env.PORT || 3001;

// Create HTTP server for Socket.IO
const http = require('http');
const server = http.createServer(app);

// WebSocket server initialization removed with AI Assistant system

server.listen(PORT, async () => {
  console.log(`🚀 Backend server started on port ${PORT} - v2.0`);
  logger.info(`Backend server started on port ${PORT}`, { port: PORT });
  
  // Initialize critical database data after startup
  try {
    console.log('🔄 Initializing database...');
    await DatabaseInitializer.initialize();
    console.log('✅ Database initialization completed');
  } catch (initError) {
    console.error('❌ Database initialization failed:', initError);
    console.log('⚠️ Server will continue running, but some features may not work properly');
  }
  
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
  
  // Restore Telegram bot connections and webhooks
  try {
    await restoreTelegramConnections();
  } catch (error) {
    console.error('❌ Failed to restore Telegram connections on startup:', error);
  }
  
  // Keep-alive mechanism for Render (prevent cold starts)
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      const axios = require('axios');
      axios.get('https://workflow-lg9z.onrender.com/api/hello')
        .then(() => console.log('🔄 Keep-alive ping sent'))
        .catch(() => console.log('⚠️ Keep-alive ping failed'));
    }, 14 * 60 * 1000); // Ping every 14 minutes
    console.log('🔄 Keep-alive mechanism activated for production');
  }
});
