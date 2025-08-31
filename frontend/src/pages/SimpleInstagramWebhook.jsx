import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const SimpleInstagramWebhook = () => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [hasReceivedCall, setHasReceivedCall] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [firstCallAt, setFirstCallAt] = useState(null);
  const [messages, setMessages] = useState([]);

  const webhookUrl = `${API_BASE_URL}/api/webhooks/instagram/comments`;
  const verifyToken = 'muhammad';

  // Check status on load
  useEffect(() => {
    checkStatus();
  }, []);

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
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f9fafb', 
      padding: '2rem'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        display: 'flex',
        gap: '2rem',
        alignItems: 'flex-start'
      }}>
        
        {/* Left Panel - Webhook Setup */}
        <div style={{ 
          width: '500px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#111827',
            marginBottom: '0.5rem'
          }}>
            <span style={{ color: '#E4405F' }}>📷</span> Instagram Webhook
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem' }}>
            Simple webhook testing for Instagram integration
          </p>
        </div>

        {/* Status Display */}
        {hasReceivedCall ? (
          <div style={{
            backgroundColor: '#dcfce7',
            border: '2px solid #22c55e',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#15803d', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              🎉 SUCCESS! Webhook Received!
            </h2>
            <p style={{ color: '#166534' }}>
              Meta successfully called your webhook at {new Date(firstCallAt).toLocaleString()}
            </p>
          </div>
        ) : isWaiting ? (
          <div style={{
            backgroundColor: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '1.5rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#d97706', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              ⏳ Waiting for Meta Webhook Call...
            </h2>
            <p style={{ color: '#92400e' }}>
              Add the URL and token below to your Meta Developer Console
            </p>
          </div>
        ) : null}

        {/* Webhook Information */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            Webhook Configuration
          </h3>
          
          {/* Webhook URL */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '0.5rem' 
            }}>
              Webhook URL:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <code style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                {webhookUrl}
              </code>
              <button
                onClick={() => copyToClipboard(webhookUrl)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>

          {/* Verify Token */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '0.5rem' 
            }}>
              Verify Token:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <code style={{
                flex: 1,
                padding: '0.75rem',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}>
                {verifyToken}
              </code>
              <button
                onClick={() => copyToClipboard(verifyToken)}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                📋 Copy
              </button>
            </div>
          </div>
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

        {/* Action Button */}
        <div style={{ textAlign: 'center' }}>
          {!isWaiting && !hasReceivedCall && (
            <button
              onClick={handleActivate}
              disabled={isLoading}
              style={{
                backgroundColor: isLoading ? '#9ca3af' : '#E4405F',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) e.target.style.backgroundColor = '#C13584';
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.target.style.backgroundColor = '#E4405F';
              }}
            >
              {isLoading ? 'Activating...' : '🚀 Start Waiting for Webhook'}
            </button>
          )}
        </div>

        {/* Instructions */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          backgroundColor: '#f8fafc', 
          borderRadius: '6px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
            Next Steps:
          </h4>
          <ol style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0', paddingLeft: '1rem' }}>
            <li>Click "Start Waiting for Webhook" above</li>
            <li>Go to Meta Developer Console</li>
            <li>Add the webhook URL and verify token</li>
            <li>Meta will call the webhook and you'll see success!</li>
          </ol>
        </div>
        </div>

        {/* Right Panel - Conversation */}
        <div style={{ 
          flex: '1',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          minHeight: '600px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              💬 Instagram DMs
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
              {messages.length} message{messages.length !== 1 ? 's' : ''} received
            </p>
          </div>

          {/* Messages Display */}
          <div style={{ 
            height: '400px', 
            overflowY: 'auto', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#fafafa'
          }}>
            {messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#9ca3af', 
                padding: '2rem',
                fontStyle: 'italic'
              }}>
                No messages yet. Send a DM to your Instagram account to see it appear here!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((message, index) => (
                  <div 
                    key={message.id || index}
                    style={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1rem',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {/* Message Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '0.5rem',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#E4405F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {message.sender?.id ? message.sender.id.substring(0,1).toUpperCase() : '👤'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#111827' }}>
                          {message.sender?.id || 'Unknown User'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div style={{ 
                      padding: '0.5rem 0',
                      fontSize: '0.875rem',
                      color: '#374151',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      fontStyle: message.text ? 'normal' : 'italic'
                    }}>
                      {message.text || 'No text content'}
                    </div>

                    {/* Message ID for debugging */}
                    <div style={{ 
                      fontSize: '0.65rem', 
                      color: '#9ca3af', 
                      marginTop: '0.5rem',
                      fontFamily: 'monospace'
                    }}>
                      ID: {message.id}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live indicator */}
          {isWaiting && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: '#92400e'
            }}>
              🔴 Live - Listening for new messages...
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SimpleInstagramWebhook;