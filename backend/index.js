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
  origin: [
    'https://frontend-dpcg.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
