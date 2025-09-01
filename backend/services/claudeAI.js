const logger = require('./logger');

class ClaudeAI {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-3-5-sonnet-20241022'; // Default model
  }

  async sendMessage(prompt, systemPrompt = '', knowledgeBase = '') {
    if (!this.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    try {
      logger.info('🤖 Sending request to Claude AI', {
        model: this.model,
        promptLength: prompt.length,
        hasSystemPrompt: !!systemPrompt,
        hasKnowledgeBase: !!knowledgeBase
      });

      // Combine system prompt with knowledge base
      let fullSystemPrompt = systemPrompt;
      if (knowledgeBase && knowledgeBase.trim()) {
        fullSystemPrompt += `\n\nKnowledge Base:\n${knowledgeBase}`;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1000,
          system: fullSystemPrompt || 'You are a helpful assistant for Instagram direct messages.',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Claude API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text;

      logger.info('✅ Claude AI response received', {
        responseLength: reply?.length || 0,
        usage: data.usage
      });

      return {
        success: true,
        reply: reply || 'Sorry, I could not generate a response.',
        usage: data.usage
      };

    } catch (error) {
      logger.error('💥 Claude AI error:', error.message);
      return {
        success: false,
        error: error.message,
        reply: 'Sorry, I encountered an error processing your message.'
      };
    }
  }

  // Set custom model
  setModel(model) {
    this.model = model;
    logger.info('🔧 Claude model changed', { model });
  }

  // Validate API key
  async validateApiKey() {
    if (!this.apiKey) {
      return { valid: false, error: 'No API key configured' };
    }

    try {
      const response = await this.sendMessage('Hello', 'Respond with just "API key is valid"');
      return { 
        valid: response.success, 
        error: response.error || null 
      };
    } catch (error) {
      return { 
        valid: false, 
        error: error.message 
      };
    }
  }
}

module.exports = new ClaudeAI();