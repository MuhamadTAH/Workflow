import React from 'react';
import { useLocation } from 'react-router-dom';
import N8nProxy from './N8nProxy';

const WorkflowBuilder = () => {
  const location = useLocation();
  const botContext = location.state;

  console.log('🔧 WorkflowBuilder: Redirecting to n8n workflow editor, bot context:', botContext);

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      <N8nProxy />
    </div>
  );
};

export default WorkflowBuilder;