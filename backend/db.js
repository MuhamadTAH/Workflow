const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

// Create and connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite database:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Create users table if it doesn't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err);
    } else {
      console.log('✅ Users table ready');
    }
  });

  // Create social_connections table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS social_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      token_expires_at DATETIME,
      platform_user_id TEXT,
      platform_username TEXT,
      platform_profile_url TEXT,
      connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, platform)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating social_connections table:', err);
    } else {
      console.log('✅ Social connections table ready');
    }
  });

  // Create shops table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      shop_name TEXT UNIQUE NOT NULL,
      shop_display_name TEXT NOT NULL,
      description TEXT,
      contact_method TEXT NOT NULL,
      contact_value TEXT NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating shops table:', err);
    } else {
      console.log('✅ Shops table ready');
    }
  });

  // Create products table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image_url TEXT,
      is_active BOOLEAN DEFAULT 1,
      is_visible BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating products table:', err);
    } else {
      console.log('✅ Products table ready');
      
      // Add videos column to existing products table if it doesn't exist
      db.run(`ALTER TABLE products ADD COLUMN videos TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('❌ Error adding videos column:', err);
        }
      });
      
      // Add is_visible column to existing products table if it doesn't exist
      db.run(`ALTER TABLE products ADD COLUMN is_visible BOOLEAN DEFAULT 1`, (alterErr) => {
        if (alterErr && !alterErr.message.includes('duplicate column name')) {
          console.error('❌ Error adding is_visible column:', alterErr);
        } else if (!alterErr) {
          console.log('✅ Added is_visible column to products table');
        }
      });
    }
  });

  // Create chat_sessions table for general chat functionality (not chat triggers)
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      session_id TEXT PRIMARY KEY,
      workflow_id TEXT,
      title TEXT DEFAULT 'Chat Support',
      welcome_message TEXT DEFAULT '👋 Welcome! Send a message to start the conversation.',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating chat_sessions table:', err);
    } else {
      console.log('✅ Chat sessions table ready');
    }
  });

  // Create chat_messages table for general chat functionality (not chat triggers)
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      message_text TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_processed BOOLEAN DEFAULT 0,
      user_data TEXT,
      response_data TEXT,
      FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating chat_messages table:', err);
    } else {
      console.log('✅ Chat messages table ready');
    }
  });

  // Create telegram_conversations table for live chat functionality
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      telegram_chat_id TEXT NOT NULL,
      telegram_username TEXT,
      telegram_first_name TEXT,
      telegram_last_name TEXT,
      phone_number TEXT,
      status TEXT DEFAULT 'automated',
      assigned_agent_id INTEGER,
      last_message_text TEXT,
      last_message_timestamp DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, telegram_chat_id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating telegram_conversations table:', err);
    } else {
      console.log('✅ Telegram conversations table ready');
    }
  });

  // Create telegram_messages table for live chat functionality
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      message_id TEXT,
      sender_type TEXT NOT NULL,
      sender_name TEXT,
      message_text TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      telegram_message_id INTEGER,
      is_processed BOOLEAN DEFAULT 1,
      metadata TEXT,
      FOREIGN KEY (conversation_id) REFERENCES telegram_conversations(id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating telegram_messages table:', err);
    } else {
      console.log('✅ Telegram messages table ready');
    }
  });

  // Create telegram_bot_updates table to track last processed update_id for each bot
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_bot_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bot_token TEXT NOT NULL UNIQUE,
      last_update_id INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating telegram_bot_updates table:', err);
    } else {
      console.log('✅ Telegram bot updates table ready');
    }
  });

  // Create telegram_temp_sessions table for Client API verification
  db.run(`
    CREATE TABLE IF NOT EXISTS telegram_temp_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      phone_number TEXT NOT NULL,
      phone_code_hash TEXT NOT NULL,
      bot_token TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating telegram_temp_sessions table:', err);
    } else {
      console.log('✅ Telegram temp sessions table ready');
    }
  });

  // =================================================================
  // AI ASSISTANT SYSTEM TABLES - New Addition
  // =================================================================

  // Create ai_assistants table - Main AI assistant configurations
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_assistants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL DEFAULT 'My AI Assistant',
      telegram_token TEXT,
      ai_provider TEXT NOT NULL DEFAULT 'openai', -- 'openai', 'claude', 'custom'
      ai_api_key TEXT NOT NULL,
      ai_model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo', -- 'gpt-4', 'gpt-3.5-turbo', 'claude-3', etc.
      system_prompt TEXT NOT NULL DEFAULT 'You are a helpful customer service assistant.',
      status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'error'
      workflow_id TEXT, -- Auto-generated workflow ID when activated
      webhook_url TEXT, -- Auto-generated webhook URL
      last_error TEXT, -- Store last error message
      total_conversations INTEGER DEFAULT 0,
      successful_responses INTEGER DEFAULT 0,
      failed_responses INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, name) -- User can't have duplicate assistant names
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating ai_assistants table:', err);
    } else {
      console.log('✅ AI Assistants table ready');
    }
  });

  // Create knowledge_files table - Uploaded documents for AI knowledge base
  db.run(`
    CREATE TABLE IF NOT EXISTS knowledge_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id INTEGER NOT NULL,
      filename TEXT NOT NULL, -- Display filename for user
      original_filename TEXT NOT NULL, -- Original uploaded filename
      file_path TEXT, -- Actual file storage path
      content_text TEXT, -- Extracted text content from file
      file_size INTEGER, -- File size in bytes
      file_type TEXT NOT NULL, -- 'pdf', 'doc', 'docx', 'txt', 'md'
      processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
      processing_error TEXT, -- Error message if processing failed
      processed_at DATETIME, -- When processing completed
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating knowledge_files table:', err);
    } else {
      console.log('✅ Knowledge Files table ready');
    }
  });

  // Create ai_conversations table - Log all AI assistant conversations
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id INTEGER NOT NULL,
      customer_id TEXT NOT NULL, -- Telegram chat ID or user identifier
      customer_name TEXT, -- Customer's display name
      customer_username TEXT, -- Customer's username if available
      message_text TEXT NOT NULL, -- Customer's message
      response_text TEXT, -- AI's response
      response_time_ms INTEGER, -- How long AI took to respond
      success BOOLEAN DEFAULT 1, -- Whether response was successful
      error_message TEXT, -- Error message if failed
      ai_model_used TEXT, -- Which AI model was used for this response
      knowledge_used TEXT, -- Which knowledge files were referenced (JSON)
      conversation_context TEXT, -- Previous conversation context (JSON)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating ai_conversations table:', err);
    } else {
      console.log('✅ AI Conversations table ready');
      
      // Create indexes separately
      db.run(`CREATE INDEX IF NOT EXISTS idx_assistant_customer ON ai_conversations (assistant_id, customer_id)`, (indexErr) => {
        if (indexErr) {
          console.error('⚠️ Warning: Could not create assistant_customer index:', indexErr.message);
        }
      });
      
      db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON ai_conversations (created_at)`, (indexErr) => {
        if (indexErr) {
          console.error('⚠️ Warning: Could not create created_at index:', indexErr.message);
        }
      });
    }
  });

  // Create assistant_metrics table - Daily performance metrics
  db.run(`
    CREATE TABLE IF NOT EXISTS assistant_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id INTEGER NOT NULL,
      date DATE NOT NULL, -- YYYY-MM-DD format
      total_conversations INTEGER DEFAULT 0,
      successful_responses INTEGER DEFAULT 0,
      failed_responses INTEGER DEFAULT 0,
      avg_response_time_ms INTEGER DEFAULT 0,
      unique_customers INTEGER DEFAULT 0, -- How many different customers
      most_common_question TEXT, -- Most frequently asked question
      knowledge_hits INTEGER DEFAULT 0, -- How many times knowledge base was used
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants (id) ON DELETE CASCADE,
      UNIQUE(assistant_id, date) -- One record per assistant per day
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating assistant_metrics table:', err);
    } else {
      console.log('✅ Assistant Metrics table ready');
    }
  });

  // Create ai_prompt_templates table - Pre-defined system prompt templates
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_prompt_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE, -- 'Customer Service', 'Technical Support', etc.
      category TEXT NOT NULL, -- 'customer_service', 'sales', 'technical', 'custom'
      description TEXT,
      prompt_text TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0, -- Whether this is a default template
      is_active BOOLEAN DEFAULT 1,
      usage_count INTEGER DEFAULT 0, -- How many times this template was used
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating ai_prompt_templates table:', err);
    } else {
      console.log('✅ AI Prompt Templates table ready');
      
      // Insert default templates
      const defaultTemplates = [
        {
          name: 'Customer Service',
          category: 'customer_service',
          description: 'General customer service assistant',
          prompt_text: `You are a helpful customer service assistant for [Company Name].

Guidelines:
- Use the uploaded documents to answer questions accurately
- If you don't know something, say so politely
- Be professional and friendly
- Keep responses concise but helpful
- If the question requires human assistance, suggest contacting support

Always respond in a helpful and professional manner.`,
          is_default: 1
        },
        {
          name: 'Technical Support',
          category: 'technical',
          description: 'Technical support specialist',
          prompt_text: `You are a technical support specialist for [Company Name].

Guidelines:
- Provide step-by-step technical solutions
- Reference documentation when available
- Ask clarifying questions when needed
- Escalate complex issues to human support
- Be precise and accurate in technical details

Focus on solving technical problems efficiently.`,
          is_default: 1
        },
        {
          name: 'Sales Assistant',
          category: 'sales',
          description: 'Sales and product inquiry assistant',
          prompt_text: `You are a sales assistant for [Company Name].

Guidelines:
- Help customers find the right products/services
- Provide accurate pricing and feature information
- Guide customers through the sales process
- Answer product comparison questions
- Direct customers to purchase or contact sales team

Be enthusiastic and helpful while staying accurate.`,
          is_default: 1
        }
      ];

      // Insert templates if they don't exist
      defaultTemplates.forEach(template => {
        db.run(`INSERT OR IGNORE INTO ai_prompt_templates 
                (name, category, description, prompt_text, is_default) 
                VALUES (?, ?, ?, ?, ?)`,
          [template.name, template.category, template.description, template.prompt_text, template.is_default]
        );
      });
    }
  });

  // =================================================================
  // ADVANCED AI ASSISTANT FEATURES - Additional Tables
  // =================================================================

  // Create customer_preferences table - Store customer language and preferences
  db.run(`
    CREATE TABLE IF NOT EXISTS customer_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id INTEGER NOT NULL,
      customer_id TEXT NOT NULL,
      language TEXT DEFAULT 'en',
      timezone TEXT,
      preferred_response_style TEXT, -- 'formal', 'casual', 'technical'
      notification_preferences TEXT, -- JSON
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants (id) ON DELETE CASCADE,
      UNIQUE(assistant_id, customer_id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating customer_preferences table:', err);
    } else {
      console.log('✅ Customer Preferences table ready');
    }
  });

  // Create conversation_handoffs table - Human handoff system
  db.run(`
    CREATE TABLE IF NOT EXISTS conversation_handoffs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id INTEGER NOT NULL,
      customer_id TEXT NOT NULL,
      reason TEXT, -- 'complex_query', 'customer_request', 'ai_escalation'
      message_history TEXT, -- JSON of conversation history
      status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'resolved', 'cancelled'
      assigned_to INTEGER, -- User ID of human agent
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_at DATETIME,
      resolved_at DATETIME,
      resolution_notes TEXT,
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants (id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_to) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating conversation_handoffs table:', err);
    } else {
      console.log('✅ Conversation Handoffs table ready');
    }
  });

  // Create ai_paused_customers table - Temporarily pause AI for specific customers
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_paused_customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id INTEGER NOT NULL,
      customer_id TEXT NOT NULL,
      reason TEXT, -- 'human_handoff', 'customer_request', 'spam_detection'
      paused_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resume_at DATETIME,
      auto_resume BOOLEAN DEFAULT 1,
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants (id) ON DELETE CASCADE,
      UNIQUE(assistant_id, customer_id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating ai_paused_customers table:', err);
    } else {
      console.log('✅ AI Paused Customers table ready');
    }
  });

  // Create prompt_ab_tests table - A/B testing for system prompts
  db.run(`
    CREATE TABLE IF NOT EXISTS prompt_ab_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id INTEGER NOT NULL,
      test_name TEXT NOT NULL,
      prompt_a TEXT NOT NULL, -- Control prompt
      prompt_b TEXT NOT NULL, -- Test prompt
      traffic_split INTEGER DEFAULT 50, -- Percentage for prompt B (0-100)
      duration_days INTEGER DEFAULT 7,
      status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME,
      winner TEXT, -- 'A', 'B', or 'inconclusive'
      confidence_level REAL, -- Statistical confidence (0.0-1.0)
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating prompt_ab_tests table:', err);
    } else {
      console.log('✅ Prompt A/B Tests table ready');
    }
  });

  // Create conversation_ratings table - Customer feedback on AI responses
  db.run(`
    CREATE TABLE IF NOT EXISTS conversation_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      assistant_id INTEGER NOT NULL,
      customer_id TEXT NOT NULL,
      rating INTEGER, -- 1-5 stars
      feedback_text TEXT,
      rating_type TEXT DEFAULT 'explicit', -- 'explicit', 'implicit', 'derived'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES ai_conversations (id) ON DELETE CASCADE,
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating conversation_ratings table:', err);
    } else {
      console.log('✅ Conversation Ratings table ready');
    }
  });

  // Create ai_knowledge_chunks table - For advanced document chunking
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_knowledge_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      assistant_id INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      chunk_text TEXT NOT NULL,
      chunk_embedding BLOB, -- Vector embeddings for semantic search
      chunk_metadata TEXT, -- JSON metadata (page number, section, etc.)
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES knowledge_files (id) ON DELETE CASCADE,
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating ai_knowledge_chunks table:', err);
    } else {
      console.log('✅ AI Knowledge Chunks table ready');
      
      // Create index for semantic search
      db.run(`CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_assistant ON ai_knowledge_chunks (assistant_id)`, (indexErr) => {
        if (indexErr) {
          console.error('⚠️ Warning: Could not create knowledge chunks index:', indexErr.message);
        }
      });
    }
  });

  // Create ai_training_data table - Store conversations for model fine-tuning
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_training_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assistant_id INTEGER NOT NULL,
      conversation_id INTEGER NOT NULL,
      input_text TEXT NOT NULL,
      expected_output TEXT NOT NULL,
      actual_output TEXT,
      quality_score REAL, -- 0.0-1.0 based on customer feedback
      is_approved BOOLEAN DEFAULT 0, -- Manual approval for training
      category TEXT, -- 'customer_service', 'technical', 'sales', etc.
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      approved_by INTEGER,
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants (id) ON DELETE CASCADE,
      FOREIGN KEY (conversation_id) REFERENCES ai_conversations (id) ON DELETE CASCADE,
      FOREIGN KEY (approved_by) REFERENCES users (id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating ai_training_data table:', err);
    } else {
      console.log('✅ AI Training Data table ready');
    }
  });

  // Add new columns to existing ai_conversations table for enhanced tracking
  db.run(`ALTER TABLE ai_conversations ADD COLUMN prompt_variant TEXT DEFAULT 'A'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Error adding prompt_variant column:', err);
    }
  });

  db.run(`ALTER TABLE ai_conversations ADD COLUMN customer_rating INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Error adding customer_rating column:', err);
    }
  });

  db.run(`ALTER TABLE ai_conversations ADD COLUMN language_detected TEXT DEFAULT 'en'`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Error adding language_detected column:', err);
    }
  });

  db.run(`ALTER TABLE ai_conversations ADD COLUMN sentiment_score REAL`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('❌ Error adding sentiment_score column:', err);
    }
  });

  // =================================================================
  // PAY-AS-YOU-GO BILLING SYSTEM TABLES
  // =================================================================

  // Create ai_models table - Define AI models and pricing
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      provider TEXT NOT NULL, -- 'claude', 'openai', 'custom'
      model_id TEXT NOT NULL, -- 'claude-3-sonnet', 'gpt-4', etc.
      cost_per_input_token DECIMAL(10,8) NOT NULL, -- Cost we pay per input token
      cost_per_output_token DECIMAL(10,8) NOT NULL, -- Cost we pay per output token
      price_per_input_token DECIMAL(10,8) NOT NULL, -- Price we charge users per input token
      price_per_output_token DECIMAL(10,8) NOT NULL, -- Price we charge users per output token
      markup_percentage DECIMAL(5,2) DEFAULT 100.00, -- Markup percentage (100% = 2x cost)
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating ai_models table:', err);
    } else {
      console.log('✅ AI Models table ready');
      
      // Insert default models with 100% markup (2x cost)
      const defaultModels = [
        {
          name: 'Claude Sonnet',
          provider: 'claude',
          model_id: 'claude-3-5-sonnet-20241022',
          cost_per_input_token: 0.000003, // $3 per 1M tokens
          cost_per_output_token: 0.000015, // $15 per 1M tokens
          price_per_input_token: 0.000006, // $6 per 1M tokens (2x markup)
          price_per_output_token: 0.000030, // $30 per 1M tokens (2x markup)
          markup_percentage: 100.00
        },
        {
          name: 'Claude Haiku',
          provider: 'claude',
          model_id: 'claude-3-haiku-20240307',
          cost_per_input_token: 0.00000025, // $0.25 per 1M tokens
          cost_per_output_token: 0.00000125, // $1.25 per 1M tokens
          price_per_input_token: 0.0000005, // $0.50 per 1M tokens (2x markup)
          price_per_output_token: 0.0000025, // $2.50 per 1M tokens (2x markup)
          markup_percentage: 100.00
        },
        {
          name: 'Custom AI',
          provider: 'custom',
          model_id: 'custom-model-v1',
          cost_per_input_token: 0.000001, // $1 per 1M tokens
          cost_per_output_token: 0.000002, // $2 per 1M tokens
          price_per_input_token: 0.000002, // $2 per 1M tokens (2x markup)
          price_per_output_token: 0.000004, // $4 per 1M tokens (2x markup)
          markup_percentage: 100.00
        }
      ];

      defaultModels.forEach(model => {
        db.run(`INSERT OR IGNORE INTO ai_models 
                (name, provider, model_id, cost_per_input_token, cost_per_output_token, 
                 price_per_input_token, price_per_output_token, markup_percentage) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [model.name, model.provider, model.model_id, model.cost_per_input_token, 
           model.cost_per_output_token, model.price_per_input_token, 
           model.price_per_output_token, model.markup_percentage]
        );
      });
    }
  });

  // Create user_billing table - Store user payment methods and billing info
  db.run(`
    CREATE TABLE IF NOT EXISTS user_billing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      stripe_customer_id TEXT,
      payment_method_id TEXT,
      card_last_four TEXT,
      card_brand TEXT,
      card_exp_month INTEGER,
      card_exp_year INTEGER,
      billing_email TEXT,
      billing_address TEXT, -- JSON
      spending_limit DECIMAL(10,2) DEFAULT 100.00, -- Monthly spending limit
      auto_billing BOOLEAN DEFAULT 1, -- Auto-charge monthly
      billing_cycle_day INTEGER DEFAULT 1, -- Day of month to bill
      next_billing_date DATE,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating user_billing table:', err);
    } else {
      console.log('✅ User Billing table ready');
    }
  });

  // Create ai_usage_tracking table - Track every AI API call for billing
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_usage_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      ai_model_id INTEGER NOT NULL,
      conversation_id INTEGER, -- Link to ai_conversations if applicable
      assistant_id INTEGER, -- Link to ai_assistants if applicable
      request_type TEXT NOT NULL, -- 'chat', 'completion', 'embedding', etc.
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      cost_input DECIMAL(10,6) NOT NULL DEFAULT 0, -- Our cost for input tokens
      cost_output DECIMAL(10,6) NOT NULL DEFAULT 0, -- Our cost for output tokens
      price_input DECIMAL(10,6) NOT NULL DEFAULT 0, -- Price charged to user for input
      price_output DECIMAL(10,6) NOT NULL DEFAULT 0, -- Price charged to user for output
      total_cost DECIMAL(10,6) NOT NULL DEFAULT 0, -- Total cost we pay
      total_price DECIMAL(10,6) NOT NULL DEFAULT 0, -- Total price charged to user
      profit DECIMAL(10,6) NOT NULL DEFAULT 0, -- Our profit (price - cost)
      response_time_ms INTEGER,
      success BOOLEAN DEFAULT 1,
      error_message TEXT,
      billing_status TEXT DEFAULT 'pending', -- 'pending', 'billed', 'failed', 'refunded'
      billed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (ai_model_id) REFERENCES ai_models(id),
      FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id),
      FOREIGN KEY (assistant_id) REFERENCES ai_assistants(id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating ai_usage_tracking table:', err);
    } else {
      console.log('✅ AI Usage Tracking table ready');
      
      // Create indexes for performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_usage_user_date ON ai_usage_tracking (user_id, created_at)`, (indexErr) => {
        if (indexErr && !indexErr.message.includes('already exists')) {
          console.error('⚠️ Warning: Could not create usage_user_date index:', indexErr.message);
        }
      });
      
      db.run(`CREATE INDEX IF NOT EXISTS idx_usage_billing_status ON ai_usage_tracking (billing_status, created_at)`, (indexErr) => {
        if (indexErr && !indexErr.message.includes('already exists')) {
          console.error('⚠️ Warning: Could not create usage_billing_status index:', indexErr.message);
        }
      });
    }
  });

  // Create monthly_billing_summaries table - Monthly usage summaries for billing
  db.run(`
    CREATE TABLE IF NOT EXISTS monthly_billing_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      billing_month DATE NOT NULL, -- First day of billing month (YYYY-MM-01)
      total_requests INTEGER DEFAULT 0,
      total_input_tokens INTEGER DEFAULT 0,
      total_output_tokens INTEGER DEFAULT 0,
      total_tokens INTEGER DEFAULT 0,
      total_cost DECIMAL(10,2) DEFAULT 0, -- What we paid to AI providers
      total_amount DECIMAL(10,2) DEFAULT 0, -- What we charge user
      total_profit DECIMAL(10,2) DEFAULT 0, -- Our profit
      breakdown_by_model TEXT, -- JSON breakdown by AI model
      billing_status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'paid', 'failed', 'disputed'
      stripe_invoice_id TEXT,
      payment_intent_id TEXT,
      invoice_url TEXT,
      paid_at DATETIME,
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, billing_month)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating monthly_billing_summaries table:', err);
    } else {
      console.log('✅ Monthly Billing Summaries table ready');
    }
  });

  // Create user_spending_alerts table - Spending limit alerts
  db.run(`
    CREATE TABLE IF NOT EXISTS user_spending_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      alert_type TEXT NOT NULL, -- 'threshold', 'limit_reached', 'payment_failed'
      threshold_percentage INTEGER, -- 50, 75, 90, 100 (% of spending limit)
      current_amount DECIMAL(10,2) NOT NULL,
      spending_limit DECIMAL(10,2) NOT NULL,
      billing_month DATE NOT NULL,
      alert_sent BOOLEAN DEFAULT 0,
      sent_at DATETIME,
      acknowledged BOOLEAN DEFAULT 0,
      acknowledged_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating user_spending_alerts table:', err);
    } else {
      console.log('✅ User Spending Alerts table ready');
    }
  });

  // Create billing_transactions table - Record all payment transactions
  db.run(`
    CREATE TABLE IF NOT EXISTS billing_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      billing_summary_id INTEGER,
      transaction_type TEXT NOT NULL, -- 'charge', 'refund', 'adjustment'
      amount DECIMAL(10,2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      stripe_payment_intent_id TEXT,
      stripe_charge_id TEXT,
      payment_method TEXT, -- 'card', 'bank_transfer', etc.
      status TEXT DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'cancelled'
      failure_reason TEXT,
      receipt_url TEXT,
      description TEXT,
      metadata TEXT, -- JSON for additional data
      processed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (billing_summary_id) REFERENCES monthly_billing_summaries(id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating billing_transactions table:', err);
    } else {
      console.log('✅ Billing Transactions table ready');
    }
  });

  // Create user_free_tier table - Track free tier usage
  db.run(`
    CREATE TABLE IF NOT EXISTS user_free_tier (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      free_tokens_used INTEGER DEFAULT 0,
      free_tokens_limit INTEGER DEFAULT 1000, -- 1000 free tokens per month
      reset_date DATE, -- When free tier resets (monthly)
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating user_free_tier table:', err);
    } else {
      console.log('✅ User Free Tier table ready');
    }
  });

});

module.exports = db;