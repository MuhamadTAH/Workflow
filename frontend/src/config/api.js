// Centralized API configuration for all environments
// Uses VITE_API_BASE_URL environment variable set in Render

const getApiBaseUrl = () => {
  // 1. Use Render backend URL for production
  if (window.location.hostname === 'frontend-dpcg.onrender.com') {
    return 'https://workflow-lg9z.onrender.com';
  }
  
  // 2. Use Render environment variable if available
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 3. Development fallback - use local backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  
  // 4. Production fallback - use Render backend
  return 'https://workflow-lg9z.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

// Export commonly used API endpoints (n8n format)
export const API_ENDPOINTS = {
  // n8n Authentication (if needed, or use basic auth)
  LOGIN: `${API_BASE_URL}/api/login`,
  SIGNUP: `${API_BASE_URL}/api/signup`,
  PROFILE: `${API_BASE_URL}/api/profile`,
  
  // n8n Workflows API
  WORKFLOWS: `${API_BASE_URL}/api/v1/workflows`,
  SAVE_WORKFLOW: `${API_BASE_URL}/api/v1/workflows`,
  LOAD_WORKFLOW: `${API_BASE_URL}/api/v1/workflows`,
  DELETE_WORKFLOW: `${API_BASE_URL}/api/v1/workflows`,
  
  // n8n Executions API
  EXECUTIONS: `${API_BASE_URL}/api/v1/executions`,
  RUN_WORKFLOW: `${API_BASE_URL}/api/v1/workflows/run`,
  
  // n8n Credentials API
  CREDENTIALS: `${API_BASE_URL}/api/v1/credentials`,
  
  // Custom endpoints (bridge to n8n)
  RUN_NODE: `${API_BASE_URL}/api/nodes/run-node`,
  VALIDATE_TELEGRAM: `${API_BASE_URL}/api/nodes/validate-telegram-token`,
  GET_TELEGRAM_UPDATES: `${API_BASE_URL}/api/nodes/telegram-get-updates`,
  VALIDATE_WHATSAPP: `${API_BASE_URL}/api/nodes/validate-whatsapp`,
  
  // Uploads (will need custom handling)
  UPLOAD_PRODUCT_IMAGE: `${API_BASE_URL}/api/uploads/product-image`,
  UPLOAD_PRODUCT_VIDEO: `${API_BASE_URL}/api/uploads/product-video`,
  
  // Health
  HEALTH_CHECK: `${API_BASE_URL}/api/v1/healthz`,
  
};

// Debug logging in development AND production for debugging
console.log('🌐 API Configuration:', {
  baseUrl: API_BASE_URL,
  environment: import.meta.env.MODE,
  hostname: window.location.hostname,
  renderEnvVar: import.meta.env.VITE_API_BASE_URL,
  validateWhatsappEndpoint: `${API_BASE_URL}/api/nodes/validate-whatsapp`,
  allEndpoints: {
    VALIDATE_WHATSAPP: `${API_BASE_URL}/api/nodes/validate-whatsapp`
  }
});

export default API_BASE_URL;