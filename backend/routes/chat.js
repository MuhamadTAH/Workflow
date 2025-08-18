const express = require('express');
// OLD chatSessions service removed - now using chatMessageStorage
// const { getMessages } = require('../services/chatSessions');

const router = express.Router();

// Import workflowExecutor to check if any workflows are active
const workflowExecutor = require('../services/workflowExecutor');

// Store session activity timestamps
const sessionActivity = new Map();
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const POLLING_INTERVAL = 2000; // 2 seconds

// Endpoint for frontend to poll for messages
router.get('/api/chat-messages/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  // Update session activity
  const now = Date.now();
  sessionActivity.set(sessionId, now);
  
  // Clean up old sessions periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupInactiveSessions();
  }
  
  // Check if there's a workflow for this session
  const workflowId = extractWorkflowIdFromSession(sessionId);
  const hasActiveWorkflow = workflowId && workflowExecutor.activeWorkflows && workflowExecutor.activeWorkflows.has(workflowId);
  
  // OLD: const messages = getMessages(sessionId);
  // NEW: Using chatMessageStorage instead
  const messages = [];
  
  // Only log when there are messages or on first poll of a new session
  const isFirstPoll = !sessionActivity.has(sessionId + '_logged');
  if (messages.length > 0 || isFirstPoll) {
    console.log(`[chat] Session ${sessionId.slice(-8)}: ${messages.length} messages, workflow active: ${hasActiveWorkflow}`);
    sessionActivity.set(sessionId + '_logged', true);
  }
  
  // Return messages with session info
  res.json({ 
    messages,
    sessionActive: true,
    workflowActive: hasActiveWorkflow,
    pollingInterval: hasActiveWorkflow ? POLLING_INTERVAL : POLLING_INTERVAL * 2 // Slower polling if no active workflow
  });
});

// Extract workflow ID from session ID pattern
function extractWorkflowIdFromSession(sessionId) {
  // Session IDs often contain workflow context in URL params or metadata
  // For now, we'll check all active workflows to see if they have telegram triggers
  if (workflowExecutor && workflowExecutor.activeWorkflows) {
    for (const [workflowId, workflow] of workflowExecutor.activeWorkflows) {
      // Check if this workflow has telegram triggers
      const hasTrigger = workflow.nodes && workflow.nodes.some(node => 
        node.data && node.data.type === 'telegramTrigger'
      );
      if (hasTrigger) {
        return workflowId; // Return first workflow with telegram trigger
      }
    }
  }
  return null;
}

// Clean up inactive chat sessions
function cleanupInactiveSessions() {
  const now = Date.now();
  const toDelete = [];
  
  for (const [sessionKey, timestamp] of sessionActivity) {
    if (now - timestamp > SESSION_TIMEOUT) {
      toDelete.push(sessionKey);
    }
  }
  
  toDelete.forEach(key => {
    sessionActivity.delete(key);
  });
  
  if (toDelete.length > 0) {
    console.log(`[chat] Cleaned up ${toDelete.length} inactive sessions`);
  }
}

// Endpoint to stop chat session (stops polling)
router.post('/api/chat-messages/:sessionId/stop', (req, res) => {
  const { sessionId } = req.params;
  
  // Remove from active sessions
  sessionActivity.delete(sessionId);
  sessionActivity.delete(sessionId + '_logged');
  
  console.log(`[chat] Session ${sessionId.slice(-8)} stopped by user`);
  
  res.json({ 
    success: true,
    message: 'Chat session stopped',
    sessionId 
  });
});

// Endpoint to get session status (for debugging)
router.get('/api/chat-sessions/status', (req, res) => {
  const activeSessions = Array.from(sessionActivity.keys())
    .filter(key => !key.includes('_logged'))
    .length;
    
  res.json({
    activeSessions,
    activeWorkflows: workflowExecutor.activeWorkflows ? workflowExecutor.activeWorkflows.size : 0,
    sessionTimeout: SESSION_TIMEOUT,
    pollingInterval: POLLING_INTERVAL
  });
});

module.exports = router;
