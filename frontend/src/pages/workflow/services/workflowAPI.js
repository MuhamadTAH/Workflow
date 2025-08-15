// API service for workflow operations
// CRUD operations for workflows
// Node configuration and validation
// Execution control (start, stop, status)
// /frontend/src/pages/workflow/services/workflowAPI.js
import api from '../../../api'; // Import the main configured axios instance

const BASE_URL = '/api/workflow';

export const workflowAPI = {
  /**
   * Fetches all workflows for the current user.
   * @returns {Promise<Array>} A list of workflows.
   */
  getAllWorkflows: () => {
    return api.get(BASE_URL);
  },

  /**
   * Fetches a single workflow by its ID.
   * @param {string} id - The ID of the workflow.
   * @returns {Promise<Object>} The full workflow object, including its data.
   */
  getWorkflowById: (id) => {
    return api.get(`${BASE_URL}/${id}`);
  },

  /**
   * Creates a new workflow with a given name.
   * @param {string} name - The name for the new workflow.
   * @returns {Promise<Object>} The newly created workflow object.
   */
  createWorkflow: (name) => {
    return api.post(BASE_URL, { name });
  },

  /**
   * Updates an existing workflow with new data.
   * @param {string} id - The ID of the workflow to update.
   * @param {Object} data - The workflow data (nodes, edges, viewport).
   * @returns {Promise<Object>} The server response.
   */
  updateWorkflow: (id, data) => {
    return api.put(`${BASE_URL}/${id}`, { data });
  },

  /**
   * Deletes a workflow by its ID.
   * @param {string} id - The ID of the workflow to delete.
   * @returns {Promise<Object>} The server response.
   */
  deleteWorkflow: (id) => {
    return api.delete(`${BASE_URL}/${id}`);
  }
};
