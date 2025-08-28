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

  // Get unique users from messages
  const getUniqueUsers = () => {
    const usersMap = new Map();
    
    messages.forEach(message => {
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
        // Update message count and last message
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

  // Get messages for selected user
  const getMessagesForUser = (userId) => {
    return messages.filter(message => message.fromUserId === userId);
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
        // Refresh messages to show the sent message
        setTimeout(() => {
          fetchMessages();
        }, 1000);
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
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
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

            {/* Three Panel Layout */}
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

                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: 'white', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
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
                      <div style={{ padding: '0.5rem' }}>
                        {selectedUserMessages.map((message, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '0.75rem',
                              marginBottom: '0.5rem',
                              backgroundColor: '#f0f9ff',
                              borderRadius: '6px',
                              border: '1px solid #e0f2fe',
                              marginLeft: '1rem'
                            }}
                          >
                            <div style={{ fontSize: '0.75rem', color: '#0369a1', marginBottom: '0.5rem' }}>
                              {new Date(message.date).toLocaleString()}
                            </div>
                            <div style={{
                              fontSize: '0.875rem',
                              color: '#374151',
                              wordWrap: 'break-word',
                              lineHeight: '1.4'
                            }}>
                              {message.text || '<No text>'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Send Message Panel */}
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
                      📤 Send Message
                      {selectedUser && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: '#059669',
                          backgroundColor: '#d1fae5',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          to {selectedUser.fromName}
                        </span>
                      )}
                    </h3>
                  </div>

                  <div style={{ 
                    flex: 1,
                    backgroundColor: 'white', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '1rem'
                  }}>
                    {!selectedUser ? (
                      <div style={{ 
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👈</div>
                          <p>Select a user to send them a message</p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Bot Token Display */}
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                            Bot Token (Auto-filled)
                          </label>
                          <div style={{
                            padding: '0.5rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all'
                          }}>
                            {botToken ? `${botToken.substring(0, 15)}...` : 'No token'}
                          </div>
                        </div>

                        {/* Chat ID Display */}
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                            Chat ID (Auto-filled)
                          </label>
                          <div style={{
                            padding: '0.5rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontFamily: 'monospace'
                          }}>
                            {selectedUser.chatId}
                          </div>
                        </div>

                        {/* Message Input */}
                        <div style={{ marginBottom: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                            Message Text
                          </label>
                          <textarea
                            value={sendMessage}
                            onChange={(e) => setSendMessage(e.target.value)}
                            placeholder="Type your message here..."
                            style={{
                              flex: 1,
                              minHeight: '100px',
                              padding: '0.75rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              resize: 'vertical',
                              outline: 'none',
                              fontFamily: 'inherit'
                            }}
                            disabled={isSending}
                          />
                        </div>

                        {/* Send Button */}
                        <button
                          onClick={handleSendMessage}
                          disabled={isSending || !sendMessage.trim()}
                          style={{
                            backgroundColor: isSending || !sendMessage.trim() ? '#9ca3af' : '#059669',
                            color: 'white',
                            padding: '0.75rem 1rem',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: isSending || !sendMessage.trim() ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          {isSending ? (
                            <>
                              <span>⏳</span>
                              Sending...
                            </>
                          ) : (
                            <>
                              <span>📤</span>
                              Send Message
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
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