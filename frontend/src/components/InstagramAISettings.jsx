import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const InstagramAISettings = ({ isVisible, onClose }) => {
  // AI Configuration State
  const [config, setConfig] = useState({
    enabled: false,
    systemPrompt: 'You are a helpful assistant responding to Instagram direct messages. Keep responses friendly, concise, and helpful. Always respond in a conversational tone.',
    knowledgeBase: '',
    autoReply: true,
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 1000,
    responseDelay: 2000
  });
  
  // Claude API Connection State  
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [isClaudeConnected, setIsClaudeConnected] = useState(false);
  const [isConnectingClaude, setIsConnectingClaude] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState('');
  
  // System Prompt State
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant responding to Instagram direct messages. Keep responses friendly, concise, and helpful. Always respond in a conversational tone.');
  const [isSystemPromptLoading, setIsSystemPromptLoading] = useState(false);
  const [systemPromptStatus, setSystemPromptStatus] = useState('');
  
  // PDF Knowledge Base State
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [hasKnowledgeBase, setHasKnowledgeBase] = useState(false);
  const [knowledgeBaseInfo, setKnowledgeBaseInfo] = useState(null);
  
  // Legacy state for compatibility
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('Hi there!');
  const [testResponse, setTestResponse] = useState('');
  const [error, setError] = useState('');

  // Load config on component mount
  useEffect(() => {
    if (isVisible) {
      console.log('🔄 Instagram AI Settings modal opened - loading current settings...');
      loadConfig();
      checkClaudeStatus();
      loadSystemPrompt();
      loadKnowledgeBaseInfo();
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

  const checkClaudeStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/validate`);
      const data = await response.json();
      
      const isConnected = data.valid || false;
      setIsClaudeConnected(isConnected);
      
      if (isConnected) {
        setClaudeStatus('✅ Claude API ready for Instagram integration');
      }
    } catch (error) {
      console.error('Error checking Claude status:', error);
      setIsClaudeConnected(false);
    }
  };

  const handleClaudeConnect = async () => {
    if (!claudeApiKey.trim()) {
      setClaudeStatus('❌ Please enter your Claude API key');
      return;
    }

    setIsConnectingClaude(true);
    setClaudeStatus('🔗 Connecting to Claude AI...');

    try {
      // Save API key to config and validate
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: claudeApiKey.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setClaudeStatus('✅ Claude AI connected! Ready for Instagram integration');
        setIsClaudeConnected(true);
        setClaudeApiKey('');
      } else {
        setClaudeStatus(`❌ Connection failed: ${result.error || 'Unknown error'}`);
        setIsClaudeConnected(false);
      }
    } catch (error) {
      console.error('Claude API connection error:', error);
      setClaudeStatus(`❌ Network error: ${error.message}`);
      setIsClaudeConnected(false);
    } finally {
      setIsConnectingClaude(false);
    }
  };

  const handleClaudeDisconnect = async () => {
    setIsConnectingClaude(true);
    setClaudeStatus('🔌 Disconnecting Claude AI...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setClaudeStatus('✅ Claude AI disconnected');
        setIsClaudeConnected(false);
        setClaudeApiKey('');
      } else {
        setClaudeStatus(`❌ Disconnect failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Claude API disconnect error:', error);
      setClaudeStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsConnectingClaude(false);
    }
  };

  const handleSystemPromptSave = async () => {
    if (!systemPrompt.trim()) {
      setSystemPromptStatus('❌ Please enter a system prompt');
      return;
    }

    setIsSystemPromptLoading(true);
    setSystemPromptStatus('💾 Saving system prompt...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/system-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemPrompt: systemPrompt.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSystemPromptStatus('✅ System prompt saved successfully!');
        // Update the config state to reflect the saved prompt
        setConfig(prev => ({ ...prev, systemPrompt: systemPrompt.trim() }));
        console.log('✅ System prompt saved and updated locally');
        setTimeout(() => setSystemPromptStatus(''), 3000);
      } else {
        setSystemPromptStatus(`❌ Save failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('System prompt save error:', error);
      setSystemPromptStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsSystemPromptLoading(false);
    }
  };

  const loadSystemPrompt = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/system-prompt`);
      const result = await response.json();

      if (response.ok && result.success && result.systemPrompt) {
        setSystemPrompt(result.systemPrompt);
        // Also update the config state for consistency
        setConfig(prev => ({ ...prev, systemPrompt: result.systemPrompt }));
        console.log('✅ Loaded system prompt:', result.systemPrompt.substring(0, 100) + '...');
      }
    } catch (error) {
      console.error('Error loading system prompt:', error);
    }
  };

  const loadKnowledgeBaseInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/knowledge-info`);
      const result = await response.json();

      if (response.ok && result.success && result.hasKnowledge) {
        setHasKnowledgeBase(true);
        setKnowledgeBaseInfo(result.info);
      }
    } catch (error) {
      console.error('Error loading knowledge base info:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setUploadStatus('❌ Please select a PDF file');
      return;
    }
    
    setSelectedFile(file);
    setIsUploading(true);
    setUploadStatus('📄 Uploading PDF...');
    
    const formData = new FormData();
    formData.append('pdf', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/upload-knowledge`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setHasKnowledgeBase(true);
        setKnowledgeBaseInfo({
          filename: file.name,
          size: file.size,
          uploadedAt: new Date().toISOString()
        });
        setUploadStatus('✅ PDF uploaded and processed successfully!');
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        setUploadStatus(`❌ Upload failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      setUploadStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      event.target.value = '';
    }
  };

  const resetToDefaultPrompt = () => {
    setSystemPrompt('You are a helpful assistant responding to Instagram direct messages. Keep responses friendly, concise, and helpful. Always respond in a conversational tone.');
  };

  if (!isVisible) return null;
  
  console.log('🚀 InstagramAISettings is rendering with new design!');

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
          backgroundColor: '#E4405F', 
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
            🤖 Instagram AI Configuration - UPDATED
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
            backgroundColor: isClaudeConnected ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${isClaudeConnected ? '#bbf7d0' : '#fecaca'}`,
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: isClaudeConnected ? '#10b981' : '#ef4444',
                marginRight: '0.75rem'
              }}></div>
              <span style={{
                fontWeight: '500',
                color: isClaudeConnected ? '#065f46' : '#991b1b'
              }}>
                {isClaudeConnected ? 'Connected to Claude API' : 'Not Connected'}
              </span>
            </div>
          </div>

          {/* Claude API Key Input */}
          {!isClaudeConnected && (
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
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
                placeholder="Enter your Claude API key (sk-ant-...)"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  opacity: isConnectingClaude ? '0.5' : '1',
                  boxSizing: 'border-box'
                }}
                disabled={isConnectingClaude}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isConnectingClaude && claudeApiKey.trim()) {
                    handleClaudeConnect();
                  }
                }}
              />
              <p style={{ 
                marginTop: '0.25rem', 
                fontSize: '0.75rem', 
                color: '#6b7280' 
              }}>
                Get your API key from Anthropic Console
              </p>
            </div>
          )}

          {/* Claude Status */}
          {claudeStatus && (
            <div style={{ 
              padding: '0.75rem', 
              borderRadius: '6px', 
              backgroundColor: claudeStatus.includes('✅') ? '#f0fdf4' : claudeStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
              color: claudeStatus.includes('✅') ? '#15803d' : claudeStatus.includes('❌') ? '#dc2626' : '#1d4ed8',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {claudeStatus}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            {!isClaudeConnected ? (
              <button
                onClick={handleClaudeConnect}
                disabled={isConnectingClaude || !claudeApiKey.trim()}
                style={{ 
                  flex: '1',
                  backgroundColor: isConnectingClaude || !claudeApiKey.trim() ? '#9ca3af' : '#E4405F', 
                  color: 'white', 
                  padding: '0.75rem 1rem', 
                  border: 'none',
                  borderRadius: '6px', 
                  cursor: isConnectingClaude || !claudeApiKey.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {isConnectingClaude ? '⏳ Connecting...' : '🔗 Connect Claude AI'}
              </button>
            ) : (
              <button
                onClick={handleClaudeDisconnect}
                disabled={isConnectingClaude}
                style={{ 
                  flex: '1',
                  backgroundColor: isConnectingClaude ? '#9ca3af' : '#dc2626', 
                  color: 'white', 
                  padding: '0.75rem 1rem', 
                  border: 'none',
                  borderRadius: '6px', 
                  cursor: isConnectingClaude ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                {isConnectingClaude ? '⏳ Disconnecting...' : '🔌 Disconnect'}
              </button>
            )}
          </div>
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

          {/* Warning when Claude not connected */}
          {!isClaudeConnected && (
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              border: '1px solid #fecaca'
            }}>
              <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>
                ⚠️ Connect to Claude API first to configure system prompt
              </p>
            </div>
          )}

          {/* System Prompt Text Area */}
          <div style={{ marginBottom: '1rem', opacity: isClaudeConnected ? 1 : 0.6 }}>
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
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Enter how Claude should behave when responding to Instagram DMs..."
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
                opacity: isSystemPromptLoading ? '0.5' : '1',
                boxSizing: 'border-box'
              }}
              disabled={isSystemPromptLoading || !isClaudeConnected}
            />
            <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
              Character count: {systemPrompt.length}/2000
            </p>
          </div>

          {/* System Prompt Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button
              onClick={handleSystemPromptSave}
              disabled={isSystemPromptLoading || !systemPrompt.trim() || systemPrompt.length > 2000 || !isClaudeConnected}
              style={{
                flex: '1',
                backgroundColor: isSystemPromptLoading || !systemPrompt.trim() || systemPrompt.length > 2000 || !isClaudeConnected ? '#9ca3af' : '#10b981',
                color: 'white',
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '6px',
                cursor: isSystemPromptLoading || !systemPrompt.trim() || systemPrompt.length > 2000 || !isClaudeConnected ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              {isSystemPromptLoading ? '⏳ Saving...' : '💾 Save System Prompt'}
            </button>
            
            <button
              onClick={resetToDefaultPrompt}
              disabled={isSystemPromptLoading}
              style={{
                flex: '0 0 auto',
                backgroundColor: isSystemPromptLoading ? '#9ca3af' : '#6b7280',
                color: 'white',
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '6px',
                cursor: isSystemPromptLoading ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}
            >
              🔄 Reset
            </button>
          </div>

          {/* System Prompt Status Message */}
          {systemPromptStatus && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: systemPromptStatus.includes('✅') ? '#f0fdf4' : systemPromptStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
              color: systemPromptStatus.includes('✅') ? '#15803d' : systemPromptStatus.includes('❌') ? '#dc2626' : '#1d4ed8',
              fontSize: '0.875rem'
            }}>
              {systemPromptStatus}
            </div>
          )}
        </div>

        {/* PDF Knowledge Base Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '1rem', 
            borderBottom: '2px solid #e5e7eb', 
            paddingBottom: '0.5rem'
          }}>
            📄 PDF Knowledge Base
          </h3>

          {/* Warning when Claude not connected */}
          {!isClaudeConnected && (
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              border: '1px solid #fecaca'
            }}>
              <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>
                ⚠️ Connect to Claude API first to upload knowledge base
              </p>
            </div>
          )}

          {/* Current Knowledge Base Status */}
          {hasKnowledgeBase && knowledgeBaseInfo && (
            <div style={{
              backgroundColor: '#f0fdf4',
              padding: '1rem',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#15803d', fontWeight: '600', fontSize: '0.875rem' }}>
                  ✅ Knowledge Base Active
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#065f46' }}>
                <strong>File:</strong> {knowledgeBaseInfo.filename}<br/>
                <strong>Size:</strong> {(knowledgeBaseInfo.size / 1024 / 1024).toFixed(2)} MB<br/>
                <strong>Uploaded:</strong> {new Date(knowledgeBaseInfo.uploadedAt).toLocaleString()}
              </div>
            </div>
          )}

          {/* PDF Upload */}
          <div style={{ marginBottom: '1rem', opacity: isClaudeConnected ? 1 : 0.6 }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Upload PDF Document
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={isUploading || !isClaudeConnected}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px dashed #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                backgroundColor: '#f9fafb',
                cursor: isUploading || !isClaudeConnected ? 'not-allowed' : 'pointer',
                opacity: isUploading ? '0.5' : '1'
              }}
            />
            <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
              Upload a PDF file to serve as knowledge base for AI responses
            </p>
          </div>

          {/* Upload Status */}
          {uploadStatus && (
            <div style={{
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: uploadStatus.includes('✅') ? '#f0fdf4' : uploadStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
              color: uploadStatus.includes('✅') ? '#15803d' : uploadStatus.includes('❌') ? '#dc2626' : '#1d4ed8',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {uploadStatus}
            </div>
          )}
        </div>

        {/* AI Settings Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ 
            fontSize: '1rem', 
            fontWeight: '600', 
            color: '#1f2937', 
            marginBottom: '1rem', 
            borderBottom: '2px solid #e5e7eb', 
            paddingBottom: '0.5rem'
          }}>
            ⚙️ AI Settings
          </h3>

          {/* Main Toggle */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '1rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
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
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
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
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Delay before sending auto-reply to seem more natural
                </div>
              </div>

              {/* AI Test Section */}
              <div style={{ 
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h4 style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  color: '#374151',
                  marginBottom: '1rem'
                }}>
                  🧪 Test AI Response
                </h4>
                
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
                  disabled={isTesting || !testMessage.trim() || !isClaudeConnected}
                  style={{
                    backgroundColor: isTesting || !isClaudeConnected ? '#9ca3af' : '#E4405F',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: isTesting || !isClaudeConnected ? 'not-allowed' : 'pointer',
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
            disabled={isLoading || !isClaudeConnected}
            style={{
              backgroundColor: isLoading || !isClaudeConnected ? '#9ca3af' : '#E4405F',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: isLoading || !isClaudeConnected ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? '💾 Saving...' : '💾 Save Settings'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramAISettings;