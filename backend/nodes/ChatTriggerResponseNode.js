const { storeMessage } = require('../services/chatSessions');

class ChatTriggerResponseNode {
  constructor() {
    this.type = 'chatTriggerResponse';
    this.name = 'Chat Trigger Response';
    this.icon = '💬';
    this.group = ['output'];
    this.description = 'Sends a message back to a chat session';
    this.defaults = {
      name: 'Chat Trigger Response',
      color: '#4CAF50'
    };
    this.inputs = 1;
    this.outputs = 0;
    this.parameters = {
      sessionId: { type: 'string', label: 'Session ID', required: true },
      message: { type: 'string', label: 'Message', required: true }
    };
  }

  async execute(input) {
    const sessionId = input.sessionId;
    const message = input.message;

    if (!sessionId || !message) {
      throw new Error('Session ID and Message are required');
    }

    storeMessage(sessionId, message);
    return { success: true };
  }
}

module.exports = ChatTriggerResponseNode;
