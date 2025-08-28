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
  const [recipientPhone, setRecipientPhone] = useState('');
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
        
        // Debug: Check the state right after setting it with a delay
        setTimeout(() => {
          console.log('🔍 State after set attempt - isClaudeConnected should be:', isConnected);
        }, 100);
        
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
  
  // Debug: Log Claude connection state changes
  useEffect(() => {
    console.log('🔍 REACT STATE CHANGE: isClaudeConnected =', isClaudeConnected);
  }, [isClaudeConnected]);

  // Auto-clear Claude status after 5 seconds
  useEffect(() => {
    if (claudeStatus && !claudeStatus.includes('ready') && !claudeStatus.includes('Ready')) {
      const timeout = setTimeout(() => {
        setClaudeStatus('');
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [claudeStatus]);

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
    
    // Debug message ordering
    if (sortedConversations.length > 0) {
      const firstConv = sortedConversations[0];
      console.log('📱 MESSAGE ORDERING DEBUG for phone:', firstConv.phoneNumber);
      console.log('📊 Total messages:', firstConv.messages.length);
      
      if (firstConv.messages.length > 0) {
        console.log('🔼 FIRST message (should be oldest):', {
          text: firstConv.messages[0]?.text,
          time: firstConv.messages[0]?.timestamp || firstConv.messages[0]?.createdAt,
          direction: firstConv.messages[0]?.direction
        });
        
        console.log('🔽 LAST message (should be newest):', {
          text: firstConv.messages[firstConv.messages.length - 1]?.text,
          time: firstConv.messages[firstConv.messages.length - 1]?.timestamp || firstConv.messages[firstConv.messages.length - 1]?.createdAt,
          direction: firstConv.messages[firstConv.messages.length - 1]?.direction
        });
        
        console.log('📋 ALL MESSAGES IN ORDER (oldest → newest):');
        firstConv.messages.forEach((msg, index) => {
          console.log(`  ${index + 1}. "${msg.text}" (${msg.direction}) at ${msg.timestamp || msg.createdAt}`);
        });
      }
    }
    
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
            
            // Force debug output here
            if (newConversations.length > 0 && newConversations[0].messages.length > 0) {
              const conv = newConversations[0];
              console.log('🚨 FORCED DEBUG - Message Order Check:');
              console.log('Phone:', conv.phoneNumber);
              console.log('Message count:', conv.messages.length);
              conv.messages.forEach((msg, i) => {
                console.log(`${i + 1}. "${msg.text}" (${msg.direction || 'unknown'}) - ${msg.timestamp || msg.createdAt}`);
              });
            }
            
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
  }, [isActive]);

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
    console.log('📤 Send message attempt:', {
      isActive,
      hasRecipientPhone: !!recipientPhone.trim(),
      hasMessageText: !!messageText.trim(),
      recipientPhone: recipientPhone,
      messageTextLength: messageText.length
    });
    
    if (!isActive || !recipientPhone.trim() || !messageText.trim()) {
      const error = !isActive ? 'System not active' : 
                   !recipientPhone.trim() ? 'Missing recipient phone' :
                   'Missing message text';
      console.log('❌ Send failed:', error);
      setSendStatus(`❌ ${error}`);
      return;
    }

    setIsSending(true);
    setSendStatus('⏳ Sending message via unified system...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientPhoneNumber: recipientPhone.trim(),
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
    <div className="whatsapp-receiver-page" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h1 style={{ 
          color: '#25D366', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '28px' }}>📱</span>
          WhatsApp Message Receiver
        </h1>

        {/* Claude AI Integration Panel */}
        <div style={{
          background: '#f0f9ff',
          border: '2px solid #bfdbfe',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '24px' }}>🤖</span>
            <h3 style={{
              color: '#1e40af',
              margin: 0,
              fontSize: '18px',
              fontWeight: '600'
            }}>
              Claude AI Integration
            </h3>
            {isClaudeConnected && (
              <span style={{
                background: '#dcfce7',
                color: '#166534',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                border: '1px solid #bbf7d0'
              }}>
                ✅ Connected
              </span>
            )}
          </div>

          {/* Connection Status */}
          <div style={{
            background: isClaudeConnected ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${isClaudeConnected ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isClaudeConnected ? '#22c55e' : '#ef4444'
            }}></div>
            <span style={{
              fontSize: '14px',
              color: isClaudeConnected ? '#166534' : '#991b1b',
              fontWeight: '500'
            }}>
              {isClaudeConnected 
                ? 'Claude AI ready for intelligent WhatsApp processing' 
                : 'Connect Claude AI for smart message analysis and responses'
              }
            </span>
          </div>

          {/* Claude API Key Input - Always show unless connected */}
          {!isClaudeConnected && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
              }}>
                Claude API Key:
              </label>
              <input
                type="password"
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
                placeholder="Enter Claude API key (sk-ant-...)" 
                disabled={isConnectingClaude}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: isConnectingClaude ? '#f9fafb' : 'white',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isConnectingClaude && claudeApiKey.trim()) {
                    handleClaudeConnect();
                  }
                }}
              />
              <p style={{ 
                margin: '4px 0 0 0', 
                fontSize: '12px', 
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
          
          {/* Debug info - remove after testing */}
          <div style={{
            fontSize: '11px',
            color: '#6b7280',
            marginBottom: '8px',
            fontFamily: 'monospace'
          }}>
            Debug: Connected={isClaudeConnected.toString()}, Connecting={isConnectingClaude.toString()}, HasKey={!!claudeApiKey}
          </div>

          {/* Claude Status */}
          {claudeStatus && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '6px',
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: claudeStatus.includes('✅') ? '#f0fdf4' : claudeStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
              color: claudeStatus.includes('✅') ? '#166534' : claudeStatus.includes('❌') ? '#991b1b' : '#1e40af',
              border: `1px solid ${claudeStatus.includes('✅') ? '#bbf7d0' : claudeStatus.includes('❌') ? '#fecaca' : '#bfdbfe'}`
            }}>
              {claudeStatus}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {!isClaudeConnected ? (
              <button
                onClick={handleClaudeConnect}
                disabled={isConnectingClaude || !claudeApiKey.trim()}
                style={{
                  padding: '10px 16px',
                  backgroundColor: (isConnectingClaude || !claudeApiKey.trim()) ? '#d1d5db' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: (isConnectingClaude || !claudeApiKey.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isConnectingClaude ? '⏳ Connecting...' : '🔗 Connect Claude AI'}
              </button>
            ) : (
              <>
                <button
                  onClick={() => alert('Claude AI chat coming soon! 🚀')}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  💬 Chat with Claude
                </button>
                <button
                  onClick={handleClaudeDisconnect}
                  disabled={isConnectingClaude}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: isConnectingClaude ? '#d1d5db' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isConnectingClaude ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isConnectingClaude ? '⏳ Disconnecting...' : '🔌 Disconnect'}
                </button>
              </>
            )}
          </div>

          {/* Integration Features */}
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#92400e'
          }}>
            <strong>🎯 Claude AI + WhatsApp Features:</strong>
            <br />• Smart message analysis • Automated responses • Language translation
            <br />• Sentiment analysis • Customer support • Content moderation
          </div>
        </div>

        {/* Webhook URL Display */}
        <div style={{ 
          background: '#f8f9fa', 
          padding: '16px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Webhook URL:</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <code style={{ 
              flex: 1, 
              padding: '8px', 
              background: 'white', 
              border: '1px solid #ced4da', 
              borderRadius: '4px',
              fontSize: '14px',
              wordBreak: 'break-all'
            }}>
              {webhookUrl}
            </code>
            <button 
              onClick={copyWebhookUrl}
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Copy
            </button>
          </div>
          <small style={{ color: '#6c757d', marginTop: '8px', display: 'block' }}>
            Use this URL as your webhook endpoint in WhatsApp Business API settings
          </small>
        </div>

        {/* Unified WhatsApp Configuration Form */}
        <div style={{
          marginBottom: '24px'
        }}>
          <h3 style={{
            color: '#25D366',
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: '600',
            borderBottom: '2px solid #e9ecef',
            paddingBottom: '8px'
          }}>
            📱 WhatsApp Configuration (Complete Setup)
          </h3>
          
          {/* Receiving Configuration (WhatsApp Trigger Node) */}
          <div style={{
            background: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid #e9ecef'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#495057', fontSize: '16px' }}>🔔 Receiving Messages (Trigger)</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '16px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  WhatsApp App ID:
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="Enter your WhatsApp App ID"
                  disabled={isActive}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s',
                    backgroundColor: isActive ? '#f8f9fa' : 'white'
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  Client Secret:
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your Client Secret"
                  disabled={isActive}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    transition: 'border-color 0.3s',
                    backgroundColor: isActive ? '#f8f9fa' : 'white'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sending Configuration (WhatsApp Send Message Node) */}
          <div style={{
            background: '#e7f3ff',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #b3d9ff'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#0056b3', fontSize: '16px' }}>📤 Sending Messages (Action)</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '16px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  Business ID:
                </label>
                <input
                  type="text"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder="e.g., 1234567890123456"
                  disabled={isActive}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: isActive ? '#f8f9fa' : 'white'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  Access Token:
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAxxxxxxxx..."
                  disabled={isActive}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: isActive ? '#f8f9fa' : 'white'
                  }}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '500',
                  color: '#495057'
                }}>
                  Phone Number Send ID:
                </label>
                <input
                  type="text"
                  value={phoneNumberSendId}
                  onChange={(e) => setPhoneNumberSendId(e.target.value)}
                  placeholder="e.g., 628007790405551"
                  disabled={isActive}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e9ecef',
                    borderRadius: '8px',
                    fontSize: '14px',
                    backgroundColor: isActive ? '#f8f9fa' : 'white'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{ 
            color: '#dc3545', 
            background: '#f8d7da', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isActive ? (
            <button
              onClick={handleActivate}
              disabled={isLoading || !appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim()}
              style={{
                padding: '12px 24px',
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading || !appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                opacity: isLoading || !appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? '⏳ Activating Complete Setup...' : '🚀 Start WhatsApp (Receive + Send)'}
            </button>
          ) : (
            <button
              onClick={handleDeactivate}
              disabled={isLoading}
              style={{
                padding: '12px 24px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                opacity: isLoading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? '⏳ Stopping...' : '⏹️ Stop Listening'}
            </button>
          )}
          
          {/* Status Indicator */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '20px',
            background: isActive ? '#d4edda' : '#f8d7da',
            color: isActive ? '#155724' : '#721c24',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isActive ? '#28a745' : '#dc3545'
            }}></div>
            {isActive ? 'Listening for messages' : 'Inactive'}
          </div>
        </div>
      </div>

      {/* Unified System Status Panel */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
        padding: '24px',
        marginBottom: '20px'
      }}>
        <h2 style={{ 
          color: '#25D366', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '24px' }}>🚀</span>
          WhatsApp Unified System Status
          {selectedConversation && (
            <span style={{
              fontSize: '14px',
              background: '#e7f3ff',
              color: '#0056b3',
              padding: '4px 12px',
              borderRadius: '12px',
              border: '1px solid #b3d9ff',
              fontWeight: 'normal'
            }}>
              Selected: {selectedConversation.contactName} ({selectedConversation.phoneNumber})
            </span>
          )}
        </h2>

        {/* Send Status */}
        {sendStatus && (
          <div style={{ 
            color: sendStatus.includes('✅') ? '#28a745' : sendStatus.includes('❌') ? '#dc3545' : '#007bff', 
            background: sendStatus.includes('✅') ? '#d4edda' : sendStatus.includes('❌') ? '#f8d7da' : '#d1ecf1', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            border: `1px solid ${sendStatus.includes('✅') ? '#c3e6cb' : sendStatus.includes('❌') ? '#f5c6cb' : '#bee5eb'}`
          }}>
            {sendStatus}
          </div>
        )}

        {/* System Status and Quick Actions */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            padding: '12px 24px',
            background: isActive ? '#d4edda' : '#f8d7da',
            color: isActive ? '#155724' : '#721c24',
            border: `2px solid ${isActive ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            {isActive ? '✅ Unified System Active' : '❌ System Inactive'}
            <br />
            <small style={{ fontSize: '12px', opacity: 0.8 }}>
              {isActive ? 'Ready to receive AND send messages' : 'Complete configuration above to activate'}
            </small>
          </div>

          {/* Quick Fill Template Button */}
          {isActive && (
            <button
              onClick={() => {
                console.log('Fill Template Message clicked, selectedConversation:', selectedConversation);
                if (selectedConversation) {
                  const contactName = selectedConversation.contactName;
                  console.log('Setting template message for:', contactName);
                  
                  // Check if Claude is connected for AI-powered response
                  if (isClaudeConnected) {
                    setMessageText(`Hello ${contactName}! 👋 Thanks for reaching out. How can I assist you today? (AI-powered response available)`);
                    setSendStatus(`✅ AI-enhanced template filled for ${contactName}`);
                  } else {
                    setMessageText(`Hello ${contactName}, thanks for your message!`);
                    setSendStatus(`✅ Template message filled for ${contactName}`);
                  }
                  setTimeout(() => setSendStatus(''), 3000);
                } else {
                  console.log('No conversation selected');
                  setSendStatus('❌ Please select a conversation first');
                  setTimeout(() => setSendStatus(''), 3000);
                }
              }}
              disabled={isSending || !selectedConversation}
              style={{
                padding: '12px 16px',
                background: (!selectedConversation || isSending) ? '#e9ecef' : '#007bff',
                color: (!selectedConversation || isSending) ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (!selectedConversation || isSending) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              📋 Fill Template ({selectedConversation ? selectedConversation.contactName : 'Select Chat'})
            </button>
          )}
        </div>

        {/* Helper Text */}
        <div style={{ 
          marginTop: '16px',
          padding: '12px',
          background: '#f8f9fa',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#6c757d'
        }}>
          💡 <strong>How it works:</strong> 
          {isActive 
            ? 'Your unified WhatsApp system is active! Messages will appear in conversations below. Click any conversation and use the message bar to reply.' 
            : 'Fill in ALL configuration fields above (both receiving and sending), then click "Start WhatsApp" to activate the unified system.'
          }
        </div>
      </div>

      {/* Conversations Panel */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
        height: '600px',
        display: 'flex',
        overflow: 'hidden'
      }}>
        {console.log('🔍 Conversations panel rendering, selectedConversation exists:', !!selectedConversation)}
        {/* Conversations List */}
        <div style={{ 
          width: '320px',
          borderRight: '1px solid #e9ecef',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '20px 16px 16px',
            borderBottom: '1px solid #e9ecef',
            background: '#f8f9fa'
          }}>
            <h3 style={{ 
              margin: 0, 
              color: '#495057',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              💬 Conversations ({conversations.length})
            </h3>
          </div>
          
          <div style={{ 
            flex: 1, 
            overflowY: 'auto'
          }}>
            {conversations.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                height: '200px',
                color: '#6c757d',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }}>📥</div>
                <p style={{ fontSize: '14px', margin: 0 }}>
                  {isActive ? 'Waiting for messages...' : 'Start listening to see conversations'}
                </p>
              </div>
            ) : (
              conversations.map((conversation, index) => (
                <div 
                  key={conversation.phoneNumber} 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Conversation clicked:', conversation);
                    console.log('Previous selectedConversation:', selectedConversation);
                    setSelectedConversation(conversation);
                    console.log('Selected conversation set to:', conversation);
                    
                    // Auto-fill recipient phone number when conversation is selected
                    console.log('Auto-filling phone number:', conversation.phoneNumber);
                    setRecipientPhone(conversation.phoneNumber);
                    
                    // Show feedback that phone was filled
                    setSendStatus(`✅ Phone number auto-filled: ${conversation.phoneNumber}`);
                    setTimeout(() => setSendStatus(''), 2000);
                  }}
                  style={{ 
                    padding: '16px',
                    borderBottom: '1px solid #f1f3f4',
                    cursor: 'pointer',
                    background: selectedConversation?.phoneNumber === conversation.phoneNumber ? '#e7f3ff' : 'white',
                    transition: 'background-color 0.2s',
                    borderLeft: selectedConversation?.phoneNumber === conversation.phoneNumber ? '4px solid #007bff' : '4px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedConversation?.phoneNumber !== conversation.phoneNumber) {
                      e.currentTarget.style.background = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedConversation?.phoneNumber !== conversation.phoneNumber) {
                      e.currentTarget.style.background = 'white';
                    }
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '6px'
                  }}>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '15px',
                      color: '#1a1a1a',
                      maxWidth: '200px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {conversation.contactName}
                    </div>
                    <div style={{ 
                      color: '#6c757d', 
                      fontSize: '11px',
                      flexShrink: 0
                    }}>
                      {formatTimestamp(conversation.lastMessageTime)}
                    </div>
                  </div>
                  <div style={{ 
                    color: '#6c757d', 
                    fontSize: '12px',
                    marginBottom: '4px'
                  }}>
                    {conversation.phoneNumber}
                  </div>
                  <div style={{ 
                    color: '#4a4a4a', 
                    fontSize: '13px',
                    maxWidth: '280px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {conversation.lastMessage || 'No message'}
                  </div>
                  <div style={{ 
                    marginTop: '6px',
                    fontSize: '11px',
                    color: '#059669',
                    fontWeight: '500'
                  }}>
                    {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Messages Display */}
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {selectedConversation ? (
            <>
              {console.log('🚨 RENDERING SELECTED CONVERSATION:', selectedConversation.contactName)}
              {/* Chat Header */}
              <div style={{ 
                padding: '20px 24px 16px',
                borderBottom: '1px solid #e9ecef',
                background: '#f8f9fa'
              }}>
                <h3 style={{ 
                  margin: 0, 
                  color: '#495057',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {selectedConversation.contactName}
                </h3>
                <p style={{ 
                  margin: '4px 0 0 0', 
                  color: '#6c757d',
                  fontSize: '13px'
                }}>
                  {selectedConversation.phoneNumber}
                </p>
              </div>
              
              {/* Chat Messages */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '16px 24px'
              }}>
                {selectedConversation.messages.map((message, index) => {
                  const isOutgoing = message.isOutgoing || message.direction === 'outgoing';
                  return (
                    <div key={index} style={{ 
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: isOutgoing ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{ 
                        background: isOutgoing ? '#25D366' : '#e7f3ff', 
                        color: isOutgoing ? 'white' : '#212529',
                        padding: '12px 16px', 
                        borderRadius: isOutgoing 
                          ? '18px 18px 4px 18px'  // Outgoing: rounded except bottom-right
                          : '18px 18px 18px 4px', // Incoming: rounded except bottom-left
                        maxWidth: '70%',
                        border: isOutgoing ? 'none' : '1px solid #b3d9ff',
                        position: 'relative'
                      }}>
                        {/* Message status indicator for outgoing messages */}
                        {isOutgoing && (
                          <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '12px',
                            fontSize: '10px',
                            color: '#25D366',
                            background: 'white',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            border: '1px solid #25D366'
                          }}>
                            📤 Sent
                          </div>
                        )}
                        
                        <div style={{ 
                          fontSize: '14px',
                          lineHeight: '1.4',
                          marginBottom: '6px'
                        }}>
                          {message.text || message.message || 'No message content'}
                        </div>
                        <div style={{ 
                          color: isOutgoing ? 'rgba(255,255,255,0.8)' : '#6c757d', 
                          fontSize: '11px',
                          textAlign: 'right'
                        }}>
                          {formatTimestamp(message.timestamp)}
                        </div>
                        {message.messageType && message.messageType !== 'text' && (
                          <div style={{ 
                            marginTop: '6px',
                            padding: '2px 6px',
                            background: isOutgoing ? 'rgba(255,255,255,0.2)' : '#fff3cd',
                            color: isOutgoing ? 'white' : '#856404',
                            fontSize: '10px',
                            borderRadius: '3px',
                            display: 'inline-block'
                          }}>
                            {message.messageType}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Message Input Bar */}
              <div style={{ 
                padding: '16px 24px',
                borderTop: '1px solid #e9ecef',
                background: '#ff0000', // RED BACKGROUND FOR DEBUGGING
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-end',
                minHeight: '80px' // ENSURE MINIMUM HEIGHT
              }}>
                {console.log('🚨🚨🚨 MESSAGE BAR IS RENDERING!!! 🚨🚨🚨')}
                <div style={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  padding: '10px',
                  background: 'blue'
                }}>
                  DEBUG: Message bar is here!
                </div>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Message ${selectedConversation.contactName}...`}
                    disabled={isSending || !isActive}
                    rows={1}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e9ecef',
                      borderRadius: '20px',
                      fontSize: '14px',
                      resize: 'none',
                      backgroundColor: (isSending || !isActive) ? '#f8f9fa' : 'white',
                      fontFamily: 'inherit',
                      outline: 'none',
                      minHeight: '44px',
                      maxHeight: '120px'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (messageText.trim() && isActive) {
                          handleSendMessage();
                        }
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={isSending || !messageText.trim() || !isActive}
                  style={{
                    padding: '12px',
                    background: (isSending || !messageText.trim() || !isActive) 
                               ? '#e9ecef' : '#25D366',
                    color: (isSending || !messageText.trim() || !isActive) 
                           ? '#6c757d' : 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: (isSending || !messageText.trim() || !isActive) 
                           ? 'not-allowed' : 'pointer',
                    fontSize: '18px',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background-color 0.2s'
                  }}
                  title={!isActive 
                         ? 'Activate the unified system first' 
                         : 'Send message'}
                >
                  {isSending ? '⏳' : '📤'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ 
              flex: 1,
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#6c757d',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>💬</div>
              <h3 style={{ fontSize: '18px', margin: '0 0 8px 0', fontWeight: '500' }}>
                Select a conversation
              </h3>
              <p style={{ fontSize: '14px', margin: 0 }}>
                Choose a conversation from the left to view messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppReceiver;