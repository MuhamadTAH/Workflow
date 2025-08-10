const express = require('express');
const { getMessages } = require('../services/chatSessions');

const router = express.Router();

// Endpoint for frontend to poll for messages
router.get('/api/chat-messages/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const messages = getMessages(sessionId);
  res.json({ messages });
});

module.exports = router;
