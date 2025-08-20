import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

const WorkflowBuilder = () => {
  const location = useLocation();
  const botContext = location.state;

  console.log('🔧 WorkflowBuilder: Professional workflow interface, bot context:', botContext);

  const n8nUrl = 'https://workflow-lg9z.onrender.com';

  // Redirect to n8n directly in same window
  React.useEffect(() => {
    console.log('🚀 Redirecting to n8n workflow editor...');
    window.location.href = n8nUrl;
  }, []);

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '600px', padding: '2rem' }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 2rem auto'
        }}></div>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          🚀 Redirecting to n8n Workflow Editor
        </h1>
        
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
          Taking you to the professional workflow automation platform...
        </p>
        
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          If you're not redirected automatically, 
          <a href={n8nUrl} style={{ color: 'white', textDecoration: 'underline' }}>
            click here
          </a>
        </p>
      </div>
      
      {/* CSS for loading animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WorkflowBuilder;