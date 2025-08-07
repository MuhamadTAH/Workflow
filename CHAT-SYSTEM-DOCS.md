# 💬 WorkflowBuilder Chat System Documentation

## 🎯 Overview
The WorkflowBuilder Chat System enables websites to integrate AI-powered chatbots that trigger automated workflows. Users can embed a professional chat widget on their websites and create intelligent workflows that respond to customer messages in real-time.

## 🏗️ System Architecture

### Backend Components
- **Chat Routes** (`/api/chat/*`) - Webhook endpoints for message processing
- **Chat Trigger Node** - Processes incoming website messages
- **Chat Response Node** - Sends replies back to website visitors
- **Session Management** - Tracks conversations and user context

### Frontend Components  
- **Chat Trigger Node** - Draggable node for workflow canvas
- **Chat Response Node** - Draggable response node for workflow canvas
- **Chat Widget** - Embeddable JavaScript widget for websites
- **Demo Page** - Complete integration example

## 🔗 Webhook URL Configuration

When you create a Chat Trigger node, it automatically generates a webhook URL that looks like:
```
https://workflow-lg9z.onrender.com/api/chat/webhook/your-workflow-id
```

**How to use this URL:**
1. **Copy the full webhook URL** from the Chat Trigger node configuration panel
2. **Extract the base URL** (everything before `/api/chat/webhook/`) for your `apiUrl`
3. **Use the workflow ID** (the last part of the URL) for your `workflowId`

**Example:**
- Full webhook URL: `https://workflow-lg9z.onrender.com/api/chat/webhook/support-chat-v1`
- Your `apiUrl`: `https://workflow-lg9z.onrender.com`
- Your `workflowId`: `support-chat-v1`

## 🚀 Quick Start Guide

### 1. Create a Chat Workflow
1. Go to `/workflow` in the WorkflowBuilder
2. Drag a **Chat Trigger** node from the sidebar to the canvas
3. Configure the Chat Trigger with a unique workflow ID
4. **📋 Copy the Webhook URL** that appears in the node configuration
5. Add processing nodes (AI Agent, Logic, etc.)
6. Add a **Chat Response** node to send replies
7. Connect all nodes and save the workflow

### 2. Embed Chat Widget on Your Website
```html
<!-- Configure the chat widget -->
<script>
  window.WorkflowChatConfig = {
    workflowId: 'your-workflow-id',        // ← From your Chat Trigger node
    apiUrl: 'https://workflow-lg9z.onrender.com', // ← Base URL from webhook URL
    position: 'bottom-right',
    theme: 'light',
    title: 'Chat Support',
    welcomeMessage: 'Hello! How can I help you today?'
  };
</script>

<!-- Load the chat widget -->
<script src="https://workflow-lg9z.onrender.com/chat-widget.js"></script>
```

### 3. Test Your Integration
- Visit your website with the embedded chat widget
- Send a message through the chat interface
- Watch your workflow execute and respond automatically
- Monitor messages in the WorkflowBuilder interface

## 🔧 API Endpoints

### Chat Webhook
**POST** `/api/chat/webhook/:workflowId`

Receives messages from website chat widgets and triggers workflows.

**Request Body:**
```json
{
  "message": "Hello, I need help!",
  "sessionId": "chat_1691234567890_abc123",
  "userId": "user_123",
  "userEmail": "user@example.com", 
  "userName": "John Doe",
  "websiteUrl": "https://example.com/contact",
  "metadata": {
    "userAgent": "Mozilla/5.0...",
    "timestamp": "2025-08-06T21:30:00.000Z",
    "referrer": "https://google.com"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message received and workflow triggered",
  "sessionId": "chat_1691234567890_abc123",
  "workflowId": "your-workflow-id"
}
```

### Send Response
**POST** `/api/chat/response/:sessionId`

Sends responses back to chat widgets (used by Chat Response nodes).

**Request Body:**
```json
{
  "content": "Thank you for your message! How can I assist you?",
  "type": "text",
  "delay": 0,
  "buttons": [
    {"text": "Get Help", "value": "help"},
    {"text": "Contact Sales", "value": "sales"}
  ]
}
```

### Get Messages
**GET** `/api/chat/session/:sessionId/messages`

Retrieves conversation history for a session.

**Query Parameters:**
- `after` - ISO timestamp to get messages after specific time

## 🎨 Chat Widget Configuration

### Basic Configuration
```javascript
window.WorkflowChatConfig = {
  workflowId: 'required-workflow-id',
  apiUrl: 'https://workflow-lg9z.onrender.com',
  position: 'bottom-right',  // bottom-left, top-right, top-left
  theme: 'light',           // light, dark
  title: 'Chat Support',
  welcomeMessage: 'Hello! How can I help?',
  placeholder: 'Type your message...',
  openByDefault: false,
  showTimestamp: true,
  enableTyping: true,
  pollInterval: 2000
};
```

### Advanced Features
- **Session Persistence** - Conversations persist across page reloads
- **User Identification** - Track users across multiple sessions
- **Real-time Polling** - Automatic message updates without page refresh
- **Notification Badges** - Visual indicators for new messages when chat is closed
- **Mobile Responsive** - Optimized for all screen sizes

## 🔄 Node Configuration

### Chat Trigger Node
**Purpose:** Start workflows from website chat messages

**Configuration Options:**
- **Workflow ID** (required) - Unique identifier for the chat workflow
- **Webhook URL** (readonly) - Copy this URL for your chat widget configuration
- **Filter Keywords** (optional) - Only trigger for messages containing specific words
- **Allowed Domains** (optional) - Restrict messages to specific domains
- **Require User Info** (optional) - Require email/name before processing
- **Auto Respond** (optional) - Send automatic acknowledgment message

**Output Data:**
```javascript
{
  "trigger": "chat",
  "workflowId": "your-workflow-id",
  "sessionId": "chat_session_123",
  "message": {
    "id": "msg_456",
    "content": "Hello, I need help!",
    "timestamp": "2025-08-06T21:30:00.000Z"
  },
  "user": {
    "id": "user_789",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "session": {
    "id": "chat_session_123",
    "messagesCount": 1,
    "websiteUrl": "https://example.com",
    "createdAt": "2025-08-06T21:30:00.000Z"
  }
}
```

### Chat Response Node
**Purpose:** Send responses back to website chat widgets

**Configuration Options:**
- **Response Text** - Static message to send
- **Use Template** - Enable dynamic content with variables
- **Template Text** - Message with variables like `{{user.name}}`
- **Response Type** - text, html, or markdown
- **Delay** - Wait before sending (0-30 seconds)
- **Quick Reply Buttons** - Interactive buttons for users

**Available Template Variables:**
- `{{user.name}}` - User's name or "Guest"
- `{{user.email}}` - User's email address
- `{{message.content}}` - Original message content
- `{{session.websiteUrl}}` - Website where message originated
- `{{session.messagesCount}}` - Number of messages in conversation
- `{{timestamp}}` - Current timestamp
- `{{date}}` - Current date
- `{{time}}` - Current time

**Example Template:**
```
Hello {{user.name}}! 

I received your message: "{{message.content}}"

Thanks for visiting {{session.websiteUrl}}. How can I help you today?
```

## 🎮 JavaScript API

The chat widget exposes a global API for programmatic control:

### Methods
```javascript
// Open the chat widget
WorkflowChat.open();

// Close the chat widget  
WorkflowChat.close();

// Send a message programmatically
WorkflowChat.sendMessage('Hello from JavaScript!');

// Set user information
WorkflowChat.setUserInfo('user123', 'user@example.com', 'John Doe');
```

### Example Usage
```javascript
// Set user info after login
document.getElementById('login-btn').addEventListener('click', function() {
  const userData = getCurrentUser(); // Your login logic
  WorkflowChat.setUserInfo(userData.id, userData.email, userData.name);
});

// Send predefined message
document.getElementById('help-btn').addEventListener('click', function() {
  WorkflowChat.open();
  WorkflowChat.sendMessage('I need help with my order');
});
```

## 🔍 Testing and Debugging

### Demo Page
Access the complete demo at `/chat-demo.html` to see:
- Live chat widget integration
- Configuration examples
- Testing buttons for quick interactions
- Real-time message flow

### Backend Logs
Monitor chat activity in the backend console:
```
🎯 Webhook received for node: your-workflow-id
📦 Request body: {"message": "Hello!", "sessionId": "..."}
✅ Found config for node: chat-trigger-123
🔄 Executing workflow for node: your-workflow-id
💬 Chat Response executing for node: chat-response-456
✅ Chat response sent successfully
```

### Frontend Console
Debug widget behavior in browser console:
```
WorkflowChat: Widget initialized successfully
🧪 Simulating test message: {"message": "Test", "sessionId": "..."}
📨 Webhook response: {success: true, message: "Message received..."}
✅ Test message sent successfully
```

## 🚀 Production Deployment

### Backend Requirements
- Node.js server running on port 3001 or configured PORT
- Required packages: `express`, `uuid`, `node-fetch`
- Chat routes registered in main application
- HTTPS endpoint for webhook security

### Frontend Integration
- Include chat widget script on target websites
- Configure unique workflow IDs for different sites
- Set up proper CORS policies for cross-origin requests
- Test on target domains before going live

### Scaling Considerations
- Session data stored in memory (consider Redis for production)
- Database persistence for conversation history
- Load balancing for multiple server instances
- Rate limiting for webhook endpoints

## 🛡️ Security Features

### Input Validation
- Sanitize all user messages and metadata
- Validate workflow IDs and session IDs
- Rate limiting on webhook endpoints
- Domain filtering for allowed sources

### Data Protection
- Session data encrypted and temporary
- User information handled according to privacy policies
- Secure HTTPS-only communication
- Optional user consent mechanisms

## 🔧 Troubleshooting

### Common Issues

**Chat Widget Not Appearing**
- Check that `workflowId` is configured
- Verify script is loading from correct URL
- Ensure no JavaScript errors in console
- Check Tailwind CSS is available or loading

**Messages Not Reaching Workflow**
- Verify backend server is running and accessible
- Check workflow ID matches between widget and backend
- Ensure chat routes are registered correctly
- Test webhook endpoint directly with curl/Postman

**Responses Not Appearing**
- Check Chat Response node configuration
- Verify session ID matches between trigger and response
- Monitor backend logs for response sending
- Test API endpoints for session message retrieval

### Debug Checklist
1. ✅ Backend server running on correct port
2. ✅ Chat routes registered and accessible
3. ✅ Frontend widget configured with correct workflow ID
4. ✅ No JavaScript console errors
5. ✅ Workflow contains both Chat Trigger and Chat Response nodes
6. ✅ Nodes are properly connected in workflow canvas

## 🎯 Best Practices

### Workflow Design
- Always include error handling nodes
- Use meaningful workflow IDs (e.g., `support-chat-v1`)
- Test workflows thoroughly before deployment
- Include logging for debugging and analytics

### User Experience
- Keep welcome messages concise and helpful
- Provide clear call-to-action buttons
- Set appropriate response delays for natural feel
- Handle edge cases gracefully (empty messages, errors)

### Performance
- Use appropriate polling intervals (2-5 seconds)
- Limit message history retention
- Implement message archiving for long conversations
- Monitor server resources and scale as needed

## 📊 Analytics and Monitoring

### Key Metrics to Track
- Number of chat sessions initiated
- Message response times
- Workflow execution success rates
- Most common user queries
- Conversion from chat to desired actions

### Implementation Ideas
- Add Google Analytics events for chat interactions
- Log conversation summaries to database
- Track user journey from chat to purchase/signup
- Monitor bot effectiveness and improve responses

---

**Chat System Status:** ✅ Production Ready
**Last Updated:** August 6, 2025
**Version:** 1.0.0

For technical support or feature requests, please refer to the main WorkflowBuilder documentation or contact the development team.