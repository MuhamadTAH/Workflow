# Claude Code Project Documentation

## 🔄 DEPLOYMENT WORKFLOW
**IMPORTANT**: Backend runs on Render production server. Frontend runs locally.

### Development Process:
1. **Frontend Development**: Run `cd frontend && npm run dev` (connects to production backend)
2. **Make Changes**: Edit frontend/backend code as needed  
3. **Commit Changes**: `git add . && git commit -m "description"`
4. **Push to GitHub**: `git push origin main` → https://github.com/MuhamadTAH/Workflow.git
5. **Auto-Deploy**: Render automatically deploys backend from GitHub pushes

### URLs:
- **Frontend**: http://localhost:5173+ (or auto-assigned port)
- **Backend**: https://workflow-lg9z.onrender.com  
- **GitHub**: https://github.com/MuhamadTAH/Workflow.git

## Project Overview
Full-Stack Workflow Builder System with Telegram Integration (React + Express + SQLite)

### Technology Stack
- **Frontend**: React (Vite) + Axios + React Router DOM + ReactFlow
- **Backend**: Node.js + Express + bcrypt + JWT + SQLite
- **Database**: SQLite with users, social_connections tables
- **Auth**: JWT tokens (localStorage)

### Current Status
✅ **COMPLETE SYSTEMS**:
- Authentication system (signup/login/profile)
- Visual workflow builder with drag-and-drop interface at `/workflow`
- **Workflow Management System**: Save workflows → Auto-navigate to overview → Click to edit → Perfect loading
- Telegram bot integration (@AI_MarketingTeambot) with webhook support
- Social media connections page (OAuth-ready for 8 platforms)
- WorkflowNode master control system with professional UI

## 🚀 Key Features

### 1. Authentication System
- **Routes**: `/signup`, `/login`, `/` (dashboard)
- **API**: `/api/signup`, `/api/login`, `/api/profile`
- **Protection**: JWT tokens, auto-redirect for unauthenticated users

### 2. Workflow Builder (`/workflow`)
- **Visual Editor**: Drag-and-drop nodes from sidebar to canvas
- **17+ Node Types**: Telegram, AI Agent, Social Media, Logic nodes (If/Switch/Filter/etc.)
- **Real-time Config**: Instant parameter updates and connections
- **Stay After Save**: Remains on workflow builder after saving (no auto-navigation)
- **Perfect Loading**: Click workflow in overview → loads with all data intact
- **Local/Production Modes**: Test workflows locally or with real Telegram messages

### 2.1. Workflow Management (`/workflows`)
- **Overview Page**: View all saved workflows in professional cards
- **Real Data**: Loads from localStorage with status, node count, executions
- **Click to Edit**: Seamless workflow loading via `?load={workflowId}` parameter
- **Stay-on-Page**: After saving, remain on workflow builder (no auto-navigation)
- **Unsaved Changes**: Smart detection with visual warnings and browser alerts
- **Complete Cycle**: Save → Stay → Continue Working OR Navigate → Overview → Edit → Save

### 3. Telegram Integration
- **Bot**: @AI_MarketingTeambot (Token: `8148982414:AAE...`)
- **Webhook**: https://workflow-lg9z.onrender.com/api/webhooks/telegram
- **Features**: Message processing, template system, real-time monitoring

### 4. Social Connections (`/connections`)
- **8 Platforms**: TikTok, YouTube, Facebook, Instagram, Telegram, WhatsApp, Twitter/X, LinkedIn
- **Database**: `social_connections` table with OAuth fields ready
- **UI**: Professional card-based design with real-time status indicators

## 🎨 WorkflowNode Master Control System

### Architecture
```
frontend/src/workflownode/
├── components/
│   ├── core/ (App.js, Sidebar.js)
│   ├── nodes/
│   │   ├── NodeShape.js      ← 🎯 MASTER SHAPE CONTROLLER
│   │   ├── NodeStyles.css    ← 🎯 MASTER STYLE CONTROLLER
│   │   └── CustomLogicNode.js
│   └── panels/ (ConfigPanel.js)
├── styles/ (themes, components)
└── utils/ (helpers, hooks, constants)
```

### Master Control Files
- **NodeShape.js**: Controls ALL node structures, handles, layouts (150+ lines)
- **NodeStyles.css**: Controls ALL node appearances, colors, effects (300+ lines)
- **Single Source Control**: Edit 2 files to change ALL nodes instantly

### Current Node Features (2025-08-06)
- ✅ **Unique Icons**: 17+ node types with distinct FontAwesome icons
- ✅ **Transparent Background**: Nodes blend with canvas seamlessly  
- ✅ **Text Wrapping**: Proper text flow within node boundaries
- ✅ **Dynamic Height**: Auto-expanding containers for wrapped text
- ✅ **Enhanced Visibility**: 18px icons with improved contrast
- ✅ **Zero Artifacts**: No duplicate icons, unwanted backgrounds, or lines

## 🛠️ Development Commands

### Server Startup
```bash
# Backend (Port 3001) - Production on Render
cd backend && npm start

# Frontend (Port 5177 - auto-detects available ports)  
cd frontend && npm run dev
```

### For Real Telegram Messages
```bash
# Run ngrok to expose backend
ngrok http 3001
# Copy HTTPS URL to Production mode in UI
```

## 📁 Key Files

### Frontend Core
- `frontend/src/pages/Workflow.jsx` - Main workflow builder interface
- `frontend/src/pages/Connections.jsx` - Social media connections
- `frontend/src/workflownode/components/nodes/NodeShape.js` - Master node controller
- `frontend/src/workflownode/components/nodes/NodeStyles.css` - Master styling

### Backend Core  
- `backend/routes/webhooks.js` - Telegram webhook handling
- `backend/routes/connections.js` - Social connections API
- `backend/services/telegramAPI.js` - Telegram Bot API integration
- `backend/db.js` - Database schema (users, social_connections)

## 🎯 Production Information

### GitHub & Deployment
- **Repository**: https://github.com/MuhamadTAH/Workflow.git
- **Branch**: main
- **Backend**: Auto-deploys from GitHub to Render
- **Frontend**: Run locally, connects to production backend

### Telegram Bot
- **Name**: AI Marketing Team
- **Username**: @AI_MarketingTeambot
- **Bot ID**: 8148982414
- **Token**: `8148982414:AAEPKCLwwxiMp0KH3wKqrqdTnPI3W3E_0VQ`

### Database Tables
```sql
users: id, name, email, password, created_at
social_connections: id, user_id, platform, access_token, refresh_token, 
                   token_expires_at, platform_user_id, platform_username, 
                   platform_profile_url, connected_at, updated_at, is_active
```

## 🔧 Recent Critical Fixes & Improvements (Aug 2025)

### Workflow Management System Enhancements (Aug 8, 2025)
1. **Stay-on-Page After Save**: Removed automatic navigation to overview after saving workflows
2. **Unsaved Changes Detection**: 
   - Smart state comparison system tracks workflow name, nodes, and connections
   - Visual indicators with orange "Unsaved changes" text and pulsing animation
   - Enhanced save button shows "Save Changes" when unsaved changes exist
3. **Browser Warning System**: Warns before leaving page with unsaved changes
4. **Infinite Loop Fix**: Fixed "Maximum update depth exceeded" error when loading workflows
5. **Stable Workflow Loading**: Proper state management prevents duplicate loads and white pages

### Node Visual System Perfection
1. **Fixed Icons**: Removed debug code, added complete FontAwesome mapping for all 17+ node types
2. **Eliminated Duplicates**: Removed global CSS adding extra plane icons to all nodes  
3. **Clean Backgrounds**: Made nodes transparent, removed unwanted circular backgrounds
4. **Text Wrapping**: Fixed overflow issues, added proper word wrapping within node boundaries
5. **Enhanced Visibility**: Improved icon contrast, size, and definition

### Files Modified (Latest Updates)
- `App.js` (workflownode) - Unsaved changes detection, infinite loop fix
- `Toolbar.js` - Visual indicators for unsaved changes
- `toolbar.css` - Styling for unsaved changes indicators
- `WorkflowsOverview.jsx` - Real workflow data loading from localStorage
- `App.jsx` (main) - Updated routing and dashboard navigation
- `NodeShape.js` - Complete icon mapping system  
- `NodeStyles.css` - Enhanced visibility & text wrapping

---

*Current State: Production-ready workflow automation platform with complete workflow management system, professional node system, real Telegram integration, and social media framework*  
*Last Updated: August 8, 2025*