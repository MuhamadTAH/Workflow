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
        setError('n8n backend is not accessible');
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
        <h3>🚫 Workflow Editor Unavailable</h3>
        <p>{error}</p>
        <button onClick={() => window.open(n8nUrl, '_blank')}>
          Open n8n in New Tab
        </button>
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