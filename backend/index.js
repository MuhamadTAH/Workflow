const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Check if JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set, using fallback');
  process.env.JWT_SECRET = 'fallback-secret-key-for-development-only';
}

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const connectionsRoutes = require('./routes/connections');
const productsRoutes = require('./routes/products');
const uploadsRoutes = require('./routes/uploads');
const publicRoutes = require('./routes/public');
const aiRoutes = require('./routes/ai');
const languageRoutes = require('./routes/language');
const workflowRoutes = require('./routes/workflow/workflows');

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://frontend-dpcg.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    
    console.log('🔍 CORS Check - Origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: No origin, allowing request');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin not allowed');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization'],
  preflightContinue: false
};

// Apply CORS globally
app.use(cors(corsOptions));

// Explicit preflight handler for all routes
app.options('*', (req, res) => {
  console.log('🔄 Preflight request received for:', req.path);
  console.log('🔄 Origin:', req.headers.origin);
  console.log('🔄 Method:', req.headers['access-control-request-method']);
  console.log('🔄 Headers:', req.headers['access-control-request-headers']);
  
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Additional CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://frontend-dpcg.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`🌐 [${timestamp}] ${req.method} ${req.path}`);
  
  // Log workflow-related requests with more detail
  if (req.path.startsWith('/api/workflows')) {
    console.log(`🔗 Headers:`, {
      'content-type': req.headers['content-type'],
      'authorization': req.headers.authorization ? 'Bearer ***' : 'None',
      'user-agent': req.headers['user-agent'],
      'origin': req.headers.origin
    });
    
    if (req.method === 'POST' && req.body) {
      console.log(`📋 Body:`, JSON.stringify(req.body, null, 2));
    }
  }
  
  next();
});

// Main application routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/language', languageRoutes);
app.use('/api/workflows', workflowRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Backend is connected!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
