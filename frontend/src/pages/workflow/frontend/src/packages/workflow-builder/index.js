/*
=================================================================
WORKFLOW BUILDER PACKAGE - Main Entry Point
=================================================================
Complete workflow building system with ReactFlow integration.

Usage in other projects:
import { FlowEditor, WorkflowCanvas } from './packages/workflow-builder';

Features:
- ReactFlow-based visual workflow builder
- Drag-and-drop node creation
- Connection management
- Zoom and pan controls
- Workflow state management
- Export/import functionality
*/

// Main components
export { default as FlowEditor } from './components/FlowEditor';

// Workflow utilities (to be implemented)
// export { useWorkflowState } from './hooks/useWorkflowState';
// export { WorkflowCanvas } from './components/WorkflowCanvas';
// export { ConnectionManager } from './utils/ConnectionManager';

// Package metadata
export const packageInfo = {
  name: 'workflow-builder',
  version: '1.0.0',
  description: 'Complete workflow building system with ReactFlow integration',
  dependencies: {
    react: '^18.2.0',
    'react-dom': '^18.2.0',
    reactflow: '^11.7.4'
  },
  features: [
    'Visual workflow builder',
    'Drag-and-drop interface',
    'Connection management',
    'Zoom and pan controls',
    'State management',
    'Export/import workflows'
  ]
};