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
  
  // Send Message Panel State
  const [sendBusinessId, setSendBusinessId] = useState('');
  const [sendAccessToken, setSendAccessToken] = useState('');
  const [sendPhoneNumberId, setSendPhoneNumberId] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set webhook URL on component mount and check auth token
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
      console.log('📱 Message Ordering Debug:', {
        conversationPhone: firstConv.phoneNumber,
        messageCount: firstConv.messages.length,
        firstMessage: firstConv.messages[0]?.text?.substring(0, 30),
        firstMessageTime: firstConv.messages[0]?.timestamp || firstConv.messages[0]?.createdAt,
        lastMessage: firstConv.messages[firstConv.messages.length - 1]?.text?.substring(0, 30),
        lastMessageTime: firstConv.messages[firstConv.messages.length - 1]?.timestamp || firstConv.messages[firstConv.messages.length - 1]?.createdAt,
        allMessageTimes: firstConv.messages.map(m => ({ 
          text: m.text?.substring(0, 20), 
          time: m.timestamp || m.createdAt,
          direction: m.direction 
        }))
      });
    }
    
    return sortedConversations;
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
            
            // Auto-select first conversation if none selected and this is the first time we have conversations
            if (!selectedConversation && newConversations.length > 0 && conversations.length === 0) {
              console.log('Auto-selecting first conversation:', newConversations[0]);
              setSelectedConversation(newConversations[0]);
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

  const handleSendMessage = async () => {
    if (!sendBusinessId.trim() || !sendAccessToken.trim() || !sendPhoneNumberId.trim() || 
        !recipientPhone.trim() || !messageText.trim()) {
      setSendStatus('❌ Please fill in all fields');
      return;
    }

    setIsSending(true);
    setSendStatus('⏳ Sending message...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          businessId: sendBusinessId.trim(),
          accessToken: sendAccessToken.trim(),
          phoneNumberId: sendPhoneNumberId.trim(),
          recipientPhoneNumber: recipientPhone.trim(),
          messageText: messageText.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSendStatus(`✅ Message sent successfully! ID: ${data.data.messageId || 'N/A'}`);
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

      {/* Send Message Panel */}
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
          <span style={{ fontSize: '24px' }}>📤</span>
          WhatsApp Send Message
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

        {/* Send Message Form */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '16px', 
          marginBottom: '20px' 
        }}>
          {/* Business ID */}
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
              value={sendBusinessId}
              onChange={(e) => setSendBusinessId(e.target.value)}
              placeholder="e.g., 1234567890123456"
              disabled={isSending}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isSending ? '#f8f9fa' : 'white'
              }}
            />
          </div>

          {/* Access Token */}
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
              value={sendAccessToken}
              onChange={(e) => setSendAccessToken(e.target.value)}
              placeholder="EAAxxxxxxxx..."
              disabled={isSending}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isSending ? '#f8f9fa' : 'white'
              }}
            />
          </div>

          {/* Phone Number ID */}
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
              value={sendPhoneNumberId}
              onChange={(e) => setSendPhoneNumberId(e.target.value)}
              placeholder="e.g., 628007790405551"
              disabled={isSending}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isSending ? '#f8f9fa' : 'white'
              }}
            />
          </div>

          {/* Recipient Phone Number */}
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontWeight: '500',
              color: '#495057'
            }}>
              Recipient Phone Number:
            </label>
            <input
              type="text"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="9647700716669 (no + sign)"
              disabled={isSending}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: isSending ? '#f8f9fa' : 'white'
              }}
            />
          </div>
        </div>

        {/* Message Text */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: '500',
            color: '#495057'
          }}>
            Message Text:
          </label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Enter your message here..."
            disabled={isSending}
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
              backgroundColor: isSending ? '#f8f9fa' : 'white'
            }}
          />
        </div>

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

        {/* Send Button */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={handleSendMessage}
            disabled={isSending || !sendBusinessId.trim() || !sendAccessToken.trim() || 
                     !sendPhoneNumberId.trim() || !recipientPhone.trim() || !messageText.trim()}
            style={{
              padding: '12px 24px',
              background: (isSending || !sendBusinessId.trim() || !sendAccessToken.trim() || 
                          !sendPhoneNumberId.trim() || !recipientPhone.trim() || !messageText.trim()) 
                         ? '#6c757d' : '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (isSending || !sendBusinessId.trim() || !sendAccessToken.trim() || 
                      !sendPhoneNumberId.trim() || !recipientPhone.trim() || !messageText.trim()) 
                     ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isSending ? '⏳ Sending...' : '📤 Send Message'}
          </button>

          {/* Quick Fill Button */}
          <button
            onClick={() => {
              console.log('Fill Template Message clicked, selectedConversation:', selectedConversation);
              if (selectedConversation) {
                const contactName = selectedConversation.contactName;
                console.log('Setting template message for:', contactName);
                
                setMessageText(`Hello ${contactName}, thanks for your message!`);
                
                // Show success message
                setSendStatus(`✅ Template message filled for ${contactName}`);
                setTimeout(() => setSendStatus(''), 3000);
              } else {
                console.log('No conversation selected');
                setSendStatus('❌ Please select a conversation first');
                setTimeout(() => setSendStatus(''), 3000);
              }
            }}
            disabled={isSending}
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
            📋 Fill Template Message ({selectedConversation ? selectedConversation.contactName : 'None'})
          </button>
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
          💡 <strong>Tip:</strong> Click any conversation below to automatically fill the recipient phone number. 
          Use "Fill Template Message" to add a pre-written reply. Get credentials from Meta Developer Console.
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