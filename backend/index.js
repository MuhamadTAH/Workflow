// /backend/index.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const workflowRoutes = require('./workflow'); // Import the workflow module

const app = express();
app.use(cors());
app.use(express.json());

// Main application routes
app.use('/api/auth', authRoutes);
app.use('/api/shop', shopRoutes);

// Register the new workflow routes under the /api/workflow prefix
app.use('/api/workflow', workflowRoutes);

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: '✅ Backend is connected!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
