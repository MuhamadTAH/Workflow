// /backend/db.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : 'shoppro.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to database');
  }
});

const initDb = () => {
  db.serialize(() => {
    // Core tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS shops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
    
    // Read and execute the workflow schema
    const workflowSchemaPath = path.join(__dirname, 'workflow', 'database', 'workflowTables.sql');
    const workflowSchema = fs.readFileSync(workflowSchemaPath, 'utf8');
    db.exec(workflowSchema, (err) => {
      if (err) {
        console.error("Error initializing workflow tables:", err.message);
      } else {
        console.log("Workflow tables initialized successfully.");
      }
    });
  });
};

initDb();

module.exports = db;
