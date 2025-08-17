import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

const ChatWidget = ({ isVisible, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hello! I'm your workflow chatbot. Send me a message to test your Chat Trigger!",
      type: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // TODO Phase 2: Send to backend
    console.log('📤 Sending message to Chat Trigger:', inputMessage);

    // Simulate bot response for now
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        text: `I received: "${inputMessage}". Once you connect this to your workflow, I'll process it through your Chat Trigger!`,
        type: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);

    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isVisible) return null;

  return (
    <div className={`chat-widget ${isMinimized ? 'minimized' : ''}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <div className="chat-avatar">🤖</div>
          <div className="chat-info">
            <h4>Workflow Chatbot</h4>
            <span className="chat-status">● Connected</span>
          </div>
        </div>
        <div className="chat-controls">
          <button 
            className="control-btn minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? '▲' : '▼'}
          </button>
          <button 
            className="control-btn close-btn"
            onClick={onClose}
            title="Close Chat"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      {!isMinimized && (
        <>
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-bubble">
                  <div className="message-text">{message.text}</div>
                  <div className="message-time">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-input-container">
            <div className="chat-input-wrapper">
              <textarea
                className="chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                rows="1"
              />
              <button 
                className="send-btn"
                onClick={handleSendMessage}
                disabled={inputMessage.trim() === ''}
              >
                <span className="send-icon">➤</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatWidget;