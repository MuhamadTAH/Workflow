import axios from 'axios';
import { API_BASE_URL } from './config/api.js';

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

// Connections API functions
export const connectionsAPI = {
  // Get all user connections
  getConnections: () => api.get('/connections'),
  
  // Get connection status for all platforms
  getStatus: () => api.get('/connections/status'),
  
  // Connect to a platform
  connect: (platform) => api.post(`/connections/${platform}`),
  
  // Disconnect from a platform
  disconnect: (platform) => api.delete(`/connections/${platform}`)
};

// Shop API functions
export const shopAPI = {
  // Get user's shop
  getMyShop: () => api.get('/shops/my-shop'),
  
  // Create new shop
  createShop: (shopData) => api.post('/shops', shopData),
  
  // Update shop
  updateShop: (shopId, shopData) => api.put(`/shops/${shopId}`, shopData),
  
  // Get shop products
  getShopProducts: (shopName) => api.get(`/shops/${shopName}/products`),
  
  // Add product to shop
  addProduct: (shopName, productData) => api.post(`/shops/${shopName}/products`, productData),
  
  // Update product
  updateProduct: (productId, productData) => api.put(`/products/${productId}`, productData),
  
  // Delete product
  deleteProduct: (productId) => api.delete(`/products/${productId}`)
};

// Public Shop API functions
export const publicShopAPI = {
  // Get public shop data
  getShop: (shopName) => api.get(`/public/shop/${shopName}`),
  
  // Get public shop products
  getShopProducts: (shopName) => api.get(`/public/shop/${shopName}/products`)
};

// Token management
export const tokenManager = {
  setToken: (token) => localStorage.setItem('token', token),
  getToken: () => localStorage.getItem('token'),
  removeToken: () => localStorage.removeItem('token'),
  isLoggedIn: () => !!localStorage.getItem('token'),
};

export default api;