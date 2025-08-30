import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

const WhatsAppReceiver = () => {
  // Unified WhatsApp Configuration State
  const [appId, setAppId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberSendId, setPhoneNumberSendId] = useState('');
  
  // UI State
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  
  // Messaging State
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');
  const messagesEndRef = useRef(null);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  
  // Claude AI State
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [isClaudeConnected, setIsClaudeConnected] = useState(false);
  const [isConnectingClaude, setIsConnectingClaude] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState('');

  // System Prompt State
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful and friendly AI assistant. Respond to users in a professional yet warm manner.');
  const [isSystemPromptLoading, setIsSystemPromptLoading] = useState(false);
  const [systemPromptStatus, setSystemPromptStatus] = useState('');

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set webhook URL on component mount, check auth token, and sync status
  useEffect(() => {
    setWebhookUrl(`${API_BASE_URL}/api/webhooks/whatsapp`);
    
    // Debug authentication token
    const token = localStorage.getItem('token');
    console.log('🔐 Authentication Debug:', {
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20),
      apiBaseUrl: API_BASE_URL,
      origin: window.location.origin,
      hostname: window.location.hostname
    });
    
    // If no token, create a mock token for testing
    if (!token || token === 'null' || token === 'undefined') {
      console.log('⚠️ No valid token found, creating mock token for testing');
      const mockToken = `MOCK_TOKEN_FOR_TESTING_${Date.now()}`;
      localStorage.setItem('token', mockToken);
    }
    
    // Check backend status on component mount to sync isActive state
    const checkBackendStatus = async () => {
      try {
        console.log('🔄 Checking backend WhatsApp receiver status on mount...');
        const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔄 Backend status on mount:', data.status);
          
          if (data.status && data.status.isActive) {
            console.log('🚨 MOUNT SYNC: Backend shows active, setting frontend to active');
            setIsActive(true);
          } else {
            console.log('🔄 Backend shows inactive, keeping frontend inactive');
            setIsActive(false);
          }
        }
      } catch (error) {
        console.error('❌ Error checking backend status on mount:', error);
      }
    };
    
    checkBackendStatus();
    
    // Check Claude API status on mount
    checkClaudeStatus();
    
    // Load system prompt on mount
    loadSystemPrompt();
  }, []);
  
  // Check Claude API connection status
  const checkClaudeStatus = async () => {
    try {
      console.log('🔍 Checking Claude API status...');
      const response = await fetch(`${API_BASE_URL}/api/claude/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('🔍 Claude status response:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Claude status data:', data);
        const isConnected = data.connected || false;
        console.log('🔍 Setting isClaudeConnected to:', isConnected);
        setIsClaudeConnected(isConnected);
        
        if (isConnected) {
          setClaudeStatus('✅ Claude AI ready for WhatsApp integration');
          console.log('🔍 Claude is connected - hiding input field');
        } else {
          setClaudeStatus('');
          console.log('🔍 Claude is not connected - showing input field');
        }
      } else {
        console.log('❌ Claude status check failed:', response.status);
        setIsClaudeConnected(false);
      }
    } catch (error) {
      console.error('❌ Error checking Claude status:', error);
      setIsClaudeConnected(false);
    }
  };
  
  // Connect to Claude API
  const handleClaudeConnect = async () => {
    if (!claudeApiKey.trim()) {
      setClaudeStatus('❌ Please enter your Claude API key');
      return;
    }

    setIsConnectingClaude(true);
    setClaudeStatus('🔗 Connecting to Claude AI...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          apiKey: claudeApiKey.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setClaudeStatus('✅ Claude AI connected! Ready for WhatsApp integration');
        setIsClaudeConnected(true);
        setClaudeApiKey(''); // Clear for security
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
  
  // Disconnect Claude API
  const handleClaudeDisconnect = async () => {
    setIsConnectingClaude(true);
    setClaudeStatus('🔌 Disconnecting Claude AI...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

  // Auto-clear Claude status after 5 seconds
  useEffect(() => {
    if (claudeStatus && !claudeStatus.includes('ready') && !claudeStatus.includes('Ready')) {
      const timeout = setTimeout(() => {
        setClaudeStatus('');
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [claudeStatus]);

  // System Prompt Functions
  const handleSystemPromptSave = async () => {
    if (!systemPrompt.trim()) {
      setSystemPromptStatus('❌ Please enter a system prompt');
      return;
    }

    setIsSystemPromptLoading(true);
    setSystemPromptStatus('💾 Saving system prompt...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/system-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          systemPrompt: systemPrompt.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSystemPromptStatus('✅ System prompt saved successfully!');
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
      const response = await fetch(`${API_BASE_URL}/api/claude/system-prompt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success && result.systemPrompt) {
        setSystemPrompt(result.systemPrompt);
      }
    } catch (error) {
      console.error('Error loading system prompt:', error);
    }
  };

  const resetToDefaultPrompt = () => {
    setSystemPrompt('You are a helpful and friendly AI assistant. Respond to users in a professional yet warm manner.');
  };

  // Auto-clear system prompt status after 5 seconds
  useEffect(() => {
    if (systemPromptStatus && !systemPromptStatus.includes('💾')) {
      const timeout = setTimeout(() => {
        setSystemPromptStatus('');
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [systemPromptStatus]);

  // Group messages into conversations
  const groupMessagesIntoConversations = (messages) => {
    const conversationMap = {};
    
    messages.forEach(message => {
      const phoneNumber = message.phoneNumber || message.from;
      
      if (!conversationMap[phoneNumber]) {
        conversationMap[phoneNumber] = {
          phoneNumber: phoneNumber,
          contactName: message.fromName || message.contactName || 'Unknown Contact',
          messages: [],
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: 0
        };
      }
      
      conversationMap[phoneNumber].messages.push(message);
      conversationMap[phoneNumber].lastMessage = message.text || message.message;
      conversationMap[phoneNumber].lastMessageTime = message.timestamp || message.createdAt;
    });
    
    // Convert to array and sort conversations by last message time (newest first)
    // Also sort messages within each conversation chronologically (oldest first)
    const sortedConversations = Object.values(conversationMap).map(conversation => ({
      ...conversation,
      messages: conversation.messages.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt);
        const timeB = new Date(b.timestamp || b.createdAt);
        return timeA - timeB; // oldest first (ascending)
      })
    })).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
    
    return sortedConversations;
  };

  // Poll for new messages when active
  useEffect(() => {
    console.log('📡 Polling effect triggered, isActive:', isActive);
    let interval;
    if (isActive) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/messages`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const newMessages = data.messages || [];
            console.log('📥 Raw messages received:', newMessages.length, newMessages);
            setMessages(newMessages);
            
            // Update isActive state based on backend status
            if (data.status && data.status.isActive !== undefined) {
              console.log('🔄 Backend status check:', data.status.isActive, 'Current frontend isActive:', isActive);
              if (data.status.isActive !== isActive) {
                console.log('🚨 SYNC FIX: Updating isActive from backend:', data.status.isActive);
                setIsActive(data.status.isActive);
              }
            }
            
            // Group messages into conversations
            const newConversations = groupMessagesIntoConversations(newMessages);
            console.log('💬 Conversations created:', newConversations.length, newConversations);
            setConversations(newConversations);
            
            // Auto-select first conversation if none selected (only once)
            if (!selectedConversation && !hasAutoSelected && newConversations.length > 0) {
              console.log('Auto-selecting first conversation (one time):', newConversations[0]);
              setSelectedConversation(newConversations[0]);
              setHasAutoSelected(true);
            }
            
            // Update selectedConversation with latest data if it exists in newConversations
            if (selectedConversation && newConversations.length > 0) {
              const updatedSelected = newConversations.find(conv => 
                conv.phoneNumber === selectedConversation.phoneNumber
              );
              if (updatedSelected) {
                setSelectedConversation(updatedSelected);
              }
            }
          }
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      }, 2000); // Poll every 2 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, selectedConversation, hasAutoSelected]);

  const handleActivate = async () => {
    // Validate all required fields
    if (!appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim()) {
      setError('Please fill in all WhatsApp configuration fields (App ID, Client Secret, Business ID, Access Token, and Phone Number Send ID)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          // WhatsApp Trigger Node credentials
          appId: appId.trim(),
          clientSecret: clientSecret.trim(),
          // WhatsApp Send Message Node credentials
          businessId: businessId.trim(),
          accessToken: accessToken.trim(),
          phoneNumberSendId: phoneNumberSendId.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsActive(true);
        setMessages([]);
        console.log('WhatsApp receiver activated successfully');
      } else {
        setError(data.error || 'Failed to activate WhatsApp receiver');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
      console.error('Activation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsActive(false);
        setMessages([]);
        console.log('WhatsApp receiver deactivated successfully');
      } else {
        setError(data.error || 'Failed to deactivate WhatsApp receiver');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
      console.error('Deactivation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    alert('Webhook URL copied to clipboard!');
  };

  const handleSendMessage = async () => {
    const recipientPhoneNumber = selectedConversation?.phoneNumber;
    
    console.log('📤 Send message attempt:', {
      isActive,
      hasSelectedConversation: !!selectedConversation,
      hasRecipientPhone: !!recipientPhoneNumber,
      hasMessageText: !!messageText.trim(),
      recipientPhoneNumber: recipientPhoneNumber,
      messageTextLength: messageText.length
    });
    
    if (!isActive || !selectedConversation || !recipientPhoneNumber || !messageText.trim()) {
      const error = !isActive ? 'System not active' : 
                   !selectedConversation ? 'No conversation selected' :
                   !recipientPhoneNumber ? 'Missing recipient phone' :
                   'Missing message text';
      console.log('❌ Send failed:', error);
      setSendStatus(`❌ ${error}`);
      return;
    }

    setIsSending(true);
    setSendStatus('⏳ Sending message...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientPhoneNumber: recipientPhoneNumber,
          messageText: messageText.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSendStatus(`✅ Message sent via unified system! ID: ${data.data.messageId || 'N/A'}`);
        setMessageText(''); // Clear message after sending
      } else {
        setSendStatus(`❌ Failed to send: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setSendStatus(`❌ Network error: ${error.message}`);
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Auto-clear send status after 10 seconds
  useEffect(() => {
    if (sendStatus && !sendStatus.includes('⏳')) {
      const timeout = setTimeout(() => {
        setSendStatus('');
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [sendStatus]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '60rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>
            <i className="fab fa-whatsapp" style={{ color: '#25D366', marginRight: '0.5rem' }}></i>
            WhatsApp Business Integration
          </h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Claude AI Configuration Panel */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🤖</span>
                Claude AI Configuration
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
                      fontSize: '1rem',
                      outline: 'none',
                      opacity: isConnectingClaude ? '0.5' : '1'
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
                    fontSize: '0.875rem', 
                    color: '#6b7280' 
                  }}>
                    Get your API key from{' '}
                    <a 
                      href="https://console.anthropic.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', textDecoration: 'underline' }}
                    >
                      Anthropic Console
                    </a>
                  </p>
                </div>
              )}

              {/* Claude Status */}
              {claudeStatus && (
                <div style={{ 
                  padding: '1rem', 
                  borderRadius: '6px', 
                  backgroundColor: claudeStatus.includes('✅') ? '#f0fdf4' : claudeStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
                  color: claudeStatus.includes('✅') ? '#15803d' : claudeStatus.includes('❌') ? '#dc2626' : '#1d4ed8',
                  marginBottom: '1rem'
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
                      backgroundColor: isConnectingClaude || !claudeApiKey.trim() ? '#9ca3af' : '#2563eb', 
                      color: 'white', 
                      padding: '0.75rem 1rem', 
                      border: 'none',
                      borderRadius: '6px', 
                      cursor: isConnectingClaude || !claudeApiKey.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '1rem'
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
                      fontSize: '1rem'
                    }}
                  >
                    {isConnectingClaude ? '⏳ Disconnecting...' : '🔌 Disconnect'}
                  </button>
                )}
              </div>
            </div>

            {/* System Prompt Configuration Panel */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🎭</span>
                System Prompt
              </h3>

              {/* System Prompt Description */}
              <div style={{
                backgroundColor: '#eff6ff',
                padding: '1rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.875rem'
              }}>
                <p style={{ color: '#1e40af', lineHeight: '1.5', margin: 0 }}>
                  <strong>🎯 System Prompt:</strong> Define how Claude should behave and respond to users. 
                  This sets the personality and behavior for all AI responses.
                </p>
              </div>

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
                  placeholder="Enter how Claude should behave (e.g., You are a professional housekeeper assistant...)"
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
                    opacity: isSystemPromptLoading ? '0.5' : '1'
                  }}
                  disabled={isSystemPromptLoading}
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
                    fontSize: '1rem',
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
                    fontSize: '1rem',
                    fontWeight: '500'
                  }}
                >
                  🔄 Reset to Default
                </button>
              </div>

              {/* System Prompt Status Message */}
              {systemPromptStatus && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '6px',
                  backgroundColor: systemPromptStatus.includes('✅') ? '#f0fdf4' : systemPromptStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
                  color: systemPromptStatus.includes('✅') ? '#15803d' : systemPromptStatus.includes('❌') ? '#dc2626' : '#1d4ed8',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  {systemPromptStatus}
                </div>
              )}

              {/* Example System Prompts */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '1rem',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                <h4 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>
                  💡 Example System Prompts:
                </h4>
                <div style={{ color: '#1e40af', lineHeight: '1.5' }}>
                  <div style={{ marginBottom: '0.5rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '3px' }} 
                       onClick={() => setSystemPrompt('You are a professional housekeeper assistant. Provide helpful cleaning tips, organization advice, and home maintenance guidance. Be detailed and practical in your responses.')}>
                    <strong>🏠 Housekeeper:</strong> "You are a professional housekeeper assistant..."
                  </div>
                  <div style={{ marginBottom: '0.5rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '3px' }} 
                       onClick={() => setSystemPrompt('You are a professional customer service assistant. Be helpful, polite, and always try to solve the customer\'s problem. Ask clarifying questions when needed.')}>
                    <strong>📞 Customer Service:</strong> "You are a professional customer service assistant..."
                  </div>
                  <div style={{ marginBottom: '0.5rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '3px' }} 
                       onClick={() => setSystemPrompt('You are a friendly and casual chatbot. Use emojis, be conversational, and make users feel comfortable. Keep responses short and engaging.')}>
                    <strong>😊 Friendly Chat:</strong> "You are a friendly and casual chatbot..."
                  </div>
                  <div style={{ cursor: 'pointer', padding: '0.25rem', borderRadius: '3px' }} 
                       onClick={() => setSystemPrompt('You are a professional business assistant. Provide formal, concise responses. Focus on efficiency and accuracy in all communications.')}>
                    <strong>💼 Business:</strong> "You are a professional business assistant..."
                  </div>
                </div>
              </div>
            </div>

            {/* Webhook URL Display */}
            <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '6px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Webhook URL
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <code style={{ 
                  display: 'block', 
                  width: '100%', 
                  padding: '0.5rem', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '4px', 
                  fontSize: '0.875rem', 
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {webhookUrl}
                </code>
                <button 
                  onClick={copyWebhookUrl}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Copy
                </button>
              </div>
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Use this URL as your webhook endpoint in WhatsApp Business API settings
              </p>
            </div>

            {/* WhatsApp Configuration */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                WhatsApp App ID
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="Enter your WhatsApp App ID"
                disabled={isActive}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '1rem',
                  outline: 'none',
                  opacity: isActive ? '0.5' : '1',
                  marginBottom: '1rem'
                }}
              />
              
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Client Secret
              </label>
              <input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter your Client Secret"
                disabled={isActive}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '1rem',
                  outline: 'none',
                  opacity: isActive ? '0.5' : '1',
                  marginBottom: '1rem'
                }}
              />

              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Business ID
              </label>
              <input
                type="text"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                placeholder="e.g., 1234567890123456"
                disabled={isActive}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '1rem',
                  outline: 'none',
                  opacity: isActive ? '0.5' : '1',
                  marginBottom: '1rem'
                }}
              />

              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Access Token
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAxxxxxxxx..."
                disabled={isActive}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '1rem',
                  outline: 'none',
                  opacity: isActive ? '0.5' : '1',
                  marginBottom: '1rem'
                }}
              />

              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Phone Number Send ID
              </label>
              <input
                type="text"
                value={phoneNumberSendId}
                onChange={(e) => setPhoneNumberSendId(e.target.value)}
                placeholder="e.g., 628007790405551"
                disabled={isActive}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '1rem',
                  outline: 'none',
                  opacity: isActive ? '0.5' : '1',
                  marginBottom: '1rem'
                }}
              />
            </div>

            {/* Error Display */}
            {error && (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '6px', 
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                marginBottom: '1rem',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              {!isActive ? (
                <button
                  onClick={handleActivate}
                  disabled={isLoading || !appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim()}
                  style={{ 
                    flex: '1',
                    backgroundColor: isLoading || !appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim() ? '#9ca3af' : '#25D366', 
                    color: 'white', 
                    padding: '0.75rem 1rem', 
                    border: 'none',
                    borderRadius: '6px', 
                    cursor: isLoading || !appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {isLoading ? '⏳ Setting up...' : '🚀 Start WhatsApp Integration'}
                </button>
              ) : (
                <button
                  onClick={handleDeactivate}
                  disabled={isLoading}
                  style={{ 
                    flex: '1',
                    backgroundColor: isLoading ? '#9ca3af' : '#dc2626', 
                    color: 'white', 
                    padding: '0.75rem 1rem', 
                    border: 'none',
                    borderRadius: '6px', 
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {isLoading ? '⏳ Stopping...' : '🛑 Stop Integration'}
                </button>
              )}
            </div>

            {/* Status */}
            {isActive && (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '6px', 
                backgroundColor: '#f0fdf4',
                color: '#15803d'
              }}>
                ✅ WhatsApp integration is active and listening for messages
              </div>
            )}
          </div>
        </div>

        {/* CONVERSATIONS SECTION */}
        <div style={{
          backgroundColor: 'white', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
          padding: '1.5rem',
          marginTop: '1.5rem',
          display: 'flex',
          height: '500px'
        }}>
          {/* Conversations List - Left Side */}
          <div style={{
            width: '300px',
            borderRight: '1px solid #e4e6ea',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Conversations Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e4e6ea',
              backgroundColor: '#f8f9fa'
            }}>
              <h2 style={{
                margin: '0',
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💬 Conversations ({conversations.length})
              </h2>
            </div>
            
            {/* Conversations List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.length > 0 ? (
                conversations.map((conversation, index) => (
                  <div
                    key={conversation.phoneNumber}
                    onClick={() => {
                      console.log('🖱️ Conversation clicked:', conversation.phoneNumber, conversation.contactName);
                      setSelectedConversation(conversation);
                    }}
                    style={{
                      padding: '16px 20px',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      backgroundColor: selectedConversation?.phoneNumber === conversation.phoneNumber ? '#e3f2fd' : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedConversation?.phoneNumber === conversation.phoneNumber ? '#e3f2fd' : '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedConversation?.phoneNumber === conversation.phoneNumber ? '#e3f2fd' : 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#25D366',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {conversation.contactName?.charAt(0) || '👤'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: '600',
                          fontSize: '14px',
                          color: '#1f2937',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conversation.contactName || conversation.phoneNumber}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6b7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {conversation.lastMessage}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#9ca3af',
                          marginTop: '2px'
                        }}>
                          {formatTimestamp(conversation.lastMessageTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px', opacity: '0.5' }}>💬</div>
                  <div style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>No conversations yet</div>
                  <div style={{ fontSize: '14px' }}>Messages will appear here when received</div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Panel - Right Side */}
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div style={{
                  padding: '20px',
                  borderBottom: '1px solid #e4e6ea',
                  backgroundColor: '#f8f9fa'
                }}>
                  <h3 style={{
                    margin: '0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937'
                  }}>
                    {selectedConversation.contactName || selectedConversation.phoneNumber}
                  </h3>
                  <p style={{
                    margin: '5px 0 0 0',
                    fontSize: '14px',
                    color: '#6b7280'
                  }}>
                    {selectedConversation.phoneNumber}
                  </p>
                </div>

                {/* Messages Area */}
                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '20px',
                  backgroundColor: '#fafafa'
                }}>
                  {selectedConversation.messages.map((message, index) => {
                    const isOutgoing = message.direction === 'outgoing' || message.isOutgoing === true || message.type === 'sent';
                    
                    console.log('💬 Message render:', {
                      index,
                      direction: message.direction,
                      isOutgoing: message.isOutgoing,
                      type: message.type,
                      calculated: isOutgoing,
                      text: (message.text || message.message)?.substring(0, 20)
                    });
                    
                    return (
                      <div key={index} style={{
                        marginBottom: '16px',
                        display: 'flex',
                        justifyContent: isOutgoing ? 'flex-end' : 'flex-start'
                      }}>
                        <div style={{
                          maxWidth: '70%',
                          padding: '12px 16px',
                          borderRadius: isOutgoing ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
                          backgroundColor: isOutgoing ? '#25D366' : '#ffffff',
                          color: isOutgoing ? 'white' : '#1f2937',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          wordBreak: 'break-word'
                        }}>
                          <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                            {message.text || message.message}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            marginTop: '4px',
                            opacity: '0.7',
                            textAlign: 'right'
                          }}>
                            {formatTimestamp(message.timestamp || message.createdAt)}
                            {isOutgoing && <span style={{ marginLeft: '4px' }}>✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Area */}
                <div style={{
                  padding: '20px',
                  borderTop: '1px solid #e4e6ea',
                  backgroundColor: '#ffffff'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '12px'
                  }}>
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      disabled={!isActive}
                      style={{
                        flex: 1,
                        minHeight: '44px',
                        maxHeight: '120px',
                        padding: '12px 16px',
                        border: '1px solid #e4e6ea',
                        borderRadius: '22px',
                        resize: 'none',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                        outline: 'none',
                        backgroundColor: isActive ? 'white' : '#f5f5f5'
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!isSending && messageText.trim() && isActive) {
                            handleSendMessage();
                          }
                        }
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isSending || !messageText.trim() || !isActive}
                      style={{
                        padding: '12px',
                        background: (isSending || !messageText.trim() || !isActive) ? '#e9ecef' : '#25D366',
                        color: (isSending || !messageText.trim() || !isActive) ? '#6c757d' : 'white',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: (isSending || !messageText.trim() || !isActive) ? 'not-allowed' : 'pointer',
                        fontSize: '18px',
                        width: '44px',
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {isSending ? '⏳' : '📤'}
                    </button>
                  </div>
                  
                  {/* Send Status */}
                  {sendStatus && (
                    <div style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: sendStatus.includes('✅') ? '#16a34a' : sendStatus.includes('❌') ? '#dc2626' : '#6b7280',
                      textAlign: 'center'
                    }}>
                      {sendStatus}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>💬</div>
                <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', fontWeight: '500' }}>
                  Select a conversation
                </h3>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  Choose a conversation from the left to view and send messages
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status indicator for WhatsApp system */}
        {!isActive && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#991b1b',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000
          }}>
            ⚠️ WhatsApp system is inactive. Configure and activate to start receiving messages.
          </div>
        )}

      </div>
    </div>
  );
};

export default WhatsAppReceiver;