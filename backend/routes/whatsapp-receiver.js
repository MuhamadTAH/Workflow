/*
=================================================================
FILE: backend/routes/whatsapp-receiver.js
=================================================================
WhatsApp Receiver API routes for standalone message receiving
*/

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../services/logger');

// Database setup
const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize whatsapp_receiver_messages table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS whatsapp_receiver_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone_number TEXT NOT NULL,
    contact_name TEXT,
    message_text TEXT,
    message_id TEXT UNIQUE,
    message_type TEXT DEFAULT 'text',
    timestamp TEXT,
    raw_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Global state for WhatsApp receiver
let receiverState = {
  isActive: false,
  appId: null,
  clientSecret: null,
  activatedAt: null
};

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

// POST /api/whatsapp-receiver/activate - Activate WhatsApp message receiver
router.post('/activate', verifyToken, async (req, res) => {
  const { appId, clientSecret } = req.body;
  
  console.log('🚀 Activating WhatsApp message receiver...');
  console.log('📋 Credentials:', { 
    appId: appId ? 'present' : 'missing', 
    clientSecret: clientSecret ? 'present' : 'missing' 
  });
  
  try {
    // Validate input
    if (!appId || !clientSecret) {
      return res.status(400).json({
        success: false,
        error: 'App ID and Client Secret are required'
      });
    }

    // Clear previous messages when activating
    db.run('DELETE FROM whatsapp_receiver_messages', [], (err) => {
      if (err) {
        console.error('❌ Error clearing previous messages:', err);
      } else {
        console.log('🧹 Previous messages cleared');
      }
    });

    // Update receiver state
    receiverState = {
      isActive: true,
      appId: appId.trim(),
      clientSecret: clientSecret.trim(),
      activatedAt: new Date().toISOString()
    };
    
    console.log('✅ WhatsApp receiver activated successfully');
    console.log('📡 Webhook URL:', `${req.protocol}://${req.get('host')}/api/webhooks/whatsapp`);
    
    res.json({
      success: true,
      message: 'WhatsApp receiver activated successfully! Ready to receive messages.',
      webhookUrl: `${req.protocol}://${req.get('host')}/api/webhooks/whatsapp`,
      status: {
        isActive: true,
        activatedAt: receiverState.activatedAt
      }
    });
    
  } catch (error) {
    console.error('❌ WhatsApp receiver activation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/whatsapp-receiver/deactivate - Deactivate WhatsApp message receiver
router.post('/deactivate', verifyToken, (req, res) => {
  console.log('🛑 Deactivating WhatsApp message receiver...');
  
  try {
    // Update receiver state
    receiverState = {
      isActive: false,
      appId: null,
      clientSecret: null,
      activatedAt: null
    };
    
    console.log('✅ WhatsApp receiver deactivated successfully');
    
    res.json({
      success: true,
      message: 'WhatsApp receiver deactivated successfully',
      status: {
        isActive: false,
        deactivatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ WhatsApp receiver deactivation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/whatsapp-receiver/messages - Get received messages
router.get('/messages', verifyToken, (req, res) => {
  console.log('📱 Fetching WhatsApp receiver messages...');
  
  const query = `
    SELECT 
      phone_number,
      contact_name,
      message_text as text,
      message_id,
      message_type,
      timestamp,
      created_at
    FROM whatsapp_receiver_messages 
    ORDER BY created_at DESC
    LIMIT 100
  `;

  db.all(query, [], (err, messages) => {
    if (err) {
      console.error('❌ Error fetching messages:', err);
      logger.logError(err, { context: 'getWhatsAppReceiverMessages' });
      return res.status(500).json({ error: 'Database error' });
    }

    console.log(`📊 Found ${messages.length} messages`);
    
    // Transform messages for frontend
    const transformedMessages = messages.map(msg => ({
      phoneNumber: msg.phone_number,
      from: msg.phone_number,
      fromName: msg.contact_name || 'Unknown Contact',
      text: msg.text,
      message: msg.text,
      messageId: msg.message_id,
      messageType: msg.message_type || 'text',
      timestamp: msg.timestamp || msg.created_at,
      createdAt: msg.created_at
    }));

    res.json({
      success: true,
      messages: transformedMessages,
      status: receiverState
    });
  });
});

// GET /api/whatsapp-receiver/status - Get receiver status
router.get('/status', verifyToken, (req, res) => {
  res.json({
    success: true,
    status: receiverState,
    webhookUrl: `${req.protocol}://${req.get('host')}/api/webhooks/whatsapp`
  });
});

// Function to store received WhatsApp message (called from webhook)
const storeWhatsAppMessage = (webhookData) => {
  return new Promise((resolve, reject) => {
    console.log('💾 Storing WhatsApp message from receiver...');
    
    // Only store if receiver is active
    if (!receiverState.isActive) {
      console.log('📴 Receiver not active, skipping message storage');
      return resolve({ stored: false, reason: 'receiver_inactive' });
    }

    try {
      // Extract message data from WhatsApp webhook structure
      const entry = webhookData.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      
      if (!value || !value.messages || value.messages.length === 0) {
        console.log('📝 No messages in webhook data');
        return resolve({ stored: false, reason: 'no_messages' });
      }

      const message = value.messages[0];
      const contact = value.contacts?.[0];
      
      const messageData = {
        phoneNumber: message.from,
        contactName: contact?.profile?.name || contact?.wa_id || 'Unknown Contact',
        messageText: message.text?.body || message.type || 'Unknown message type',
        messageId: message.id,
        messageType: message.type || 'text',
        timestamp: message.timestamp ? new Date(parseInt(message.timestamp) * 1000).toISOString() : new Date().toISOString(),
        rawData: JSON.stringify(webhookData)
      };

      console.log('📝 Message data to store:', {
        from: messageData.phoneNumber,
        name: messageData.contactName,
        text: messageData.messageText?.substring(0, 50),
        type: messageData.messageType
      });

      const insertQuery = `
        INSERT OR REPLACE INTO whatsapp_receiver_messages 
        (phone_number, contact_name, message_text, message_id, message_type, timestamp, raw_data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(insertQuery, [
        messageData.phoneNumber,
        messageData.contactName,
        messageData.messageText,
        messageData.messageId,
        messageData.messageType,
        messageData.timestamp,
        messageData.rawData
      ], function(err) {
        if (err) {
          console.error('❌ Error storing message:', err);
          reject(err);
        } else {
          console.log('✅ Message stored with ID:', this.lastID);
          resolve({ 
            stored: true, 
            id: this.lastID,
            messageData: messageData
          });
        }
      });

    } catch (error) {
      console.error('❌ Error processing webhook data:', error);
      reject(error);
    }
  });
};

// POST /api/whatsapp-receiver/send-message - Send WhatsApp message
router.post('/send-message', verifyToken, async (req, res) => {
  const { businessId, accessToken, phoneNumberId, recipientPhoneNumber, messageText } = req.body;
  
  console.log('📤 WhatsApp send message request:', {
    businessId: businessId ? 'present' : 'missing',
    accessToken: accessToken ? 'present' : 'missing',
    phoneNumberId: phoneNumberId ? 'present' : 'missing',
    recipientPhoneNumber: recipientPhoneNumber ? recipientPhoneNumber : 'missing',
    messageLength: messageText ? messageText.length : 0
  });
  
  try {
    // Validate required parameters
    if (!businessId || !accessToken || !phoneNumberId || !recipientPhoneNumber || !messageText) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: businessId, accessToken, phoneNumberId, recipientPhoneNumber, messageText'
      });
    }

    // Send message to WhatsApp Business API
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    
    const requestBody = {
      messaging_product: 'whatsapp',
      to: recipientPhoneNumber,
      type: 'text',
      text: {
        body: messageText
      }
    };

    console.log('📡 Sending to WhatsApp API:', { 
      url: url.replace(/\/\d+\//, '/[PHONE_ID]/'), 
      body: {
        ...requestBody,
        to: `***${requestBody.to.slice(-4)}` // Only show last 4 digits
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'WhatsApp-Receiver/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      console.error('❌ WhatsApp API Error Response:', data);
      return res.status(400).json({
        success: false,
        error: `WhatsApp API Error: ${errorMsg}`,
        details: data
      });
    }

    console.log('✅ WhatsApp API Response:', {
      messageId: data.messages?.[0]?.id,
      status: data.messages?.[0]?.message_status || 'sent',
      success: true
    });

    res.json({
      success: true,
      message: `Message sent successfully to ${recipientPhoneNumber}`,
      data: {
        messageId: data.messages?.[0]?.id,
        recipientPhoneNumber: recipientPhoneNumber,
        messageText: messageText,
        status: data.messages?.[0]?.message_status || 'sent',
        sentAt: new Date().toISOString(),
        whatsappResponse: data
      }
    });
    
  } catch (error) {
    console.error('❌ WhatsApp send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to send WhatsApp message'
    });
  }
});

// GET /api/whatsapp-receiver/stats - Get receiver statistics
router.get('/stats', verifyToken, (req, res) => {
  const statsQuery = `
    SELECT 
      COUNT(*) as total_messages,
      COUNT(DISTINCT phone_number) as unique_contacts,
      MAX(created_at) as last_message_at
    FROM whatsapp_receiver_messages
  `;
  
  db.get(statsQuery, [], (err, stats) => {
    if (err) {
      console.error('❌ Error fetching receiver stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json({
      success: true,
      stats: stats || {
        total_messages: 0,
        unique_contacts: 0,
        last_message_at: null
      },
      status: receiverState
    });
  });
});

// Export the message storage function for use in webhook handler
module.exports = router;
module.exports.storeWhatsAppMessage = storeWhatsAppMessage;
module.exports.getReceiverState = () => receiverState;