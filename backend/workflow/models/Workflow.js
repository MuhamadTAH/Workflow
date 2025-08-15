// /backend/workflow/models/Workflow.js
const db = require('../../dbWrapper');

const Workflow = {
  // Find all workflows for a specific user
  async findAllByUserId(userId) {
    const query = 'SELECT id, name, is_active, updated_at FROM workflows WHERE user_id = ? ORDER BY updated_at DESC';
    return await db.all(query, [userId]);
  },

  // Find a single workflow by its ID and user ID to ensure ownership
  async findById(id, userId) {
    const query = 'SELECT * FROM workflows WHERE id = ? AND user_id = ?';
    return await db.get(query, [id, userId]);
  },

  // Create a new workflow
  async create(name, userId) {
    const query = 'INSERT INTO workflows (name, user_id, data) VALUES (?, ?, ?)';
    // Initialize with empty data for a new workflow
    const initialData = JSON.stringify({ nodes: [], edges: [], viewport: {} });
    const result = await db.run(query, [name, userId, initialData]);
    return { id: result.lastID, name, userId };
  },

  // Update an existing workflow
  async updateById(id, data, userId) {
    const query = 'UPDATE workflows SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';
    const result = await db.run(query, [JSON.stringify(data), id, userId]);
    return result.changes > 0;
  }
};

module.exports = Workflow;
