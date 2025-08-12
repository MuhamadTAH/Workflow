# Claude Code Project Documentation

## 🔄 DEPLOYMENT & CONNECTION ARCHITECTURE

### How Backend & Frontend Connect
This project uses a **full production deployment architecture**:
- **Frontend**: Production hosted on Render (https://workflow-1-frkg.onrender.com)
- **Backend**: Production hosted on Render (https://workflow-unlq.onrender.com)
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
#    - Backend: https://workflow-unlq.onrender.com (1-2 minutes)
#    - Frontend: https://workflow-1-frkg.onrender.com (2-3 minutes)

# 4. Access live application at frontend URL
```

### URLs & Connections:
- **Frontend**: https://workflow-1-frkg.onrender.com (Production)
- **Backend**: https://workflow-unlq.onrender.com (Production API)
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
  ? 'https://workflow-unlq.onrender.com'
  : 'http://localhost:3001';
```

#### 2. Production-Only API Calls
Some features always use production (telegram validation, webhooks):
```javascript
// Always use production backend for telegram validation
const API_BASE = 'https://workflow-unlq.onrender.com';
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
- **Webhook**: https://workflow-unlq.onrender.com/api/webhooks/telegram

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
# View at: Render dashboard → workflow-unlq → Logs

# Test API endpoints
curl https://workflow-unlq.onrender.com/api/hello

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
- **Frontend**: https://workflow-1-frkg.onrender.com
- **Backend API**: https://workflow-unlq.onrender.com
- **GitHub Repo**: https://github.com/MuhamadTAH/Workflow.git
- **Telegram Bot**: @AI_MarketingTeambot

---

*Complete Full-Stack Workflow Builder Platform with Visual Designer, Telegram Integration, Social Media Connections, and Production-Ready Architecture*

### 8. 🔧 RENDER DEPLOYMENT FIXES (Aug 12, 2025)
**Major Issues Resolved**:

**✅ Backend SQLite Fix**: 
- **Problem**: better-sqlite3 native module compilation mismatch (Node.js 22 local vs Node.js 18 Render)
- **Solution**: Migrated from better-sqlite3 to sqlite3 with compatibility wrapper
- **Files**: `backend/package.json`, `backend/dbWrapper.js`, `backend/db.js`
- **Result**: Backend now running successfully at https://workflow-lg9z.onrender.com


**⚠️ Frontend Asset Serving Issue**:
- **Problem**: 404 errors for JavaScript assets (index-C65KcPNE.js) causing blank page
- **Partial Fix**: CSS files serve correctly, vendor/router JS files work, but main index.js (588KB) returns 404
- **Attempted Solutions**: Cache clearing, clean rebuilds, aggressive code splitting
- **Status**: Main JS bundle too large for Render static serving, needs further optimization

**Production URLs**:
- **Backend**: ✅ https://workflow-lg9z.onrender.com (Working)  
- **Frontend**: ⚠️ https://frontend-dpcg.onrender.com (Assets issue)

*Last Updated: August 12, 2025 - Backend fully operational, frontend assets issue requires code splitting optimization. For complete error history see error.md*

---

### 10. 🚨 PRODUCTION BACKEND REQUIREMENT & LOGIN ISSUE (Aug 12, 2025)

**CRITICAL POLICY**: This project uses **PRODUCTION-ONLY BACKEND**
- ❌ **NO LOCAL BACKEND DEVELOPMENT** - Always use production Render backend
- ✅ **Frontend Local Development**: `cd frontend && npm run dev` (connects to production API)
- ✅ **Production Backend**: https://workflow-lg9z.onrender.com (Render hosted)

**Current Login Issue**:
- **User**: mhamadtah548@gmail.com / 1qazxsw2 ✅ (Credentials verified - working locally)
- **Problem**: Render backend unresponsive (API timeouts on all endpoints)
- **Symptom**: Login requests timeout, all `/api/*` calls fail
- **Root Cause**: Production backend service down/sleeping/crashed on Render

**Authentication System Status**:
- ✅ **Database**: User exists, password hash correct
- ✅ **Login Logic**: JWT generation working (tested locally)  
- ✅ **Frontend**: Login form submits correctly
- ❌ **Production API**: Render backend not responding to requests

**Required Fix**:
1. Check Render dashboard for backend service status
2. Restart backend service if crashed/sleeping  
3. Monitor backend logs for startup errors
4. Verify database connectivity on production
5. Test login flow after backend restoration

**Production Architecture Reminder**:
```
Frontend (Local: npm run dev) → Production Backend (Render) → SQLite (Render)
Frontend (Prod: Render) → Production Backend (Render) → SQLite (Render)
```

**No Local Backend Policy**: Always troubleshoot and fix production backend issues rather than falling back to local development. This ensures consistency with deployed environment and proper testing of production configurations.