import React from 'react';
import WorkflowApp from '../workflownode/components/core/App.js';

// Import the WorkflowNode styles
import '../workflownode/styles/index.css';

const WorkflowBuilder = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <WorkflowApp />
    </div>
  );
};

export default WorkflowBuilder;