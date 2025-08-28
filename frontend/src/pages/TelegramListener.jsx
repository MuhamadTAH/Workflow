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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1rem' }}>
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

            {/* Conversations Panel */}
            {isPolling && (
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>
                    💬 Conversations 
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
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ 
                  maxHeight: '400px', 
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
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💭</div>
                      <p>No messages yet. Send a message to your bot to see it here!</p>
                    </div>
                  ) : (
                    <div style={{ padding: '0.5rem' }}>
                      {messages.map((message, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '6px',
                            border: '1px solid #f3f4f6'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: '#3b82f6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '0.75rem',
                              fontSize: '0.875rem',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {message.fromName ? message.fromName[0].toUpperCase() : 'U'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#111827' }}>
                                {message.fromName || 'Unknown User'}
                                {message.fromUsername && (
                                  <span style={{ color: '#6b7280', fontWeight: 'normal' }}>
                                    {' '}@{message.fromUsername}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                Chat ID: {message.chatId} • {message.date}
                              </div>
                            </div>
                          </div>
                          <div style={{
                            marginLeft: '2.5rem',
                            padding: '0.75rem',
                            backgroundColor: 'white',
                            borderRadius: '4px',
                            fontSize: '0.875rem',
                            color: '#374151',
                            wordWrap: 'break-word'
                          }}>
                            {message.text || '<No text>'}
                          </div>
                        </div>
                      ))}
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