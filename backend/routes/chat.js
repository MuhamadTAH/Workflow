const express = require('express');
const { getMessages } = require('../services/chatSessions');

const router = express.Router();

// Import workflowExecutor to check if any workflows are active
const workflowExecutor = require('../services/workflowExecutor');

// Endpoint for frontend to poll for messages
router.get('/api/chat-messages/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  // Check if there are any active workflows before processing polling request
  if (!workflowExecutor.activeWorkflows || workflowExecutor.activeWorkflows.size === 0) {
    return res.status(404).json({ 
      error: 'No active workflows found. Polling stopped.',
      shouldStopPolling: true 
    });
  }
  
  const messages = getMessages(sessionId);
  res.json({ messages });
});

module.exports = router;
