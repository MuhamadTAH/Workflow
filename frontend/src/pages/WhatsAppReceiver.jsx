import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';
import { useTheme } from '../contexts/ThemeContext';
import WhatsAppAISettings from '../components/WhatsAppAISettings.jsx';

const WhatsAppReceiver = () => {
  // Unified WhatsApp Configuration State
  const [appId, setAppId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberSendId, setPhoneNumberSendId] = useState('');
  
  // UI State
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  
  // Messaging State
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState('');
  const [hasAutoSelected, setHasAutoSelected] = useState(false);
  
  // Claude AI State
  const [claudeApiKey, setClaudeApiKey] = useState('');
  const [isClaudeConnected, setIsClaudeConnected] = useState(false); // Check actual connection status
  const [isConnectingClaude, setIsConnectingClaude] = useState(false);
  const [claudeStatus, setClaudeStatus] = useState('❌ Not connected - Please enter your Claude API key');

  // System Prompt State
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful and friendly AI assistant. Respond to users in a professional yet warm manner.');
  const [isSystemPromptLoading, setIsSystemPromptLoading] = useState(false);
  const [systemPromptStatus, setSystemPromptStatus] = useState('');

  // PDF Knowledge Base State
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
  
  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  
  // Left sidebar collapse states
  const [isWhatsAppSettingsCollapsed, setIsWhatsAppSettingsCollapsed] = useState(false);
  
  // AI Settings Modal state
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiConfig, setAiConfig] = useState({ enabled: false });
  
  // Per-user AI Management State
  const [userAIStatus, setUserAIStatus] = useState({});
  const [isTogglingAI, setIsTogglingAI] = useState(false);
  const [aiActivatingUsers, setAiActivatingUsers] = useState({}); // Track which users are still activating
  
  // Right sidebar collapse states
  const [isContactInfoCollapsed, setIsContactInfoCollapsed] = useState(false);
  const [isStatisticsCollapsed, setIsStatisticsCollapsed] = useState(false);
  const [isQuickActionsCollapsed, setIsQuickActionsCollapsed] = useState(false);

  // Initialize component
  useEffect(() => {
    setWebhookUrl(`${API_BASE_URL}/api/webhooks/whatsapp`);
    
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      const mockToken = `MOCK_TOKEN_FOR_TESTING_${Date.now()}`;
      localStorage.setItem('token', mockToken);
    }
    
    checkBackendStatus();
    loadSavedConfigurations();
    autoConnectClaude();
    loadSystemPrompt();
    loadKnowledgeBaseInfo();
    loadAIConfig();
  }, []);

  // Load all saved configurations on mount
  const loadSavedConfigurations = async () => {
    try {
      const configResponse = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/config`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (configResponse.ok) {
        const configData = await configResponse.json();
        if (configData.success && configData.config) {
          setAppId(configData.config.appId || '');
          setBusinessId(configData.config.businessId || '');
          setAccessToken(configData.config.accessToken || '');
          setPhoneNumberSendId(configData.config.phoneNumberSendId || '');
          setIsActive(configData.config.isActive || false);
          
          console.log('✅ WhatsApp configuration loaded successfully');
        }
        
        // Load AI configuration
        if (configData.aiConfig) {
          setIsClaudeConnected(!!configData.aiConfig.hasClaudeKey);
          setSystemPrompt(configData.aiConfig.systemPrompt || '');
          setClaudeStatus(configData.aiConfig.hasClaudeKey ? '✅ Claude AI connected' : '❌ Not connected');
        }
        
        // Load knowledge base info
        if (configData.knowledgeBase) {
          setHasKnowledgeBase(true);
          setKnowledgeBaseInfo({
            filename: configData.knowledgeBase.filename,
            textLength: configData.knowledgeBase.textLength,
            fileSize: configData.knowledgeBase.fileSize,
            uploadedAt: configData.knowledgeBase.uploadedAt
          });
        }
      }
    } catch (error) {
      console.error('Error loading saved configurations:', error);
    }
  };

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status && data.status.isActive) {
          setIsActive(true);
        }
      }
    } catch (error) {
      console.error('Error checking backend status:', error);
    }
  };

  const checkClaudeStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const isConnected = data.connected || false;
        setIsClaudeConnected(isConnected);
        
        if (isConnected) {
          setClaudeStatus('✅ Claude API ready for WhatsApp integration');
        }
      } else {
        setIsClaudeConnected(false);
      }
    } catch (error) {
      console.error('Error checking Claude status:', error);
      setIsClaudeConnected(false);
    }
  };

  const autoConnectClaude = async (retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds
    
    setIsConnectingClaude(true);
    const retryText = retryCount > 0 ? ` (Retry ${retryCount}/${maxRetries})` : '';
    setClaudeStatus(`🔗 Auto-connecting with environment API key...${retryText}`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/auto-connect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 15000 // 15 second timeout
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setClaudeStatus('✅ Claude API auto-connected! Ready for WhatsApp integration');
        setIsClaudeConnected(true);
        setClaudeApiKey('••••••••••••••••••••••••••••••••••••••••••••••••• (Environment Key)');
        console.log('✅ Claude auto-connected:', result.message);
        return; // Success, exit
      } else {
        // Check if it's a Claude API overload error and we can retry
        if (result.error && result.error.includes('Overloaded') && retryCount < maxRetries) {
          console.log(`🔄 Claude API overloaded, retrying in ${retryDelay/1000}s... (${retryCount + 1}/${maxRetries})`);
          setClaudeStatus(`⏳ Claude API overloaded, retrying in ${retryDelay/1000}s... (${retryCount + 1}/${maxRetries})`);
          
          setTimeout(() => {
            autoConnectClaude(retryCount + 1);
          }, retryDelay);
          return;
        }
        
        // Final failure
        setClaudeStatus(result.error?.includes('environment') 
          ? '⚙️ Auto-connect needs environment setup - Use manual connect instead'
          : `❌ Auto-connect failed: ${result.error || 'Unknown error'}`
        );
        setIsClaudeConnected(false);
        console.error('❌ Claude auto-connect failed:', result.error);
        
        // After auto-connect fails, enable manual connection
        setClaudeApiKey('');
      }
    } catch (error) {
      console.error('❌ Claude auto-connect error:', error);
      
      // Network/fetch errors - retry if possible
      if (retryCount < maxRetries && (error.name === 'TypeError' || error.message.includes('fetch'))) {
        console.log(`🔄 Network error, retrying in ${retryDelay/1000}s... (${retryCount + 1}/${maxRetries})`);
        setClaudeStatus(`⏳ Connection retry in ${retryDelay/1000}s... (${retryCount + 1}/${maxRetries})`);
        
        setTimeout(() => {
          autoConnectClaude(retryCount + 1);
        }, retryDelay);
        return;
      }
      
      // Final network failure
      setClaudeStatus('❌ Auto-connect failed - Network issue, try manual connect');
      setIsClaudeConnected(false);
      setClaudeApiKey('');
    } finally {
      if (retryCount === 0 || retryCount >= maxRetries) {
        setIsConnectingClaude(false);
      }
    }
  };

  const handleClaudeConnect = async () => {
    if (!claudeApiKey.trim()) {
      setClaudeStatus('❌ Please enter your Claude API key');
      return;
    }

    setIsConnectingClaude(true);
    setClaudeStatus('🔗 Connecting to Claude AI...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/claude/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          claudeApiKey: claudeApiKey.trim(),
          systemPrompt: systemPrompt
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setClaudeStatus('✅ Claude AI connected! Ready for WhatsApp integration');
        setIsClaudeConnected(true);
        setClaudeApiKey('');
      } else {
        setClaudeStatus(`❌ Connection failed: ${result.error || 'Unknown error'}`);
        setIsClaudeConnected(false);
      }
    } catch (error) {
      console.error('Claude API connection error:', error);
      setClaudeStatus(`❌ Network error: ${error.message}`);
      setIsClaudeConnected(false);
    } finally {
      setIsConnectingClaude(false);
    }
  };

  const handleClaudeDisconnect = async () => {
    setIsConnectingClaude(true);
    setClaudeStatus('🔌 Disconnecting Claude AI...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/claude/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setClaudeStatus('✅ Claude AI disconnected');
        setIsClaudeConnected(false);
        setClaudeApiKey('');
      } else {
        setClaudeStatus(`❌ Disconnect failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Claude API disconnect error:', error);
      setClaudeStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsConnectingClaude(false);
    }
  };

  const handleSystemPromptSave = async () => {
    if (!systemPrompt.trim()) {
      setSystemPromptStatus('❌ Please enter a system prompt');
      return;
    }

    setIsSystemPromptLoading(true);
    setSystemPromptStatus('💾 Saving system prompt...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/system-prompt`, {
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

  const loadAIConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/ai-config`);
      const data = await response.json();
      
      if (data.success) {
        setAiConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading AI config:', error);
    }
  };

  const resetToDefaultPrompt = () => {
    setSystemPrompt('You are a helpful and friendly AI assistant. Respond to users in a professional yet warm manner.');
  };

  const groupMessagesIntoConversations = (messages) => {
    const conversationMap = {};
    
    messages.forEach(message => {
      const phoneNumber = message.phoneNumber || message.from;
      
      if (!conversationMap[phoneNumber]) {
        conversationMap[phoneNumber] = {
          phoneNumber: phoneNumber,
          contactName: message.fromName || message.contactName || 'Unknown Contact',
          messages: [],
          lastMessage: null,
          lastMessageTime: null,
          unreadCount: 0
        };
      }
      
      conversationMap[phoneNumber].messages.push(message);
      conversationMap[phoneNumber].lastMessage = message.text || message.message;
      conversationMap[phoneNumber].lastMessageTime = message.timestamp || message.createdAt;
    });
    
    const sortedConversations = Object.values(conversationMap).map(conversation => ({
      ...conversation,
      messages: conversation.messages.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.createdAt);
        const timeB = new Date(b.timestamp || b.createdAt);
        return timeA - timeB;
      })
    })).sort((a, b) => 
      new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
    );
    
    return sortedConversations;
  };

  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/messages`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const newMessages = data.messages || [];
            setMessages(newMessages);
            
            if (data.status && data.status.isActive !== undefined) {
              if (data.status.isActive !== isActive) {
                setIsActive(data.status.isActive);
              }
            }
            
            const newConversations = groupMessagesIntoConversations(newMessages);
            setConversations(newConversations);
            
            if (!selectedConversation && !hasAutoSelected && newConversations.length > 0) {
              setSelectedConversation(newConversations[0]);
              setHasAutoSelected(true);
            }
            
            if (selectedConversation && newConversations.length > 0) {
              const updatedSelected = newConversations.find(conv => 
                conv.phoneNumber === selectedConversation.phoneNumber
              );
              if (updatedSelected) {
                setSelectedConversation(updatedSelected);
              }
            }
          }
        } catch (error) {
          console.error('Error polling messages:', error);
        }
      }, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, selectedConversation, hasAutoSelected]);

  const handleActivate = async () => {
    if (!appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim()) {
      setError('Please fill in all WhatsApp configuration fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          appId: appId.trim(),
          clientSecret: clientSecret.trim(),
          businessId: businessId.trim(),
          accessToken: accessToken.trim(),
          phoneNumberSendId: phoneNumberSendId.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsActive(true);
        setMessages([]);
        console.log('WhatsApp receiver activated successfully');
      } else {
        setError(data.error || 'Failed to activate WhatsApp receiver');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
      console.error('Activation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsActive(false);
        setMessages([]);
        console.log('WhatsApp receiver deactivated successfully');
      } else {
        setError(data.error || 'Failed to deactivate WhatsApp receiver');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
      console.error('Deactivation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    alert('Webhook URL copied to clipboard!');
  };

  const handleSendMessage = async () => {
    const recipientPhoneNumber = selectedConversation?.phoneNumber;
    
    if (!isActive || !selectedConversation || !recipientPhoneNumber || !messageText.trim()) {
      return;
    }

    setIsSending(true);
    setSendStatus('⏳ Sending message...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientPhoneNumber: recipientPhoneNumber,
          messageText: messageText.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSendStatus(`✅ Message sent! ID: ${data.data.messageId || 'N/A'}`);
        setMessageText('');
      } else {
        const errorMsg = data.error || 'Unknown error';
        if (errorMsg.includes('not activated')) {
          setSendStatus(`❌ WhatsApp system not activated! Please fill configuration and click "Activate WhatsApp System" first.`);
        } else {
          setSendStatus(`❌ Failed to send: ${errorMsg}`);
        }
      }
    } catch (error) {
      setSendStatus(`❌ Network error: ${error.message}`);
      console.error('Send message error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const toggleUserAI = async (userId) => {
    if (!userId || isTogglingAI) return;
    
    setIsTogglingAI(true);
    
    // Check if user has explicit status set, otherwise default to true (active)
    const currentStatus = userAIStatus.hasOwnProperty(userId) ? userAIStatus[userId] : true;
    const newStatus = !currentStatus;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/user-ai/toggle`, {
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

  useEffect(() => {
    if (sendStatus && !sendStatus.includes('⏳')) {
      const timeout = setTimeout(() => {
        setSendStatus('');
      }, 10000);
      return () => clearTimeout(timeout);
    }
  }, [sendStatus]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '0 1rem' }}>
        {/* Fixed Toggle Buttons */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            left: isSidebarCollapsed ? '20px' : '400px',
            backgroundColor: '#25D366',
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
          onMouseEnter={(e) => e.target.style.backgroundColor = '#128C7E'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#25D366'}
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: colors.primaryText }}>
            <i className="fab fa-whatsapp" style={{ color: '#25D366', marginRight: '0.5rem' }}></i>
            WhatsApp Business Integration
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '0', alignItems: 'flex-start', position: 'relative' }}>
          
          {/* LEFT SIDEBAR - Configuration Panel */}
          <div style={{ 
            width: '400px',
            backgroundColor: colors.secondaryBg, 
            borderRadius: '0', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            left: '0',
            border: `1px solid ${colors.border}`,
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            transform: isSidebarCollapsed ? 'translateX(-420px)' : 'translateX(0)',
            opacity: isSidebarCollapsed ? 0 : 1,
            zIndex: 1000
          }}>
              {/* Sidebar Header */}
              <div style={{ 
                backgroundColor: '#25D366', 
                color: 'white', 
                padding: '1rem 1.5rem',
                borderRadius: '0'
              }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>⚙️ WhatsApp Configuration</span>
                  
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
                </h2>
                
                {/* AI Status Indicator */}
                {aiConfig.enabled && aiConfig.autoReply && (
                  <div style={{ 
                    fontSize: '0.65rem', 
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    marginTop: '0.5rem',
                    paddingLeft: '0.25rem'
                  }}>
                    <span style={{ color: '#22c55e' }}>●</span>
                    AI Auto-reply Active
                  </div>
                )}
              </div>
              
              {/* Sidebar Content */}
              <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
                
                {/* AI Status Info */}
                {isClaudeConnected && (
                  <div style={{ 
                    padding: '1rem',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginBottom: '2rem'
                  }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#065f46',
                      marginBottom: '0.5rem'
                    }}>
                      🤖 Claude AI Integration Active
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#059669',
                      margin: 0
                    }}>
                      WhatsApp messages will automatically receive AI-powered responses
                    </p>
                  </div>
                )}

                {/* WhatsApp Configuration Section */}
                <div style={{ marginBottom: isWhatsAppSettingsCollapsed ? '0' : '2rem' }}>
                  <h3 
                    onClick={() => setIsWhatsAppSettingsCollapsed(!isWhatsAppSettingsCollapsed)}
                    style={{ 
                      fontSize: '1rem', 
                      fontWeight: '600', 
                      color: '#1f2937', 
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
                    <span>📱 WhatsApp Settings</span>
                    <span style={{ 
                      transform: isWhatsAppSettingsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                      fontSize: '0.8rem',
                      color: '#6b7280'
                    }}>
                      ▼
                    </span>
                  </h3>

                  {/* Collapsible Content */}
                  <div style={{
                    maxHeight: isWhatsAppSettingsCollapsed ? '0' : '2000px',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                    opacity: isWhatsAppSettingsCollapsed ? 0 : 1
                  }}>
                    <div>
                  
                      {/* Webhook URL */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.primaryText, marginBottom: '0.5rem' }}>
                      Webhook URL
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <code style={{ 
                        display: 'block', 
                        width: '100%', 
                        padding: '0.5rem', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        wordBreak: 'break-all',
                        fontFamily: 'monospace'
                      }}>
                        {webhookUrl}
                      </code>
                      <button 
                        onClick={copyWebhookUrl}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Configuration Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.primaryText, marginBottom: '0.5rem' }}>
                        App ID
                      </label>
                      <input
                        type="text"
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                        placeholder="Enter your WhatsApp App ID"
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.primaryText, marginBottom: '0.5rem' }}>
                        Client Secret
                      </label>
                      <input
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="Enter your Client Secret"
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.primaryText, marginBottom: '0.5rem' }}>
                        Business ID
                      </label>
                      <input
                        type="text"
                        value={businessId}
                        onChange={(e) => setBusinessId(e.target.value)}
                        placeholder="e.g., 1234567890123456"
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.primaryText, marginBottom: '0.5rem' }}>
                        Access Token
                      </label>
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="EAAxxxxxxxx..."
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: colors.primaryText, marginBottom: '0.5rem' }}>
                        Phone Number Send ID
                      </label>
                      <input
                        type="text"
                        value={phoneNumberSendId}
                        onChange={(e) => setPhoneNumberSendId(e.target.value)}
                        placeholder="e.g., 628007790405551"
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div style={{ 
                      padding: '1rem', 
                      borderRadius: '6px', 
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      marginTop: '1rem',
                      border: '1px solid #fecaca'
                    }}>
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    {!isActive ? (
                      <button
                        onClick={handleActivate}
                        disabled={isLoading || !appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim()}
                        style={{ 
                          flex: '1',
                          backgroundColor: isLoading || !appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim() ? '#9ca3af' : '#25D366', 
                          color: 'white', 
                          padding: '0.75rem 1rem', 
                          border: 'none',
                          borderRadius: '6px', 
                          cursor: isLoading || !appId.trim() || !clientSecret.trim() || !businessId.trim() || !accessToken.trim() || !phoneNumberSendId.trim() ? 'not-allowed' : 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        {isLoading ? '⏳ Setting up...' : '🚀 Start Integration'}
                      </button>
                    ) : (
                      <button
                        onClick={handleDeactivate}
                        disabled={isLoading}
                        style={{ 
                          flex: '1',
                          backgroundColor: isLoading ? '#9ca3af' : '#dc2626', 
                          color: 'white', 
                          padding: '0.75rem 1rem', 
                          border: 'none',
                          borderRadius: '6px', 
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        {isLoading ? '⏳ Stopping...' : '🛑 Stop Integration'}
                      </button>
                    )}
                  </div>

                  {/* Status */}
                  {isActive && (
                    <div style={{ 
                      padding: '1rem', 
                      borderRadius: '6px', 
                      backgroundColor: '#f0fdf4',
                      color: '#15803d',
                      marginTop: '1rem'
                    }}>
                      ✅ WhatsApp integration is active and listening for messages
                    </div>
                  )}
                    </div>
                  </div> {/* End Collapsible Content */}
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
            gap: '1.5rem',
            transition: 'left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            padding: '2rem 1rem',
            backgroundColor: '#fafafa',
            borderTop: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            zIndex: 999,
            overflowY: 'auto'
          }}>

            {/* WhatsApp Status Warning */}
            <div style={{
              opacity: isActive ? 1 : 0.6
            }}>
              
              {/* Two Panel Layout */}
              <div style={{ display: 'flex', gap: '0', height: 'calc(100vh - 60px)', border: `1px solid ${colors.border}`, borderRadius: '8px', overflow: 'hidden' }}>
                
                {/* Conversations Panel */}
                <div style={{ 
                  flex: '0 0 300px', 
                  backgroundColor: colors.secondaryBg, 
                  padding: '1rem', 
                  borderRight: `1px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>
                      💬 Conversations
                      {isActive && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: '#10b981',
                          backgroundColor: colors.overlay,
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          🟢 Live
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div style={{ 
                    flex: 1,
                    overflowY: 'auto', 
                    backgroundColor: 'white', 
                    borderRadius: '4px',
                    border: '1px solid #e5e7eb'
                  }}>
                    {conversations.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                        <p>No conversations yet. Messages will appear here when received</p>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem' }}>
                        {conversations.map((conversation, index) => (
                          <div
                            key={conversation.phoneNumber}
                            onClick={() => setSelectedConversation(conversation)}
                            style={{
                              padding: '0.75rem',
                              marginBottom: '0.5rem',
                              backgroundColor: selectedConversation?.phoneNumber === conversation.phoneNumber ? '#eff6ff' : '#f9fafb',
                              borderRadius: '6px',
                              border: selectedConversation?.phoneNumber === conversation.phoneNumber ? '2px solid #25D366' : '1px solid #f3f4f6',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#25D366',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '0.75rem',
                                fontSize: '1rem',
                                color: 'white',
                                fontWeight: 'bold'
                              }}>
                                {conversation.contactName ? conversation.contactName[0].toUpperCase() : '📱'}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500', fontSize: '0.875rem', color: colors.primaryText }}>
                                  {conversation.contactName || conversation.phoneNumber}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                  {conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}
                                </div>
                                <div style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#9ca3af',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}>
                                  {conversation.lastMessage || 'No messages'}
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
                  backgroundColor: colors.secondaryBg, 
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>
                      📱 Messages
                      {selectedConversation && (
                        <span style={{ 
                          marginLeft: '0.5rem', 
                          fontSize: '0.75rem', 
                          color: '#25D366',
                          backgroundColor: '#f0fdf4',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {selectedConversation.contactName}
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {selectedConversation ? selectedConversation.messages.length : 0} message{(selectedConversation ? selectedConversation.messages.length : 0) !== 1 ? 's' : ''}
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
                    {!selectedConversation ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👈</div>
                        <p>Select a conversation to view messages</p>
                      </div>
                    ) : selectedConversation.messages.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#9ca3af',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                        <p>No messages from this contact yet</p>
                      </div>
                    ) : (
                      <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedConversation.messages.map((message, index) => {
                          const isOutgoing = message.direction === 'outgoing' || message.isOutgoing === true || message.type === 'sent';
                          
                          return (
                            <div key={index} style={{
                              marginBottom: '0.5rem',
                              display: 'flex',
                              justifyContent: isOutgoing ? 'flex-end' : 'flex-start'
                            }}>
                              <div style={{
                                maxWidth: '75%',
                                padding: '0.75rem 1rem',
                                borderRadius: isOutgoing ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                                backgroundColor: isOutgoing ? '#25D366' : '#ffffff',
                                color: isOutgoing ? 'white' : '#111827',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                wordWrap: 'break-word'
                              }}>
                                <div style={{
                                  fontSize: '0.875rem',
                                  lineHeight: '1.4'
                                }}>
                                  {message.text || message.message}
                                </div>
                                <div style={{ 
                                  fontSize: '0.65rem', 
                                  opacity: 0.7,
                                  marginTop: '0.25rem',
                                  textAlign: isOutgoing ? 'right' : 'left'
                                }}>
                                  {formatTimestamp(message.timestamp || message.createdAt)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Message Input Bar */}
                  {selectedConversation && (
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
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder={`Type a message to ${selectedConversation.contactName}...`}
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
                              if (messageText.trim() && !isSending) {
                                handleSendMessage();
                              }
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={isSending || !messageText.trim()}
                        style={{
                          backgroundColor: isSending || !messageText.trim() ? '#9ca3af' : '#25D366',
                          color: 'white',
                          padding: '0.75rem',
                          border: 'none',
                          borderRadius: '50%',
                          fontSize: '1rem',
                          cursor: isSending || !messageText.trim() ? 'not-allowed' : 'pointer',
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
          
          {/* RIGHT SIDEBAR - User Information Panel */}
          <div style={{ 
            width: '300px',
            backgroundColor: colors.secondaryBg, 
            borderRadius: '0', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            right: '0',
            border: `1px solid ${colors.border}`,
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
                  onClick={() => window.location.href = '/telegram-listener'}
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
                  title="Switch to Telegram"
                >
                  <i className="fab fa-telegram"></i>
                </button>
              </div>
            </div>
            
            {/* Right Sidebar Content */}
            <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
              
              {/* Selected Contact Info Section */}
              <div style={{ marginBottom: isContactInfoCollapsed ? '0' : '2rem' }}>
                <h3 
                  onClick={() => setIsContactInfoCollapsed(!isContactInfoCollapsed)}
                  style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: '#1f2937', 
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
                  <span>👤 Selected Contact</span>
                  <span style={{ 
                    transform: isContactInfoCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    fontSize: '0.8rem',
                    color: '#6b7280'
                  }}>
                    ▼
                  </span>
                </h3>

                {/* Collapsible Content */}
                <div style={{
                  maxHeight: isContactInfoCollapsed ? '0' : '2000px',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out',
                  opacity: isContactInfoCollapsed ? 0 : 1
                }}>
                
                  {selectedConversation ? (
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#25D366',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '1rem',
                        fontSize: '1.5rem',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>
                        {selectedConversation.contactName ? selectedConversation.contactName[0].toUpperCase() : '📱'}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '1rem', color: colors.primaryText }}>
                          {selectedConversation.contactName || 'Unknown Contact'}
                        </div>
                        <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                          {selectedConversation.phoneNumber}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.875rem' }}>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Messages</div>
                        <div style={{ fontWeight: '600', color: colors.primaryText }}>{selectedConversation.messages.length}</div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Phone</div>
                        <div style={{ fontWeight: '600', color: colors.primaryText, fontSize: '0.75rem', wordBreak: 'break-all' }}>
                          {selectedConversation.phoneNumber}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Last Message</div>
                        <div style={{ fontWeight: '600', color: colors.primaryText, fontSize: '0.75rem' }}>
                          {selectedConversation.lastMessageTime ? formatTimestamp(selectedConversation.lastMessageTime) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>Status</div>
                        <div style={{ fontWeight: '600', color: colors.primaryText, fontSize: '0.75rem' }}>
                          Active
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ color: '#6b7280', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Last Message Preview</div>
                      <div style={{ 
                        backgroundColor: '#f9fafb', 
                        padding: '0.75rem', 
                        borderRadius: '6px', 
                        fontSize: '0.875rem',
                        color: colors.primaryText,
                        fontStyle: selectedConversation.lastMessage ? 'normal' : 'italic'
                      }}>
                        {selectedConversation.lastMessage || 'No recent messages'}
                      </div>
                    </div>
                    
                    {/* AI Control Button for Selected Contact */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: `1px solid ${colors.border}` }}>
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ color: '#6b7280', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
                          AI Response Control
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: aiActivatingUsers[selectedConversation.phoneNumber] ? '#f59e0b' : 
                              (userAIStatus.hasOwnProperty(selectedConversation.phoneNumber) ? 
                                (userAIStatus[selectedConversation.phoneNumber] ? '#10b981' : '#ef4444') : '#10b981')
                          }}></div>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            color: aiActivatingUsers[selectedConversation.phoneNumber] ? '#f59e0b' : 
                              (userAIStatus.hasOwnProperty(selectedConversation.phoneNumber) ? 
                                (userAIStatus[selectedConversation.phoneNumber] ? '#10b981' : '#ef4444') : '#10b981'),
                            fontWeight: '600'
                          }}>
                            {aiActivatingUsers[selectedConversation.phoneNumber] ? 'AI Activating...' : 
                              (userAIStatus.hasOwnProperty(selectedConversation.phoneNumber) ? 
                                (userAIStatus[selectedConversation.phoneNumber] ? 'AI Active' : 'AI Inactive') : 'AI Active')}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => toggleUserAI(selectedConversation.phoneNumber)}
                        disabled={isTogglingAI || !selectedConversation.phoneNumber || aiActivatingUsers[selectedConversation.phoneNumber]}
                        style={{
                          width: '100%',
                          backgroundColor: isTogglingAI ? '#9ca3af' : 
                            aiActivatingUsers[selectedConversation.phoneNumber] ? '#f59e0b' :
                            (userAIStatus.hasOwnProperty(selectedConversation.phoneNumber) ? 
                              (userAIStatus[selectedConversation.phoneNumber] ? '#ef4444' : '#10b981') : '#ef4444'),
                          color: 'white',
                          padding: '1rem',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isTogglingAI || !selectedConversation.phoneNumber || aiActivatingUsers[selectedConversation.phoneNumber] ? 'not-allowed' : 'pointer',
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
                          if (!isTogglingAI && selectedConversation.phoneNumber && !aiActivatingUsers[selectedConversation.phoneNumber]) {
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
                        ) : aiActivatingUsers[selectedConversation.phoneNumber] ? (
                          <>
                            ⏳
                            <span>AI Starting... (Please wait)</span>
                          </>
                        ) : (userAIStatus.hasOwnProperty(selectedConversation.phoneNumber) ? 
                            (userAIStatus[selectedConversation.phoneNumber] ? (
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
                        color: '#6b7280', 
                        textAlign: 'center', 
                        marginTop: '0.75rem',
                        margin: '0.75rem 0 0 0',
                        lineHeight: '1.4'
                      }}>
                        {aiActivatingUsers[selectedConversation.phoneNumber] 
                          ? 'AI is starting up for this contact. Please wait 5 seconds before sending messages.'
                          : userAIStatus.hasOwnProperty(selectedConversation.phoneNumber) 
                          ? (userAIStatus[selectedConversation.phoneNumber] 
                            ? 'AI will automatically respond to this contact\'s messages'
                            : 'AI responses are disabled for this contact')
                          : 'AI will automatically respond to this contact\'s messages'
                        }
                      </p>
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
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📱</div>
                    <p>Select a contact from the chat interface to view their information</p>
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
                    color: '#1f2937', 
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
                    color: '#6b7280'
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
                
                  <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Total Contacts</span>
                      <span style={{ fontWeight: '600', color: colors.primaryText, backgroundColor: colors.overlay, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {conversations.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Total Messages</span>
                      <span style={{ fontWeight: '600', color: colors.primaryText, backgroundColor: colors.overlay, padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
                        {messages.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>WhatsApp Status</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: isActive ? '#15803d' : '#dc2626', 
                        backgroundColor: isActive ? '#dcfce7' : '#fee2e2', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {isActive ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#6b7280' }}>Claude Status</span>
                      <span style={{ 
                        fontWeight: '600', 
                        color: isClaudeConnected ? '#15803d' : '#dc2626', 
                        backgroundColor: isClaudeConnected ? '#dcfce7' : '#fee2e2', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px',
                        fontSize: '0.75rem'
                      }}>
                        {isClaudeConnected ? '🟢 Connected' : '🔴 Disconnected'}
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
                    color: '#1f2937', 
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
                    color: '#6b7280'
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
                    onClick={() => setSelectedConversation(null)}
                    disabled={!selectedConversation}
                    style={{
                      backgroundColor: !selectedConversation ? '#9ca3af' : '#6b7280',
                      color: 'white',
                      padding: '0.75rem',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !selectedConversation ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    ❌ Clear Selection
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      backgroundColor: '#25D366',
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
        <WhatsAppAISettings
          isVisible={showAISettings}
          onClose={() => {
            setShowAISettings(false);
            loadAIConfig(); // Reload config after closing settings
          }}
        />

      </div>
    </div>
  );
};

export default WhatsAppReceiver;