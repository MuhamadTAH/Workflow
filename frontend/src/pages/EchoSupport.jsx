import React from 'react';
import '../styles.css';
import './EchoSupport.css';

function EchoSupport() {
  return (
    <div className="echo-support-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">
              <i className="fa-solid fa-headset"></i>
              AI Chat Support Platform
            </h1>
            <p className="page-subtitle">
              Echo-Assets Customer Support & AI Chat System
            </p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="support-container">
          <div className="support-section">
            <h2>🤖 AI Chat Support Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">💬</div>
                <h3>Smart Chat Widget</h3>
                <p>Embeddable chat widget for your website with AI responses</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">📚</div>
                <h3>Knowledge Base</h3>
                <p>Upload FAQs, docs, and training data for accurate AI responses</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎤</div>
                <h3>Voice Support</h3>
                <p>VAPI integration for voice-based customer support</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⚡</div>
                <h3>Real-time Responses</h3>
                <p>Instant AI-powered responses using your business data</p>
              </div>
            </div>
          </div>

          <div className="support-section">
            <h2>🚀 Quick Actions</h2>
            <div className="actions-grid">
              <button 
                className="action-btn primary"
                onClick={() => window.open('/echo-assets/embed/demo.html', '_blank')}
              >
                <i className="fa-solid fa-play"></i>
                Launch Demo
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => alert('Knowledge Base Manager - Coming Soon!')}
              >
                <i className="fa-solid fa-book"></i>
                Manage Knowledge Base
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => alert('Widget Configurator - Coming Soon!')}
              >
                <i className="fa-solid fa-cog"></i>
                Configure Widget
              </button>
              <button 
                className="action-btn secondary"
                onClick={() => alert('Analytics Dashboard - Coming Soon!')}
              >
                <i className="fa-solid fa-chart-bar"></i>
                View Analytics
              </button>
            </div>
          </div>

          <div className="support-section">
            <h2>📋 Current Status</h2>
            <div className="status-grid">
              <div className="status-card">
                <div className="status-indicator active"></div>
                <div className="status-info">
                  <h4>Echo-Assets Platform</h4>
                  <p>Ready for integration</p>
                </div>
              </div>
              <div className="status-card">
                <div className="status-indicator pending"></div>
                <div className="status-info">
                  <h4>Knowledge Base</h4>
                  <p>Sample data loaded</p>
                </div>
              </div>
              <div className="status-card">
                <div className="status-indicator active"></div>
                <div className="status-info">
                  <h4>Chat Components</h4>
                  <p>UI components available</p>
                </div>
              </div>
              <div className="status-card">
                <div className="status-indicator pending"></div>
                <div className="status-info">
                  <h4>AI Integration</h4>
                  <p>Ready for configuration</p>
                </div>
              </div>
            </div>
          </div>

          <div className="support-section">
            <h2>🔧 Integration Options</h2>
            <div className="integration-options">
              <div className="option-card">
                <h3>Option 1: Standalone Platform</h3>
                <p>Use echo-assets as independent customer support system</p>
                <ul>
                  <li>Complete AI chat platform</li>
                  <li>Voice + text support</li>
                  <li>External AI integration</li>
                </ul>
              </div>
              <div className="option-card">
                <h3>Option 2: Workflow Integration</h3>
                <p>Combine with your existing chatbot trigger system</p>
                <ul>
                  <li>Smart routing</li>
                  <li>Local AI control</li>
                  <li>Unified dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EchoSupport;