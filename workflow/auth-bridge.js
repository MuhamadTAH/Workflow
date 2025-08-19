const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: [
    'https://frontend-dpcg.onrender.com',
    'https://workflow-lg9z.onrender.com',
    'http://localhost:5173',
    'http://localhost:5678'
  ],
  credentials: true
}));

app.use(express.json());

// JWT Secret (should match your main backend)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Auth Bridge Route
 * Validates JWT token from main app and creates n8n session
 */
app.post('/api/auth/validate', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify the JWT token from main app
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Token is valid - user can access n8n
    res.json({
      success: true,
      user: {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email
      },
      n8nUrl: process.env.N8N_URL || 'http://localhost:5678'
    });

  } catch (error) {
    console.error('Auth validation error:', error);
    res.status(401).json({ 
      error: 'Invalid token',
      message: error.message 
    });
  }
});

/**
 * Health Check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'N8N Auth Bridge',
    timestamp: new Date().toISOString()
  });
});

/**
 * N8N Proxy Route (optional)
 * Forwards requests to n8n instance
 */
app.all('/api/n8n/*', async (req, res) => {
  const n8nUrl = process.env.N8N_URL || 'http://localhost:5678';
  const targetUrl = req.url.replace('/api/n8n', '');
  
  // Forward request to n8n (implementation needed)
  res.json({
    message: 'N8N proxy not implemented yet',
    targetUrl: n8nUrl + targetUrl
  });
});

app.listen(PORT, () => {
  console.log(`🔗 N8N Auth Bridge running on port ${PORT}`);
  console.log(`🌐 N8N URL: ${process.env.N8N_URL || 'http://localhost:5678'}`);
});