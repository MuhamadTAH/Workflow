/*
=================================================================
BACKEND FILE: backend/routes/chatMessages.js
=================================================================
REST API endpoints for chat message management
*/

const express = require('express');
const router = express.Router();
const chatMessageStorage = require('../services/chatMessageStorage');
const logger = require('../services/logger');
const { asyncHandler } = require('../middleware/errorHandler');

// Get all messages for a specific chat session
router.get('/:nodeId', asyncHandler(async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { limit = 50, unprocessed = false } = req.query;
    
    console.log(`📥 Get messages request for node: ${nodeId}`, {
      limit,
      unprocessed: unprocessed === 'true'
    });
    
    let messages;
    if (unprocessed === 'true') {
      messages = await chatMessageStorage.getUnprocessedMessages(nodeId);
    } else {
      messages = await chatMessageStorage.getAllMessages(nodeId, parseInt(limit));
    }
    
    // Get session info
    const session = await chatMessageStorage.getSession(nodeId);
    const messageCount = await chatMessageStorage.getMessageCount(nodeId);
    
    res.status(200).json({
      success: true,
      data: {
        messages: messages,
        session: session || {
          sessionId: nodeId,
          title: 'Chat Support',
          isActive: false
        },
        messageCount: messageCount,
        filter: {
          unprocessed: unprocessed === 'true',
          limit: parseInt(limit)
        }
      }
    });
    
    logger.info('Chat messages retrieved', {
      nodeId,
      messageCount: messages.length,
      unprocessed: unprocessed === 'true'
    });
    
  } catch (error) {
    console.error('❌ Failed to get chat messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat messages',
      error: error.message
    });
  }
}));

// Create or update a chat session
router.post('/sessions', asyncHandler(async (req, res) => {
  try {
    const { sessionId, title, welcomeMessage, workflowId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'sessionId is required'
      });
    }
    
    console.log(`🆔 Create/update session: ${sessionId}`, {
      title: title || 'default',
      hasWelcomeMessage: !!welcomeMessage
    });
    
    const session = await chatMessageStorage.createOrUpdateSession(
      sessionId,
      title || 'Chat Support',
      welcomeMessage || '👋 Welcome! Send a message to start the conversation.',
      workflowId
    );
    
    res.status(200).json({
      success: true,
      message: 'Chat session created/updated successfully',
      data: {
        session: session
      }
    });
    
    logger.info('Chat session created/updated', {
      sessionId,
      title: title || 'Chat Support'
    });
    
  } catch (error) {
    console.error('❌ Failed to create/update chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update chat session',
      error: error.message
    });
  }
}));

// Get session information
router.get('/sessions/:sessionId', asyncHandler(async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`📋 Get session info: ${sessionId}`);
    
    const session = await chatMessageStorage.getSession(sessionId);
    const messageCount = await chatMessageStorage.getMessageCount(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Chat session not found',
        sessionId: sessionId
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        session: session,
        messageCount: messageCount
      }
    });
    
    logger.info('Chat session info retrieved', {
      sessionId,
      messageCount: messageCount.total
    });
    
  } catch (error) {
    console.error('❌ Failed to get session info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve session information',
      error: error.message
    });
  }
}));

// Mark specific messages as processed
router.put('/processed', asyncHandler(async (req, res) => {
  try {
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'messageIds array is required'
      });
    }
    
    console.log(`✅ Mark messages as processed:`, {
      messageIds: messageIds,
      count: messageIds.length
    });
    
    const changedRows = await chatMessageStorage.markMessagesProcessed(messageIds);
    
    res.status(200).json({
      success: true,
      message: 'Messages marked as processed',
      data: {
        processedMessageIds: messageIds,
        changedRows: changedRows
      }
    });
    
    logger.info('Messages marked as processed', {
      messageIds,
      changedRows
    });
    
  } catch (error) {
    console.error('❌ Failed to mark messages as processed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as processed',
      error: error.message
    });
  }
}));

// Send a message to a chat session (for bot responses)
router.post('/:nodeId/send', asyncHandler(async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { message, responseData } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'message is required'
      });
    }
    
    console.log(`🤖 Send bot message to session: ${nodeId}`, {
      messageLength: message.length
    });
    
    // Store bot message
    const storedMessage = await chatMessageStorage.storeMessage(
      nodeId,
      message,
      'bot',
      null, // No user data for bot messages
      responseData
    );
    
    res.status(200).json({
      success: true,
      message: 'Bot message sent successfully',
      data: {
        messageId: storedMessage.id,
        sessionId: nodeId,
        timestamp: storedMessage.timestamp
      }
    });
    
    logger.info('Bot message sent', {
      nodeId,
      messageId: storedMessage.id,
      messageLength: message.length
    });
    
  } catch (error) {
    console.error('❌ Failed to send bot message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bot message',
      error: error.message
    });
  }
}));

// Get message statistics for a session
router.get('/:nodeId/stats', asyncHandler(async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    console.log(`📊 Get message stats for session: ${nodeId}`);
    
    const session = await chatMessageStorage.getSession(nodeId);
    const messageCount = await chatMessageStorage.getMessageCount(nodeId);
    const recentMessages = await chatMessageStorage.getAllMessages(nodeId, 5);
    
    const stats = {
      sessionExists: !!session,
      totalMessages: messageCount.total,
      unprocessedMessages: messageCount.unprocessed,
      processedMessages: messageCount.total - messageCount.unprocessed,
      lastActivity: session?.lastActivity,
      recentMessages: recentMessages.slice(-3).map(msg => ({
        text: msg.text.substring(0, 50) + (msg.text.length > 50 ? '...' : ''),
        sender: msg.sender,
        timestamp: msg.timestamp
      }))
    };
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: nodeId,
        stats: stats
      }
    });
    
    logger.info('Message stats retrieved', {
      nodeId,
      totalMessages: stats.totalMessages,
      unprocessedMessages: stats.unprocessedMessages
    });
    
  } catch (error) {
    console.error('❌ Failed to get message stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve message statistics',
      error: error.message
    });
  }
}));

// Clean up old processed messages (maintenance endpoint)
router.delete('/cleanup', asyncHandler(async (req, res) => {
  try {
    const { daysOld = 30 } = req.query;
    
    console.log(`🧹 Cleanup old messages older than ${daysOld} days`);
    
    const deletedCount = await chatMessageStorage.cleanupOldMessages(parseInt(daysOld));
    
    res.status(200).json({
      success: true,
      message: 'Old messages cleaned up successfully',
      data: {
        deletedCount: deletedCount,
        daysOld: parseInt(daysOld)
      }
    });
    
    logger.info('Old messages cleaned up', {
      deletedCount,
      daysOld: parseInt(daysOld)
    });
    
  } catch (error) {
    console.error('❌ Failed to cleanup old messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old messages',
      error: error.message
    });
  }
}));

module.exports = router;