import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import './AIAssistant.css';

function AIAssistant() {
  const { t } = useTranslation();
  
  // State management
  const [currentAssistantId] = useState(1);
  const [activeUserId, setActiveUserId] = useState('john');
  const [isAiActive, setIsAiActive] = useState(false);
  const [isHumanTakeoverActive, setIsHumanTakeoverActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([
    { filename: 'FAQ.pdf', size: 2.1 }, 
    { filename: 'Product_Guide.docx', size: 1.8 }
  ]);
  const [socket, setSocket] = useState(null);
  
  // API Configuration
  const API_BASE = 'http://localhost:3001/api';
  const WS_BASE = 'http://localhost:3001';
  
  // Mock users data
  const [users] = useState({
    'john': {
      name: 'John Doe',
      username: '@john_doe_123',
      avatar: 'https://placehold.co/64x64/e0e7ff/4f46e5?text=John',
      chatId: '123456789',
      userId: '987654321',
      language: 'en-US',
      lastMessage: 'How do I reset my password?',
      messages: [
        { from: 'user', text: 'How do I reset my password?' },
        { from: 'ai', text: 'To reset your password, please go to the login page and click on the "Forgot Password" link. We\'ll send you an email with instructions.' }
      ]
    },
    'sarah': {
      name: 'Sarah Miller',
      username: '@sarahm',
      avatar: 'https://placehold.co/64x64/fce7f3/db2777?text=Sarah',
      chatId: '112233445',
      userId: '554433221',
      language: 'en-GB',
      lastMessage: 'What are your support hours?',
      messages: [
        { from: 'user', text: 'What are your support hours?' },
        { from: 'ai', text: 'Our support hours are 9 AM to 5 PM, Monday to Friday.' }
      ]
    },
    'mike': {
      name: 'Mike Chen',
      username: '@mikechen',
      avatar: 'https://placehold.co/64x64/d1fae5/059669?text=Mike',
      chatId: '667788990',
      userId: '998877665',
      language: 'en-US',
      lastMessage: 'Do you ship internationally?',
      messages: [
        { from: 'user', text: 'Do you ship internationally?' }
      ]
    }
  });
  
  // Refs
  const conversationFeedRef = useRef(null);
  const messageInputRef = useRef(null);
  const systemPromptRef = useRef(null);
  
  // Template data
  const templates = {
    'customer-service': `You are a helpful customer service assistant for [Company Name].\n\nGuidelines:\n- Use the uploaded documents to answer questions accurately.\n- If you don't know something, say so politely.\n- Be professional and friendly.`,
    'tech-support': `You are a technical support specialist for [Product Name].\n\nGuidelines:\n- Provide step-by-step instructions from the knowledge base.\n- If a solution isn't found, create a support ticket.\n- Maintain a patient and clear tone.`,
    'sales': `You are a sales assistant for [Company Name].\n\nGuidelines:\n- Highlight product features and benefits.\n- Answer questions about pricing and availability.\n- Guide customers to the checkout page.`,
    'custom': ''
  };

  // Initialize component
  useEffect(() => {
    // Set default template
    applyTemplate('customer-service');
    
    // Set up authentication token
    localStorage.setItem('token', 'MOCK_TOKEN_FOR_TESTING_test-user-1');
    
    // Handle resize
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // API Functions
  const testTelegramToken = async () => {
    const token = document.getElementById('bot-token')?.value;
    if (!token) return;
    
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}/test-telegram`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ telegram_token: token })
      });
      
      const result = await response.json();
      updateTelegramStatus(result.success);
    } catch (error) {
      console.error('Telegram test failed:', error);
      updateTelegramStatus(false);
    }
  };

  const testAiApi = async () => {
    const apiKey = document.getElementById('api-key')?.value;
    if (!apiKey) return;
    
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}/test-ai-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ai_api_key: apiKey })
      });
      
      const result = await response.json();
      updateApiStatus(result.success);
    } catch (error) {
      console.error('AI API test failed:', error);
      updateApiStatus(false);
    }
  };

  const activateAI = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('AI activation failed:', error);
      return false;
    }
  };

  const deactivateAI = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}/deactivate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('AI deactivation failed:', error);
      return false;
    }
  };

  // Status update functions
  const updateTelegramStatus = (success) => {
    const statusEl = document.getElementById('telegram-status');
    if (statusEl) {
      statusEl.innerHTML = success 
        ? '<span class="status-dot status-connected"></span><span class="text-green-600">Connected</span>'
        : '<span class="status-dot status-not-connected"></span><span class="text-red-600">Failed</span>';
    }
  };

  const updateApiStatus = (success) => {
    const statusEl = document.getElementById('api-status');
    if (statusEl) {
      statusEl.innerHTML = success 
        ? '<span class="status-dot status-connected"></span><span class="text-green-600">Connected</span>'
        : '<span class="status-dot status-not-connected"></span><span class="text-red-600">Failed</span>';
    }
  };

  // Panel toggle function
  const togglePanel = (panelId) => {
    const content = document.getElementById(`${panelId}-content`);
    const icon = document.getElementById(`${panelId}-icon`);
    
    if (content && icon) {
      content.classList.toggle('collapsed');
      icon.classList.toggle('-rotate-180');
    }
  };

  // Template application
  const applyTemplate = (templateName) => {
    if (systemPromptRef.current) {
      systemPromptRef.current.value = templates[templateName];
      if (templateName === 'custom') {
        systemPromptRef.current.focus();
      }
    }
  };

  // AI Control functions
  const handleAiActivation = async () => {
    if (isAiActive) {
      await deactivateAI();
      setIsAiActive(false);
      if (!isHumanTakeoverActive) {
        // Update status to inactive
      }
    } else {
      const result = await activateAI();
      if (result) {
        setIsAiActive(true);
        setIsHumanTakeoverActive(false);
      }
    }
  };

  const handleHumanTakeover = () => {
    setIsHumanTakeoverActive(!isHumanTakeoverActive);
    if (!isHumanTakeoverActive) {
      setIsAiActive(false);
    }
  };

  // Message sending
  const sendManualMessage = () => {
    const messageText = messageInputRef.current?.value.trim();
    if (!messageText) return;
    
    const updatedUsers = { ...users };
    updatedUsers[activeUserId].messages.push({ from: 'human', text: messageText });
    updatedUsers[activeUserId].lastMessage = messageText;
    
    if (messageInputRef.current) {
      messageInputRef.current.value = '';
    }
    
    // Scroll to bottom
    setTimeout(() => {
      if (conversationFeedRef.current) {
        conversationFeedRef.current.scrollTop = conversationFeedRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendManualMessage();
    }
  };

  // File management
  const handleFileDelete = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
  };

  const handleFileUpload = () => {
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="ai-assistant-container">
      {/* Master Sidebar Toggle Button */}
      <button 
        className={`sidebar-master-toggle ${!isSidebarOpen ? 'sidebar-closed' : ''}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <i className={`fas ${isSidebarOpen ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
      </button>

      <div className="ai-assistant-layout">
        {/* Configuration Sidebar */}
        <aside className={`config-sidebar ${!isSidebarOpen ? 'sidebar-hidden' : ''}`}>
          <div className="sidebar-header">
            <h2 className="sidebar-title">Configuration</h2>
          </div>
          
          <div className="config-panels">
            {/* 1. Telegram Bot Configuration */}
            <div className="config-card">
              <div className="config-header" onClick={() => togglePanel('telegram-panel')}>
                <h3 className="config-title">
                  <i className="fas fa-paper-plane"></i>
                  1. Telegram Bot Setup
                </h3>
                <i id="telegram-panel-icon" className="fas fa-chevron-down panel-icon"></i>
              </div>
              <div id="telegram-panel-content" className="panel-content">
                <div className="form-group">
                  <label htmlFor="bot-token">Bot Token</label>
                  <input 
                    type="password" 
                    id="bot-token" 
                    className="form-input" 
                    placeholder="Enter your Telegram Bot Token"
                  />
                </div>
                <div className="form-actions">
                  <div className="button-group">
                    <button onClick={testTelegramToken} className="btn btn-primary">Test</button>
                    <button className="btn btn-secondary">Guide</button>
                  </div>
                  <div id="telegram-status" className="status-indicator">
                    <span className="status-dot status-not-connected"></span>
                    <span className="status-text">Offline</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. AI Model API Configuration */}
            <div className="config-card">
              <div className="config-header" onClick={() => togglePanel('model-panel')}>
                <h3 className="config-title">
                  <i className="fas fa-microchip"></i>
                  2. AI Model Settings
                </h3>
                <i id="model-panel-icon" className="fas fa-chevron-down panel-icon"></i>
              </div>
              <div id="model-panel-content" className="panel-content">
                <div className="form-group">
                  <label>Provider</label>
                  <div className="provider-buttons">
                    <button className="btn btn-primary">OpenAI</button>
                    <button className="btn btn-secondary">Claude</button>
                    <button className="btn btn-secondary">Custom</button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="api-key">API Key</label>
                  <input 
                    type="password" 
                    id="api-key" 
                    className="form-input" 
                    placeholder="sk-proj-..."
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="model">Model</label>
                  <select id="model" className="form-input">
                    <option>gpt-4o</option>
                    <option>gpt-4-turbo</option>
                    <option>gpt-3.5-turbo</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button onClick={testAiApi} className="btn btn-primary">Test API</button>
                  <div id="api-status" className="status-indicator">
                    <span className="status-dot status-not-connected"></span>
                    <span className="status-text">Offline</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. System Prompt Configuration */}
            <div className="config-card">
              <div className="config-header" onClick={() => togglePanel('prompt-panel')}>
                <h3 className="config-title">
                  <i className="fas fa-terminal"></i>
                  3. AI Behavior Instructions
                </h3>
                <i id="prompt-panel-icon" className="fas fa-chevron-down panel-icon"></i>
              </div>
              <div id="prompt-panel-content" className="panel-content">
                <textarea 
                  ref={systemPromptRef}
                  id="system-prompt" 
                  className="form-textarea" 
                  placeholder="Enter your system prompt here..."
                ></textarea>
                <div className="form-group">
                  <label>Templates:</label>
                  <div className="template-buttons">
                    <button className="btn btn-secondary btn-sm" onClick={() => applyTemplate('customer-service')}>Customer Service</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => applyTemplate('tech-support')}>Tech Support</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => applyTemplate('sales')}>Sales</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => applyTemplate('custom')}>Custom</button>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Knowledge Base Documents */}
            <div className="config-card">
              <div className="config-header" onClick={() => togglePanel('kb-panel')}>
                <h3 className="config-title">
                  <i className="fas fa-folder-open"></i>
                  4. Knowledge Base
                </h3>
                <i id="kb-panel-icon" className="fas fa-chevron-down panel-icon"></i>
              </div>
              <div id="kb-panel-content" className="panel-content">
                <div className="drop-zone" onClick={handleFileUpload}>
                  <i className="fas fa-cloud-upload-alt drop-icon"></i>
                  <p>Drop files or <span className="highlight">click</span></p>
                  <p className="file-types">PDF, DOCX, TXT, MD</p>
                  <input type="file" className="hidden-input" multiple accept=".pdf,.docx,.txt,.md" />
                </div>
                <div className="file-list">
                  <h4>Uploaded Files:</h4>
                  <ul className="files">
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className="file-item">
                        <div className="file-info">
                          <i className="fas fa-file-text"></i>
                          <span className="file-name" title={file.filename}>{file.filename}</span>
                        </div>
                        <button 
                          onClick={() => handleFileDelete(index)} 
                          className="delete-btn"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`main-content ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <div className="dashboard-grid">
            {/* Conversations List */}
            <div className="dashboard-card conversations-card">
              <h2 className="card-title">
                <i className="fas fa-users"></i>
                Conversations
              </h2>
              <div className="conversation-list">
                {Object.keys(users).map((userId) => {
                  const user = users[userId];
                  return (
                    <div 
                      key={userId}
                      className={`conversation-item ${userId === activeUserId ? 'active' : ''}`}
                      onClick={() => setActiveUserId(userId)}
                    >
                      <img src={user.avatar} alt={user.name} className="user-avatar" />
                      <div className="user-info">
                        <p className="user-name">{user.name}</p>
                        <p className="last-message">{user.lastMessage}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Conversation Monitor */}
            <div className="dashboard-card feed-card">
              <h2 className="card-title">
                <i className="fas fa-comments"></i>
                Live Feed
              </h2>
              <div ref={conversationFeedRef} className="conversation-feed">
                {users[activeUserId].messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.from}`}>
                    <p className="message-sender">
                      {msg.from === 'user' ? `👤 Customer (${users[activeUserId].name.split(' ')[0]})` :
                       msg.from === 'ai' ? '🤖 AI Assistant' : '👤 Human Agent'}
                    </p>
                    <div className={`message-bubble ${msg.from}`}>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Manual message input */}
              <div className="message-input-area">
                <div className="input-row">
                  <button className="btn btn-secondary btn-icon">
                    <i className="fas fa-microphone"></i>
                  </button>
                  <button className="btn btn-secondary btn-icon">
                    <i className="fas fa-image"></i>
                  </button>
                  <input 
                    ref={messageInputRef}
                    type="text" 
                    placeholder="Type a message to take over..." 
                    className="message-input"
                    onKeyDown={handleKeyDown}
                  />
                  <button onClick={sendManualMessage} className="btn btn-primary btn-icon">
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
                <div className="input-status">
                  <div className="auto-refresh">
                    <i className="fas fa-sync-alt rotating"></i>
                    <span>Auto-refresh: ON</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Controls and User Info */}
            <div className="controls-column">
              {/* User Information Panel */}
              <div className="dashboard-card user-card">
                <div className="config-header" onClick={() => togglePanel('user-panel')}>
                  <h3 className="config-title">
                    <i className="fas fa-user-circle"></i>
                    Current User Information
                  </h3>
                  <i id="user-panel-icon" className="fas fa-chevron-down panel-icon"></i>
                </div>
                <div id="user-panel-content" className="panel-content">
                  <div className="user-details">
                    <img src={users[activeUserId].avatar} alt="User Profile" className="profile-avatar" />
                    <div className="user-text">
                      <p className="profile-name">{users[activeUserId].name}</p>
                      <p className="profile-username">{users[activeUserId].username}</p>
                    </div>
                  </div>
                  <div className="user-meta">
                    <div className="meta-row">
                      <strong>Chat ID:</strong> <span>{users[activeUserId].chatId}</span>
                    </div>
                    <div className="meta-row">
                      <strong>User ID:</strong> <span>{users[activeUserId].userId}</span>
                    </div>
                    <div className="meta-row">
                      <strong>Language:</strong> <span>{users[activeUserId].language}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Control */}
              <div className="dashboard-card control-card">
                <h3 className="card-title">
                  <i className="fas fa-power-off"></i>
                  System Control
                </h3>
                <div className="control-buttons">
                  <button 
                    onClick={handleAiActivation}
                    className={`control-btn primary ${isAiActive ? 'active' : ''}`}
                  >
                    <i className={`fas ${isAiActive ? 'fa-pause-circle' : 'fa-rocket'}`}></i>
                    {isAiActive ? 'DEACTIVATE AI' : 'ACTIVATE AI'}
                  </button>
                  <button 
                    onClick={handleHumanTakeover}
                    className={`control-btn secondary ${isHumanTakeoverActive ? 'active' : ''}`}
                  >
                    <i className={`fas ${isHumanTakeoverActive ? 'fa-user-check' : 'fa-user-cog'}`}></i>
                    {isHumanTakeoverActive ? 'End Takeover' : 'Human Takeover'}
                  </button>
                </div>
                
                <div className="system-stats">
                  <div className="stat-row">
                    <span>Status:</span>
                    <div className="system-status">
                      <span className={`status-dot ${isAiActive ? 'status-active' : isHumanTakeoverActive ? 'status-active' : 'status-inactive'}`}></span>
                      <span className={isAiActive ? 'text-success' : isHumanTakeoverActive ? 'text-success' : 'text-danger'}>
                        {isAiActive ? 'Active' : isHumanTakeoverActive ? 'Human Control' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="stat-row">
                    <span>Conversations:</span>
                    <span className="stat-value">{Object.keys(users).length}</span>
                  </div>
                  <div className="stat-row">
                    <span>Success Rate:</span>
                    <span className="stat-value">89%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AIAssistant;