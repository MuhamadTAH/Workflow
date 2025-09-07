const { Client } = require('pg');

// PostgreSQL connection configuration
const connectionConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1qazxsw2@db.zuonhzhnhrixxkhnaqqd.supabase.co:5432/postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create and connect to PostgreSQL database
const db = new Client(connectionConfig);

// Connect to database
const connectDB = async () => {
  try {
    await db.connect();
    console.log('✅ Connected to PostgreSQL database (Supabase)');
  } catch (err) {
    console.error('❌ Error connecting to PostgreSQL database:', err);
    throw err;
  }
};

// Initialize connection
connectDB();

// Add helper methods to db client for SQLite compatibility
db.run = async (sql, params = []) => {
  try {
    const result = await db.query(sql, params);
    return {
      lastID: result.insertId || result.rows[0]?.id,
      changes: result.rowCount
    };
  } catch (error) {
    throw error;
  }
};

db.get = async (sql, params = []) => {
  try {
    const result = await db.query(sql, params);
    return result.rows[0] || null;
  } catch (error) {
    throw error;
  }
};

db.all = async (sql, params = []) => {
  try {
    const result = await db.query(sql, params);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

module.exports = db;