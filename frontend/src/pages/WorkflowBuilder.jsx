import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const WorkflowBuilder = () => {
  const location = useLocation();
  const botContext = location.state;

  console.log('🔧 WorkflowBuilder: Using n8n proxy integration, bot context:', botContext);

  useEffect(() => {
    // Redirect to proxied n8n interface
    window.location.href = '/workflow-editor';
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007acc',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <h3>🚀 Loading Workflow Editor...</h3>
        <p>Connecting to professional workflow interface</p>
        <p><small>✅ 400+ nodes • ✅ AI capabilities • ✅ Professional automation</small></p>
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default WorkflowBuilder;