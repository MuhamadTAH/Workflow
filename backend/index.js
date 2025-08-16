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

const app = express();
app.use(cors());
app.use(express.json());

// Main application routes
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Backend is connected!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
