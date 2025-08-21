import { useState, useEffect } from 'react';
import '../styles/N8nWorkflowEditor.css';

const N8nWorkflowEditor = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const n8nUrl = 'https://workflow-lg9z.onrender.com';

  useEffect(() => {
    // Check if n8n is accessible
    const checkN8nAvailability = async () => {
      try {
        const response = await fetch(n8nUrl, { mode: 'no-cors' });
        setLoading(false);
      } catch (err) {
        // If iframe fails, offer redirect to n8n
        setError('iframe blocked - redirect available');
        setLoading(false);
      }
    };

    checkN8nAvailability();
  }, []);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setError('Failed to load n8n workflow editor');
    setLoading(false);
  };

  if (error) {
    return (
      <div className="n8n-error">
        <h3>🚀 Workflow Editor Loading...</h3>
        <p>Professional workflow interface with 400+ nodes</p>
        
        <div style={{ marginTop: '2rem' }}>
          <button 
            onClick={() => window.open(n8nUrl, '_blank')}
            style={{ 
              marginTop: '1rem', 
              background: '#007acc',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🚀 Launch Workflow Editor (New Window)
          </button>
          
          <div style={{ marginTop: '2rem', fontSize: '14px', color: '#666' }}>
            <p>✅ Access to 400+ professional workflow nodes</p>
            <p>✅ Advanced automation and AI capabilities</p>
            <p>✅ Professional workflow execution engine</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="n8n-workflow-editor">
      {loading && (
        <div className="n8n-loading">
          <div className="loading-spinner"></div>
          <p>Loading n8n Workflow Editor...</p>
        </div>
      )}
      
      <iframe
        src={n8nUrl}
        title="n8n Workflow Editor"
        width="100%"
        height="100%"
        frameBorder="0"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="fullscreen"
        style={{ 
          display: loading ? 'none' : 'block',
          minHeight: '100vh'
        }}
      />
    </div>
  );
};

export default N8nWorkflowEditor;