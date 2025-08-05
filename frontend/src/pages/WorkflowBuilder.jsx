import React from 'react';
import WorkflowApp from './workflow/frontend/src/App.js';

// Import the necessary CSS files for the workflow system
import './workflow/frontend/src/packages/node-system/CustomNode.css';
import './workflow/frontend/src/packages/config-panel/ConfigPanel.css';
import './workflow/frontend/src/styles/ChatbotPanel.css';

const WorkflowBuilder = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <WorkflowApp />
    </div>
  );
};

export default WorkflowBuilder;