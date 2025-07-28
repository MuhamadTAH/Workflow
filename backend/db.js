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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error creating products table:', err);
    } else {
      console.log('✅ Products table ready');
    }
  });
});

module.exports = db;