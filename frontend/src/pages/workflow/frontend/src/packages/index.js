/*
=================================================================
PACKAGES - Master Entry Point
=================================================================
Central export point for all modular packages in the workflow system.

Usage:
import { ConfigPanel, CustomNode, api } from './packages';

This provides a clean import interface while maintaining modular structure.
*/

// Config Panel Package
export {
  ConfigPanel,
  InputPanel,
  OutputPanel,
  MainPanelHeader,
  JSONViewer,
  DraggableJSONField,
  DroppableTextInput,
  processTemplate,
  renderNodeParameters,
  useAutoSave,
  useFormFieldChangeHandler,
  initializeFormData
} from './config-panel';

// Node System Package
export {
  CustomNode,
  Sidebar,
  nodeMetadata,
  getNodeMetadata,
  getNodesByCategory,
  categoryMetadata
} from './node-system';

// Workflow Builder Package
export {
  FlowEditor
} from './workflow-builder';

// API Client Package
export {
  api
} from './api-client';

// Shared Utilities
export {
  config,
  formatDate,
  formatNumber,
  useLocalStorage
} from '../shared';

// Package information
export const allPackages = {
  'config-panel': {
    name: 'Configuration Panel System',
    description: 'Professional n8n-style configuration panels with drag-and-drop templates',
    version: '1.0.0'
  },
  'node-system': {
    name: 'Visual Node System',
    description: 'Node components and metadata for workflow builders',
    version: '1.0.0'
  },
  'workflow-builder': {
    name: 'Workflow Builder',
    description: 'ReactFlow-based visual workflow building system',
    version: '1.0.0'
  },
  'api-client': {
    name: 'API Client',
    description: 'Backend communication layer with authentication',
    version: '1.0.0'
  },
  'shared': {
    name: 'Shared Utilities',
    description: 'Common utilities, hooks, and components',
    version: '1.0.0'
  }
};