/*
=================================================================
ADVANCED AI PROCESSOR SERVICE
=================================================================
Enhanced AI processing with advanced features:
- Sentiment analysis
- Language detection
- A/B testing
- Context awareness
- Smart routing
- Quality scoring
*/

const db = require('../db');

class AdvancedAIProcessor {
  constructor() {
    this.sentimentCache = new Map();
    this.languageCache = new Map();
  }

  /**
   * Process AI conversation with advanced features
   */
  async processAdvancedConversation(assistantId, customerMessage, customerInfo) {
    console.log('🧠 Advanced AI Processing started');
    
    try {
      // 1. Get assistant configuration
      const assistant = await this.getAssistant(assistantId);
      if (!assistant) {
        throw new Error('Assistant not found');
      }

      // 2. Check if customer is paused (human handoff, etc.)
      const isPaused = await this.isCustomerPaused(assistantId, customerInfo.chatId);
      if (isPaused) {
        return {
          success: false,
          reason: 'customer_paused',
          message: 'This conversation has been transferred to a human agent.'
        };
      }

      // 3. Detect language
      const language = await this.detectLanguage(customerMessage.text, assistantId, customerInfo.chatId);
      
      // 4. Analyze sentiment
      const sentiment = await this.analyzeSentiment(customerMessage.text);
      
      // 5. Get customer preferences
      const preferences = await this.getCustomerPreferences(assistantId, customerInfo.chatId);
      
      // 6. Determine prompt variant (A/B testing)
      const promptVariant = await this.getPromptVariant(assistantId, customerInfo.chatId);
      
      // 7. Build enhanced context
      const context = await this.buildEnhancedContext(assistantId, customerInfo.chatId, {
        language,
        sentiment,
        preferences,
        promptVariant
      });

      // 8. Get AI response with enhanced prompt
      const aiResponse = await this.getEnhancedAIResponse(
        assistant, 
        customerMessage.text, 
        context, 
        promptVariant
      );

      // 9. Post-process response
      const processedResponse = await this.postProcessResponse(
        aiResponse, 
        language, 
        preferences
      );

      // 10. Log advanced conversation data
      await this.logAdvancedConversation({
        assistantId,
        customerInfo,
        message: customerMessage.text,
        response: processedResponse,
        language,
        sentiment,
        promptVariant,
        context
      });

      return {
        success: true,
        response: processedResponse,
        metadata: {
          language,
          sentiment,
          prompt_variant: promptVariant,
          processing_time: Date.now() - Date.now() // Will be set by caller
        }
      };

    } catch (error) {
      console.error('❌ Advanced AI Processing failed:', error);
      return {
        success: false,
        error: error.message,
        fallback_response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment."
      };
    }
  }

  /**
   * Detect customer message language
   */
  async detectLanguage(text, assistantId, customerId) {
    // Check cache first
    const cacheKey = `${assistantId}_${customerId}`;
    if (this.languageCache.has(cacheKey)) {
      return this.languageCache.get(cacheKey);
    }

    // Simple language detection patterns
    const patterns = {
      'ar': /[\u0600-\u06FF]/,
      'zh': /[\u4e00-\u9fff]/,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
      'ko': /[\uac00-\ud7af]/,
      'ru': /[\u0400-\u04FF]/,
      'es': /\b(el|la|es|en|un|una|que|de|y|se|no|te|lo|muy|pero|más|todo|hacer|tiempo|él|cuando|algo)\b/gi,
      'fr': /\b(le|de|et|un|il|être|avoir|que|pour|dans|ce|son|une|sur|avec|ne|pas|tout|plus|pouvoir)\b/gi,
      'de': /\b(der|die|das|und|den|von|zu|mit|sich|auf|für|ist|dem|nicht|ein|eine|als|auch|werden)\b/gi,
      'it': /\b(il|di|che|la|per|un|è|sono|si|da|le|con|ma|se|non|nel|può|più|essere|questo|molto)\b/gi,
      'pt': /\b(de|que|do|da|em|para|com|não|uma|os|no|se|na|por|mais|como|mas|foi|ao|ele|tem|ser)\b/gi
    };

    let detectedLanguage = 'en'; // Default
    let maxMatches = 0;

    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = (text.match(pattern) || []).length;
      if (matches > maxMatches && matches > 2) {
        maxMatches = matches;
        detectedLanguage = lang;
      }
    }

    // Cache the result
    this.languageCache.set(cacheKey, detectedLanguage);

    // Store in database
    try {
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO customer_preferences 
          (assistant_id, customer_id, language, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [assistantId, customerId, detectedLanguage], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    } catch (dbError) {
      console.error('⚠️ Failed to store language preference:', dbError);
    }

    return detectedLanguage;
  }

  /**
   * Analyze message sentiment
   */
  async analyzeSentiment(text) {
    // Simple sentiment analysis (in production, use proper NLP library)
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'perfect',
      'love', 'like', 'happy', 'satisfied', 'pleased', 'thank', 'thanks',
      'awesome', 'brilliant', 'outstanding', 'superb', 'marvelous'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'hate', 'angry', 'frustrated',
      'disappointed', 'upset', 'annoyed', 'confused', 'problem', 'issue',
      'error', 'wrong', 'broken', 'failed', 'slow', 'difficult', 'hard'
    ];

    const words = text.toLowerCase().split(/\W+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    let sentiment = 'neutral';
    let score = 0;

    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = Math.min(1.0, (positiveCount - negativeCount) / words.length * 10);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';  
      score = Math.max(-1.0, (negativeCount - positiveCount) / words.length * -10);
    }

    return {
      sentiment,
      score,
      confidence: Math.abs(score)
    };
  }

  /**
   * Get customer preferences
   */
  async getCustomerPreferences(assistantId, customerId) {
    try {
      const preferences = await new Promise((resolve, reject) => {
        db.get(`
          SELECT * FROM customer_preferences 
          WHERE assistant_id = ? AND customer_id = ?
        `, [assistantId, customerId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      return preferences || {
        language: 'en',
        preferred_response_style: 'professional',
        timezone: null
      };
    } catch (error) {
      console.error('⚠️ Failed to get customer preferences:', error);
      return { language: 'en', preferred_response_style: 'professional' };
    }
  }

  /**
   * Determine prompt variant for A/B testing
   */
  async getPromptVariant(assistantId, customerId) {
    try {
      // Check if there's an active A/B test
      const abTest = await new Promise((resolve, reject) => {
        db.get(`
          SELECT * FROM prompt_ab_tests 
          WHERE assistant_id = ? AND status = 'active'
          AND datetime('now') <= datetime(started_at, '+' || duration_days || ' days')
          ORDER BY started_at DESC LIMIT 1
        `, [assistantId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!abTest) {
        return 'A'; // Default variant
      }

      // Consistent assignment based on customer ID hash
      const hash = this.hashCustomerId(customerId);
      const variant = (hash % 100) < abTest.traffic_split ? 'B' : 'A';
      
      return variant;
    } catch (error) {
      console.error('⚠️ Failed to determine prompt variant:', error);
      return 'A';
    }
  }

  /**
   * Hash customer ID for consistent A/B test assignment
   */
  hashCustomerId(customerId) {
    let hash = 0;
    for (let i = 0; i < customerId.length; i++) {
      const char = customerId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Build enhanced context with conversation history
   */
  async buildEnhancedContext(assistantId, customerId, metadata) {
    try {
      // Get recent conversation history
      const recentMessages = await new Promise((resolve, reject) => {
        db.all(`
          SELECT message_text, response_text, created_at
          FROM ai_conversations 
          WHERE assistant_id = ? AND customer_id = ?
          ORDER BY created_at DESC LIMIT 5
        `, [assistantId, customerId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      // Get knowledge base content
      const knowledgeFiles = await new Promise((resolve, reject) => {
        db.all(`
          SELECT content_text FROM knowledge_files 
          WHERE assistant_id = ? AND processing_status = 'completed'
          ORDER BY created_at DESC
        `, [assistantId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });

      const context = {
        conversation_history: recentMessages.reverse(), // Chronological order
        knowledge_base: knowledgeFiles.map(f => f.content_text).join('\n\n').substring(0, 6000),
        customer_info: {
          language: metadata.language,
          sentiment: metadata.sentiment?.sentiment,
          preferred_style: metadata.preferences?.preferred_response_style || 'professional'
        },
        session_info: {
          total_messages: recentMessages.length,
          last_interaction: recentMessages[recentMessages.length - 1]?.created_at
        }
      };

      return context;
    } catch (error) {
      console.error('⚠️ Failed to build enhanced context:', error);
      return { knowledge_base: '', conversation_history: [] };
    }
  }

  /**
   * Get AI response with enhanced prompting
   */
  async getEnhancedAIResponse(assistant, userMessage, context, promptVariant) {
    try {
      // Get the appropriate system prompt based on variant
      let systemPrompt = assistant.system_prompt;
      
      if (promptVariant === 'B') {
        const abTest = await new Promise((resolve, reject) => {
          db.get(`
            SELECT prompt_b FROM prompt_ab_tests 
            WHERE assistant_id = ? AND status = 'active'
            ORDER BY started_at DESC LIMIT 1
          `, [assistant.id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });
        
        if (abTest) {
          systemPrompt = abTest.prompt_b;
        }
      }

      // Enhance system prompt with context
      const enhancedPrompt = `${systemPrompt}

CUSTOMER CONTEXT:
- Language: ${context.customer_info.language}
- Sentiment: ${context.customer_info.sentiment || 'neutral'}  
- Preferred Style: ${context.customer_info.preferred_style}
- Previous Messages: ${context.conversation_history.length}

CONVERSATION HISTORY:
${context.conversation_history.slice(-3).map(msg => 
  `Customer: ${msg.message_text}\nAssistant: ${msg.response_text}`
).join('\n\n')}

KNOWLEDGE BASE:
${context.knowledge_base}

Instructions: Respond appropriately considering the customer's language, sentiment, and conversation history. Be consistent with previous responses while providing helpful, accurate information.`;

      // Call AI API
      if (assistant.ai_provider === 'claude') {
        console.log('🧠 Using Claude AI for response generation');
        
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': assistant.ai_api_key,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: assistant.ai_model || 'claude-3-5-sonnet-20241022',
            max_tokens: 500,
            messages: [
              {
                role: 'user',
                content: `${enhancedPrompt}\n\nCustomer: ${userMessage}`
              }
            ]
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('❌ Claude API error:', data);
          throw new Error(`Claude API error: ${data.error?.message || response.statusText}`);
        }
        
        console.log('✅ Claude response generated successfully');
        return data.content[0].text;
        
      } else if (assistant.ai_provider === 'openai') {
        // Fallback OpenAI support (deprecated)
        const { Configuration, OpenAIApi } = require('openai');
        
        const configuration = new Configuration({
          apiKey: assistant.ai_api_key,
        });
        const openai = new OpenAIApi(configuration);

        const response = await openai.createChatCompletion({
          model: assistant.ai_model,
          messages: [
            { role: 'system', content: enhancedPrompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7,
          presence_penalty: 0.1, // Encourage diverse responses
          frequency_penalty: 0.1  // Reduce repetition
        });

        return response.data.choices[0].message.content;
      }

      throw new Error(`AI provider '${assistant.ai_provider}' not supported. Use 'claude' or 'openai'.`);

    } catch (error) {
      console.error('❌ Enhanced AI response failed:', error);
      throw error;
    }
  }

  /**
   * Post-process AI response based on preferences
   */
  async postProcessResponse(response, language, preferences) {
    let processed = response;

    // Apply response style
    if (preferences.preferred_response_style === 'casual') {
      // Make response more casual (simplified example)
      processed = processed
        .replace(/I would recommend/g, "I'd suggest")
        .replace(/Please do not hesitate/g, "Feel free")
        .replace(/Thank you for your inquiry/g, "Thanks for asking");
    } else if (preferences.preferred_response_style === 'formal') {
      // Make response more formal
      processed = processed
        .replace(/can't/g, "cannot")
        .replace(/don't/g, "do not")
        .replace(/won't/g, "will not");
    }

    // Add language-specific formatting
    if (language === 'ar') {
      // Right-to-left text formatting hints
      processed = `${processed}`;
    }

    return processed;
  }

  /**
   * Log advanced conversation with enhanced metadata
   */
  async logAdvancedConversation(data) {
    try {
      const conversationId = await new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO ai_conversations 
          (assistant_id, customer_id, customer_name, customer_username,
           message_text, response_text, response_time_ms, success, 
           ai_model_used, language_detected, sentiment_score, prompt_variant,
           knowledge_used, conversation_context)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          data.assistantId,
          data.customerInfo.chatId,
          data.customerInfo.name,
          data.customerInfo.username,
          data.message,
          data.response,
          data.processingTime || 0,
          1, // success
          'enhanced', // ai_model_used
          data.language,
          data.sentiment?.score || 0,
          data.promptVariant,
          JSON.stringify({ files_used: 'enhanced_context' }),
          JSON.stringify({ 
            enhanced: true,
            context_length: data.context?.knowledge_base?.length || 0
          })
        ], function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        });
      });

      // Update assistant metrics
      await new Promise((resolve, reject) => {
        db.run(`
          UPDATE ai_assistants 
          SET total_conversations = total_conversations + 1,
              successful_responses = successful_responses + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [data.assistantId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      return conversationId;
    } catch (error) {
      console.error('❌ Failed to log advanced conversation:', error);
    }
  }

  /**
   * Helper methods
   */
  async getAssistant(assistantId) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT * FROM ai_assistants 
        WHERE id = ? AND status = 'active'
      `, [assistantId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async isCustomerPaused(assistantId, customerId) {
    try {
      const paused = await new Promise((resolve, reject) => {
        db.get(`
          SELECT * FROM ai_paused_customers 
          WHERE assistant_id = ? AND customer_id = ?
          AND (resume_at IS NULL OR resume_at > CURRENT_TIMESTAMP)
        `, [assistantId, customerId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      
      return !!paused;
    } catch (error) {
      console.error('⚠️ Failed to check customer pause status:', error);
      return false;
    }
  }

  /**
   * Quality scoring for training data
   */
  async scoreConversationQuality(conversationId, customerRating) {
    try {
      // Simple quality scoring algorithm
      let qualityScore = 0.5; // Base score

      if (customerRating) {
        qualityScore = customerRating / 5.0; // Normalize to 0-1
      }

      // Store as training data if quality is high
      if (qualityScore >= 0.8) {
        const conversation = await new Promise((resolve, reject) => {
          db.get(`
            SELECT * FROM ai_conversations WHERE id = ?
          `, [conversationId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (conversation) {
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT INTO ai_training_data 
              (assistant_id, conversation_id, input_text, expected_output, 
               actual_output, quality_score, category)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
              conversation.assistant_id,
              conversationId,
              conversation.message_text,
              conversation.response_text, // Expected = actual for high quality
              conversation.response_text,
              qualityScore,
              'customer_service'
            ], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      }

      return qualityScore;
    } catch (error) {
      console.error('❌ Failed to score conversation quality:', error);
      return 0.5;
    }
  }
}

module.exports = new AdvancedAIProcessor();