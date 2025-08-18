# 📞 Claude Live Chat System Documentation

## 🎯 Overview
The Live Chat system is a ManyChat-style customer support interface that allows users to view and respond to messages sent to their connected Telegram bots. It provides a complete human handover system for automated workflows.

---

## 🏗️ Architecture

### Frontend Components
```
frontend/src/pages/
├── LiveChat.jsx     ← Main live chat component
└── LiveChat.css     ← Styling for live chat interface
```

### Backend Components
```
backend/routes/
├── livechat.js      ← Live chat API endpoints
└── webhooks.js      ← Webhook handlers for message storage

backend/db.js        ← Database table definitions
```

### Database Tables
```sql
telegram_conversations:
- id (PRIMARY KEY)
- user_id (FOREIGN KEY to users)
- telegram_chat_id (unique per user)
- telegram_username, telegram_first_name, telegram_last_name
- phone_number
- status ('automated', 'human', 'closed')
- assigned_agent_id
- last_message_text, last_message_timestamp
- created_at, updated_at

telegram_messages:
- id (PRIMARY KEY) 
- conversation_id (FOREIGN KEY)
- sender_type ('user', 'agent', 'system')
- sender_name
- message_text
- telegram_message_id
- timestamp
- metadata (JSON)
```

---

## 🎨 User Interface Design

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Navigation Bar                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Conversations │   Messages      │    Customer Info        │
│   List (33%)    │   Area (50%)    │    Panel (17%)         │
│                 │                 │                         │
│ [Contact 1]     │ User: Hello     │ 👤 John Doe            │
│ [Contact 2]     │ Agent: Hi!      │ 📱 @johndoe            │
│ [Contact 3]     │                 │ 📞 +1234567890          │
│                 │ ┌─────────────┐ │ 🔄 Status: Human       │
│                 │ │ [Type msg]  │ │ ⏰ Last: 2 mins ago    │
│                 │ │ 😀 📎 🎤 ↗️│ │                         │
│                 │ └─────────────┘ │                         │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Color Scheme (Luxury Dark Theme)
```css
Primary Background: #0B1426 (Deep navy)
Secondary Background: #1a2332 (Lighter navy)
Accent Gold: #D4AF37 (Luxury gold)
Text Primary: #E2E8F0 (Light gray)
Text Secondary: #94A3B8 (Medium gray)
Success: #10B981 (Green)
Warning: #F59E0B (Orange)
```

---

## ⚡ Key Features

### 1. **Real-time Conversation Management**
- Auto-load conversations from connected Telegram bots
- Real-time message display with sender identification
- Message threading and conversation history

### 2. **Human Handover System**
- Status tracking: `automated` → `human` → `closed`
- Agent assignment capability
- System messages for status changes

### 3. **Message Sending**
- Direct reply through Telegram Bot API
- Message validation and error handling
- Real-time UI updates

### 4. **Customer Information Panel**
- Contact details (name, username, phone)
- Conversation status and timing
- Activity tracking

---

## 🔧 How to Modify the Live Chat Page

### 🎨 **Changing the Visual Design**

#### Update Colors/Theme
```bash
# Edit the CSS file
frontend/src/pages/LiveChat.css

# Key sections to modify:
.live-chat-container     # Main container styles
.conversations-list      # Left panel styling  
.messages-area          # Center panel styling
.customer-info-panel    # Right panel styling
```

#### Modify Layout Proportions
```css
/* In LiveChat.css, change these grid values: */
.live-chat-content {
  grid-template-columns: 300px 1fr 250px; /* [left] [center] [right] */
}

/* To make conversations wider: */
grid-template-columns: 400px 1fr 200px;

/* To hide customer panel: */
grid-template-columns: 300px 1fr;
```

#### Add New UI Elements
```jsx
// In LiveChat.jsx, find the return statement around line 400
// Add elements between existing divs:

<div className="new-feature-panel">
  <h3>Custom Feature</h3>
  {/* Your content */}
</div>
```

### 📡 **Changing Functionality**

#### Add New Message Types
```javascript
// In LiveChat.jsx, modify the message rendering:
const renderMessage = (message) => {
  // Add new message types here
  if (message.type === 'file') {
    return <FileMessage message={message} />;
  }
  if (message.type === 'image') {
    return <ImageMessage message={message} />;
  }
  // ... existing code
};
```

#### Modify Message Sending Logic
```javascript
// In LiveChat.jsx, find handleSendMessage function
const handleSendMessage = async () => {
  // Add pre-send validation
  if (customValidation(messageText)) {
    // Your custom logic
  }
  
  // Modify request body
  body: JSON.stringify({
    message: messageText,
    botToken: botToken,
    customField: 'your value' // Add custom fields
  })
};
```

#### Add New API Endpoints
```javascript
// In backend/routes/livechat.js, add new routes:
router.post('/conversations/:id/custom-action', authenticateUser, async (req, res) => {
  // Your custom endpoint logic
});

// Remember to handle in frontend:
const customAction = async (conversationId) => {
  const response = await fetch(`${API_BASE}/api/live-chat/conversations/${conversationId}/custom-action`);
};
```

### 🗄️ **Database Modifications**

#### Add New Fields to Conversations
```javascript
// In backend/db.js, modify telegram_conversations table:
db.run(`ALTER TABLE telegram_conversations ADD COLUMN custom_field TEXT`);
```

#### Create New Related Tables
```sql
-- Add to backend/db.js
db.run(`
  CREATE TABLE IF NOT EXISTS conversation_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    tag_name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES telegram_conversations(id)
  )
`);
```

### 🔗 **Integration Changes**

#### Connect Different Platforms
```javascript
// To add WhatsApp/Instagram support:
// 1. Modify backend/routes/livechat.js to handle different platforms
// 2. Update database schema to include platform field
// 3. Modify frontend to show platform icons

// In LiveChat.jsx:
const platformIcons = {
  telegram: '📱',
  whatsapp: '💬', 
  instagram: '📷'
};
```

#### Add Automation Features
```javascript
// Add auto-responses in handleSendMessage:
const checkAutoResponse = (message) => {
  if (message.includes('hours')) {
    return 'Our business hours are 9 AM - 5 PM';
  }
  return null;
};
```

---

## 🚀 Deployment Process

### After Making Changes:

1. **Frontend Changes**
```bash
# Frontend auto-deploys on push
git add frontend/src/pages/LiveChat.jsx
git add frontend/src/pages/LiveChat.css
git commit -m "feat: update live chat UI"
git push origin mains
```

2. **Backend Changes**
```bash
# Backend auto-deploys on push  
git add backend/routes/livechat.js
git commit -m "feat: add new live chat API endpoint"
git push origin mains
```

3. **Database Changes**
```bash
# Database changes apply automatically on backend restart
# Render will restart backend in 1-2 minutes after push
```

---

## 🐛 Common Issues & Solutions

### **Issue: Messages Not Appearing**
```bash
# Check webhook connection:
curl -X GET "https://workflow-lg9z.onrender.com/api/webhooks/test"

# Verify database tables:
# Add debug endpoint in livechat.js to check data
```

### **Issue: Send Message Fails**
```javascript
// Add debugging in LiveChat.jsx:
console.log('Bot token:', botToken ? 'Present' : 'Missing');
console.log('Message text:', messageText);

// Check backend logs for validation errors
```

### **Issue: Styling Not Applied**
```bash
# Clear browser cache
# Check CSS file is imported in LiveChat.jsx:
import './LiveChat.css';

# Verify CSS selectors match component class names
```

---

## 📊 Performance Optimization

### **Reduce API Calls**
```javascript
// Use React.memo for conversation list
const ConversationItem = React.memo(({ conversation, onClick }) => {
  // Component code
});

// Implement pagination for large conversation lists
const [page, setPage] = useState(1);
const conversationsPerPage = 20;
```

### **Optimize Message Loading**
```javascript
// Add message pagination
const loadMoreMessages = async () => {
  const response = await fetch(
    `${API_BASE}/api/live-chat/conversations/${conversationId}/messages?offset=${messages.length}&limit=50`
  );
};
```

---

## 🔒 Security Considerations

### **Input Validation**
```javascript
// Always validate user input
const sanitizeMessage = (message) => {
  return message.replace(/<script.*?>.*?<\/script>/gi, '');
};
```

### **Authentication**
```javascript
// Ensure JWT tokens are properly validated
// Never expose bot tokens in frontend logs
console.log('Bot token:', botToken ? 'Present' : 'Missing'); // ✅ Good
console.log('Bot token:', botToken); // ❌ Bad - exposes secret
```

---

## 📞 API Reference

### **GET /api/live-chat/conversations**
Returns list of conversations for authenticated user

### **GET /api/live-chat/conversations/:id/messages**  
Returns messages for specific conversation

### **POST /api/live-chat/conversations/:id/send**
Sends message through Telegram bot
```json
{
  "message": "Hello customer!",
  "botToken": "bot_token_here"
}
```

### **PATCH /api/live-chat/conversations/:id/status**
Updates conversation status (automated/human/closed)

---

## 🎯 Future Enhancements

### **Planned Features**
- [ ] File attachment support
- [ ] Voice message handling  
- [ ] Conversation search and filtering
- [ ] Agent assignment UI
- [ ] Message templates/canned responses
- [ ] Conversation analytics dashboard
- [ ] Multi-language support
- [ ] Real-time notifications
- [ ] Mobile responsive design improvements

### **Integration Roadmap**
- [ ] WhatsApp Business API
- [ ] Instagram Direct Messages
- [ ] Facebook Messenger
- [ ] Live chat widget for websites
- [ ] Email integration
- [ ] CRM system connections

---

*Last Updated: August 18, 2025*
*Maintained by: Claude AI Assistant*
*Project: Workflow Automation Platform - Live Chat Module*