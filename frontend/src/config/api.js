// Centralized API configuration for all environments
// Uses VITE_API_BASE_URL environment variable set in Render

const getApiBaseUrl = () => {
  // 1. Use Render environment variable if available
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2. Production detection (when served from production domain)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://shoppro-backend.onrender.com'; // Production backend
  }
  
  // 3. Development fallback - use production backend
  return 'https://shoppro-backend.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Export commonly used API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/api/login`,
  SIGNUP: `${API_BASE_URL}/api/signup`,
  PROFILE: `${API_BASE_URL}/api/profile`,
  
  // Shops
  SHOPS: `${API_BASE_URL}/api/shops`,
  PRODUCTS: `${API_BASE_URL}/api/products`,
  
  // Uploads
  UPLOAD_PRODUCT_IMAGE: `${API_BASE_URL}/api/uploads/product-image`,
  UPLOAD_PRODUCT_VIDEO: `${API_BASE_URL}/api/uploads/product-video`,
  
  // Health
  HEALTH_CHECK: `${API_BASE_URL}/api/health`,
  
  // Connections
  CONNECTIONS: `${API_BASE_URL}/api/connections`
};

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🌐 API Configuration:', {
    baseUrl: API_BASE_URL,
    environment: import.meta.env.MODE,
    hostname: window.location.hostname,
    renderEnvVar: import.meta.env.VITE_API_BASE_URL
  });
}

export default API_BASE_URL;