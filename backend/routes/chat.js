const express = require('express');
const { getMessages } = require('../services/chatSessions');

const router = express.Router();

// Import workflowExecutor to check if any workflows are active
const workflowExecutor = require('../services/workflowExecutor');

// Endpoint for frontend to poll for messages
router.get('/api/chat-messages/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  console.log(`[chat] Polling for messages in session: ${sessionId}`);
  console.log(`[chat] Active workflows count: ${workflowExecutor.activeWorkflows ? workflowExecutor.activeWorkflows.size : 0}`);
  
  // Always allow message retrieval - don't block based on workflow status
  // The chat session should remain active even after workflow completes
  const messages = getMessages(sessionId);
  console.log(`[chat] Retrieved ${messages.length} messages for session ${sessionId}`);
  
  res.json({ messages });
});

module.exports = router;
