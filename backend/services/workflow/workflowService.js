const db = require('../../dbWrapper');

class WorkflowService {
  // Get all workflows for a user
  async getUserWorkflows(userId) {
    try {
      const workflows = await db.all(
        `SELECT 
          w.*,
          (SELECT COUNT(*) FROM workflow_executions we WHERE we.workflow_id = w.id) as execution_count,
          (SELECT COUNT(*) FROM workflow_executions we WHERE we.workflow_id = w.id AND we.status = 'completed') as success_count
        FROM workflows w 
        WHERE w.user_id = ? 
        ORDER BY w.updated_at DESC`,
        [userId]
      );

      // Calculate success rate and add execution stats
      return workflows.map(workflow => {
        const successRate = workflow.execution_count > 0 
          ? Math.round((workflow.success_count / workflow.execution_count) * 100)
          : 0;

        // Handle both flow_data and data column names
        let flowData = {};
        if (workflow.flow_data) {
          flowData = JSON.parse(workflow.flow_data);
        } else if (workflow.data) {
          flowData = JSON.parse(workflow.data);
        }

        return {
          ...workflow,
          execution_count: workflow.execution_count || 0,
          success_rate: successRate,
          flow_data: flowData
        };
      });
    } catch (error) {
      console.error('Error fetching user workflows:', error);
      throw error;
    }
  }

  // Get a specific workflow by ID
  async getWorkflowById(workflowId, userId) {
    try {
      const workflow = await db.get(
        `SELECT * FROM workflows WHERE id = ? AND user_id = ?`,
        [workflowId, userId]
      );

      if (!workflow) {
        return null;
      }

      // Handle both flow_data and data column names
      let flowData = {};
      if (workflow.flow_data) {
        flowData = JSON.parse(workflow.flow_data);
      } else if (workflow.data) {
        flowData = JSON.parse(workflow.data);
      }

      return {
        ...workflow,
        flow_data: flowData
      };
    } catch (error) {
      console.error('Error fetching workflow:', error);
      throw error;
    }
  }

  // Create a new workflow
  async createWorkflow(userId, workflowData) {
    try {
      const { name, description, flow_data = {} } = workflowData;
      
      // Try with flow_data first, fallback to data column if flow_data doesn't exist
      let result;
      try {
        result = await db.run(
          `INSERT INTO workflows (user_id, name, description, flow_data, updated_at) 
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [userId, name, description, JSON.stringify(flow_data)]
        );
      } catch (error) {
        if (error.message.includes('no column named flow_data')) {
          // Fallback to data column for existing database
          result = await db.run(
            `INSERT INTO workflows (user_id, name, description, data, updated_at) 
             VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [userId, name, description, JSON.stringify(flow_data)]
          );
        } else {
          throw error;
        }
      }

      return await this.getWorkflowById(result.lastInsertRowid, userId);
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  // Update an existing workflow
  async updateWorkflow(workflowId, userId, workflowData) {
    try {
      const { name, description, flow_data, status } = workflowData;
      
      const updateFields = [];
      const updateValues = [];

      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      if (flow_data !== undefined) {
        updateFields.push('flow_data = ?');
        updateValues.push(JSON.stringify(flow_data));
      }
      if (status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      updateValues.push(workflowId, userId);

      const result = await db.run(
        `UPDATE workflows SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`,
        updateValues
      );

      if (result.changes === 0) {
        return null; // Workflow not found or not owned by user
      }

      return await this.getWorkflowById(workflowId, userId);
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  // Delete a workflow
  async deleteWorkflow(workflowId, userId) {
    try {
      // First delete all executions for this workflow
      await db.run(
        `DELETE FROM workflow_executions WHERE workflow_id = ?`,
        [workflowId]
      );

      // Then delete the workflow
      const result = await db.run(
        `DELETE FROM workflows WHERE id = ? AND user_id = ?`,
        [workflowId, userId]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting workflow:', error);
      throw error;
    }
  }

  // Toggle workflow status (active/inactive)
  async toggleWorkflowStatus(workflowId, userId) {
    try {
      const workflow = await this.getWorkflowById(workflowId, userId);
      if (!workflow) {
        return null;
      }

      const newStatus = workflow.status === 'active' ? 'inactive' : 'active';
      
      return await this.updateWorkflow(workflowId, userId, { status: newStatus });
    } catch (error) {
      console.error('Error toggling workflow status:', error);
      throw error;
    }
  }

  // Duplicate a workflow
  async duplicateWorkflow(workflowId, userId) {
    try {
      const originalWorkflow = await this.getWorkflowById(workflowId, userId);
      if (!originalWorkflow) {
        return null;
      }

      const duplicateData = {
        name: `${originalWorkflow.name} (Copy)`,
        description: originalWorkflow.description,
        flow_data: originalWorkflow.flow_data
      };

      return await this.createWorkflow(userId, duplicateData);
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      throw error;
    }
  }

  // Execute a workflow (placeholder for now)
  async executeWorkflow(workflowId, userId, inputData = {}) {
    try {
      const workflow = await this.getWorkflowById(workflowId, userId);
      if (!workflow) {
        return null;
      }

      // Create execution record
      const executionResult = await db.run(
        `INSERT INTO workflow_executions (workflow_id, input_data, status) 
         VALUES (?, ?, 'running')`,
        [workflowId, JSON.stringify(inputData)]
      );

      // Update workflow last_executed_at
      await db.run(
        `UPDATE workflows SET last_executed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [workflowId]
      );

      // For now, simulate execution completion
      // In a real implementation, this would trigger the actual workflow execution
      setTimeout(async () => {
        try {
          await db.run(
            `UPDATE workflow_executions 
             SET status = 'completed', finished_at = CURRENT_TIMESTAMP, output_data = ? 
             WHERE id = ?`,
            [JSON.stringify({ message: 'Workflow executed successfully', timestamp: new Date().toISOString() }), executionResult.lastInsertRowid]
          );
        } catch (error) {
          console.error('Error updating execution status:', error);
        }
      }, 1000);

      return {
        execution_id: executionResult.lastInsertRowid,
        status: 'running',
        message: 'Workflow execution started'
      };
    } catch (error) {
      console.error('Error executing workflow:', error);
      throw error;
    }
  }

  // Get workflow execution history
  async getWorkflowExecutions(workflowId, userId, limit = 10) {
    try {
      // Verify user owns the workflow
      const workflow = await this.getWorkflowById(workflowId, userId);
      if (!workflow) {
        return null;
      }

      const executions = await db.all(
        `SELECT * FROM workflow_executions 
         WHERE workflow_id = ? 
         ORDER BY started_at DESC 
         LIMIT ?`,
        [workflowId, limit]
      );

      return executions.map(execution => ({
        ...execution,
        input_data: execution.input_data ? JSON.parse(execution.input_data) : {},
        output_data: execution.output_data ? JSON.parse(execution.output_data) : {}
      }));
    } catch (error) {
      console.error('Error fetching workflow executions:', error);
      throw error;
    }
  }

  // Get workflow statistics
  async getWorkflowStats(userId) {
    try {
      const stats = await db.get(
        `SELECT 
          COUNT(*) as total_workflows,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_workflows,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_workflows,
          (SELECT COUNT(*) FROM workflow_executions we 
           JOIN workflows w ON we.workflow_id = w.id 
           WHERE w.user_id = ?) as total_executions
        FROM workflows 
        WHERE user_id = ?`,
        [userId, userId]
      );

      return stats || {
        total_workflows: 0,
        active_workflows: 0,
        inactive_workflows: 0,
        total_executions: 0
      };
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      throw error;
    }
  }
}

module.exports = new WorkflowService();