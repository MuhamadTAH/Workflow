// Simple logger service for e-commerce backend
const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${message}`, meta);
  },
  
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${message}`, meta);
  },
  
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, meta);
  },
  
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, meta);
    }
  },
  
  // Log error with context
  logError: (error, context = {}) => {
    console.error(`[ERROR] ${error.message}`, {
      stack: error.stack,
      ...context
    });
  }
};

module.exports = logger;