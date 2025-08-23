import React, { useState, useEffect, useRef } from 'react';
import './EchoAssets.css';
import { authAPI } from '../api';

function EchoAssets() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Welcome to Echo-Assets Customer Support! I'm your AI assistant powered by real backend integration. How can I help you today?",
      from: 'assistant',
      timestamp: new Date()
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(`echo_${Date.now()}`);
  const [knowledgeBase, setKnowledgeBase] = useState({ faq: [], totalEntries: 0 });
  const [platformStats, setPlatformStats] = useState(null);
  const messagesEndRef = useRef(null);

  // Load knowledge base on mount
  useEffect(() => {
    loadKnowledgeBase();
    loadPlatformStats();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load real knowledge base from backend
  const loadKnowledgeBase = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/echo/knowledge-base`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setKnowledgeBase(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  };

  // Load platform stats from backend  
  const loadPlatformStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/echo/stats`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPlatformStats(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to load platform stats:', error);
    }
  };

  // Real AI response from backend
  const generateAIResponse = async (message) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/echo/chat`, {
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
        return result.success ? result.data.response : "I'm having trouble connecting to our AI service. Please try again.";
      }
      throw new Error('Failed to get AI response');
    } catch (error) {
      console.error('Error getting AI response:', error);
      return "I'm experiencing technical difficulties. Please contact our support team for immediate assistance.";
    }
  };

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
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // Get real AI response from backend
      const aiResponse = await generateAIResponse(currentMessage);
      
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
        text: "I'm sorry, our AI service is temporarily unavailable. Please contact our support team directly.",
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
    <div className="echo-assets-page">
      {/* Header */}
      <header className="echo-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo">🚀</div>
            <div className="brand-info">
              <h1>Echo-Assets</h1>
              <p>AI Customer Support Platform</p>
            </div>
          </div>
          <div className="status-indicator">
            <span className="status-dot online"></span>
            <span>{platformStats ? `${platformStats.status}` : 'AI Assistant Online'}</span>
          </div>
        </div>
      </header>

      <div className="echo-body">
        {/* Main Chat Area */}
        <div className="chat-section">
          <div className="chat-container">
            {/* Messages */}
            <div className="messages-area">
              {messages.map((message) => (
                <div key={message.id} className={`message ${message.from}`}>
                  <div className="message-avatar">
                    {message.from === 'user' ? (
                      <div className="user-avatar">👤</div>
                    ) : (
                      <div className="ai-avatar">🤖</div>
                    )}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {message.text.split('\n').map((line, i) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < message.text.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
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

            {/* Input Area */}
            <div className="input-section">
              <div className="input-container">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your account, billing, or technical support..."
                  rows="2"
                  disabled={isTyping}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="send-button"
                >
                  {isTyping ? '⏳' : '📨'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          {/* Quick Help */}
          <div className="quick-help">
            <h3>💡 Quick Help</h3>
            <div className="quick-questions">
              {knowledgeBase.faq.slice(0, 5).map((item, index) => (
                <button 
                  key={index}
                  className="quick-question"
                  onClick={() => setInputMessage(item.q)}
                >
                  {item.q}
                </button>
              ))}
              {knowledgeBase.faq.length === 0 && (
                <p className="no-data">Loading knowledge base...</p>
              )}
            </div>
          </div>
          
          {/* Platform Info */}
          <div className="platform-info">
            <h4>📊 Platform Status</h4>
            {platformStats ? (
              <>
                <div className="info-item">
                  <span className="status-dot online"></span>
                  <span>Status: {platformStats.status}</span>
                </div>
                <div className="info-item">
                  <span className="status-dot online"></span>
                  <span>Response Time: {platformStats.averageResponseTime}</span>
                </div>
                <div className="info-item">
                  <span className="status-dot online"></span>
                  <span>Knowledge Base: {platformStats.knowledgeBaseEntries} entries</span>
                </div>
                <div className="info-item">
                  <span className="status-dot online"></span>
                  <span>Uptime: {platformStats.uptime}</span>
                </div>
              </>
            ) : (
              <p className="no-data">Loading platform stats...</p>
            )}
          </div>

          {/* Features */}
          <div className="features-info">
            <h4>✨ Real Features</h4>
            <ul>
              <li>🤖 Real AI Backend Integration</li>
              <li>📚 Dynamic Knowledge Base</li>
              <li>🎤 VAPI Voice Support Ready</li>
              <li>👥 Human Agent Escalation</li>
              <li>📊 Real-time Platform Stats</li>
              <li>🔍 Smart Knowledge Search</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EchoAssets;