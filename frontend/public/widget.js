(function() {
  'use strict';

  // Prevent multiple initialization
  if (window.ChatWidget) {
    return;
  }

  // Widget CSS
  const CSS = `
    .chat-widget {
      position: fixed;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }
    
    .chat-widget-bottom-right {
      bottom: 20px;
      right: 20px;
    }
    
    .chat-widget-bottom-left {
      bottom: 20px;
      left: 20px;
    }
    
    .chat-widget-top-right {
      top: 20px;
      right: 20px;
    }
    
    .chat-widget-top-left {
      top: 20px;
      left: 20px;
    }
    
    .chat-bubble {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .chat-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    .chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .chat-header {
      padding: 16px 20px;
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chat-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
    
    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 20px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .close-btn:hover {
      opacity: 0.8;
    }
    
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f8f9fa;
    }
    
    .message {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
    }
    
    .message.user {
      align-items: flex-end;
    }
    
    .message.agent,
    .message.bot {
      align-items: flex-start;
    }
    
    .message-bubble {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 18px;
      word-wrap: break-word;
      line-height: 1.4;
    }
    
    .message.user .message-bubble {
      background: var(--primary-color, #007bff);
      color: white;
    }
    
    .message.agent .message-bubble,
    .message.bot .message-bubble {
      background: white;
      color: #333;
      border: 1px solid #e1e5e9;
    }
    
    .message-time {
      font-size: 11px;
      color: #999;
      margin-top: 4px;
      padding: 0 4px;
    }
    
    .typing {
      background: white !important;
      border: 1px solid #e1e5e9 !important;
      padding: 12px 16px !important;
    }
    
    .typing-indicator {
      display: flex;
      gap: 4px;
    }
    
    .typing-indicator span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #999;
      animation: typing 1.4s infinite ease-in-out;
    }
    
    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.5;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }
    
    .chat-input {
      padding: 16px;
      background: white;
      border-top: 1px solid #e1e5e9;
      display: flex;
      gap: 12px;
      align-items: end;
    }
    
    .chat-input textarea {
      flex: 1;
      border: 1px solid #e1e5e9;
      border-radius: 20px;
      padding: 10px 16px;
      resize: none;
      outline: none;
      font-family: inherit;
      font-size: 14px;
      max-height: 80px;
      min-height: 20px;
    }
    
    .chat-input textarea:focus {
      border-color: var(--primary-color, #007bff);
    }
    
    .chat-input button {
      background: var(--primary-color, #007bff);
      color: white;
      border: none;
      border-radius: 20px;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    
    .chat-input button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .chat-input button:not(:disabled):hover {
      opacity: 0.9;
    }
    
    .chat-status {
      padding: 8px 16px;
      background: #f8f9fa;
      border-top: 1px solid #e1e5e9;
      font-size: 12px;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .status-indicator.connected {
      color: #28a745;
    }
    
    .status-indicator.disconnected {
      color: #dc3545;
    }
    
    @media (max-width: 480px) {
      .chat-window {
        width: calc(100vw - 40px);
        height: calc(100vh - 120px);
        bottom: 80px;
        right: 20px;
      }
      
      .chat-bubble {
        width: 50px;
        height: 50px;
        font-size: 20px;
      }
    }
  `;

  // Chat Widget Class
  class ChatWidgetClass {
    constructor() {
      this.isOpen = false;
      this.messages = [];
      this.sessionId = null;
      this.websocket = null;
      this.config = {
        position: 'bottom-right',
        primaryColor: '#007bff',
        welcomeMessage: 'Hello! How can we help you today?',
        placeholder: 'Type your message...',
        title: 'Chat with us'
      };
      this.apiUrl = '';
      this.widgetId = '';
    }

    init(options) {
      this.widgetId = options.widgetId;
      this.apiUrl = options.apiUrl;
      this.config = { ...this.config, ...options.config };

      // Inject CSS
      this.injectCSS();
      
      // Create widget elements
      this.createWidget();
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.appendToDOM();
        });
      } else {
        this.appendToDOM();
      }
    }

    injectCSS() {
      const style = document.createElement('style');
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    createWidget() {
      // Main container
      this.container = document.createElement('div');
      this.container.className = `chat-widget chat-widget-${this.config.position}`;
      this.container.style.setProperty('--primary-color', this.config.primaryColor);

      // Chat bubble
      this.bubble = document.createElement('button');
      this.bubble.className = 'chat-bubble';
      this.bubble.style.backgroundColor = this.config.primaryColor;
      this.bubble.innerHTML = '💬';
      this.bubble.onclick = () => this.toggleChat();

      // Chat window (initially hidden)
      this.window = document.createElement('div');
      this.window.className = 'chat-window';
      this.window.style.display = 'none';

      // Header
      const header = document.createElement('div');
      header.className = 'chat-header';
      header.style.backgroundColor = this.config.primaryColor;
      header.innerHTML = `
        <h3>${this.config.title}</h3>
        <button class="close-btn" onclick="window.ChatWidget.toggleChat()">×</button>
      `;

      // Messages container
      this.messagesContainer = document.createElement('div');
      this.messagesContainer.className = 'chat-messages';

      // Input container
      const inputContainer = document.createElement('div');
      inputContainer.className = 'chat-input';
      
      this.textarea = document.createElement('textarea');
      this.textarea.placeholder = this.config.placeholder;
      this.textarea.rows = 1;
      this.textarea.onkeypress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      };

      this.sendButton = document.createElement('button');
      this.sendButton.innerHTML = 'Send';
      this.sendButton.style.backgroundColor = this.config.primaryColor;
      this.sendButton.onclick = () => this.sendMessage();

      inputContainer.appendChild(this.textarea);
      inputContainer.appendChild(this.sendButton);

      // Status
      this.status = document.createElement('div');
      this.status.className = 'chat-status';
      this.status.innerHTML = '<span class="status-indicator disconnected">● Offline</span>';

      // Assemble window
      this.window.appendChild(header);
      this.window.appendChild(this.messagesContainer);
      this.window.appendChild(inputContainer);
      this.window.appendChild(this.status);

      // Assemble container
      this.container.appendChild(this.window);
      this.container.appendChild(this.bubble);
    }

    appendToDOM() {
      document.body.appendChild(this.container);
    }

    async toggleChat() {
      this.isOpen = !this.isOpen;
      
      if (this.isOpen) {
        this.window.style.display = 'flex';
        this.bubble.innerHTML = '✕';
        
        if (!this.sessionId) {
          await this.initializeChat();
        }
      } else {
        this.window.style.display = 'none';
        this.bubble.innerHTML = '💬';
      }
    }

    async initializeChat() {
      try {
        const response = await fetch(`${this.apiUrl}/api/chat-widget/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgetId: this.widgetId })
        });

        const data = await response.json();
        if (data.success) {
          this.sessionId = data.sessionId;
          this.connectWebSocket();
          
          // Add welcome message
          if (this.config.welcomeMessage) {
            this.addMessage(this.config.welcomeMessage, 'bot');
          }
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        this.addMessage('Sorry, chat is currently unavailable.', 'bot');
      }
    }

    connectWebSocket() {
      const wsUrl = this.apiUrl.replace('http', 'ws').replace('https', 'wss') + `/chat/${this.sessionId}`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        this.updateStatus('connected');
      };

      this.websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'message') {
          this.addMessage(data.message, data.sender || 'agent');
        }
      };

      this.websocket.onclose = () => {
        this.updateStatus('disconnected');
      };

      this.websocket.onerror = () => {
        this.updateStatus('disconnected');
      };
    }

    sendMessage() {
      const text = this.textarea.value.trim();
      if (!text || !this.sessionId) return;

      // Add user message
      this.addMessage(text, 'user');
      this.textarea.value = '';

      // Send via WebSocket
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.send(JSON.stringify({
          type: 'message',
          message: text,
          sessionId: this.sessionId
        }));
      }
    }

    addMessage(text, sender) {
      const messageEl = document.createElement('div');
      messageEl.className = `message ${sender}`;
      
      const bubbleEl = document.createElement('div');
      bubbleEl.className = 'message-bubble';
      bubbleEl.textContent = text;
      
      const timeEl = document.createElement('div');
      timeEl.className = 'message-time';
      timeEl.textContent = new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      messageEl.appendChild(bubbleEl);
      messageEl.appendChild(timeEl);
      this.messagesContainer.appendChild(messageEl);
      
      // Scroll to bottom
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    updateStatus(status) {
      const isConnected = status === 'connected';
      this.status.innerHTML = `
        <span class="status-indicator ${status}">
          ${isConnected ? '● Online' : '● Offline'}
        </span>
      `;
    }
  }

  // Create global instance
  window.ChatWidget = new ChatWidgetClass();

})();