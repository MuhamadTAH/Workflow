import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import TelegramAISettings from '../components/TelegramAISettings.jsx';

const TelegramListener = () => {
  const { theme, colors } = useTheme();
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
  
  // AI Settings Modal state
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiConfig, setAiConfig] = useState({ enabled: false });
  
  // Per-user AI Management State
  const [userAIStatus, setUserAIStatus] = useState({});
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const [aiActivatingUsers, setAiActivatingUsers] = useState({}); // Track which users are still activating
  
  // Configuration panel collapse states
  const [isBotConfigCollapsed, setIsBotConfigCollapsed] = useState(false);
  const [isClaudeConfigCollapsed, setIsClaudeConfigCollapsed] = useState(false);
  const [isSystemPromptCollapsed, setIsSystemPromptCollapsed] = useState(false);
  const [isPdfKnowledgeCollapsed, setIsPdfKnowledgeCollapsed] = useState(false);
  
  // Right sidebar collapse states
  const [isSelectedUserCollapsed, setIsSelectedUserCollapsed] = useState(false);
  const [isStatisticsCollapsed, setIsStatisticsCollapsed] = useState(false);
  const [isQuickActionsCollapsed, setIsQuickActionsCollapsed] = useState(false);
  
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
  const fetchMessages = async (targetListenerId = listenerId) => {
    if (!targetListenerId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/messages/${targetListenerId}`, {
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

  // Auto-select user from dashboard navigation
  useEffect(() => {
    const autoSelectData = localStorage.getItem('autoSelectUser');
    if (autoSelectData) {
      try {
        const userData = JSON.parse(autoSelectData);
        // Check if the data is recent (within last 30 seconds)
        if (Date.now() - userData.timestamp < 30000) {
          // Wait for messages to load first
          const checkAndSelect = () => {
            const users = getUniqueUsers();
            const targetUser = users.find(user => 
              user.chatId === userData.chatId || 
              user.fromName === userData.fromName
            );
            if (targetUser) {
              setSelectedUser(targetUser);
              localStorage.removeItem('autoSelectUser'); // Clean up
            } else if (messages.length > 0) {
              // If user not found but messages exist, try again in a moment
              setTimeout(checkAndSelect, 1000);
            }
          };
          
          // Check after a short delay to ensure messages are loaded
          setTimeout(checkAndSelect, 500);
        } else {
          // Clean up old data
          localStorage.removeItem('autoSelectUser');
        }
      } catch (error) {
        console.error('Error parsing auto-select user data:', error);
        localStorage.removeItem('autoSelectUser');
      }
    }
  }, [messages]); // Re-run when messages change

  // Load all saved configurations on mount
  useEffect(() => {
    loadSavedConfigurations();
  }, []);

  const loadSavedConfigurations = async () => {
    await Promise.all([
      loadClaudeConfig(),
      loadSystemPrompt(),
      loadKnowledgeBase(),
      loadBotConfiguration(),
      loadAIConfig()
    ]);
  };

  // Load Claude configuration
  const loadClaudeConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/claude/config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success && result.config) {
        if (result.config.hasApiKey) {
          setClaudeApiKey('••••••••••••••••'); // Show masked key
          setClaudeConnectionStatus('connected');
          setClaudeStatus('✅ Claude API is connected and ready');
        }
      }
    } catch (error) {
      console.error('Error loading Claude config:', error);
    }
  };

  // Load system prompt
  const loadSystemPrompt = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/system-prompt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success && result.prompt) {
        setSystemPrompt(result.prompt);
      }
    } catch (error) {
      console.error('Error loading system prompt:', error);
    }
  };

  // Load knowledge base
  const loadKnowledgeBase = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/knowledge-base`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success && result.knowledgeBase) {
        const kb = result.knowledgeBase;
        setHasKnowledgeBase(kb.hasKnowledgeBase);
        if (kb.hasKnowledgeBase) {
          setKnowledgeBaseInfo({
            filename: kb.filename,
            textLength: kb.textLength,
            fileSize: kb.fileSize
          });
          setUploadStatus(`✅ Knowledge base loaded: ${kb.filename}`);
        }
      }
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  };

  // Load bot configuration (check if user has active bots)
  const loadBotConfiguration = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      
      if (result.success && result.activeListeners > 0) {
        // Set polling to true if there are active listeners
        setIsPolling(true);
        setStatus(`✅ Found ${result.activeListeners} active bot(s)`);
        
        // Load the first active listener as current
        const firstListener = result.listeners[0];
        if (firstListener) {
          setListenerId(firstListener.listenerId);
          setWebhookUrl(firstListener.webhookUrl);
          setBotToken('••••••••••••••••'); // Show masked token
          
          // Start fetching messages
          fetchMessages(firstListener.listenerId);
        }
      }
    } catch (error) {
      console.error('Error loading bot configuration:', error);
    }
  };

  const loadAIConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/ai-config`);
      const data = await response.json();
      
      if (data.success) {
        setAiConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  };

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
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/claude/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          apiKey: claudeApiKey.trim(),
          model: 'claude-3-5-sonnet-20241022'
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
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/system-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt: systemPrompt.trim()
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
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      setUploadStatus(`📄 Selected: ${file.name} (${fileSizeMB} MB)`);
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

      // First upload and extract text from PDF using existing endpoint
      const response = await fetch(`${API_BASE_URL}/api/claude/upload-knowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Save to Telegram Listener knowledge base
        const saveResponse = await fetch(`${API_BASE_URL}/api/telegram-listener/knowledge-base`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            filename: selectedFile.name,
            extractedText: result.extractedText || 'No text extracted',
            fileSize: selectedFile.size
          })
        });

        const saveResult = await saveResponse.json();

        if (saveResponse.ok && saveResult.success) {
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
          setUploadStatus(`❌ Save failed: ${saveResult.error || 'Unknown error'}`);
          setTimeout(() => setUploadStatus(''), 5000);
        }
      } else {
        setUploadStatus(`❌ Upload failed: ${result.error || 'Unknown error'}`);
        setTimeout(() => setUploadStatus(''), 5000);
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
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/knowledge-base`, {
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
          lastMessageType: message.type,
          lastMessageTime: message.date,
          messageCount: 1
        });
      } else {
        // Update message count and last message (only for user messages)
        const user = usersMap.get(userId);
        user.messageCount++;
        if (message.date > user.lastMessageTime) {
          user.lastMessage = message.text;
          user.lastMessageType = message.type;
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

  const toggleUserAI = async (userId) => {
    if (!userId || isTogglingAI) return;
    
    setIsTogglingAI(true);
    
    // Check if user has explicit status set, otherwise default to true (active)
    const currentStatus = userAIStatus.hasOwnProperty(userId) ? userAIStatus[userId] : true;
    const newStatus = !currentStatus;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/user-ai/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId: userId,
          isActive: newStatus
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // If activating AI, mark user as "activating" for 5 seconds
        if (newStatus) {
          setAiActivatingUsers(prev => ({ ...prev, [userId]: true }));
          
          // Clear activating status after 5 seconds
          setTimeout(() => {
            setAiActivatingUsers(prev => {
              const updated = { ...prev };
              delete updated[userId];
              return updated;
            });
          }, 5000);
        }
        
        setUserAIStatus(prev => ({
          ...prev,
          [userId]: newStatus
        }));
      } else {
        console.error('Failed to toggle AI status for user:', data.error);
      }
    } catch (error) {
      console.error('Network error:', error.message);
    } finally {
      setIsTogglingAI(false);
    }
  };

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
    <div style={{ minHeight: '100vh', backgroundColor: colors.primaryBg, padding: '0' }}>
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
          
          {/* LEFT SIDEBAR - Sliding Configuration Panel */}
          <div style={{ 
            width: isSidebarCollapsed ? '0' : '400px',
            minWidth: isSidebarCollapsed ? '0' : '400px',
            maxWidth: isSidebarCollapsed ? '0' : '400px',
            backgroundColor: colors.secondaryBg, 
            borderRadius: '8px 0 0 8px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            borderRight: `1px solid ${colors.border}`,
            overflow: 'hidden',
            transition: 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), min-width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), max-width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            display: isSidebarCollapsed ? 'none' : 'flex',
            flexDirection: 'column'
          }}>
              {/* Sidebar Header */}
              <div style={{ 
                backgroundColor: colors.brandBlue, 
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
                    <span>🤖 Bot Configuration</span>
                    
                    <button
                      onClick={() => setShowAISettings(true)}
                      style={{
                        backgroundColor: aiConfig.enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                        color: aiConfig.enabled ? '#15803d' : '#6b7280',
                        border: `1px solid ${aiConfig.enabled ? 'rgba(34, 197, 94, 0.5)' : 'rgba(156, 163, 175, 0.3)'}`,
                        borderRadius: '6px',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="AI Assistant Settings"
                    >
                      🤖 AI {aiConfig.enabled ? 'ON' : 'OFF'}
                    </button>
                    <span style={{ 
                      transform: isBotConfigCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '0.8rem',
                      color: colors.mutedText
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
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.secondaryText, marginBottom: '0.5rem' }}>
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
                  border: `1px solid ${colors.border}`, 
                  borderRadius: '6px', 
                  fontSize: '1rem',
                  outline: 'none',
                  opacity: isLoading ? '0.5' : '1'
                }}
                disabled={isLoading}
              />
              <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: colors.mutedText }}>
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
                  backgroundColor: isLoading || !botToken.trim() ? colors.mutedText : colors.brandBlue, 
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
                  backgroundColor: isLoading || !botToken.trim() ? colors.mutedText : colors.error, 
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
                backgroundColor: status.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : status.includes('❌') ? 'rgba(244, 67, 54, 0.1)' : colors.overlay,
                color: status.includes('✅') ? colors.success : status.includes('❌') ? colors.error : colors.brandBlue
              }}>
                {status}
              </div>
            )}

            {/* Webhook URL Display */}
            {webhookUrl && (
              <div style={{ backgroundColor: colors.cardBg, padding: '1rem', borderRadius: '6px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.secondaryText, marginBottom: '0.5rem' }}>
                  Webhook URL
                </label>
                <code style={{ 
                  display: 'block', 
                  width: '100%', 
                  padding: '0.5rem', 
                  backgroundColor: colors.inputBg, 
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
            <div style={{ backgroundColor: colors.overlay, padding: '1rem', borderRadius: '6px' }}>
              <h3 style={{ fontWeight: '500', color: colors.brandBlue, marginBottom: '0.5rem' }}>📋 Instructions:</h3>
              <ol style={{ paddingLeft: '1.5rem', fontSize: '0.875rem', color: colors.brandBlueDark, lineHeight: '1.5' }}>
                <li>Get a bot token from @BotFather on Telegram</li>
                <li>Paste the token above and click "Setup Webhook"</li>
                <li>Send messages to your bot - they'll appear in the conversations panel below</li>
                <li>Messages are updated automatically every 2 seconds</li>
              </ol>
            </div>
                  </div> {/* End Collapsible Content */}
                </div>

                {/* AI Status Info - Simple indicator when AI is active */}
                {aiConfig.enabled && aiConfig.autoReply && (
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    paddingLeft: '0.5rem',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(34, 197, 94, 0.3)'
                  }}>
                    <span style={{ color: '#22c55e' }}>🤖</span>
                    AI Auto-reply is Active - Click the AI button above to configure settings
                  </div>
                )}
                
              </div>
            </div>

          {/* MIDDLE COLUMN - Chat Interface */}
          <div style={{ 
            flex: '1',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            minWidth: '500px'
          }}>

            {/* Two Panel Layout */}
            <div style={{
              opacity: isPolling ? 1 : 0.6
            }}>
              {!isPolling && (
                <div style={{
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: `1px solid ${colors.error}`
                }}>
                  <p style={{ color: colors.error, fontSize: '0.875rem', margin: 0 }}>
                    ⚠️ Setup and activate webhook first to start receiving messages
                  </p>
                </div>
              )}
              <div style={{ 
                display: 'flex', 
                gap: '0', 
                height: '100vh', 
                border: `1px solid ${colors.border}`, 
                borderLeft: 'none',
                borderRight: 'none',
                overflow: 'hidden',
                width: '100%',
                maxWidth: '100%'
              }}>
                
                {/* Users Panel */}
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
                      👥 Users
                      {isPolling && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: colors.success,
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          🟢 Live
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: colors.mutedText }}>
                      {uniqueUsers.length} user{uniqueUsers.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: 'white', 
                    borderRadius: '4px',
                    border: `1px solid ${colors.border}`
                  }}>
                    {uniqueUsers.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: colors.mutedText,
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
                              backgroundColor: selectedUser?.userId === user.userId ? colors.overlay : colors.cardBg,
                              borderRadius: '6px',
                              border: selectedUser?.userId === user.userId ? `2px solid ${colors.brandBlue}` : `1px solid ${colors.borderLight}`,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              width: '100%',
                              maxWidth: '100%',
                              minWidth: 0,
                              overflow: 'hidden'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: colors.brandBlue,
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
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                  fontWeight: '500', 
                                  fontSize: '0.875rem', 
                                  color: colors.primaryText,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {user.fromName || 'Unknown User'}
                                  {user.fromUsername && (
                                    <span style={{ 
                                      color: colors.mutedText, 
                                      fontWeight: 'normal', 
                                      fontSize: '0.75rem'
                                    }}>
                                      {' '}@{user.fromUsername}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: colors.mutedText, marginBottom: '0.25rem' }}>
                                  {user.messageCount} message{user.messageCount !== 1 ? 's' : ''}
                                </div>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: colors.mutedText,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  {user.lastMessageType === 'voice' ? (
                                    <>
                                      <span>🎵</span>
                                      <span>Voice message</span>
                                    </>
                                  ) : (
                                    user.lastMessage || 'No text'
                                  )}
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
                  backgroundColor: colors.cardBg, 
                  padding: '1rem', 
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '500', color: colors.primaryText, margin: 0 }}>
                      💬 Messages
                      {selectedUser && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: colors.brandBlue,
                          backgroundColor: colors.overlay,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {selectedUser.fromName}
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: colors.mutedText }}>
                      {selectedUser ? selectedUserMessages.length : 0} message{(selectedUser ? selectedUserMessages.length : 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Messages Area */}
                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: 'white', 
                    borderRadius: '4px 4px 0 0',
                    border: `1px solid ${colors.border}`,
                    borderBottom: 'none'
                  }}>
                    {!selectedUser ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: colors.mutedText,
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👈</div>
                        <p>Select a user to view their messages</p>
                      </div>
                    ) : selectedUserMessages.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: colors.mutedText,
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
                                backgroundColor: message.isBotMessage ? colors.brandBlue : colors.inputBg,
                                color: message.isBotMessage ? 'white' : colors.primaryText,
                                wordWrap: 'break-word',
                                position: 'relative'
                              }}
                            >
                              {/* Message content - text or voice */}
                              {message.type === 'voice' && message.voice_file_id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>🎵</span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Voice message</span>
                                    {message.voice_duration && (
                                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                        ({Math.floor(message.voice_duration / 60)}:{(message.voice_duration % 60).toString().padStart(2, '0')})
                                      </span>
                                    )}
                                  </div>
                                  <audio 
                                    controls 
                                    style={{ 
                                      width: '100%', 
                                      height: '40px',
                                      borderRadius: '20px',
                                      outline: 'none'
                                    }}
                                    preload="metadata"
                                  >
                                    <source 
                                      src={`${API_BASE_URL}/api/telegram-listener/voice/${listenerId}/${message.voice_file_id}`} 
                                      type={message.voice_mime_type || 'audio/ogg'} 
                                    />
                                    Your browser does not support the audio element.
                                  </audio>
                                  {message.voice_file_size && (
                                    <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                      {(message.voice_file_size / 1024).toFixed(1)} KB
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div style={{
                                  fontSize: '0.875rem',
                                  lineHeight: '1.4'
                                }}>
                                  {message.text || '<No text>'}
                                </div>
                              )}
                              
                              {/* Timestamp */}
                              <div style={{ 
                                fontSize: '0.65rem', 
                                opacity: 0.7,
                                marginTop: '0.25rem',
                                textAlign: message.isBotMessage ? 'left' : 'right'
                              }}>
                                {new Date(message.date).toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' })}
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
                      border: `1px solid ${colors.border}`,
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
                            border: `1px solid ${colors.border}`,
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
                          backgroundColor: isSending || !sendMessage.trim() ? colors.mutedText : colors.brandBlue,
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
            width: isRightSidebarCollapsed ? '0' : '300px',
            minWidth: isRightSidebarCollapsed ? '0' : '300px',
            maxWidth: isRightSidebarCollapsed ? '0' : '300px',
            backgroundColor: colors.cardBg, 
            borderRadius: '0 8px 8px 0', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            borderLeft: `1px solid ${colors.border}`,
            overflow: 'hidden',
            transition: 'width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), min-width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), max-width 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            display: isRightSidebarCollapsed ? 'none' : 'flex',
            flexDirection: 'column'
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
                  onClick={() => window.location.href = '/messenger-comments'}
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
              </div>
            </div>
            
            {/* Right Sidebar Content */}
            <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
              
              {/* Selected User Info Section */}
              <div style={{ marginBottom: isSelectedUserCollapsed ? '0' : '2rem' }}>
                <h3 
                  onClick={() => setIsSelectedUserCollapsed(!isSelectedUserCollapsed)}
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
                  <span>👤 Selected User</span>
                  <span style={{ 
                    transform: isSelectedUserCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '0.8rem',
                    color: colors.mutedText
                  }}>
                    ▼
                  </span>
                </h3>

                {/* Collapsible Content */}
                <div style={{
                  maxHeight: isSelectedUserCollapsed ? '0' : '2000px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  opacity: isSelectedUserCollapsed ? 0 : 1
                }}>
                
                  {selectedUser ? (
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', border: `1px solid ${colors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: colors.success,
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
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: colors.primaryText }}>
                          {selectedUser.fromName || 'Unknown User'}
                        </div>
                        {selectedUser.fromUsername && (
                          <div style={{ color: colors.mutedText, fontSize: '0.875rem' }}>
                            @{selectedUser.fromUsername}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: colors.mutedText, marginBottom: '0.25rem' }}>Messages</div>
                        <div style={{ fontWeight: '600', color: colors.primaryText }}>{selectedUser.messageCount}</div>
                      </div>
                      <div>
                        <div style={{ color: colors.mutedText, marginBottom: '0.25rem' }}>User ID</div>
                        <div style={{ fontWeight: '600', color: colors.primaryText, fontSize: '0.75rem', wordBreak: 'break-all' }}>
                          {selectedUser.userId}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: colors.mutedText, marginBottom: '0.25rem' }}>Chat ID</div>
                        <div style={{ fontWeight: '600', color: colors.primaryText, fontSize: '0.75rem' }}>
                          {selectedUser.chatId}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: colors.mutedText, marginBottom: '0.25rem' }}>Last Seen</div>
                        <div style={{ fontWeight: '600', color: colors.primaryText, fontSize: '0.75rem' }}>
                          {new Date(selectedUser.lastMessageTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ color: colors.mutedText, marginBottom: '0.25rem', fontSize: '0.875rem' }}>Last Message</div>
                      <div style={{ 
                        backgroundColor: colors.cardBg, 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        fontSize: '0.875rem',
                        color: colors.secondaryText,
                        fontStyle: selectedUser.lastMessage ? 'normal' : 'italic'
                      }}>
                        {selectedUser.lastMessage || 'No recent messages'}
                      </div>
                    </div>
                    
                    {/* AI Control Button for Selected User */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ color: colors.mutedText, marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          AI Response Control
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: aiActivatingUsers[selectedUser.userId] ? '#f59e0b' : 
                              (userAIStatus.hasOwnProperty(selectedUser.userId) ? 
                                (userAIStatus[selectedUser.userId] ? '#10b981' : '#ef4444') : '#10b981')
                          }}></div>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: aiActivatingUsers[selectedUser.userId] ? '#f59e0b' : 
                              (userAIStatus.hasOwnProperty(selectedUser.userId) ? 
                                (userAIStatus[selectedUser.userId] ? '#10b981' : '#ef4444') : '#10b981'),
                            fontWeight: '600'
                          }}>
                            {aiActivatingUsers[selectedUser.userId] ? 'AI Activating...' : 
                              (userAIStatus.hasOwnProperty(selectedUser.userId) ? 
                                (userAIStatus[selectedUser.userId] ? 'AI Active' : 'AI Inactive') : 'AI Active')}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleUserAI(selectedUser.userId)}
                        disabled={isTogglingAI || !selectedUser.userId || aiActivatingUsers[selectedUser.userId]}
                        style={{
                          width: '100%',
                          backgroundColor: isTogglingAI ? '#9ca3af' : 
                            aiActivatingUsers[selectedUser.userId] ? '#f59e0b' :
                            (userAIStatus.hasOwnProperty(selectedUser.userId) ? 
                              (userAIStatus[selectedUser.userId] ? '#ef4444' : '#10b981') : '#ef4444'),
                          color: 'white',
                          padding: '1rem',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isTogglingAI || !selectedUser.userId || aiActivatingUsers[selectedUser.userId] ? 'not-allowed' : 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.75rem',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isTogglingAI && selectedUser.userId && !aiActivatingUsers[selectedUser.userId]) {
                            e.target.style.transform = 'translateY(-1px)';
                            e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        {isTogglingAI ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid #ffffff',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            Updating...
                          </>
                        ) : aiActivatingUsers[selectedUser.userId] ? (
                          <>
                            ⏳
                            <span>AI Starting... (Please wait)</span>
                          </>
                        ) : (userAIStatus.hasOwnProperty(selectedUser.userId) ? 
                            (userAIStatus[selectedUser.userId] ? (
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
                        {aiActivatingUsers[selectedUser.userId] 
                          ? 'AI is starting up for this user. Please wait 5 seconds before sending messages.'
                          : userAIStatus.hasOwnProperty(selectedUser.userId) 
                          ? (userAIStatus[selectedUser.userId] 
                            ? 'AI will automatically respond to this user\'s messages'
                            : 'AI responses are disabled for this user')
                          : 'AI will automatically respond to this user\'s messages'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    backgroundColor: colors.cardBg, 
                    padding: '2rem', 
                    borderRadius: '8px', 
                    textAlign: 'center', 
                    color: colors.mutedText,
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
                    <p>Select a user from the chat interface to view their information</p>
                  </div>
                )}
                
                </div> {/* End Collapsible Content */}
              </div>
              
              {/* Statistics Section */}
              <div style={{ marginBottom: isStatisticsCollapsed ? '0' : '2rem' }}>
                <h3 
                  onClick={() => setIsStatisticsCollapsed(!isStatisticsCollapsed)}
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
                    transform: isStatisticsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '0.8rem',
                    color: colors.mutedText
                  }}>
                    ▼
                  </span>
                </h3>

                {/* Collapsible Content */}
                <div style={{
                  maxHeight: isStatisticsCollapsed ? '0' : '2000px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  opacity: isStatisticsCollapsed ? 0 : 1
                }}>
                
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', border: `1px solid ${colors.border}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.mutedText }}>Total Users</span>
                      <span style={{ fontWeight: '600', color: colors.primaryText, backgroundColor: colors.overlay, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {uniqueUsers.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.mutedText }}>Total Messages</span>
                      <span style={{ fontWeight: '600', color: colors.primaryText, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {messages.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.mutedText }}>Bot Status</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: isPolling ? colors.success : colors.error, 
                        backgroundColor: isPolling ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 67, 54, 0.1)', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {isPolling ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: colors.mutedText }}>Claude Status</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: claudeConnectionStatus === 'connected' ? colors.success : colors.error, 
                        backgroundColor: claudeConnectionStatus === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 67, 54, 0.1)', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {claudeConnectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
                      </span>
                    </div>
                  </div>
                  </div>
                
                </div> {/* End Collapsible Content */}
              </div>
              
              {/* Quick Actions Section */}
              <div style={{ marginBottom: isQuickActionsCollapsed ? '0' : '2rem' }}>
                <h3 
                  onClick={() => setIsQuickActionsCollapsed(!isQuickActionsCollapsed)}
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
                  <span>⚡ Quick Actions</span>
                  <span style={{ 
                    transform: isQuickActionsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '0.8rem',
                    color: colors.mutedText
                  }}>
                    ▼
                  </span>
                </h3>

                {/* Collapsible Content */}
                <div style={{
                  maxHeight: isQuickActionsCollapsed ? '0' : '2000px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  opacity: isQuickActionsCollapsed ? 0 : 1
                }}>
                
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    onClick={() => setMessages([])}
                    disabled={messages.length === 0}
                    style={{
                      backgroundColor: messages.length === 0 ? colors.mutedText : colors.error,
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
                      backgroundColor: !selectedUser ? colors.mutedText : colors.mutedText,
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
                      backgroundColor: colors.brandBlue,
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
                
                </div> {/* End Collapsible Content */}
              </div>
              
            </div>
          </div>
          
        </div>

        {/* AI Settings Modal */}
        {showAISettings && (
          <TelegramAISettings
            isVisible={showAISettings}
            onClose={() => {
              setShowAISettings(false);
              loadAIConfig();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TelegramListener;
