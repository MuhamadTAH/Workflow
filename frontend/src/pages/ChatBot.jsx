import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import LeftSidebar from '../components/LeftSidebar';

function ChatBot() {
  const { theme, colors } = useTheme();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Webhook integration will be added here
    // For now, we don't send any response
  };

  return (
    <>
      <LeftSidebar />
      <div 
        className="chat-page" 
        style={{
          backgroundColor: '#000000',
          minHeight: '100vh',
          marginLeft: '280px',
          position: 'relative'
        }}
      >
        {/* Chatbot Widget - Bottom Right */}
        <div 
          className="chatbot-widget"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000
          }}
        >
          {/* Chat Toggle Button */}
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.3s ease'
              }}
            >
              💬
            </button>
          )}

          {/* Chat Window */}
          {isOpen && (
            <div
              style={{
                width: '350px',
                height: '500px',
                backgroundColor: colors.secondaryBg,
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${colors.border}`
              }}
            >
              {/* Chat Header */}
              <div
                style={{
                  padding: '16px',
                  borderBottom: `1px solid ${colors.border}`,
                  backgroundColor: colors.primaryBg,
                  borderRadius: '12px 12px 0 0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: '#10b981'
                    }}
                  ></div>
                  <h4 style={{ color: colors.primaryText, margin: 0 }}>AI Assistant</h4>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.primaryText,
                    cursor: 'pointer',
                    fontSize: '20px',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Messages Container */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {messages.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      color: colors.secondaryText,
                      padding: '20px',
                      fontSize: '14px'
                    }}
                  >
                    Start a conversation with the AI assistant
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%'
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '18px',
                          backgroundColor: message.sender === 'user' ? '#6366f1' : colors.primaryBg,
                          color: message.sender === 'user' ? 'white' : colors.primaryText,
                          fontSize: '14px',
                          lineHeight: '1.4',
                          border: message.sender === 'bot' ? `1px solid ${colors.border}` : 'none'
                        }}
                      >
                        {message.text}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: colors.secondaryText,
                          marginTop: '4px',
                          textAlign: message.sender === 'user' ? 'right' : 'left'
                        }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '16px',
                  borderTop: `1px solid ${colors.border}`,
                  display: 'flex',
                  gap: '8px'
                }}
              >
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '20px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.primaryBg,
                    color: colors.primaryText,
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px'
                  }}
                >
                  ↗
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ChatBot;