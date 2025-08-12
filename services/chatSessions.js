// Simple in-memory storage for MVP (replace with DB in production)
const chatSessions = {};

function storeMessage(sessionId, message) {
  console.log(`📦 storeMessage called - sessionId: "${sessionId}", message: "${message}"`);
  if (!chatSessions[sessionId]) {
    chatSessions[sessionId] = { messages: [] };
    console.log(`🆕 Created new chat session: ${sessionId}`);
  }
  chatSessions[sessionId].messages.push(message);
  console.log(`📝 Message stored. Session ${sessionId} now has ${chatSessions[sessionId].messages.length} messages`);
  console.log(`📋 Current sessions: ${Object.keys(chatSessions).length}`);
}

function getMessages(sessionId) {
  console.log(`📨 getMessages called for session: "${sessionId}"`);
  const session = chatSessions[sessionId];
  if (!session) {
    console.log(`❌ No session found for: ${sessionId}`);
    console.log(`📋 Available sessions: ${Object.keys(chatSessions).join(', ')}`);
    return [];
  }
  const msgs = [...session.messages];
  console.log(`📤 Retrieved ${msgs.length} messages for session ${sessionId}: ${JSON.stringify(msgs)}`);
  session.messages = []; // clear after retrieval
  console.log(`🧹 Cleared messages for session ${sessionId}`);
  return msgs;
}

module.exports = { storeMessage, getMessages };
