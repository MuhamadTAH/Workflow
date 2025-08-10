/*
=================================================================
BACKEND FILE: services/workflowState.js
=================================================================
Service to persist workflow activation state to survive server restarts.
Stores active workflows in database and restores them on startup.
*/

const db = require('../db');

class WorkflowState {
  constructor() {
    this.initializeTable();
  }

  // Initialize the active_workflows table
  initializeTable() {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS active_workflows (
          workflow_id TEXT PRIMARY KEY,
          workflow_data TEXT NOT NULL,
          activated_at TEXT NOT NULL,
          trigger_urls TEXT,
          status TEXT DEFAULT 'active'
        )
      `);
      console.log('✅ Active workflows table initialized');
    } catch (error) {
      console.error('❌ Failed to initialize active workflows table:', error);
    }
  }

  // Store workflow activation state
  async storeActiveWorkflow(workflowId, workflowData, triggerUrls = []) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO active_workflows 
        (workflow_id, workflow_data, activated_at, trigger_urls, status) 
        VALUES (?, ?, ?, ?, 'active')
      `);
      
      stmt.run(
        workflowId,
        JSON.stringify(workflowData),
        new Date().toISOString(),
        JSON.stringify(triggerUrls)
      );

      console.log(`💾 Stored active workflow ${workflowId} to database`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store active workflow ${workflowId}:`, error);
      return false;
    }
  }

  // Remove workflow from active state
  async removeActiveWorkflow(workflowId) {
    try {
      const stmt = db.prepare('DELETE FROM active_workflows WHERE workflow_id = ?');
      const result = stmt.run(workflowId);
      
      if (result.changes > 0) {
        console.log(`🗑️ Removed active workflow ${workflowId} from database`);
        return true;
      } else {
        console.log(`⚠️ Workflow ${workflowId} not found in database`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to remove active workflow ${workflowId}:`, error);
      return false;
    }
  }

  // Get all active workflows from database
  async getActiveWorkflows() {
    try {
      const stmt = db.prepare('SELECT * FROM active_workflows WHERE status = "active"');
      const rows = stmt.all();
      
      const workflows = rows.map(row => ({
        workflowId: row.workflow_id,
        workflow: JSON.parse(row.workflow_data),
        triggerUrls: JSON.parse(row.trigger_urls || '[]'),
        activatedAt: row.activated_at,
        status: row.status
      }));

      console.log(`📋 Retrieved ${workflows.length} active workflows from database`);
      return workflows;
    } catch (error) {
      console.error('❌ Failed to retrieve active workflows:', error);
      return [];
    }
  }

  // Restore workflows on server startup
  async restoreActiveWorkflows(workflowExecutor, activeWorkflowsMap) {
    try {
      const workflows = await this.getActiveWorkflows();
      let restored = 0;

      for (const workflowData of workflows) {
        try {
          console.log(`🔄 Attempting to restore workflow: ${workflowData.workflowId}`);
          console.log(`   - Nodes: ${workflowData.workflow?.nodes?.length || 0}`);
          console.log(`   - Edges: ${workflowData.workflow?.edges?.length || 0}`);
          console.log(`   - Activated: ${workflowData.activatedAt}`);
          
          // Register with workflowExecutor
          workflowExecutor.registerWorkflow(workflowData.workflowId, workflowData.workflow, {});
          console.log(`   ✅ Registered with workflowExecutor`);
          
          // Add to controller's active workflows map
          activeWorkflowsMap.set(workflowData.workflowId, workflowData);
          console.log(`   ✅ Added to controller activeWorkflows map`);
          
          // Verify registration
          const isRegistered = workflowExecutor.activeWorkflows.has(workflowData.workflowId);
          console.log(`   🔍 Verification - In executor: ${isRegistered}`);
          
          restored++;
          console.log(`✅ Successfully restored workflow: ${workflowData.workflowId}`);
        } catch (error) {
          console.error(`❌ Failed to restore workflow ${workflowData.workflowId}:`, error.message);
          console.error(`   Error details:`, error);
          // Mark as failed in database but don't remove
          this.updateWorkflowStatus(workflowData.workflowId, 'failed');
        }
      }

      console.log(`✅ Restored ${restored}/${workflows.length} workflows on startup`);
      return restored;
    } catch (error) {
      console.error('❌ Failed to restore active workflows on startup:', error);
      return 0;
    }
  }

  // Update workflow status
  async updateWorkflowStatus(workflowId, status) {
    try {
      const stmt = db.prepare('UPDATE active_workflows SET status = ? WHERE workflow_id = ?');
      stmt.run(status, workflowId);
      console.log(`📝 Updated workflow ${workflowId} status to: ${status}`);
    } catch (error) {
      console.error(`❌ Failed to update workflow status: ${error}`);
    }
  }

  // Get workflow count statistics
  async getWorkflowStats() {
    try {
      const stmt = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM active_workflows 
        GROUP BY status
      `);
      const rows = stmt.all();
      
      const stats = {};
      rows.forEach(row => {
        stats[row.status] = row.count;
      });

      return stats;
    } catch (error) {
      console.error('❌ Failed to get workflow stats:', error);
      return {};
    }
  }

  // Clean up old failed workflows (older than 24 hours)
  async cleanupFailedWorkflows() {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 24);

      const stmt = db.prepare(`
        DELETE FROM active_workflows 
        WHERE status = 'failed' AND activated_at < ?
      `);
      
      const result = stmt.run(cutoffTime.toISOString());
      
      if (result.changes > 0) {
        console.log(`🧹 Cleaned up ${result.changes} failed workflows`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup failed workflows:', error);
    }
  }
}

// Create singleton instance
const workflowState = new WorkflowState();

module.exports = workflowState;