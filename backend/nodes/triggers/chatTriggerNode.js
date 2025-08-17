/*
=================================================================
BACKEND FILE: backend/nodes/triggers/chatTriggerNode.js
=================================================================
Chat Trigger node implementation for processing chat messages
*/

const chatMessageStorage = require('../../services/chatMessageStorage');
const logger = require('../../services/logger');

console.log('🔄 ChatTriggerNode module loading - v2.0 with full functionality');

const chatTriggerNode = {
  description: {
    displayName: 'Chat Trigger',
    name: 'chatTrigger',
    icon: 'fa:comments',
    group: 'triggers',
    version: 1,
    description: 'Triggers workflow execution when chat messages are received',
    defaults: {
      name: 'Chat Trigger',
    },
    properties: [
      {
        displayName: 'Chat Title',
        name: 'chatTitle',
        type: 'string',
        default: 'Chat Support',
        required: false,
        description: 'Title displayed in the chat widget header',
      },
      {
        displayName: 'Welcome Message',
        name: 'welcomeMessage',
        type: 'string',
        default: '👋 Welcome! Send a message to start the conversation.',
        required: false,
        description: 'Initial message shown to users when chat starts',
      },
      {
        displayName: 'Session ID',
        name: 'sessionId',
        type: 'string',
        default: '',
        required: false,
        description: 'Unique identifier for the chat session (auto-generated from node ID)',
      },
      {
        displayName: 'Enable Widget',
        name: 'enableWidget',
        type: 'boolean',
        default: true,
        required: false,
        description: 'Show the floating chat interface when this node is active',
      }
    ],
  },

  async execute(inputData, config, context) {
    try {
      // Get session ID (use node ID if not specified)
      const sessionId = config.sessionId || context.nodeId;
      const chatTitle = config.chatTitle || 'Chat Support';
      const welcomeMessage = config.welcomeMessage || '👋 Welcome! Send a message to start the conversation.';
      
      console.log(`🗨️ Chat Trigger executing for session: ${sessionId}`);
      
      // Ensure session exists with proper configuration
      await chatMessageStorage.createOrUpdateSession(
        sessionId, 
        chatTitle, 
        welcomeMessage, 
        context.workflowId
      );
      
      // Get real unprocessed messages from database
      const unprocessedMessages = await chatMessageStorage.getUnprocessedMessages(sessionId);
      
      if (unprocessedMessages.length === 0) {
        console.log(`💬 No new chat messages for session: ${sessionId}`);
        return {
          success: false,
          message: 'No new chat messages to process',
          data: {
            messages: [],
            session: {
              id: sessionId,
              title: chatTitle,
              messageCount: 0
            },
            trigger: {
              type: 'chatTrigger',
              nodeId: context.nodeId,
              executedAt: new Date().toISOString()
            }
          }
        };
      }
      
      console.log(`💬 Processing ${unprocessedMessages.length} chat message(s) for session: ${sessionId}`);
      
      // Get real session and message count data
      const session = await chatMessageStorage.getSession(sessionId);
      const messageCount = await chatMessageStorage.getMessageCount(sessionId);
      
      // Mark messages as processed now that we've retrieved them
      const messageIds = unprocessedMessages.map(msg => msg.id);
      await chatMessageStorage.markMessagesProcessed(messageIds);
      
      // Prepare execution result data
      const executionResult = {
        success: true,
        data: {
          // Main messages array for processing
          messages: unprocessedMessages,
          
          // Session information
          session: {
            id: sessionId,
            title: session?.title || chatTitle,
            welcomeMessage: session?.welcomeMessage || welcomeMessage,
            messageCount: messageCount.total,
            unprocessedCount: unprocessedMessages.length,
            createdAt: session?.createdAt,
            lastActivity: session?.lastActivity
          },
          
          // Latest message for quick access
          latestMessage: unprocessedMessages[unprocessedMessages.length - 1],
          
          // Trigger metadata
          trigger: {
            type: 'chatTrigger',
            nodeId: context.nodeId,
            sessionId: sessionId,
            executedAt: new Date().toISOString(),
            processedMessageIds: messageIds
          },
          
          // Convenience fields for template expressions
          messageText: unprocessedMessages[unprocessedMessages.length - 1]?.text || '',
          messageCount: unprocessedMessages.length,
          allMessages: unprocessedMessages.map(msg => ({
            text: msg.text,
            sender: msg.sender,
            timestamp: msg.timestamp
          }))
        }
      };
      
      logger.info('Chat Trigger executed successfully', {
        sessionId,
        nodeId: context.nodeId,
        messageCount: unprocessedMessages.length,
        processedIds: messageIds
      });
      
      return executionResult;
      
    } catch (error) {
      console.error('❌ Chat Trigger execution failed:', error);
      logger.error('Chat Trigger execution error:', {
        nodeId: context.nodeId,
        sessionId: config.sessionId,
        error: error.message,
        stack: error.stack
      });
      
      return {
        success: false,
        error: `Chat Trigger execution failed: ${error.message}`,
        data: {
          messages: [],
          session: {
            id: config.sessionId || context.nodeId,
            messageCount: 0
          },
          trigger: {
            type: 'chatTrigger',
            nodeId: context.nodeId,
            executedAt: new Date().toISOString(),
            error: error.message
          }
        }
      };
    }
  },

  // Helper methods temporarily disabled for debugging
  // async hasPendingMessages(sessionId) {
  //   try {
  //     const messages = await chatMessageStorage.getUnprocessedMessages(sessionId);
  //     return messages.length > 0;
  //   } catch (error) {
  //     console.error('❌ Failed to check pending messages:', error);
  //     return false;
  //   }
  // },

  // async getSessionStatus(sessionId) {
  //   try {
  //     const session = await chatMessageStorage.getSession(sessionId);
  //     const messageCount = await chatMessageStorage.getMessageCount(sessionId);
      
  //     return {
  //       exists: !!session,
  //       session: session,
  //       messageCount: messageCount
  //     };
  //   } catch (error) {
  //     console.error('❌ Failed to get session status:', error);
  //     return {
  //       exists: false,
  //       session: null,
  //       messageCount: { total: 0, unprocessed: 0 }
  //     };
  //   }
  // }
};

module.exports = chatTriggerNode;