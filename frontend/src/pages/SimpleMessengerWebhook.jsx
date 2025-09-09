import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import MessengerAISettings from '../components/MessengerAISettings.jsx';

const SimpleMessengerWebhook = () => {
  const { theme, colors } = useTheme();
  
  // Configuration state
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [pageId, setPageId] = useState('');
  const [webhookToken, setWebhookToken] = useState('muhammad');
  
  // UI state
  const [isWaiting, setIsWaiting] = useState(false);
  const [hasReceivedCall, setHasReceivedCall] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [firstCallAt, setFirstCallAt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiConfig, setAiConfig] = useState({ enabled: false });
  
  // Per-user AI Management State
  const [userAIStatus, setUserAIStatus] = useState({});
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const [aiActivatingUsers, setAiActivatingUsers] = useState({}); // Track which users are still activating
  
  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  
  // Configuration panel collapse states
  const [isMessengerConfigCollapsed, setIsMessengerConfigCollapsed] = useState(false);
  const [isSelectedUserCollapsed, setIsSelectedUserCollapsed] = useState(false);

  const webhookUrl = `${API_BASE_URL}/api/webhooks/messenger/comments`;
  const verifyToken = 'muhammad';

  // Check status on load
  useEffect(() => {
    checkStatus();
    loadAIConfig();
    loadSavedConfigurations();
  }, []);

  // Load all saved configurations on mount
  const loadSavedConfigurations = async () => {
    try {
      // Load Messenger bot configuration
      const configResponse = await fetch(`${API_BASE_URL}/api/messenger/config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'MOCK_TOKEN'}`
        }
      });
      
      if (configResponse.ok) {
        const configData = await configResponse.json();
        if (configData.success && configData.config) {
          setAppId(configData.config.appId || '');
          setPageId(configData.config.pageId || '');
          setWebhookToken(configData.config.webhookToken || 'muhammad');
          setIsWaiting(configData.config.isActive || false);
          
          console.log('✅ Messenger configuration loaded successfully');
        }
      }
    } catch (error) {
      console.error('Error loading saved configurations:', error);
    }
  };

  const loadAIConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messenger-ai/config`);
      const data = await response.json();
      
      if (data.success) {
        setAiConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  };

  // Poll for webhook status and messages when waiting
  useEffect(() => {
    let interval;
    if (isWaiting) {
      interval = setInterval(() => {
        checkStatus();
        fetchMessages();
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [isWaiting]);

  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messenger/status`);
      const data = await response.json();
      
      if (data.success) {
        setIsWaiting(data.status.isWaitingForCall);
        setHasReceivedCall(data.status.hasReceivedCall);
        setFirstCallAt(data.status.firstCallAt);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleActivate = async () => {
    setIsLoading(true);
    setError('');

    // Validate required fields
    if (!appId || !appSecret || !accessToken || !pageId) {
      setError('Please fill in all required fields: App ID, App Secret, Access Token, and Page ID');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/messenger/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'MOCK_TOKEN'}`
        },
        body: JSON.stringify({
          appId,
          appSecret,
          accessToken,
          pageId,
          webhookToken
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsWaiting(true);
        setHasReceivedCall(false);
        console.log('✅ Started waiting for webhook call from Meta');
      } else {
        setError(data.error || 'Failed to start waiting for webhook');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messenger/messages`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
        // For Messenger, get users separately
        const usersResponse = await fetch(`${API_BASE_URL}/api/messenger/users`);
        const usersData = await usersResponse.json();
        if (usersData.success) {
          setUsers(usersData.users || {});
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Get unique conversations (users who have sent messages)
  const getConversations = () => {
    const conversations = {};
    
    messages.forEach(message => {
      const senderId = message.sender?.id;
      const recipientId = message.recipient?.id;
      
      // For incoming messages (from users to us)
      if (senderId && senderId !== 'me') {
        const user = users[senderId];
        if (!conversations[senderId] || new Date(message.timestamp) > new Date(conversations[senderId].lastMessage.timestamp)) {
          conversations[senderId] = {
            userId: senderId,
            name: user?.name || 'Messenger User',
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            profile_pic: user?.profile_pic,
            lastMessage: message,
            unreadCount: 0
          };
        }
      }
      
      // For outgoing messages (from us to users), update existing conversation
      if (senderId === 'me' && recipientId) {
        const user = users[recipientId];
        if (!conversations[recipientId] || new Date(message.timestamp) > new Date(conversations[recipientId].lastMessage.timestamp)) {
          conversations[recipientId] = {
            userId: recipientId,
            name: user?.name || 'Messenger User',
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            profile_pic: user?.profile_pic,
            lastMessage: message,
            unreadCount: 0
          };
        }
      }
    });
    
    // Sort by most recent message
    return Object.values(conversations).sort((a, b) => 
      new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    );
  };

  // Get messages for selected user
  const getMessagesForUser = (userId) => {
    if (!userId) return messages;
    return messages.filter(message => 
      message.sender?.id === userId || 
      (message.recipient?.id === userId && message.sender?.id === 'me')
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleReply = async () => {
    if (!selectedUserId || !replyText.trim()) return;

    setIsReplying(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/messenger/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          senderId: selectedUserId,
          replyText: replyText.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ Reply sent successfully');
        setReplyText('');
        // Don't deselect user - keep conversation open
        // Don't add message here - backend will store it and next poll will fetch it
      } else {
        setError(data.error || 'Failed to send reply');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setIsReplying(false);
    }
  };

  const toggleUserAI = async (userId) => {
    if (!userId || isTogglingAI) return;
    
    setIsTogglingAI(true);
    
    // Check if user has explicit status set, otherwise default to true (active)
    const currentStatus = userAIStatus.hasOwnProperty(userId) ? userAIStatus[userId] : true;
    const newStatus = !currentStatus;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/messenger/user-ai/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: userId,
          isActive: newStatus
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // If activating AI, mark user as "activating" for 5 seconds
        if (newStatus) {
          setAiActivatingUsers(prev => ({ ...prev, [userId]: true }));
          
          // Clear activating status after 5 seconds
          setTimeout(() => {
            setAiActivatingUsers(prev => {
              const updated = { ...prev };
              delete updated[userId];
              return updated;
            });
          }, 5000);
        }
        
        setUserAIStatus(prev => ({
          ...prev,
          [userId]: newStatus
        }));
      } else {
        console.error('Failed to toggle AI status for user:', data.error);
      }
    } catch (error) {
      console.error('Network error:', error.message);
    } finally {
      setIsTogglingAI(false);
    }
  };

  const conversations = getConversations();
  const currentMessages = getMessagesForUser(selectedUserId);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.primaryBg, padding: '2rem 0' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '0' }}>
        {/* Fixed Toggle Buttons */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            left: isSidebarCollapsed ? '20px' : '400px',
            backgroundColor: '#0084ff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: 1001
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#0066cc'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#0084ff'}
        >
          {isSidebarCollapsed ? '☰' : '✕'}
        </button>
        
        <button
          onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            right: isRightSidebarCollapsed ? '20px' : '300px',
            backgroundColor: colors.success,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: 1001
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = colors.brandBlueDark}
          onMouseLeave={(e) => e.target.style.backgroundColor = colors.success}
        >
          {isRightSidebarCollapsed ? '☰' : '✕'}
        </button>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '1.5rem', 
          position: 'relative',
          backgroundColor: colors.secondaryBg,
          padding: '1rem 2rem',
          borderBottom: `1px solid ${colors.border}`
        }}>
          
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.primaryText, margin: 0 }}>
            <i className="fab fa-facebook-messenger" style={{ color: '#0084ff', marginRight: '0.5rem' }}></i>
            Messenger Manager
          </h1>
          <ThemeToggle />
        </div>
        
        <div style={{ display: 'flex', gap: '0', alignItems: 'flex-start', position: 'relative' }}>
          
          {/* LEFT SIDEBAR - Sliding Configuration Panel */}
          <div style={{ 
            width: '400px',
            backgroundColor: colors.secondaryBg, 
            borderRadius: '0', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            left: '0',
            borderRight: `1px solid ${colors.border}`,
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            transform: isSidebarCollapsed ? 'translateX(-420px)' : 'translateX(0)',
            opacity: isSidebarCollapsed ? 0 : 1,
            zIndex: 1000
          }}>
              {/* Sidebar Header */}
              <div style={{ 
                backgroundColor: '#0084ff', 
                color: 'white', 
                padding: '1rem 1.5rem',
                borderRadius: '0'
              }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center' }}>
                  ⚙️ Configuration Panel
                </h2>
              </div>
              
              {/* Sidebar Content */}
              <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
                
                {/* Messenger Configuration Section */}
                <div style={{ marginBottom: isMessengerConfigCollapsed ? '0' : '2rem' }}>
                  <h3 
                    onClick={() => setIsMessengerConfigCollapsed(!isMessengerConfigCollapsed)}
                    style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: colors.primaryText, 
                      marginBottom: '1rem', 
                      borderBottom: `2px solid ${colors.border}`, 
                      paddingBottom: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      userSelect: 'none'
                    }}
                  >
                    <span>💬 Messenger Configuration</span>
                    
                    <button
                      onClick={() => setShowAISettings(true)}
                      style={{
                        backgroundColor: aiConfig.enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                        color: aiConfig.enabled ? '#15803d' : '#6b7280',
                        border: `1px solid ${aiConfig.enabled ? 'rgba(34, 197, 94, 0.5)' : 'rgba(156, 163, 175, 0.3)'}`,
                  borderRadius: '6px',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="AI Assistant Settings"
                    >
                      🤖 AI {aiConfig.enabled ? 'ON' : 'OFF'}
                    </button>
                    <span style={{ 
                      transform: isMessengerConfigCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '0.8rem',
                      color: colors.mutedText
                    }}>
                      ▼
                    </span>
                  </h3>
                  
                  {/* Collapsible Content */}
                  <div style={{
                    maxHeight: isMessengerConfigCollapsed ? '0' : '1000px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                    opacity: isMessengerConfigCollapsed ? 0 : 1
                  }}>

          {/* Configuration Fields */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.secondaryText, marginBottom: '0.5rem' }}>
                App ID *
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="Enter your Facebook App ID"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: `1px solid ${colors.border}`, 
                  borderRadius: '6px', 
                  fontSize: '0.875rem',
                  outline: 'none',
                  opacity: isLoading ? '0.5' : '1',
                  backgroundColor: colors.inputBg,
                  color: colors.primaryText
                }}
                disabled={isLoading}
              />
              <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: colors.mutedText }}>
                Get from Meta Developer Console → Your App → App ID
              </p>
            </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', opacity: '0.9' }}>
                    App Secret *
                  </label>
                  <input
                    type="password"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    placeholder="Enter your Facebook App Secret"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', opacity: '0.9' }}>
                    Access Token *
                  </label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Enter your Page Access Token"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', opacity: '0.9' }}>
                    Page ID *
                  </label>
                  <input
                    type="text"
                    value={pageId}
                    onChange={(e) => setPageId(e.target.value)}
                    placeholder="Enter your Facebook Page ID"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', opacity: '0.9' }}>
                    Webhook Verify Token
                  </label>
                  <input
                    type="text"
                    value={webhookToken}
                    onChange={(e) => setWebhookToken(e.target.value)}
                    placeholder="Webhook verify token"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Status Display */}
          {!isWaiting && !hasReceivedCall && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <button
                onClick={handleActivate}
                disabled={isLoading}
                style={{
                  backgroundColor: isLoading ? '#9ca3af' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  width: '100%'
                }}
              >
                {isLoading ? 'Activating...' : '🚀 Start Webhook'}
              </button>
            </div>
          )}
          
          {isWaiting && (
            <div style={{ 
              padding: '1rem', 
              borderRadius: '6px', 
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: colors.success,
              textAlign: 'center',
              fontSize: '0.875rem'
            }}>
              🔴 Live - Listening for messages...
            </div>
          )}
                  </div> {/* End Collapsible Content */}
                </div>

                {/* AI Status Info - Simple indicator when AI is active */}
                {aiConfig.enabled && aiConfig.autoReply && (
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    paddingLeft: '0.5rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <span style={{ color: '#22c55e' }}>🤖</span>
                    AI Auto-reply is Active - Click the AI button above to configure settings
                  </div>
                )}
                
              </div>
            </div>


          {/* MIDDLE COLUMN - Chat Interface */}
          <div style={{ 
            position: 'fixed',
            top: '0',
            left: isSidebarCollapsed ? '0' : '400px',
            right: isRightSidebarCollapsed ? '0' : '300px',
            height: '100vh',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0',
            transition: 'left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            padding: '2rem 1rem',
            backgroundColor: colors.primaryBg,
            borderTop: `1px solid ${colors.border}`,
            borderBottom: `1px solid ${colors.border}`,
            zIndex: 999,
            overflowY: 'auto'
          }}>

            {/* Two Panel Layout */}
            <div style={{
              opacity: isWaiting ? 1 : 0.6
            }}>
              {!isWaiting && !hasReceivedCall && (
                <div style={{
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: `1px solid ${colors.error}`
                }}>
                  <p style={{ color: colors.error, fontSize: '0.875rem', margin: 0 }}>
                    ⚠️ Setup and activate webhook first to start receiving messages
                  </p>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                gap: '0', 
                height: '500px', 
                border: `1px solid ${colors.border}`, 
                borderRadius: '8px', 
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%'
              }}>
                
                {/* Users Panel */}
                <div style={{ 
                  flex: '0 0 300px',
                  width: '300px',
                  minWidth: '300px',
                  maxWidth: '300px',
                  backgroundColor: colors.cardBg, 
                  padding: '1rem', 
                  borderRight: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '500', color: colors.primaryText, margin: 0 }}>
                      💬 Conversations
                      {isWaiting && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: colors.success,
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          🟢 Live
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: colors.mutedText }}>
                      {conversations.length} chat{conversations.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: colors.inputBg, 
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`
                  }}>
                    {conversations.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: colors.mutedText,
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                        <p>No conversations yet. Send a message to start!</p>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem' }}>
                        {conversations.map((conversation) => (
                          <div
                            key={conversation.userId}
                            onClick={() => setSelectedUserId(conversation.userId)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              marginBottom: '0.5rem',
                              cursor: 'pointer',
                              backgroundColor: selectedUserId === conversation.userId ? colors.brandBlue : 'transparent',
                              color: selectedUserId === conversation.userId ? 'white' : colors.primaryText,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: selectedUserId === conversation.userId ? 'rgba(255,255,255,0.2)' : colors.brandBlue,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '0.75rem',
                              fontSize: '1rem',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {conversation.name ? conversation.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontWeight: '500', 
                                fontSize: '0.875rem',
                                marginBottom: '0.25rem',
                                color: selectedUserId === conversation.userId ? 'white' : colors.primaryText
                              }}>
                                {conversation.name || `User ${conversation.userId.slice(-4)}`}
                              </div>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: selectedUserId === conversation.userId ? 'rgba(255,255,255,0.8)' : colors.mutedText,
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis'
                              }}>
                                {conversation.lastMessage?.text || 'No messages'}
                              </div>
                            </div>
                            <div style={{ 
                              fontSize: '0.7rem', 
                              color: selectedUserId === conversation.userId ? 'rgba(255,255,255,0.7)' : colors.mutedText,
                              whiteSpace: 'nowrap'
                            }}>
                              {new Date(conversation.lastMessage?.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Messages Panel */}
                <div style={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: colors.inputBg
                }}>
        
                  {/* Conversation Header */}
                  {selectedUserId ? (
                    <div style={{ 
                      padding: '1rem',
                      backgroundColor: colors.secondaryBg,
                      borderBottom: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      {(() => {
                        const selectedUser = users[selectedUserId];
                        return (
                          <>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: colors.brandBlue,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1rem',
                              color: 'white',
                              fontWeight: 'bold',
                              backgroundImage: selectedUser?.profile_pic ? `url(${selectedUser.profile_pic})` : 'none',
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}>
                              {!selectedUser?.profile_pic && (selectedUser?.name?.charAt(0).toUpperCase() || 'U')}
                            </div>
                            <div>
                              <div style={{ fontSize: '1rem', fontWeight: '600', color: colors.primaryText }}>
                                {selectedUser?.name || 'Messenger User'}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '2rem',
                      backgroundColor: colors.cardBg,
                      textAlign: 'center',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>💬</div>
                      <h2 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '600',
                        color: colors.primaryText,
                        margin: '0 0 0.5rem 0'
                      }}>
                        Select a Conversation
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: colors.mutedText, margin: 0 }}>
                        Choose a conversation from the left panel to start messaging
                      </p>
                    </div>
                  )}

                  {/* Messages Display */}
                  {selectedUserId && (
                    <div style={{ 
                      flex: 1, 
                      overflowY: 'auto', 
                      padding: '1rem',
                      backgroundColor: colors.primaryBg
                    }}>
                      {currentMessages.length === 0 ? (
                        <div style={{ 
                          textAlign: 'center', 
                          color: colors.mutedText, 
                          padding: '2rem',
                          fontStyle: 'italic'
                        }}>
                          No messages in this conversation yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {currentMessages.map((message, index) => {
                            const isOutgoing = message.isOutgoing || message.sender?.id === 'me';
                            
                            return (
                              <div 
                                key={message.id || index}
                                style={{
                                  display: 'flex',
                                  justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
                                  width: '100%',
                                  marginBottom: '0.5rem'
                                }}
                              >
                                <div style={{
                                  maxWidth: '70%',
                                  padding: '0.75rem 1rem',
                                  borderRadius: isOutgoing ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                  backgroundColor: isOutgoing ? colors.brandBlue : colors.cardBg,
                                  color: isOutgoing ? 'white' : colors.primaryText,
                                  fontSize: '0.875rem',
                                  lineHeight: '1.4',
                                  wordWrap: 'break-word',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                  position: 'relative'
                                }}>
                      
                                  {/* AI Reply Badge */}
                                  {message.isAIReply && (
                                    <div style={{
                                      position: 'absolute',
                                      top: '-8px',
                                      left: '8px',
                                      backgroundColor: colors.success,
                                      color: 'white',
                                      fontSize: '0.6rem',
                                      padding: '2px 6px',
                                      borderRadius: '10px',
                                      fontWeight: 'bold'
                                    }}>
                                      🤖 AI
                                    </div>
                                  )}
                                  
                                  {/* Message Content */}
                                  <div style={{ marginBottom: '0.25rem' }}>
                                    {message.text || (isOutgoing ? 'Message sent' : 'No text content')}
                                  </div>

                                  {/* Timestamp */}
                                  <div style={{ 
                                    fontSize: '0.65rem',
                                    opacity: 0.7,
                                    color: isOutgoing ? 'rgba(255,255,255,0.7)' : colors.mutedText,
                                    marginTop: '0.25rem',
                                    textAlign: isOutgoing ? 'right' : 'left'
                                  }}>
                                    {formatTimestamp(message.timestamp)}
                                    {isOutgoing && ' ✓'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply Interface */}
                  {selectedUserId && (
                    <div style={{ 
                      padding: '1rem',
                      backgroundColor: colors.secondaryBg,
                      borderTop: `1px solid ${colors.border}`
                    }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Type your message..."
                            style={{
                              width: '100%',
                              minHeight: '44px',
                              maxHeight: '120px',
                              padding: '0.75rem 1rem',
                              border: `1px solid ${colors.border}`,
                              borderRadius: '20px',
                              backgroundColor: colors.inputBg,
                              color: colors.primaryText,
                              fontSize: '0.875rem',
                              resize: 'none',
                              outline: 'none',
                              fontFamily: 'inherit',
                              boxSizing: 'border-box'
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleReply();
                              }
                            }}
                          />
                        </div>
                        
                        <button
                          onClick={handleReply}
                          disabled={!replyText.trim() || isReplying}
                          style={{
                            width: '44px',
                            height: '44px',
                            backgroundColor: !replyText.trim() || isReplying ? colors.mutedText : colors.brandBlue,
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            cursor: !replyText.trim() || isReplying ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                          }}
                          onMouseEnter={(e) => {
                            if (!(!replyText.trim() || isReplying)) {
                              e.target.style.backgroundColor = colors.brandBlueDark;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!(!replyText.trim() || isReplying)) {
                              e.target.style.backgroundColor = colors.brandBlue;
                            }
                          }}
                        >
                          {isReplying ? '⏳' : '📤'}
                        </button>
                      </div>
                      
                      {error && (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                          border: `1px solid ${colors.error}`,
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          color: colors.error
                        }}>
                          {error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Message Input Field for No Conversation Selected */}
            <div style={{
              padding: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ 
                padding: '1rem',
                backgroundColor: colors.overlay,
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: colors.mutedText
              }}>
                💡 Complete setup → Select a conversation → Start chatting!
              </div>
            </div>
          </div>
        
          {/* RIGHT SIDEBAR - Sliding User Information Panel */}
        <div style={{ 
          width: '300px',
          backgroundColor: colors.cardBg, 
          borderRadius: '0', 
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
          padding: '0',
          height: '100vh',
          position: 'fixed',
          top: '0',
          right: '0',
          borderLeft: `1px solid ${colors.border}`,
          overflow: 'hidden',
          transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
          transform: isRightSidebarCollapsed ? 'translateX(320px)' : 'translateX(0)',
          opacity: isRightSidebarCollapsed ? 0 : 1,
          zIndex: 1000
        }}>
          {/* Right Sidebar Header */}
          <div style={{ 
            backgroundColor: colors.success, 
            color: 'white', 
            padding: '1rem 1.5rem',
            borderRadius: '0'
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center' }}>
              👤 User Information
            </h2>
          </div>
          
          {/* Right Sidebar Content */}
          <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
            
            {/* Selected User Info Section */}
            <div style={{ marginBottom: isSelectedUserCollapsed ? '0' : '2rem' }}>
              <h3 
                onClick={() => setIsSelectedUserCollapsed(!isSelectedUserCollapsed)}
                style={{ 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: colors.primaryText, 
                  marginBottom: '1rem', 
                  borderBottom: `2px solid ${colors.border}`, 
                  paddingBottom: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  userSelect: 'none'
                }}
              >
                <span>👤 Selected User</span>
                <span style={{ 
                  transform: isSelectedUserCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  fontSize: '0.8rem',
                  color: colors.mutedText
                }}>
                  ▼
                </span>
              </h3>

              {/* Collapsible Content */}
              <div style={{
                maxHeight: isSelectedUserCollapsed ? '0' : '2000px',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                opacity: isSelectedUserCollapsed ? 0 : 1
              }}>
              
                {selectedUserId ? (() => {
                  const selectedUser = users[selectedUserId];
                  return (
                    <div>
                      {/* Profile Picture */}
                      <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '1.5rem' 
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          backgroundColor: colors.brandBlue,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '2rem',
                          color: 'white',
                          fontWeight: 'bold',
                          backgroundImage: selectedUser?.profile_pic ? `url(${selectedUser.profile_pic})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          border: `3px solid ${colors.border}`,
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                        }}>
                          {!selectedUser?.profile_pic && (selectedUser?.name?.charAt(0).toUpperCase() || 'U')}
                        </div>
                        <div style={{ 
                          marginTop: '0.75rem', 
                          fontSize: '1.1rem', 
                          fontWeight: '600', 
                          color: colors.primaryText 
                        }}>
                          {selectedUser?.name || 'Messenger User'}
                        </div>
                      </div>

                      {/* User Details */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        
                        {/* Full Name */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: colors.mutedText,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.5rem'
                          }}>
                            Full Name
                          </div>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            color: colors.primaryText,
                            fontWeight: '500',
                            padding: '0.75rem',
                            backgroundColor: colors.inputBg,
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`
                          }}>
                            {selectedUser?.name || 'Not available'}
                          </div>
                        </div>

                        {/* User ID */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: colors.mutedText,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.5rem'
                          }}>
                            User ID
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: colors.secondaryText,
                            fontFamily: 'monospace',
                            padding: '0.75rem',
                            backgroundColor: colors.inputBg,
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            wordBreak: 'break-all'
                          }}>
                            {selectedUserId}
                          </div>
                        </div>

                        {/* Messages Count */}
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '600', 
                            color: colors.mutedText,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.5rem'
                          }}>
                            Messages
                          </div>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            color: colors.primaryText,
                            fontWeight: '500',
                            padding: '0.75rem',
                            backgroundColor: colors.inputBg,
                            borderRadius: '8px',
                            border: `1px solid ${colors.border}`,
                            textAlign: 'center'
                          }}>
                            {currentMessages.length} messages
                          </div>
                        </div>
                      
                      {/* AI Control Section */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '600', 
                          color: colors.primaryText,
                          marginBottom: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          🤖 AI Assistant Control
                        </div>
                        
                        <div style={{
                          padding: '1rem',
                          backgroundColor: userAIStatus[selectedUserId] ? colors.overlay : 'rgba(156, 163, 175, 0.1)',
                          borderRadius: '8px',
                          border: `1px solid ${userAIStatus[selectedUserId] ? colors.success : colors.border}`,
                          textAlign: 'center'
                        }}>
                          <div style={{ 
                            fontSize: '0.875rem', 
                            color: colors.primaryText,
                            marginBottom: '0.75rem'
                          }}>
                            Status: <strong>{userAIStatus[selectedUserId] ? 'Active' : 'Inactive'}</strong>
                          </div>
                          <button
                            onClick={() => toggleUserAI(selectedUserId)}
                            disabled={isTogglingAI}
                            style={{
                              backgroundColor: userAIStatus[selectedUserId] ? colors.error : colors.success,
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '0.5rem 1rem',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: isTogglingAI ? 'not-allowed' : 'pointer',
                              opacity: isTogglingAI ? 0.7 : 1
                            }}
                          >
                            {isTogglingAI ? '⏳ Processing...' : userAIStatus[selectedUserId] ? '🚫 Deactivate AI' : '🤖 Activate AI'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      color: colors.mutedText,
                      padding: '2rem'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>
                        {String.fromCharCode(128100)}
                      </div>
                      <p>Select a user to view details</p>
                    </div>
                    
                    {/* Statistics Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: colors.primaryText, 
                    marginBottom: '1rem', 
                    borderBottom: `2px solid ${colors.border}`, 
                    paddingBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                  }}
                >
                  <span>📊 Statistics</span>
                </h3>
                
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: colors.inputBg,
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.brandBlue }}>
                      {conversations.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: colors.mutedText }}>
                      Total Conversations
                    </div>
                  </div>
                  
                  <div style={{
                    backgroundColor: colors.inputBg,
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.success }}>
                      {messages.length}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: colors.mutedText }}>
                      Total Messages
                    </div>
                  </div>

                  <div style={{
                    backgroundColor: colors.inputBg,
                    padding: '1rem',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isWaiting ? colors.success : colors.error }}>
                      {isWaiting ? '🟢' : '🔴'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: colors.mutedText }}>
                      Webhook Status
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: colors.primaryText, 
                    marginBottom: '1rem', 
                    borderBottom: `2px solid ${colors.border}`, 
                    paddingBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                  }}
                >
                  <span>⚡ Quick Actions</span>
                </h3>
                
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      backgroundColor: colors.brandBlue,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    🔄 Refresh Page
                  </button>
                  
                  <button
                    onClick={() => setSelectedUserId(null)}
                    style={{
                      backgroundColor: colors.mutedText,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    ❌ Clear Selection
                  </button>
                </div>
              </div>
            </div>
          );
        })() : (
          <div style={{ 
            textAlign: 'center', 
            color: colors.mutedText,
            padding: '2rem'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>
              {String.fromCharCode(128100)}
            </div>
            <p>Select a user to view details</p>
          </div>
        )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Settings Modal */}
        <MessengerAISettings
          isVisible={showAISettings}
          onClose={() => {
            setShowAISettings(false);
            loadAIConfig(); // Reload config after closing settings
          }}
        />

      </div>
    );
  };

  export default SimpleMessengerWebhook;
