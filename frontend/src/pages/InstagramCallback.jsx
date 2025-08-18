import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { connectionsAPI } from '../api';

function InstagramCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      try {
        if (error) {
          console.error('Instagram OAuth error:', error, errorDescription);
          // Send error to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'INSTAGRAM_OAUTH_ERROR',
              error: errorDescription || error
            }, window.location.origin);
          }
          window.close();
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          if (window.opener) {
            window.opener.postMessage({
              type: 'INSTAGRAM_OAUTH_ERROR',
              error: 'No authorization code received'
            }, window.location.origin);
          }
          window.close();
          return;
        }

        console.log('Instagram OAuth callback received:', { code, state });

        // Exchange code for access token
        const response = await connectionsAPI.connectInstagram(code, state);
        
        if (response.data.connection) {
          console.log('Instagram connection successful:', response.data);
          
          // Send success to parent window
          if (window.opener) {
            window.opener.postMessage({
              type: 'INSTAGRAM_OAUTH_SUCCESS',
              connection: response.data.connection
            }, window.location.origin);
          }
        } else {
          throw new Error('Connection failed');
        }

      } catch (error) {
        console.error('Instagram OAuth processing error:', error);
        
        // Send error to parent window
        if (window.opener) {
          window.opener.postMessage({
            type: 'INSTAGRAM_OAUTH_ERROR',
            error: error.response?.data?.message || error.message || 'Connection failed'
          }, window.location.origin);
        }
      }

      // Close the popup window
      window.close();
    };

    handleOAuthCallback();
  }, [searchParams]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          📷
        </div>
        <h2 style={{
          color: '#E4405F',
          marginBottom: '10px'
        }}>
          Processing Instagram Connection...
        </h2>
        <p style={{
          color: '#666',
          margin: 0
        }}>
          Please wait while we connect your Instagram account.
        </p>
        <div style={{
          marginTop: '20px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #E4405F',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default InstagramCallback;