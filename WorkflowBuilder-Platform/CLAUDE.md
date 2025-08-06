# Claude Code Project Documentation

## 🔄 DEPLOYMENT RULE
**IMPORTANT**: Backend runs on Render production server. When making backend changes:
1. Commit and push all changes to GitHub: https://github.com/MuhamadTAH/Workflownode.git
2. Render auto-deploys from GitHub pushes
3. Only run frontend locally: `cd frontend && npm run dev`
4. Backend URL: https://workflow-lg9z.onrender.com

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
- **Local/Production Modes**: Test workflows locally or with real Telegram messages

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

## 🔧 Recent Critical Fixes (Aug 2025)

### Node Visual System Perfection
1. **Fixed Icons**: Removed debug code, added complete FontAwesome mapping for all 17+ node types
2. **Eliminated Duplicates**: Removed global CSS adding extra plane icons to all nodes  
3. **Clean Backgrounds**: Made nodes transparent, removed unwanted circular backgrounds
4. **Text Wrapping**: Fixed overflow issues, added proper word wrapping within node boundaries
5. **Enhanced Visibility**: Improved icon contrast, size, and definition

### Files Modified
- `NodeShape.js` - Complete icon mapping system
- `NodeStyles.css` - Enhanced visibility & text wrapping
- `styles.css` - Removed conflicting global styles
- `App.js` - Fixed ReactFlow deprecation warnings

---

*Current State: Production-ready workflow automation platform with professional node system, real Telegram integration, and complete social media framework*  
*Last Updated: August 6, 2025*