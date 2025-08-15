// Workflow database model
// Defines workflow schema: id, user_id, name, description, nodes, connections
// Database operations for workflows
// Relationships with executions and logs

const dbWrapper = require('../../dbWrapper');

const Workflow = {
  // Find all workflows for a specific user
  async findAllByUserId(userId) {
    try {
      const workflows = await dbWrapper.all(
        'SELECT id, name, data, is_active, created_at, updated_at FROM workflows WHERE user_id = ? ORDER BY updated_at DESC',
        [userId]
      );
      return workflows.map(workflow => ({
        ...workflow,
        data: workflow.data ? JSON.parse(workflow.data) : null
      }));
    } catch (error) {
      console.error('Error finding workflows by user ID:', error);
      throw error;
    }
  },

  // Find a specific workflow by ID and user ID
  async findById(workflowId, userId) {
    try {
      const workflow = await dbWrapper.get(
        'SELECT id, name, data, is_active, created_at, updated_at FROM workflows WHERE id = ? AND user_id = ?',
        [workflowId, userId]
      );
      return workflow;
    } catch (error) {
      console.error('Error finding workflow by ID:', error);
      throw error;
    }
  },

  // Create a new workflow
  async create(name, userId) {
    try {
      const result = await dbWrapper.run(
        'INSERT INTO workflows (user_id, name, data, is_active) VALUES (?, ?, ?, ?)',
        [userId, name, JSON.stringify({ nodes: [], edges: [] }), 1]
      );
      
      return {
        id: result.lastID,
        name,
        data: { nodes: [], edges: [] },
        is_active: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  },

  // Update a workflow's data
  async updateById(workflowId, data, userId) {
    try {
      const result = await dbWrapper.run(
        'UPDATE workflows SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [JSON.stringify(data), workflowId, userId]
      );
      
      return result.changes > 0;
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }
};

module.exports = Workflow;