/**
 * Smart Database Connection
 * - Uses PostgreSQL (Supabase) in production
 * - Uses SQLite locally for development
 * - Provides unified interface for both
 */

const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql://');

console.log(`🔄 Database Mode: ${isProduction ? 'Production' : 'Development'} - ${usePostgres ? 'PostgreSQL' : 'SQLite'}`);

let db;

if (usePostgres && isProduction) {
  // Production: Use PostgreSQL (Supabase)
  console.log('🐘 Initializing PostgreSQL connection...');
  const { Client } = require('pg');
  
  const connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
  
  const client = new Client(connectionConfig);
  
  // Connect to database
  const connectDB = async () => {
    try {
      await client.connect();
      console.log('✅ Connected to PostgreSQL database (Supabase)');
    } catch (err) {
      console.error('❌ Error connecting to PostgreSQL database:', err);
      throw err;
    }
  };
  
  // Initialize connection
  connectDB();
  
  // Add helper methods for SQLite compatibility
  client.run = async (sql, params = []) => {
    try {
      const result = await client.query(sql, params);
      return {
        lastID: result.insertId || result.rows[0]?.id,
        changes: result.rowCount
      };
    } catch (error) {
      throw error;
    }
  };
  
  client.get = async (sql, params = []) => {
    try {
      const result = await client.query(sql, params);
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  };
  
  client.all = async (sql, params = []) => {
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  };
  
  db = client;
} else {
  // Development: Use SQLite
  console.log('📁 Initializing SQLite connection...');
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  const dbPath = path.join(__dirname, 'database.sqlite');
  
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error connecting to SQLite database:', err);
    } else {
      console.log('✅ Connected to SQLite database');
    }
  });
  
  // Promisify SQLite methods for async/await support
  const originalRun = db.run.bind(db);
  const originalGet = db.get.bind(db);
  const originalAll = db.all.bind(db);
  
  db.run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      originalRun(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  };
  
  db.get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      originalGet(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  };
  
  db.all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      originalAll(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  };
  
  db.query = db.all; // Alias for PostgreSQL compatibility
}

module.exports = db;