/*
=================================================================
NODE SYSTEM PACKAGE - Main Entry Point
=================================================================
Modular node system for workflow builders with visual components.

Usage in other projects:
import { CustomNode, Sidebar, nodeMetadata } from './packages/node-system';

Features:
- Visual node components with professional styling
- Node palette/sidebar with drag-and-drop
- Node metadata and configuration system
- Node type definitions and schemas
- Extensible architecture for new node types
*/

// Main components
export { default as CustomNode } from './components/CustomNode';
export { default as Sidebar } from './components/Sidebar';

// Node metadata and types
export { nodeMetadata, getNodeMetadata, getNodesByCategory, categoryMetadata } from '../../shared/constants/nodeMetadata';

// Node types and schemas (to be implemented)
// export { nodeTypes } from './types/nodeTypes';
// export { nodeSchemas } from './types/nodeSchemas';

// Package metadata
export const packageInfo = {
  name: 'node-system',
  version: '1.0.0',
  description: 'Modular node system for workflow builders',
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    reactflow: '^11.7.4'
  },
  features: [
    'Visual node components',
    'Draggable node palette',
    'Node metadata system',
    'Professional styling',
    'Extensible architecture',
    'Category-based organization'
  ]
};