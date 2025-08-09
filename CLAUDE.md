# Claude Code Project Documentation

## 🔄 DEPLOYMENT & CONNECTION ARCHITECTURE

### How Backend & Frontend Connect
This project uses a **split deployment architecture**:
- **Frontend**: Runs locally on developer machine (localhost:5173+)
- **Backend**: Runs on Render production server (https://workflow-lg9z.onrender.com)
- **Connection**: Frontend makes API calls directly to production backend

**Why This Architecture?**
1. **Cost Efficiency**: Only backend needs production hosting (database, webhooks)
2. **Development Speed**: Frontend hot-reload during development
3. **Real Integration**: Frontend always tests against real production APIs
4. **Simplified Deployment**: Only backend auto-deploys, no frontend build/deploy needed

### Development Workflow:
```bash
# 1. Start Frontend (connects to production backend automatically)
cd frontend && npm run dev

# 2. Make Changes (edit frontend/backend code)

# 3. Commit & Push (triggers auto-deployment)
git add .
git commit -m "feature: description"
git push origin main

# 4. Render Auto-Deploys backend (1-2 minutes)
```

### URLs & Connections:
- **Frontend**: http://localhost:5173+ (auto-assigned port)
- **Backend**: https://workflow-lg9z.onrender.com  
- **GitHub**: https://github.com/MuhamadTAH/Workflow.git
- **Database**: SQLite (hosted with backend on Render)

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

## 🔧 COMMON TROUBLESHOOTING & FIXES

### 404 Route Not Found Errors

**Problem**: Frontend calls API endpoint but gets 404 error
```
ConfigPanel.js:445 POST http://localhost:3001/api/nodes/validate-telegram-token 404 (Not Found)
```

**Root Causes & Solutions**:

1. **Missing Dependency**: Route file can't load due to missing npm package
   ```bash
   # Error: Cannot find module 'uuid'
   # Fix: Add missing dependency
   cd backend && npm install uuid
   git add backend/package.json
   git commit -m "Add missing uuid dependency"  
   git push
   ```

2. **Route Not Registered**: Route exists in file but not loaded in main server
   ```javascript
   // backend/index.js - Ensure route is registered
   const nodesRoutes = require('./routes/nodes');
   app.use('/api/nodes', nodesRoutes);
   ```

3. **Wrong API Base URL**: Frontend calling localhost instead of production
   ```javascript
   // Fix: Update to always use production for specific features
   const API_BASE = 'https://workflow-lg9z.onrender.com';
   ```

4. **Route Definition Issues**: Syntax errors in route handlers
   ```javascript
   // Ensure proper async/await and error handling
   router.post('/validate-telegram-token', async (req, res) => {
     try {
       // ... route logic
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });
   ```

### Debugging Steps:
1. **Add Debug Logging**:
   ```javascript
   // In route files
   console.log('🚀 LOADING ROUTES FILE');
   router.use((req, res, next) => {
     console.log('🔍 ROUTE HIT:', req.method, req.url);
     next();
   });
   ```

2. **Check Server Startup Logs**: Verify all routes load without errors
3. **Test Route Registration**: Ensure routes appear in router.stack
4. **Verify Dependencies**: All required npm packages installed

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

## 🔧 CRITICAL FIXES REFERENCE (August 2025)

### 1. Telegram Token 404 Fix (Aug 8, 2025)
**Problem**: POST /api/nodes/validate-telegram-token → 404 Not Found  
**Cause**: Missing uuid dependency prevented routes from loading  
**Solution**: Added uuid to package.json, committed to GitHub  
**Files**: `backend/package.json`

### 2. Workflow Management Enhancements (Aug 8, 2025)  
**Added**: Stay-on-page after save, unsaved changes detection, infinite loop fix  
**Files**: `workflownode/components/core/App.js`, `Toolbar.js`, `WorkflowsOverview.jsx`

### 3. Node Visual System Perfection (Aug 6, 2025)
**Fixed**: Icon mapping, transparent backgrounds, text wrapping, enhanced visibility  
**Files**: `NodeShape.js`, `NodeStyles.css`

### 4. Backend Logic Nodes Support (Aug 9, 2025)
**Problem**: "Unsupported node type: switch" and "Unsupported node type: if" errors
**Solution**: Created complete backend implementations for If and Switch logic nodes
**Files**: `backend/nodes/logic/ifNode.js`, `backend/nodes/logic/switchNode.js`, `backend/controllers/nodeController.js`
**Features**: 
- If Node: Conditional true/false routing with multiple conditions and AND/OR logic
- Switch Node: Multi-path routing with multiple rules and fallback support
- Template expressions: Both nodes support `{{variable}}` syntax for dynamic values
- Multiple operators: equals, not equals, contains, greater/less than, regex, etc.

### 5. Activate Workflow Button & Automatic Execution (Aug 9, 2025)
**Added**: One-click workflow activation with automatic step-by-step processing
**Files**: `frontend/src/workflownode/utils/workflowExecutor.js`, `frontend/src/workflownode/components/core/App.js`, `frontend/src/workflownode/components/core/Toolbar.js`, `frontend/src/workflownode/styles/components/toolbar.css`
**Features**:
- 🚀 **Activate Workflow Button**: One-click activation that runs entire workflow automatically
- 🔧 **Workflow Execution Engine**: Automatic node processing in correct order based on connections
- 📊 **Progress Indicator**: Real-time updates on current execution step
- 🛑 **Stop Execution**: Ability to halt workflow execution mid-process
- ⚡ **Data Flow**: Each node receives processed data from previous nodes
- 🎯 **Error Handling**: Continues execution even if individual nodes fail
- ✅ **Visual States**: Normal, Running, Completed with appropriate colors and icons

### 6. 🔥 LIVE PREVIEW FIX for AI Agent & Telegram Nodes (Aug 9, 2025)
**Problem**: Live preview not working for AI agent and Telegram nodes - when users clicked TEST/GET, output data wasn't accessible by downstream nodes via "Get Data" button.
**Root Cause**: Output data was only stored in component's local state but not persisted to ReactFlow node data structure.
**Solution**: 
- **Added `onNodeUpdate` Callback**: Immediately updates ReactFlow node data when output is generated
- **Modified ConfigPanel**: Created `updateOutputData` function that updates both local state AND node data
- **Fixed ReactFlow Warning**: Changed from default import to named import
**Files Modified**: 
- `frontend/src/workflownode/components/core/App.js` - Added onNodeUpdate callback and passed to ConfigPanel
- `frontend/src/workflownode/components/panels/ConfigPanel.js` - Added updateOutputData to persist results immediately
**Key Code**:
```javascript
// App.js - Immediate node data update
const onNodeUpdate = useCallback((nodeId, dataUpdate) => {
  setNodes(nds => nds.map(node => 
    node.id === nodeId ? {...node, data: {...node.data, ...dataUpdate}} : node
  ));
}, [setNodes]);

// ConfigPanel.js - Dual update function
const updateOutputData = (newOutputData) => {
  setOutputData(newOutputData);           // Local UI state
  if (onNodeUpdate) {
    onNodeUpdate(node.id, { outputData: newOutputData }); // Persistent node data
  }
};
```
**Result**: ✅ All nodes (AI Agent, Telegram, Logic) now properly store execution results for downstream node access via live preview.

### 7. 🎯 TEMPLATE RESOLUTION & LIVE PREVIEW OVERHAUL (Aug 9, 2025)
**Problem**: Live preview and backend template resolution failed for complex paths like `{{1. Telegram Trigger[0].message.text}}` due to:
1. Frontend live preview not working with real connected node data
2. Backend template processing couldn't handle array indexing `[0]`  
3. Node keys with dots (e.g., "1. Telegram Trigger") broke path parsing
4. Different backend routes had different template resolution logic

**Root Cause**: Simple dot-splitting path parser `pathStr.split('.')` couldn't handle:
- Array indexing: `[0]`, `[1]`, etc.
- Node keys with dots: `"1. Telegram Trigger"` was split into `["1", " Telegram Trigger"]`
- Mixed syntax: `{{1. Telegram Trigger[0].message.text}}`

**Solution - Complete Template System Rewrite**:

**Frontend Fixes** (`frontend/src/workflownode/components/panels/ConfigPanel.js`):
- ✅ **Enhanced `resolveExpression`**: Added proper array indexing support
- ✅ **Smart Path Parser**: Handles node keys with dots using regex `^(\d+\.\s+[^[.]+)`
- ✅ **Array Traversal**: Supports numeric indices for array access
- ✅ **Cascading Data Structure**: Preserves `nodeId`, `nodeType`, `nodeLabel` for proper data flow
- ✅ **Live Preview**: Works with real connected node data instead of just static JSON

**Backend Fixes**:
1. **AI Agent Route** (`backend/routes/auth.js` - `/api/run-ai-agent`):
   - ✅ Updated `processTemplates` function with same improved parsing logic
   - ✅ Templates now resolve before sending to Claude API


2. **General Node Controller** (`backend/controllers/nodeController.js`):
   - ✅ Handles all other node types through centralized execution

**Key Technical Implementation**:
```javascript
// Smart path parser handles complex syntax
const parsePath = (pathStr) => {
  // Extract numbered node keys: "1. Telegram Trigger"
  const nodeKeyMatch = pathStr.match(/^(\d+\.\s+[^[.]+)/);
  
  // Parse array indices: [0] → numeric 0
  // Parse object properties: .message.text
  // Result: ["1. Telegram Trigger", 0, "message", "text"]
};

// Robust object/array traversal
const traversePath = (obj, pathParts) => {
  // Handles both obj.property and arr[0] syntax
  // Returns {found: boolean, value: any}
};
```

**Files Modified**:
- `frontend/src/workflownode/components/panels/ConfigPanel.js`
- `backend/routes/auth.js` 
- `backend/nodes/actions/aiAgentNode.js`

**Current Status**:
- ✅ **Frontend Live Preview**: Working perfectly
- ✅ **AI Agent Backend**: Templates resolve correctly  
- ✅ **Console Cleanup**: Removed verbose debug logging for production

**Result**: Template expressions like `{{1. Telegram Trigger[0].message.text}}` now properly resolve to actual values ("hello") instead of raw template syntax, enabling seamless data flow between connected workflow nodes.

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
- **Backend API**: https://workflow-lg9z.onrender.com
- **GitHub Repo**: https://github.com/MuhamadTAH/Workflow.git
- **Telegram Bot**: @AI_MarketingTeambot

---

*Complete Full-Stack Workflow Builder Platform with Visual Designer, Telegram Integration, Social Media Connections, and Production-Ready Architecture*

*Last Updated: August 9, 2025 - All systems operational including Activate Workflow feature, Live Preview Fix, and Template Resolution Overhaul*