// Centralized API configuration for all environments
// Uses VITE_API_BASE_URL environment variable set in Render

const getApiBaseUrl = () => {
  // 1. Use Render environment variable if available
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2. Production detection (when served from production domain)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://workflow-lg9z.onrender.com';
  }
  
  // 3. Development fallback
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// Export commonly used API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/api/login`,
  SIGNUP: `${API_BASE_URL}/api/signup`,
  PROFILE: `${API_BASE_URL}/api/profile`,
  
  // Nodes
  RUN_NODE: `${API_BASE_URL}/api/nodes/run-node`,
  VALIDATE_TELEGRAM: `${API_BASE_URL}/api/nodes/validate-telegram-token`,
  GET_TELEGRAM_UPDATES: `${API_BASE_URL}/api/nodes/telegram-get-updates`,
  VERIFY_CLAUDE: `${API_BASE_URL}/api/verify-claude`,
  
  // Workflows
  SAVE_WORKFLOW: `${API_BASE_URL}/api/workflows/save`,
  LOAD_WORKFLOW: `${API_BASE_URL}/api/workflows/load`,
  DELETE_WORKFLOW: `${API_BASE_URL}/api/workflows/delete`,
  
  // Uploads
  UPLOAD_PRODUCT_IMAGE: `${API_BASE_URL}/api/uploads/product-image`,
  UPLOAD_PRODUCT_VIDEO: `${API_BASE_URL}/api/uploads/product-video`,
  
  // Health
  HEALTH_CHECK: `${API_BASE_URL}/api/health`,
  
  // Chat Trigger
  CHAT_WEBHOOK: `${API_BASE_URL}/api/webhooks/chatTrigger`
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