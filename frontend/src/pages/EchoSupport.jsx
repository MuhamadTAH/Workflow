import React, { useState, useEffect, useRef } from 'react';
import '../styles.css';
import './EchoSupport.css';

import API_BASE_URL from '../config/api';

// Load knowledge base data from backend
const loadKnowledgeBase = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/echo/knowledge-base`);
    if (response.ok) {
      const result = await response.json();
      return result.success ? result.data : { faq: [] };
    }
    throw new Error('Failed to fetch knowledge base');
  } catch (error) {
    console.error('Failed to load knowledge base:', error);
    // Fallback data if backend is unavailable
    return {
      faq: [
        {
          q: "How do I reset my password?",
          a: "To reset your password, go to the login page and click 'Forgot Password'. Enter your email and check for a reset link."
        },
        {
          q: "What are your pricing plans?", 
          a: "We offer Starter ($9.99/month), Professional ($29.99/month), and Enterprise (custom pricing) plans."
        },
        {
          q: "How do I contact support?",
          a: "You can reach our support team through this chat, email at support@example.com, or our help center."
        }
      ]
    };
  }
};

// AI response engine using backend
const generateAIResponse = async (message, sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/echo/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.success ? result.data.response : "I'm sorry, I couldn't generate a response right now.";
    }
    throw new Error('Failed to get AI response');
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I'm experiencing technical difficulties. Please try again or contact our support team at support@example.com for immediate assistance.";
  }
};

function EchoSupport() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hello! I'm your AI support assistant. How can I help you today?",
      from: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState({ faq: [] });
  const [sessionId] = useState(`echo_session_${Date.now()}`);
  const messagesEndRef = useRef(null);

  // Load knowledge base on component mount
  useEffect(() => {
    loadKnowledgeBase().then(setKnowledgeBase);
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      from: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Generate AI response
      const aiResponse = await generateAIResponse(inputMessage, sessionId);
      
      // Simulate typing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const assistantMessage = {
        id: Date.now() + 1,
        text: aiResponse,
        from: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble responding right now. Please try again or contact support@example.com.",
        from: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="echo-support-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">
              <i className="fa-solid fa-robot"></i>
              Echo-Assets AI Support Platform
            </h1>
            <p className="page-subtitle">
              Real AI-powered customer support chat system
            </p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="chat-container">
          {/* Live Chat Interface */}
          <div className="chat-section">
            <div className="chat-header">
              <div className="chat-title">
                <i className="fa-solid fa-comments"></i>
                Live AI Support Chat
              </div>
              <div className="chat-status">
                <span className="status-dot online"></span>
                AI Assistant Online
              </div>
            </div>
            
            <div className="chat-messages" id="chat-messages">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.from}`}>
                  <div className="message-avatar">
                    {message.from === 'user' ? (
                      <div className="user-avatar">U</div>
                    ) : (
                      <div className="ai-avatar">🤖</div>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{message.text}</div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="message assistant">
                  <div className="message-avatar">
                    <div className="ai-avatar">🤖</div>
                  </div>
                  <div className="message-content">
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

            <div className="chat-input-section">
              <div className="chat-input-container">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your account, billing, or features..."
                  rows="2"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="send-button"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Knowledge Base Panel */}
          <div className="knowledge-panel">
            <h3>💡 Quick Help</h3>
            <div className="quick-questions">
              {knowledgeBase.faq.slice(0, 3).map((item, index) => (
                <button 
                  key={index}
                  className="quick-question"
                  onClick={() => setInputMessage(item.q)}
                >
                  {item.q}
                </button>
              ))}
            </div>
            
            <div className="platform-stats">
              <h4>📊 Platform Status</h4>
              <div className="stat-item">
                <span className="status-dot online"></span>
                AI Response Engine: Online
              </div>
              <div className="stat-item">
                <span className="status-dot online"></span>
                Knowledge Base: {knowledgeBase.faq.length} entries loaded
              </div>
              <div className="stat-item">
                <span className="status-dot online"></span>
                Response Time: ~1.5s average
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EchoSupport;