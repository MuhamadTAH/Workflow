const db = require('../db-postgres');

/**
 * PostgreSQL Database Initialization Service
 * Ensures critical data exists and schema is set up properly
 */
class PostgreSQLInitializer {
  
  /**
   * Initialize PostgreSQL database with schema and data
   */
  static async initialize() {
    console.log('🔄 Starting PostgreSQL database initialization...');
    
    try {
      await this.createSchema();
      await this.ensureDefaultData();
      
      console.log('✅ PostgreSQL database initialization completed successfully');
    } catch (error) {
      console.error('❌ PostgreSQL database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database schema
   */
  static async createSchema() {
    console.log('📋 Creating database schema...');
    
    try {
      // Create users table
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create ai_models table
      await db.query(`
        CREATE TABLE IF NOT EXISTS ai_models (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          provider TEXT NOT NULL,
          model_id TEXT NOT NULL,
          cost_per_input_token DECIMAL(10,8) NOT NULL,
          cost_per_output_token DECIMAL(10,8) NOT NULL,
          price_per_input_token DECIMAL(10,8) NOT NULL,
          price_per_output_token DECIMAL(10,8) NOT NULL,
          markup_percentage DECIMAL(5,2) DEFAULT 100.00,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create user_billing table
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_billing (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          stripe_customer_id TEXT,
          payment_method_id TEXT,
          card_last_four TEXT,
          card_brand TEXT,
          card_exp_month INTEGER,
          card_exp_year INTEGER,
          billing_email TEXT,
          billing_address TEXT,
          spending_limit DECIMAL(10,2) DEFAULT 100.00,
          auto_billing BOOLEAN DEFAULT true,
          billing_cycle_day INTEGER DEFAULT 1,
          next_billing_date DATE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create ai_usage_tracking table
      await db.query(`
        CREATE TABLE IF NOT EXISTS ai_usage_tracking (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          ai_model_id INTEGER NOT NULL,
          conversation_id INTEGER,
          assistant_id INTEGER,
          request_type TEXT NOT NULL,
          input_tokens INTEGER NOT NULL DEFAULT 0,
          output_tokens INTEGER NOT NULL DEFAULT 0,
          total_tokens INTEGER NOT NULL DEFAULT 0,
          cost_input DECIMAL(10,6) NOT NULL DEFAULT 0,
          cost_output DECIMAL(10,6) NOT NULL DEFAULT 0,
          price_input DECIMAL(10,6) NOT NULL DEFAULT 0,
          price_output DECIMAL(10,6) NOT NULL DEFAULT 0,
          total_cost DECIMAL(10,6) NOT NULL DEFAULT 0,
          total_price DECIMAL(10,6) NOT NULL DEFAULT 0,
          profit DECIMAL(10,6) NOT NULL DEFAULT 0,
          response_time_ms INTEGER,
          success BOOLEAN DEFAULT true,
          error_message TEXT,
          billing_status TEXT DEFAULT 'pending',
          billed_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (ai_model_id) REFERENCES ai_models(id)
        )
      `);

      // Create user_free_tier table
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_free_tier (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL UNIQUE,
          free_tokens_used INTEGER DEFAULT 0,
          free_tokens_limit INTEGER DEFAULT 1000,
          reset_date DATE,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create whatsapp_receiver_messages table  
      await db.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_receiver_messages (
          id SERIAL PRIMARY KEY,
          phone_number TEXT NOT NULL,
          contact_name TEXT,
          message_text TEXT,
          message_id TEXT UNIQUE,
          message_type TEXT DEFAULT 'text',
          timestamp TEXT,
          raw_data TEXT,
          direction TEXT DEFAULT 'incoming',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create performance indexes
      await db.query(`CREATE INDEX IF NOT EXISTS idx_usage_user_date ON ai_usage_tracking (user_id, created_at)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_usage_billing_status ON ai_usage_tracking (billing_status, created_at)`);

      console.log('✅ Database schema created successfully');
    } catch (error) {
      console.error('❌ Error creating database schema:', error);
      throw error;
    }
  }

  /**
   * Ensure default data exists
   */
  static async ensureDefaultData() {
    console.log('📊 Ensuring default data exists...');
    
    try {
      // Insert default AI models
      await this.ensureAIModels();
      
      // Insert default user (ID 2)
      await this.ensureDefaultUser();
      
      // Create free tier for default user
      await this.ensureFreeTier();
      
      console.log('✅ Default data ensured');
    } catch (error) {
      console.error('❌ Error ensuring default data:', error);
      throw error;
    }
  }

  /**
   * Ensure AI models exist
   */
  static async ensureAIModels() {
    const models = [
      {
        name: 'Claude Sonnet',
        provider: 'claude',
        model_id: 'claude-3-5-sonnet-20241022',
        cost_per_input_token: 0.000003,
        cost_per_output_token: 0.000015,
        price_per_input_token: 0.000006,
        price_per_output_token: 0.000030,
        markup_percentage: 100.00
      }
    ];

    for (const model of models) {
      // Check if model exists
      const existing = await db.get(
        'SELECT id FROM ai_models WHERE model_id = $1', 
        [model.model_id]
      );

      if (!existing) {
        await db.query(`
          INSERT INTO ai_models (name, provider, model_id, cost_per_input_token, cost_per_output_token, price_per_input_token, price_per_output_token, markup_percentage, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
        `, [
          model.name, 
          model.provider, 
          model.model_id, 
          model.cost_per_input_token,
          model.cost_per_output_token,
          model.price_per_input_token,
          model.price_per_output_token,
          model.markup_percentage
        ]);
        
        console.log(`✅ Inserted AI model: ${model.name}`);
      } else {
        console.log(`✅ AI model already exists: ${model.name}`);
      }
    }
  }

  /**
   * Ensure default user exists (for user ID 2 compatibility)
   */
  static async ensureDefaultUser() {
    // First, check if we have a user with ID 2 specifically
    const userById = await db.get('SELECT * FROM users WHERE id = $1', [2]);
    
    if (!userById) {
      // Check if we have any user with the default email
      const userByEmail = await db.get('SELECT * FROM users WHERE email = $1', ['admin@workflow.com']);
      
      if (!userByEmail) {
        // Insert new user, but we need to handle the specific ID requirement
        await db.query(`
          INSERT INTO users (id, name, email, password, created_at) 
          VALUES (2, 'Default User', 'admin@workflow.com', 'hashed_password', CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO NOTHING
        `);
        console.log('✅ Created default user (ID: 2)');
      } else {
        console.log('✅ Default user exists with different ID:', userByEmail.id);
      }
    } else {
      console.log('✅ Default user (ID: 2) already exists');
    }
  }

  /**
   * Ensure free tier exists for user ID 2
   */
  static async ensureFreeTier() {
    const existing = await db.get(
      'SELECT * FROM user_free_tier WHERE user_id = $1 AND is_active = true',
      [2]
    );

    if (!existing) {
      const resetDate = new Date();
      resetDate.setMonth(resetDate.getMonth() + 1, 1);
      
      await db.query(`
        INSERT INTO user_free_tier (user_id, free_tokens_used, free_tokens_limit, reset_date, is_active, created_at)
        VALUES ($1, 0, 1000, $2, true, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO NOTHING
      `, [2, resetDate.toISOString().split('T')[0]]);
      
      console.log('✅ Created free tier record for user ID 2');
    } else {
      console.log('✅ Free tier record already exists for user ID 2');
    }
  }

  /**
   * Health check for PostgreSQL database
   */
  static async healthCheck() {
    try {
      // Test basic connection
      await db.query('SELECT 1');
      
      // Check critical tables exist
      const aiModel = await db.get(
        "SELECT * FROM ai_models WHERE model_id = $1 AND is_active = true", 
        ['claude-3-5-sonnet-20241022']
      );
      
      const user = await db.get('SELECT * FROM users WHERE id = $1', [2]);
      
      const freeTier = await db.get(
        'SELECT * FROM user_free_tier WHERE user_id = $1 AND is_active = true',
        [2]
      );

      return {
        healthy: true,
        checks: [
          { component: 'connection', healthy: true },
          { component: 'ai_model', healthy: !!aiModel },
          { component: 'user', healthy: !!user },
          { component: 'free_tier', healthy: !!freeTier }
        ]
      };
    } catch (error) {
      console.error('❌ PostgreSQL health check failed:', error);
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

module.exports = PostgreSQLInitializer;