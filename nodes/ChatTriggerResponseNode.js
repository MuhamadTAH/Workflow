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

  async execute(config, inputData, executionContext) {
    // Extract parameters from config (node configuration)
    const sessionId = config.sessionId;
    const message = config.message;

    console.log('🗣️ Chat Trigger Response executing with:');
    console.log('  - Config:', JSON.stringify(config, null, 2));
    console.log('  - Input Data:', JSON.stringify(inputData, null, 2));
    console.log('  - Resolved sessionId:', sessionId);
    console.log('  - Resolved message:', message);

    if (!sessionId || !message) {
      console.error('❌ Chat Trigger Response FAILED - missing sessionId or message');
      throw new Error('Session ID and Message are required');
    }

    console.log(`📤 Storing message for session ${sessionId}: "${message}"`);
    storeMessage(sessionId, message);
    console.log('✅ Chat Trigger Response message stored successfully');
    
    return { 
      success: true, 
      data: { sessionId, message, storedAt: new Date().toISOString() },
      nodeType: this.type,
      message: 'Response stored for chat session'
    };
  }
}

module.exports = ChatTriggerResponseNode;
