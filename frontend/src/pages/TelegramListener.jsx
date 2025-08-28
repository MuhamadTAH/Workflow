import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const TelegramListener = () => {
  const [botToken, setBotToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [listenerId, setListenerId] = useState('');
  const [messages, setMessages] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sendMessage, setSendMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Claude API states
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [claudeStatus, setClaudeStatus] = useState('');
  const [claudeConnectionStatus, setClaudeConnectionStatus] = useState('disconnected');
  const [isClaudeLoading, setIsClaudeLoading] = useState(false);

  const handleSetupWebhook = async () => {
    if (!botToken.trim()) {
      setStatus('❌ Please enter a bot token');
      return;
    }

    setIsLoading(true);
    setStatus('🔧 Setting up webhook...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          botToken: botToken.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus(`✅ Webhook setup successful!`);
        setWebhookUrl(result.webhookUrl);
        setListenerId(result.listenerId);
        setIsPolling(true);
        console.log('Webhook setup result:', result);
      } else {
        setStatus(`❌ Setup failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Webhook setup error:', error);
      setStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!botToken.trim()) {
      setStatus('❌ Please enter a bot token');
      return;
    }

    setIsLoading(true);
    setStatus('🗑️ Removing webhook...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          botToken: botToken.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('✅ Webhook deleted successfully!');
        setWebhookUrl('');
        setListenerId('');
        setIsPolling(false);
        setMessages([]);
        setSelectedUser(null);
      } else {
        setStatus(`❌ Delete failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Webhook delete error:', error);
      setStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for the current listener
  const fetchMessages = async () => {
    if (!listenerId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/messages/${listenerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.messages) {
          setMessages(result.messages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Polling for new messages
  useEffect(() => {
    let interval;
    
    if (isPolling && listenerId) {
      // Initial fetch
      fetchMessages();
      
      // Set up polling every 2 seconds
      interval = setInterval(fetchMessages, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPolling, listenerId]);

  // Check Claude connection status on mount
  useEffect(() => {
    checkClaudeConnectionStatus();
  }, []);

  const checkClaudeConnectionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setClaudeConnectionStatus(result.connected ? 'connected' : 'disconnected');
        if (result.connected) {
          setClaudeStatus('✅ Claude API is connected and ready');
        }
      }
    } catch (error) {
      console.error('Error checking Claude status:', error);
      setClaudeConnectionStatus('disconnected');
    }
  };

  const handleClaudeConnect = async () => {
    if (!claudeApiKey.trim()) {
      setClaudeStatus('❌ Please enter your Claude API key');
      return;
    }

    setIsClaudeLoading(true);
    setClaudeStatus('🔗 Connecting to Claude API...');

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
        setClaudeStatus('✅ Successfully connected to Claude API!');
        setClaudeConnectionStatus('connected');
        setClaudeApiKey(''); // Clear for security
      } else {
        setClaudeStatus(`❌ Connection failed: ${result.error || 'Unknown error'}`);
        setClaudeConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Claude API connection error:', error);
      setClaudeStatus(`❌ Network error: ${error.message}`);
      setClaudeConnectionStatus('disconnected');
    } finally {
      setIsClaudeLoading(false);
    }
  };

  const handleClaudeDisconnect = async () => {
    setIsClaudeLoading(true);
    setClaudeStatus('🔌 Disconnecting from Claude API...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setClaudeStatus('✅ Successfully disconnected from Claude API');
        setClaudeConnectionStatus('disconnected');
        setClaudeApiKey('');
      } else {
        setClaudeStatus(`❌ Disconnect failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Claude API disconnect error:', error);
      setClaudeStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsClaudeLoading(false);
    }
  };

  // Get unique users from messages (exclude bot messages)
  const getUniqueUsers = () => {
    const usersMap = new Map();
    
    messages.forEach(message => {
      // Skip bot messages - don't show bot as a user
      if (message.isBotMessage || message.fromUserId === 'bot') {
        return;
      }
      
      const userId = message.fromUserId;
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          userId: userId,
          chatId: message.chatId,
          fromName: message.fromName,
          fromUsername: message.fromUsername,
          lastMessage: message.text,
          lastMessageTime: message.date,
          messageCount: 1
        });
      } else {
        // Update message count and last message (only for user messages)
        const user = usersMap.get(userId);
        user.messageCount++;
        if (message.date > user.lastMessageTime) {
          user.lastMessage = message.text;
          user.lastMessageTime = message.date;
        }
      }
    });
    
    return Array.from(usersMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
  };

  // Get messages for selected user (include both user messages and bot replies to that user)
  const getMessagesForUser = (userId) => {
    if (!selectedUser) return [];
    
    return messages.filter(message => 
      message.fromUserId === userId || 
      (message.isBotMessage && String(message.chatId) === String(selectedUser.chatId))
    ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort chronologically (oldest first)
  };

  const uniqueUsers = getUniqueUsers();
  const selectedUserMessages = selectedUser ? getMessagesForUser(selectedUser.userId) : [];

  // Handle sending message
  const handleSendMessage = async () => {
    if (!selectedUser || !sendMessage.trim() || !botToken.trim()) {
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          botToken: botToken,
          chatId: selectedUser.chatId,
          text: sendMessage
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSendMessage(''); // Clear the input
        // Refresh messages immediately to show the sent message
        fetchMessages();
      } else {
        alert(`❌ Failed to send message: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert(`❌ Network error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '60rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', padding: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '1.5rem' }}>
            <i className="fab fa-telegram" style={{ color: '#0088cc', marginRight: '0.5rem' }}></i>
            Telegram Bot Listener
          </h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Token Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Bot Token
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Enter your Telegram bot token (e.g., 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '1rem',
                  outline: 'none',
                  opacity: isLoading ? '0.5' : '1'
                }}
                disabled={isLoading}
              />
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Get your bot token from @BotFather on Telegram
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSetupWebhook}
                disabled={isLoading || !botToken.trim()}
                style={{ 
                  flex: '1',
                  backgroundColor: isLoading || !botToken.trim() ? '#9ca3af' : '#2563eb', 
                  color: 'white', 
                  padding: '0.75rem 1rem', 
                  border: 'none',
                  borderRadius: '6px', 
                  cursor: isLoading || !botToken.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {isLoading ? '⏳ Setting up...' : '🚀 Setup Webhook'}
              </button>
              
              <button
                onClick={handleDeleteWebhook}
                disabled={isLoading || !botToken.trim()}
                style={{ 
                  flex: '1',
                  backgroundColor: isLoading || !botToken.trim() ? '#9ca3af' : '#dc2626', 
                  color: 'white', 
                  padding: '0.75rem 1rem', 
                  border: 'none',
                  borderRadius: '6px', 
                  cursor: isLoading || !botToken.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {isLoading ? '⏳ Deleting...' : '🗑️ Delete Webhook'}
              </button>
            </div>

            {/* Status */}
            {status && (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '6px', 
                backgroundColor: status.includes('✅') ? '#f0fdf4' : status.includes('❌') ? '#fef2f2' : '#eff6ff',
                color: status.includes('✅') ? '#15803d' : status.includes('❌') ? '#dc2626' : '#1d4ed8'
              }}>
                {status}
              </div>
            )}

            {/* Webhook URL Display */}
            {webhookUrl && (
              <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '6px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Webhook URL
                </label>
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
              </div>
            )}

            {/* Instructions */}
            <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '6px' }}>
              <h3 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '0.5rem' }}>📋 Instructions:</h3>
              <ol style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#1e40af', lineHeight: '1.5' }}>
                <li>Get a bot token from @BotFather on Telegram</li>
                <li>Paste the token above and click "Setup Webhook"</li>
                <li>Send messages to your bot - they'll appear in the conversations panel below</li>
                <li>Messages are updated automatically every 2 seconds</li>
              </ol>
            </div>

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
                backgroundColor: claudeConnectionStatus === 'connected' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${claudeConnectionStatus === 'connected' ? '#bbf7d0' : '#fecaca'}`,
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: claudeConnectionStatus === 'connected' ? '#10b981' : '#ef4444',
                    marginRight: '0.75rem'
                  }}></div>
                  <span style={{
                    fontWeight: '500',
                    color: claudeConnectionStatus === 'connected' ? '#065f46' : '#991b1b'
                  }}>
                    {claudeConnectionStatus === 'connected' ? 'Connected to Claude API' : 'Not Connected'}
                  </span>
                </div>
              </div>

              {/* Claude API Key Input */}
              {claudeConnectionStatus === 'disconnected' && (
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
                      opacity: isClaudeLoading ? '0.5' : '1'
                    }}
                    disabled={isClaudeLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isClaudeLoading) {
                        handleClaudeConnect();
                      }
                    }}
                  />
                  <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Anthropic Console</a>
                  </p>
                </div>
              )}

              {/* Claude Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {claudeConnectionStatus === 'disconnected' ? (
                  <button
                    onClick={handleClaudeConnect}
                    disabled={isClaudeLoading || !claudeApiKey.trim()}
                    style={{
                      flex: '1',
                      backgroundColor: isClaudeLoading || !claudeApiKey.trim() ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isClaudeLoading || !claudeApiKey.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {isClaudeLoading ? '⏳ Connecting...' : '🔗 Connect to Claude'}
                  </button>
                ) : (
                  <button
                    onClick={handleClaudeDisconnect}
                    disabled={isClaudeLoading}
                    style={{
                      flex: '1',
                      backgroundColor: isClaudeLoading ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isClaudeLoading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {isClaudeLoading ? '⏳ Disconnecting...' : '🔌 Disconnect'}
                  </button>
                )}
              </div>

              {/* Claude Status Message */}
              {claudeStatus && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '6px',
                  backgroundColor: claudeStatus.includes('✅') ? '#f0fdf4' : claudeStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
                  color: claudeStatus.includes('✅') ? '#15803d' : claudeStatus.includes('❌') ? '#dc2626' : '#1d4ed8',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  {claudeStatus}
                </div>
              )}

              {/* Claude Instructions */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '1rem',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                <h4 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '0.5rem', margin: 0 }}>
                  🔧 Claude AI Integration:
                </h4>
                <p style={{ color: '#1e40af', lineHeight: '1.5', margin: '0.5rem 0 0 0' }}>
                  Connect Claude AI to enable intelligent auto-responses to your Telegram messages. 
                  Once connected, you can process messages with AI assistance and generate automated replies.
                </p>
              </div>
            </div>

            {/* Two Panel Layout */}
            {isPolling && (
              <div style={{ display: 'flex', gap: '1rem', height: '500px' }}>
                
                {/* Users Panel */}
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
                      👥 Users
                      {isPolling && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: '#10b981',
                          backgroundColor: '#d1fae5',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          🟢 Live
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {uniqueUsers.length} user{uniqueUsers.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: 'white', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {uniqueUsers.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
                        <p>No users yet. Send a message to your bot!</p>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem' }}>
                        {uniqueUsers.map((user, index) => (
                          <div
                            key={user.userId}
                            onClick={() => setSelectedUser(user)}
                            style={{
                              padding: '0.75rem',
                              marginBottom: '0.5rem',
                              backgroundColor: selectedUser?.userId === user.userId ? '#eff6ff' : '#f9fafb',
                              borderRadius: '6px',
                              border: selectedUser?.userId === user.userId ? '2px solid #3b82f6' : '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '0.75rem',
                                fontSize: '1rem',
                                color: 'white',
                                fontWeight: 'bold'
                              }}>
                                {user.fromName ? user.fromName[0].toUpperCase() : 'U'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#111827' }}>
                                  {user.fromName || 'Unknown User'}
                                  {user.fromUsername && (
                                    <span style={{ color: '#6b7280', fontWeight: 'normal', fontSize: '0.75rem' }}>
                                      {' '}@{user.fromUsername}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                  {user.messageCount} message{user.messageCount !== 1 ? 's' : ''}
                                </div>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#9ca3af',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {user.lastMessage || 'No text'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Panel */}
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
                      💬 Messages
                      {selectedUser && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: '#3b82f6',
                          backgroundColor: '#eff6ff',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {selectedUser.fromName}
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {selectedUser ? selectedUserMessages.length : 0} message{(selectedUser ? selectedUserMessages.length : 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Messages Area */}
                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: 'white', 
                    borderRadius: '4px 4px 0 0',
                    border: '1px solid #e5e7eb',
                    borderBottom: 'none'
                  }}>
                    {!selectedUser ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👈</div>
                        <p>Select a user to view their messages</p>
                      </div>
                    ) : selectedUserMessages.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                        <p>No messages from this user yet</p>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedUserMessages.map((message, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              justifyContent: message.isBotMessage ? 'flex-start' : 'flex-end',
                              marginBottom: '0.25rem'
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '75%',
                                padding: '0.75rem 1rem',
                                borderRadius: message.isBotMessage ? '1rem 1rem 1rem 0.25rem' : '1rem 1rem 0.25rem 1rem',
                                backgroundColor: message.isBotMessage ? '#3b82f6' : '#e5e7eb',
                                color: message.isBotMessage ? 'white' : '#111827',
                                wordWrap: 'break-word',
                                position: 'relative'
                              }}
                            >
                              <div style={{
                                fontSize: '0.875rem',
                                lineHeight: '1.4'
                              }}>
                                {message.text || '<No text>'}
                              </div>
                              <div style={{ 
                                fontSize: '0.65rem', 
                                opacity: 0.7,
                                marginTop: '0.25rem',
                                textAlign: message.isBotMessage ? 'left' : 'right'
                              }}>
                                {new Date(message.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Input Bar */}
                  {selectedUser && (
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
                          value={sendMessage}
                          onChange={(e) => setSendMessage(e.target.value)}
                          placeholder={`Type a message to ${selectedUser.fromName}...`}
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
                          disabled={isSending}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (sendMessage.trim() && !isSending) {
                                handleSendMessage();
                              }
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={isSending || !sendMessage.trim()}
                        style={{
                          backgroundColor: isSending || !sendMessage.trim() ? '#9ca3af' : '#3b82f6',
                          color: 'white',
                          padding: '0.75rem',
                          border: 'none',
                          borderRadius: '50%',
                          fontSize: '1rem',
                          cursor: isSending || !sendMessage.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          minWidth: '40px'
                        }}
                        title="Send message"
                      >
                        {isSending ? '⏳' : '📤'}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramListener;