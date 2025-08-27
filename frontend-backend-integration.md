# Frontend-Backend Integration Plan

## Overview
Your stunning frontend design perfectly matches our advanced backend system. Here's the complete integration plan.

## API Integration Points

### 1. Configuration Panel Integration

#### Telegram Bot Setup
```javascript
// Test Telegram Token
async function testTelegramToken() {
    const token = document.getElementById('bot-token').value;
    const response = await fetch('/api/ai-assistant/1/test-telegram', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ telegram_token: token })
    });
    
    const result = await response.json();
    updateTelegramStatus(result.success);
}
```

#### AI Model Settings
```javascript
// Test AI API
async function testAiApi() {
    const apiKey = document.getElementById('api-key').value;
    const response = await fetch('/api/ai-assistant/1/test-ai-api', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ai_api_key: apiKey })
    });
    
    const result = await response.json();
    updateApiStatus(result.success);
}
```

#### Knowledge Base Upload
```javascript
// Handle file uploads
async function uploadDocuments(files) {
    const formData = new FormData();
    for (let file of files) {
        formData.append('documents', file);
    }
    
    const response = await fetch('/api/ai-assistant/1/upload-documents', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: formData
    });
    
    const result = await response.json();
    updateFileList(result.uploaded_files);
}
```

### 2. Live Dashboard Integration

#### WebSocket Connection for Real-time Updates
```javascript
// Initialize WebSocket connection
const socket = io('ws://localhost:3001');

// Authenticate with backend
socket.emit('authenticate', {
    token: localStorage.getItem('token'),
    userId: 'test-user-1'
});

// Listen for new conversations
socket.on('new_conversation', (data) => {
    updateConversationList(data.conversation);
    if (data.conversation.assistant_id === currentAssistantId) {
        addMessageToFeed(data.conversation);
    }
});

// Monitor specific assistant
function startMonitoring(assistantId) {
    socket.emit('monitor_assistant', { assistantId });
}
```

#### Conversation Management
```javascript
// Load conversations
async function loadConversations(assistantId) {
    const response = await fetch(`/api/ai-assistant-realtime/live-conversations/${assistantId}`, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    });
    
    const data = await response.json();
    renderConversations(data.recent_conversations);
}

// Get user information
async function loadUserInfo(customerId) {
    const response = await fetch(`/api/ai-assistant-advanced/customer/${customerId}`, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    });
    
    const userData = await response.json();
    renderUserInfo(userData.customer);
}
```

### 3. System Control Integration

#### AI Activation/Deactivation
```javascript
// Activate AI Assistant
async function activateAI() {
    const response = await fetch('/api/ai-assistant/1/activate', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    });
    
    const result = await response.json();
    if (result.success) {
        setAiActive(true);
        // Start monitoring for real-time updates
        startMonitoring(1);
    }
}

// Deactivate AI Assistant
async function deactivateAI() {
    const response = await fetch('/api/ai-assistant/1/deactivate', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    });
    
    const result = await response.json();
    if (result.success) {
        setAiActive(false);
    }
}
```

#### Human Takeover
```javascript
// Initialize human handoff
async function initiateHumanTakeover(customerId, reason) {
    const response = await fetch(`/api/ai-assistant-advanced/1/handoff`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token'),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            customer_id: customerId,
            reason: reason || 'Manual takeover from dashboard'
        })
    });
    
    const result = await response.json();
    if (result.success) {
        setHumanTakeoverActive(true);
        // Enable manual message input
        enableManualMessaging();
    }
}
```

### 4. Analytics Integration

#### Performance Metrics
```javascript
// Load performance data
async function loadPerformanceMetrics(assistantId, interval = '1h') {
    const response = await fetch(`/api/ai-assistant-realtime/performance/${assistantId}?interval=${interval}`, {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    });
    
    const data = await response.json();
    updatePerformanceStats(data.current_performance);
    updateTimeSeriesChart(data.time_series);
}

// Load analytics overview
async function loadAnalytics() {
    const response = await fetch('/api/ai-assistant-advanced/analytics/overview', {
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    });
    
    const data = await response.json();
    updateDashboardStats(data.analytics.overview);
}
```

## Complete Integration Example

Here's how to integrate your existing JavaScript with our backend:

```javascript
// Enhanced version of your existing functions
async function setAiActive(state) {
    if (state) {
        // Call backend activation
        const result = await activateAI();
        if (!result) return; // Failed to activate
        
        isAiActive = true;
        activationBtn.innerHTML = `<i data-lucide="pause-circle" class="w-5 h-5 mr-2"></i> DEACTIVATE AI`;
        activationBtn.classList.remove('btn-primary');
        activationBtn.classList.add('bg-red-600', 'hover:bg-red-700');
        systemStatus.innerHTML = `<span class="status-dot status-active"></span><span class="text-green-600">Active</span>`;
        
        // Start real-time monitoring
        startMonitoring(currentAssistantId);
        
        if (isHumanTakeoverActive) setHumanTakeoverActive(false);
    } else {
        // Call backend deactivation
        await deactivateAI();
        
        isAiActive = false;
        activationBtn.innerHTML = `<i data-lucide="rocket" class="w-5 h-5 mr-2"></i> ACTIVATE AI`;
        activationBtn.classList.add('btn-primary');
        activationBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        if (!isHumanTakeoverActive) {
            systemStatus.innerHTML = `<span class="status-dot status-inactive"></span><span class="text-red-600">Inactive</span>`;
        }
    }
    lucide.createIcons();
}

// Enhanced conversation rendering with real-time data
async function renderConversationFeed() {
    conversationFeed.innerHTML = '';
    
    // Load real conversation data from backend
    const conversations = await loadConversations(currentAssistantId);
    
    conversations.forEach(msg => {
        const messageElement = document.createElement('div');
        const timestamp = new Date(msg.created_at).toLocaleTimeString();
        
        if (msg.customer_message) {
            messageElement.innerHTML = `
                <p class="text-sm font-semibold text-gray-700">👤 ${msg.customer_name} <span class="text-xs text-gray-400">${timestamp}</span></p>
                <div class="bg-white p-3 rounded-lg mt-1 inline-block max-w-xs shadow-sm">
                    <p class="text-sm text-gray-800">${msg.customer_message}</p>
                </div>
            `;
        }
        
        if (msg.ai_response) {
            const responseDiv = document.createElement('div');
            responseDiv.innerHTML = `
                <p class="text-sm font-semibold text-indigo-600 text-right">🤖 AI Assistant <span class="text-xs text-gray-400">${timestamp}</span></p>
                <div class="flex justify-end">
                    <div class="bg-indigo-100 p-3 rounded-lg mt-1 inline-block max-w-xs shadow-sm">
                        <p class="text-sm text-gray-800">${msg.ai_response}</p>
                        <div class="text-xs text-gray-500 mt-1">
                            <span>⚡ ${msg.response_time_ms}ms</span>
                            ${msg.sentiment_score ? `| 😊 ${(msg.sentiment_score * 100).toFixed(0)}%` : ''}
                        </div>
                    </div>
                </div>
            `;
            messageElement.appendChild(responseDiv);
        }
        
        conversationFeed.appendChild(messageElement);
    });
    
    conversationFeed.scrollTop = conversationFeed.scrollHeight;
}
```

## Environment Setup

1. **Update your HTML file**:
   - Add Socket.IO client: `<script src="/socket.io/socket.io.js"></script>`
   - Add authentication token storage
   - Update API base URL configuration

2. **Add authentication**:
   ```javascript
   const API_BASE = 'http://localhost:3001/api';
   const WS_BASE = 'ws://localhost:3001';
   
   // Mock authentication (replace with real auth)
   localStorage.setItem('token', 'MOCK_TOKEN_FOR_TESTING_test-user-1');
   ```

3. **Initialize on page load**:
   ```javascript
   document.addEventListener('DOMContentLoaded', async () => {
       // Your existing initialization
       applyTemplate('customer-service');
       handleResize();
       
       // Add backend integration
       await initializeBackendConnection();
       await loadAnalytics();
       setupWebSocketConnection();
       
       // Collapse all config panels by default
       togglePanel('telegram-panel');
       togglePanel('model-panel');
       togglePanel('prompt-panel');
       togglePanel('kb-panel');
   });
   ```

## Ready for Integration!

Your frontend is perfectly designed and ready for our advanced backend system. The integration points align seamlessly with all our enterprise features:

✅ Real-time monitoring with WebSocket
✅ Advanced analytics dashboard  
✅ Multi-language support
✅ Human handoff system
✅ A/B testing capabilities
✅ Bulk operations
✅ Performance tracking

The result will be a complete, enterprise-grade AI Assistant platform that transforms complex workflow building into a simple, elegant user experience.