import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const InstagramAISettings = ({ isVisible, onClose }) => {
  const [config, setConfig] = useState({
    enabled: false,
    systemPrompt: 'You are a helpful assistant responding to Instagram direct messages. Keep responses friendly, concise, and helpful. Always respond in a conversational tone.',
    knowledgeBase: '',
    autoReply: true,
    model: 'claude-3-sonnet-20240229',
    maxTokens: 1000,
    responseDelay: 2000
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('Hi there!');
  const [testResponse, setTestResponse] = useState('');
  const [apiKeyValid, setApiKeyValid] = useState(null);
  const [error, setError] = useState('');

  // Load config on component mount
  useEffect(() => {
    if (isVisible) {
      loadConfig();
      validateApiKey();
    }
  }, [isVisible]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/config`);
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      
      if (data.success) {
        setError(''); // Clear any previous errors
        alert('✅ AI settings saved successfully!');
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testAI = async () => {
    if (!testMessage.trim()) return;
    
    setIsTesting(true);
    setTestResponse('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: testMessage })
      });

      const data = await response.json();
      
      if (data.success) {
        setTestResponse(data.response);
      } else {
        setTestResponse(`Error: ${data.error}`);
      }
    } catch (error) {
      setTestResponse(`Network error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const validateApiKey = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/validate`);
      const data = await response.json();
      
      setApiKeyValid(data.valid);
    } catch (error) {
      setApiKeyValid(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: '2px solid #E4405F',
          paddingBottom: '1rem'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#111827',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🤖 Instagram AI Assistant
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.5rem'
            }}
          >
            ✕
          </button>
        </div>

        {/* API Key Status */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            padding: '1rem',
            borderRadius: '8px',
            backgroundColor: apiKeyValid === null ? '#f3f4f6' : apiKeyValid ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${apiKeyValid === null ? '#d1d5db' : apiKeyValid ? '#22c55e' : '#ef4444'}`
          }}>
            <div style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: apiKeyValid === null ? '#6b7280' : apiKeyValid ? '#15803d' : '#dc2626'
            }}>
              {apiKeyValid === null ? '🔍 Checking API Key...' : apiKeyValid ? '✅ Claude API Key Valid' : '❌ Invalid or Missing API Key'}
            </div>
            {!apiKeyValid && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Add ANTHROPIC_API_KEY to your environment variables
              </div>
            )}
          </div>
        </div>

        {/* Main Toggle */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '1rem',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              style={{
                width: '20px',
                height: '20px',
                accentColor: '#E4405F'
              }}
            />
            Enable AI Assistant for Instagram DMs
          </label>
        </div>

        {config.enabled && (
          <>
            {/* Auto-Reply Toggle */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '1rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}>
                <input
                  type="checkbox"
                  checked={config.autoReply}
                  onChange={(e) => setConfig({ ...config, autoReply: e.target.checked })}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#E4405F'
                  }}
                />
                Auto-reply to incoming messages
              </label>
            </div>

            {/* Response Delay */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                Response Delay (milliseconds):
              </label>
              <input
                type="number"
                value={config.responseDelay}
                onChange={(e) => setConfig({ ...config, responseDelay: parseInt(e.target.value) })}
                min="0"
                max="30000"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Delay before sending auto-reply to seem more natural
              </div>
            </div>

            {/* System Prompt */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                System Prompt:
              </label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="Define how the AI should behave and respond..."
              />
            </div>

            {/* Knowledge Base */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                Knowledge Base:
              </label>
              <textarea
                value={config.knowledgeBase}
                onChange={(e) => setConfig({ ...config, knowledgeBase: e.target.value })}
                rows="6"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
                placeholder="Add specific information the AI should know about your business, products, services, FAQ, etc..."
              />
            </div>

            {/* AI Test Section */}
            <div style={{ 
              marginBottom: '2rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#374151',
                marginBottom: '1rem'
              }}>
                🧪 Test AI Response
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Type a test message..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <button
                onClick={testAI}
                disabled={isTesting || !testMessage.trim() || !apiKeyValid}
                style={{
                  backgroundColor: isTesting || !apiKeyValid ? '#9ca3af' : '#E4405F',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isTesting || !apiKeyValid ? 'not-allowed' : 'pointer',
                  marginBottom: '1rem'
                }}
              >
                {isTesting ? '🔄 Testing...' : '🚀 Test Response'}
              </button>
              
              {testResponse && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  <strong>AI Response:</strong><br/>
                  {testResponse}
                </div>
              )}
            </div>
          </>
        )}

        {/* Error Display */}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '2rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '1rem'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={saveConfig}
            disabled={isLoading || !apiKeyValid}
            style={{
              backgroundColor: isLoading || !apiKeyValid ? '#9ca3af' : '#E4405F',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: isLoading || !apiKeyValid ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '💾 Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstagramAISettings;