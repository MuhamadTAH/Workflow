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

const app = express();
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Main application routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/connections', connectionsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/language', languageRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Backend is connected!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
