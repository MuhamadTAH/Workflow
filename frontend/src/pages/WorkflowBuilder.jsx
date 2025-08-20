import React from 'react';
import { useLocation } from 'react-router-dom';

const WorkflowBuilder = () => {
  const location = useLocation();
  const botContext = location.state;

  console.log('🔧 WorkflowBuilder: Embedding n8n interface, bot context:', botContext);

  const n8nUrl = 'https://workflow-lg9z.onrender.com';

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0 }}>
      <div style={{
        background: '#007acc',
        color: 'white',
        padding: '0.5rem 1rem',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        🚀 Professional Workflow Editor • 400+ Automation Nodes • AI Capabilities
      </div>
      
      <iframe
        src={n8nUrl}
        title="n8n Workflow Editor"
        width="100%"
        height="calc(100vh - 40px)"
        frameBorder="0"
        style={{
          border: 'none',
          background: 'white'
        }}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        onLoad={() => console.log('n8n workflow editor loaded')}
      />
      
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '0.5rem',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        {window.location.hostname} • Workflow Editor
      </div>
    </div>
  );
};

export default WorkflowBuilder;