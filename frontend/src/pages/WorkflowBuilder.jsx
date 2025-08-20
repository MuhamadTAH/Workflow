import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const WorkflowBuilder = () => {
  const location = useLocation();
  const botContext = location.state;
  const [showLauncher, setShowLauncher] = useState(true);

  console.log('🔧 WorkflowBuilder: Professional workflow interface, bot context:', botContext);

  const n8nUrl = 'https://workflow-lg9z.onrender.com';

  const launchWorkflowEditor = () => {
    window.open(n8nUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    setShowLauncher(false);
  };

  if (!showLauncher) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        textAlign: 'center'
      }}>
        <h2>🚀 Workflow Editor Launched</h2>
        <p>Your professional workflow editor is now open in a new window</p>
        <p><small>✅ 400+ automation nodes • ✅ AI capabilities • ✅ Professional interface</small></p>
        
        <button 
          onClick={launchWorkflowEditor}
          style={{
            background: '#007acc',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            marginTop: '2rem'
          }}
        >
          🔄 Reopen Workflow Editor
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '600px', padding: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
          🚀 Professional Workflow Editor
        </h1>
        
        <div style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
          <p>✅ 400+ Professional Automation Nodes</p>
          <p>✅ AI-Powered Workflow Capabilities</p>
          <p>✅ Advanced Integration & Execution Engine</p>
          <p>✅ Real-time Workflow Processing</p>
        </div>
        
        <button 
          onClick={launchWorkflowEditor}
          style={{
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            border: '2px solid white',
            padding: '1.5rem 3rem',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
            e.target.style.transform = 'scale(1)';
          }}
        >
          🎯 Launch Workflow Editor
        </button>
        
        <p style={{ marginTop: '2rem', opacity: 0.8, fontSize: '0.9rem' }}>
          Professional workflow automation platform • Secure • Reliable • Powerful
        </p>
      </div>
    </div>
  );
};

export default WorkflowBuilder;