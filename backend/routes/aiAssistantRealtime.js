/*
=================================================================
AI ASSISTANT REALTIME FEATURES
=================================================================
Real-time features for AI Assistant system:
- WebSocket connections for live updates
- Real-time conversation monitoring
- Live analytics dashboard
- Instant notifications
- Performance monitoring
*/

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const router = express.Router();
const db = require('../db');

class RealtimeManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket connections
    this.activeMonitors = new Map(); // assistantId -> monitoring users
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: "*", // Configure based on your frontend domain
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('🔌 New WebSocket connection:', socket.id);
      
      // Handle user authentication
      socket.on('authenticate', (data) => {
        this.handleAuthentication(socket, data);
      });

      // Handle assistant monitoring
      socket.on('monitor_assistant', (data) => {
        this.handleAssistantMonitoring(socket, data);
      });

      // Handle stop monitoring
      socket.on('stop_monitoring', (data) => {
        this.handleStopMonitoring(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Handle user authentication for WebSocket
   */
  handleAuthentication(socket, data) {
    try {
      const { token, userId } = data;
      
      // Verify JWT token (simplified)
      if (token && token.startsWith('MOCK_TOKEN_FOR_TESTING_')) {
        socket.userId = 'test-user-1';
        socket.authenticated = true;
        
        // Store connection
        if (!this.connectedUsers.has(socket.userId)) {
          this.connectedUsers.set(socket.userId, new Set());
        }
        this.connectedUsers.get(socket.userId).add(socket);
        
        socket.emit('authenticated', { success: true, userId: socket.userId });
        console.log('✅ Socket authenticated for user:', socket.userId);
      } else {
        socket.emit('authentication_error', { error: 'Invalid token' });
      }
    } catch (error) {
      console.error('❌ WebSocket authentication failed:', error);
      socket.emit('authentication_error', { error: 'Authentication failed' });
    }
  }

  /**
   * Handle assistant monitoring subscription
   */
  handleAssistantMonitoring(socket, data) {
    if (!socket.authenticated) {
      socket.emit('error', { error: 'Not authenticated' });
      return;
    }

    const { assistantId } = data;
    
    // Verify user owns this assistant
    db.get(`
      SELECT id, name FROM ai_assistants 
      WHERE id = ? AND user_id = ?
    `, [assistantId, socket.userId], (err, assistant) => {
      if (err || !assistant) {
        socket.emit('monitor_error', { 
          error: 'Assistant not found or access denied',
          assistantId 
        });
        return;
      }

      // Add to monitoring
      if (!this.activeMonitors.has(assistantId)) {
        this.activeMonitors.set(assistantId, new Set());
      }
      this.activeMonitors.get(assistantId).add(socket);
      
      socket.monitoredAssistants = socket.monitoredAssistants || new Set();
      socket.monitoredAssistants.add(assistantId);
      
      socket.emit('monitoring_started', { 
        assistantId, 
        assistantName: assistant.name,
        message: 'Real-time monitoring active'
      });
      
      console.log(`👀 User ${socket.userId} started monitoring assistant ${assistantId}`);
    });
  }

  /**
   * Handle stop monitoring
   */
  handleStopMonitoring(socket, data) {
    const { assistantId } = data;
    
    if (this.activeMonitors.has(assistantId)) {
      this.activeMonitors.get(assistantId).delete(socket);
      
      if (this.activeMonitors.get(assistantId).size === 0) {
        this.activeMonitors.delete(assistantId);
      }
    }
    
    if (socket.monitoredAssistants) {
      socket.monitoredAssistants.delete(assistantId);
    }
    
    socket.emit('monitoring_stopped', { assistantId });
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(socket) {
    console.log('🔌 WebSocket disconnected:', socket.id);
    
    // Remove from connected users
    if (socket.userId && this.connectedUsers.has(socket.userId)) {
      this.connectedUsers.get(socket.userId).delete(socket);
      
      if (this.connectedUsers.get(socket.userId).size === 0) {
        this.connectedUsers.delete(socket.userId);
      }
    }
    
    // Remove from all monitoring
    if (socket.monitoredAssistants) {
      socket.monitoredAssistants.forEach(assistantId => {
        if (this.activeMonitors.has(assistantId)) {
          this.activeMonitors.get(assistantId).delete(socket);
          
          if (this.activeMonitors.get(assistantId).size === 0) {
            this.activeMonitors.delete(assistantId);
          }
        }
      });
    }
  }

  /**
   * Broadcast new conversation to monitoring users
   */
  broadcastNewConversation(assistantId, conversationData) {
    if (this.activeMonitors.has(assistantId)) {
      this.activeMonitors.get(assistantId).forEach(socket => {
        socket.emit('new_conversation', {
          assistantId,
          conversation: conversationData,
          timestamp: new Date().toISOString()
        });
      });
      
      console.log(`📡 Broadcasted new conversation for assistant ${assistantId} to ${this.activeMonitors.get(assistantId).size} monitors`);
    }
  }

  /**
   * Broadcast assistant status change
   */
  broadcastStatusChange(assistantId, newStatus, userId) {
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId).forEach(socket => {
        socket.emit('assistant_status_change', {
          assistantId,
          status: newStatus,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  /**
   * Broadcast performance metrics update
   */
  broadcastMetricsUpdate(assistantId, metrics) {
    if (this.activeMonitors.has(assistantId)) {
      this.activeMonitors.get(assistantId).forEach(socket => {
        socket.emit('metrics_update', {
          assistantId,
          metrics,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  /**
   * Broadcast system alerts
   */
  broadcastAlert(userId, alertData) {
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId).forEach(socket => {
        socket.emit('system_alert', {
          ...alertData,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return {
      total_connections: Array.from(this.connectedUsers.values()).reduce((sum, sockets) => sum + sockets.size, 0),
      connected_users: this.connectedUsers.size,
      monitored_assistants: this.activeMonitors.size,
      total_monitors: Array.from(this.activeMonitors.values()).reduce((sum, sockets) => sum + sockets.size, 0)
    };
  }
}

// Global instance
const realtimeManager = new RealtimeManager();

// =================================================================
// REST API ENDPOINTS FOR REALTIME FEATURES
// =================================================================

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    if (token.startsWith('MOCK_TOKEN_FOR_TESTING_')) {
      req.user = { userId: 'test-user-1', email: 'mhamadtah548@gmail.com', mock: true };
      return next();
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/realtime/connection-stats - Get WebSocket connection statistics
// Frontend: System admin dashboard
router.get('/connection-stats', verifyToken, (req, res) => {
  try {
    const stats = realtimeManager.getConnectionStats();
    
    res.json({
      success: true,
      stats,
      server_uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting connection stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/realtime/broadcast-alert - Send alert to specific user
// Frontend: Admin panel "Send Alert" button
router.post('/broadcast-alert', verifyToken, async (req, res) => {
  try {
    const { target_user_id, alert_type, message, severity = 'info' } = req.body;
    
    const alertData = {
      type: alert_type,
      message,
      severity, // 'info', 'warning', 'error', 'success'
      from_admin: true,
      sender_id: req.user.userId
    };
    
    realtimeManager.broadcastAlert(target_user_id, alertData);
    
    res.json({
      success: true,
      message: 'Alert broadcasted successfully',
      alert_data: alertData
    });
  } catch (error) {
    console.error('❌ Error broadcasting alert:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/realtime/live-conversations/:assistantId - Get live conversation stream
// Frontend: Real-time conversation feed
router.get('/live-conversations/:assistantId', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.assistantId;
    const userId = req.user.userId;
    
    // Verify assistant ownership
    const assistant = await new Promise((resolve, reject) => {
      db.get(`
        SELECT id, name, status FROM ai_assistants 
        WHERE id = ? AND user_id = ?
      `, [assistantId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'Assistant not found'
      });
    }
    
    // Get recent conversations for initial load
    const recentConversations = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          customer_id, customer_name, customer_username,
          message_text, response_text, response_time_ms,
          success, language_detected, sentiment_score, created_at
        FROM ai_conversations 
        WHERE assistant_id = ?
        ORDER BY created_at DESC
        LIMIT 20
      `, [assistantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    res.json({
      success: true,
      assistant: {
        id: assistant.id,
        name: assistant.name,
        status: assistant.status
      },
      recent_conversations: recentConversations.reverse(), // Chronological order
      websocket_info: {
        endpoint: '/socket.io',
        events: {
          monitor: 'monitor_assistant',
          new_conversation: 'new_conversation',
          status_change: 'assistant_status_change'
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting live conversations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/realtime/performance/:assistantId - Get real-time performance metrics
// Frontend: Live performance dashboard
router.get('/performance/:assistantId', verifyToken, async (req, res) => {
  try {
    const assistantId = req.params.assistantId;
    const userId = req.user.userId;
    const { interval = '1h' } = req.query; // '1h', '24h', '7d'
    
    // Verify assistant ownership
    const assistant = await new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_assistants 
        WHERE id = ? AND user_id = ?
      `, [assistantId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!assistant) {
      return res.status(404).json({
        success: false,
        error: 'Assistant not found'
      });
    }
    
    // Get time-based metrics
    let timeFilter = '';
    switch (interval) {
      case '1h':
        timeFilter = "datetime('now', '-1 hour')";
        break;
      case '24h':
        timeFilter = "datetime('now', '-24 hours')";
        break;
      case '7d':
        timeFilter = "datetime('now', '-7 days')";
        break;
      default:
        timeFilter = "datetime('now', '-1 hour')";
    }
    
    const metrics = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          strftime('%Y-%m-%d %H:00:00', created_at) as hour,
          COUNT(*) as conversations,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
          AVG(response_time_ms) as avg_response_time,
          AVG(CASE WHEN sentiment_score IS NOT NULL THEN sentiment_score ELSE 0 END) as avg_sentiment
        FROM ai_conversations 
        WHERE assistant_id = ? AND created_at >= ${timeFilter}
        GROUP BY strftime('%Y-%m-%d %H:00:00', created_at)
        ORDER BY hour
      `, [assistantId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    // Calculate current performance
    const currentPerformance = {
      status: assistant.status,
      total_conversations: assistant.total_conversations,
      success_rate: assistant.total_conversations > 0 
        ? Math.round((assistant.successful_responses / assistant.total_conversations) * 100)
        : 0,
      active_monitors: realtimeManager.activeMonitors.has(assistantId) 
        ? realtimeManager.activeMonitors.get(assistantId).size 
        : 0
    };
    
    res.json({
      success: true,
      assistant_id: assistantId,
      interval,
      current_performance: currentPerformance,
      time_series: metrics,
      realtime_info: {
        websocket_connected: realtimeManager.activeMonitors.has(assistantId),
        monitoring_users: realtimeManager.activeMonitors.has(assistantId) 
          ? realtimeManager.activeMonitors.get(assistantId).size 
          : 0
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/realtime/test-websocket - Test WebSocket connection
// Frontend: "Test Connection" button in settings
router.post('/test-websocket', verifyToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const testData = {
      type: 'connection_test',
      message: 'WebSocket connection test from server',
      test_id: Date.now()
    };
    
    // Send test alert to user
    realtimeManager.broadcastAlert(userId, testData);
    
    res.json({
      success: true,
      message: 'Test message sent via WebSocket',
      test_data: testData,
      connection_stats: realtimeManager.getConnectionStats()
    });
  } catch (error) {
    console.error('❌ Error testing WebSocket:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export both the router and the realtimeManager
module.exports = {
  router,
  realtimeManager
};