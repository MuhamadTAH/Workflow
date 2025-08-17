/*
Minimal test version of chatTriggerNode
*/

const testChatTriggerNode = {
  description: {
    displayName: 'Chat Trigger Test',
    name: 'chatTrigger',
    group: 'triggers'
  },

  async execute(inputData, config, context) {
    return {
      success: true,
      data: {
        message: "Test chat trigger working!",
        sessionId: config.sessionId || 'test-session'
      }
    };
  }
};

console.log('🧪 Test module keys:', Object.keys(testChatTriggerNode));
console.log('🧪 Test execute type:', typeof testChatTriggerNode.execute);

module.exports = testChatTriggerNode;