import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const ClaudeAPIModal = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Check connection status on mount
  useEffect(() => {
    if (isOpen) {
      checkConnectionStatus();
    }
  }, [isOpen]);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus(result.connected ? 'connected' : 'disconnected');
        if (result.connected) {
          setStatus('✅ Claude API is connected and ready');
        }
      }
    } catch (error) {
      console.error('Error checking Claude status:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      setStatus('❌ Please enter your Claude API key');
      return;
    }

    setIsConnecting(true);
    setStatus('🔗 Connecting to Claude API...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          apiKey: apiKey.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('✅ Successfully connected to Claude API!');
        setConnectionStatus('connected');
        setApiKey(''); // Clear the API key input for security
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setStatus('');
        }, 2000);
      } else {
        setStatus(`❌ Connection failed: ${result.error || 'Unknown error'}`);
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Claude API connection error:', error);
      setStatus(`❌ Network error: ${error.message}`);
      setConnectionStatus('disconnected');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    setStatus('🔌 Disconnecting from Claude API...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('✅ Successfully disconnected from Claude API');
        setConnectionStatus('disconnected');
        setApiKey('');
      } else {
        setStatus(`❌ Disconnect failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Claude API disconnect error:', error);
      setStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsConnecting(true);
    setStatus('🧪 Testing Claude API connection...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus(`✅ Connection test successful! Response: "${result.testResponse}"`);
      } else {
        setStatus(`❌ Test failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Claude API test error:', error);
      setStatus(`❌ Test error: ${error.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🤖</span>
            Claude API Configuration
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              color: '#6b7280',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Connection Status */}
        <div style={{
          padding: '1rem',
          borderRadius: '8px',
          backgroundColor: connectionStatus === 'connected' ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${connectionStatus === 'connected' ? '#bbf7d0' : '#fecaca'}`,
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: connectionStatus === 'connected' ? '#10b981' : '#ef4444',
              marginRight: '0.75rem'
            }}></div>
            <span style={{
              fontWeight: '500',
              color: connectionStatus === 'connected' ? '#065f46' : '#991b1b'
            }}>
              {connectionStatus === 'connected' ? 'Connected to Claude API' : 'Not Connected'}
            </span>
          </div>
        </div>

        {/* API Key Input */}
        {connectionStatus === 'disconnected' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Claude API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Claude API key (sk-ant-...)"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                outline: 'none',
                opacity: isConnecting ? '0.5' : '1'
              }}
              disabled={isConnecting}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isConnecting) {
                  handleConnect();
                }
              }}
            />
            <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
              Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Anthropic Console</a>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          {connectionStatus === 'disconnected' ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting || !apiKey.trim()}
              style={{
                flex: '1',
                backgroundColor: isConnecting || !apiKey.trim() ? '#9ca3af' : '#3b82f6',
                color: 'white',
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '6px',
                cursor: isConnecting || !apiKey.trim() ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
            >
              {isConnecting ? '⏳ Connecting...' : '🔗 Connect to Claude'}
            </button>
          ) : (
            <>
              <button
                onClick={handleTestConnection}
                disabled={isConnecting}
                style={{
                  flex: '1',
                  backgroundColor: isConnecting ? '#9ca3af' : '#10b981',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                {isConnecting ? '⏳ Testing...' : '🧪 Test Connection'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isConnecting}
                style={{
                  flex: '1',
                  backgroundColor: isConnecting ? '#9ca3af' : '#ef4444',
                  color: 'white',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                {isConnecting ? '⏳ Disconnecting...' : '🔌 Disconnect'}
              </button>
            </>
          )}
        </div>

        {/* Status Message */}
        {status && (
          <div style={{
            padding: '1rem',
            borderRadius: '6px',
            backgroundColor: status.includes('✅') ? '#f0fdf4' : status.includes('❌') ? '#fef2f2' : '#eff6ff',
            color: status.includes('✅') ? '#15803d' : status.includes('❌') ? '#dc2626' : '#1d4ed8',
            fontSize: '0.875rem',
            marginBottom: '1rem'
          }}>
            {status}
          </div>
        )}

        {/* Instructions */}
        <div style={{
          backgroundColor: '#eff6ff',
          padding: '1rem',
          borderRadius: '6px',
          fontSize: '0.875rem'
        }}>
          <h4 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '0.5rem', margin: 0 }}>
            📋 How to get your Claude API key:
          </h4>
          <ol style={{ paddingLeft: '1.5rem', color: '#1e40af', lineHeight: '1.5', margin: '0.5rem 0 0 0' }}>
            <li>Visit <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Anthropic Console</a></li>
            <li>Sign in to your account</li>
            <li>Go to "API Keys" section</li>
            <li>Create a new API key</li>
            <li>Copy and paste it above</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ClaudeAPIModal;