/*
=================================================================
CONFIG PANEL PACKAGE - Main Entry Point
=================================================================
Modular, reusable configuration panel system for workflow builders.

Usage in other projects:
import { ConfigPanel, DragDropSystem, JSONViewer } from './packages/config-panel';

Features:
- Universal template parser with drag-and-drop
- Professional n8n-style UI
- Node-specific parameter forms
- Real-time preview and validation
- Auto-save functionality
*/

// Main components
export { default as ConfigPanel } from './ConfigPanel';
export { InputPanel, OutputPanel, MainPanelHeader } from './components/PanelSections';
export { default as JSONViewer } from './components/JSONViewer';

// Drag and drop system
export { 
  DraggableJSONField, 
  DroppableTextInput, 
  processTemplate 
} from './drag-drop/DragDropSystem';

// Form system
export { renderNodeParameters } from './forms/NodeParameters';

// Utilities and hooks
export { 
  useAutoSave, 
  useFormFieldChangeHandler,
  createFormChangeHandler,
  createInputChangeHandler,
  initializeFormData
} from './utils/utils';

// Package metadata
export const packageInfo = {
  name: 'config-panel',
  version: '1.0.0',
  description: 'Modular configuration panel system for workflow builders',
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0'
  },
  features: [
    'Universal template parser',
    'Drag-and-drop system',
    'Professional UI components',
    'Auto-save functionality',
    'Node-specific forms',
    'Real-time validation'
  ]
};