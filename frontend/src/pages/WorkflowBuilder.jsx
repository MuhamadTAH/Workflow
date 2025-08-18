import React from 'react';
import { useLocation } from 'react-router-dom';
import WorkflowApp from '../workflownode/components/core/App.js';
import '../workflownode/styles/index.css';

const WorkflowBuilder = () => {
  const location = useLocation();
  const botContext = location.state;

  console.log('🔧 WorkflowBuilder: Bot context received:', botContext);

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <WorkflowApp botContext={botContext} />
    </div>
  );
};

export default WorkflowBuilder;