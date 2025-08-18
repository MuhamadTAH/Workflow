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
  testConnection: () => api.get('/api/hello'),
  
  // Signup new user
  signup: (userData) => api.post('/api/signup', userData),
  
  // Login user
  login: (credentials) => api.post('/api/login', credentials),
  
  // Get user profile (protected)
  getProfile: () => api.get('/api/profile'),
};

// Workflow API functions
export const workflowAPI = {
  // Get all workflows for current user
  getWorkflows: () => api.get('/api/workflows'),
  
  // Get specific workflow by ID
  getWorkflow: (id) => api.get(`/api/workflows/${id}`),
  
  // Create new workflow
  createWorkflow: (workflowData) => api.post('/api/workflows', workflowData),
  
  // Update existing workflow
  updateWorkflow: (id, workflowData) => api.put(`/api/workflows/${id}`, workflowData),
  
  // Delete workflow
  deleteWorkflow: (id) => api.delete(`/api/workflows/${id}`)
};

// Connections API functions
export const connectionsAPI = {
  // Get all user connections
  getConnections: () => api.get('/api/connections'),
  
  // Get connection status for all platforms
  getStatus: () => api.get('/api/connections/status'),
  
  // Connect to a platform
  connect: (platform) => api.post(`/api/connections/${platform}`),
  
  // Connect to Telegram with bot token
  connectTelegram: (botToken) => api.post('/api/connections/telegram', { botToken }),
  
  // Connect to Instagram via OAuth
  connectInstagram: (code, state) => api.post('/api/connections/instagram', { code, state }),
  
  // Disconnect from a platform
  disconnect: (platform) => api.delete(`/api/connections/${platform}`)
};

// Shop API functions
export const shopAPI = {
  // Get user's shop
  getMyShop: () => api.get('/api/shops/my-shop'),
  
  // Create new shop
  createShop: (shopData) => api.post('/api/shops', shopData),
  
  // Update shop
  updateShop: (shopId, shopData) => api.put(`/api/shops/${shopId}`, shopData),
  
  // Get shop products
  getShopProducts: (shopName) => api.get(`/api/shops/${shopName}/products`),
  
  // Add product to shop
  addProduct: (shopName, productData) => api.post(`/api/shops/${shopName}/products`, productData),
  
  // Update product
  updateProduct: (productId, productData) => api.put(`/api/products/${productId}`, productData),
  
  // Delete product
  deleteProduct: (productId) => api.delete(`/api/products/${productId}`)
};

// Public Shop API functions
export const publicShopAPI = {
  // Get public shop data
  getShop: (shopName) => api.get(`/api/public/shop/${shopName}`),
  
  // Get public shop products
  getShopProducts: (shopName) => api.get(`/api/public/shop/${shopName}/products`)
};

// Token management
export const tokenManager = {
  setToken: (token) => localStorage.setItem('token', token),
  getToken: () => localStorage.getItem('token'),
  removeToken: () => localStorage.removeItem('token'),
  isLoggedIn: () => !!localStorage.getItem('token'),
};

export default api;