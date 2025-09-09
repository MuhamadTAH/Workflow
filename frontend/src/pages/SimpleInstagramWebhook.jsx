import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';
import InstagramAISettings from '../components/InstagramAISettings.jsx';

const SimpleInstagramWebhook = () => {
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
  
  // Sidebar states
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  
  // Per-user AI Management State
  const [userAIStatus, setUserAIStatus] = useState({});
  const [isTogglingAI, setIsTogglingAI] = useState(false);

  const webhookUrl = `${API_BASE_URL}/api/webhooks/instagram/comments`;
  const verifyToken = 'muhammad';

  // Check status on load
  useEffect(() => {
    checkStatus();
    loadAIConfig();
  }, []);

  const loadAIConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-ai/config`);
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
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/status`);
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
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
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/comments`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
        setUsers(data.users || {});
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
            username: user?.username || `user_${senderId.slice(0, 8)}`,
            name: user?.name || 'Instagram User',
            profile_picture_url: user?.profile_picture_url,
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
            username: user?.username || `user_${recipientId.slice(0, 8)}`,
            name: user?.name || 'Instagram User',
            profile_picture_url: user?.profile_picture_url,
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
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/reply`, {
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
    setError('');
    
    const currentStatus = userAIStatus[userId] !== false; // Default to true if not set
    const newStatus = !currentStatus;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/user-ai/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          isActive: newStatus
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setUserAIStatus(prev => ({
          ...prev,
          [userId]: newStatus
        }));
      } else {
        setError(data.error || 'Failed to toggle AI status for user');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setIsTogglingAI(false);
    }
  };

  const conversations = getConversations();
  const currentMessages = getMessagesForUser(selectedUserId);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      padding: '2rem 0',
      position: 'relative'
    }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* Fixed Toggle Buttons */}
        <button
          onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            left: isLeftSidebarCollapsed ? '20px' : '420px',
            backgroundColor: '#E4405F',
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
          onMouseEnter={(e) => e.target.style.backgroundColor = '#C13584'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#E4405F'}
        >
          {isLeftSidebarCollapsed ? '☰' : '✕'}
        </button>
        
        <button
          onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            right: isRightSidebarCollapsed ? '20px' : '320px',
            backgroundColor: '#10b981',
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
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          {isRightSidebarCollapsed ? '☰' : '✕'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
            <i className="fab fa-instagram" style={{ color: '#E4405F', marginRight: '0.5rem' }}></i>
            Instagram DM Manager
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative' }}>
          
          {/* LEFT SIDEBAR - Webhook Setup & Contact List */}
          <div style={{ 
            width: '400px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px 8px 0 0',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            left: '0',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            transform: isLeftSidebarCollapsed ? 'translateX(-420px)' : 'translateX(0)',
            opacity: isLeftSidebarCollapsed ? 0 : 1,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Sidebar Header */}
            <div style={{ 
              backgroundColor: '#E4405F', 
              color: 'white', 
              padding: '1rem 1.5rem',
              borderRadius: '8px 8px 0 0'
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center' }}>
                📷 Instagram DM Manager
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
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
                
                {!isWaiting && !hasReceivedCall && (
                  <button
                    onClick={handleActivate}
                    disabled={isLoading}
                    style={{
                      backgroundColor: isLoading ? '#9ca3af' : 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '6px',
                      padding: '0.5rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? 'Activating...' : '🚀 Start'}
                  </button>
                )}
              </div>
              
              {aiConfig.enabled && aiConfig.autoReply && (
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'rgba(255,255,255,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginTop: '0.5rem'
                }}>
                  <span style={{ color: '#22c55e' }}>●</span>
                  AI Auto-reply Active
                </div>
              )}
              
              {isWaiting && (
                <div style={{ fontSize: '0.75rem', textAlign: 'center', opacity: '0.9', marginTop: '0.5rem' }}>
                  🔴 Live - Listening for messages...
                </div>
              )}
            </div>

            {/* Sidebar Content */}
            <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
              <div style={{ 
                padding: '0 0 1rem 0',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '1rem'
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
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                  No conversations yet. Send a DM to start!
                </div>
              ) : (
                <div>
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.userId}
                      onClick={() => setSelectedUserId(conversation.userId)}
                      style={{
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        backgroundColor: selectedUserId === conversation.userId ? '#fef2f2' : '#f9fafb',
                        borderRadius: '6px',
                        border: selectedUserId === conversation.userId ? '2px solid #E4405F' : '1px solid #f3f4f6',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#E4405F',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          color: 'white',
                          fontWeight: 'bold',
                          backgroundImage: conversation.profile_picture_url ? `url(${conversation.profile_picture_url})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}>
                          {!conversation.profile_picture_url && conversation.name.charAt(0).toUpperCase()}
                        </div>
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
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {conversation.lastMessage.text || 'No message'}
                          </div>
                          <div style={{ 
                            fontSize: '0.65rem', 
                            color: '#6b7280',
                            marginTop: '0.25rem'
                          }}>
                            {formatTimestamp(conversation.lastMessage.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MIDDLE PANEL - Conversation */}
          <div style={{ 
            flex: '1',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            minWidth: '500px',
            marginLeft: isLeftSidebarCollapsed ? '0' : '400px',
            marginRight: isRightSidebarCollapsed ? '0' : '300px',
            transition: 'margin-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), margin-right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}>
            {/* Two Panel Layout - Messenger Style */}
            <div style={{
              opacity: isWaiting ? 1 : 0.6
            }}>
              <div style={{ 
                display: 'flex', 
                gap: '0', 
                height: 'calc(100vh - 60px)', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%'
              }}>
                
                {/* Conversations Panel */}
                <div style={{ 
                  flex: '0 0 300px',
                  width: '300px',
                  minWidth: '300px',
                  maxWidth: '300px',
                  backgroundColor: '#f8fafc', 
                  padding: '1rem', 
                  borderRight: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>
                      💬 Conversations
                      {isWaiting && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: '#E4405F',
                          backgroundColor: 'rgba(228, 64, 95, 0.1)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          🟢 Live
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {conversations.length} chat{conversations.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: 'white', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {conversations.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                        No conversations yet.<br/>
                        Send a DM to start!
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
                              backgroundColor: selectedUserId === conversation.userId ? '#fef2f2' : 'transparent',
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
                                backgroundColor: '#E4405F',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                                color: 'white',
                                fontWeight: 'bold',
                                backgroundImage: conversation.profile_picture_url ? `url(${conversation.profile_picture_url})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}>
                                {!conversation.profile_picture_url && conversation.name.charAt(0).toUpperCase()}
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
                                {formatTimestamp(conversation.lastMessage.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <div style={{ 
                  flex: 1,
                  backgroundColor: '#f8fafc', 
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {selectedUserId ? (
                    <>
                      {/* Chat Header */}
                      <div style={{ 
                        padding: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        {(() => {
                          const selectedUser = conversations.find(c => c.userId === selectedUserId);
                          return (
                            <>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#E4405F',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                                color: 'white',
                                fontWeight: 'bold',
                                backgroundImage: selectedUser?.profile_picture_url ? `url(${selectedUser.profile_picture_url})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}>
                                {!selectedUser?.profile_picture_url && (selectedUser?.name?.charAt(0).toUpperCase() || 'U')}
                              </div>
                              <div>
                                <div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>
                                  {selectedUser?.name || 'Instagram User'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {currentMessages.length} message{currentMessages.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Messages Display */}
                      <div style={{ 
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem',
                        backgroundColor: '#f9fafb',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}>
                        {currentMessages.length === 0 ? (
                          <div style={{ 
                            padding: '2rem', 
                            textAlign: 'center', 
                            color: '#9ca3af',
                            fontSize: '0.875rem'
                          }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                            No messages in this conversation yet.
                          </div>
                        ) : (
                          currentMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((message, index) => {
                            const isOutgoing = message.from_id === 'me' || message.sender?.id === 'me';
                            
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
                                  backgroundColor: isOutgoing ? '#E4405F' : 'white',
                                  color: isOutgoing ? 'white' : '#111827',
                                  fontSize: '0.875rem',
                                  lineHeight: '1.4',
                                  wordWrap: 'break-word',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                  position: 'relative'
                                }}>
                                  <div>{message.text}</div>
                                  <div style={{ 
                                    fontSize: '0.65rem', 
                                    marginTop: '0.25rem',
                                    opacity: 0.7,
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}>
                                    {formatTimestamp(message.timestamp)}
                                    {isOutgoing && ' ✓'}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Message Input */}
                      <div style={{
                        padding: '1rem',
                        backgroundColor: 'white',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-end'
                      }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !isReplying && replyText.trim()) {
                                handleReply();
                              }
                            }}
                            placeholder="Type a message..."
                            disabled={isReplying}
                            style={{
                              width: '100%',
                              padding: '0.75rem 1rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '20px',
                              fontSize: '0.875rem',
                              outline: 'none',
                              backgroundColor: '#f9fafb'
                            }}
                          />
                        </div>
                        <button
                          onClick={handleReply}
                          disabled={isReplying || !replyText.trim()}
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: replyText.trim() ? '#E4405F' : '#d1d5db',
                            color: 'white',
                            border: 'none',
                            cursor: replyText.trim() ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem',
                            transition: 'background-color 0.2s'
                          }}
                        >
                          {isReplying ? '...' : '📤'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ 
                      padding: '2rem', 
                      textAlign: 'center', 
                      color: '#9ca3af',
                      fontSize: '0.875rem',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#6b7280' }}>
                        Select a conversation
                      </h3>
                      <p>Choose a conversation from the conversations panel to start messaging</p>
                      {!isWaiting && !hasReceivedCall && (
                        <button
                          onClick={handleActivate}
                          disabled={isLoading}
                          style={{
                            backgroundColor: isLoading ? '#9ca3af' : '#E4405F',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            marginTop: '1rem'
                          }}
                        >
                          {isLoading ? 'Activating...' : '🚀 Start Webhook'}
                        </button>
                      )}
                    </div>
                  ) : currentMessages.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: '#9ca3af', 
                      padding: '2rem',
                      fontSize: '0.875rem'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👈</div>
                      <p>No messages in this conversation yet.</p>
                    </div>
                  ) : (
                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                              backgroundColor: isOutgoing ? '#E4405F' : '#f9fafb',
                              color: isOutgoing ? 'white' : '#374151',
                              borderRadius: isOutgoing ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                              padding: '0.75rem 1rem',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                              border: isOutgoing ? 'none' : '1px solid #e5e7eb'
                            }}>
                              <div style={{ 
                                fontSize: '0.875rem',
                                lineHeight: '1.4',
                                wordWrap: 'break-word'
                              }}>
                                {message.text || (isOutgoing ? 'Message sent' : 'No text content')}
                              </div>
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

                {/* Reply Input Bar */}
                {selectedUserId && (
                  <div style={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px',
                    padding: '1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-end'
                  }}>
                    <div style={{ flex: 1 }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your message..."
                        style={{
                          width: '100%',
                          minHeight: '40px',
                          maxHeight: '120px',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          resize: 'none',
                          outline: 'none',
                          fontFamily: 'inherit',
                          lineHeight: '1.4'
                        }}
                        disabled={isReplying}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (replyText.trim() && !isReplying) {
                              handleReply();
                            }
                          }
                        }}
                      />
                    </div>
                    <button
                      onClick={handleReply}
                      disabled={isReplying || !replyText.trim()}
                      style={{
                        backgroundColor: isReplying || !replyText.trim() ? '#9ca3af' : '#E4405F',
                        color: 'white',
                        padding: '0.75rem',
                        border: 'none',
                        borderRadius: '50%',
                        fontSize: '1rem',
                        cursor: isReplying || !replyText.trim() ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        minWidth: '40px'
                      }}
                      title="Send message"
                    >
                      {isReplying ? '⏳' : '📤'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR - Analytics & User Info */}
          <div style={{ 
            width: '300px',
            backgroundColor: '#f8fafc', 
            borderRadius: '8px 0 0 8px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            right: '0',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            transform: isRightSidebarCollapsed ? 'translateX(320px)' : 'translateX(0)',
            opacity: isRightSidebarCollapsed ? 0 : 1,
            zIndex: 1000
          }}>
            {/* Right Sidebar Header */}
            <div style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '1rem 1.5rem',
              borderRadius: '8px 8px 0 0'
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center' }}>
                📊 Analytics & Info
              </h2>
            </div>
            
            {/* Right Sidebar Content */}
            <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
              
              {/* Selected User Info Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                  🎯 Selected User
                </h3>
                
                {selectedUserId ? (
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#E4405F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '1rem',
                        fontSize: '1.5rem',
                        color: 'white',
                        fontWeight: 'bold',
                        backgroundImage: users[selectedUserId]?.profile_picture_url ? `url(${users[selectedUserId].profile_picture_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}>
                        {!users[selectedUserId]?.profile_picture_url && (users[selectedUserId]?.name?.charAt(0).toUpperCase() || 'U')}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: '#111827' }}>
                          {users[selectedUserId]?.name || 'Instagram User'}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          @{users[selectedUserId]?.username || `user_${selectedUserId.slice(0, 8)}`}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>User ID</div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                          {selectedUserId.substring(0, 15)}...
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Messages</div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.75rem' }}>
                          {currentMessages.length}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Status</div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.75rem' }}>
                          {isWaiting ? 'Online' : 'Offline'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>AI Status</div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: userAIStatus[selectedUserId] !== false ? '#15803d' : '#dc2626',
                          fontSize: '0.75rem'
                        }}>
                          {userAIStatus[selectedUserId] !== false ? '🤖 Active' : '🚫 Inactive'}
                        </div>
                      </div>
                    </div>
                    
                    {/* AI Toggle Button for Selected User */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                      <button
                        onClick={() => toggleUserAI(selectedUserId)}
                        disabled={isTogglingAI || !selectedUserId}
                        style={{
                          width: '100%',
                          backgroundColor: isTogglingAI ? '#9ca3af' : 
                            (userAIStatus[selectedUserId] !== false ? '#dc2626' : '#10b981'),
                          color: 'white',
                          padding: '0.75rem 1rem',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: isTogglingAI || !selectedUserId ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {isTogglingAI ? (
                          <>⏳ Updating...</>
                        ) : userAIStatus[selectedUserId] !== false ? (
                          <>🚫 Deactivate AI for this user</>
                        ) : (
                          <>🤖 Activate AI for this user</>
                        )}
                      </button>
                      <p style={{ 
                        fontSize: '0.75rem', 
                        color: '#6b7280', 
                        textAlign: 'center', 
                        marginTop: '0.5rem',
                        margin: '0.5rem 0 0 0'
                      }}>
                        {userAIStatus[selectedUserId] !== false 
                          ? 'AI will automatically respond to this user\'s messages'
                          : 'AI responses are disabled for this user'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    backgroundColor: '#f9fafb', 
                    padding: '2rem', 
                    borderRadius: '8px', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
                    <p>Select a user from conversations to view details</p>
                  </div>
                )}
              </div>
              
              {/* Statistics Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                  📊 Statistics
                </h3>
                
                <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Total Conversations</span>
                      <span style={{ fontWeight: '600', color: '#111827', backgroundColor: '#fef2f2', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {conversations.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Total Messages</span>
                      <span style={{ fontWeight: '600', color: '#111827', backgroundColor: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {messages.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Webhook Status</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: isWaiting ? '#15803d' : '#dc2626', 
                        backgroundColor: isWaiting ? '#dcfce7' : '#fee2e2', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {isWaiting ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>AI Status</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: aiConfig.enabled ? '#15803d' : '#dc2626', 
                        backgroundColor: aiConfig.enabled ? '#dcfce7' : '#fee2e2', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {aiConfig.enabled ? '🤖 Enabled' : '🚫 Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions Section */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                  ⚡ Quick Actions
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    onClick={() => setSelectedUserId(null)}
                    disabled={!selectedUserId}
                    style={{
                      backgroundColor: !selectedUserId ? '#9ca3af' : '#6b7280',
                      color: 'white',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !selectedUserId ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    ❌ Clear Selection
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      backgroundColor: '#E4405F',
                      color: 'white',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    🔄 Refresh Page
                  </button>
                  
                  <button
                    onClick={() => window.open('https://business.instagram.com/', '_blank')}
                    style={{
                      backgroundColor: '#8B5CF6',
                      color: 'white',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    🔗 Open Instagram Business
                  </button>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* AI Settings Modal */}
      <InstagramAISettings
        isVisible={showAISettings}
        onClose={() => {
          setShowAISettings(false);
          loadAIConfig(); // Reload config after closing settings
        }}
      />

    </div>
  );
};

export default SimpleInstagramWebhook;