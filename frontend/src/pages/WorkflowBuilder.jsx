import React from 'react';
import { useLocation } from 'react-router-dom';
import App from '../workflownode/components/core/App';

const WorkflowBuilder = () => {
  const location = useLocation();
  const botContext = location.state;

  console.log('🔧 WorkflowBuilder: Using local workflow system, bot context:', botContext);

  // Use the local workflow builder App component
  return <App botContext={botContext} />;
};

export default WorkflowBuilder;