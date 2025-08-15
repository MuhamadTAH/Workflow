// /backend/dbWrapper.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs'); // Import the file system module
const { promisify } = require('util');

const dbPath = path.join(__dirname, 'database.sqlite');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to SQLite database:', err);
    process.exit(1);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Promisify database methods for better-sqlite3 compatibility
db.getAsync = promisify(db.get).bind(db);
db.allAsync = promisify(db.all).bind(db);
db.runAsync = promisify(db.run).bind(db);

// Create better-sqlite3 compatible wrapper with promise support
const dbWrapper = {
  // Promise-based methods for async/await compatibility
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },
  
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },
  
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            lastID: this.lastID,
            lastInsertRowid: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  },
  
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
  
  prepare: (sql) => {
    const stmt = db.prepare(sql);
    return {
      get: (params = []) => {
        return new Promise((resolve, reject) => {
          stmt.get(params, (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        });
      },
      all: (params = []) => {
        return new Promise((resolve, reject) => {
          stmt.all(params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          });
        });
      },
      run: (params = []) => {
        return new Promise((resolve, reject) => {
          stmt.run(params, function(err) {
            if (err) {
              reject(err);
            } else {
              resolve({
                lastID: this.lastID,
                lastInsertRowid: this.lastID,
                changes: this.changes
              });
            }
          });
        });
      },
      finalize: () => {
        return new Promise((resolve, reject) => {
          stmt.finalize((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
    };
  },
  
  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};

// Create tables if they don't exist
db.serialize(() => {
  // Create users table
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

  // Create social_connections table
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

  // Create shops table
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

  // Create products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image_url TEXT,
      videos TEXT,
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
    }
  });
  
  // --- FIX: ADD WORKFLOW TABLES ---
  const workflowSchemaPath = path.join(__dirname, 'workflow', 'database', 'workflowTables.sql');
  if (fs.existsSync(workflowSchemaPath)) {
    const workflowSchema = fs.readFileSync(workflowSchemaPath, 'utf8');
    db.exec(workflowSchema, (err) => {
      if (err) {
        console.error("❌ Error initializing workflow tables:", err.message);
      } else {
        console.log("✅ Workflow tables ready");
      }
    });
  } else {
    console.error("❌ Could not find workflowTables.sql file.");
  }

  // Try to add columns if they don't exist (for existing databases)
  db.run(`ALTER TABLE products ADD COLUMN videos TEXT`, (err) => {
    // Column already exists or other error, ignore
  });
  
  db.run(`ALTER TABLE products ADD COLUMN is_visible BOOLEAN DEFAULT 1`, (err) => {
    // Column already exists or other error, ignore
  });
});

module.exports = dbWrapper;
