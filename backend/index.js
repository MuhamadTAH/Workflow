require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
// Agent routes removed - not needed for e-commerce platform
const connectionsRoutes = require('./routes/connections');
const shopsRoutes = require('./routes/shops');
const productsRoutes = require('./routes/products');
const publicRoutes = require('./routes/public');
const uploadsRoutes = require('./routes/uploads');
const aiRoutes = require('./routes/ai');
const workflowRoutes = require('./workflow/routes/workflows');
// Chat, language, and debug routes removed - not needed for e-commerce platform
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
// Agent routes removed
app.use('/api/connections', connectionsRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/workflow', workflowRoutes);
// Chat, language, and debug routes removed

// Test route
app.get('/api/hello', (req, res) => {
  res.json({ message: '✅ Hello from the backend!' });
});

// Test route for shop validation
app.post('/api/test-shop-validation', (req, res) => {
  const { shopData } = req.body;
  
  // Basic shop validation
  const isValid = shopData && shopData.name && shopData.description;
  
  res.json({
    valid: isValid,
    message: isValid ? 'Shop data is valid' : 'Shop data validation failed',
    timestamp: new Date().toISOString()
  });
});

// Test API route (for debugging)
app.post('/api/test-api', (req, res) => {
  logger.debug('Test API call received', { body: req.body });
  console.log('🧪 TEST API HIT:', req.body);
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
    service: 'ecommerce-backend',
    version: '1.0.0'
  });
});

app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — keeps the process alive and returns JSON
// Must be the last app.use
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message || String(err) });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 E-commerce backend server started on port ${PORT}`);
  logger.info(`Backend server started on port ${PORT}`, { port: PORT });
  
  console.log('✅ E-commerce platform ready for connections');
});
