import React, { useState, useEffect } from 'react';

function WhatsAppChat() {
  const [activeUserId, setActiveUserId] = useState('customer1');
  const [isAutoReplyActive, setIsAutoReplyActive] = useState(false);
  const [isHumanTakeoverActive, setIsHumanTakeoverActive] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentBusinessId] = useState(1);
  
  // API Configuration - Using production URLs from rules.md
  const API_BASE = 'https://workflow-lg9z.onrender.com/api';
  const WS_BASE = 'https://workflow-lg9z.onrender.com';

  // Mock WhatsApp conversations
  const users = {
    'customer1': {
      name: 'Ahmed Hassan',
      phoneNumber: '+201234567890',
      avatar: 'https://placehold.co/64x64/e0e7ff/4f46e5?text=AH',
      lastSeen: '2 minutes ago',
      status: 'online',
      lastMessage: 'Hello, I need help with my order',
      messages: [
        { from: 'user', text: 'Hello, I need help with my order', timestamp: '10:30 AM' },
        { from: 'business', text: 'Hi Ahmed! I\'d be happy to help you with your order. Could you please provide your order number?', timestamp: '10:32 AM' }
      ]
    },
    'customer2': {
      name: 'Sarah Johnson',
      phoneNumber: '+14155551234',
      avatar: 'https://placehold.co/64x64/fce7f3/db2777?text=SJ',
      lastSeen: '5 minutes ago',
      status: 'online',
      lastMessage: 'What are your business hours?',
      messages: [
        { from: 'user', text: 'What are your business hours?', timestamp: '10:25 AM' },
        { from: 'auto', text: 'Our business hours are Monday-Friday 9 AM to 6 PM, Saturday 10 AM to 4 PM. We\'re closed on Sundays.', timestamp: '10:25 AM' }
      ]
    },
    'customer3': {
      name: 'Carlos Rodriguez',
      phoneNumber: '+34612345678',
      avatar: 'https://placehold.co/64x64/d1fae5/059669?text=CR',
      lastSeen: '1 hour ago',
      status: 'away',
      lastMessage: 'Do you ship to Spain?',
      messages: [
        { from: 'user', text: 'Do you ship to Spain?', timestamp: '9:30 AM' }
      ]
    }
  };

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
      'welcome': `Welcome to [Business Name]! 👋\n\nHow can we help you today?\n\n• Check order status\n• Product information\n• Customer support\n• Business hours`,
      'business-hours': `Our business hours:\n\n🕘 Monday-Friday: 9 AM - 6 PM\n🕘 Saturday: 10 AM - 4 PM\n🕘 Sunday: Closed\n\nFor urgent matters, please leave a message and we'll respond during business hours.`,
      'order-help': `I'd be happy to help with your order! 📦\n\nPlease provide:\n• Your order number\n• Email used for the order\n\nI'll check the status for you right away.`,
      'custom': ''
    };
    const textarea = document.getElementById('auto-reply-template');
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


  // Initialize
  useEffect(() => {
    // Set default template
    applyTemplate('welcome');
    
    // Set up authentication token
    localStorage.setItem('token', 'MOCK_TOKEN_FOR_TESTING_test-user-1');
    
    // Collapse panels by default
    setTimeout(() => {
      togglePanel('whatsapp-panel');
      togglePanel('template-panel');
    }, 100);
    
    // Create Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  const sendManualMessage = () => {
    const input = document.getElementById('manual-message-input');
    if (input && input.value.trim()) {
      // Add message logic here
      const newMessage = {
        from: 'business',
        text: input.value.trim(),
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true 
        })
      };
      
      // Update the messages for active user (this is just for demo)
      users[activeUserId].messages.push(newMessage);
      users[activeUserId].lastMessage = newMessage.text;
      
      input.value = '';
      
      // Force re-render (in real app, you'd use proper state management)
      window.location.reload = window.location.reload;
    }
  };

  const handleAutoReplyToggle = async () => {
    setIsAutoReplyActive(!isAutoReplyActive);
    if (isAutoReplyActive) {
      setIsHumanTakeoverActive(false);
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
            background-color: #25D366;
            color: white;
        }
        .btn-primary:hover {
            background-color: #20B954;
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
            border-color: #25D366;
            box-shadow: 0 0 0 2px rgba(37, 211, 102, 0.2);
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
        .status-active { background-color: #25D366; }

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
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <i data-lucide="message-circle" className="w-6 h-6 mr-2 text-green-600"></i>
                WhatsApp Business
              </h2>
            </div>
            
            <div className="flex flex-col gap-6">
              {/* 1. WhatsApp Business Setup */}
              <div className="card !p-4 !shadow-none border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('whatsapp-panel')}>
                  <h2 className="text-md font-semibold text-gray-700 flex items-center">
                    <i data-lucide="smartphone" className="w-5 h-5 mr-2 text-green-600"></i>
                    1. Business Account Setup
                  </h2>
                  <i id="whatsapp-panel-icon" data-lucide="chevron-down" className="w-5 h-5 text-gray-500 transition-transform"></i>
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


              {/* 2. Message Templates */}
              <div className="card !p-4 !shadow-none border border-gray-200">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => togglePanel('template-panel')}>
                  <h2 className="text-md font-semibold text-gray-700 flex items-center">
                    <i data-lucide="message-square-text" className="w-5 h-5 mr-2 text-green-600"></i>
                    2. Auto-Reply Template
                  </h2>
                  <i id="template-panel-icon" data-lucide="chevron-down" className="w-5 h-5 text-gray-500 transition-transform"></i>
                </div>
                <div id="template-panel-content" className="panel-content space-y-3 mt-3">
                  <textarea id="auto-reply-template" className="input-field min-h-[120px] resize-y" placeholder="Enter your auto-reply template..."></textarea>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Quick Templates:</label>
                    <div className="flex flex-wrap gap-2">
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('welcome')}>Welcome</button>
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('business-hours')}>Business Hours</button>
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('order-help')}>Order Help</button>
                      <button className="btn btn-secondary text-xs" onClick={() => applyTemplate('custom')}>Custom</button>
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
                  {Object.keys(users).map((userId) => {
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
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Conversation Feed */}
              <div className="card xl:col-span-5 flex flex-col">
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
                
                <div id="conversation-feed" className="bg-gray-50 p-4 rounded-lg overflow-y-auto space-y-4 flex-grow">
                  {users[activeUserId].messages.map((msg, index) => {
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
                              {msg.from === 'auto' ? '🤖 Auto-Reply' : '👤 You'}
                            </p>
                            <div className={`p-3 rounded-lg rounded-tr-none shadow-sm max-w-xs ${msg.from === 'auto' ? 'bg-blue-100' : 'bg-green-100'}`}>
                              <p className="text-sm text-gray-800">{msg.text}</p>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-xs text-gray-500 mr-2">{msg.timestamp}</span>
                              <i data-lucide="check-check" className="w-3 h-3 text-blue-500"></i>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
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

export default WhatsAppChat;