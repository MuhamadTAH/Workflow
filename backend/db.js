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

});

module.exports = db;