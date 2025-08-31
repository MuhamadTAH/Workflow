import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const InstagramCommentManager = () => {
  // Instagram API Configuration State
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [instagramBusinessId, setInstagramBusinessId] = useState('');
  const [webhookToken, setWebhookToken] = useState('muhammad');
  
  // UI State
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  
  // Message Management State
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  
  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  // Initialize component
  useEffect(() => {
    setWebhookUrl(`${API_BASE_URL}/api/webhooks/instagram/comments`);
    
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      const mockToken = `MOCK_TOKEN_FOR_TESTING_${Date.now()}`;
      localStorage.setItem('token', mockToken);
    }
    
    checkBackendStatus();
  }, []);

  // Poll for new comments when active
  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/instagram-comments/comments`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setMessages(data.messages || []);
          }
        } catch (error) {
          console.error('Error fetching comments:', error);
        }
      }, 3000); // Poll every 3 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status && data.status.isActive) {
          setIsActive(true);
        }
      }
    } catch (error) {
      console.error('Error checking backend status:', error);
    }
  };

  const handleActivate = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsActive(true);
        console.log('✅ Started waiting for webhook call from Meta');
      } else {
        setError(data.error || 'Failed to start waiting for webhook');
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
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsActive(false);
        console.log('Instagram comment manager deactivated successfully');
      } else {
        setError(data.error || 'Failed to deactivate Instagram comment manager');
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

  const handleReplyToComment = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    setIsReplying(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          senderId: selectedMessage.sender?.id,
          replyText: replyText.trim()
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setReplyText('');
        // Refresh comments to show the reply
        setTimeout(() => {
          // Poll will automatically refresh
        }, 1000);
      } else {
        setError(data.error || 'Failed to reply to comment');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
    } finally {
      setIsReplying(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '0 1rem' }}>
        {/* Fixed Toggle Buttons */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            left: isSidebarCollapsed ? '20px' : '400px',
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
          {isSidebarCollapsed ? '☰' : '✕'}
        </button>
        
        <button
          onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            right: isRightSidebarCollapsed ? '20px' : '300px',
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
            Instagram Comment Manager
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative' }}>
          
          {/* LEFT SIDEBAR - Configuration Panel */}
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
            transform: isSidebarCollapsed ? 'translateX(-420px)' : 'translateX(0)',
            opacity: isSidebarCollapsed ? 0 : 1,
            zIndex: 1000
          }}>
              {/* Sidebar Header */}
              <div style={{ 
                backgroundColor: '#E4405F', 
                color: 'white', 
                padding: '1rem 1.5rem',
                borderRadius: '8px 8px 0 0'
              }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center' }}>
                  📷 Instagram Configuration
                </h2>
              </div>
              
              {/* Sidebar Content */}
              <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
                
                {/* Instagram API Configuration Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                    📷 Instagram API Setup
                  </h3>
                  
                  {/* Webhook URL */}
                  <div style={{ marginBottom: '1rem' }}>
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
                        fontSize: '0.75rem', 
                        wordBreak: 'break-all',
                        fontFamily: 'monospace'
                      }}>
                        {webhookUrl}
                      </code>
                      <button 
                        onClick={copyWebhookUrl}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#E4405F',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      Use this URL as your webhook endpoint in Meta Developer Console
                    </p>
                  </div>

                  {/* Configuration Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Instagram App ID
                      </label>
                      <input
                        type="text"
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                        placeholder="123456789012345"
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        Get from Meta Developer Console → Your App → App ID
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        App Secret
                      </label>
                      <input
                        type="password"
                        value={appSecret}
                        onChange={(e) => setAppSecret(e.target.value)}
                        placeholder="abcd1234efgh5678..."
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        From Meta Developer Console → Your App → App Secret
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Access Token
                      </label>
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="IGQVJxxxxxxxx..."
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        Long-lived user access token from Graph API Explorer
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Instagram Business Account ID
                      </label>
                      <input
                        type="text"
                        value={instagramBusinessId}
                        onChange={(e) => setInstagramBusinessId(e.target.value)}
                        placeholder="17841401441775531"
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        Your Instagram Business Account ID
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Webhook Verification Token
                      </label>
                      <input
                        type="text"
                        value={webhookToken}
                        onChange={(e) => setWebhookToken(e.target.value)}
                        placeholder="custom_verification_token"
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        Custom token for webhook verification
                      </p>
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div style={{ 
                      padding: '1rem', 
                      borderRadius: '6px', 
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      marginTop: '1rem',
                      border: '1px solid #fecaca'
                    }}>
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    {!isActive ? (
                      <button
                        onClick={handleActivate}
                        disabled={isLoading || !appId.trim() || !appSecret.trim() || !accessToken.trim() || !instagramBusinessId.trim() || !webhookToken.trim()}
                        style={{ 
                          flex: '1',
                          backgroundColor: isLoading || !appId.trim() || !appSecret.trim() || !accessToken.trim() || !instagramBusinessId.trim() || !webhookToken.trim() ? '#9ca3af' : '#E4405F', 
                          color: 'white', 
                          padding: '0.75rem 1rem', 
                          border: 'none',
                          borderRadius: '6px', 
                          cursor: isLoading || !appId.trim() || !appSecret.trim() || !accessToken.trim() || !instagramBusinessId.trim() || !webhookToken.trim() ? 'not-allowed' : 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        {isLoading ? '⏳ Setting up...' : '🚀 Start Instagram Integration'}
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
                      color: '#15803d',
                      marginTop: '1rem'
                    }}>
                      ✅ Instagram comment manager is active and monitoring comments
                    </div>
                  )}

                  {/* Instructions */}
                  <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '6px', marginTop: '1rem' }}>
                    <h4 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>📋 Setup Instructions:</h4>
                    <ol style={{ paddingLeft: '1.5rem', fontSize: '0.75rem', color: '#1e40af', lineHeight: '1.4' }}>
                      <li>Create Instagram App in Meta Developer Console</li>
                      <li>Get Instagram Basic Display permissions</li>
                      <li>Generate long-lived access token</li>
                      <li>Set webhook URL in your app settings</li>
                      <li>Fill all fields above and click "Start Integration"</li>
                    </ol>
                  </div>
                </div>
                
              </div>
            </div>
          
          {/* MIDDLE COLUMN - Placeholder for Comment Interface */}
          <div style={{ 
            flex: '1',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            minWidth: '500px',
            marginLeft: isSidebarCollapsed ? '0' : '400px',
            marginRight: isRightSidebarCollapsed ? '0' : '300px',
            transition: 'margin-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), margin-right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}>

            {/* Instagram Status Warning */}
            <div style={{
              opacity: isActive ? 1 : 0.6
            }}>
              {!isActive && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: '1px solid #fecaca'
                }}>
                  <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>
                    ⚠️ Configure and activate Instagram API integration to start managing comments
                  </p>
                </div>
              )}
              
              {/* Comment Management Interface */}
              <div style={{ display: 'flex', gap: '1rem', height: '500px' }}>
                
                {/* Comments List Panel */}
                <div style={{ 
                  flex: '0 0 300px', 
                  backgroundColor: '#f8fafc', 
                  padding: '1rem', 
                  borderRadius: '6px', 
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>
                      💬 Comments
                      {isActive && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: '#E4405F',
                          backgroundColor: '#fef2f2',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          🔴 Live
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {messages.length} message{messages.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: 'white', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {messages.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📷</div>
                        <p>No messages yet. Messages will appear here when users send you Instagram DMs</p>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem' }}>
                        {messages.map((message, index) => (
                          <div
                            key={message.id || index}
                            onClick={() => setSelectedMessage(message)}
                            style={{
                              padding: '0.75rem',
                              marginBottom: '0.5rem',
                              backgroundColor: selectedMessage?.id === message.id ? '#fef2f2' : '#f9fafb',
                              borderRadius: '6px',
                              border: selectedMessage?.id === message.id ? '2px solid #E4405F' : '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#E4405F',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '0.75rem',
                                fontSize: '1rem',
                                color: 'white',
                                fontWeight: 'bold'
                              }}>
                                {message.sender?.id ? message.sender.id.substring(0,1).toUpperCase() : '👤'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#111827' }}>
                                  {message.sender?.id || 'Anonymous User'}
                                </div>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#9ca3af',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {message.text || 'No text content'}
                                </div>
                                <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                  {formatTimestamp(message.timestamp)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Comment Details & Reply Panel */}
                <div style={{ 
                  flex: '1', 
                  backgroundColor: '#f8fafc', 
                  padding: '1rem', 
                  borderRadius: '6px', 
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>
                      📱 Comment Details
                      {selectedMessage && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: '#E4405F',
                          backgroundColor: '#fef2f2',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          Selected
                        </span>
                      )}
                    </h3>
                  </div>

                  {/* Comment Content Area */}
                  <div style={{ 
                    flex: 1,
                    backgroundColor: 'white', 
                    borderRadius: '4px 4px 0 0',
                    border: '1px solid #e5e7eb',
                    borderBottom: 'none'
                  }}>
                    {!selectedMessage ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👈</div>
                        <p>Select a comment to view details and reply</p>
                      </div>
                    ) : (
                      <div style={{ padding: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
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
                              fontWeight: 'bold'
                            }}>
                              {selectedMessage.sender?.id ? selectedMessage.sender.id.substring(0,1).toUpperCase() : '👤'}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '1rem', color: '#111827' }}>
                                {selectedMessage.sender?.id || 'Anonymous User'}
                              </div>
                              <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                {selectedMessage.sender?.id || 'No ID'}
                              </div>
                            </div>
                          </div>
                          
                          <div style={{
                            backgroundColor: '#f9fafb',
                            padding: '1rem',
                            borderRadius: '8px',
                            marginBottom: '1rem'
                          }}>
                            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.4' }}>
                              {selectedMessage.text || 'No text content'}
                            </p>
                          </div>
                          
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            <strong>Posted:</strong> {formatTimestamp(selectedMessage.timestamp)}
                          </div>
                          {selectedMessage.media_id && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                              <strong>Media ID:</strong> {selectedMessage.media_id}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reply Input Bar */}
                  {selectedMessage && (
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
                          placeholder={`Reply to ${selectedMessage.sender?.id || 'this user'}...`}
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
                                handleReplyToComment();
                              }
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={handleReplyToComment}
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
                        title="Reply to comment"
                      >
                        {isReplying ? '⏳' : '📤'}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
          
          {/* RIGHT SIDEBAR - Placeholder for Analytics */}
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
              
              {/* Selected Comment Info Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                  🎯 Selected Comment
                </h3>
                
                {selectedMessage ? (
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
                        fontWeight: 'bold'
                      }}>
                        {selectedMessage.sender?.id ? selectedMessage.from.username[0].toUpperCase() : '👤'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: '#111827' }}>
                          {selectedMessage.sender?.id || 'Anonymous User'}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          Instagram User
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Comment ID</div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                          {selectedMessage.id || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Media ID</div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                          {selectedMessage.media_id || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Timestamp</div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.75rem' }}>
                          {formatTimestamp(selectedMessage.timestamp)}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Status</div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.75rem' }}>
                          New
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ color: '#6b7280', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Comment Text</div>
                      <div style={{ 
                        backgroundColor: '#f9fafb', 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        fontSize: '0.875rem',
                        color: '#374151',
                        fontStyle: selectedMessage.text ? 'normal' : 'italic'
                      }}>
                        {selectedMessage.text || 'No text content'}
                      </div>
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
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
                    <p>Select a comment from the list to view detailed information</p>
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
                      <span style={{ color: '#6b7280' }}>Total Comments</span>
                      <span style={{ fontWeight: '600', color: '#111827', backgroundColor: '#fef2f2', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {messages.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>New Comments</span>
                      <span style={{ fontWeight: '600', color: '#111827', backgroundColor: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {messages.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Instagram Status</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: isActive ? '#15803d' : '#dc2626', 
                        backgroundColor: isActive ? '#dcfce7' : '#fee2e2', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {isActive ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Webhook Status</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: isActive ? '#15803d' : '#dc2626', 
                        backgroundColor: isActive ? '#dcfce7' : '#fee2e2', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {isActive ? '🟢 Connected' : '🔴 Disconnected'}
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
                    onClick={() => setComments([])}
                    disabled={messages.length === 0}
                    style={{
                      backgroundColor: messages.length === 0 ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    🗑️ Clear All Comments
                  </button>
                  
                  <button
                    onClick={() => setSelectedComment(null)}
                    disabled={!selectedMessage}
                    style={{
                      backgroundColor: !selectedMessage ? '#9ca3af' : '#6b7280',
                      color: 'white',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !selectedMessage ? 'not-allowed' : 'pointer',
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

        {/* Status indicator for Instagram system */}
        {!isActive && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: isRightSidebarCollapsed ? '80px' : '320px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#991b1b',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            transition: 'right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}>
            ⚠️ Instagram system is inactive. Configure API settings to start monitoring comments.
          </div>
        )}

      </div>
    </div>
  );
};

export default InstagramCommentManager;