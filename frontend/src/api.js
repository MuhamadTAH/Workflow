import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API functions
export const authAPI = {
  // Test backend connection
  testConnection: () => api.get('/hello'),
  
  // Signup new user
  signup: (userData) => api.post('/signup', userData),
  
  // Login user
  login: (credentials) => api.post('/login', credentials),
  
  // Get user profile (protected)
  getProfile: () => api.get('/profile'),
};

// Workflow API functions
export const workflowAPI = {
  // Get all workflows for current user
  getWorkflows: () => api.get('/workflows'),
  
  // Get specific workflow by ID
  getWorkflow: (id) => api.get(`/workflows/${id}`),
  
  // Create new workflow
  createWorkflow: (workflowData) => api.post('/workflows', workflowData),
  
  // Update existing workflow
  updateWorkflow: (id, workflowData) => api.put(`/workflows/${id}`, workflowData),
  
  // Delete workflow
  deleteWorkflow: (id) => api.delete(`/workflows/${id}`)
};

// Token management
export const tokenManager = {
  setToken: (token) => localStorage.setItem('token', token),
  getToken: () => localStorage.getItem('token'),
  removeToken: () => localStorage.removeItem('token'),
  isLoggedIn: () => !!localStorage.getItem('token'),
};

export default api;