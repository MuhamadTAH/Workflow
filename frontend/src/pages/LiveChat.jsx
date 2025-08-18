import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, tokenManager } from '../api';
import './LiveChat.css';

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://workflow-lg9z.onrender.com'
  : 'http://localhost:3001';

const LiveChat = () => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [telegramConnected, setTelegramConnected] = useState(false);

  // Mock data for now - will be replaced with API calls
  const mockConversations = [
    {
      id: 1,
      name: 'Muhammad Tarq',
      username: 'Muh0mmad',
      phone: '105156466',
      lastMessage: 'hello',
      timestamp: '5min',
      platform: 'telegram',
      status: 'active',
      avatar: null,
      subscribed: true
    },
    {
      id: 2,
      name: 'Jane Doe',
      username: 'jane_doe',
      phone: '123456789',
      lastMessage: 'Sure, I will get back to you.',
      timestamp: '1h',
      platform: 'telegram',
      status: 'unassigned',
      avatar: null,
      subscribed: false
    },
    {
      id: 3,
      name: 'Support Team',
      username: 'support_bot',
      phone: '987654321',
      lastMessage: 'Your ticket has been updated.',
      timestamp: '3h',
      platform: 'telegram',
      status: 'closed',
      avatar: null,
      subscribed: true
    }
  ];

  const mockMessages = [
    {
      id: 1,
      type: 'system',
      text: 'Conversation was moved from Closed to Unassigned',
      timestamp: 'Today, 09:56'
    },
    {
      id: 2,
      type: 'received',
      text: 'hello',
      sender: 'Muhammad Tarq',
      timestamp: '09:56'
    },
    {
      id: 3,
      type: 'system',
      text: 'Conversation was assigned to Mhamad Tarq',
      timestamp: '09:57'
    },
    {
      id: 4,
      type: 'system',
      text: 'Automations have been paused.',
      timestamp: '09:57'
    },
    {
      id: 5,
      type: 'sent',
      text: 'hello',
      sender: 'Agent',
      timestamp: '09:58'
    }
  ];

  // Load user's connected Telegram bot
  const loadTelegramConnection = async () => {
    try {
      const token = tokenManager.getToken();
      const response = await fetch(`${API_BASE}/api/connections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load connections');
      }

      const data = await response.json();
      if (data.connections && data.connections.telegram) {
        setBotToken(data.connections.telegram.access_token || '');
        setTelegramConnected(true);
        console.log('✅ Telegram bot connected and token loaded');
      } else {
        setTelegramConnected(false);
        console.log('❌ No Telegram bot connected');
      }
    } catch (error) {
      console.error('Error loading Telegram connection:', error);
      setTelegramConnected(false);
    }
  };

  // Load conversations from API
  const loadConversations = async () => {
    try {
      const token = tokenManager.getToken();
      const response = await fetch(`${API_BASE}/api/live-chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load conversations');
      }

      const data = await response.json();
      if (data.success) {
        const formattedConversations = data.conversations.map(conv => ({
          id: conv.id,
          name: conv.name,
          username: conv.username,
          phone: conv.phone,
          lastMessage: conv.lastMessage,
          timestamp: conv.lastMessageTime ? formatTimestamp(conv.lastMessageTime) : 'No messages',
          platform: 'telegram',
          status: conv.status,
          avatar: null,
          subscribed: true // TODO: Add subscription status to backend
        }));
        
        setConversations(formattedConversations);
        if (formattedConversations.length > 0 && !selectedConversation) {
          setSelectedConversation(formattedConversations[0]);
          loadMessages(formattedConversations[0].id);
        }
      } else {
        console.error('Failed to load conversations:', data.error);
        setConversations(mockConversations); // Fallback to mock data
        setSelectedConversation(mockConversations[0]);
        setMessages(mockMessages);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations(mockConversations); // Fallback to mock data
      setSelectedConversation(mockConversations[0]);
      setMessages(mockMessages);
    }
  };

  // Load messages for a conversation
  const loadMessages = async (conversationId) => {
    try {
      const token = tokenManager.getToken();
      const response = await fetch(`${API_BASE}/api/live-chat/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      if (data.success) {
        const formattedMessages = data.messages.map(msg => ({
          id: msg.id,
          type: msg.type === 'user' ? 'received' : msg.type,
          text: msg.text,
          sender: msg.sender,
          timestamp: formatTimestamp(msg.timestamp)
        }));
        
        setMessages(formattedMessages);
      } else {
        console.error('Failed to load messages:', data.error);
        setMessages(mockMessages); // Fallback to mock data
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages(mockMessages); // Fallback to mock data
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'min';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
    return Math.floor(diff / 86400000) + 'd';
  };

  useEffect(() => {
    // Check authentication
    if (!tokenManager.isLoggedIn()) {
      navigate('/login');
      return;
    }

    // Load Telegram connection first, then conversations
    const initializeData = async () => {
      await loadTelegramConnection();
      await loadConversations();
      setLoading(false);
    };

    initializeData();
  }, [navigate]);

  // Handle conversation selection
  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending || !selectedConversation) return;

    setSending(true);
    try {
      const token = tokenManager.getToken();
      const response = await fetch(`${API_BASE}/api/live-chat/conversations/${selectedConversation.id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          botToken: botToken
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      if (data.success) {
        // Add the sent message to the UI immediately
        const newMessage = {
          id: Date.now(), // Temporary ID
          type: 'sent',
          text: messageText,
          sender: 'Agent',
          timestamp: 'now'
        };

        setMessages([...messages, newMessage]);
        setMessageText('');
        
        // Update conversation status to human
        await updateConversationStatus(selectedConversation.id, 'human');
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  // Update conversation status
  const updateConversationStatus = async (conversationId, status) => {
    try {
      const token = tokenManager.getToken();
      const response = await fetch(`${API_BASE}/api/live-chat/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Conversation status updated:', data);
        
        // Update the conversation in the UI
        setConversations(conversations.map(conv => 
          conv.id === conversationId ? { ...conv, status } : conv
        ));
      }
    } catch (error) {
      console.error('Failed to update conversation status:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'unassigned': return 'bg-blue-500';
      case 'closed': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="live-chat-container">
        <div className="loading-spinner">Loading conversations...</div>
      </div>
    );
  }

  // Show message if Telegram bot is not connected
  if (!telegramConnected) {
    return (
      <div className="live-chat-container">
        <div className="no-telegram-connection">
          <div className="no-connection-message">
            <i className="fab fa-telegram-plane" style={{ fontSize: '48px', color: '#0088CC', marginBottom: '16px' }}></i>
            <h2>No Telegram Bot Connected</h2>
            <p>To use Live Chat, you need to connect your Telegram bot first.</p>
            <a href="/connections" className="connect-telegram-btn">
              <i className="fas fa-plug"></i>
              Connect Your Telegram Bot
            </a>
            <div className="help-text">
              <small>
                <strong>How to get started:</strong><br/>
                1. Go to Connections page<br/>
                2. Connect your Telegram bot with bot token<br/>
                3. Return here to manage conversations
              </small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="live-chat-container">
      {/* Left Sidebar - Platform Navigation */}
      <aside className="live-chat-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">M</div>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <i className="fas fa-comments"></i>
          </a>
          <a href="/" className="nav-item">
            <i className="fas fa-home"></i>
          </a>
          <a href="/connections" className="nav-item">
            <i className="fas fa-user-friends"></i>
          </a>
          <a href="/workflows" className="nav-item">
            <i className="fas fa-th-large"></i>
          </a>
          <a href="#" className="nav-item">
            <i className="fas fa-paper-plane"></i>
          </a>
          <a href="#" className="nav-item">
            <i className="fab fa-instagram"></i>
          </a>
          <a href="#" className="nav-item">
            <i className="fab fa-telegram-plane"></i>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="user-avatar">M</div>
          <a href="#" className="nav-item">
            <i className="fas fa-question-circle"></i>
          </a>
          <div className="status-indicator"></div>
        </div>
      </aside>

      {/* Conversations List */}
      <div className="conversations-panel">
        <div className="conversations-header">
          <h2>Conversations</h2>
        </div>
        <div className="conversations-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`conversation-item ${selectedConversation?.id === conversation.id ? 'selected' : ''}`}
              onClick={() => handleConversationSelect(conversation)}
            >
              <div className={`conversation-avatar ${getStatusColor(conversation.status)}`}>
                {conversation.name.charAt(0).toUpperCase()}
              </div>
              <div className="conversation-content">
                <div className="conversation-header">
                  <h3>{conversation.name}</h3>
                  <span className="conversation-time">{conversation.timestamp}</span>
                </div>
                <p className="conversation-preview">{conversation.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <main className="chat-main">
        {/* Chat Header */}
        <header className="chat-header">
          <div className="chat-header-left">
            <i className="fab fa-telegram-plane chat-platform-icon"></i>
            <h2>Telegram</h2>
          </div>
          <div className="chat-header-right">
            <i className="fas fa-search"></i>
            <i className="fas fa-ellipsis-v"></i>
          </div>
        </header>

        {/* Messages Area */}
        <div className="messages-area">
          <div className="message-date">Today, 09:56</div>
          
          {messages.map((message) => {
            if (message.type === 'system') {
              return (
                <div key={message.id} className="system-message">
                  {message.text}
                </div>
              );
            }
            
            if (message.type === 'received') {
              return (
                <div key={message.id} className="message-wrapper received">
                  <div className="message-avatar">
                    {selectedConversation?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="message-bubble">
                    <p>{message.text}</p>
                  </div>
                </div>
              );
            }
            
            if (message.type === 'sent') {
              return (
                <div key={message.id} className="message-wrapper sent">
                  <div className="message-bubble sent-bubble">
                    <p>{message.text}</p>
                  </div>
                  <div className="message-avatar agent-avatar">
                    M
                  </div>
                </div>
              );
            }
            
            return null;
          })}
        </div>

        {/* Message Input */}
        <footer className="message-input-area">
          <div className="input-wrapper">
            <div className="textarea-container">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Reply here..."
                rows="1"
                className="message-textarea"
              />
              <div className="input-actions">
                <i className="fas fa-smile"></i>
                <i className="fas fa-paperclip"></i>
                <i className="fas fa-microphone"></i>
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={sending || !messageText.trim()}
              className="send-button"
            >
              {sending ? 'Sending...' : 'Send To Telegram'}
            </button>
          </div>
        </footer>
      </main>

      {/* Right User Info Panel */}
      <aside className="user-info-panel">
        <div className="user-info-header">
          <h3>{selectedConversation?.name}</h3>
          <i className="fas fa-ellipsis-h"></i>
        </div>
        
        <div className="user-info-content">
          <div className="user-profile-section">
            <div className={`user-profile-avatar ${getStatusColor(selectedConversation?.status)}`}>
              {selectedConversation?.name.charAt(0).toUpperCase()}
            </div>
            <p className={`subscription-status ${selectedConversation?.subscribed ? 'subscribed' : 'unsubscribed'}`}>
              <i className={`fas ${selectedConversation?.subscribed ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
              {selectedConversation?.subscribed ? 'Subscribed' : 'Unsubscribed'}
            </p>
          </div>
          
          <div className="user-details">
            <div className="detail-row">
              <span className="detail-label">Contact Time:</span>
              <span className="detail-value">
                Unknown <i className="fas fa-question-circle"></i>
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value accent">{selectedConversation?.phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Opted-In for:</span>
              <span className="detail-value">Telegram</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Username:</span>
              <span className="detail-value accent">{selectedConversation?.username}</span>
            </div>
          </div>

          <button className="history-button">
            All Channels History
          </button>

          <div className="contact-tags-section">
            <h4>Contact Tags</h4>
            <div className="tags-container">
              <span className="tag">Subscribed to Sequences</span>
              <span className="tag">Subscribe</span>
              <button className="add-tag-button">+ Add Tag</button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default LiveChat;