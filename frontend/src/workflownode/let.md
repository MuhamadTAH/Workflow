Text for your AI (apply exactly)
1) Add promise wrappers for sqlite3 (so we can await)
Path: backend/services/dbAsync.js

js
Copy
Edit
// dbAsync.js — Promise helpers for sqlite3
// EXPECTS you already create and export a singleton sqlite3 Database in backend/services/db.js:
//   const sqlite3 = require('sqlite3').verbose();
//   const db = new sqlite3.Database(process.env.SQLITE_PATH || 'data.sqlite');
//   module.exports = db;

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
If you don’t have backend/services/db.js, create it:
Path: backend/services/db.js

js
Copy
Edit
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.env.SQLITE_PATH || 'data.sqlite');
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');
});
module.exports = db;
2) Fix the “create workflow” route to await DB + validate inputs
Path: backend/routes/workflows.js (adjust to your file that handles POST create)

js
Copy
Edit
const express = require('express');
const router = express.Router();
const { runAsync, begin, commit, rollback } = require('../services/dbAsync');

// If you have a name sanitizer, import it:
const sanitizeName = (raw) => typeof raw === 'string' ? raw.trim() : '';

router.post('/api/workflows', async (req, res, next) => {
  try {
    const userId = req.user?.id || 'anonymous'; // adjust to your auth
    const rawName = req.body?.name;
    const safeName = sanitizeName(rawName);
    const description = typeof req.body?.description === 'string' ? req.body.description : '';
    const workflowData = req.body?.data ?? {}; // object
    const dataJson = JSON.stringify(workflowData);

    // Strong validation BEFORE touching DB
    if (!safeName) {
      return res.status(400).json({ error: 'Workflow name is required' });
    }

    // Log *exact* values that will be bound to the statement
    console.log('[workflows.create] INSERT params', {
      userIdType: typeof userId, userId,
      nameType: typeof safeName, name: safeName,
      descriptionType: typeof description, description,
      dataType: typeof dataJson, dataLength: dataJson.length
    });

    await begin();

    // IMPORTANT: column order MUST match params order
    const sql = `
      INSERT INTO workflows (user_id, name, description, data)
      VALUES (?, ?, ?, ?)
    `;
    const params = [userId, safeName, description, dataJson];

    const result = await runAsync(sql, params);

    await commit();

    // Only now send 201
    return res.status(201).json({
      id: result.lastID,
      name: safeName,
      description,
      data: workflowData
    });
  } catch (err) {
    await rollback();
    // Don’t crash the process if headers were already sent
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to create workflow', details: err.message });
    }
    return next(err);
  }
});

module.exports = router;
Why this fixes your “timing paradox”

We do not call res.status(201) until the INSERT finishes successfully.

If SQLite throws SQLITE_CONSTRAINT: NOT NULL constraint failed: workflows.name, the catch path runs and returns 500 (or 400 if you choose), without having sent 201.

3) Add a global error handler so the server won’t crash
Path: backend/server.js (after all routes)

js
Copy
Edit
// Global error handler — keeps the process alive and returns JSON
// Must be the last app.use
app.use((err, req, res, next) => {
  console.error('[ERROR]', err && err.stack ? err.stack : err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message || String(err) });
});
4) Add DB defaults so “blank description/data” never break
Migration / bootstrap step — run once on startup if columns exist:

Path: backend/db/migrations/001_fix_defaults.sql

sql
Copy
Edit
-- Optional safety: ensure defaults exist so we never insert NULL accidentally
PRAGMA foreign_keys = ON;

-- If needed, create table (example)
-- CREATE TABLE IF NOT EXISTS workflows (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   user_id TEXT NOT NULL,
--   name TEXT NOT NULL,
--   description TEXT NOT NULL DEFAULT '',
--   data TEXT NOT NULL DEFAULT '{}'
-- );

-- If table exists but columns lack defaults, you’d normally rebuild the table in SQLite.
-- For MVP, we rely on app-level defaults ('' and '{}').
If you can rebuild the table safely, set description TEXT NOT NULL DEFAULT '' and data TEXT NOT NULL DEFAULT '{}'.

5) Add targeted diagnostics to catch “looks defined but is NULL” cases
Right before the INSERT, keep these logs (already included above), because the common causes of your exact symptom are:

You log req.body.name but insert safeName (sanitiser might return '' or undefined).

Parameter order mismatch: e.g., [userId, description, safeName, dataJson] which puts description into name.

safeName is non-string (object/number) → SQLite binding becomes NULL.

Those logs print type + value for every bound param so you can see the truth.

6) Optional: use better-sqlite3 (fully synchronous, simpler)
If you’d rather avoid callbacks/promises entirely, switch to better-sqlite3:

Install:

bash
Copy
Edit
npm i better-sqlite3
Path: backend/services/db.js

js
Copy
Edit
const Database = require('better-sqlite3');
const db = new Database(process.env.SQLITE_PATH || 'data.sqlite');
db.pragma('foreign_keys = ON');
module.exports = db;
Route (no promises needed):

js
Copy
Edit
const db = require('../services/db');
router.post('/api/workflows', (req, res) => {
  const rawName = req.body?.name;
  const safeName = typeof rawName === 'string' ? rawName.trim() : '';
  if (!safeName) return res.status(400).json({ error: 'Workflow name is required' });

  const userId = req.user?.id || 'anonymous';
  const description = typeof req.body?.description === 'string' ? req.body.description : '';
  const dataJson = JSON.stringify(req.body?.data ?? {});

  const stmt = db.prepare('INSERT INTO workflows (user_id, name, description, data) VALUES (?, ?, ?, ?)');
  const info = stmt.run(userId, safeName, description, dataJson);

  return res.status(201).json({ id: info.lastInsertRowid, name: safeName, description, data: req.body?.data ?? {} });
});
This completely eliminates the “response-before-insert” problem.

7) Quick validation checklist (run after patch)
Try creating with a valid name:

Expect 201 and row inserted.

Try with name: "" or missing name:

Expect 400 with “Workflow name is required”.

Temporarily swap param order on purpose and confirm you can reproduce the NOT NULL name error, then swap back.

Confirm logs show:

csharp
Copy
Edit
[workflows.create] INSERT params { userIdType:'string', nameType:'string', ... }
Confirm no “UnhandledPromiseRejection” in console, and the process stays up.

TL;DR of what was wrong
You were replying to the client before SQLite finished, so the error appears “after success”.

The value bound to name during the INSERT was actually NULL at execution time (most often param order/sanitiser issue), despite earlier logs showing a “good” value.