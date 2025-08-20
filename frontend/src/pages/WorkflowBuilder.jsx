import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const WorkflowBuilder = () => {
  const location = useLocation();
  const botContext = location.state;
  const [showSetupHelper, setShowSetupHelper] = useState(false);

  console.log('🔧 WorkflowBuilder: Professional workflow interface, bot context:', botContext);

  const n8nUrl = 'https://workflow-lg9z.onrender.com';

  // Check if we need to handle setup
  useEffect(() => {
    // First try direct redirect
    const timer = setTimeout(() => {
      console.log('🚀 Redirecting to n8n workflow editor...');
      window.location.href = n8nUrl;
    }, 1000);

    return () => clearTimeout(timer);
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
          🚀 AI Agent Workflow Editor
        </h1>
        
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
          Opening your professional workflow automation platform...
        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '1.5rem', 
          borderRadius: '8px', 
          marginBottom: '2rem',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
            🔧 First Time Setup Required
          </h3>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', opacity: 0.9 }}>
            If you see a setup screen, please complete it once:
          </p>
          <ul style={{ textAlign: 'left', fontSize: '0.85rem', opacity: 0.9, margin: '0' }}>
            <li><strong>Email:</strong> admin@workflow.com</li>
            <li><strong>Password:</strong> workflow2025</li>
            <li><strong>First Name:</strong> Admin</li>
            <li><strong>Last Name:</strong> User</li>
          </ul>
          <p style={{ margin: '1rem 0 0 0', fontSize: '0.8rem', opacity: 0.8 }}>
            This is one-time only - future visits will go directly to workflows!
          </p>
        </div>
        
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          Not redirected automatically? 
          <a href={n8nUrl} style={{ color: 'white', textDecoration: 'underline', marginLeft: '0.5rem' }}>
            Click here to open AI Agent
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