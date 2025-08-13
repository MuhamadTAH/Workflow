// dbAsync.js — Promise helpers for sqlite3
// EXPECTS you already create and export a singleton sqlite3 Database in backend/services/db.js

const db = require('./db');

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) return reject(err);
      // `this` has .lastID / .changes from sqlite3
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

async function begin() { return runAsync('BEGIN'); }
async function commit() { return runAsync('COMMIT'); }
async function rollback() {
  try { return await runAsync('ROLLBACK'); } catch { /* ignore */ }
}

module.exports = { runAsync, getAsync, allAsync, begin, commit, rollback, db };