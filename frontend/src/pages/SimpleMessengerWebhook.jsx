import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';
import MessengerAISettings from '../components/MessengerAISettings.jsx';

const SimpleMessengerWebhook = () => {
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
    <div style={{ 
      height: '100vh', 
      backgroundColor: '#f0f2f5',
      display: 'flex'
    }}>
      
      {/* Left Panel - Webhook Setup & Contact List */}
      <div style={{ 
        width: '400px',
        backgroundColor: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: '1rem',
          backgroundColor: '#0084ff',
          color: 'white'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <h1 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold',
                margin: 0
              }}>
                Messenger Manager
              </h1>
              
              <button
                onClick={() => setShowAISettings(true)}
                style={{
                  backgroundColor: aiConfig.enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: `1px solid ${aiConfig.enabled ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255,255,255,0.3)'}`,
                  borderRadius: '6px',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
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
            </div>
            
            {aiConfig.enabled && aiConfig.autoReply && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'rgba(255,255,255,0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <span style={{ color: '#22c55e' }}>●</span>
                AI Auto-reply Active
              </div>
            )}
          </div>

          {/* Configuration Fields */}
          {!isWaiting && !hasReceivedCall && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.875rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', opacity: '0.9' }}>
                    App ID *
                  </label>
                  <input
                    type="text"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    placeholder="Enter your Facebook App ID"
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
            <div style={{ fontSize: '0.8rem', textAlign: 'center', opacity: '0.9' }}>
              🔴 Live - Listening for messages...
            </div>
          )}
        </div>

        {/* Contact List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ 
            padding: '1rem 0.5rem',
            borderBottom: '1px solid #e5e7eb',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            Conversations ({conversations.length})
          </div>
          
          {conversations.length === 0 ? (
            <div style={{ 
              padding: '2rem 1rem',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '0.875rem'
            }}>
              No conversations yet.<br/>
              Send a message to start!
            </div>
          ) : (
            <div>
              {conversations.map((conversation) => (
                <div
                  key={conversation.userId}
                  onClick={() => setSelectedUserId(conversation.userId)}
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    backgroundColor: selectedUserId === conversation.userId ? '#e3f2fd' : 'transparent',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedUserId !== conversation.userId) {
                      e.target.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedUserId !== conversation.userId) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Profile Picture */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#0084ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      color: 'white',
                      fontWeight: 'bold',
                      backgroundImage: conversation.profile_pic ? `url(${conversation.profile_pic})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}>
                      {!conversation.profile_pic && conversation.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Conversation Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: '600', 
                        color: '#111827',
                        marginBottom: '0.25rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {conversation.name}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#9ca3af',
                        marginTop: '0.25rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {conversation.lastMessage.text || 'No message'}
                      </div>
                    </div>
                    
                    {/* Timestamp */}
                    <div style={{ 
                      fontSize: '0.65rem', 
                      color: '#9ca3af',
                      whiteSpace: 'nowrap'
                    }}>
                      {new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Center Panel - Conversation */}
      <div style={{ 
        flex: '1',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        borderRight: selectedUserId ? '1px solid #e5e7eb' : 'none'
      }}>
        
        {/* Conversation Header */}
        {selectedUserId ? (
          <div style={{ 
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e5e7eb',
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
                    backgroundColor: '#0084ff',
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
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                      {selectedUser?.name || 'Messenger User'}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div style={{ 
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: '#111827',
              margin: 0
            }}>
              Messenger Manager
            </h2>
          </div>
        )}

        {/* Messages Display */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1rem',
          backgroundColor: '#f8fafc'
        }}>
          {!selectedUserId ? (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#9ca3af',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>
                Select a conversation
              </h3>
              <p style={{ fontSize: '0.875rem' }}>
                Choose a conversation from the left panel to start messaging
              </p>
              {!isWaiting && !hasReceivedCall && (
                <div style={{ marginTop: '2rem' }}>
                  <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Haven't started receiving messages yet?
                  </p>
                  <button
                    onClick={handleActivate}
                    disabled={isLoading}
                    style={{
                      backgroundColor: isLoading ? '#9ca3af' : '#0084ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? 'Activating...' : '🚀 Start Webhook'}
                  </button>
                </div>
              )}
            </div>
          ) : currentMessages.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#9ca3af', 
              padding: '2rem',
              fontStyle: 'italic'
            }}>
              No messages in this conversation yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentMessages.map((message, index) => {
                const isOutgoing = message.isOutgoing || message.sender?.id === 'me';
                
                return (
                  <div 
                    key={message.id || index}
                    style={{
                      display: 'flex',
                      justifyContent: isOutgoing ? 'flex-end' : 'flex-start',
                      width: '100%'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      minWidth: '120px',
                      backgroundColor: isOutgoing ? '#0084ff' : 'white',
                      color: isOutgoing ? 'white' : '#374151',
                      borderRadius: isOutgoing ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      padding: '0.75rem 1rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      position: 'relative'
                    }}>
                      
                      {/* AI Reply Badge */}
                      {message.isAIReply && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '8px',
                          backgroundColor: '#22c55e',
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
                      <div style={{ 
                        fontSize: '0.875rem',
                        lineHeight: '1.4',
                        wordWrap: 'break-word'
                      }}>
                        {message.text || (isOutgoing ? 'Message sent' : 'No text content')}
                      </div>

                      {/* Timestamp */}
                      <div style={{ 
                        fontSize: '0.65rem', 
                        color: isOutgoing ? 'rgba(255,255,255,0.7)' : '#9ca3af', 
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

        {/* Reply Interface */}
        {selectedUserId && (
          <div style={{ 
            padding: '1rem',
            backgroundColor: 'white',
            borderTop: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'none',
                    outline: 'none',
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
                  backgroundColor: !replyText.trim() || isReplying ? '#9ca3af' : '#0084ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  cursor: !replyText.trim() || isReplying ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}
                onMouseEnter={(e) => {
                  if (!(!replyText.trim() || isReplying)) {
                    e.target.style.backgroundColor = '#0066cc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!(!replyText.trim() || isReplying)) {
                    e.target.style.backgroundColor = '#0084ff';
                  }
                }}
              >
                {isReplying ? '⏳' : '📤'}
              </button>
            </div>
            
            {error && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                backgroundColor: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#dc2626'
              }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - User Information */}
      {selectedUserId && (
        <div style={{ 
          width: '300px',
          backgroundColor: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem'
        }}>
          {(() => {
            const selectedUser = users[selectedUserId];
            return (
              <>
                {/* User Info Header */}
                <div style={{ 
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}>
                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 'bold', 
                    color: '#111827',
                    margin: '0 0 0.5rem 0'
                  }}>
                    👤 User Information
                  </h3>
                </div>

                {/* Profile Picture */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginBottom: '1rem' 
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#0084ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: 'white',
                    fontWeight: 'bold',
                    backgroundImage: selectedUser?.profile_pic ? `url(${selectedUser.profile_pic})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '3px solid #e5e7eb'
                  }}>
                    {!selectedUser?.profile_pic && (selectedUser?.name?.charAt(0).toUpperCase() || 'U')}
                  </div>
                </div>

                {/* User Details */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  
                  {/* Full Name */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem'
                    }}>
                      Full Name
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#111827',
                      fontWeight: '500',
                      padding: '0.5rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {selectedUser?.name || 'Not available'}
                    </div>
                  </div>

                  {/* First Name */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem'
                    }}>
                      First Name
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#111827',
                      fontWeight: '500',
                      padding: '0.5rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {selectedUser?.first_name || 'Not available'}
                    </div>
                  </div>

                  {/* Last Name */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem'
                    }}>
                      Last Name
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#111827',
                      fontWeight: '500',
                      padding: '0.5rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb'
                    }}>
                      {selectedUser?.last_name || 'Not available'}
                    </div>
                  </div>

                  {/* User ID */}
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.25rem'
                    }}>
                      User ID
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#6b7280',
                      fontFamily: 'monospace',
                      padding: '0.5rem',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      wordBreak: 'break-all'
                    }}>
                      {selectedUserId}
                    </div>
                  </div>

                  {/* Profile Picture URL */}
                  {selectedUser?.profile_pic && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.25rem'
                      }}>
                        Profile Picture
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#6b7280',
                        padding: '0.5rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        wordBreak: 'break-all'
                      }}>
                        {selectedUser.profile_pic}
                      </div>
                    </div>
                  )}

                  {/* Data Fetched Time */}
                  {selectedUser?.fetchedAt && (
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.25rem'
                      }}>
                        Data Fetched
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#6b7280',
                        padding: '0.5rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        {new Date(selectedUser.fetchedAt).toLocaleString()}
                      </div>
                    </div>
                  )}

                  {/* Status Indicators */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: '0.5rem'
                    }}>
                      Status
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {selectedUser?.failed && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#dc2626',
                          backgroundColor: '#fef2f2',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #fecaca'
                        }}>
                          ⚠️ API Fetch Failed
                        </div>
                      )}
                      
                      {selectedUser?.error && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#dc2626',
                          backgroundColor: '#fef2f2',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #fecaca'
                        }}>
                          ❌ Fetch Error
                        </div>
                      )}
                      
                      {!selectedUser?.failed && !selectedUser?.error && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#059669',
                          backgroundColor: '#ecfdf5',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #a7f3d0'
                        }}>
                          ✅ Data Available
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Control Button for Selected User */}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        fontWeight: '600', 
                        color: '#6b7280',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '0.5rem'
                      }}>
                        AI Response Control
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: aiActivatingUsers[selectedUserId] ? '#f59e0b' : 
                            (userAIStatus.hasOwnProperty(selectedUserId) ? 
                              (userAIStatus[selectedUserId] ? '#10b981' : '#ef4444') : '#10b981')
                        }}></div>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          color: aiActivatingUsers[selectedUserId] ? '#f59e0b' : 
                            (userAIStatus.hasOwnProperty(selectedUserId) ? 
                              (userAIStatus[selectedUserId] ? '#10b981' : '#ef4444') : '#10b981'),
                          fontWeight: '600'
                        }}>
                          {aiActivatingUsers[selectedUserId] ? 'AI Activating...' : 
                            (userAIStatus.hasOwnProperty(selectedUserId) ? 
                              (userAIStatus[selectedUserId] ? 'AI Active' : 'AI Inactive') : 'AI Active')}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleUserAI(selectedUserId)}
                      disabled={isTogglingAI || !selectedUserId || aiActivatingUsers[selectedUserId]}
                      style={{
                        width: '100%',
                        backgroundColor: isTogglingAI ? '#9ca3af' : 
                          aiActivatingUsers[selectedUserId] ? '#f59e0b' :
                          (userAIStatus.hasOwnProperty(selectedUserId) ? 
                            (userAIStatus[selectedUserId] ? '#ef4444' : '#0084ff') : '#ef4444'),
                        color: 'white',
                        padding: '1rem',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isTogglingAI || !selectedUserId || aiActivatingUsers[selectedUserId] ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isTogglingAI && selectedUserId && !aiActivatingUsers[selectedUserId]) {
                          e.target.style.transform = 'translateY(-1px)';
                          e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                      }}
                    >
                      {isTogglingAI ? (
                        <>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #ffffff',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Updating...
                        </>
                      ) : aiActivatingUsers[selectedUserId] ? (
                        <>
                          ⏳
                          <span>AI Starting... (Please wait)</span>
                        </>
                      ) : (userAIStatus.hasOwnProperty(selectedUserId) ? 
                          (userAIStatus[selectedUserId] ? (
                            <>
                              🚫
                              <span>Deactivate AI</span>
                            </>
                          ) : (
                            <>
                              🤖
                              <span>Activate AI</span>
                            </>
                          )) : (
                            <>
                              🚫
                              <span>Deactivate AI</span>
                            </>
                          )
                      )}
                    </button>
                    
                    <p style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280', 
                      textAlign: 'center', 
                      marginTop: '0.75rem',
                      margin: '0.75rem 0 0 0',
                      lineHeight: '1.4'
                    }}>
                      {aiActivatingUsers[selectedUserId] 
                        ? 'AI is starting up for this user. Please wait 5 seconds before sending messages.'
                        : userAIStatus.hasOwnProperty(selectedUserId) 
                        ? (userAIStatus[selectedUserId] 
                          ? 'AI will automatically respond to this user\'s messages'
                          : 'AI responses are disabled for this user')
                        : 'AI will automatically respond to this user\'s messages'
                      }
                    </p>
                  </div>

                </div>
              </>
            );
          })()}
        </div>
      )}

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