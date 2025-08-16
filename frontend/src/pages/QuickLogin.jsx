import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenManager } from '../api';

function QuickLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleQuickLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('https://workflow-lg9z.onrender.com/api/quick-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'mhamadtah548@gmail.com' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store token
        tokenManager.setToken(data.token);
        
        // Redirect to home/dashboard
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        minWidth: '400px'
      }}>
        <h1 style={{ marginBottom: '2rem', color: '#333' }}>Quick Login</h1>
        
        <div style={{
          background: '#f8f9fa',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          fontSize: '0.9rem'
        }}>
          <strong>Account:</strong> mhamadtah548@gmail.com
        </div>
        
        {error && (
          <div style={{
            background: '#fee',
            color: '#c53030',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        )}
        
        <button
          onClick={handleQuickLogin}
          disabled={loading}
          style={{
            background: loading ? '#ccc' : '#667eea',
            color: 'white',
            padding: '1rem 2rem',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            width: '100%',
            fontWeight: '600'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
          This bypasses the normal login process for testing.
        </div>
      </div>
    </div>
  );
}

export default QuickLogin;