const logger = require('../services/logger');

// Global error handler middleware
function errorHandler(err, req, res, next) {
  // Log the error
  logger.logError(err, {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Don't expose internal errors to client
  if (res.headersSent) {
    return next(err);
  }

  // Default error response
  let status = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate entry';
  }

  // Send error response
  res.status(status).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.message
      })
    }
  });
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Request logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}

// Validation error helper
function createValidationError(message, field = null) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.field = field;
  return error;
}

// Generic API error handler
function handleAPIError(error, apiType = 'unknown', context = {}) {
  logger.logError(error, {
    type: `${apiType}_api_error`,
    ...context
  });

  // Return standardized error response
  return {
    success: false,
    error: {
      message: error.message,
      type: `${apiType}_error`,
      ...context
    }
  };
}

// Workflow execution error handler
function handleWorkflowError(error, executionId, nodeId = null) {
  const errorContext = {
    type: 'workflow_execution_error',
    executionId,
    nodeId
  };

  logger.logError(error, errorContext);

  return {
    success: false,
    error: {
      message: error.message,
      executionId,
      nodeId,
      timestamp: new Date().toISOString()
    }
  };
}

// Rate limiting error
function createRateLimitError() {
  const error = new Error('Too many requests');
  error.name = 'RateLimitError';
  error.status = 429;
  return error;
}

module.exports = {
  errorHandler,
  asyncHandler,
  requestLogger,
  createValidationError,
  handleAPIError,
  handleWorkflowError,
  createRateLimitError
};