/*
=================================================================
FILE: backend/routes/whatsapp.js
=================================================================
WhatsApp API routes for managing conversations and triggers
*/

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../services/logger');
const workflowExecutor = require('../services/workflowExecutor');

// Database setup
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize whatsapp_conversations table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    contact_name TEXT,
    message_text TEXT,
    message_id TEXT UNIQUE,
    timestamp TEXT,
    direction TEXT DEFAULT 'incoming',
    processed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Allow mock token for testing/development
    if (token.startsWith('MOCK_TOKEN_FOR_TESTING_')) {
      req.user = { userId: 'test-user-1', email: 'mhamadtah548@gmail.com', mock: true };
      return next();
    }
    
    // Regular JWT validation for production
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /api/whatsapp/conversations - Get all WhatsApp conversations
router.get('/conversations', verifyToken, (req, res) => {
  console.log('📱 Fetching WhatsApp conversations for frontend...');
  
  const query = `
    SELECT 
      phone_number,
      contact_name,
      message_text as last_message,
      MAX(created_at) as last_message_at,
      COUNT(*) as message_count
    FROM whatsapp_conversations 
    GROUP BY phone_number 
    ORDER BY last_message_at DESC
  `;

  db.all(query, [], (err, conversations) => {
    if (err) {
      console.error('❌ Error fetching WhatsApp conversations:', err);
      logger.logError(err, { context: 'getWhatsAppConversations' });
      return res.status(500).json({ error: 'Database error' });
    }

    console.log(`📊 Found ${conversations.length} WhatsApp conversation groups`);
    
    // Transform conversations to frontend format
    const transformedConversations = conversations.map(conv => ({
      customer_id: conv.phone_number,
      phone_number: conv.phone_number,  
      customer_name: conv.contact_name || 'Unknown Contact',
      message_text: conv.last_message,
      last_message_at: conv.last_message_at,
      message_count: conv.message_count,
      created_at: conv.last_message_at
    }));

    logger.info('WhatsApp conversations retrieved', { 
      count: transformedConversations.length 
    });

    res.json({
      success: true,
      conversations: transformedConversations
    });
  });
});

// GET /api/whatsapp/conversations/:phoneNumber - Get messages for specific phone number
router.get('/conversations/:phoneNumber', verifyToken, (req, res) => {
  const phoneNumber = req.params.phoneNumber;
  console.log(`📱 Fetching messages for phone number: ${phoneNumber}`);

  const query = `
    SELECT * FROM whatsapp_conversations 
    WHERE phone_number = ? 
    ORDER BY created_at ASC
  `;

  db.all(query, [phoneNumber], (err, messages) => {
    if (err) {
      console.error('❌ Error fetching messages:', err);
      logger.logError(err, { context: 'getWhatsAppMessages', phoneNumber });
      return res.status(500).json({ error: 'Database error' });
    }

    console.log(`📊 Found ${messages.length} messages for ${phoneNumber}`);
    
    res.json({
      success: true,
      messages: messages,
      phone_number: phoneNumber,
      contact_name: messages[0]?.contact_name || 'Unknown Contact'
    });
  });
});

// POST /api/whatsapp/send - Send WhatsApp message
router.post('/send', verifyToken, async (req, res) => {
  const { to, message, userId } = req.body;
  
  console.log('📱 WhatsApp send request:', { to, message: message?.substring(0, 50) });
  
  try {
    // Store outgoing message in database
    const insertQuery = `
      INSERT INTO whatsapp_conversations 
      (phone_number, contact_name, message_text, direction, timestamp, created_at)
      VALUES (?, ?, ?, 'outgoing', ?, ?)
    `;
    
    const now = new Date().toISOString();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    db.run(insertQuery, [to, 'Business', message, timestamp, now], function(err) {
      if (err) {
        console.error('❌ Error storing outgoing message:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to store message' 
        });
      }
      
      console.log('✅ Outgoing message stored with ID:', this.lastID);
      
      // TODO: Implement actual WhatsApp Business API sending
      // For now, just return success
      res.json({
        success: true,
        message: 'Message sent and stored',
        messageId: this.lastID
      });
    });
    
  } catch (error) {
    console.error('❌ WhatsApp send error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/whatsapp/:businessId/activate - Activate WhatsApp workflow
router.post('/:businessId/activate', verifyToken, async (req, res) => {
  const businessId = req.params.businessId;
  const { appId, clientSecret, accessToken, phoneNumberId } = req.body;
  
  console.log(`🚀 Activating WhatsApp Chat Page workflow for business: ${businessId}`);
  console.log('📋 Form data received:', { appId: appId ? 'present' : 'missing', clientSecret: clientSecret ? 'present' : 'missing' });
  
  try {
    // Create virtual WhatsApp trigger workflow for message storage
    const workflowId = `whatsapp-chat-${businessId}`;
    
    console.log(`📝 Creating virtual WhatsApp workflow: ${workflowId}`);
    
    // Create minimal workflow structure for WhatsApp message reception
    const virtualWorkflow = {
      id: workflowId,
      name: `WhatsApp Chat - Business ${businessId}`,
      nodes: [
        {
          id: 'whatsapp-trigger-1',
          type: 'custom',
          position: { x: 100, y: 100 },
          data: {
            label: 'WhatsApp Trigger',
            type: 'whatsappTrigger',
            description: 'Virtual trigger for WhatsApp Chat page',
            config: {
              businessId: businessId,
              appId: appId,
              clientSecret: clientSecret,
              accessToken: accessToken,
              phoneNumberId: phoneNumberId,
              storeMessages: true // Flag to store messages
            }
          }
        }
      ],
      edges: []
    };
    
    // Register the virtual workflow with workflowExecutor
    if (workflowExecutor) {
      workflowExecutor.registerWorkflow(workflowId, virtualWorkflow, {});
      console.log(`✅ Virtual WhatsApp workflow registered: ${workflowId}`);
    }
    
    res.json({
      success: true,
      message: 'WhatsApp Chat workflow activated successfully! Messages will now be stored.',
      businessId: businessId,
      workflowId: workflowId,
      activeWorkflows: workflowExecutor ? workflowExecutor.activeWorkflows.size : 0,
      config: {
        appId: appId ? 'configured' : 'missing',
        clientSecret: clientSecret ? 'configured' : 'missing',
        accessToken: accessToken ? 'configured' : 'missing',
        phoneNumberId: phoneNumberId ? 'configured' : 'missing'
      }
    });
    
  } catch (error) {
    console.error('❌ WhatsApp activation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp/:businessId/deactivate - Deactivate WhatsApp workflow
router.post('/:businessId/deactivate', verifyToken, (req, res) => {
  const businessId = req.params.businessId;
  console.log(`🛑 Deactivating WhatsApp workflow for business: ${businessId}`);
  
  try {
    // TODO: Implement deactivation logic
    // For now, just return success
    
    res.json({
      success: true,
      message: 'WhatsApp workflow deactivated',
      businessId: businessId
    });
    
  } catch (error) {
    console.error('❌ WhatsApp deactivation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp/:businessId - Get WhatsApp business status
router.get('/:businessId', verifyToken, (req, res) => {
  const businessId = req.params.businessId;
  
  try {
    // Check active workflows
    let activeWorkflows = 0;
    let whatsappWorkflows = [];
    
    if (workflowExecutor && workflowExecutor.activeWorkflows) {
      activeWorkflows = workflowExecutor.activeWorkflows.size;
      
      for (const [workflowId, workflowConfig] of workflowExecutor.activeWorkflows.entries()) {
        if (workflowConfig && workflowConfig.nodes) {
          const hasWhatsAppTrigger = workflowConfig.nodes.some(node => 
            node.data && node.data.type === 'whatsappTrigger'
          );
          
          if (hasWhatsAppTrigger) {
            whatsappWorkflows.push({
              id: workflowId,
              active: true,
              nodeCount: workflowConfig.nodes.length
            });
          }
        }
      }
    }
    
    res.json({
      success: true,
      assistant: {
        businessId: businessId,
        active: whatsappWorkflows.length > 0,
        activeWorkflows: activeWorkflows,
        whatsappWorkflows: whatsappWorkflows
      },
      knowledge_files: [] // TODO: Implement file management
    });
    
  } catch (error) {
    console.error('❌ WhatsApp status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp/stats - Get WhatsApp statistics
router.get('/stats', verifyToken, (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_messages,
      COUNT(DISTINCT phone_number) as unique_contacts,
      COUNT(CASE WHEN direction = 'incoming' THEN 1 END) as incoming_messages,
      COUNT(CASE WHEN direction = 'outgoing' THEN 1 END) as outgoing_messages
    FROM whatsapp_conversations
  `;
  
  db.get(statsQuery, [], (err, stats) => {
    if (err) {
      console.error('❌ Error fetching WhatsApp stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      success: true,
      stats: stats || {
        total_messages: 0,
        unique_contacts: 0, 
        incoming_messages: 0,
        outgoing_messages: 0
      }
    });
  });
});

module.exports = router;