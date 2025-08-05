/*
=================================================================
API CLIENT PACKAGE - Main Entry Point
=================================================================
Backend communication layer for workflow applications.

Usage in other projects:
import { api, useAPI } from './packages/api-client';

Features:
- HTTP client with base configuration
- Authentication handling
- Request/response interceptors
- Error handling utilities
- API hooks for React components
*/

// Main API client
export { default as api } from './services/api';

// API utilities (to be implemented)
// export { useAPI } from './hooks/useAPI';
// export { APIProvider } from './providers/APIProvider';
// export { withAuth } from './utils/withAuth';

// Package metadata
export const packageInfo = {
  name: 'api-client',
  version: '1.0.0',
  description: 'Backend communication layer for workflow applications',
  dependencies: {
    react: '^18.2.0'
  },
  features: [
    'HTTP client configuration',
    'Authentication handling',
    'Request interceptors',
    'Error handling',
    'React hooks integration',
    'TypeScript support'
  ]
};