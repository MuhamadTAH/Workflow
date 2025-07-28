const Anthropic = require('@anthropic-ai/sdk');
const logger = require('./logger');

class AIAgent {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-api-key-here'
    });
    this.model = 'claude-3-haiku-20240307'; // Fast model for MVP
    this.maxTokens = 1024;
  }

  // Simple memory storage (will be upgraded to SQLite in Phase 3)
  memory = new Map();

  // Tool registry
  tools = {
    getUserData: {
      name: 'getUserData',
      description: 'Get current user information from the database',
      parameters: {
        type: 'object',
        properties: {
          userId: {
            type: 'number',
            description: 'The user ID to fetch data for'
          }
        }
      },
      handler: async ({ userId }) => {
        // Mock user data for MVP
        return {
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
          preferences: 'Likes coffee, works remotely'
        };
      }
    },

    sendTelegramMessage: {
      name: 'sendTelegramMessage',
      description: 'Send a message via Telegram bot',
      parameters: {
        type: 'object',
        properties: {
          chatId: {
            type: 'string',
            description: 'Telegram chat ID to send message to'
          },
          message: {
            type: 'string',
            description: 'Message text to send'
          }
        },
        required: ['chatId', 'message']
      },
      handler: async ({ chatId, message }) => {
        // Mock telegram sending for MVP
        logger.info('🤖 Agent would send Telegram message:', { chatId, message });
        return {
          success: true,
          messageId: Date.now(),
          text: message,
          sentAt: new Date().toISOString()
        };
      }
    },

    rememberFact: {
      name: 'rememberFact',
      description: 'Store an important fact in memory for future conversations',
      parameters: {
        type: 'object',
        properties: {
          fact: {
            type: 'string',
            description: 'The fact to remember about the user or conversation'
          },
          category: {
            type: 'string',
            description: 'Category of the fact (preferences, personal, work, etc.)'
          }
        },
        required: ['fact']
      },
      handler: async ({ fact, category = 'general' }) => {
        return { stored: true, fact, category };
      }
    }
  };

  // Get memory for a user session
  getMemory(sessionId) {
    if (!this.memory.has(sessionId)) {
      this.memory.set(sessionId, {
        facts: [],
        conversation: [],
        created: new Date()
      });
    }
    return this.memory.get(sessionId);
  }

  // Add to memory
  addToMemory(sessionId, type, data) {
    const memory = this.getMemory(sessionId);
    
    if (type === 'fact') {
      memory.facts.push({
        fact: data.fact,
        category: data.category || 'general',
        timestamp: new Date()
      });
    } else if (type === 'message') {
      memory.conversation.push({
        ...data,
        timestamp: new Date()
      });
      
      // Keep only last 10 messages to avoid token limits
      if (memory.conversation.length > 10) {
        memory.conversation = memory.conversation.slice(-10);
      }
    }
    
    this.memory.set(sessionId, memory);
  }

  // Format memory for Claude prompt
  formatMemoryForPrompt(sessionId) {
    const memory = this.getMemory(sessionId);
    let memoryText = '';

    if (memory.facts.length > 0) {
      memoryText += '\n## MEMORY - Important Facts:\n';
      memory.facts.forEach(fact => {
        memoryText += `- ${fact.fact} (${fact.category})\n`;
      });
    }

    if (memory.conversation.length > 0) {
      memoryText += '\n## MEMORY - Recent Conversation:\n';
      memory.conversation.slice(-5).forEach(msg => {
        memoryText += `${msg.role}: ${msg.content}\n`;
      });
    }

    return memoryText;
  }

  // Process tool calls from Claude
  async processToolCalls(toolCalls) {
    const results = [];
    
    for (const toolCall of toolCalls) {
      const { name, input } = toolCall;
      
      if (this.tools[name]) {
        try {
          const result = await this.tools[name].handler(input);
          results.push({
            tool_use_id: toolCall.id,
            content: result
          });
          logger.info(`🛠️ Tool ${name} executed:`, result);
        } catch (error) {
          logger.error(`❌ Tool ${name} error:`, error);
          results.push({
            tool_use_id: toolCall.id,
            content: { error: error.message }
          });
        }
      } else {
        results.push({
          tool_use_id: toolCall.id,
          content: { error: `Tool ${name} not found` }
        });
      }
    }
    
    return results;
  }

  // Main chat method
  async chat(message, sessionId, userId = null) {
    try {
      logger.info('🤖 AI Agent processing message:', { message, sessionId, userId });

      // Add user message to memory
      this.addToMemory(sessionId, 'message', { role: 'user', content: message });

      // Get memory context
      const memoryContext = this.formatMemoryForPrompt(sessionId);

      // System prompt with tools and memory
      const systemPrompt = `You are a helpful AI agent with access to tools and memory. You can:
1. Remember facts about users and conversations
2. Get user data from the database  
3. Send Telegram messages
4. Store important information for future reference

${memoryContext}

You should be conversational, helpful, and use tools when appropriate. If the user asks you to remember something, use the rememberFact tool. If they want to send a message somewhere, use sendTelegramMessage.`;

      // Prepare messages for Claude
      const messages = [
        {
          role: 'user',
          content: message
        }
      ];

      // Convert tools to Claude format
      const claudeTools = Object.values(this.tools).map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters
      }));

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: messages,
        tools: claudeTools
      });

      logger.info('🎯 Claude API response:', response);

      let finalResponse = '';
      let toolsUsed = [];
      let memoryUpdates = '';

      // Process response content
      for (const content of response.content) {
        if (content.type === 'text') {
          finalResponse += content.text;
        } else if (content.type === 'tool_use') {
          // Handle tool use
          const toolResult = await this.processToolCalls([content]);
          toolsUsed.push(content.name);

          // Special handling for rememberFact tool
          if (content.name === 'rememberFact') {
            this.addToMemory(sessionId, 'fact', content.input);
            memoryUpdates = `Remembered: ${content.input.fact}`;
          }

          // For now, just acknowledge tool use in response
          if (content.name === 'sendTelegramMessage') {
            finalResponse += `\n\n✅ Message sent via Telegram!`;
          } else if (content.name === 'getUserData') {
            const userData = toolResult[0]?.content;
            finalResponse += `\n\n👤 User Info: ${userData?.name} (${userData?.email})`;
          }
        }
      }

      // Add assistant response to memory
      this.addToMemory(sessionId, 'message', { role: 'assistant', content: finalResponse });

      return {
        response: finalResponse,
        toolsUsed,
        memory: memoryUpdates,
        sessionId
      };

    } catch (error) {
      logger.error('❌ AI Agent error:', error);
      
      // Return a friendly error message
      return {
        response: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        toolsUsed: [],
        memory: '',
        sessionId
      };
    }
  }

  // Get memory summary for debugging
  getMemorySummary(sessionId) {
    const memory = this.getMemory(sessionId);
    return {
      sessionId,
      facts: memory.facts,
      conversationLength: memory.conversation.length,
      lastActivity: memory.conversation[memory.conversation.length - 1]?.timestamp
    };
  }
}

module.exports = new AIAgent();