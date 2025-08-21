import React from 'react';
import { useLocation } from 'react-router-dom';
import N8nWorkflowEditor from '../components/N8nWorkflowEditor';

const WorkflowBuilder = () => {
  const location = useLocation();
  const botContext = location.state;

  console.log('🔧 WorkflowBuilder: Switching to n8n interface, bot context:', botContext);

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      <N8nWorkflowEditor />
    </div>
  );
};

export default WorkflowBuilder;