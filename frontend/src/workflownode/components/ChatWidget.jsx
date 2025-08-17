/*
=================================================================
FILE: ChatWidget.jsx - Embedded Chat Interface
=================================================================
Floating chat widget that appears when Chat Trigger node is active
*/
import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api.js';

const ChatWidget = ({ nodeId, isVisible, chatTitle = "Chat Support" }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages when widget becomes visible
  useEffect(() => {
    if (isVisible && nodeId) {
      loadMessages();
    }
  }, [isVisible, nodeId]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-messages/${nodeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const newMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
      nodeId: nodeId
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send to backend
      const response = await fetch(`${API_BASE_URL}/api/webhooks/chat-trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          nodeId: nodeId,
          timestamp: newMessage.timestamp
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add bot response if provided
        if (data.response) {
          const botMessage = {
            id: Date.now() + 1,
            text: data.response,
            sender: 'bot',
            timestamp: new Date().toISOString(),
            nodeId: nodeId
          };
          setMessages(prev => [...prev, botMessage]);
        }
      } else {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`chat-widget ${isMinimized ? 'minimized' : ''}`}>
      {/* Widget Header */}
      <div className="chat-header">
        <div className="chat-title">
          <i className="fa-solid fa-comments"></i>
          <span>{chatTitle}</span>
        </div>
        <div className="chat-controls">
          <button 
            className="minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand chat" : "Minimize chat"}
          >
            <i className={`fa-solid ${isMinimized ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      {!isMinimized && (
        <div className="chat-content">
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <p>👋 Welcome! Send a message to start the conversation.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`message ${message.sender}`}>
                  <div className="message-content">
                    <span className="message-text">{message.text}</span>
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-input">
            <div className="input-container">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="message-input"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="send-button"
                title="Send message"
              >
                {isLoading ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-paper-plane"></i>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .chat-widget {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 350px;
          max-width: 90vw;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border: 1px solid #e1e5e9;
        }

        .chat-widget.minimized {
          height: 60px;
        }

        .chat-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 14px;
        }

        .chat-controls {
          display: flex;
          gap: 8px;
        }

        .minimize-btn {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .minimize-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .chat-content {
          height: 400px;
          display: flex;
          flex-direction: column;
        }

        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          max-height: 320px;
          background: #f8f9fa;
        }

        .welcome-message {
          text-align: center;
          color: #6c757d;
          padding: 20px;
          font-size: 14px;
        }

        .message {
          margin-bottom: 12px;
          display: flex;
        }

        .message.user {
          justify-content: flex-end;
        }

        .message.bot {
          justify-content: flex-start;
        }

        .message-content {
          max-width: 80%;
          padding: 8px 12px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
        }

        .message.user .message-content {
          background: #007bff;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message.bot .message-content {
          background: white;
          color: #333;
          border: 1px solid #e1e5e9;
          border-bottom-left-radius: 4px;
        }

        .message-text {
          display: block;
        }

        .message-time {
          display: block;
          font-size: 11px;
          opacity: 0.7;
          margin-top: 4px;
        }

        .chat-input {
          padding: 12px 16px;
          border-top: 1px solid #e1e5e9;
          background: white;
          border-radius: 0 0 12px 12px;
        }

        .input-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .message-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #e1e5e9;
          border-radius: 20px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .message-input:focus {
          border-color: #007bff;
        }

        .message-input:disabled {
          background: #f8f9fa;
          color: #6c757d;
        }

        .send-button {
          width: 36px;
          height: 36px;
          border: none;
          background: #007bff;
          color: white;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .send-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        /* Scrollbar styling */
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 3px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
      `}</style>
    </div>
  );
};

export default ChatWidget;