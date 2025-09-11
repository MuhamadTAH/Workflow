const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');
const jwt = require('jsonwebtoken');
const logger = require('../services/logger');
const fs = require('fs').promises;
const path = require('path');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Allow mock token for testing/development
    if (token.startsWith('MOCK_TOKEN_FOR_TESTING_')) {
      req.user = { userId: 1, id: 1, email: 'mhamadtah548@gmail.com', mock: true };
      return next();
    }
    
    // Regular JWT validation for production
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper function to get user ID from token
const getUserIdFromToken = (req) => {
  return req.user?.id || req.user?.userId || 1; // Default to user ID 1 for testing
};

// ====================================================================
// DATABASE HELPER FUNCTIONS
// ====================================================================

// Get all agreements for a user
const getAgreementsFromDatabase = async (userId, filters = {}) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        id, user_id, customer_id, customer_name, customer_username, platform,
        agreement_detected_at, agreement_confidence, agreement_trigger_message,
        phone_number, email_address, location, address,
        service_requested, service_description, budget_mentioned, price_agreed, timeline_mentioned,
        agreement_summary, conversation_summary, status, notes,
        agreement_file_path, agreement_file_url, client_portal_link,
        created_at, updated_at, confirmed_at, completed_at
      FROM client_agreements 
      WHERE user_id = ?
    `;
    const params = [userId];

    // Add status filter
    if (filters.status && filters.status !== 'all') {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    // Add platform filter
    if (filters.platform && filters.platform !== 'all') {
      query += ' AND platform = ?';
      params.push(filters.platform);
    }

    // Order by most recent first
    query += ' ORDER BY agreement_detected_at DESC';

    // Add limit if specified
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

// Get single agreement by ID
const getAgreementFromDatabase = async (agreementId, userId) => {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        ca.*,
        GROUP_CONCAT(
          JSON_OBJECT(
            'id', acm.id,
            'message_index', acm.message_index,
            'sender_type', acm.sender_type,
            'sender_name', acm.sender_name,
            'message_text', acm.message_text,
            'message_timestamp', acm.message_timestamp,
            'is_agreement_trigger', acm.is_agreement_trigger
          )
        ) as conversation_messages
      FROM client_agreements ca
      LEFT JOIN agreement_conversation_messages acm ON ca.id = acm.agreement_id
      WHERE ca.id = ? AND ca.user_id = ?
      GROUP BY ca.id
    `, [agreementId, userId], (err, row) => {
      if (err) reject(err);
      else {
        if (row && row.conversation_messages) {
          try {
            row.conversation_messages = JSON.parse('[' + row.conversation_messages + ']');
          } catch (e) {
            row.conversation_messages = [];
          }
        }
        resolve(row);
      }
    });
  });
};

// Save new agreement to database
const saveAgreementToDatabase = async (agreementData) => {
  return new Promise((resolve, reject) => {
    const {
      user_id, customer_id, customer_name, customer_username, platform,
      agreement_confidence, agreement_trigger_message, agreement_keywords,
      phone_number, email_address, location, address,
      service_requested, service_description, budget_mentioned, price_agreed, timeline_mentioned,
      agreement_summary, conversation_summary, full_conversation_json,
      status = 'pending'
    } = agreementData;

    db.run(`
      INSERT INTO client_agreements (
        user_id, customer_id, customer_name, customer_username, platform,
        agreement_confidence, agreement_trigger_message, agreement_keywords,
        phone_number, email_address, location, address,
        service_requested, service_description, budget_mentioned, price_agreed, timeline_mentioned,
        agreement_summary, conversation_summary, full_conversation_json, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id, customer_id, customer_name, customer_username, platform,
      agreement_confidence, agreement_trigger_message, JSON.stringify(agreement_keywords),
      phone_number, email_address, location, address,
      service_requested, service_description, budget_mentioned, price_agreed, timeline_mentioned,
      agreement_summary, conversation_summary, full_conversation_json, status
    ], function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

// Update agreement status
const updateAgreementStatus = async (agreementId, userId, status) => {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();
    let updateFields = 'status = ?, updated_at = ?';
    let params = [status, now];
    
    if (status === 'confirmed') {
      updateFields += ', confirmed_at = ?';
      params.push(now);
    } else if (status === 'completed') {
      updateFields += ', completed_at = ?';
      params.push(now);
    }

    params.push(agreementId, userId);

    db.run(`
      UPDATE client_agreements 
      SET ${updateFields}
      WHERE id = ? AND user_id = ?
    `, params, function(err) {
      if (err) reject(err);
      else resolve(this.changes);
    });
  });
};

// Save conversation messages for agreement
const saveConversationMessages = async (agreementId, messages) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO agreement_conversation_messages (
        agreement_id, message_index, sender_type, sender_name, 
        message_text, message_timestamp, is_agreement_trigger, extracted_info_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    messages.forEach((message, index) => {
      stmt.run([
        agreementId, 
        index, 
        message.sender_type,
        message.sender_name,
        message.message_text,
        message.message_timestamp,
        message.is_agreement_trigger ? 1 : 0,
        message.extracted_info_json ? JSON.stringify(message.extracted_info_json) : null
      ]);
    });

    stmt.finalize((err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};

// ====================================================================
// API ENDPOINTS
// ====================================================================

// GET /client-agreements - Get all agreements for user
router.get('/', verifyToken, asyncHandler(async (req, res) => {
  const userId = getUserIdFromToken(req);
  const { status, platform, limit } = req.query;
  
  try {
    const filters = { status, platform };
    if (limit) filters.limit = parseInt(limit);

    const agreements = await getAgreementsFromDatabase(userId, filters);
    
    logger.info(`Retrieved ${agreements.length} agreements for user ${userId}`, {
      userId,
      filters
    });

    res.json({
      success: true,
      agreements: agreements,
      total: agreements.length
    });
  } catch (error) {
    logger.logError(error, { context: 'get-agreements', userId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agreements',
      message: error.message
    });
  }
}));

// GET /client-agreements/:id - Get specific agreement details
router.get('/:id', verifyToken, asyncHandler(async (req, res) => {
  const userId = getUserIdFromToken(req);
  const { id } = req.params;
  
  try {
    const agreement = await getAgreementFromDatabase(id, userId);
    
    if (!agreement) {
      return res.status(404).json({
        success: false,
        error: 'Agreement not found'
      });
    }

    logger.info(`Retrieved agreement details`, { agreementId: id, userId });

    res.json({
      success: true,
      agreement: agreement
    });
  } catch (error) {
    logger.logError(error, { context: 'get-agreement-details', userId, agreementId: id });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agreement details',
      message: error.message
    });
  }
}));

// POST /client-agreements - Create new agreement (for testing/manual creation)
router.post('/', verifyToken, asyncHandler(async (req, res) => {
  const userId = getUserIdFromToken(req);
  const agreementData = { ...req.body, user_id: userId };
  
  try {
    const agreementId = await saveAgreementToDatabase(agreementData);
    
    // Save conversation messages if provided
    if (req.body.conversation_messages && req.body.conversation_messages.length > 0) {
      await saveConversationMessages(agreementId, req.body.conversation_messages);
    }

    logger.info(`Created new agreement`, { agreementId, userId });

    res.json({
      success: true,
      message: 'Agreement created successfully',
      agreementId: agreementId
    });
  } catch (error) {
    logger.logError(error, { context: 'create-agreement', userId });
    res.status(500).json({
      success: false,
      error: 'Failed to create agreement',
      message: error.message
    });
  }
}));

// PUT /client-agreements/:id/status - Update agreement status
router.put('/:id/status', verifyToken, asyncHandler(async (req, res) => {
  const userId = getUserIdFromToken(req);
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid status. Must be one of: pending, confirmed, completed, cancelled'
    });
  }

  try {
    const changes = await updateAgreementStatus(id, userId, status);
    
    if (changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Agreement not found or not authorized'
      });
    }

    logger.info(`Updated agreement status`, { agreementId: id, userId, status });

    res.json({
      success: true,
      message: 'Agreement status updated successfully'
    });
  } catch (error) {
    logger.logError(error, { context: 'update-agreement-status', userId, agreementId: id });
    res.status(500).json({
      success: false,
      error: 'Failed to update agreement status',
      message: error.message
    });
  }
}));

// GET /client-agreements/:id/download - Download agreement file
router.get('/:id/download', verifyToken, asyncHandler(async (req, res) => {
  const userId = getUserIdFromToken(req);
  const { id } = req.params;
  
  try {
    const agreement = await getAgreementFromDatabase(id, userId);
    
    if (!agreement) {
      return res.status(404).json({
        success: false,
        error: 'Agreement not found'
      });
    }

    // Check if agreement file exists
    if (!agreement.agreement_file_path) {
      // Generate agreement file on demand
      const filePath = await generateAgreementFile(agreement);
      
      // Update database with file path
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE client_agreements 
          SET agreement_file_path = ?, updated_at = datetime('now')
          WHERE id = ?
        `, [filePath, id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      agreement.agreement_file_path = filePath;
    }

    const filePath = path.resolve(agreement.agreement_file_path);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      // File doesn't exist, regenerate
      const newFilePath = await generateAgreementFile(agreement);
      agreement.agreement_file_path = newFilePath;
    }

    // Send file
    res.download(agreement.agreement_file_path, `agreement_${id}.pdf`, (err) => {
      if (err) {
        logger.logError(err, { context: 'download-agreement-file', userId, agreementId: id });
        res.status(500).json({
          success: false,
          error: 'Failed to download agreement file'
        });
      } else {
        logger.info(`Agreement file downloaded`, { agreementId: id, userId });
      }
    });
  } catch (error) {
    logger.logError(error, { context: 'download-agreement-file', userId, agreementId: id });
    res.status(500).json({
      success: false,
      error: 'Failed to download agreement file',
      message: error.message
    });
  }
}));

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

// Generate agreement PDF file
const generateAgreementFile = async (agreement) => {
  const agreementContent = `
CLIENT AGREEMENT

Agreement ID: ${agreement.id}
Date: ${new Date(agreement.agreement_detected_at).toLocaleDateString()}

CLIENT INFORMATION:
Name: ${agreement.customer_name || 'Not provided'}
Username: ${agreement.customer_username || 'Not provided'}
Phone: ${agreement.phone_number || 'Not provided'}
Email: ${agreement.email_address || 'Not provided'}
Location: ${agreement.location || 'Not provided'}

SERVICE DETAILS:
Service Requested: ${agreement.service_requested || 'Not specified'}
Description: ${agreement.service_description || 'Not provided'}
Budget Mentioned: ${agreement.budget_mentioned || 'Not specified'}
Price Agreed: ${agreement.price_agreed || 'Not specified'}
Timeline: ${agreement.timeline_mentioned || 'Not specified'}

AGREEMENT SUMMARY:
${agreement.agreement_summary || 'No summary available'}

CONVERSATION SUMMARY:
${agreement.conversation_summary || 'No conversation summary available'}

Status: ${agreement.status}
Platform: ${agreement.platform}
Confidence: ${Math.round(agreement.agreement_confidence * 100)}%

Generated: ${new Date().toLocaleString()}
`;

  // Create agreements directory if it doesn't exist
  const agreementsDir = path.join(__dirname, '..', 'storage', 'agreements');
  try {
    await fs.mkdir(agreementsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Write file
  const fileName = `agreement_${agreement.id}_${Date.now()}.txt`;
  const filePath = path.join(agreementsDir, fileName);
  
  await fs.writeFile(filePath, agreementContent, 'utf8');
  
  logger.info(`Generated agreement file`, { 
    agreementId: agreement.id, 
    filePath: fileName 
  });
  
  return filePath;
};

// GET /client-agreements/stats - Get agreement statistics
router.get('/stats/overview', verifyToken, asyncHandler(async (req, res) => {
  const userId = getUserIdFromToken(req);
  
  try {
    const stats = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_agreements,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
          platform,
          COUNT(*) as platform_count
        FROM client_agreements 
        WHERE user_id = ?
        GROUP BY platform
        UNION ALL
        SELECT 
          COUNT(*) as total_agreements,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
          'total' as platform,
          COUNT(*) as platform_count
        FROM client_agreements 
        WHERE user_id = ?
      `, [userId, userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    logger.logError(error, { context: 'get-agreement-stats', userId });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agreement statistics',
      message: error.message
    });
  }
}));

// POST /client-agreements/detect - Manual agreement detection endpoint (for testing)
router.post('/detect', verifyToken, asyncHandler(async (req, res) => {
  const userId = getUserIdFromToken(req);
  const { 
    customer_id, 
    customer_name, 
    customer_username, 
    platform, 
    conversation_messages,
    trigger_message 
  } = req.body;
  
  if (!customer_id || !platform || !conversation_messages || !Array.isArray(conversation_messages)) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: customer_id, platform, conversation_messages'
    });
  }

  try {
    // Use the agreement detection service
    const { detectAgreementFromConversation } = require('../services/agreementDetection');
    
    const detectionResult = await detectAgreementFromConversation(
      conversation_messages, 
      trigger_message,
      { customer_id, customer_name, customer_username, platform, user_id: userId }
    );

    if (detectionResult.agreementDetected) {
      res.json({
        success: true,
        message: 'Agreement detected and saved',
        agreement: detectionResult.agreementData,
        agreementId: detectionResult.agreementId
      });
    } else {
      res.json({
        success: false,
        message: 'No agreement detected in conversation',
        confidence: detectionResult.confidence || 0
      });
    }
  } catch (error) {
    logger.logError(error, { context: 'manual-agreement-detection', userId });
    res.status(500).json({
      success: false,
      error: 'Failed to process agreement detection',
      message: error.message
    });
  }
}));

module.exports = router;