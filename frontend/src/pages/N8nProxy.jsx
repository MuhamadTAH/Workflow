import { useEffect } from 'react';

const N8nProxy = () => {
  useEffect(() => {
    // Redirect to n8n but make it look seamless
    window.location.replace('https://workflow-lg9z.onrender.com');
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
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
        <p>Redirecting to your professional workflow interface</p>
        <p><small>400+ nodes • AI capabilities • Professional automation</small></p>
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

export default N8nProxy;