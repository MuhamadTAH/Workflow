const db = require('../db-smart');

/**
 * Database Initialization Service
 * Ensures critical data exists after deployments that may wipe the database
 */
class DatabaseInitializer {
  
  /**
   * Initialize all critical database data
   */
  static async initialize() {
    console.log('🔄 Starting database initialization...');
    
    try {
      await this.ensureAIModelsExist();
      await this.ensureUserExists();
      await this.ensureUserFreeTierExists();
      
      console.log('✅ Database initialization completed successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensure AI models exist for billing system
   */
  static async ensureAIModelsExist() {
    try {
      // Check if Claude model exists
      const row = await db.get(`
        SELECT id FROM ai_models 
        WHERE model_id = ? AND is_active = ?
      `, ['claude-3-5-sonnet-20241022', true]);

      if (row) {
        console.log('✅ Claude AI model already exists');
        return;
      }

      console.log('⚠️ Claude AI model missing, inserting...');
      
      // Insert Claude model (using upsert for both SQLite and PostgreSQL)
      const insertSql = process.env.NODE_ENV === 'production' 
        ? `INSERT INTO ai_models 
           (name, provider, model_id, cost_per_input_token, cost_per_output_token, 
            price_per_input_token, price_per_output_token, markup_percentage, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (model_id) DO UPDATE SET
           name = EXCLUDED.name, is_active = EXCLUDED.is_active`
        : `INSERT OR REPLACE INTO ai_models 
           (name, provider, model_id, cost_per_input_token, cost_per_output_token, 
            price_per_input_token, price_per_output_token, markup_percentage, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const params = [
        'Claude Sonnet',
        'claude', 
        'claude-3-5-sonnet-20241022',
        0.000003, // $3 per 1M input tokens
        0.000015, // $15 per 1M output tokens  
        0.000006, // $6 per 1M input tokens (2x markup)
        0.000030, // $30 per 1M output tokens (2x markup)
        100.00,   // 100% markup
        true      // is_active
      ];
      
      const result = await db.run(insertSql, params);
      console.log(`✅ Claude AI model inserted successfully (ID: ${result.lastID})`);
    } catch (error) {
      console.error('❌ Error with AI models:', error);
      throw error;
    }
  }

  /**
   * Ensure default user exists (user ID 2)
   */
  static async ensureUserExists() {
    return new Promise((resolve, reject) => {
      // Check if user ID 2 exists
      db.get(`SELECT id FROM users WHERE id = 2`, [], (err, row) => {
        if (err) {
          console.error('❌ Error checking user existence:', err);
          return reject(err);
        }

        if (row) {
          console.log('✅ Default user (ID: 2) already exists');
          return resolve();
        }

        console.log('⚠️ Default user (ID: 2) missing, creating...');
        
        // Insert default user
        db.run(`
          INSERT OR REPLACE INTO users (id, name, email, password, created_at)
          VALUES (2, 'Default User', 'admin@workflow.com', 'hashed_password', CURRENT_TIMESTAMP)
        `, [], function(insertErr) {
          if (insertErr) {
            console.error('❌ Error creating default user:', insertErr);
            return reject(insertErr);
          }
          
          console.log('✅ Default user (ID: 2) created successfully');
          resolve();
        });
      });
    });
  }

  /**
   * Ensure user free tier record exists
   */
  static async ensureUserFreeTierExists() {
    return new Promise((resolve, reject) => {
      // Check if free tier record exists for user ID 2
      db.get(`
        SELECT id FROM user_free_tier WHERE user_id = 2 AND is_active = 1
      `, [], (err, row) => {
        if (err) {
          console.error('❌ Error checking user free tier:', err);
          return reject(err);
        }

        if (row) {
          console.log('✅ User free tier record already exists');
          return resolve();
        }

        console.log('⚠️ User free tier record missing, creating...');
        
        // Calculate next month reset date
        const resetDate = new Date();
        resetDate.setMonth(resetDate.getMonth() + 1, 1); // First day of next month
        
        // Insert free tier record
        db.run(`
          INSERT OR REPLACE INTO user_free_tier 
          (user_id, free_tokens_used, free_tokens_limit, reset_date, is_active, created_at)
          VALUES (2, 0, 1000, ?, 1, CURRENT_TIMESTAMP)
        `, [resetDate.toISOString().split('T')[0]], function(insertErr) {
          if (insertErr) {
            console.error('❌ Error creating user free tier record:', insertErr);
            return reject(insertErr);
          }
          
          console.log('✅ User free tier record created successfully');
          resolve();
        });
      });
    });
  }

  /**
   * Quick health check - verify critical data exists
   */
  static async healthCheck() {
    try {
      const checks = await Promise.all([
        this.checkAIModel(),
        this.checkUser(),
        this.checkFreeTier()
      ]);

      const allHealthy = checks.every(check => check.healthy);
      
      if (allHealthy) {
        console.log('✅ Database health check passed');
      } else {
        console.log('⚠️ Database health check found issues:', checks);
      }

      return {
        healthy: allHealthy,
        checks: checks
      };
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  static async checkAIModel() {
    return new Promise((resolve) => {
      db.get(`
        SELECT id FROM ai_models 
        WHERE model_id = 'claude-3-5-sonnet-20241022' AND is_active = 1
      `, [], (err, row) => {
        resolve({
          component: 'ai_model',
          healthy: !err && !!row,
          error: err?.message
        });
      });
    });
  }

  static async checkUser() {
    return new Promise((resolve) => {
      db.get(`SELECT id FROM users WHERE id = 2`, [], (err, row) => {
        resolve({
          component: 'user',
          healthy: !err && !!row,
          error: err?.message
        });
      });
    });
  }

  static async checkFreeTier() {
    return new Promise((resolve) => {
      db.get(`
        SELECT id FROM user_free_tier WHERE user_id = 2 AND is_active = 1
      `, [], (err, row) => {
        resolve({
          component: 'free_tier',
          healthy: !err && !!row,
          error: err?.message
        });
      });
    });
  }
}

module.exports = DatabaseInitializer;