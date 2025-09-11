import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const ChatWidgetAISettings = ({ isVisible, onClose }) => {
  // AI Configuration State
  const [config, setConfig] = useState({
    aiEnabled: false,
    autoReply: false,
    apiKey: '',
    systemPrompt: 'You are a helpful customer support assistant for a website chat widget. Respond professionally and helpfully to visitor questions.',
    knowledgeBase: '',
    responseDelay: 2000,
    model: 'claude-3-5-sonnet-20241022'
  });
  
  // Loading and Error States
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Load config on component mount
  useEffect(() => {
    if (isVisible) {
      console.log('🔄 Chat Widget AI Settings modal opened - loading current settings...');
      loadConfig();
      checkConnectionStatus();
    }
  }, [isVisible]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/ai-config`);
      const data = await response.json();
      
      if (data.success) {
        // Keep the current API key if the loaded one is masked
        const loadedConfig = data.config;
        if (loadedConfig.apiKey && loadedConfig.apiKey.includes('••••')) {
          loadedConfig.apiKey = config.apiKey; // Keep current value
        }
        setConfig(loadedConfig);
      }
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/status`);
      const data = await response.json();
      
      const connected = data.connected || false;
      setIsConnected(connected);
      
      if (connected) {
        setStatus('✅ Claude API ready for Chat Widget integration');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setIsConnected(false);
    }
  };

  const connectClaudeAPI = async () => {
    if (!config.apiKey.trim()) {
      setStatus('❌ Please enter your Claude API key');
      return;
    }

    setIsConnecting(true);
    setStatus('🔗 Connecting to Claude AI...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/claude/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claudeApiKey: config.apiKey,
          systemPrompt: config.systemPrompt
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setStatus(`✅ Claude API Connected! Test Response: ${data.testResponse}`);
        setIsConnected(true);
        setError('');
        
        // Automatically enable AI when connected
        const autoEnabledConfig = {
          ...config,
          aiEnabled: true,
          autoReply: true
        };
        setConfig(autoEnabledConfig);
      } else {
        setStatus(`❌ Connection failed: ${data.error || 'Unknown error'}`);
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error connecting Claude:', error);
      setStatus(`❌ Network error: ${error.message}`);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/ai-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

  const resetToDefaultPrompt = () => {
    setConfig({
      ...config,
      systemPrompt: 'You are a helpful customer support assistant for a website chat widget. Respond professionally and helpfully to visitor questions.'
    });
  };

  if (!isVisible) return null;
  
  console.log('🚀 ChatWidgetAISettings is rendering!');

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
        padding: '0',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: '#4a90e2', 
          color: 'white', 
          padding: '1.5rem 2rem',
          borderRadius: '12px 12px 0 0',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <h2 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🤖 Chat Widget AI Configuration
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '50%'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div style={{ padding: '2rem' }}>

          {/* Claude AI Configuration Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#1f2937', 
              marginBottom: '1rem', 
              borderBottom: '2px solid #e5e7eb', 
              paddingBottom: '0.5rem'
            }}>
              🤖 Claude AI Configuration
            </h3>
            
            {/* Claude Connection Status */}
            <div style={{
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor: isConnected ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${isConnected ? '#bbf7d0' : '#fecaca'}`,
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#10b981' : '#ef4444',
                  marginRight: '0.75rem'
                }}></div>
                <span style={{
                  fontWeight: '500',
                  color: isConnected ? '#065f46' : '#991b1b'
                }}>
                  {isConnected ? 'Connected to Claude API' : 'Not Connected'}
                </span>
              </div>
            </div>

            {/* AI Enable Toggle */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                <input
                  type="checkbox"
                  checked={config.aiEnabled}
                  onChange={(e) => setConfig({...config, aiEnabled: e.target.checked})}
                  style={{ transform: 'scale(1.2)' }}
                />
                Enable AI Assistant
              </label>
            </div>

            {/* Auto Reply Toggle */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                <input
                  type="checkbox"
                  checked={config.autoReply}
                  onChange={(e) => setConfig({...config, autoReply: e.target.checked})}
                  disabled={!config.aiEnabled}
                  style={{ transform: 'scale(1.2)' }}
                />
                Auto Reply to Messages
              </label>
            </div>

            {/* Claude API Key Input */}
            <div style={{ marginBottom: '1rem' }}>
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
                value={config.apiKey}
                onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                placeholder="Enter your Claude API key (sk-ant-...)"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  opacity: isConnecting ? '0.5' : '1',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace'
                }}
                disabled={isConnecting}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isConnecting && config.apiKey.trim()) {
                    connectClaudeAPI();
                  }
                }}
              />
              <p style={{ 
                marginTop: '0.25rem', 
                fontSize: '0.75rem', 
                color: '#6b7280' 
              }}>
                Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4a90e2' }}>console.anthropic.com</a>
              </p>
            </div>

            {/* Connect Button */}
            <button
              onClick={connectClaudeAPI}
              disabled={isConnecting || !config.apiKey.trim()}
              style={{ 
                width: '100%',
                backgroundColor: isConnecting || !config.apiKey.trim() ? '#9ca3af' : '#4a90e2', 
                color: 'white', 
                padding: '0.75rem 1rem', 
                border: 'none',
                borderRadius: '6px', 
                cursor: isConnecting || !config.apiKey.trim() ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                marginBottom: '1rem'
              }}
            >
              {isConnecting ? '⏳ Connecting...' : '🔗 Connect Claude API'}
            </button>

            {/* Status Message */}
            {status && (
              <div style={{ 
                padding: '0.75rem', 
                borderRadius: '6px', 
                backgroundColor: status.includes('✅') ? '#f0fdf4' : status.includes('❌') ? '#fef2f2' : '#eff6ff',
                color: status.includes('✅') ? '#15803d' : status.includes('❌') ? '#dc2626' : '#1d4ed8',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                {status}
              </div>
            )}
          </div>

          {/* System Prompt Configuration Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#1f2937', 
              marginBottom: '1rem', 
              borderBottom: '2px solid #e5e7eb', 
              paddingBottom: '0.5rem'
            }}>
              🎭 System Prompt
            </h3>

            {/* System Prompt Text Area */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                System Prompt
              </label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
                placeholder="Enter how Claude should behave when responding to website visitors..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                Character count: {config.systemPrompt.length}/2000
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetToDefaultPrompt}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              🔄 Reset to Default
            </button>
          </div>

          {/* Knowledge Base Section */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#1f2937', 
              marginBottom: '1rem', 
              borderBottom: '2px solid #e5e7eb', 
              paddingBottom: '0.5rem'
            }}>
              📚 Knowledge Base
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Knowledge Base Content
              </label>
              <textarea
                value={config.knowledgeBase}
                onChange={(e) => setConfig({...config, knowledgeBase: e.target.value})}
                placeholder="Add company information, FAQs, policies, product details, etc..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#1f2937', 
              marginBottom: '1rem', 
              borderBottom: '2px solid #e5e7eb', 
              paddingBottom: '0.5rem'
            }}>
              ⚙️ Advanced Settings
            </h3>

            {/* Response Delay */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Response Delay: {config.responseDelay / 1000}s
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={config.responseDelay}
                onChange={(e) => setConfig({...config, responseDelay: parseInt(e.target.value)})}
                style={{
                  width: '100%',
                  margin: '0.5rem 0'
                }}
              />
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                How long to wait before AI responds (1-10 seconds)
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1rem',
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
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={saveConfig}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#9ca3af' : '#4a90e2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? '💾 Saving...' : '💾 Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidgetAISettings;