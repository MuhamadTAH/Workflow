import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';

const ChatWidget = () => {
  const { theme, colors } = useTheme();
  
  // Widget Configuration State
  const [widgetId, setWidgetId] = useState('');
  const [widgetName, setWidgetName] = useState('');
  const [widgetColor, setWidgetColor] = useState('#4a90e2');
  const [welcomeMessage, setWelcomeMessage] = useState('Hi! How can we help you?');
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Messages and Conversations State
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  
  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const [isWidgetSettingsCollapsed, setIsWidgetSettingsCollapsed] = useState(false);
  const [isWebsiteInfoCollapsed, setIsWebsiteInfoCollapsed] = useState(false);
  const [isStatsCollapsed, setIsStatsCollapsed] = useState(false);
  const [isAISettingsCollapsed, setIsAISettingsCollapsed] = useState(false);

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState({
    aiEnabled: false,
    autoReply: false,
    apiKey: '',
    systemPrompt: 'You are a helpful customer support assistant for a website chat widget. Respond professionally and helpfully to visitor questions.',
    knowledgeBase: '',
    responseDelay: 2000,
    model: 'claude-3-5-sonnet-20241022'
  });
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  // Per-user AI Management State
  const [userAIStatus, setUserAIStatus] = useState({});
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const [aiActivatingUsers, setAiActivatingUsers] = useState({});

  // Set fixed widget ID on component mount
  useEffect(() => {
    if (!widgetId) {
      setWidgetId('widget_main_site'); // Fixed ID that won't change
    }
  }, []);

  // Generate embed code
  const generateEmbedCode = () => {
    return `<!-- Chat Widget by Your Company -->
<script>
// Make chatWidget globally accessible
window.chatWidget = {
    widgetId: '${widgetId}',
    apiUrl: '${API_BASE_URL}/api/chat-widget',
    color: '${widgetColor}',
    welcomeMessage: '${welcomeMessage}',
    
    init: function() {
      // Create widget container
      var container = document.createElement('div');
      container.id = 'chat-widget-' + this.widgetId;
      container.innerHTML = this.getHTML();
      document.body.appendChild(container);
      
      // Add styles
      var style = document.createElement('style');
      style.textContent = this.getCSS();
      document.head.appendChild(style);
      
      // Add event listeners
      this.bindEvents();
    },
    
    getHTML: function() {
      return \`
        <div id="chat-bubble" onclick="window.chatWidget.toggleChat()">
          <div class="chat-icon">💬</div>
          <div class="chat-notification" id="chat-notification" style="display: none;">1</div>
        </div>
        <div id="chat-window" style="display: none;">
          <div class="chat-header">
            <span>Chat with us</span>
            <button onclick="window.chatWidget.toggleChat()" class="close-btn">×</button>
          </div>
          <div class="chat-messages" id="chat-messages">
            <div class="message bot-message">\${this.welcomeMessage}</div>
          </div>
          <div class="chat-input-area">
            <input type="text" id="chat-input" placeholder="Type a message..." onkeypress="window.chatWidget.handleKeyPress(event)">
            <button onclick="window.chatWidget.sendMessage()" class="send-btn">Send</button>
          </div>
        </div>
      \`;
    },
    
    getCSS: function() {
      return \`
        #chat-widget-\${this.widgetId} {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        #chat-bubble {
          width: 60px;
          height: 60px;
          background: \${this.color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          transition: transform 0.2s;
          position: relative;
        }
        
        #chat-bubble:hover {
          transform: scale(1.1);
        }
        
        .chat-icon {
          font-size: 24px;
          color: white;
        }
        
        .chat-notification {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ff4444;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        }
        
        #chat-window {
          position: absolute;
          bottom: 80px;
          right: 0;
          width: 350px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .chat-header {
          background: \${this.color};
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
        }
        
        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          background: #f8f9fa;
        }
        
        .message {
          margin-bottom: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          max-width: 80%;
          word-wrap: break-word;
        }
        
        .bot-message {
          background: #e9ecef;
          align-self: flex-start;
        }
        
        .user-message {
          background: \${this.color};
          color: white;
          align-self: flex-end;
          margin-left: auto;
        }
        
        .chat-input-area {
          padding: 16px;
          border-top: 1px solid #dee2e6;
          display: flex;
          gap: 8px;
        }
        
        #chat-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #dee2e6;
          border-radius: 20px;
          outline: none;
        }
        
        .send-btn {
          background: \${this.color};
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 20px;
          cursor: pointer;
        }
        
        .send-btn:hover {
          opacity: 0.9;
        }
      \`;
    },
    
    toggleChat: function() {
      console.log('Toggle chat called');
      var chatWindow = document.getElementById('chat-window');
      if (chatWindow) {
        if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
          chatWindow.style.display = 'flex';
          document.getElementById('chat-notification').style.display = 'none';
          this.startPolling(); // Start checking for replies
          console.log('Chat window opened');
        } else {
          chatWindow.style.display = 'none';
          this.stopPolling(); // Stop checking for replies
          console.log('Chat window closed');
        }
      } else {
        console.error('Chat window element not found');
      }
    },
    
    handleKeyPress: function(event) {
      if (event.key === 'Enter') {
        this.sendMessage();
      }
    },
    
    sendMessage: function() {
      var input = document.getElementById('chat-input');
      var message = input.value.trim();
      
      if (message) {
        this.addMessage(message, 'user');
        input.value = '';
        
        // Send to your backend
        this.sendToBackend(message);
      }
    },
    
    addMessage: function(text, type) {
      var messagesContainer = document.getElementById('chat-messages');
      var messageDiv = document.createElement('div');
      messageDiv.className = 'message ' + (type === 'user' ? 'user-message' : 'bot-message');
      messageDiv.textContent = text;
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },
    
    sendToBackend: function(message) {
      var self = this;
      
      // First activate widget session if not done
      if (!this.sessionId) {
        fetch(this.apiUrl + '/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            widgetId: this.widgetId,
            websiteUrl: window.location.href,
            userAgent: navigator.userAgent,
            referrer: document.referrer
          })
        })
        .then(function(response) { return response.json(); })
        .then(function(data) {
          if (data.success) {
            self.sessionId = data.sessionId;
            self.sendToBackend(message);
          }
        })
        .catch(function(error) {
          console.log('Chat widget activation error:', error);
        });
        return;
      }
      
      // Send message to backend
      fetch(this.apiUrl + '/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          widgetId: this.widgetId,
          message: message,
          senderName: 'Website Visitor',
          senderEmail: null
        })
      }).catch(function(error) {
        console.log('Chat widget error:', error);
      });
    },
    
    sendMessageToBackend: function(message) {
      this.sendToBackend(message);
    },
    
    bindEvents: function() {
      // Initialize session on widget load
      this.sessionId = null;
      this.lastMessageTime = null;
      
      // Start polling for replies when chat is opened
      this.pollInterval = null;
    },
    
    startPolling: function() {
      var self = this;
      if (this.pollInterval) return; // Already polling
      
      this.pollInterval = setInterval(function() {
        self.fetchNewMessages();
      }, 3000); // Poll every 3 seconds
    },
    
    stopPolling: function() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    },
    
    fetchNewMessages: function() {
      var self = this;
      
      // Only fetch if we have a widget ID
      if (!this.widgetId) return;
      
      fetch(this.apiUrl + '/messages?limit=10')
        .then(function(response) { return response.json(); })
        .then(function(data) {
          if (data.success && data.messages) {
            self.displayNewMessages(data.messages);
          }
        })
        .catch(function(error) {
          console.log('Error fetching messages:', error);
        });
    },
    
    displayNewMessages: function(messages) {
      var self = this;
      
      // Filter messages for this widget and newer than last message
      var widgetMessages = messages.filter(function(msg) {
        return msg.widgetId === self.widgetId;
      });
      
      // Sort by timestamp
      widgetMessages.sort(function(a, b) {
        return new Date(a.timestamp) - new Date(b.timestamp);
      });
      
      // Add new messages to chat
      widgetMessages.forEach(function(msg) {
        var messageTime = new Date(msg.timestamp);
        
        // Skip if we've already shown this message
        if (self.lastMessageTime && messageTime <= self.lastMessageTime) {
          return;
        }
        
        // Determine if it's a support reply
        var isSupport = msg.senderName === 'Support Agent' || msg.userAgent === 'Dashboard';
        
        // Only add support replies (visitor messages are already added when sent)
        if (isSupport) {
          self.addMessage(msg.message, 'bot');
        }
        
        // Update last message time
        if (!self.lastMessageTime || messageTime > self.lastMessageTime) {
          self.lastMessageTime = messageTime;
        }
      });
    }
};

// Initialize widget when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    window.chatWidget.init();
  });
} else {
  window.chatWidget.init();
}
</script>`;
  };

  // Copy embed code to clipboard
  const copyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(generateEmbedCode());
      alert('Widget code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy code. Please copy manually.');
    }
  };

  // Activate widget (save to backend)
  const activateWidget = async () => {
    if (!widgetName.trim()) {
      setError('Widget name is required');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          widgetId,
          websiteUrl: window.location.href,
          userAgent: navigator.userAgent,
          referrer: document.referrer || 'Dashboard Activation'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsActive(true);
        console.log('✅ Chat widget activated successfully:', data.sessionId);
      } else {
        setError(data.error || 'Failed to activate widget');
        console.error('Activation failed:', data);
      }
    } catch (error) {
      setError('Network error: ' + error.message);
      console.error('Network error during activation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch conversations (grouped by session)
  const fetchMessages = async (sessionId = null) => {
    try {
      let url = `${API_BASE_URL}/api/chat-widget/messages`;
      if (sessionId) {
        url += `?sessionId=${sessionId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        const allMessages = data.messages || [];
        
        if (sessionId) {
          // If fetching for specific session, just set messages
          setMessages(allMessages);
        } else {
          // Group messages by session ID to create conversations list
          const conversationsMap = new Map();
          
          allMessages.forEach(message => {
            const sessionId = message.sessionId;
            if (!sessionId) return;
            
            if (!conversationsMap.has(sessionId)) {
              conversationsMap.set(sessionId, {
                sessionId: sessionId,
                websiteUrl: message.websiteUrl,
                userAgent: message.userAgent,
                messageCount: 0,
                lastMessage: message.timestamp,
                lastMessageText: message.message,
                messages: []
              });
            }
            
            const conversation = conversationsMap.get(sessionId);
            conversation.messageCount++;
            conversation.messages.push(message);
            
            // Update last message timestamp if this is newer
            if (new Date(message.timestamp) > new Date(conversation.lastMessage)) {
              conversation.lastMessage = message.timestamp;
              conversation.lastMessageText = message.message;
            }
          });
          
          // Convert map to array and sort by last message timestamp
          const conversationsArray = Array.from(conversationsMap.values())
            .sort((a, b) => new Date(b.lastMessage) - new Date(a.lastMessage));
          
          setConversations(conversationsArray);
          setMessages(allMessages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Poll for messages when widget is active
  useEffect(() => {
    let interval;
    if (isActive) {
      fetchMessages();
      interval = setInterval(fetchMessages, 3000);
    }
    return () => clearInterval(interval);
  }, [isActive, widgetId]);

  // Get messages for selected conversation
  const getMessagesForConversation = (sessionId) => {
    if (!sessionId || !messages.length) return [];
    return messages.filter(message => message.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const currentMessages = getMessagesForConversation(selectedConversation?.sessionId);

  // Send reply function
  const sendReply = async () => {
    if (!replyText.trim() || !selectedConversation || isReplying) return;

    setIsReplying(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: selectedConversation.sessionId,
          widgetId: widgetId,
          message: replyText.trim(),
          senderName: 'Support Agent'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReplyText('');
        // Refresh messages to show the reply
        fetchMessages();
        console.log('✅ Reply sent successfully');
      } else {
        console.error('Failed to send reply:', data.error);
        alert('Failed to send reply: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Network error while sending reply');
    } finally {
      setIsReplying(false);
    }
  };

  // Handle reply input key press
  const handleReplyKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendReply();
    }
  };

  // Load AI configuration
  const loadAIConfig = async () => {
    setIsLoadingAI(true);
    setAiError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/ai-config`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Keep the current API key if the loaded one is masked
        const loadedConfig = data.config;
        if (loadedConfig.apiKey && loadedConfig.apiKey.includes('••••')) {
          loadedConfig.apiKey = aiConfig.apiKey; // Keep current value
        }
        setAiConfig(loadedConfig);
        console.log('✅ AI configuration loaded');
      } else {
        setAiError('Failed to load AI configuration');
        console.error('Failed to load AI config:', data.error);
      }
    } catch (error) {
      setAiError('Network error loading AI configuration');
      console.error('Error loading AI config:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Connect Claude API (same pattern as WhatsApp)
  const connectClaudeAPI = async () => {
    setIsLoadingAI(true);
    setAiError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/claude/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claudeApiKey: aiConfig.apiKey,
          systemPrompt: aiConfig.systemPrompt
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Claude API connected successfully');
        setAiError('');
        // Show success message
        alert(`🎉 Claude API Connected!\n\nTest Response: ${data.testResponse}\n\nYour AI assistant is now ready for auto-replies!`);
      } else {
        setAiError(data.error || 'Failed to connect Claude API');
        console.error('❌ Claude connection failed:', data.error);
      }
    } catch (error) {
      console.error('Error connecting Claude:', error);
      setAiError('Network error while connecting to Claude API');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Save AI configuration
  const saveAIConfig = async () => {
    setIsLoadingAI(true);
    setAiError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/ai-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiConfig)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('✅ AI configuration saved');
        alert('AI configuration saved successfully!');
      } else {
        setAiError('Failed to save AI configuration');
        console.error('Failed to save AI config:', data.error);
        alert('Failed to save AI configuration: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      setAiError('Network error saving AI configuration');
      console.error('Error saving AI config:', error);
      alert('Network error while saving AI configuration');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Load AI configuration on component mount
  useEffect(() => {
    loadAIConfig();
  }, []);

  // Toggle AI for specific user/session
  const toggleUserAI = async (sessionId) => {
    if (!sessionId || isTogglingAI) return;
    
    setIsTogglingAI(true);
    setAiError('');
    
    // Check if session has explicit status set, otherwise default to true (active)
    const currentStatus = userAIStatus.hasOwnProperty(sessionId) ? userAIStatus[sessionId] : true;
    const newStatus = !currentStatus;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/user-ai/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          isActive: newStatus
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // If activating AI, mark session as "activating" for 5 seconds
        if (newStatus) {
          setAiActivatingUsers(prev => ({ ...prev, [sessionId]: true }));
          
          // Clear activating status after 5 seconds
          setTimeout(() => {
            setAiActivatingUsers(prev => {
              const updated = { ...prev };
              delete updated[sessionId];
              return updated;
            });
          }, 5000);
        }
        
        setUserAIStatus(prev => ({
          ...prev,
          [sessionId]: newStatus
        }));
      } else {
        setAiError(data.error || 'Failed to toggle AI status for session');
      }
    } catch (error) {
      setAiError('Network error: ' + error.message);
    } finally {
      setIsTogglingAI(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.primaryBg, padding: '0' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ width: '100%', margin: '0 auto', padding: '0' }}>
        
        {/* Fixed Toggle Buttons */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            left: isSidebarCollapsed ? '20px' : '400px',
            backgroundColor: colors.brandBlue,
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
          onMouseEnter={(e) => e.target.style.backgroundColor = colors.brandBlueDark}
          onMouseLeave={(e) => e.target.style.backgroundColor = colors.brandBlue}
        >
          {isSidebarCollapsed ? '☰' : '✕'}
        </button>
        
        <button
          onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            right: isRightSidebarCollapsed ? '20px' : '300px',
            backgroundColor: colors.success,
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
          onMouseEnter={(e) => e.target.style.backgroundColor = colors.brandBlueDark}
          onMouseLeave={(e) => e.target.style.backgroundColor = colors.success}
        >
          {isRightSidebarCollapsed ? '☰' : '✕'}
        </button>

        <div style={{ display: 'flex', gap: '0', alignItems: 'flex-start', position: 'relative' }}>
          
          {/* LEFT SIDEBAR - Widget Configuration */}
          <div style={{ 
            width: '400px',
            backgroundColor: colors.secondaryBg, 
            borderRadius: '0', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            left: '0',
            borderRight: `1px solid ${colors.border}`,
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            transform: isSidebarCollapsed ? 'translateX(-420px)' : 'translateX(0)',
            opacity: isSidebarCollapsed ? 0 : 1,
            zIndex: 1000
          }}>
            {/* Sidebar Header */}
            <div style={{ 
              backgroundColor: colors.brandBlue, 
              color: 'white', 
              padding: '1rem 1.5rem',
              borderRadius: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center' }}>
                <i className="fas fa-comments" style={{ marginRight: '0.5rem' }}></i>
                Chat Widget
              </h2>
            </div>
            
            {/* Sidebar Content */}
            <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
              
              {/* Widget Settings Section */}
              <div style={{ marginBottom: isWidgetSettingsCollapsed ? '0' : '2rem' }}>
                <h3 
                  onClick={() => setIsWidgetSettingsCollapsed(!isWidgetSettingsCollapsed)}
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: colors.primaryText, 
                    marginBottom: '1rem', 
                    borderBottom: `2px solid ${colors.border}`, 
                    paddingBottom: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                  }}
                >
                  <span>⚙️ Widget Settings</span>
                  <span style={{ 
                    transform: isWidgetSettingsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '0.8rem',
                    color: colors.mutedText
                  }}>
                    ▼
                  </span>
                </h3>
                
                {/* Collapsible Content */}
                <div style={{
                  maxHeight: isWidgetSettingsCollapsed ? '0' : '2000px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  opacity: isWidgetSettingsCollapsed ? 0 : 1
                }}>

                  {/* Widget Name */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.secondaryText, marginBottom: '0.5rem' }}>
                      Widget Name
                    </label>
                    <input
                      type="text"
                      value={widgetName}
                      onChange={(e) => setWidgetName(e.target.value)}
                      placeholder="My Website Chat"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: `1px solid ${colors.border}`, 
                        borderRadius: '6px', 
                        fontSize: '0.875rem',
                        outline: 'none',
                        backgroundColor: colors.inputBg,
                        color: colors.primaryText
                      }}
                    />
                  </div>

                  {/* Widget ID */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.secondaryText, marginBottom: '0.5rem' }}>
                      Widget ID
                    </label>
                    <input
                      type="text"
                      value={widgetId}
                      readOnly
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: `1px solid ${colors.border}`, 
                        borderRadius: '6px', 
                        fontSize: '0.75rem',
                        backgroundColor: colors.inputBg,
                        color: colors.mutedText,
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>

                  {/* Widget Color */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.secondaryText, marginBottom: '0.5rem' }}>
                      Widget Color
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={widgetColor}
                        onChange={(e) => setWidgetColor(e.target.value)}
                        style={{ 
                          width: '50px',
                          height: '40px',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      />
                      <input
                        type="text"
                        value={widgetColor}
                        onChange={(e) => setWidgetColor(e.target.value)}
                        style={{ 
                          flex: 1,
                          padding: '0.75rem', 
                          border: `1px solid ${colors.border}`, 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          backgroundColor: colors.inputBg,
                          color: colors.primaryText
                        }}
                      />
                    </div>
                  </div>

                  {/* Welcome Message */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.secondaryText, marginBottom: '0.5rem' }}>
                      Welcome Message
                    </label>
                    <textarea
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="Hi! How can we help you?"
                      rows="3"
                      style={{ 
                        width: '100%', 
                        padding: '0.75rem', 
                        border: `1px solid ${colors.border}`, 
                        borderRadius: '6px', 
                        fontSize: '0.875rem',
                        outline: 'none',
                        backgroundColor: colors.inputBg,
                        color: colors.primaryText,
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Embed Code Section */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.secondaryText, marginBottom: '0.5rem' }}>
                      Embed Code
                    </label>
                    <div style={{ 
                      backgroundColor: colors.inputBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '6px',
                      padding: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <code style={{
                        fontSize: '0.75rem',
                        color: colors.mutedText,
                        wordBreak: 'break-all',
                        display: 'block',
                        maxHeight: '150px',
                        overflow: 'auto'
                      }}>
                        {generateEmbedCode().substring(0, 200)}...
                      </code>
                    </div>
                    <button
                      onClick={copyEmbedCode}
                      style={{
                        width: '100%',
                        backgroundColor: colors.success,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      📋 Copy Widget Code
                    </button>
                  </div>

                  {/* Activate Widget */}
                  {!isActive && (
                    <button
                      onClick={activateWidget}
                      disabled={isLoading || !widgetName}
                      style={{
                        width: '100%',
                        backgroundColor: isLoading || !widgetName ? colors.mutedText : colors.brandBlue,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: isLoading || !widgetName ? 'not-allowed' : 'pointer',
                        marginBottom: '1rem'
                      }}
                    >
                      {isLoading ? 'Activating...' : '🚀 Activate Widget'}
                    </button>
                  )}

                  {/* Status */}
                  {isActive && (
                    <div style={{ 
                      padding: '1rem', 
                      borderRadius: '6px', 
                      backgroundColor: colors.overlay,
                      color: colors.success,
                      textAlign: 'center',
                      marginBottom: '1rem'
                    }}>
                      ✅ Widget is active and ready to receive messages
                    </div>
                  )}

                  {/* Error Display */}
                  {error && (
                    <div style={{ 
                      padding: '1rem', 
                      borderRadius: '6px', 
                      backgroundColor: colors.overlay,
                      color: colors.error,
                      marginBottom: '1rem',
                      border: `1px solid ${colors.error}`
                    }}>
                      {error}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN - Chat Interface */}
          <div style={{ 
            position: 'fixed',
            top: '0',
            left: isSidebarCollapsed ? '0' : '400px',
            right: isRightSidebarCollapsed ? '0' : '300px',
            height: '100vh',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0',
            transition: 'left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            padding: '2rem 1rem',
            backgroundColor: colors.primaryBg,
            borderTop: `1px solid ${colors.border}`,
            borderBottom: `1px solid ${colors.border}`,
            zIndex: 999,
            overflowY: 'auto'
          }}>

            {/* Two Panel Layout */}
            <div style={{
              opacity: isActive ? 1 : 0.6
            }}>
              {!isActive && (
                <div style={{
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: `1px solid ${colors.error}`
                }}>
                  <p style={{ color: colors.error, fontSize: '0.875rem', margin: 0 }}>
                    ⚠️ Configure and activate your widget to start receiving messages
                  </p>
                </div>
              )}
              
              <div style={{ 
                display: 'flex', 
                gap: '0', 
                height: 'calc(100vh - 100px)', 
                border: `1px solid ${colors.border}`, 
                borderRadius: '8px', 
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%'
              }}>
                
                {/* Websites Panel */}
                <div style={{ 
                  flex: '0 0 300px',
                  width: '300px',
                  minWidth: '300px',
                  maxWidth: '300px',
                  backgroundColor: colors.cardBg, 
                  padding: '1rem', 
                  borderRight: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '500', color: colors.primaryText, margin: 0 }}>
                      🌐 Websites
                      {isActive && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: colors.success,
                          backgroundColor: colors.overlay,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          🟢 Live
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: colors.mutedText }}>
                      {conversations.length} site{conversations.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: colors.inputBg, 
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`
                  }}>
                    {conversations.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: colors.mutedText,
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌐</div>
                        <p>No websites using your widget yet. Install the widget code on your website to start receiving messages!</p>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem' }}>
                        {conversations.map((conversation) => (
                          <div
                            key={conversation.sessionId}
                            onClick={() => setSelectedConversation(conversation)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0.75rem',
                              borderRadius: '6px',
                              marginBottom: '0.5rem',
                              cursor: 'pointer',
                              backgroundColor: selectedConversation?.sessionId === conversation.sessionId ? colors.brandBlue : 'transparent',
                              color: selectedConversation?.sessionId === conversation.sessionId ? 'white' : colors.primaryText,
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: selectedConversation?.sessionId === conversation.sessionId ? 'rgba(255,255,255,0.2)' : colors.brandBlue,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '0.75rem',
                              fontSize: '1rem',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              🌐
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontWeight: '500', 
                                fontSize: '0.875rem',
                                marginBottom: '0.25rem',
                                color: selectedConversation?.sessionId === conversation.sessionId ? 'white' : colors.primaryText,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {new URL(conversation.websiteUrl).hostname}
                              </div>
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: selectedConversation?.sessionId === conversation.sessionId ? 'rgba(255,255,255,0.8)' : colors.mutedText
                              }}>
                                {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
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
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: colors.inputBg
                }}>
        
                  {/* Messages Header */}
                  {selectedConversation ? (
                    <div style={{ 
                      padding: '1rem',
                      backgroundColor: colors.secondaryBg,
                      borderBottom: `1px solid ${colors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: colors.brandBlue,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        🌐
                      </div>
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: colors.primaryText }}>
                          {new URL(selectedConversation.websiteUrl).hostname}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: colors.mutedText }}>
                          {selectedConversation.websiteUrl}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '2rem',
                      backgroundColor: colors.cardBg,
                      textAlign: 'center',
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>💬</div>
                      <h2 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '600',
                        color: colors.primaryText,
                        margin: '0 0 0.5rem 0'
                      }}>
                        Select a Conversation
                      </h2>
                      <p style={{ fontSize: '0.875rem', color: colors.mutedText, margin: 0 }}>
                        Choose a conversation from the left panel to view messages from visitors
                      </p>
                    </div>
                  )}

                  {/* Messages Display */}
                  {selectedConversation && (
                    <div style={{ 
                      flex: 1, 
                      overflowY: 'auto', 
                      padding: '1rem',
                      backgroundColor: colors.primaryBg
                    }}>
                      {currentMessages.length === 0 ? (
                        <div style={{ 
                          textAlign: 'center', 
                          color: colors.mutedText, 
                          padding: '2rem',
                          fontStyle: 'italic'
                        }}>
                          No messages from this website yet.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {currentMessages.map((message, index) => {
                            const isSupportReply = message.senderName === 'Support Agent' || message.userAgent === 'Dashboard';
                            const isAIReply = message.senderName === 'AI Assistant' || message.userAgent === 'AI Assistant';
                            return (
                              <div 
                                key={message.id || index}
                                style={{
                                  display: 'flex',
                                  justifyContent: (isSupportReply || isAIReply) ? 'flex-start' : 'flex-end',
                                  width: '100%',
                                  marginBottom: '0.5rem'
                                }}
                              >
                                <div style={{
                                  maxWidth: '70%',
                                  padding: '0.75rem 1rem',
                                  borderRadius: (isSupportReply || isAIReply) ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                  backgroundColor: isAIReply ? colors.success : (isSupportReply ? colors.brandBlue : colors.cardBg),
                                  color: (isSupportReply || isAIReply) ? 'white' : colors.primaryText,
                                  fontSize: '0.875rem',
                                  lineHeight: '1.4',
                                  wordWrap: 'break-word',
                                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                                  position: 'relative'
                                }}>
                                  {/* Message Content */}
                                  <div style={{ marginBottom: '0.25rem' }}>
                                    {message.message}
                                  </div>

                                  {/* Timestamp and sender info */}
                                  <div style={{ 
                                    fontSize: '0.65rem',
                                    opacity: 0.7,
                                    color: (isSupportReply || isAIReply) ? 'rgba(255,255,255,0.8)' : colors.mutedText,
                                    marginTop: '0.25rem'
                                  }}>
                                    {new Date(message.timestamp).toLocaleString()}
                                    <br/>
                                    <span style={{ fontSize: '0.6rem' }}>
                                      {message.senderName} {isAIReply ? '🤖' : (isSupportReply ? '👨‍💼' : '👤')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Per-User AI Control */}
                  {selectedConversation && aiConfig.aiEnabled && (
                    <div style={{ 
                      padding: '1rem',
                      backgroundColor: colors.cardBg,
                      borderTop: `1px solid ${colors.border}`,
                      borderBottom: `1px solid ${colors.border}`
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}>
                        <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: '600', color: colors.primaryText, marginBottom: '0.25rem' }}>
                            AI Assistant for this Visitor
                          </div>
                          <div style={{ 
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            color: userAIStatus[selectedConversation.sessionId] !== false ? '#15803d' : '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: userAIStatus[selectedConversation.sessionId] !== false ? '#10b981' : '#ef4444'
                            }}></span>
                            {userAIStatus[selectedConversation.sessionId] !== false ? '🤖 Active' : '🚫 Inactive'}
                          </div>
                        </div>
                        
                        <div style={{
                          fontSize: '0.75rem',
                          color: colors.mutedText,
                          textAlign: 'center',
                          padding: '0.5rem',
                          backgroundColor: colors.inputBg,
                          borderRadius: '6px',
                          border: `1px solid ${colors.border}`,
                          minWidth: '80px'
                        }}>
                          <div style={{ 
                            fontSize: '1rem',
                            marginBottom: '0.25rem',
                            color: (userAIStatus.hasOwnProperty(selectedConversation.sessionId) ? 
                              (userAIStatus[selectedConversation.sessionId] ? '#10b981' : '#ef4444') : '#10b981')
                          }}>
                            {(userAIStatus.hasOwnProperty(selectedConversation.sessionId) ? 
                              (userAIStatus[selectedConversation.sessionId] ? '🤖' : '🚫') : '🤖')}
                          </div>
                          <span style={{ 
                            color: (userAIStatus.hasOwnProperty(selectedConversation.sessionId) ? 
                              (userAIStatus[selectedConversation.sessionId] ? '#10b981' : '#ef4444') : '#10b981'),
                            fontSize: '0.65rem',
                            fontWeight: '500'
                          }}>
                            {(userAIStatus.hasOwnProperty(selectedConversation.sessionId) ? 
                              (userAIStatus[selectedConversation.sessionId] ? 'AI Active' : 'AI Inactive') : 'AI Active')}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleUserAI(selectedConversation.sessionId)}
                        disabled={isTogglingAI || !selectedConversation.sessionId || aiActivatingUsers[selectedConversation.sessionId]}
                        style={{
                          width: '100%',
                          backgroundColor: isTogglingAI ? '#9ca3af' : 
                            aiActivatingUsers[selectedConversation.sessionId] ? '#f59e0b' :
                            (userAIStatus.hasOwnProperty(selectedConversation.sessionId) ? 
                              (userAIStatus[selectedConversation.sessionId] ? '#ef4444' : '#10b981') : '#ef4444'),
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          cursor: (isTogglingAI || aiActivatingUsers[selectedConversation.sessionId]) ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isTogglingAI ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid transparent',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            Updating...
                          </>
                        ) : aiActivatingUsers[selectedConversation.sessionId] ? (
                          <>
                            ⏳
                            <span>AI Starting... (Please wait)</span>
                          </>
                        ) : (userAIStatus.hasOwnProperty(selectedConversation.sessionId) ? 
                            (userAIStatus[selectedConversation.sessionId] ? (
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
                        color: colors.mutedText, 
                        textAlign: 'center', 
                        marginTop: '0.75rem',
                        margin: '0.75rem 0 0 0',
                        lineHeight: '1.4'
                      }}>
                        {aiActivatingUsers[selectedConversation.sessionId] 
                          ? 'AI is starting up for this visitor. Please wait 5 seconds before new messages.'
                          : userAIStatus.hasOwnProperty(selectedConversation.sessionId) 
                          ? (userAIStatus[selectedConversation.sessionId] 
                            ? 'AI will automatically respond to this visitor\'s messages'
                            : 'AI responses are disabled for this visitor')
                          : 'AI will automatically respond to this visitor\'s messages'
                        }
                      </p>
                    </div>
                  )}

                  {/* Reply Input Field */}
                  {selectedConversation && (
                    <div style={{ 
                      padding: '1rem',
                      backgroundColor: colors.secondaryBg,
                      borderTop: `1px solid ${colors.border}`
                    }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '0.75rem', 
                            fontWeight: '500', 
                            color: colors.secondaryText, 
                            marginBottom: '0.25rem' 
                          }}>
                            Reply as Support Agent
                          </label>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyPress={handleReplyKeyPress}
                            placeholder="Type your reply..."
                            rows="2"
                            disabled={isReplying}
                            style={{ 
                              width: '100%', 
                              padding: '0.75rem', 
                              border: `1px solid ${colors.border}`, 
                              borderRadius: '8px', 
                              fontSize: '0.875rem',
                              outline: 'none',
                              backgroundColor: colors.inputBg,
                              color: colors.primaryText,
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              minHeight: '44px'
                            }}
                          />
                        </div>
                        <button
                          onClick={sendReply}
                          disabled={!replyText.trim() || isReplying}
                          style={{
                            backgroundColor: (!replyText.trim() || isReplying) ? colors.mutedText : colors.brandBlue,
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: (!replyText.trim() || isReplying) ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            minHeight: '44px'
                          }}
                        >
                          {isReplying ? (
                            <>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <span>📤</span>
                              <span>Send</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div style={{ 
                        fontSize: '0.65rem', 
                        color: colors.mutedText, 
                        marginTop: '0.25rem' 
                      }}>
                        Press Enter to send • Shift+Enter for new line
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR - Website Analytics & Info */}
          <div style={{ 
            width: '300px',
            backgroundColor: colors.cardBg, 
            borderRadius: '0', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            right: '0',
            borderLeft: `1px solid ${colors.border}`,
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            transform: isRightSidebarCollapsed ? 'translateX(320px)' : 'translateX(0)',
            opacity: isRightSidebarCollapsed ? 0 : 1,
            zIndex: 1000
          }}>
            {/* Right Sidebar Header */}
            <div style={{ 
              backgroundColor: colors.success, 
              color: 'white', 
              padding: '1rem 1.5rem',
              borderRadius: '0'
            }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  onClick={() => window.location.href = '/instagram-comments'}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  title="Switch to Instagram"
                >
                  <i className="fab fa-instagram"></i>
                </button>
                
                <button
                  onClick={() => window.location.href = '/telegram-listener'}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  title="Switch to Telegram"
                >
                  <i className="fab fa-telegram"></i>
                </button>
                
                <button
                  onClick={() => window.location.href = '/whatsapp-receiver'}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  title="Switch to WhatsApp"
                >
                  <i className="fab fa-whatsapp"></i>
                </button>
                
                <button
                  onClick={() => window.location.href = '/messenger-webhook'}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  title="Switch to Messenger"
                >
                  <i className="fab fa-facebook-messenger"></i>
                </button>
              </div>
            </div>
            
            {/* Right Sidebar Content */}
            <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
              
              {/* Selected Website Info Section */}
              <div style={{ marginBottom: isWebsiteInfoCollapsed ? '0' : '2rem' }}>
                <h3 
                  onClick={() => setIsWebsiteInfoCollapsed(!isWebsiteInfoCollapsed)}
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: colors.primaryText, 
                    marginBottom: '1rem', 
                    borderBottom: `2px solid ${colors.border}`, 
                    paddingBottom: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                  }}
                >
                  <span>🌐 Selected Conversation</span>
                  <span style={{ 
                    transform: isWebsiteInfoCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '0.8rem',
                    color: colors.mutedText
                  }}>
                    ▼
                  </span>
                </h3>

                {/* Collapsible Content */}
                <div style={{
                  maxHeight: isWebsiteInfoCollapsed ? '0' : '2000px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  opacity: isWebsiteInfoCollapsed ? 0 : 1
                }}>
                
                  {selectedConversation ? (
                    <div style={{ backgroundColor: colors.inputBg, borderRadius: '8px', padding: '1rem', border: `1px solid ${colors.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          backgroundColor: colors.brandBlue,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          color: 'white',
                          fontWeight: 'bold',
                          marginRight: '0.75rem'
                        }}>
                          🌐
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '1rem', color: colors.primaryText }}>
                            {new URL(selectedConversation.websiteUrl).hostname}
                          </div>
                          <div style={{ color: colors.mutedText, fontSize: '0.875rem' }}>
                            {selectedConversation.messageCount} message{selectedConversation.messageCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.875rem', color: colors.mutedText, marginBottom: '0.5rem' }}>
                        Full URL:
                      </div>
                      <div style={{ 
                        backgroundColor: colors.cardBg,
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        fontSize: '0.75rem',
                        color: colors.primaryText,
                        wordBreak: 'break-all',
                        fontFamily: 'monospace'
                      }}>
                        {selectedConversation.websiteUrl}
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      textAlign: 'center', 
                      color: colors.mutedText,
                      padding: '2rem'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>
                        🌐
                      </div>
                      <p>Select a conversation to view details</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics Section */}
              <div style={{ marginBottom: isStatsCollapsed ? '0' : '2rem' }}>
                <h3 
                  onClick={() => setIsStatsCollapsed(!isStatsCollapsed)}
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: colors.primaryText, 
                    marginBottom: '1rem', 
                    borderBottom: `2px solid ${colors.border}`, 
                    paddingBottom: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                  }}
                >
                  <span>📊 Statistics</span>
                  <span style={{ 
                    transform: isStatsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '0.8rem',
                    color: colors.mutedText
                  }}>
                    ▼
                  </span>
                </h3>
                
                {/* Collapsible Content */}
                <div style={{
                  maxHeight: isStatsCollapsed ? '0' : '2000px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  opacity: isStatsCollapsed ? 0 : 1
                }}>
                
                  <div style={{ backgroundColor: colors.inputBg, borderRadius: '8px', padding: '1rem', border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{
                        backgroundColor: colors.cardBg,
                        padding: '1rem',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.brandBlue }}>
                          {conversations.length}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: colors.mutedText }}>
                          Active Conversations
                        </div>
                      </div>
                      
                      <div style={{
                        backgroundColor: colors.cardBg,
                        padding: '1rem',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.success }}>
                          {messages.length}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: colors.mutedText }}>
                          Total Messages
                        </div>
                      </div>

                      <div style={{
                        backgroundColor: colors.cardBg,
                        padding: '1rem',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: isActive ? colors.success : colors.error }}>
                          {isActive ? '🟢' : '🔴'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: colors.mutedText }}>
                          Widget Status
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Settings Section */}
              <div style={{ marginBottom: isAISettingsCollapsed ? '0' : '2rem' }}>
                <h3 
                  onClick={() => setIsAISettingsCollapsed(!isAISettingsCollapsed)}
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: colors.primaryText, 
                    marginBottom: '1rem', 
                    borderBottom: `2px solid ${colors.border}`, 
                    paddingBottom: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                  }}
                >
                  <span>🤖 AI Assistant Settings</span>
                  <span style={{ 
                    transform: isAISettingsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '0.8rem',
                    color: colors.mutedText
                  }}>
                    ▼
                  </span>
                </h3>

                {/* Collapsible Content */}
                <div style={{
                  maxHeight: isAISettingsCollapsed ? '0' : '2000px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  opacity: isAISettingsCollapsed ? 0 : 1
                }}>
                
                  <div style={{ backgroundColor: colors.inputBg, borderRadius: '8px', padding: '1rem', border: `1px solid ${colors.border}` }}>
                    {aiError && (
                      <div style={{ 
                        backgroundColor: colors.error + '20', 
                        color: colors.error, 
                        padding: '0.5rem', 
                        borderRadius: '4px', 
                        marginBottom: '1rem',
                        fontSize: '0.875rem'
                      }}>
                        {aiError}
                      </div>
                    )}

                    {/* AI Enable Toggle */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: colors.primaryText
                      }}>
                        <input
                          type="checkbox"
                          checked={aiConfig.aiEnabled}
                          onChange={(e) => setAiConfig({...aiConfig, aiEnabled: e.target.checked})}
                          style={{ transform: 'scale(1.2)' }}
                        />
                        Enable AI Assistant
                      </label>
                    </div>

                    {/* Auto Reply Toggle */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: colors.primaryText
                      }}>
                        <input
                          type="checkbox"
                          checked={aiConfig.autoReply}
                          onChange={(e) => setAiConfig({...aiConfig, autoReply: e.target.checked})}
                          disabled={!aiConfig.aiEnabled}
                          style={{ transform: 'scale(1.2)' }}
                        />
                        Auto Reply to Messages
                      </label>
                    </div>

                    {/* Claude API Key */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ 
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: colors.primaryText,
                        marginBottom: '0.5rem'
                      }}>
                        Claude API Key:
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="password"
                          value={aiConfig.apiKey}
                          onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            border: `1px solid ${colors.border}`,
                            backgroundColor: colors.cardBg,
                            color: colors.primaryText,
                            fontSize: '0.875rem',
                            fontFamily: 'monospace'
                          }}
                          placeholder="sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxx..."
                        />
                        {aiConfig.apiKey && (
                          <div style={{
                            position: 'absolute',
                            right: '0.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '0.75rem',
                            color: colors.success
                          }}>
                            🔐
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: colors.mutedText, marginTop: '0.25rem' }}>
                        Get your API key from <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" style={{ color: colors.brandBlue }}>console.anthropic.com</a>
                      </div>
                    </div>

                    {/* System Prompt */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ 
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: colors.primaryText,
                        marginBottom: '0.5rem'
                      }}>
                        System Prompt:
                      </label>
                      <textarea
                        value={aiConfig.systemPrompt}
                        onChange={(e) => setAiConfig({...aiConfig, systemPrompt: e.target.value})}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.cardBg,
                          color: colors.primaryText,
                          fontSize: '0.875rem',
                          resize: 'vertical'
                        }}
                        placeholder="Define how the AI should respond to visitors..."
                      />
                    </div>

                    {/* Knowledge Base */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ 
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: colors.primaryText,
                        marginBottom: '0.5rem'
                      }}>
                        Knowledge Base:
                      </label>
                      <textarea
                        value={aiConfig.knowledgeBase}
                        onChange={(e) => setAiConfig({...aiConfig, knowledgeBase: e.target.value})}
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.cardBg,
                          color: colors.primaryText,
                          fontSize: '0.875rem',
                          resize: 'vertical'
                        }}
                        placeholder="Add company information, FAQs, policies, etc..."
                      />
                    </div>

                    {/* Response Delay */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ 
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: colors.primaryText,
                        marginBottom: '0.5rem'
                      }}>
                        Response Delay: {aiConfig.responseDelay / 1000}s
                      </label>
                      <input
                        type="range"
                        min="1000"
                        max="10000"
                        step="500"
                        value={aiConfig.responseDelay}
                        onChange={(e) => setAiConfig({...aiConfig, responseDelay: parseInt(e.target.value)})}
                        style={{
                          width: '100%',
                          margin: '0.5rem 0'
                        }}
                      />
                      <div style={{ fontSize: '0.75rem', color: colors.mutedText }}>
                        How long to wait before AI responds (1-10 seconds)
                      </div>
                    </div>

                    {/* Connect Claude Button */}
                    <button
                      onClick={connectClaudeAPI}
                      disabled={isLoadingAI || !aiConfig.apiKey}
                      style={{
                        width: '100%',
                        backgroundColor: aiConfig.apiKey ? colors.brandBlue : colors.mutedText,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: (isLoadingAI || !aiConfig.apiKey) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      {isLoadingAI ? '⏳ Connecting...' : '🔗 Connect Claude API'}
                    </button>

                    {/* Save Button */}
                    <button
                      onClick={saveAIConfig}
                      disabled={isLoadingAI || !aiConfig.aiEnabled}
                      style={{
                        width: '100%',
                        backgroundColor: aiConfig.aiEnabled ? colors.success : colors.mutedText,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: aiConfig.aiEnabled ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {isLoadingAI ? '⏳ Saving...' : '💾 Save AI Settings'}
                    </button>

                    {/* API Key Warning */}
                    {aiConfig.aiEnabled && aiConfig.autoReply && !aiConfig.apiKey && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.5rem',
                        backgroundColor: colors.error + '20',
                        borderRadius: '4px',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: colors.error
                      }}>
                        ⚠️ API Key required for auto-reply functionality
                      </div>
                    )}

                    {/* AI Status */}
                    <div style={{ 
                      marginTop: '1rem',
                      padding: '0.5rem',
                      backgroundColor: aiConfig.aiEnabled && aiConfig.autoReply && aiConfig.apiKey ? colors.success + '20' : 
                                      aiConfig.aiEnabled && aiConfig.autoReply && !aiConfig.apiKey ? colors.error + '20' :
                                      aiConfig.aiEnabled ? colors.warning + '20' : colors.mutedText + '20',
                      borderRadius: '4px',
                      textAlign: 'center',
                      fontSize: '0.875rem',
                      color: aiConfig.aiEnabled && aiConfig.autoReply && aiConfig.apiKey ? colors.success : 
                             aiConfig.aiEnabled && aiConfig.autoReply && !aiConfig.apiKey ? colors.error :
                             aiConfig.aiEnabled ? colors.warning : colors.mutedText
                    }}>
                      Status: {
                        !aiConfig.aiEnabled ? '🔴 AI Disabled' :
                        !aiConfig.autoReply ? '🟡 AI Enabled (Manual Only)' :
                        !aiConfig.apiKey ? '🔴 API Key Required' :
                        '🟢 AI Auto-Reply Active'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: colors.primaryText, 
                    marginBottom: '1rem', 
                    borderBottom: `2px solid ${colors.border}`, 
                    paddingBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                  }}
                >
                  <span>⚡ Quick Actions</span>
                </h3>
                
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      backgroundColor: colors.brandBlue,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    🔄 Refresh Dashboard
                  </button>
                  
                  <button
                    onClick={copyEmbedCode}
                    style={{
                      backgroundColor: colors.success,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    📋 Copy Widget Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;