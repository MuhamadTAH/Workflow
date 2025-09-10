import React, { useState, useEffect, useRef } from 'react';
import './ChatWidget.css';

const ChatWidget = ({ 
  widgetId, 
  config = {
    position: 'bottom-right',
    primaryColor: '#007bff',
    welcomeMessage: 'Hello! How can we help you today?',
    placeholder: 'Type your message...',
    title: 'Chat with us'
  }
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (isOpen && !sessionId) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Create new chat session
      const response = await fetch(`/api/chat-widget/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetId })
      });
      
      const data = await response.json();
      if (data.success) {
        setSessionId(data.sessionId);
        connectWebSocket(data.sessionId);
        
        // Add welcome message
        if (config.welcomeMessage) {
          setMessages([{
            id: Date.now(),
            text: config.welcomeMessage,
            sender: 'bot',
            timestamp: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    }
  };

  const connectWebSocket = (sessionId) => {
    const wsUrl = `wss://workflow-lg9z.onrender.com/?sessionId=${sessionId}`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: data.message,
          sender: 'agent',
          timestamp: new Date()
        }]);
      } else if (data.type === 'typing') {
        setIsTyping(data.isTyping);
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
    };
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Send via WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        message: inputValue,
        sessionId
      }));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getPositionClass = () => {
    switch (config.position) {
      case 'bottom-left': return 'chat-widget-bottom-left';
      case 'bottom-right': return 'chat-widget-bottom-right';
      case 'top-left': return 'chat-widget-top-left';
      case 'top-right': return 'chat-widget-top-right';
      default: return 'chat-widget-bottom-right';
    }
  };

  return (
    <div className={`chat-widget ${getPositionClass()}`}>
      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window" style={{ '--primary-color': config.primaryColor }}>
          {/* Header */}
          <div className="chat-header" style={{ backgroundColor: config.primaryColor }}>
            <h3>{config.title}</h3>
            <button onClick={toggleChat} className="close-btn">×</button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div className="message-bubble">
                  {message.text}
                </div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="message agent">
                <div className="message-bubble typing">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={config.placeholder}
              rows="1"
            />
            <button 
              onClick={sendMessage} 
              disabled={!inputValue.trim()}
              style={{ backgroundColor: config.primaryColor }}
            >
              Send
            </button>
          </div>

          {/* Status */}
          <div className="chat-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '● Online' : '● Offline'}
            </span>
          </div>
        </div>
      )}

      {/* Chat Bubble */}
      <button 
        className="chat-bubble" 
        onClick={toggleChat}
        style={{ backgroundColor: config.primaryColor }}
      >
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
};

export default ChatWidget;