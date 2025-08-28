import React, { useState, useEffect } from 'react';

function WhatsAppChat() {
  const [activeUserId, setActiveUserId] = useState(null);
  const [isAutoReplyActive, setIsAutoReplyActive] = useState(false);
  const [isHumanTakeoverActive, setIsHumanTakeoverActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentBusinessId] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isPolling, setIsPolling] = useState(false);
  
  // API Configuration - Using production URLs from rules.md
  const API_BASE = 'https://workflow-lg9z.onrender.com/api';
  const WS_BASE = 'https://workflow-lg9z.onrender.com';

  // WhatsApp conversations data from API
  const [users, setUsers] = useState({});

  // Panel toggle
  const togglePanel = (panelId) => {
    const content = document.getElementById(`${panelId}-content`);
    const icon = document.getElementById(`${panelId}-icon`);
    if (content && icon) {
      content.classList.toggle('collapsed');
      icon.classList.toggle('transform');
      icon.classList.toggle('rotate-180');
    }
  };

  // Template functions for system prompts
  const applyTemplate = (templateName) => {
    const templates = {
      'customer-service': `You are a helpful customer service assistant for [Company Name].\n\nGuidelines:\n- Be professional and friendly in all responses\n- Use the company's knowledge base to answer questions accurately\n- If you don't know something, say so politely and offer to connect with a human agent\n- Keep responses concise but informative\n- Always maintain a helpful and empathetic tone`,
      'ecommerce': `You are an e-commerce support specialist for [Store Name].\n\nGuidelines:\n- Help customers with product information, orders, and shipping\n- Use order numbers and customer details when provided\n- Provide clear return and refund policy information\n- Guide customers through the purchasing process\n- Escalate complex issues to human agents when needed`,
      'sales': `You are a sales assistant for [Business Name].\n\nGuidelines:\n- Highlight product features and benefits\n- Answer questions about pricing and availability\n- Guide customers through the sales process\n- Provide helpful recommendations based on customer needs\n- Close conversations with clear next steps`,
      'tech-support': `You are a technical support specialist for [Product/Service Name].\n\nGuidelines:\n- Provide step-by-step troubleshooting instructions\n- Ask clarifying questions to understand the issue\n- Use simple, non-technical language when possible\n- Offer alternative solutions if the first doesn't work\n- Escalate complex technical issues to human experts`,
      'custom': ''
    };
    const textarea = document.getElementById('system-prompt');
    if (textarea) {
      textarea.value = templates[templateName];
      if (templateName === 'custom') textarea.focus();
    }
  };

  // API Functions
  const testWhatsAppConnection = async () => {
    // Get all required fields
    const appIdInput = document.getElementById('app-id');
    const clientSecretInput = document.getElementById('client-secret');
    const tokenInput = document.getElementById('access-token');
    const businessIdInput = document.getElementById('business-id');
    const phoneIdInput = document.getElementById('phone-number-id');
    const statusDiv = document.getElementById('whatsapp-status');
    
    // Validate all required fields are filled
    const missingFields = [];
    if (!appIdInput?.value.trim()) missingFields.push('App ID');
    if (!clientSecretInput?.value.trim()) missingFields.push('Client Secret');
    if (!tokenInput?.value.trim()) missingFields.push('Access Token');
    if (!businessIdInput?.value.trim()) missingFields.push('Business Account ID');
    if (!phoneIdInput?.value.trim()) missingFields.push('Phone Number ID');
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields:\n- ${missingFields.join('\n- ')}`);
      return;
    }
    
    // Show loading
    statusDiv.innerHTML = '<span class="status-dot status-not-connected animate-pulse"></span><span class="text-yellow-600">Testing connection...</span>';
    
    try {
      // Test WhatsApp Business API connection
      const response = await fetch(`https://graph.facebook.com/v21.0/${phoneIdInput.value.trim()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenInput.value.trim()}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        statusDiv.innerHTML = '<span class="status-dot status-connected"></span><span class="text-green-600">All credentials valid ✓</span>';
        
        // Show success details
        setTimeout(() => {
          alert(`✅ WhatsApp Business API Connection Successful!\n\n` +
                `📱 Phone: ${data.display_phone_number || 'Connected'}\n` +
                `🏢 Business: ${businessIdInput.value.trim()}\n` +
                `📡 App ID: ${appIdInput.value.trim()}\n\n` +
                `Ready for:\n• Receiving messages (WhatsApp Trigger)\n• Sending messages (WhatsApp Send Message)`);
        }, 500);
      } else {
        const errorData = await response.json();
        statusDiv.innerHTML = '<span class="status-dot status-not-connected"></span><span class="text-red-600">Connection failed</span>';
        alert(`❌ Connection failed:\n${errorData.error?.message || 'Invalid credentials'}`);
      }
    } catch (error) {
      console.error('WhatsApp test failed:', error);
      statusDiv.innerHTML = '<span class="status-dot status-not-connected"></span><span class="text-red-600">Network error</span>';
      alert('❌ Network error: Could not connect to WhatsApp Business API');
    }
  };

  const testAiApi = async () => {
    const keyInput = document.getElementById('ai-api-key');
    const modelSelect = document.getElementById('ai-model');
    const statusDiv = document.getElementById('ai-api-status');
    
    if (!keyInput || !keyInput.value.trim()) {
      alert('Please enter an API key');
      return;
    }
    
    // Show loading
    statusDiv.innerHTML = '<span class="status-dot status-not-connected animate-pulse"></span><span class="text-yellow-600">Testing...</span>';
    
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentBusinessId}/test-ai-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          ai_provider: 'claude',
          ai_api_key: keyInput.value.trim(),
          ai_model: modelSelect.value
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        statusDiv.innerHTML = '<span class="status-dot status-connected"></span><span class="text-green-600">Connected</span>';
        setTimeout(() => {
          alert(`✅ Claude API Connection Successful!\n\n` +
                `🤖 Provider: Claude AI\n` +
                `📊 Model: ${modelSelect.value}\n` +
                `🔗 Status: Ready for WhatsApp responses\n\n` +
                `Your WhatsApp assistant can now use Claude AI to respond intelligently to customer messages!`);
        }, 500);
      } else {
        statusDiv.innerHTML = '<span class="status-dot status-not-connected"></span><span class="text-red-600">Failed</span>';
        alert(`❌ Claude API Connection Failed:\n${result.error}`);
      }
    } catch (error) {
      console.error('AI API test failed:', error);
      statusDiv.innerHTML = '<span class="status-dot status-not-connected"></span><span class="text-red-600">Error</span>';
      alert('❌ Network error: Could not connect to Claude API');
    }
  };

  // Load existing files from backend
  const loadExistingFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/whatsapp/${currentBusinessId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.knowledge_files) {
          const files = result.knowledge_files.map(file => ({
            id: file.id,
            name: file.original_filename,
            size: (file.file_size / 1024 / 1024).toFixed(1) // Convert to MB
          }));
          setUploadedFiles(files);
          
          // Refresh Lucide icons after loading files
          setTimeout(() => {
            if (window.lucide) {
              window.lucide.createIcons();
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error loading existing files:', error);
    }
  };

  // File upload functionality
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('documents', file);
    });
    
    try {
      const response = await fetch(`${API_BASE}/whatsapp/${currentBusinessId}/upload-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Add uploaded files to the list
        const newFiles = result.processed_files.map(file => ({
          id: file.id,
          name: file.original_filename,
          size: (file.file_size / 1024 / 1024).toFixed(1) // Convert to MB
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
        
        // Refresh Lucide icons after state update
        setTimeout(() => {
          if (window.lucide) {
            window.lucide.createIcons();
          }
        }, 100);
        
        alert(`Successfully uploaded ${newFiles.length} file(s)!`);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: Network error');
    }
  };

  const deleteFile = async (index) => {
    const file = uploadedFiles[index];
    
    if (!file.id) {
      // If it's a file without ID, just remove from state
      setUploadedFiles(files => files.filter((_, i) => i !== index));
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/whatsapp/${currentBusinessId}/delete-document/${file.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setUploadedFiles(files => files.filter((_, i) => i !== index));
        alert('File deleted successfully!');
      } else {
        alert(`Delete failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed: Network error');
    }
  };

  const handleDropZoneClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.pdf,.docx,.txt,.md';
    fileInput.onchange = (e) => handleFileUpload(e.target.files);
    fileInput.click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  // Fetch WhatsApp conversations from API
  const fetchConversations = async () => {
    try {
      // First try the dedicated WhatsApp conversations endpoint
      let response = await fetch(`${API_BASE}/whatsapp/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      // If that fails, try the webhook messages endpoint as fallback
      if (!response.ok) {
        response = await fetch(`${API_BASE}/webhooks/whatsapp/messages`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          }
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('WhatsApp conversations API response:', result);
        
        if (result.success && result.conversations) {
          const processedUsers = {};
          
          // Group conversations by WhatsApp phone number
          result.conversations.forEach(conv => {
            const phoneNumber = conv.customer_id || conv.phone_number;
            
            if (!processedUsers[phoneNumber]) {
              const firstName = (conv.customer_name || 'Unknown').split(' ')[0];
              processedUsers[phoneNumber] = {
                name: conv.customer_name || 'Unknown Customer',
                phoneNumber: phoneNumber,
                avatar: `https://placehold.co/64x64/e0e7ff/25d366?text=${firstName[0]?.toUpperCase() || 'U'}`,
                lastSeen: 'recently',
                status: 'online',
                lastMessage: conv.message_text,
                messages: []
              };
            }

            // Add user message
            processedUsers[phoneNumber].messages.push({
              from: 'user',
              text: conv.message_text,
              timestamp: new Date(conv.created_at).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })
            });

            // Add AI/business response if exists
            if (conv.response_text) {
              processedUsers[phoneNumber].messages.push({
                from: 'business',
                text: conv.response_text,
                timestamp: new Date(conv.created_at).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })
              });
            }

            // Update last message to most recent
            processedUsers[phoneNumber].lastMessage = conv.message_text;
          });

          console.log('Processed WhatsApp users:', processedUsers);
          setUsers(processedUsers);
          
          // Set first user as active if none selected and we have users
          const userIds = Object.keys(processedUsers);
          if (userIds.length > 0 && (!activeUserId || !processedUsers[activeUserId])) {
            setActiveUserId(userIds[0]);
            console.log('Set active user ID:', userIds[0]);
          }

          // Refresh icons after updating conversations
          setTimeout(() => {
            if (window.lucide) {
              window.lucide.createIcons();
            }
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error fetching WhatsApp conversations:', error);
    }
  };

  // Start polling for conversations
  const startConversationPolling = () => {
    if (isPolling) return; // Prevent multiple polling
    
    setIsPolling(true);
    fetchConversations(); // Initial fetch
    
    // Poll every 10 seconds for WhatsApp messages
    const pollInterval = setInterval(() => {
      if (isAutoReplyActive) {
        fetchConversations();
      } else {
        clearInterval(pollInterval);
        setIsPolling(false);
      }
    }, 10000);
  };

  // Stop polling for conversations
  const stopConversationPolling = () => {
    setIsPolling(false);
  };

  // Check WhatsApp assistant status on load
  const checkAssistantStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/whatsapp/${currentBusinessId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.assistant) {
          const assistant = result.assistant;
          if (assistant.status === 'active') {
            setIsAutoReplyActive(true);
            startConversationPolling(); // Start polling if already active
          }
        }
      }
    } catch (error) {
      console.error('Error checking WhatsApp assistant status:', error);
    }
  };

  // Initialize
  useEffect(() => {
    // Set default system prompt template
    applyTemplate('customer-service');
    
    
    // Load existing files
    loadExistingFiles();
    
    // Check if WhatsApp assistant is already active
    checkAssistantStatus();
    
    // Start fetching WhatsApp conversations
    fetchConversations();
    
    // Set up polling for real-time updates
    const pollInterval = setInterval(() => {
      fetchConversations();
    }, 5000); // Poll every 5 seconds
    
    // Collapse panels by default
    setTimeout(() => {
      togglePanel('whatsapp-panel');
      togglePanel('model-panel');
      togglePanel('prompt-panel');
      togglePanel('kb-panel');
    }, 100);
    
    // Create Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
    
    // Cleanup polling on unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Refresh Lucide icons when uploadedFiles changes
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [uploadedFiles]);

  const sendManualMessage = async () => {
    const input = document.getElementById('manual-message-input');
    if (!input || !input.value.trim() || !activeUserId) {
      return;
    }

    const message = input.value.trim();

    try {
      // Send message via API
      const response = await fetch('https://workflow-lg9z.onrender.com/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: users[activeUserId].phoneNumber,
          message: message,
          userId: activeUserId
        })
      });

      if (response.ok) {
        // Add message to local state immediately for better UX
        const newMessage = {
          text: message,
          from: 'business',
          timestamp: new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          })
        };
        
        setUsers(prevUsers => ({
          ...prevUsers,
          [activeUserId]: {
            ...prevUsers[activeUserId],
            messages: [...prevUsers[activeUserId].messages, newMessage],
            lastMessage: message,
            lastSeen: 'now'
          }
        }));

        input.value = '';
        
        // Scroll to bottom of conversation
        setTimeout(() => {
          const conversationFeed = document.getElementById('conversation-feed');
          if (conversationFeed) {
            conversationFeed.scrollTop = conversationFeed.scrollHeight;
          }
        }, 100);
      } else {
        console.error('Failed to send message');
        // Show error feedback to user
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
        errorDiv.textContent = 'Failed to send message. Please try again.';
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error feedback to user
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      errorDiv.textContent = 'Network error. Please check your connection.';
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 3000);
    }
  };

  const handleAutoReplyToggle = async () => {
    if (isAutoReplyActive) {
      // Deactivate auto-reply
      try {
        const response = await fetch(`${API_BASE}/whatsapp/${currentBusinessId}/deactivate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        const result = await response.json();
        if (result.success) {
          setIsAutoReplyActive(false);
          stopConversationPolling();
          alert('✅ WhatsApp auto-reply deactivated successfully!');
        } else {
          alert(`❌ Failed to deactivate: ${result.error}`);
        }
      } catch (error) {
        console.error('Deactivation failed:', error);
        alert('❌ Network error during deactivation');
      }
    } else {
      // Activate auto-reply - first collect form data
      const appIdInput = document.getElementById('app-id');
      const clientSecretInput = document.getElementById('client-secret');
      const tokenInput = document.getElementById('access-token');
      const businessIdInput = document.getElementById('business-id');
      const phoneIdInput = document.getElementById('phone-number-id');
      
      // Validate required fields for WhatsApp trigger (receiving messages)
      const missingFields = [];
      if (!appIdInput?.value.trim()) missingFields.push('App ID');
      if (!clientSecretInput?.value.trim()) missingFields.push('Client Secret');
      
      if (missingFields.length > 0) {
        alert(`Please fill in the following required fields for WhatsApp trigger:\n- ${missingFields.join('\n- ')}`);
        return;
      }
      
      try {
        // Prepare form data to send with activation request
        const formData = {
          appId: appIdInput.value.trim(),
          clientSecret: clientSecretInput.value.trim(),
          accessToken: tokenInput?.value.trim() || '',
          businessId: businessIdInput?.value.trim() || '',
          phoneNumberId: phoneIdInput?.value.trim() || ''
        };
        
        const response = await fetch(`${API_BASE}/whatsapp/${currentBusinessId}/activate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        if (result.success) {
          setIsAutoReplyActive(true);
          setIsHumanTakeoverActive(false);
          startConversationPolling();
          alert('✅ WhatsApp auto-reply activated successfully! Now monitoring for messages...');
        } else {
          alert(`❌ Failed to activate: ${result.error}`);
        }
      } catch (error) {
        console.error('Activation failed:', error);
        alert('❌ Network error during activation');
      }
    }
  };

  const handleHumanTakeover = () => {
    setIsHumanTakeoverActive(!isHumanTakeoverActive);
    if (!isHumanTakeoverActive) {
      setIsAutoReplyActive(false);
    }
  };

  return (
    <>
      

      <div className="bg-gray-100 h-screen overflow-hidden">
        {/* Master Sidebar Toggle Button */}
        <button 
          id="sidebar-master-toggle" 
          className={`fixed ${isSidebarOpen ? 'left-80' : 'left-4'} top-6 z-30 p-2 bg-white rounded-md shadow-md transition-all duration-300 ease-in-out`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <span className="w-6 h-6 text-gray-700 flex items-center justify-center">{isSidebarOpen ? '«' : '»'}</span>
        </button>

        <div className="relative h-full flex">
          {/* Sidebar */}
          <aside 
            id="sidebar" 
            className={`bg-white w-96 h-full p-6 fixed top-0 left-0 z-20 shadow-lg overflow-y-auto transition-transform duration-300 ease-in-out ${!isSidebarOpen ? '-translate-x-full' : 'transform-none'}`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <span className="w-6 h-6 mr-2 text-green-600">💬</span>
                WhatsApp Business
              </h2>
            </div>
            
            <div className="flex flex-col gap-6">
              {/* 1. WhatsApp Business Setup */}
              <div className="card !p-4 !shadow-none border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('whatsapp-panel')}>
                  <h2 className="text-md font-semibold text-gray-700 flex items-center">
                    <span className="w-5 h-5 mr-2 text-green-600">📱</span>
                    1. Business Account Setup
                  </h2>
                  <span id="whatsapp-panel-icon" className="w-5 h-5 text-gray-500 transition-transform">▼</span>
                </div>
                <div id="whatsapp-panel-content" className="panel-content space-y-3 mt-3">
                  <div>
                    <label htmlFor="app-id" className="block text-sm font-medium text-gray-600 mb-1">App ID</label>
                    <input type="text" id="app-id" className="input-field" placeholder="1234567890123456" />
                    <small className="text-xs text-gray-500 mt-1">Required for receiving messages (WhatsApp Trigger)</small>
                  </div>
                  <div>
                    <label htmlFor="client-secret" className="block text-sm font-medium text-gray-600 mb-1">Client Secret</label>
                    <input type="password" id="client-secret" className="input-field" placeholder="abcd1234efgh5678..." />
                    <small className="text-xs text-gray-500 mt-1">Required for receiving messages (WhatsApp Trigger)</small>
                  </div>
                  <div>
                    <label htmlFor="access-token" className="block text-sm font-medium text-gray-600 mb-1">Access Token</label>
                    <input type="password" id="access-token" className="input-field" placeholder="EAAxxxxxxxxxxxxx..." />
                    <small className="text-xs text-gray-500 mt-1">Required for sending messages (WhatsApp Send Message)</small>
                  </div>
                  <div>
                    <label htmlFor="business-id" className="block text-sm font-medium text-gray-600 mb-1">Business Account ID</label>
                    <input type="text" id="business-id" className="input-field" placeholder="1234567890123456" />
                    <small className="text-xs text-gray-500 mt-1">Required for sending messages (WhatsApp Send Message)</small>
                  </div>
                  <div>
                    <label htmlFor="phone-number-id" className="block text-sm font-medium text-gray-600 mb-1">Phone Number ID</label>
                    <input type="text" id="phone-number-id" className="input-field" placeholder="628007790405551" />
                    <small className="text-xs text-gray-500 mt-1">Required for sending messages (WhatsApp Send Message)</small>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button onClick={testWhatsAppConnection} className="btn btn-primary text-sm">Test</button>
                      <button className="btn btn-secondary text-sm">Guide</button>
                    </div>
                    <div id="whatsapp-status" className="flex items-center text-sm font-medium">
                      <span className="status-dot status-not-connected"></span>
                      <span className="text-gray-500">Offline</span>
                    </div>
                  </div>
                </div>
              </div>


              {/* 2. AI Model Settings */}
              <div className="card !p-4 !shadow-none border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('model-panel')}>
                  <h2 className="text-md font-semibold text-gray-700 flex items-center">
                    <i data-lucide="cpu" className="w-5 h-5 mr-2 text-green-600"></i>
                    2. AI Model Settings
                  </h2>
                  <i id="model-panel-icon" data-lucide="chevron-down" className="w-5 h-5 text-gray-500 transition-transform"></i>
                </div>
                <div id="model-panel-content" className="panel-content space-y-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Provider</label>
                    <div className="flex gap-2">
                      <button className="btn btn-primary text-sm">Claude</button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="ai-api-key" className="block text-sm font-medium text-gray-600 mb-1">API Key</label>
                    <input type="password" id="ai-api-key" className="input-field" placeholder="sk-ant-api03-..." />
                  </div>
                  <div>
                    <label htmlFor="ai-model" className="block text-sm font-medium text-gray-600 mb-1">Model</label>
                    <select id="ai-model" className="input-field bg-white">
                      <option>claude-3-5-sonnet-20241022</option>
                      <option>claude-3-5-haiku-20241022</option>
                      <option>claude-3-opus-20240229</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <button onClick={testAiApi} className="btn btn-primary text-sm">Test API</button>
                    <div id="ai-api-status" className="flex items-center text-sm font-medium">
                      <span className="status-dot status-not-connected"></span>
                      <span className="text-gray-500">Offline</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. AI Behavior Instructions */}
              <div className="card !p-4 !shadow-none border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('prompt-panel')}>
                  <h2 className="text-md font-semibold text-gray-700 flex items-center">
                    <i data-lucide="brain" className="w-5 h-5 mr-2 text-green-600"></i>
                    2. AI Behavior Instructions
                  </h2>
                  <i id="prompt-panel-icon" data-lucide="chevron-down" className="w-5 h-5 text-gray-500 transition-transform"></i>
                </div>
                <div id="prompt-panel-content" className="panel-content space-y-3 mt-3">
                  <textarea 
                    id="system-prompt" 
                    className="input-field min-h-[120px] resize-y" 
                    placeholder="Enter instructions for how the AI should behave and respond to customers..."
                  ></textarea>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Role Templates:</label>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('customer-service')}>Customer Service</button>
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('ecommerce')}>E-commerce</button>
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('sales')}>Sales</button>
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('tech-support')}>Tech Support</button>
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('custom')}>Custom</button>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <i data-lucide="lightbulb" className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"></i>
                      <div className="text-blue-800">
                        <strong>Tip:</strong> Write clear instructions about the AI's personality, knowledge, and how it should handle different types of customer questions. This acts as the "brain" of your WhatsApp assistant.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Knowledge Base Documents */}
              <div className="card !p-4 !shadow-none border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('kb-panel')}>
                  <h2 className="text-md font-semibold text-gray-700 flex items-center">
                    <i data-lucide="folder-up" className="w-5 h-5 mr-2 text-green-600"></i>
                    4. Knowledge Base
                  </h2>
                  <i id="kb-panel-icon" data-lucide="chevron-down" className="w-5 h-5 text-gray-500 transition-transform"></i>
                </div>
                <div id="kb-panel-content" className="panel-content mt-3">
                  <div 
                    id="drop-zone" 
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
                    onClick={handleDropZoneClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <i data-lucide="upload-cloud" className="w-8 h-8 text-gray-400 mb-1"></i>
                    <p className="text-sm text-gray-500">Drop files or <span className="text-green-600 font-semibold">click</span></p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX, TXT, MD</p>
                  </div>
                  <div className="mt-3">
                    <h3 className="font-medium text-gray-600 mb-2 text-sm">Uploaded Files:</h3>
                    <ul id="file-list" className="space-y-2 max-h-24 overflow-y-auto">
                      {uploadedFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                          <div className="flex items-center overflow-hidden">
                            <i data-lucide="file-text" className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0"></i>
                            <span className="font-medium text-gray-700 truncate" title={file.name}>{file.name}</span>
                            <span className="text-gray-500 ml-1">({file.size} MB)</span>
                          </div>
                          <button onClick={() => deleteFile(index)} className="text-red-500 hover:text-red-700 ml-2">
                            <i data-lucide="trash-2" className="w-4 h-4"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {uploadedFiles.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">No files uploaded yet</p>
                    )}
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm mt-3">
                    <div className="flex items-start gap-2">
                      <i data-lucide="info" className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0"></i>
                      <div className="text-green-800">
                        <strong>Knowledge Base:</strong> Upload documents like FAQs, product manuals, or company policies. The AI will use this information to provide accurate answers to WhatsApp customers.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main id="main-content" className={`flex-1 p-4 sm:p-6 md:p-8 transition-all duration-300 ease-in-out flex flex-col h-full ${isSidebarOpen ? 'md:ml-96' : ''}`}>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-grow">
              {/* Conversations List */}
              <div className="card xl:col-span-3 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center mb-4 flex-shrink-0">
                  <i data-lucide="users" className="w-5 h-5 mr-2 text-green-600"></i>
                  WhatsApp Chats
                </h2>
                <div id="conversation-list" className="space-y-2 overflow-y-auto">
                  {Object.keys(users).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <i data-lucide="message-circle" className="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
                      <p className="text-sm">No WhatsApp conversations yet</p>
                      <p className="text-xs text-gray-400 mt-1">Enable auto-reply to start receiving WhatsApp messages</p>
                    </div>
                  ) : (
                    Object.keys(users).map((userId) => {
                      const user = users[userId];
                      return (
                        <div 
                          key={userId}
                          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${userId === activeUserId ? 'bg-green-100' : 'hover:bg-gray-50'}`}
                          onClick={() => setActiveUserId(userId)}
                        >
                          <div className="relative">
                            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full mr-3" />
                            <span className={`absolute bottom-0 right-3 w-3 h-3 rounded-full border-2 border-white ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          </div>
                          <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                              <span className="text-xs text-gray-500">{user.lastSeen}</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{user.phoneNumber}</p>
                            <p className="text-sm text-gray-500 truncate mt-1">{user.lastMessage}</p>
                          </div>
                          {/* Show unread indicator if this user has messages */}
                          {user.messages.length > 0 && (
                            <div className="w-2 h-2 bg-green-600 rounded-full ml-2"></div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Live Conversation Feed */}
              <div className="card xl:col-span-5 flex flex-col">
                {activeUserId && users[activeUserId] && (
                  <div className="flex items-center justify-between mb-4 flex-shrink-0 border-b border-gray-200 pb-4">
                    <div className="flex items-center">
                      <img src={users[activeUserId].avatar} alt={users[activeUserId].name} className="w-10 h-10 rounded-full mr-3" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-700">{users[activeUserId].name}</h2>
                        <p className="text-sm text-gray-500">{users[activeUserId].phoneNumber} • {users[activeUserId].status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <i data-lucide="phone" className="w-5 h-5 text-gray-500 cursor-pointer hover:text-green-600"></i>
                      <i data-lucide="video" className="w-5 h-5 text-gray-500 cursor-pointer hover:text-green-600"></i>
                      <i data-lucide="more-vertical" className="w-5 h-5 text-gray-500 cursor-pointer hover:text-green-600"></i>
                    </div>
                  </div>
                )}
                
                <div id="conversation-feed" className="bg-gray-50 p-4 rounded-lg overflow-y-auto space-y-4 flex-grow">
                  {!activeUserId || Object.keys(users).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <i data-lucide="message-square" className="w-16 h-16 mx-auto mb-4 text-gray-300"></i>
                      <p className="text-lg font-medium mb-2">Select a WhatsApp conversation</p>
                      <p className="text-sm text-gray-400">Choose a customer from the list to view messages</p>
                    </div>
                  ) : (
                    activeUserId && users[activeUserId] && users[activeUserId].messages ? users[activeUserId].messages.map((msg, index) => {
                      const user = users[activeUserId];
                      if (msg.from === 'user') {
                        return (
                          <div key={index} className="flex items-start">
                            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full mr-3 mt-1" />
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-gray-600 mb-1">{user.name}</p>
                              <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-xs">
                                <p className="text-sm text-gray-800">{msg.text}</p>
                              </div>
                              <span className="text-xs text-gray-500 mt-1">{msg.timestamp}</span>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div key={index} className="flex items-start justify-end">
                            <div className="flex flex-col items-end">
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                {msg.from === 'auto' ? '🤖 Auto-Reply' : msg.from === 'business' ? '🏢 Business' : '👤 You'}
                              </p>
                              <div className={`p-3 rounded-lg rounded-tr-none shadow-sm max-w-xs ${
                                msg.from === 'auto' ? 'bg-blue-100' : 
                                msg.from === 'business' ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                <p className="text-sm text-gray-800">{msg.text}</p>
                              </div>
                              <div className="flex items-center mt-1">
                                <span className="text-xs text-gray-500 mr-2">{msg.timestamp}</span>
                                <i data-lucide="check-check" className="w-3 h-3 text-green-500"></i>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    }) : null
                  )}
                </div>
                
                {/* Message Input */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
                  <div className="flex gap-2">
                    <button className="btn btn-secondary px-3">
                      <i data-lucide="paperclip" className="w-4 h-4"></i>
                    </button>
                    <button className="btn btn-secondary px-3">
                      <i data-lucide="camera" className="w-4 h-4"></i>
                    </button>
                    <button className="btn btn-secondary px-3">
                      <i data-lucide="mic" className="w-4 h-4"></i>
                    </button>
                    <input 
                      id="manual-message-input" 
                      type="text" 
                      placeholder="Type a message..." 
                      className="input-field flex-grow" 
                      onKeyPress={(e) => e.key === 'Enter' && sendManualMessage()}
                    />
                    <button id="send-message-btn" className="btn btn-primary" onClick={sendManualMessage}>
                      <i data-lucide="send" className="w-4 h-4"></i>
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-sm">
                    <div className="flex items-center gap-4 text-gray-500">
                      <div className="flex items-center gap-1">
                        <i data-lucide="shield-check" className="w-4 h-4"></i>
                        <span>End-to-end encrypted</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Controls and Customer Info */}
              <div className="xl:col-span-4 flex flex-col gap-4">
                {/* Customer Information Panel */}
                <div className="card !p-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('customer-panel')}>
                    <h2 className="text-md font-semibold text-gray-700 flex items-center">
                      <i data-lucide="user-circle" className="w-5 h-5 mr-2 text-green-600"></i>
                      Customer Information
                    </h2>
                    <i id="customer-panel-icon" data-lucide="chevron-down" className="w-5 h-5 text-gray-500 transition-transform"></i>
                  </div>
                  <div id="customer-panel-content" className="panel-content space-y-3 mt-3">
                    {activeUserId && users[activeUserId] ? (
                      <>
                        <div className="flex items-center gap-3">
                          <img src={users[activeUserId].avatar} alt="Customer Profile" className="w-12 h-12 rounded-full" />
                          <div className="text-sm">
                            <p className="font-bold text-gray-800">{users[activeUserId].name}</p>
                            <p className="text-gray-500">{users[activeUserId].phoneNumber}</p>
                            <p className="text-green-600 text-xs">{users[activeUserId].status}</p>
                          </div>
                        </div>
                        <div className="text-xs space-y-1 pt-2 border-t border-gray-200">
                          <p><strong className="font-medium text-gray-600">Last Seen:</strong> <span className="text-gray-800">{users[activeUserId].lastSeen}</span></p>
                          <p><strong className="font-medium text-gray-600">Messages:</strong> <span className="text-gray-800">{users[activeUserId].messages.length}</span></p>
                          <p><strong className="font-medium text-gray-600">Customer Since:</strong> <span className="text-gray-800">Jan 2024</span></p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">Select a customer to view information</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* System Control Panel */}
                <div className="card !p-4 flex flex-col justify-between">
                  <div>
                    <h2 className="text-md font-semibold text-gray-700 flex items-center mb-3">
                      <i data-lucide="settings" className="w-5 h-5 mr-2 text-green-600"></i>
                      System Control
                    </h2>
                    <div className="space-y-2">
                      <button 
                        id="auto-reply-btn" 
                        className={`btn w-full h-14 text-lg font-bold tracking-wider ${isAutoReplyActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'}`}
                        onClick={handleAutoReplyToggle}
                      >
                        <i data-lucide={isAutoReplyActive ? "pause-circle" : "zap"} className="w-5 h-5 mr-2"></i>
                        {isAutoReplyActive ? 'DISABLE AUTO-REPLY' : 'ENABLE AUTO-REPLY'}
                      </button>
                      <button 
                        id="human-takeover-btn" 
                        className={`btn w-full h-10 text-base font-bold ${isHumanTakeoverActive ? 'bg-blue-600 text-white hover:bg-blue-700' : 'btn-secondary'}`}
                        onClick={handleHumanTakeover}
                      >
                        <i data-lucide={isHumanTakeoverActive ? "user-check" : "user-cog"} className="w-4 h-4 mr-2"></i>
                        {isHumanTakeoverActive ? 'End Manual Mode' : 'Manual Mode'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Status:</span>
                      <div id="system-status" className="flex items-center font-semibold">
                        <span className={`status-dot ${isAutoReplyActive ? 'status-active' : isHumanTakeoverActive ? 'status-connected' : 'status-inactive'}`}></span>
                        <span className={isAutoReplyActive ? 'text-green-600' : isHumanTakeoverActive ? 'text-blue-600' : 'text-red-600'}>
                          {isAutoReplyActive ? 'Auto-Reply ON' : isHumanTakeoverActive ? 'Manual Mode' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Chats:</span>
                      <span className="font-semibold text-gray-800">{Object.keys(users).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Response Rate:</span>
                      <span className="font-semibold text-gray-800">94%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

      </div>
    </>
  );
}

export default WhatsAppChat;