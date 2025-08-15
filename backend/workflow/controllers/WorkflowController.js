// Main workflow controller
// Handles workflow CRUD operations
// Workflow validation and saving logic
// User permission checks for workflow access
// /backend/workflow/controllers/WorkflowController.js
const Workflow = require('../models/Workflow');

const WorkflowController = {
  // Get all workflows for the authenticated user
  async getAll(req, res) {
    try {
      const workflows = await Workflow.findAllByUserId(req.user.userId);
      res.status(200).json(workflows);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching workflows', error: error.message });
    }
  },

  // Get a single workflow by ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const workflow = await Workflow.findById(id, req.user.userId);
      if (!workflow) {
        return res.status(404).json({ message: 'Workflow not found or you do not have permission to view it.' });
      }
      // Parse the data string back into a JSON object before sending
      workflow.data = JSON.parse(workflow.data);
      res.status(200).json(workflow);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching workflow', error: error.message });
    }
  },

  // Create a new workflow
  async create(req, res) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Workflow name is required.' });
      }
      const newWorkflow = await Workflow.create(name, req.user.userId);
      res.status(201).json(newWorkflow);
    } catch (error) {
      res.status(500).json({ message: 'Error creating workflow', error: error.message });
    }
  },

  // Update a workflow
  async update(req, res) {
    try {
      const { id } = req.params;
      const { data } = req.body; // Expecting an object with nodes, edges, etc.
      
      if (!data) {
        return res.status(400).json({ message: 'Workflow data is required.' });
      }

      const success = await Workflow.updateById(id, data, req.user.userId);
      
      if (!success) {
        return res.status(404).json({ message: 'Workflow not found or you do not have permission to update it.' });
      }

      res.status(200).json({ message: 'Workflow saved successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Error saving workflow', error: error.message });
    }
  }
};

module.exports = WorkflowController;
