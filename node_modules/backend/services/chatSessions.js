// Simple in-memory storage for MVP (replace with DB in production)
const chatSessions = {};

function storeMessage(sessionId, message) {
  if (!chatSessions[sessionId]) {
    chatSessions[sessionId] = { messages: [] };
  }
  chatSessions[sessionId].messages.push(message);
}

function getMessages(sessionId) {
  const session = chatSessions[sessionId];
  if (!session) return [];
  const msgs = [...session.messages];
  session.messages = []; // clear after retrieval
  return msgs;
}

module.exports = { storeMessage, getMessages };
