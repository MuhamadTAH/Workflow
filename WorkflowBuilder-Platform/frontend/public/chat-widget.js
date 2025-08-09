/**
 * WorkflowBuilder Chat Widget
 * Embeddable chat widget for websites that connects to WorkflowBuilder Platform
 * 
 * Usage:
 * <script>
 *   window.WorkflowChatConfig = {
 *     workflowId: 'your-workflow-id',
 *     apiUrl: 'https://workflow-lg9z.onrender.com',
 *     position: 'bottom-right',
 *     theme: 'light'
 *   };
 * </script>
 * <script src="https://workflow-lg9z.onrender.com/chat-widget.js"></script>
 */

(function() {
    'use strict';

    // Default configuration
    const defaultConfig = {
        workflowId: null,
        apiUrl: 'https://workflow-lg9z.onrender.com',
        position: 'bottom-right',
        theme: 'light',
        title: 'Chat Support',
        welcomeMessage: 'Hello! How can I help you today?',
        placeholder: 'Type your message...',
        openByDefault: false,
        showTimestamp: true,
        enableTyping: true,
        pollInterval: 2000 // Poll for new messages every 2 seconds
    };

    // Merge user config with defaults
    const config = Object.assign({}, defaultConfig, window.WorkflowChatConfig || {});

    if (!config.workflowId) {
        console.error('WorkflowChat: workflowId is required');
        return;
    }

    // Chat widget state
    let isOpen = config.openByDefault;
    let sessionId = null;
    let lastMessageTime = null;
    let typingTimeout = null;
    let pollTimeout = null;

    // Generate or get session ID
    function getSessionId() {
        if (sessionId) return sessionId;
        
        // Try to get from localStorage first
        const stored = localStorage.getItem('workflowchat_session_' + config.workflowId);
        if (stored) {
            sessionId = stored;
            return sessionId;
        }

        // Generate new session ID
        sessionId = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('workflowchat_session_' + config.workflowId, sessionId);
        return sessionId;
    }

    // Get user info (can be customized)
    function getUserInfo() {
        return {
            userId: localStorage.getItem('workflowchat_user_id'),
            userEmail: localStorage.getItem('workflowchat_user_email'),
            userName: localStorage.getItem('workflowchat_user_name') || 'Guest'
        };
    }

    // Create chat widget HTML
    function createChatWidget() {
        const positionClasses = {
            'bottom-right': 'bottom-5 right-5',
            'bottom-left': 'bottom-5 left-5',
            'top-right': 'top-5 right-5',
            'top-left': 'top-5 left-5'
        };

        const themeClasses = config.theme === 'dark' ? 
            'bg-gray-800 text-white border-gray-700' : 
            'bg-white text-gray-800 border-gray-300';

        const widget = document.createElement('div');
        widget.id = 'workflowchat-widget';
        widget.className = `fixed ${positionClasses[config.position]} z-50 font-sans`;
        
        widget.innerHTML = `
            <!-- Chat Toggle Button -->
            <div id="workflowchat-toggle" class="w-16 h-16 ${themeClasses} rounded-full shadow-lg cursor-pointer flex items-center justify-center border-2 hover:shadow-xl transition-all duration-200 ${isOpen ? 'hidden' : ''}">
                <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v3c0 .6.4 1 1 1h.5c.2 0 .5-.1.7-.3L14.6 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 14H6v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
                </svg>
                <div id="workflowchat-notification" class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hidden">0</div>
            </div>

            <!-- Chat Window -->
            <div id="workflowchat-window" class="w-80 h-96 ${themeClasses} rounded-lg shadow-2xl border-2 overflow-hidden flex flex-col ${isOpen ? '' : 'hidden'}">
                <!-- Header -->
                <div class="p-4 border-b ${config.theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'} flex justify-between items-center">
                    <h3 class="font-semibold text-lg">${config.title}</h3>
                    <button id="workflowchat-close" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
                </div>

                <!-- Messages Area -->
                <div id="workflowchat-messages" class="flex-1 p-4 overflow-y-auto space-y-3">
                    <div class="flex">
                        <div class="max-w-xs px-4 py-2 rounded-lg ${config.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} text-sm">
                            ${config.welcomeMessage}
                        </div>
                    </div>
                </div>

                <!-- Typing Indicator -->
                <div id="workflowchat-typing" class="px-4 text-xs text-gray-400 hidden">
                    <div class="flex items-center space-x-1">
                        <span>AI is typing</span>
                        <div class="flex space-x-1">
                            <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                            <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                            <div class="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="p-4 border-t ${config.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}">
                    <div class="flex space-x-2">
                        <input type="text" id="workflowchat-input" placeholder="${config.placeholder}" 
                               class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${config.theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}">
                        <button id="workflowchat-send" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(widget);
    }

    // Send message to workflow
    async function sendMessage(message) {
        try {
            showTypingIndicator(true);
            
            const userInfo = getUserInfo();
            const response = await fetch(`${config.apiUrl}/api/chat/webhook/${config.workflowId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    sessionId: getSessionId(),
                    userId: userInfo.userId,
                    userEmail: userInfo.userEmail,
                    userName: userInfo.userName,
                    websiteUrl: window.location.href,
                    metadata: {
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString(),
                        referrer: document.referrer
                    }
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to send message');
            }

            addMessage(message, 'user');
            lastMessageTime = new Date();
            
            // Start polling for responses
            startPolling();

        } catch (error) {
            console.error('WorkflowChat: Error sending message:', error);
            showTypingIndicator(false);
            addMessage('Sorry, there was an error sending your message. Please try again.', 'error');
        }
    }

    // Poll for new messages
    async function pollMessages() {
        try {
            const response = await fetch(`${config.apiUrl}/api/chat/session/${getSessionId()}/messages?after=${lastMessageTime ? lastMessageTime.toISOString() : ''}`);
            const data = await response.json();

            if (data.success && data.hasNewMessages) {
                // Add new bot messages
                data.pendingResponses.forEach(message => {
                    addMessage(message.content, 'bot', message.timestamp);
                    if (message.timestamp) {
                        lastMessageTime = new Date(message.timestamp);
                    }
                });

                showTypingIndicator(false);
                
                // Show notification if chat is closed
                if (!isOpen) {
                    showNotification(data.pendingResponses.length);
                }
            }
        } catch (error) {
            console.error('WorkflowChat: Error polling messages:', error);
        }

        // Continue polling
        pollTimeout = setTimeout(pollMessages, config.pollInterval);
    }

    // Start polling for messages
    function startPolling() {
        if (pollTimeout) {
            clearTimeout(pollTimeout);
        }
        pollTimeout = setTimeout(pollMessages, 1000); // First poll after 1 second
    }

    // Add message to chat
    function addMessage(text, type, timestamp) {
        const messagesContainer = document.getElementById('workflowchat-messages');
        const messageDiv = document.createElement('div');
        
        const isUser = type === 'user';
        const isError = type === 'error';
        
        messageDiv.className = `flex ${isUser ? 'justify-end' : 'justify-start'}`;
        
        const bgColor = isError ? 'bg-red-100 text-red-800' :
                        isUser ? 'bg-blue-500 text-white' : 
                        config.theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800';

        let timestampHtml = '';
        if (config.showTimestamp && timestamp) {
            const time = new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            timestampHtml = `<div class="text-xs text-gray-400 mt-1">${time}</div>`;
        }

        messageDiv.innerHTML = `
            <div class="max-w-xs px-4 py-2 rounded-lg ${bgColor} text-sm">
                <div>${text}</div>
                ${timestampHtml}
            </div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Show typing indicator
    function showTypingIndicator(show) {
        const typing = document.getElementById('workflowchat-typing');
        if (typing) {
            typing.classList.toggle('hidden', !show);
        }
    }

    // Show notification badge
    function showNotification(count) {
        const notification = document.getElementById('workflowchat-notification');
        if (notification && count > 0) {
            notification.textContent = count;
            notification.classList.remove('hidden');
        }
    }

    // Hide notification badge
    function hideNotification() {
        const notification = document.getElementById('workflowchat-notification');
        if (notification) {
            notification.classList.add('hidden');
        }
    }

    // Toggle chat window
    function toggleChat() {
        isOpen = !isOpen;
        const toggle = document.getElementById('workflowchat-toggle');
        const window = document.getElementById('workflowchat-window');
        
        if (toggle && window) {
            toggle.classList.toggle('hidden', isOpen);
            window.classList.toggle('hidden', !isOpen);
            
            if (isOpen) {
                hideNotification();
                document.getElementById('workflowchat-input').focus();
                startPolling();
            }
        }
    }

    // Initialize chat widget
    function initChatWidget() {
        // Add Tailwind CSS if not already present
        if (!document.querySelector('link[href*="tailwind"]') && !document.querySelector('script[src*="tailwind"]')) {
            const tailwindCSS = document.createElement('script');
            tailwindCSS.src = 'https://cdn.tailwindcss.com';
            document.head.appendChild(tailwindCSS);
        }

        // Create widget HTML
        createChatWidget();

        // Add event listeners
        document.getElementById('workflowchat-toggle').addEventListener('click', toggleChat);
        document.getElementById('workflowchat-close').addEventListener('click', toggleChat);
        
        const input = document.getElementById('workflowchat-input');
        const sendButton = document.getElementById('workflowchat-send');
        
        sendButton.addEventListener('click', () => {
            const message = input.value.trim();
            if (message) {
                sendMessage(message);
                input.value = '';
            }
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = input.value.trim();
                if (message) {
                    sendMessage(message);
                    input.value = '';
                }
            }
        });

        // Start polling if chat is open by default
        if (isOpen) {
            startPolling();
        }

        console.log('WorkflowChat: Widget initialized successfully');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatWidget);
    } else {
        initChatWidget();
    }

    // Expose API for external control
    window.WorkflowChat = {
        open: () => { if (!isOpen) toggleChat(); },
        close: () => { if (isOpen) toggleChat(); },
        sendMessage: sendMessage,
        setUserInfo: (userId, userEmail, userName) => {
            localStorage.setItem('workflowchat_user_id', userId);
            localStorage.setItem('workflowchat_user_email', userEmail);
            localStorage.setItem('workflowchat_user_name', userName);
        }
    };

})();