/*
=================================================================
FILE: workflownode/constants/nodeTypes.js
=================================================================
Node type definitions and configurations
*/

export const NODE_TYPES = {
  // Logic Nodes
  IF: 'if',
  SWITCH: 'switch',
  MERGE: 'merge',
  FILTER: 'filter',
  
  // Data Nodes
  SET_DATA: 'set_data',
  COMPARE_DATASETS: 'compare_datasets',
  
  // Flow Control
  LOOP: 'loop',
  WAIT: 'wait',
  STOP_AND_ERROR: 'stop_and_error',
  EXECUTE_SUB_WORKFLOW: 'execute_sub_workflow'
};

export const NODE_CATEGORIES = {
  CONDITIONAL_LOGIC: 'Conditional Logic',
  DATA_PROCESSING: 'Data Processing', 
  WORKFLOW_CONTROL: 'Workflow Control',
  ADVANCED_OPERATIONS: 'Advanced Operations'
};

export const NODE_DEFINITIONS = [
  // Conditional Logic
  {
    type: NODE_TYPES.IF,
    category: NODE_CATEGORIES.CONDITIONAL_LOGIC,
    label: 'If',
    description: 'Route items to true/false branches based on conditions',
    icon: '🔀',
    color: '#10B981'
  },
  {
    type: NODE_TYPES.SWITCH,
    category: NODE_CATEGORIES.CONDITIONAL_LOGIC,
    label: 'Switch',
    description: 'Multi-path routing based on multiple rules',
    icon: '🔀',
    color: '#10B981'
  },
  
  // Data Processing
  {
    type: NODE_TYPES.FILTER,
    category: NODE_CATEGORIES.DATA_PROCESSING,
    label: 'Filter',
    description: 'Remove items based on filter conditions',
    icon: '🔍',
    color: '#3B82F6'
  },
  {
    type: NODE_TYPES.MERGE,
    category: NODE_CATEGORIES.DATA_PROCESSING,
    label: 'Merge',
    description: 'Combine data from multiple inputs',
    icon: '🔗',
    color: '#3B82F6'
  },
  {
    type: NODE_TYPES.SET_DATA,
    category: NODE_CATEGORIES.DATA_PROCESSING,
    label: 'Set Data',
    description: 'Create custom key-value pairs',
    icon: '📝',
    color: '#3B82F6'
  },
  
  // Workflow Control
  {
    type: NODE_TYPES.LOOP,
    category: NODE_CATEGORIES.WORKFLOW_CONTROL,
    label: 'Loop',
    description: 'Process data in batches or iterate over items',
    icon: '🔄',
    color: '#8B5CF6'
  },
  {
    type: NODE_TYPES.WAIT,
    category: NODE_CATEGORIES.WORKFLOW_CONTROL,
    label: 'Wait',
    description: 'Pause workflow execution',
    icon: '⏰',
    color: '#8B5CF6'
  },
  {
    type: NODE_TYPES.STOP_AND_ERROR,
    category: NODE_CATEGORIES.WORKFLOW_CONTROL,
    label: 'Stop and Error',
    description: 'Terminate workflow with error',
    icon: '🛑',
    color: '#EF4444'
  },
  
  // Advanced Operations
  {
    type: NODE_TYPES.COMPARE_DATASETS,
    category: NODE_CATEGORIES.ADVANCED_OPERATIONS,
    label: 'Compare Datasets',
    description: 'Compare two datasets and identify differences',
    icon: '⚖️',
    color: '#F59E0B'
  },
  {
    type: NODE_TYPES.EXECUTE_SUB_WORKFLOW,
    category: NODE_CATEGORIES.ADVANCED_OPERATIONS,
    label: 'Execute Sub Workflow',
    description: 'Run nested workflows',
    icon: '🎯',
    color: '#F59E0B'
  }
];