/*
=================================================================
FILE: workflownode/constants/apiEndpoints.js
=================================================================
Backend API endpoint definitions - Updated to use centralized config
*/

import { API_BASE_URL } from '../../config/api.js';

const API_BASE = `${API_BASE_URL}/api`;

export const API_ENDPOINTS = {
  // Node execution
  RUN_NODE: `${API_BASE}/nodes/run-node`,
  
  // Workflow management
  SAVE_WORKFLOW: `${API_BASE}/workflows/save`,
  LOAD_WORKFLOW: `${API_BASE}/workflows/load`,
  DELETE_WORKFLOW: `${API_BASE}/workflows/delete`,
  
  // Node data
  GET_NODE_DATA: `${API_BASE}/nodes/data`,
  SET_NODE_DATA: `${API_BASE}/nodes/data`,
  
  // Execution history
  GET_EXECUTION_HISTORY: `${API_BASE}/executions/history`,
  GET_EXECUTION_RESULT: `${API_BASE}/executions/result`,
  
  // Health check
  HEALTH_CHECK: `${API_BASE}/health`
};

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH'
};

export const API_HEADERS = {
  JSON: {
    'Content-Type': 'application/json'
  },
  FORM_DATA: {
    'Content-Type': 'multipart/form-data'
  }
};