import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

const WhatsAppReceiver = () => {
  const [appId, setAppId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set webhook URL on component mount
  useEffect(() => {
    setWebhookUrl(`${API_BASE_URL}/api/webhooks/whatsapp`);
  }, []);

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
    
    // Convert to array and sort by last message time
    return Object.values(conversationMap).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
  };

  // Poll for new messages when active
  useEffect(() => {
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
            setMessages(newMessages);
            
            // Group messages into conversations
            const newConversations = groupMessagesIntoConversations(newMessages);
            setConversations(newConversations);
            
            // Auto-select first conversation if none selected
            if (!selectedConversation && newConversations.length > 0) {
              setSelectedConversation(newConversations[0]);
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
  }, [isActive, selectedConversation]);

  const handleActivate = async () => {
    if (!appId.trim() || !clientSecret.trim()) {
      setError('Please enter both App ID and Client Secret');
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
          appId: appId.trim(),
          clientSecret: clientSecret.trim()
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

        {/* Configuration Form */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '16px', 
          marginBottom: '20px' 
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
              disabled={isLoading || !appId.trim() || !clientSecret.trim()}
              style={{
                padding: '12px 24px',
                background: '#25D366',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading || !appId.trim() || !clientSecret.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                opacity: isLoading || !appId.trim() || !clientSecret.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isLoading ? '⏳ Activating...' : '▶️ Start Listening'}
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

      {/* Conversations Panel */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', 
        height: '600px',
        display: 'flex',
        overflow: 'hidden'
      }}>
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
                  onClick={() => setSelectedConversation(conversation)}
                  style={{ 
                    padding: '16px',
                    borderBottom: '1px solid #f1f3f4',
                    cursor: 'pointer',
                    background: selectedConversation?.phoneNumber === conversation.phoneNumber ? '#e7f3ff' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedConversation?.phoneNumber !== conversation.phoneNumber) {
                      e.target.style.background = '#f8f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedConversation?.phoneNumber !== conversation.phoneNumber) {
                      e.target.style.background = 'white';
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
                {selectedConversation.messages.map((message, index) => (
                  <div key={index} style={{ 
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'flex-start'
                  }}>
                    <div style={{ 
                      background: '#e7f3ff', 
                      padding: '12px 16px', 
                      borderRadius: '18px 18px 18px 4px', 
                      maxWidth: '70%',
                      border: '1px solid #b3d9ff'
                    }}>
                      <div style={{ 
                        color: '#212529', 
                        fontSize: '14px',
                        lineHeight: '1.4',
                        marginBottom: '6px'
                      }}>
                        {message.text || message.message || 'No message content'}
                      </div>
                      <div style={{ 
                        color: '#6c757d', 
                        fontSize: '11px',
                        textAlign: 'right'
                      }}>
                        {formatTimestamp(message.timestamp)}
                      </div>
                      {message.messageType && message.messageType !== 'text' && (
                        <div style={{ 
                          marginTop: '6px',
                          padding: '2px 6px',
                          background: '#fff3cd',
                          color: '#856404',
                          fontSize: '10px',
                          borderRadius: '3px',
                          display: 'inline-block'
                        }}>
                          {message.messageType}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
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