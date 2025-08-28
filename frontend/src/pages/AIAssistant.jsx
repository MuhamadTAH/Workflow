import React, { useState, useEffect } from 'react';

function AIAssistant() {
  const [activeUserId, setActiveUserId] = useState('');
  const [isAiActive, setIsAiActive] = useState(false);
  const [isHumanTakeoverActive, setIsHumanTakeoverActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentAssistantId] = useState(1);
  
  // API Configuration - Using production URLs from rules.md
  const API_BASE = 'https://workflow-lg9z.onrender.com/api';
  const WS_BASE = 'https://workflow-lg9z.onrender.com';

  // Users data from live conversations
  const [users, setUsers] = useState({});

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isPolling, setIsPolling] = useState(false);

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

  // Template functions
  const applyTemplate = (templateName) => {
    const templates = {
      'customer-service': `You are a helpful customer service assistant for [Company Name].\n\nGuidelines:\n- Use the uploaded documents to answer questions accurately.\n- If you don't know something, say so politely.\n- Be professional and friendly.`,
      'tech-support': `You are a technical support specialist for [Product Name].\n\nGuidelines:\n- Provide step-by-step instructions from the knowledge base.\n- If a solution isn't found, create a support ticket.\n- Maintain a patient and clear tone.`,
      'sales': `You are a sales assistant for [Company Name].\n\nGuidelines:\n- Highlight product features and benefits.\n- Answer questions about pricing and availability.\n- Guide customers to the checkout page.`,
      'custom': ''
    };
    const textarea = document.getElementById('system-prompt');
    if (textarea) {
      textarea.value = templates[templateName];
      if (templateName === 'custom') textarea.focus();
    }
  };

  // API Functions
  const testTelegramToken = async () => {
    const tokenInput = document.getElementById('bot-token');
    const statusDiv = document.getElementById('telegram-status');
    
    if (!tokenInput || !tokenInput.value.trim()) {
      alert('Please enter a Telegram bot token');
      return;
    }
    
    // Show loading
    statusDiv.innerHTML = '<span class="status-dot status-not-connected animate-pulse"></span><span class="text-yellow-600">Testing...</span>';
    
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}/test-telegram`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer MOCK_TOKEN_FOR_TESTING_test-user-1`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          telegram_token: tokenInput.value.trim() 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        statusDiv.innerHTML = '<span class="status-dot status-connected"></span><span class="text-green-600">Connected</span>';
      } else {
        statusDiv.innerHTML = '<span class="status-dot status-not-connected"></span><span class="text-red-600">Failed</span>';
      }
    } catch (error) {
      console.error('Telegram test failed:', error);
      statusDiv.innerHTML = '<span class="status-dot status-not-connected"></span><span class="text-red-600">Error</span>';
    }
  };

  const testAiApi = async () => {
    const keyInput = document.getElementById('api-key');
    const modelSelect = document.getElementById('model');
    const statusDiv = document.getElementById('api-status');
    
    if (!keyInput || !keyInput.value.trim()) {
      alert('Please enter an API key');
      return;
    }
    
    // Show loading
    statusDiv.innerHTML = '<span class="status-dot status-not-connected animate-pulse"></span><span class="text-yellow-600">Testing...</span>';
    
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}/test-ai-api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer MOCK_TOKEN_FOR_TESTING_test-user-1`,
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
      } else {
        statusDiv.innerHTML = '<span class="status-dot status-not-connected"></span><span class="text-red-600">Failed</span>';
      }
    } catch (error) {
      console.error('AI API test failed:', error);
      statusDiv.innerHTML = '<span class="status-dot status-not-connected"></span><span class="text-red-600">Error</span>';
    }
  };

  const activateAI = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer MOCK_TOKEN_FOR_TESTING_test-user-1`,
          'Content-Type': 'application/json'
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
          'Authorization': `Bearer MOCK_TOKEN_FOR_TESTING_test-user-1`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('AI deactivation failed:', error);
      return false;
    }
  };

  // Load existing files from backend
  const loadExistingFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}`, {
        headers: {
          'Authorization': `Bearer MOCK_TOKEN_FOR_TESTING_test-user-1`
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

  // Initialize
  useEffect(() => {
    // Set default template
    applyTemplate('customer-service');
    
    // Set up authentication token
    localStorage.setItem('token', 'MOCK_TOKEN_FOR_TESTING_test-user-1');
    
    // Load existing files
    loadExistingFiles();
    
    // Collapse panels by default
    setTimeout(() => {
      togglePanel('telegram-panel');
      togglePanel('model-panel');
      togglePanel('prompt-panel');
      togglePanel('kb-panel');
    }, 100);
    
    // Create Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  // Refresh Lucide icons when uploadedFiles changes
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [uploadedFiles]);

  const sendManualMessage = () => {
    const input = document.getElementById('manual-message-input');
    const messageText = input?.value.trim();
    
    if (!messageText) return;
    
    // Add the message to the current active user's conversation
    setUsers(prevUsers => {
      const updatedUsers = { ...prevUsers };
      const currentUser = updatedUsers[activeUserId];
      
      if (currentUser) {
        // Add the new message from human agent
        updatedUsers[activeUserId] = {
          ...currentUser,
          messages: [...currentUser.messages, { 
            from: 'human', 
            text: messageText,
            timestamp: new Date().toISOString()
          }],
          lastMessage: messageText
        };
      }
      
      return updatedUsers;
    });
    
    // Clear the input
    input.value = '';
    
    // Scroll to bottom of conversation feed
    setTimeout(() => {
      const conversationFeed = document.getElementById('conversation-feed');
      if (conversationFeed) {
        conversationFeed.scrollTop = conversationFeed.scrollHeight;
      }
    }, 100);
  };

  // Handle Enter key press in message input
  const handleMessageKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendManualMessage();
    }
  };

  // Fetch conversations from API
  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}/conversations`, {
        headers: {
          'Authorization': `Bearer MOCK_TOKEN_FOR_TESTING_test-user-1`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.conversations) {
          const processedUsers = {};
          
          // Group conversations by customer
          result.conversations.forEach(conv => {
            const customerId = conv.customer_id;
            
            if (!processedUsers[customerId]) {
              processedUsers[customerId] = {
                name: conv.customer_name || 'Unknown User',
                username: `@${conv.customer_name?.toLowerCase().replace(' ', '_') || 'unknown'}`,
                avatar: `https://placehold.co/64x64/e0e7ff/4f46e5?text=${(conv.customer_name || 'U')[0]}`,
                chatId: conv.customer_id,
                userId: conv.customer_id,
                language: 'en-US',
                lastMessage: conv.message_text,
                messages: []
              };
            }

            // Add user message
            processedUsers[customerId].messages.push({
              from: 'user',
              text: conv.message_text,
              timestamp: conv.created_at
            });

            // Add AI response if exists
            if (conv.response_text) {
              processedUsers[customerId].messages.push({
                from: 'ai',
                text: conv.response_text,
                timestamp: conv.created_at
              });
            }

            // Update last message
            processedUsers[customerId].lastMessage = conv.message_text;
          });

          setUsers(processedUsers);
          
          // Set first user as active if none selected
          const userIds = Object.keys(processedUsers);
          if (userIds.length > 0 && !activeUserId) {
            setActiveUserId(userIds[0]);
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
      console.error('Error fetching conversations:', error);
    }
  };

  // Start polling for conversations
  const startConversationPolling = () => {
    if (isPolling) return; // Prevent multiple polling
    
    setIsPolling(true);
    fetchConversations(); // Initial fetch
    
    // Poll every 5 seconds
    const pollInterval = setInterval(() => {
      if (isAiActive) {
        fetchConversations();
      } else {
        clearInterval(pollInterval);
        setIsPolling(false);
      }
    }, 5000);
  };

  // Stop polling for conversations
  const stopConversationPolling = () => {
    setIsPolling(false);
  };

  // File upload functionality
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    const formData = new FormData();
    Array.from(files).forEach(file => {
      formData.append('documents', file);
    });
    
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}/upload-documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer MOCK_TOKEN_FOR_TESTING_test-user-1`
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
      // If it's a mock file without ID, just remove from state
      setUploadedFiles(files => files.filter((_, i) => i !== index));
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/ai-assistant/${currentAssistantId}/delete-document/${file.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer MOCK_TOKEN_FOR_TESTING_test-user-1`
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

  const handleAiActivation = async () => {
    if (isAiActive) {
      const success = await deactivateAI();
      if (success) {
        setIsAiActive(false);
        stopConversationPolling();
        if (!isHumanTakeoverActive) {
          // Update status to inactive
        }
      }
    } else {
      const success = await activateAI();
      if (success) {
        setIsAiActive(true);
        setIsHumanTakeoverActive(false);
        startConversationPolling();
      }
    }
  };

  const handleHumanTakeover = () => {
    setIsHumanTakeoverActive(!isHumanTakeoverActive);
    if (!isHumanTakeoverActive) {
      setIsAiActive(false);
    }
  };

  return (
    <>
      {/* Load Tailwind and Lucide */}
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/lucide@latest"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      
      <style>{`
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f3f4f6;
            overflow-x: hidden;
        }
        .card {
            background-color: white;
            border-radius: 0.75rem;
            padding: 1.5rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 500;
            transition: all 0.2s ease-in-out;
            cursor: pointer;
            border: none;
        }
        .btn-primary {
            background-color: #4f46e5;
            color: white;
        }
        .btn-primary:hover {
            background-color: #4338ca;
        }
        .btn-secondary {
            background-color: #e5e7eb;
            color: #374151;
        }
        .btn-secondary:hover {
            background-color: #d1d5db;
        }
        .input-field {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
        }
        .status-dot {
            width: 0.75rem;
            height: 0.75rem;
            border-radius: 50%;
            display: inline-block;
            margin-right: 0.5rem;
        }
        .status-not-connected { background-color: #9ca3af; }
        .status-connected { background-color: #22c55e; }
        .status-inactive { background-color: #ef4444; }
        .status-active { background-color: #22c55e; }

        #sidebar {
            transition: transform 0.3s ease-in-out;
        }
        #main-content {
            transition: margin-left 0.3s ease-in-out;
        }
        
        .panel-content {
            max-height: 1000px;
            overflow: hidden;
            transition: max-height 0.4s ease-in-out, opacity 0.3s ease-in-out, margin-top 0.4s ease-in-out;
            opacity: 1;
        }

        .panel-content.collapsed {
            max-height: 0;
            opacity: 0;
            margin-top: 0 !important;
        }
      `}</style>

      <div className="bg-gray-100 h-screen overflow-hidden">
        {/* Master Sidebar Toggle Button */}
        <button 
          id="sidebar-master-toggle" 
          className={`fixed ${isSidebarOpen ? 'left-80' : 'left-4'} top-6 z-30 p-2 bg-white rounded-md shadow-md transition-all duration-300 ease-in-out`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <i data-lucide={isSidebarOpen ? "chevrons-left" : "chevrons-right"} className="w-6 h-6 text-gray-700"></i>
        </button>

        <div className="relative h-full flex">
          {/* Sidebar */}
          <aside 
            id="sidebar" 
            className={`bg-white w-96 h-full p-6 fixed top-0 left-0 z-20 shadow-lg overflow-y-auto transition-transform duration-300 ease-in-out ${!isSidebarOpen ? '-translate-x-full' : 'transform-none'}`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Configuration</h2>
            </div>
            
            <div className="flex flex-col gap-6">
              {/* 1. Telegram Bot Configuration */}
              <div className="card !p-4 !shadow-none border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('telegram-panel')}>
                  <h2 className="text-md font-semibold text-gray-700 flex items-center">
                    <i data-lucide="send" className="w-5 h-5 mr-2 text-indigo-600"></i>
                    1. Telegram Bot Setup
                  </h2>
                  <i id="telegram-panel-icon" data-lucide="chevron-down" className="w-5 h-5 text-gray-500 transition-transform"></i>
                </div>
                <div id="telegram-panel-content" className="panel-content space-y-3 mt-3">
                  <div>
                    <label htmlFor="bot-token" className="block text-sm font-medium text-gray-600 mb-1">Bot Token</label>
                    <input type="password" id="bot-token" className="input-field" placeholder="Enter your Telegram Bot Token" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button onClick={testTelegramToken} className="btn btn-primary text-sm">Test</button>
                      <button className="btn btn-secondary text-sm">Guide</button>
                    </div>
                    <div id="telegram-status" className="flex items-center text-sm font-medium">
                      <span className="status-dot status-not-connected"></span>
                      <span className="text-gray-500">Offline</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. AI Model API Configuration */}
              <div className="card !p-4 !shadow-none border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('model-panel')}>
                  <h2 className="text-md font-semibold text-gray-700 flex items-center">
                    <i data-lucide="cpu" className="w-5 h-5 mr-2 text-indigo-600"></i>
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
                    <label htmlFor="api-key" className="block text-sm font-medium text-gray-600 mb-1">API Key</label>
                    <input type="password" id="api-key" className="input-field" placeholder="sk-ant-api03-..." />
                  </div>
                  <div>
                    <label htmlFor="model" className="block text-sm font-medium text-gray-600 mb-1">Model</label>
                    <select id="model" className="input-field bg-white">
                      <option>claude-3-5-sonnet-20241022</option>
                      <option>claude-3-5-haiku-20241022</option>
                      <option>claude-3-opus-20240229</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <button onClick={testAiApi} className="btn btn-primary text-sm">Test API</button>
                    <div id="api-status" className="flex items-center text-sm font-medium">
                      <span className="status-dot status-not-connected"></span>
                      <span className="text-gray-500">Offline</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. System Prompt Configuration */}
              <div className="card !p-4 !shadow-none border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('prompt-panel')}>
                  <h2 className="text-md font-semibold text-gray-700 flex items-center">
                    <i data-lucide="terminal" className="w-5 h-5 mr-2 text-indigo-600"></i>
                    3. AI Behavior Instructions
                  </h2>
                  <i id="prompt-panel-icon" data-lucide="chevron-down" className="w-5 h-5 text-gray-500 transition-transform"></i>
                </div>
                <div id="prompt-panel-content" className="panel-content space-y-3 mt-3">
                  <textarea id="system-prompt" className="input-field min-h-[120px] resize-y" placeholder="Enter your system prompt here..."></textarea>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Templates:</label>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('customer-service')}>Customer Service</button>
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('tech-support')}>Tech Support</button>
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('sales')}>Sales</button>
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('custom')}>Custom</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Knowledge Base Documents */}
              <div className="card !p-4 !shadow-none border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('kb-panel')}>
                  <h2 className="text-md font-semibold text-gray-700 flex items-center">
                    <i data-lucide="folder-up" className="w-5 h-5 mr-2 text-indigo-600"></i>
                    4. Knowledge Base
                  </h2>
                  <i id="kb-panel-icon" data-lucide="chevron-down" className="w-5 h-5 text-gray-500 transition-transform"></i>
                </div>
                <div id="kb-panel-content" className="panel-content mt-3">
                  <div 
                    id="drop-zone" 
                    className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                    onClick={handleDropZoneClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <i data-lucide="upload-cloud" className="w-8 h-8 text-gray-400 mb-1"></i>
                    <p className="text-sm text-gray-500">Drop files or <span className="text-indigo-600 font-semibold">click</span></p>
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
                          </div>
                          <button onClick={() => deleteFile(index)} className="text-red-500 hover:text-red-700 ml-2">
                            <i data-lucide="trash-2" className="w-4 h-4"></i>
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
          <main id="main-content" className={`flex-1 p-4 sm:p-6 md:p-8 transition-all duration-300 ease-in-out flex flex-col h-full ${isSidebarOpen ? 'md:ml-96' : ''}`}>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-grow">
              {/* Conversations List */}
              <div className="card xl:col-span-3 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center mb-4 flex-shrink-0">
                  <i data-lucide="users" className="w-5 h-5 mr-2 text-indigo-600"></i>
                  Conversations
                </h2>
                <div id="conversation-list" className="space-y-2 overflow-y-auto">
                  {Object.keys(users).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <i data-lucide="message-circle" className="w-12 h-12 mx-auto mb-3 text-gray-300"></i>
                      <p className="text-sm">No conversations yet</p>
                      <p className="text-xs text-gray-400 mt-1">Activate your AI assistant to start receiving messages</p>
                    </div>
                  ) : (
                    Object.keys(users).map((userId) => {
                      const user = users[userId];
                      return (
                        <div 
                          key={userId}
                          className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${userId === activeUserId ? 'bg-indigo-100' : 'hover:bg-gray-50'}`}
                          onClick={() => setActiveUserId(userId)}
                        >
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-3" />
                          <div className="flex-grow overflow-hidden">
                            <p className="font-semibold text-gray-800 truncate">{user.name}</p>
                            <p className="text-sm text-gray-500 truncate">{user.lastMessage}</p>
                          </div>
                          {/* Show unread indicator if this user has messages */}
                          {user.messages.length > 0 && (
                            <div className="w-2 h-2 bg-indigo-600 rounded-full ml-2"></div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Live Conversation Monitor */}
              <div className="card xl:col-span-5 flex flex-col">
                <h2 className="text-lg font-semibold text-gray-700 flex items-center mb-4 flex-shrink-0">
                  <i data-lucide="message-square-text" className="w-5 h-5 mr-2 text-indigo-600"></i>
                  Live Feed
                </h2>
                <div id="conversation-feed" className="bg-gray-50 p-4 rounded-lg overflow-y-auto space-y-4 flex-grow">
                  {!activeUserId || Object.keys(users).length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <i data-lucide="message-square" className="w-16 h-16 mx-auto mb-4 text-gray-300"></i>
                      <p className="text-lg font-medium mb-2">Select a conversation</p>
                      <p className="text-sm text-gray-400">Choose a conversation from the list to view messages</p>
                    </div>
                  ) : (
                    activeUserId && users[activeUserId] && users[activeUserId].messages ? users[activeUserId].messages.map((msg, index) => {
                    const user = users[activeUserId];
                    if (msg.from === 'user') {
                      return (
                        <div key={index}>
                          <p className="text-sm font-semibold text-gray-700">👤 Customer ({user.name.split(' ')[0]})</p>
                          <div className="bg-white p-3 rounded-lg mt-1 inline-block max-w-xs shadow-sm">
                            <p className="text-sm text-gray-800">{msg.text}</p>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={index}>
                          <p className={`text-sm font-semibold ${msg.from === 'ai' ? 'text-indigo-600' : 'text-green-600'} text-right`}>
                            {msg.from === 'ai' ? '🤖 AI Assistant' : '👤 Human Agent'}
                          </p>
                          <div className="flex justify-end">
                            <div className={`${msg.from === 'ai' ? 'bg-indigo-100' : 'bg-green-100'} p-3 rounded-lg mt-1 inline-block max-w-xs shadow-sm`}>
                              <p className="text-sm text-gray-800">{msg.text}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }) : null
                  )}
                </div>
                
                {/* Manual message input */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex-shrink-0">
                  <div className="flex gap-2">
                    <button className="btn btn-secondary px-3">
                      <i data-lucide="mic" className="w-4 h-4"></i>
                    </button>
                    <button className="btn btn-secondary px-3">
                      <i data-lucide="image" className="w-4 h-4"></i>
                    </button>
                    <input 
                      id="manual-message-input" 
                      type="text" 
                      placeholder="Type a message to take over..." 
                      className="input-field flex-grow"
                      onKeyDown={handleMessageKeyDown}
                    />
                    <button id="send-message-btn" className="btn btn-primary" onClick={sendManualMessage}>
                      <i data-lucide="send-horizontal" className="w-4 h-4"></i>
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-500">
                      <i data-lucide="refresh-cw" className="w-4 h-4 animate-spin"></i>
                      <span>Auto-refresh: ON</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Controls and User Info */}
              <div className="xl:col-span-4 flex flex-col gap-4">
                {/* User Information Panel */}
                <div className="card !p-4">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('user-panel')}>
                    <h2 className="text-md font-semibold text-gray-700 flex items-center">
                      <i data-lucide="user-circle" className="w-5 h-5 mr-2 text-indigo-600"></i>
                      Current User Information
                    </h2>
                    <i id="user-panel-icon" data-lucide="chevron-down" className="w-5 h-5 text-gray-500 transition-transform"></i>
                  </div>
                  <div id="user-panel-content" className="panel-content space-y-2 mt-3">
                    {activeUserId && users[activeUserId] ? (
                      <>
                        <div className="flex items-center gap-3">
                          <img src={users[activeUserId].avatar} alt="User Profile Picture" className="w-12 h-12 rounded-full" />
                          <div className="text-sm">
                            <p className="font-bold text-gray-800">{users[activeUserId].name}</p>
                            <p className="text-gray-500">{users[activeUserId].username}</p>
                          </div>
                        </div>
                        <div className="text-xs space-y-1 pt-2">
                          <p><strong className="font-medium text-gray-600">Chat ID:</strong> <span className="text-gray-800">{users[activeUserId].chatId}</span></p>
                          <p><strong className="font-medium text-gray-600">User ID:</strong> <span className="text-gray-800">{users[activeUserId].userId}</span></p>
                          <p><strong className="font-medium text-gray-600">Language:</strong> <span className="text-gray-800">{users[activeUserId].language}</span></p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <i data-lucide="user-circle" className="w-8 h-8 mx-auto mb-2 text-gray-300"></i>
                        <p className="text-sm">No user selected</p>
                        <p className="text-xs text-gray-400 mt-1">Select a conversation to view user details</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activation Control */}
                <div className="card !p-4 flex flex-col justify-between">
                  <div>
                    <h2 className="text-md font-semibold text-gray-700 flex items-center mb-3">
                      <i data-lucide="power" className="w-5 h-5 mr-2 text-indigo-600"></i>
                      System Control
                    </h2>
                    <div className="space-y-2">
                      <button 
                        id="activation-btn" 
                        className={`btn w-full h-14 text-lg font-bold tracking-wider ${isAiActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn-primary'}`}
                        onClick={handleAiActivation}
                      >
                        <i data-lucide={isAiActive ? "pause-circle" : "rocket"} className="w-5 h-5 mr-2"></i>
                        {isAiActive ? 'DEACTIVATE AI' : 'ACTIVATE AI'}
                      </button>
                      <button 
                        id="human-takeover-btn" 
                        className={`btn w-full h-10 text-base font-bold ${isHumanTakeoverActive ? 'bg-green-600 text-white hover:bg-green-700' : 'btn-secondary'}`}
                        onClick={handleHumanTakeover}
                      >
                        <i data-lucide={isHumanTakeoverActive ? "user-check" : "user-cog"} className="w-4 h-4 mr-2"></i>
                        {isHumanTakeoverActive ? 'End Takeover' : 'Human Takeover'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Status:</span>
                      <div id="system-status" className="flex items-center font-semibold">
                        <span className={`status-dot ${isAiActive ? 'status-active' : isHumanTakeoverActive ? 'status-active' : 'status-inactive'}`}></span>
                        <span className={isAiActive ? 'text-green-600' : isHumanTakeoverActive ? 'text-green-600' : 'text-red-600'}>
                          {isAiActive ? 'Active' : isHumanTakeoverActive ? 'Human Control' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Conversations:</span>
                      <span className="font-semibold text-gray-800">{Object.keys(users).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Success Rate:</span>
                      <span className="font-semibold text-gray-800">{Object.keys(users).length > 0 ? '100%' : '--'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>

        <script>{`
          // Initialize Lucide icons
          if (window.lucide) {
            lucide.createIcons();
          }
        `}</script>
      </div>
    </>
  );
}

export default AIAssistant;