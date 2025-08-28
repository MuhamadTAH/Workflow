/*
=================================================================
FILE: backend/routes/whatsapp-receiver.js
=================================================================
WhatsApp Receiver API routes for standalone message receiving
*/

const express = require('express');
const router = express.Router();

// Add CORS headers specifically for this route
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    console.log('🔧 WhatsApp Receiver OPTIONS preflight:', {
      origin: req.headers.origin,
      method: req.headers['access-control-request-method']
    });
    return res.status(200).end();
  }
  next();
});
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
    direction TEXT DEFAULT 'incoming',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Add direction column if it doesn't exist (for existing databases)
  db.run(`ALTER TABLE whatsapp_receiver_messages ADD COLUMN direction TEXT DEFAULT 'incoming'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding direction column:', err);
    }
  });
});

// Global state for WhatsApp receiver (unified configuration)
let receiverState = {
  isActive: false,
  // WhatsApp Trigger Node credentials
  appId: null,
  clientSecret: null,
  // WhatsApp Send Message Node credentials  
  businessId: null,
  accessToken: null,
  phoneNumberSendId: null,
  activatedAt: null
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  console.log('🔐 WhatsApp Receiver Token Verification:', {
    origin: req.headers.origin,
    hasAuth: !!req.headers.authorization,
    method: req.method,
    path: req.path
  });
  
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Allow mock token for testing/development
    if (token.startsWith('MOCK_TOKEN_FOR_TESTING_')) {
      console.log('✅ Using mock token for development');
      req.user = { userId: 'test-user-1', email: 'mhamadtah548@gmail.com', mock: true };
      return next();
    }
    
    // Regular JWT validation for production
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Token verified successfully');
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/whatsapp-receiver/activate - Activate WhatsApp message receiver (unified config)
router.post('/activate', verifyToken, async (req, res) => {
  const { appId, clientSecret, businessId, accessToken, phoneNumberSendId } = req.body;
  
  console.log('🚀 Activating WhatsApp unified system (receive + send)...');
  console.log('📋 Unified Configuration:', { 
    appId: appId ? 'present' : 'missing', 
    clientSecret: clientSecret ? 'present' : 'missing',
    businessId: businessId ? 'present' : 'missing',
    accessToken: accessToken ? 'present' : 'missing',
    phoneNumberSendId: phoneNumberSendId ? 'present' : 'missing'
  });
  
  try {
    // Validate all required unified inputs
    if (!appId || !clientSecret || !businessId || !accessToken || !phoneNumberSendId) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: App ID, Client Secret, Business ID, Access Token, and Phone Number Send ID'
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

    // Update receiver state with unified configuration
    receiverState = {
      isActive: true,
      // WhatsApp Trigger Node credentials
      appId: appId.trim(),
      clientSecret: clientSecret.trim(),
      // WhatsApp Send Message Node credentials
      businessId: businessId.trim(),
      accessToken: accessToken.trim(),
      phoneNumberSendId: phoneNumberSendId.trim(),
      activatedAt: new Date().toISOString()
    };
    
    console.log('✅ WhatsApp unified system activated successfully (receive + send)');
    console.log('📡 Webhook URL:', `${req.protocol}://${req.get('host')}/api/webhooks/whatsapp`);
    console.log('📤 Send Message capability ready with Business ID:', businessId.substring(0, 4) + '...');
    
    res.json({
      success: true,
      message: 'WhatsApp unified system activated! Ready to receive AND send messages.',
      webhookUrl: `${req.protocol}://${req.get('host')}/api/webhooks/whatsapp`,
      status: {
        isActive: true,
        activatedAt: receiverState.activatedAt,
        capabilities: ['receive_messages', 'send_messages'],
        sendingReady: true
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
    // Clear unified receiver state
    receiverState = {
      isActive: false,
      appId: null,
      clientSecret: null,
      businessId: null,
      accessToken: null,
      phoneNumberSendId: null,
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
      direction,
      created_at
    FROM whatsapp_receiver_messages 
    ORDER BY created_at ASC
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
      createdAt: msg.created_at,
      direction: msg.direction || 'incoming',
      isOutgoing: msg.direction === 'outgoing'
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

// POST /api/whatsapp-receiver/send-message - Send WhatsApp message (using unified config)
router.post('/send-message', verifyToken, async (req, res) => {
  const { recipientPhoneNumber, messageText } = req.body;
  
  // Use unified configuration from receiver state
  const { businessId, accessToken, phoneNumberSendId } = receiverState;
  
  console.log('📤 WhatsApp unified send message request:', {
    fromUnifiedConfig: true,
    businessId: businessId ? 'present' : 'missing',
    accessToken: accessToken ? 'present' : 'missing',
    phoneNumberSendId: phoneNumberSendId ? 'present' : 'missing',
    recipientPhoneNumber: recipientPhoneNumber ? recipientPhoneNumber : 'missing',
    messageLength: messageText ? messageText.length : 0,
    receiverActive: receiverState.isActive
  });
  
  try {
    // Validate unified configuration and message parameters
    if (!receiverState.isActive) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp system is not activated. Please activate first with complete configuration.'
      });
    }
    
    if (!businessId || !accessToken || !phoneNumberSendId || !recipientPhoneNumber || !messageText) {
      return res.status(400).json({
        success: false,
        error: 'Missing unified configuration or message data. Please check your setup.'
      });
    }

    // Send message to WhatsApp Business API using unified configuration
    const url = `https://graph.facebook.com/v21.0/${phoneNumberSendId}/messages`;
    
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

    // Store the sent message in the database as an outgoing message
    try {
      const insertQuery = `
        INSERT INTO whatsapp_receiver_messages 
        (phone_number, contact_name, message_text, message_id, message_type, timestamp, raw_data, direction, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const now = new Date().toISOString();
      const messageId = data.messages?.[0]?.id || `sent_${Date.now()}`;
      
      const insertResult = await new Promise((resolve, reject) => {
        db.run(insertQuery, [
          recipientPhoneNumber,
          'Unknown Contact', // We don't know the contact name for outgoing
          messageText,
          messageId,
          'text',
          now,
          JSON.stringify({ 
            sent: true, 
            whatsappResponse: data,
            phoneNumberSendId: phoneNumberSendId,
            businessId: businessId,
            sentViaUnifiedConfig: true
          }),
          'outgoing',
          now
        ], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });
      
      console.log('💾 Stored outgoing message with ID:', insertResult);
      
    } catch (dbError) {
      console.error('⚠️ Failed to store outgoing message in database:', dbError);
      // Continue even if database storage fails
    }

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