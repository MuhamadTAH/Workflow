const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// GET /api/connections - Get user's connected accounts
router.get('/', verifyToken, (req, res) => {
  try {
    try {
      const stmt = db.prepare(
        `SELECT 
          platform, 
          platform_user_id, 
          platform_username, 
          platform_profile_url,
          connected_at, 
          updated_at,
          is_active 
        FROM social_connections 
        WHERE user_id = ? AND is_active = 1`
      );
      const connections = stmt.all(req.user.userId);

      // Transform to object format for easier frontend handling
      const connectionsObj = {};
      connections.forEach(conn => {
        connectionsObj[conn.platform] = {
          platform: conn.platform,
          username: conn.platform_username,
          userId: conn.platform_user_id,
          profileUrl: conn.platform_profile_url,
          connectedAt: conn.connected_at,
          updatedAt: conn.updated_at,
          isActive: conn.is_active
        };
      });

      res.json({
        connections: connectionsObj,
        total: connections.length
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ message: 'Database error' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/connections/:platform - Initiate connection (mock OAuth for now)
router.post('/:platform', verifyToken, (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.userId;

    // Validate platform
    const validPlatforms = ['tiktok', 'youtube', 'facebook', 'instagram', 'telegram', 'whatsapp', 'twitter', 'linkedin'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    // For now, create a mock connection (later we'll implement real OAuth)
    const mockConnection = {
      platform_user_id: `mock_${platform}_${Date.now()}`,
      platform_username: `user_${platform}`,
      platform_profile_url: `https://${platform}.com/user_${platform}`,
      access_token: `mock_token_${platform}_${Date.now()}`,
      refresh_token: `mock_refresh_${platform}_${Date.now()}`,
      token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    // Insert or update connection
    try {
      const stmt = db.prepare(
        `INSERT OR REPLACE INTO social_connections 
          (user_id, platform, access_token, refresh_token, token_expires_at, 
           platform_user_id, platform_username, platform_profile_url, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      );
      stmt.run(
        userId,
        platform,
        mockConnection.access_token,
        mockConnection.refresh_token,
        mockConnection.token_expires_at,
        mockConnection.platform_user_id,
        mockConnection.platform_username,
        mockConnection.platform_profile_url
      );

      res.json({
        message: 'Connection created successfully',
        connection: {
          platform: platform,
          username: mockConnection.platform_username,
          userId: mockConnection.platform_user_id,
          profileUrl: mockConnection.platform_profile_url,
          connectedAt: new Date().toISOString()
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ message: 'Error creating connection' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/connections/:platform - Disconnect account
router.delete('/:platform', verifyToken, (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.userId;

    try {
      const stmt = db.prepare('UPDATE social_connections SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND platform = ?');
      const result = stmt.run(userId, platform);

      if (result.changes === 0) {
        return res.status(404).json({ message: 'Connection not found' });
      }

      res.json({
        message: 'Account disconnected successfully',
        platform: platform
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ message: 'Error disconnecting account' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/connections/status - Check all connection statuses
router.get('/status', verifyToken, (req, res) => {
  try {
    try {
      const stmt = db.prepare('SELECT platform, is_active FROM social_connections WHERE user_id = ?');
      const connections = stmt.all(req.user.userId);

      const statusObj = {};
      connections.forEach(conn => {
        statusObj[conn.platform] = conn.is_active === 1;
      });

      res.json({
        status: statusObj,
        total: connections.filter(c => c.is_active === 1).length
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ message: 'Database error' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;