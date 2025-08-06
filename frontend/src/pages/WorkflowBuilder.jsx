import React from 'react';
import WorkflowApp from '../components/workflownode/App.js';

// Import the necessary CSS files for the WorkflowNode system
import '../styles/workflownode/CustomLogicNode.css';

const WorkflowBuilder = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <WorkflowApp />
    </div>
  );
};

export default WorkflowBuilder;