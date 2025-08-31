import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const TelegramListener = () => {
  const [botToken, setBotToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [listenerId, setListenerId] = useState('');
  const [messages, setMessages] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sendMessage, setSendMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  
  // Configuration panel collapse states
  const [isBotConfigCollapsed, setIsBotConfigCollapsed] = useState(false);
  const [isClaudeConfigCollapsed, setIsClaudeConfigCollapsed] = useState(false);
  const [isSystemPromptCollapsed, setIsSystemPromptCollapsed] = useState(false);
  const [isPdfKnowledgeCollapsed, setIsPdfKnowledgeCollapsed] = useState(false);
  
  // Claude API states
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [claudeStatus, setClaudeStatus] = useState('');
  const [claudeConnectionStatus, setClaudeConnectionStatus] = useState('disconnected');
  const [isClaudeLoading, setIsClaudeLoading] = useState(false);
  
  // System prompt states
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful and friendly AI assistant. Respond to users in a professional yet warm manner.');
  const [isSystemPromptLoading, setIsSystemPromptLoading] = useState(false);
  const [systemPromptStatus, setSystemPromptStatus] = useState('');
  
  // PDF Knowledge Base states
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [hasKnowledgeBase, setHasKnowledgeBase] = useState(false);
  const [knowledgeBaseInfo, setKnowledgeBaseInfo] = useState(null);
  
  // Manual text input states
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBusinessInfo, setManualBusinessInfo] = useState('');
  const [isManualSaving, setIsManualSaving] = useState(false);
  const [manualInputStatus, setManualInputStatus] = useState('');

  const handleSetupWebhook = async () => {
    if (!botToken.trim()) {
      setStatus('❌ Please enter a bot token');
      return;
    }

    setIsLoading(true);
    setStatus('🔧 Setting up webhook...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          botToken: botToken.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus(`✅ Webhook setup successful!`);
        setWebhookUrl(result.webhookUrl);
        setListenerId(result.listenerId);
        setIsPolling(true);
        console.log('Webhook setup result:', result);
      } else {
        setStatus(`❌ Setup failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Webhook setup error:', error);
      setStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!botToken.trim()) {
      setStatus('❌ Please enter a bot token');
      return;
    }

    setIsLoading(true);
    setStatus('🗑️ Removing webhook...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          botToken: botToken.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('✅ Webhook deleted successfully!');
        setWebhookUrl('');
        setListenerId('');
        setIsPolling(false);
        setMessages([]);
        setSelectedUser(null);
      } else {
        setStatus(`❌ Delete failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Webhook delete error:', error);
      setStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for the current listener
  const fetchMessages = async () => {
    if (!listenerId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/messages/${listenerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.messages) {
          setMessages(result.messages);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Polling for new messages
  useEffect(() => {
    let interval;
    
    if (isPolling && listenerId) {
      // Initial fetch
      fetchMessages();
      
      // Set up polling every 2 seconds
      interval = setInterval(fetchMessages, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isPolling, listenerId]);

  // Check Claude connection status on mount
  useEffect(() => {
    checkClaudeConnectionStatus();
  }, []);

  const checkClaudeConnectionStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success) {
        setClaudeConnectionStatus(result.connected ? 'connected' : 'disconnected');
        if (result.connected) {
          setClaudeStatus('✅ Claude API is connected and ready');
        }
      }
    } catch (error) {
      console.error('Error checking Claude status:', error);
      setClaudeConnectionStatus('disconnected');
    }
  };

  const handleClaudeConnect = async () => {
    if (!claudeApiKey.trim()) {
      setClaudeStatus('❌ Please enter your Claude API key');
      return;
    }

    setIsClaudeLoading(true);
    setClaudeStatus('🔗 Connecting to Claude API...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          apiKey: claudeApiKey.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setClaudeStatus('✅ Successfully connected to Claude API!');
        setClaudeConnectionStatus('connected');
        setClaudeApiKey(''); // Clear for security
      } else {
        setClaudeStatus(`❌ Connection failed: ${result.error || 'Unknown error'}`);
        setClaudeConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Claude API connection error:', error);
      setClaudeStatus(`❌ Network error: ${error.message}`);
      setClaudeConnectionStatus('disconnected');
    } finally {
      setIsClaudeLoading(false);
    }
  };

  const handleClaudeDisconnect = async () => {
    setIsClaudeLoading(true);
    setClaudeStatus('🔌 Disconnecting from Claude API...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setClaudeStatus('✅ Successfully disconnected from Claude API');
        setClaudeConnectionStatus('disconnected');
        setClaudeApiKey('');
      } else {
        setClaudeStatus(`❌ Disconnect failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Claude API disconnect error:', error);
      setClaudeStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsClaudeLoading(false);
    }
  };

  // System prompt functions
  const handleSystemPromptSave = async () => {
    if (!systemPrompt.trim()) {
      setSystemPromptStatus('❌ Please enter a system prompt');
      return;
    }

    setIsSystemPromptLoading(true);
    setSystemPromptStatus('💾 Saving system prompt...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/system-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          systemPrompt: systemPrompt.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSystemPromptStatus('✅ System prompt saved successfully!');
        setTimeout(() => setSystemPromptStatus(''), 3000);
      } else {
        setSystemPromptStatus(`❌ Save failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('System prompt save error:', error);
      setSystemPromptStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsSystemPromptLoading(false);
    }
  };

  const loadSystemPrompt = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/system-prompt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success && result.systemPrompt) {
        setSystemPrompt(result.systemPrompt);
      }
    } catch (error) {
      console.error('Error loading system prompt:', error);
    }
  };

  // Load system prompt on mount
  useEffect(() => {
    loadSystemPrompt();
  }, []);

  const resetToDefaultPrompt = () => {
    setSystemPrompt('You are a helpful and friendly AI assistant. Respond to users in a professional yet warm manner.');
    setSystemPromptStatus('🔄 Reset to default prompt');
    setTimeout(() => setSystemPromptStatus(''), 2000);
  };

  // PDF Knowledge Base functions
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setUploadStatus('❌ Please select a PDF file only');
        setTimeout(() => setUploadStatus(''), 3000);
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setUploadStatus('❌ File size must be less than 10MB');
        setTimeout(() => setUploadStatus(''), 3000);
        return;
      }
      setSelectedFile(file);
      setUploadStatus(`📄 Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    }
  };

  const handleUploadPDF = async () => {
    if (!selectedFile) {
      setUploadStatus('❌ Please select a PDF file first');
      return;
    }

    setIsUploading(true);
    setUploadStatus('📤 Uploading and processing PDF...');

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await fetch(`${API_BASE_URL}/api/claude/upload-knowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadStatus('✅ PDF processed successfully! Knowledge base updated.');
        setHasKnowledgeBase(true);
        setKnowledgeBaseInfo({
          filename: selectedFile.name,
          uploadedAt: new Date().toISOString(),
          textLength: result.textLength || 0,
          pageCount: result.pageCount || 0
        });
        setSelectedFile(null);
        
        // Clear the file input
        const fileInput = document.getElementById('pdf-upload');
        if (fileInput) fileInput.value = '';
        
        setTimeout(() => setUploadStatus(''), 5000);
      } else {
        setUploadStatus(`❌ Upload failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      setUploadStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const loadKnowledgeBaseInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/knowledge-info`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success && result.hasKnowledge) {
        setHasKnowledgeBase(true);
        setKnowledgeBaseInfo(result.info);
      }
    } catch (error) {
      console.error('Error loading knowledge base info:', error);
    }
  };

  const handleDeleteKnowledge = async () => {
    if (!confirm('Are you sure you want to delete the current knowledge base? This cannot be undone.')) {
      return;
    }

    setIsUploading(true);
    setUploadStatus('🗑️ Deleting knowledge base...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/delete-knowledge`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setUploadStatus('✅ Knowledge base deleted successfully');
        setHasKnowledgeBase(false);
        setKnowledgeBaseInfo(null);
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        setUploadStatus(`❌ Delete failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete knowledge error:', error);
      setUploadStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Load knowledge base info on mount
  useEffect(() => {
    loadKnowledgeBaseInfo();
  }, []);

  // Manual business info functions
  const handleSaveManualInfo = async () => {
    if (!manualBusinessInfo.trim()) {
      setManualInputStatus('❌ Please enter your business information');
      return;
    }

    setIsManualSaving(true);
    setManualInputStatus('💾 Saving business information...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/manual-knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          businessInfo: manualBusinessInfo.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setManualInputStatus('✅ Business information saved successfully!');
        setHasKnowledgeBase(true);
        setKnowledgeBaseInfo({
          filename: 'Manual Input',
          uploadedAt: new Date().toISOString(),
          textLength: manualBusinessInfo.trim().length,
          pageCount: 1,
          method: 'manual-input'
        });
        setShowManualInput(false);
        setTimeout(() => setManualInputStatus(''), 3000);
      } else {
        setManualInputStatus(`❌ Save failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Manual info save error:', error);
      setManualInputStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsManualSaving(false);
    }
  };

  const loadBusinessTemplate = () => {
    const template = `BUSINESS DETAILS:
- Business Name: [Your business name]
- Business Type: [Restaurant, Store, Service, etc.]
- Address: [Your address]
- Phone: [Your phone number]
- Email: [Your email]

OPERATING HOURS:
- Monday: [Hours]
- Tuesday: [Hours]
- Wednesday: [Hours]
- Thursday: [Hours]
- Friday: [Hours]
- Saturday: [Hours]
- Sunday: [Hours]

SERVICES/PRODUCTS:
- [List your main services or products]
- [Include prices if relevant]
- [Special offers or features]

POLICIES:
- [Return/refund policy]
- [Payment methods accepted]
- [Special terms or conditions]

CONTACT & SOCIAL:
- Website: [Your website]
- Social Media: [Your social accounts]
- Additional Contact Methods: [Any other ways to reach you]`;

    setManualBusinessInfo(template);
    setManualInputStatus('📋 Template loaded! Please fill in your information.');
    setTimeout(() => setManualInputStatus(''), 3000);
  };

  // Get unique users from messages (exclude bot messages)
  const getUniqueUsers = () => {
    const usersMap = new Map();
    
    messages.forEach(message => {
      // Skip bot messages - don't show bot as a user
      if (message.isBotMessage || message.fromUserId === 'bot') {
        return;
      }
      
      const userId = message.fromUserId;
      if (!usersMap.has(userId)) {
        usersMap.set(userId, {
          userId: userId,
          chatId: message.chatId,
          fromName: message.fromName,
          fromUsername: message.fromUsername,
          lastMessage: message.text,
          lastMessageTime: message.date,
          messageCount: 1
        });
      } else {
        // Update message count and last message (only for user messages)
        const user = usersMap.get(userId);
        user.messageCount++;
        if (message.date > user.lastMessageTime) {
          user.lastMessage = message.text;
          user.lastMessageTime = message.date;
        }
      }
    });
    
    return Array.from(usersMap.values()).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
  };

  // Get messages for selected user (include both user messages and bot replies to that user)
  const getMessagesForUser = (userId) => {
    if (!selectedUser) return [];
    
    return messages.filter(message => 
      message.fromUserId === userId || 
      (message.isBotMessage && String(message.chatId) === String(selectedUser.chatId))
    ).sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort chronologically (oldest first)
  };

  const uniqueUsers = getUniqueUsers();
  const selectedUserMessages = selectedUser ? getMessagesForUser(selectedUser.userId) : [];

  // Handle sending message
  const handleSendMessage = async () => {
    if (!selectedUser || !sendMessage.trim() || !botToken.trim()) {
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          botToken: botToken,
          chatId: selectedUser.chatId,
          text: sendMessage
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSendMessage(''); // Clear the input
        // Refresh messages immediately to show the sent message
        fetchMessages();
      } else {
        alert(`❌ Failed to send message: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Send message error:', error);
      alert(`❌ Network error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '0' }}>
        {/* Fixed Toggle Buttons */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            left: isSidebarCollapsed ? '20px' : '400px',
            backgroundColor: '#3b82f6',
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
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
        >
          {isSidebarCollapsed ? '☰' : '✕'}
        </button>
        
        <button
          onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            right: isRightSidebarCollapsed ? '20px' : '300px',
            backgroundColor: '#10b981',
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
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          {isRightSidebarCollapsed ? '☰' : '✕'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
            <i className="fab fa-telegram" style={{ color: '#0088cc', marginRight: '0.5rem' }}></i>
            Telegram Bot Listener
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '0', alignItems: 'flex-start', position: 'relative' }}>
          
          {/* LEFT SIDEBAR - Sliding Configuration Panel */}
          <div style={{ 
            width: '400px',
            backgroundColor: '#f8fafc', 
            borderRadius: '0', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            left: '0',
            borderRight: '1px solid #e2e8f0',
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            transform: isSidebarCollapsed ? 'translateX(-420px)' : 'translateX(0)',
            opacity: isSidebarCollapsed ? 0 : 1,
            zIndex: 1000
          }}>
              {/* Sidebar Header */}
              <div style={{ 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                padding: '1rem 1.5rem',
                borderRadius: '0'
              }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center' }}>
                  ⚙️ Configuration Panel
                </h2>
              </div>
              
              {/* Sidebar Content */}
              <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
                
                {/* Bot Configuration Section */}
                <div style={{ marginBottom: isBotConfigCollapsed ? '0' : '2rem' }}>
                  <h3 
                    onClick={() => setIsBotConfigCollapsed(!isBotConfigCollapsed)}
                    style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      marginBottom: '1rem', 
                      borderBottom: '2px solid #e5e7eb', 
                      paddingBottom: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      userSelect: 'none'
                    }}
                  >
                    <span>🤖 Bot Configuration</span>
                    <span style={{ 
                      transform: isBotConfigCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '0.8rem',
                      color: '#6b7280'
                    }}>
                      ▼
                    </span>
                  </h3>
                  
                  {/* Collapsible Content */}
                  <div style={{
                    maxHeight: isBotConfigCollapsed ? '0' : '1000px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out',
                    opacity: isBotConfigCollapsed ? 0 : 1
                  }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Bot Token
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Enter your Telegram bot token (e.g., 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  fontSize: '1rem',
                  outline: 'none',
                  opacity: isLoading ? '0.5' : '1'
                }}
                disabled={isLoading}
              />
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Get your bot token from @BotFather on Telegram
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSetupWebhook}
                disabled={isLoading || !botToken.trim()}
                style={{ 
                  flex: '1',
                  backgroundColor: isLoading || !botToken.trim() ? '#9ca3af' : '#2563eb', 
                  color: 'white', 
                  padding: '0.75rem 1rem', 
                  border: 'none',
                  borderRadius: '6px', 
                  cursor: isLoading || !botToken.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {isLoading ? '⏳ Setting up...' : '🚀 Setup Webhook'}
              </button>
              
              <button
                onClick={handleDeleteWebhook}
                disabled={isLoading || !botToken.trim()}
                style={{ 
                  flex: '1',
                  backgroundColor: isLoading || !botToken.trim() ? '#9ca3af' : '#dc2626', 
                  color: 'white', 
                  padding: '0.75rem 1rem', 
                  border: 'none',
                  borderRadius: '6px', 
                  cursor: isLoading || !botToken.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {isLoading ? '⏳ Deleting...' : '🗑️ Delete Webhook'}
              </button>
            </div>

            {/* Status */}
            {status && (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '6px', 
                backgroundColor: status.includes('✅') ? '#f0fdf4' : status.includes('❌') ? '#fef2f2' : '#eff6ff',
                color: status.includes('✅') ? '#15803d' : status.includes('❌') ? '#dc2626' : '#1d4ed8'
              }}>
                {status}
              </div>
            )}

            {/* Webhook URL Display */}
            {webhookUrl && (
              <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '6px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Webhook URL
                </label>
                <code style={{ 
                  display: 'block', 
                  width: '100%', 
                  padding: '0.5rem', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '4px', 
                  fontSize: '0.875rem', 
                  wordBreak: 'break-all',
                  fontFamily: 'monospace'
                }}>
                  {webhookUrl}
                </code>
              </div>
            )}

            {/* Instructions */}
            <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '6px' }}>
              <h3 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '0.5rem' }}>📋 Instructions:</h3>
              <ol style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: '#1e40af', lineHeight: '1.5' }}>
                <li>Get a bot token from @BotFather on Telegram</li>
                <li>Paste the token above and click "Setup Webhook"</li>
                <li>Send messages to your bot - they'll appear in the conversations panel below</li>
                <li>Messages are updated automatically every 2 seconds</li>
              </ol>
            </div>
                  </div> {/* End Collapsible Content */}
                </div>

                {/* Claude AI Configuration Section */}
                <div style={{ marginBottom: isClaudeConfigCollapsed ? '0' : '2rem' }}>
                  <h3 
                    onClick={() => setIsClaudeConfigCollapsed(!isClaudeConfigCollapsed)}
                    style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      marginBottom: '1rem', 
                      borderBottom: '2px solid #e5e7eb', 
                      paddingBottom: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      userSelect: 'none'
                    }}
                  >
                    <span>🤖 Claude AI Configuration</span>
                    <span style={{ 
                      transform: isClaudeConfigCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '0.8rem',
                      color: '#6b7280'
                    }}>
                      ▼
                    </span>
                  </h3>

                  {/* Collapsible Content */}
                  <div style={{
                    maxHeight: isClaudeConfigCollapsed ? '0' : '2000px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                    opacity: isClaudeConfigCollapsed ? 0 : 1
                  }}>
                    <div>

                      {/* Claude Connection Status */}
                      <div style={{
                        padding: '1rem',
                borderRadius: '8px',
                backgroundColor: claudeConnectionStatus === 'connected' ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${claudeConnectionStatus === 'connected' ? '#bbf7d0' : '#fecaca'}`,
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: claudeConnectionStatus === 'connected' ? '#10b981' : '#ef4444',
                    marginRight: '0.75rem'
                  }}></div>
                  <span style={{
                    fontWeight: '500',
                    color: claudeConnectionStatus === 'connected' ? '#065f46' : '#991b1b'
                  }}>
                    {claudeConnectionStatus === 'connected' ? 'Connected to Claude API' : 'Not Connected'}
                  </span>
                </div>
              </div>

              {/* Claude API Key Input */}
              {claudeConnectionStatus === 'disconnected' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Claude API Key
                  </label>
                  <input
                    type="password"
                    value={claudeApiKey}
                    onChange={(e) => setClaudeApiKey(e.target.value)}
                    placeholder="Enter your Claude API key (sk-ant-...)"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      outline: 'none',
                      opacity: isClaudeLoading ? '0.5' : '1'
                    }}
                    disabled={isClaudeLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !isClaudeLoading) {
                        handleClaudeConnect();
                      }
                    }}
                  />
                  <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Anthropic Console</a>
                  </p>
                </div>
              )}

              {/* Claude Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {claudeConnectionStatus === 'disconnected' ? (
                  <button
                    onClick={handleClaudeConnect}
                    disabled={isClaudeLoading || !claudeApiKey.trim()}
                    style={{
                      flex: '1',
                      backgroundColor: isClaudeLoading || !claudeApiKey.trim() ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isClaudeLoading || !claudeApiKey.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {isClaudeLoading ? '⏳ Connecting...' : '🔗 Connect to Claude'}
                  </button>
                ) : (
                  <button
                    onClick={handleClaudeDisconnect}
                    disabled={isClaudeLoading}
                    style={{
                      flex: '1',
                      backgroundColor: isClaudeLoading ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isClaudeLoading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {isClaudeLoading ? '⏳ Disconnecting...' : '🔌 Disconnect'}
                  </button>
                )}
              </div>

              {/* Claude Status Message */}
              {claudeStatus && (
                <div style={{
                  padding: '1rem',
                  borderRadius: '6px',
                  backgroundColor: claudeStatus.includes('✅') ? '#f0fdf4' : claudeStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
                  color: claudeStatus.includes('✅') ? '#15803d' : claudeStatus.includes('❌') ? '#dc2626' : '#1d4ed8',
                  fontSize: '0.875rem',
                  marginBottom: '1rem'
                }}>
                  {claudeStatus}
                </div>
              )}

              {/* Claude Instructions */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '1rem',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}>
                <h4 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '0.5rem', margin: 0 }}>
                  🔧 Claude AI Integration:
                </h4>
                <p style={{ color: '#1e40af', lineHeight: '1.5', margin: '0.5rem 0 0 0' }}>
                  Connect Claude AI to enable intelligent auto-responses to your Telegram messages. 
                  Once connected, you can process messages with AI assistance and generate automated replies.
                </p>
              </div>
                    </div>
                  </div> {/* End Collapsible Content */}
                </div>

                {/* System Prompt Configuration Section */}
                <div style={{ marginBottom: isSystemPromptCollapsed ? '0' : '2rem' }}>
                  <h3 
                    onClick={() => setIsSystemPromptCollapsed(!isSystemPromptCollapsed)}
                    style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      marginBottom: '1rem', 
                      borderBottom: '2px solid #e5e7eb', 
                      paddingBottom: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      userSelect: 'none'
                    }}
                  >
                    <span>🎭 System Prompt</span>
                    <span style={{ 
                      transform: isSystemPromptCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '0.8rem',
                      color: '#6b7280'
                    }}>
                      ▼
                    </span>
                  </h3>

                  {/* Collapsible Content */}
                  <div style={{
                    maxHeight: isSystemPromptCollapsed ? '0' : '2000px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                    opacity: isSystemPromptCollapsed ? 0 : 1
                  }}>
                    <div>

                      {/* System Prompt Configuration Content */}
                      <div style={{ opacity: claudeConnectionStatus === 'connected' ? 1 : 0.6 }}>
              {claudeConnectionStatus !== 'connected' && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: '1px solid #fecaca'
                }}>
                  <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>
                    ⚠️ Connect to Claude API first to configure system prompt
                  </p>
                </div>
              )}

                {/* System Prompt Description */}
                <div style={{
                  backgroundColor: '#eff6ff',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.875rem'
                }}>
                  <p style={{ color: '#1e40af', lineHeight: '1.5', margin: 0 }}>
                    <strong>🎯 System Prompt:</strong> Define how Claude should behave and respond to users. 
                    This sets the personality and behavior for all AI responses.
                  </p>
                </div>

                {/* System Prompt Text Area */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    System Prompt
                  </label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Enter how Claude should behave (e.g., You are a professional customer service assistant...)"
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: '100px',
                      maxHeight: '300px',
                      fontFamily: 'inherit',
                      lineHeight: '1.5',
                      opacity: isSystemPromptLoading ? '0.5' : '1'
                    }}
                    disabled={isSystemPromptLoading}
                  />
                  <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    Character count: {systemPrompt.length}/2000
                  </p>
                </div>

                {/* System Prompt Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <button
                    onClick={handleSystemPromptSave}
                    disabled={isSystemPromptLoading || !systemPrompt.trim() || systemPrompt.length > 2000}
                    style={{
                      flex: '1',
                      backgroundColor: isSystemPromptLoading || !systemPrompt.trim() || systemPrompt.length > 2000 ? '#9ca3af' : '#10b981',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isSystemPromptLoading || !systemPrompt.trim() || systemPrompt.length > 2000 ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    {isSystemPromptLoading ? '⏳ Saving...' : '💾 Save System Prompt'}
                  </button>
                  
                  <button
                    onClick={resetToDefaultPrompt}
                    disabled={isSystemPromptLoading}
                    style={{
                      flex: '0 0 auto',
                      backgroundColor: isSystemPromptLoading ? '#9ca3af' : '#6b7280',
                      color: 'white',
                      padding: '0.75rem 1rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isSystemPromptLoading ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    🔄 Reset to Default
                  </button>
                </div>

                {/* System Prompt Status Message */}
                {systemPromptStatus && (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '6px',
                    backgroundColor: systemPromptStatus.includes('✅') ? '#f0fdf4' : systemPromptStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
                    color: systemPromptStatus.includes('✅') ? '#15803d' : systemPromptStatus.includes('❌') ? '#dc2626' : '#1d4ed8',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}>
                    {systemPromptStatus}
                  </div>
                )}

                {/* Example System Prompts */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}>
                  <h4 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>
                    💡 Example System Prompts:
                  </h4>
                  <div style={{ color: '#1e40af', lineHeight: '1.5' }}>
                    <div style={{ marginBottom: '0.5rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '3px' }} 
                         onClick={() => setSystemPrompt('You are a professional customer service assistant. Be helpful, polite, and always try to solve the customer\'s problem. Ask clarifying questions when needed.')}>
                      <strong>📞 Customer Service:</strong> "You are a professional customer service assistant..."
                    </div>
                    <div style={{ marginBottom: '0.5rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '3px' }} 
                         onClick={() => setSystemPrompt('You are a friendly and casual chatbot. Use emojis, be conversational, and make users feel comfortable. Keep responses short and engaging.')}>
                      <strong>😊 Friendly Chat:</strong> "You are a friendly and casual chatbot..."
                    </div>
                    <div style={{ marginBottom: '0.5rem', cursor: 'pointer', padding: '0.25rem', borderRadius: '3px' }} 
                         onClick={() => setSystemPrompt('You are a sales expert. Your goal is to understand customer needs and recommend our products. Be persuasive but not pushy. Always highlight benefits.')}>
                      <strong>💼 Sales Assistant:</strong> "You are a sales expert..."
                    </div>
                    <div style={{ cursor: 'pointer', padding: '0.25rem', borderRadius: '3px' }} 
                         onClick={() => setSystemPrompt('You are a technical support specialist. Ask detailed questions to diagnose issues. Provide step-by-step solutions. Be patient and clear in your explanations.')}>
                      <strong>🔧 Tech Support:</strong> "You are a technical support specialist..."
                    </div>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', margin: '0.5rem 0 0 0' }}>
                    💡 Click on any example to use it as your system prompt
                  </p>
                </div>
                      </div>
                    </div>
                  </div> {/* End Collapsible Content */}
                </div>

                {/* PDF Knowledge Base Section */}
                <div style={{ marginBottom: isPdfKnowledgeCollapsed ? '0' : '2rem' }}>
                  <h3 
                    onClick={() => setIsPdfKnowledgeCollapsed(!isPdfKnowledgeCollapsed)}
                    style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: '#1f2937', 
                      marginBottom: '1rem', 
                      borderBottom: '2px solid #e5e7eb', 
                      paddingBottom: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      userSelect: 'none'
                    }}
                  >
                    <span>📄 PDF Knowledge Base</span>
                    <span style={{ 
                      transform: isPdfKnowledgeCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '0.8rem',
                      color: '#6b7280'
                    }}>
                      ▼
                    </span>
                  </h3>

                  {/* Collapsible Content */}
                  <div style={{
                    maxHeight: isPdfKnowledgeCollapsed ? '0' : '2000px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                    opacity: isPdfKnowledgeCollapsed ? 0 : 1
                  }}>
                    <div>

                      {/* PDF Knowledge Base Content */}
                      <div style={{ opacity: claudeConnectionStatus === 'connected' ? 1 : 0.6 }}>
              {claudeConnectionStatus !== 'connected' && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: '1px solid #fecaca'
                }}>
                  <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>
                    ⚠️ Connect to Claude API first to upload knowledge base
                  </p>
                </div>
              )}

                {/* Knowledge Base Description */}
                <div style={{
                  backgroundColor: '#fef3c7',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  fontSize: '0.875rem',
                  border: '1px solid #fbbf24'
                }}>
                  <p style={{ color: '#92400e', lineHeight: '1.5', margin: 0 }}>
                    <strong>📚 Knowledge Base:</strong> Upload a PDF with your business information, services, location details, etc. 
                    Claude will use this information to answer specific questions about your business accurately.
                  </p>
                </div>

                {/* Current Knowledge Base Status */}
                {hasKnowledgeBase && knowledgeBaseInfo && (
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    padding: '1rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    border: '1px solid #bbf7d0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ color: '#15803d', margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
                          ✅ Active Knowledge Base
                        </h4>
                        <p style={{ color: '#166534', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                          📄 {knowledgeBaseInfo.filename}
                        </p>
                        <p style={{ color: '#166534', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                          📊 {knowledgeBaseInfo.pageCount} pages • {knowledgeBaseInfo.textLength} characters
                        </p>
                        <p style={{ color: '#166534', fontSize: '0.75rem', margin: '0.25rem 0 0 0' }}>
                          🕐 Uploaded: {new Date(knowledgeBaseInfo.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={handleDeleteKnowledge}
                        disabled={isUploading}
                        style={{
                          backgroundColor: isUploading ? '#9ca3af' : '#ef4444',
                          color: 'white',
                          padding: '0.5rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isUploading ? 'not-allowed' : 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* File Upload Section */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    {hasKnowledgeBase ? 'Replace Knowledge Base' : 'Upload PDF Knowledge Base'}
                  </label>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px dashed #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: '#f9fafb',
                          cursor: isUploading ? 'not-allowed' : 'pointer',
                          opacity: isUploading ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        PDF files only • Max 10MB • Will be processed and text extracted
                      </p>
                    </div>
                    
                    <button
                      onClick={handleUploadPDF}
                      disabled={isUploading || !selectedFile}
                      style={{
                        backgroundColor: isUploading || !selectedFile ? '#9ca3af' : '#2563eb',
                        color: 'white',
                        padding: '0.75rem 1rem',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isUploading || !selectedFile ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isUploading ? '⏳ Processing...' : '📤 Upload PDF'}
                    </button>
                  </div>
                </div>

                {/* Upload Status Message */}
                {uploadStatus && (
                  <div style={{
                    padding: '1rem',
                    borderRadius: '6px',
                    backgroundColor: uploadStatus.includes('✅') ? '#f0fdf4' : uploadStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
                    color: uploadStatus.includes('✅') ? '#15803d' : uploadStatus.includes('❌') ? '#dc2626' : '#1d4ed8',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}>
                    {uploadStatus}
                  </div>
                )}

                {/* Manual Input Alternative */}
                <div style={{
                  backgroundColor: '#fff7ed',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: '1px solid #fed7aa'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: '#c2410c', margin: 0, fontSize: '0.875rem', fontWeight: '600' }}>
                      ✏️ Alternative: Manual Input
                    </h4>
                    <button
                      onClick={() => setShowManualInput(!showManualInput)}
                      style={{
                        backgroundColor: '#ea580c',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      {showManualInput ? '📁 Hide Manual Input' : '✏️ Enter Business Info Manually'}
                    </button>
                  </div>
                  <p style={{ color: '#c2410c', fontSize: '0.75rem', margin: 0 }}>
                    If PDF upload fails or you prefer to enter information directly, use manual input below.
                  </p>
                </div>

                {/* Manual Input Section */}
                {showManualInput && (
                  <div style={{
                    backgroundColor: '#fefefe',
                    padding: '1.5rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    border: '2px solid #e5e7eb'
                  }}>
                    <h4 style={{ color: '#1f2937', margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
                      ✏️ Manual Business Information Entry
                    </h4>

                    {/* Manual Input Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={loadBusinessTemplate}
                        disabled={isManualSaving}
                        style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '0.5rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        📋 Load Template
                      </button>
                      
                      <button
                        onClick={() => setManualBusinessInfo('')}
                        disabled={isManualSaving}
                        style={{
                          backgroundColor: '#6b7280',
                          color: 'white',
                          padding: '0.5rem 0.75rem',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        🗑️ Clear
                      </button>
                    </div>

                    {/* Manual Input Textarea */}
                    <textarea
                      value={manualBusinessInfo}
                      onChange={(e) => setManualBusinessInfo(e.target.value)}
                      placeholder="Enter your business information here... (business name, hours, services, contact info, etc.)"
                      rows={12}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        resize: 'vertical',
                        minHeight: '200px',
                        maxHeight: '400px',
                        opacity: isManualSaving ? '0.5' : '1'
                      }}
                      disabled={isManualSaving}
                    />
                    
                    <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      Character count: {manualBusinessInfo.length} • Enter detailed information about your business
                    </p>

                    {/* Manual Input Actions */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button
                        onClick={handleSaveManualInfo}
                        disabled={isManualSaving || !manualBusinessInfo.trim()}
                        style={{
                          flex: '1',
                          backgroundColor: isManualSaving || !manualBusinessInfo.trim() ? '#9ca3af' : '#2563eb',
                          color: 'white',
                          padding: '0.75rem 1rem',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: isManualSaving || !manualBusinessInfo.trim() ? 'not-allowed' : 'pointer',
                          fontSize: '1rem',
                          fontWeight: '500'
                        }}
                      >
                        {isManualSaving ? '⏳ Saving...' : '💾 Save Business Information'}
                      </button>
                    </div>

                    {/* Manual Input Status */}
                    {manualInputStatus && (
                      <div style={{
                        padding: '1rem',
                        borderRadius: '6px',
                        backgroundColor: manualInputStatus.includes('✅') ? '#f0fdf4' : manualInputStatus.includes('❌') ? '#fef2f2' : '#eff6ff',
                        color: manualInputStatus.includes('✅') ? '#15803d' : manualInputStatus.includes('❌') ? '#dc2626' : '#1d4ed8',
                        fontSize: '0.875rem',
                        marginTop: '1rem'
                      }}>
                        {manualInputStatus}
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}>
                  <h4 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>
                    💡 How Knowledge Base Works:
                  </h4>
                  <ul style={{ color: '#1e40af', lineHeight: '1.5', margin: '0', paddingLeft: '1.2rem' }}>
                    <li><strong>Upload your PDF</strong> - Business info, menu, services, FAQ, etc.</li>
                    <li><strong>Automatic processing</strong> - Text is extracted and stored</li>
                    <li><strong>Smart responses</strong> - Claude references your PDF for accurate answers</li>
                    <li><strong>Context-aware</strong> - Generic questions use normal AI, specific questions use your data</li>
                  </ul>
                  
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#e0f2fe', borderRadius: '4px' }}>
                    <p style={{ color: '#0277bd', fontSize: '0.75rem', margin: 0 }}>
                      <strong>Example:</strong> User asks "What are your opening hours?" → Claude checks your PDF → Responds with your actual hours!
                    </p>
                  </div>
                </div>
            </div>
                </div>
                
              </div>
            </div>
          
          {/* MIDDLE COLUMN - Chat Interface */}
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
            backgroundColor: '#fafafa',
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            zIndex: 999,
            overflowY: 'auto'
          }}>

            {/* Two Panel Layout */}
            <div style={{
              opacity: isPolling ? 1 : 0.6
            }}>
              {!isPolling && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: '1px solid #fecaca'
                }}>
                  <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>
                    ⚠️ Setup and activate webhook first to start receiving messages
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0', height: '500px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                
                {/* Users Panel */}
                <div style={{ 
                  flex: '0 0 300px', 
                  backgroundColor: '#f8fafc', 
                  padding: '1rem', 
                  borderRight: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>
                      👥 Users
                      {isPolling && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: '#10b981',
                          backgroundColor: '#d1fae5',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          🟢 Live
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {uniqueUsers.length} user{uniqueUsers.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: 'white', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {uniqueUsers.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
                        <p>No users yet. Send a message to your bot!</p>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem' }}>
                        {uniqueUsers.map((user, index) => (
                          <div
                            key={user.userId}
                            onClick={() => setSelectedUser(user)}
                            style={{
                              padding: '0.75rem',
                              marginBottom: '0.5rem',
                              backgroundColor: selectedUser?.userId === user.userId ? '#eff6ff' : '#f9fafb',
                              borderRadius: '6px',
                              border: selectedUser?.userId === user.userId ? '2px solid #3b82f6' : '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#3b82f6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '0.75rem',
                                fontSize: '1rem',
                                color: 'white',
                                fontWeight: 'bold'
                              }}>
                                {user.fromName ? user.fromName[0].toUpperCase() : 'U'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500', fontSize: '0.875rem', color: '#111827' }}>
                                  {user.fromName || 'Unknown User'}
                                  {user.fromUsername && (
                                    <span style={{ color: '#6b7280', fontWeight: 'normal', fontSize: '0.75rem' }}>
                                      {' '}@{user.fromUsername}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                  {user.messageCount} message{user.messageCount !== 1 ? 's' : ''}
                                </div>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#9ca3af',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {user.lastMessage || 'No text'}
                                </div>
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
                  flex: '1', 
                  backgroundColor: '#f8fafc', 
                  padding: '1rem', 
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>
                      💬 Messages
                      {selectedUser && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: '#3b82f6',
                          backgroundColor: '#eff6ff',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {selectedUser.fromName}
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {selectedUser ? selectedUserMessages.length : 0} message{(selectedUser ? selectedUserMessages.length : 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Messages Area */}
                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: 'white', 
                    borderRadius: '4px 4px 0 0',
                    border: '1px solid #e5e7eb',
                    borderBottom: 'none'
                  }}>
                    {!selectedUser ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👈</div>
                        <p>Select a user to view their messages</p>
                      </div>
                    ) : selectedUserMessages.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                        <p>No messages from this user yet</p>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedUserMessages.map((message, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              justifyContent: message.isBotMessage ? 'flex-start' : 'flex-end',
                              marginBottom: '0.25rem'
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '75%',
                                padding: '0.75rem 1rem',
                                borderRadius: message.isBotMessage ? '1rem 1rem 1rem 0.25rem' : '1rem 1rem 0.25rem 1rem',
                                backgroundColor: message.isBotMessage ? '#3b82f6' : '#e5e7eb',
                                color: message.isBotMessage ? 'white' : '#111827',
                                wordWrap: 'break-word',
                                position: 'relative'
                              }}
                            >
                              <div style={{
                                fontSize: '0.875rem',
                                lineHeight: '1.4'
                              }}>
                                {message.text || '<No text>'}
                              </div>
                              <div style={{ 
                                fontSize: '0.65rem', 
                                opacity: 0.7,
                                marginTop: '0.25rem',
                                textAlign: message.isBotMessage ? 'left' : 'right'
                              }}>
                                {new Date(message.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Input Bar */}
                  {selectedUser && (
                    <div style={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderTop: 'none',
                      borderRadius: '0 0 4px 4px',
                      padding: '1rem',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-end'
                    }}>
                      <div style={{ flex: 1 }}>
                        <textarea
                          value={sendMessage}
                          onChange={(e) => setSendMessage(e.target.value)}
                          placeholder={`Type a message to ${selectedUser.fromName}...`}
                          style={{
                            width: '100%',
                            minHeight: '40px',
                            maxHeight: '120px',
                            padding: '0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            resize: 'none',
                            outline: 'none',
                            fontFamily: 'inherit',
                            lineHeight: '1.4'
                          }}
                          disabled={isSending}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              if (sendMessage.trim() && !isSending) {
                                handleSendMessage();
                              }
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={isSending || !sendMessage.trim()}
                        style={{
                          backgroundColor: isSending || !sendMessage.trim() ? '#9ca3af' : '#3b82f6',
                          color: 'white',
                          padding: '0.75rem',
                          border: 'none',
                          borderRadius: '50%',
                          fontSize: '1rem',
                          cursor: isSending || !sendMessage.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '40px',
                          height: '40px',
                          minWidth: '40px'
                        }}
                        title="Send message"
                      >
                        {isSending ? '⏳' : '📤'}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
          
          {/* RIGHT SIDEBAR - Sliding User Information Panel */}
          <div style={{ 
            width: '300px',
            backgroundColor: '#f8fafc', 
            borderRadius: '0', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            right: '0',
            borderLeft: '1px solid #e2e8f0',
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            transform: isRightSidebarCollapsed ? 'translateX(320px)' : 'translateX(0)',
            opacity: isRightSidebarCollapsed ? 0 : 1,
            zIndex: 1000
          }}>
            {/* Right Sidebar Header */}
            <div style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '1rem 1.5rem',
              borderRadius: '0'
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center' }}>
                👤 User Information
              </h2>
            </div>
            
            {/* Right Sidebar Content */}
            <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
              
              {/* Selected User Info Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                  👤 Selected User
                </h3>
                
                {selectedUser ? (
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '1rem',
                        fontSize: '1.5rem',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {selectedUser.fromName ? selectedUser.fromName[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: '#111827' }}>
                          {selectedUser.fromName || 'Unknown User'}
                        </div>
                        {selectedUser.fromUsername && (
                          <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                            @{selectedUser.fromUsername}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Messages</div>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{selectedUser.messageCount}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>User ID</div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                          {selectedUser.userId}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Chat ID</div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.75rem' }}>
                          {selectedUser.chatId}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Last Seen</div>
                        <div style={{ fontWeight: '600', color: '#111827', fontSize: '0.75rem' }}>
                          {new Date(selectedUser.lastMessageTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ color: '#6b7280', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Last Message</div>
                      <div style={{ 
                        backgroundColor: '#f9fafb', 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        fontSize: '0.875rem',
                        color: '#374151',
                        fontStyle: selectedUser.lastMessage ? 'normal' : 'italic'
                      }}>
                        {selectedUser.lastMessage || 'No recent messages'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    backgroundColor: '#f9fafb', 
                    padding: '2rem', 
                    borderRadius: '8px', 
                    textAlign: 'center', 
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
                    <p>Select a user from the chat interface to view their information</p>
                  </div>
                )}
              </div>
              
              {/* Statistics Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                  📊 Statistics
                </h3>
                
                <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Total Users</span>
                      <span style={{ fontWeight: '600', color: '#111827', backgroundColor: '#dbeafe', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {uniqueUsers.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Total Messages</span>
                      <span style={{ fontWeight: '600', color: '#111827', backgroundColor: '#dcfce7', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {messages.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Bot Status</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: isPolling ? '#15803d' : '#dc2626', 
                        backgroundColor: isPolling ? '#dcfce7' : '#fee2e2', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {isPolling ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Claude Status</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: claudeConnectionStatus === 'connected' ? '#15803d' : '#dc2626', 
                        backgroundColor: claudeConnectionStatus === 'connected' ? '#dcfce7' : '#fee2e2', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {claudeConnectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions Section */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                  ⚡ Quick Actions
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    onClick={() => setMessages([])}
                    disabled={messages.length === 0}
                    style={{
                      backgroundColor: messages.length === 0 ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: messages.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    🗑️ Clear All Messages
                  </button>
                  
                  <button
                    onClick={() => setSelectedUser(null)}
                    disabled={!selectedUser}
                    style={{
                      backgroundColor: !selectedUser ? '#9ca3af' : '#6b7280',
                      color: 'white',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !selectedUser ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    ❌ Clear Selection
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    🔄 Refresh Page
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

export default TelegramListener;