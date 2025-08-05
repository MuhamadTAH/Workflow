/*
=================================================================
SHARED UTILITIES PACKAGE - Main Entry Point
=================================================================
Common utilities, components, and constants used across packages.

Usage in other projects:
import { nodeMetadata, config, CommonButton } from './shared';

Features:
- Node metadata and configuration
- Common UI components
- Utility functions and hooks
- Application constants
- Reusable business logic
*/

// Constants and configuration
export { nodeMetadata, getNodeMetadata, getNodesByCategory, categoryMetadata } from './constants/nodeMetadata';
export { default as config } from './constants/config';

// Common components (to be implemented)
// export { CommonButton } from './components/CommonButton';
// export { ErrorBoundary } from './components/ErrorBoundary';
// export { LoadingSpinner } from './components/LoadingSpinner';

// Utility hooks (to be implemented)
// export { useLocalStorage } from './hooks/useLocalStorage';
// export { useDebounce } from './hooks/useDebounce';
// export { useAPI } from './hooks/useAPI';

// Utility functions (to be implemented)
// export { formatDate, formatNumber } from './utils/formatters';
// export { validateEmail, validateRequired } from './utils/validators';
// export { debounce, throttle } from './utils/performance';

// Package metadata
export const packageInfo = {
  name: 'shared',
  version: '1.0.0',
  description: 'Common utilities, components, and constants for workflow applications',
  dependencies: {
    react: '^18.2.0'
  },
  features: [
    'Node metadata system',
    'Common UI components',
    'Utility functions',
    'React hooks',
    'Validation utilities',
    'Performance helpers'
  ]
};