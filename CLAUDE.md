# Claude Code Project Documentation

## 🔄 DEPLOYMENT & CONNECTION ARCHITECTURE

### How Backend & Frontend Connect
This project uses a **full production deployment architecture**:
- **Frontend**: Production hosted on Render (https://frontend-dpcg.onrender.com)
- **Backend**: Production hosted on Render (https://workflow-lg9z.onrender.com)
- **Connection**: Frontend makes API calls directly to production backend via VITE_API_BASE_URL

**Architecture Benefits**:
1. **Full Production Setup**: Both frontend and backend hosted on Render
2. **Environment Variables**: VITE_API_BASE_URL automatically configures API connections
3. **Auto Deployment**: Both services auto-deploy on git push
4. **No Local Development Required**: Complete cloud-based workflow

### Development Workflow:
```bash
# 1. Make Changes (edit frontend/backend code locally)

# 2. Commit & Push (triggers auto-deployment of both services)
git add .
git commit -m "feature: description"
git push origin main

# 3. Render Auto-Deploys:
#    - Backend: https://workflow-lg9z.onrender.com (1-2 minutes)
#    - Frontend: https://frontend-dpcg.onrender.com (2-3 minutes)

# 4. Access live application at frontend URL
```

### URLs & Connections:
- **Frontend**: https://frontend-dpcg.onrender.com (Production)
- **Backend**: https://workflow-lg9z.onrender.com (Production API)
- **GitHub**: https://github.com/MuhamadTAH/Workflow.git
- **Database**: SQLite (hosted with backend on Render)
- **Local Development**: `cd frontend && npm run dev` (optional, for hot reload)

---

## 🌐 API CONNECTION SYSTEM

### Frontend → Backend Communication

#### 1. Environment-Based API Selection
Most components use environment detection:
```javascript
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://workflow-lg9z.onrender.com'
  : 'http://localhost:3001';
```

#### 2. Production-Only API Calls
Some features always use production (telegram validation, webhooks):
```javascript
// Always use production backend for telegram validation
const API_BASE = 'https://workflow-lg9z.onrender.com';
```

#### 3. CORS Configuration
Backend allows multiple frontend ports:
```javascript
// backend/index.js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 
           'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 
           'http://localhost:5179', 'http://localhost:3000'],
  credentials: true
}));
```

### Authentication Flow
```
1. User Login → Frontend sends to /api/login
2. Backend validates → Returns JWT token  
3. Frontend stores in localStorage
4. All API calls include: Authorization: Bearer {token}
5. Backend middleware validates JWT for protected routes
```

### Key API Endpoints:
- `/api/signup`, `/api/login` - Authentication
- `/api/profile` - User data  
- `/api/workflows/*` - Workflow CRUD operations
- `/api/nodes/*` - Node execution & validation
- `/api/webhooks/*` - Telegram webhook handling
- `/api/connections/*` - Social media OAuth

---


## 📱 OAUTH & SOCIAL MEDIA INTEGRATION

### OAuth Flow Architecture
```
1. Frontend: User clicks "Connect Platform" 
2. Redirect to: /api/auth/{platform} (Google, Facebook, etc.)
3. Backend: Initiates OAuth flow with platform
4. Platform: Redirects back with authorization code
5. Backend: Exchanges code for access tokens
6. Database: Stores tokens in social_connections table
7. Frontend: Updates UI to show connected status
```

### Social Connections Table:
```sql
social_connections: 
  - user_id (foreign key to users)
  - platform (tiktok, youtube, facebook, etc.)  
  - access_token, refresh_token
  - token_expires_at
  - platform_user_id, platform_username
  - is_active (boolean)
```

### Platform Integration Status:
- ✅ **Database Ready**: All OAuth fields prepared
- ✅ **Frontend UI**: Professional connection cards  
- 🔄 **Backend Routes**: OAuth handlers need implementation
- 📋 **Supported Platforms**: TikTok, YouTube, Facebook, Instagram, Telegram, WhatsApp, Twitter/X, LinkedIn

---

## 🤖 TELEGRAM BOT INTEGRATION

### Bot Configuration:
- **Name**: AI Marketing Team
- **Username**: @AI_MarketingTeambot  
- **Token**: `8148982414:AAEPKCLwwxiMp0KH3wKqrqdTnPI3W3E_0VQ`
- **Webhook**: https://workflow-lg9z.onrender.com/api/webhooks/telegram

### Webhook Flow:
```
1. User messages bot → Telegram sends POST to webhook
2. Backend receives at /api/webhooks/telegram
3. Workflow engine processes message through defined workflow
4. Response generated and sent back to user via Telegram API
```

### Token Validation System:
```javascript
// frontend/src/workflownode/components/panels/ConfigPanel.js
const validateTelegramToken = async (token) => {
  const response = await fetch(`${API_BASE}/api/nodes/validate-telegram-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  return response.json();
};
```

---

## 🎨 VISUAL WORKFLOW SYSTEM

### WorkflowNode Architecture:
```
frontend/src/workflownode/
├── components/
│   ├── core/
│   │   ├── App.js          ← Main workflow canvas  
│   │   ├── Sidebar.js      ← Node palette
│   │   └── Toolbar.js      ← Save/load controls
│   ├── nodes/
│   │   ├── NodeShape.js    ← 🎯 MASTER node controller
│   │   ├── NodeStyles.css  ← 🎯 MASTER styling
│   │   └── CustomLogicNode.js
│   └── panels/
│       └── ConfigPanel.js  ← Node configuration
├── styles/                 ← Global themes
└── utils/                  ← Helpers, constants
```

### Node System Features:
- **17+ Node Types**: Triggers, Actions, Logic, AI, Social Media
- **Real-time Configuration**: Instant parameter updates
- **Visual Feedback**: Icons, colors, status indicators  
- **Drag & Drop**: Intuitive workflow building
- **Connection System**: Visual node linking with validation

### Workflow Management:
- **Save System**: localStorage + backend persistence
- **Load System**: URL parameters (?load=workflowId)
- **Unsaved Changes**: Smart detection with warnings
- **Status Tracking**: Execution counts, last run times
- **Activate Workflow**: One-click automatic execution from start to finish
- **Execution Engine**: Topological sort for correct node order, data flow between nodes

---

## 🚀 PROJECT OVERVIEW

### Technology Stack
- **Frontend**: React 18 + Vite + ReactFlow + Axios + React Router DOM
- **Backend**: Node.js + Express + SQLite + JWT + bcrypt  
- **Hosting**: Render (backend) + Local development (frontend)
- **Integration**: Telegram Bot API + OAuth providers + AI APIs

### Complete Feature Set:
✅ **Authentication**: Signup/login with JWT tokens  
✅ **Visual Workflow Builder**: Drag-and-drop interface at `/workflow`  
✅ **Workflow Management**: Save, load, edit workflows at `/workflows`  
✅ **Telegram Integration**: Real bot with webhook processing  
✅ **Social Connections**: OAuth-ready for 8 platforms at `/connections`  
✅ **Node Execution**: Real-time workflow processing  
✅ **Unsaved Changes Detection**: Smart state tracking with warnings
✅ **Activate Workflow**: One-click automatic execution of entire workflow
✅ **Logic Nodes**: Complete backend support for If/Switch conditional routing  

### Database Schema:
```sql
users: id, name, email, password, created_at

social_connections: id, user_id, platform, access_token, refresh_token,
                   token_expires_at, platform_user_id, platform_username, 
                   platform_profile_url, connected_at, updated_at, is_active
```

---

## 🛠️ DEVELOPMENT COMMANDS

### Daily Development:
```bash
# Start frontend (automatically connects to production backend)
cd frontend && npm run dev

# For Telegram webhook testing (optional)
cd backend && npm start  # Local backend
ngrok http 3001         # Expose to internet
# Update webhook URL in Telegram trigger nodes
```

### Deployment (Automatic):
```bash
git add .
git commit -m "feature: description"
git push origin main
# Render auto-deploys backend in 1-2 minutes
```

### Troubleshooting:
```bash  
# Check backend logs
# View at: Render dashboard → workflow-lg9z → Logs

# Test API endpoints
curl https://workflow-lg9z.onrender.com/api/hello

# Install missing dependencies
cd backend && npm install package-name
git add package.json && git commit -m "Add dependency" && git push
```

---


## 📞 QUICK REFERENCE

### For New Developers:
1. **Clone**: `git clone https://github.com/MuhamadTAH/Workflow.git`
2. **Install**: `cd frontend && npm install` 
3. **Run**: `npm run dev` (connects to production backend automatically)
4. **Access**: Open browser to displayed localhost URL
5. **Develop**: Edit code, changes auto-reload
6. **Deploy**: Commit and push (backend auto-deploys)

### Key Files to Understand:
- `frontend/src/App.jsx` - Main routing and authentication
- `frontend/src/pages/Workflow.jsx` - Workflow builder page
- `frontend/src/workflownode/components/core/App.js` - Workflow canvas
- `backend/index.js` - Server setup and route registration
- `backend/routes/` - All API endpoints
- `backend/services/telegramAPI.js` - Telegram integration

### Production URLs:
- **Frontend**: https://frontend-dpcg.onrender.com
- **Backend API**: https://workflow-lg9z.onrender.com
- **GitHub Repo**: https://github.com/MuhamadTAH/Workflow.git
- **Telegram Bot**: @AI_MarketingTeambot

---

*Complete Full-Stack Workflow Builder Platform with Visual Designer, Telegram Integration, Social Media Connections, and Production-Ready Architecture*

## 🗑️ SYSTEM CLEANUP & REMOVAL DOCUMENTATION (August 17, 2025)

### Complete Removal of Functionality
**Request**: User requested 100% permanent removal of all functionality and mock data that was causing instant generic responses
**Action Taken**: Systematic removal of all related components, routes, controllers, and configuration

### Files Completely Removed:
1. **Frontend Components**:
   - `frontend/src/components/ChatWidget.jsx` - Deleted entire widget component
   - Removed DraggableNode components from `frontend/src/workflownode/components/core/Sidebar.js`
   - Removed configuration sections from `frontend/src/workflownode/components/panels/ConfigPanel.js`

2. **Backend Node Implementations**:
   - `backend/nodes/triggers/chatTriggerNode.js` - Deleted entirely
   - `backend/nodes/ChatTriggerResponseNode.js` - Deleted entirely

3. **Backend Routes & Controllers**:
   - Removed all related webhook routes from `backend/routes/webhooks.js`
   - Removed imports and cases from `backend/controllers/nodeController.js`
   - Removed processing logic from `backend/services/workflowExecutor.js`
   - Removed data processing from `backend/services/triggerDataProcessor.js`

4. **Frontend Configuration**:
   - Removed CHAT_WEBHOOK endpoint from `frontend/src/config/api.js`
   - Removed widget imports and state from `frontend/src/workflownode/components/core/App.js`

5. **Internationalization Files**:
   - Removed translation entries from all locale files (`en.json`, `fr.json`, `es.json`, `ar.json`)

6. **Test Files**:
   - `test-chat-trigger.html` - Deleted entirely
   - `test-hybrid-chat.html` - Deleted entirely
   - `test-workflow-registration.html` - Deleted entirely

### Deep Search & Verification:
- Performed comprehensive grep searches for any remaining references
- Found only documentation files (CLAUDE.md, error.md) and git history files with references
- All functional code successfully removed from the system

### Result:
✅ **100% Complete Removal** - All functional code eliminated from the workflow builder
✅ **No Mock Data Responses** - Instant generic responses completely eliminated
✅ **Clean System** - Only legitimate workflow triggers and responses remain
✅ **Project Integrity Maintained** - Core workflow functionality unaffected

### Benefits of Removal:
- Eliminates confusing mock data in execution
- Removes instant generic responses that were not desired
- Simplifies the workflow system architecture
- Reduces codebase complexity and maintenance overhead
- Ensures users only see real data from actual message sources

*Removal completed successfully on August 17, 2025 - System now operates without the removed functionality*

---

*Last Updated: August 17, 2025 - Complete functionality removal documented*