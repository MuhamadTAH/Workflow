# Claude Code Project Documentation

## Project Overview
Full-Stack Login & Signup System with React (Vite) + Express + SQLite

### Technology Stack
- **Frontend**: React (Vite) + Axios + React Router DOM
- **Backend**: Node.js + Express + bcrypt + JWT + SQLite
- **Database**: SQLite 
- **Auth**: JWT tokens (localStorage)

### Current Status
✅ **BACKEND COMPLETE**: Full authentication system implemented

#### Server Startup - You Should See:
```
🚀 Backend running at http://localhost:3001
✅ Connected to SQLite database
✅ Users table ready
```

#### API Endpoints Available:
- `GET /api/hello` → `{"message":"✅ Hello from the backend!"}`
- `POST /api/signup` → Create new user account
- `POST /api/login` → Authenticate user and get JWT token
- `GET /api/profile` → Get user data (requires Authorization header)

#### Database Schema:
```sql
users table:
- id (PRIMARY KEY, AUTO INCREMENT)
- name (TEXT, optional)
- email (TEXT, UNIQUE, required)
- password (TEXT, bcrypt hashed)
- created_at (DATETIME, auto-generated)
```

### Testing Instructions
- Backend connection: Should see `{"message":"✅ Hello from the backend!"}`
- Authentication: All endpoints return JSON responses with proper error handling
- JWT tokens: 24-hour expiration, stored in Authorization: Bearer format

## Work Log
- **2025-07-26**: 
  - ✅ Backend packages installed and tested
  - ✅ Environment variables configured (.env)
  - ✅ SQLite database setup with users table
  - ✅ Authentication routes implemented (signup/login/profile)
  - ✅ JWT middleware and bcrypt password hashing
  - ✅ Complete backend authentication system working
  - ✅ Frontend packages installed (axios, react-router-dom)
  - ✅ API configuration created (api.js with token management)
  - ✅ Login and Signup pages created with form handling
  - ✅ App.jsx updated with React Router and protected routes
  - ✅ **SYSTEM COMPLETE**: Full-stack authentication working

## 🐛 Bug Encountered & Fixed
**Problem**: Frontend signup/login returned 404 errors
- Console showed: `POST http://localhost:3001/api/signup 404 (Not Found)`
- Error: "Cannot POST /api/signup"

**Root Cause**: Routes not properly registered due to server restart needed
- Backend routes were correctly coded but server needed restart to register new routes
- The auth routes weren't being mounted properly on server instance

**Solution**: 
1. Restarted backend server (`Ctrl+C` then `node index.js`)
2. Verified all startup messages appeared correctly
3. Routes properly registered and working

**Lesson Learned**: 
- Always restart the server after adding new routes/middleware
- 404 errors on existing endpoints usually mean routes aren't registered
- Check server startup logs to ensure all modules load correctly
- Test individual endpoints manually when debugging routing issues

## 🎯 Final System Status
✅ **COMPLETE FULL-STACK AUTH SYSTEM**
- Backend: Express + SQLite + JWT + bcrypt working
- Frontend: React + React Router + Axios working  
- Authentication flow: Signup → Login → Protected Dashboard
- Token management: JWT stored in localStorage
- Protected routes: Auto-redirect to login when not authenticated
- User profile: Display user data on dashboard with logout functionality

## Testing Instructions
1. **Signup Flow**: Go to `/signup` → Enter details → Redirects to dashboard
2. **Login Flow**: Go to `/login` → Enter credentials → Redirects to dashboard  
3. **Dashboard**: Shows user profile, logout button, and backend test button
4. **Logout**: Clears token and redirects to login
5. **Protected Routes**: Accessing `/` without login redirects to `/login`

---

# 🤖 TELEGRAM WORKFLOW SYSTEM (July 27, 2025)

## Project Evolution: From Auth to Workflow Builder
The project evolved from a simple authentication system to a complete **n8n-like workflow builder** with **Telegram Bot integration**.

## Current System Architecture

### Core Components
- **Frontend**: React workflow builder with visual node editor
- **Backend**: Express + workflow execution engine  
- **Database**: SQLite for users + in-memory workflow storage
- **Telegram Integration**: Real bot API with webhook support
- **Development Tools**: Local testing + ngrok for production

### Technology Stack Extended
- **Workflow Engine**: Custom node-based execution system
- **Telegram API**: Bot token validation, webhook management, message processing
- **Real-time Data**: WebSocket-like message flow visualization
- **Development Modes**: Local testing (simulated) + Production (real webhooks)

## 🎯 CURRENT STATUS: FULLY FUNCTIONAL TELEGRAM WORKFLOW SYSTEM

### ✅ Completed Features

#### 1. Visual Workflow Builder (`/workflow`)
- **Drag & Drop Interface**: Add nodes from palette to canvas
- **Node Types**: Telegram Trigger, Telegram Send (extensible architecture)
- **Visual Connections**: Connect nodes with drag-and-drop
- **Real-time Configuration**: Instant parameter updates
- **Canvas Controls**: Pan, zoom, select, delete nodes
- **Save/Load System**: Export/import workflows as JSON

#### 2. Telegram Integration
- **Bot Token Validation**: Real Telegram API verification  
- **Webhook Management**: Auto-registration with Telegram servers
- **Message Processing**: Handle incoming Telegram updates
- **Template System**: Dynamic content with `{{variable}}` syntax
- **Error Handling**: Comprehensive logging and status tracking

#### 3. Development Modes
- **🏠 Local Testing Mode**: 
  - Simulated Telegram messages (no external setup needed)
  - Perfect for workflow development and testing
  - "Send Test Message" button for instant testing
- **🌐 Production Mode**:
  - Real Telegram webhook integration
  - ngrok support for local development
  - Auto-detection and setup assistance

#### 4. Real-time Message Monitoring
- **📨 Recent Messages Panel**: Shows all incoming messages
- **Message Details**: Sender, text, timestamp, full JSON data
- **Visual Indicators**: Test vs Real messages
- **Data Flow Visualization**: See exactly what data flows through workflows

#### 5. Advanced Configuration System
- **Schema-driven UI**: Dynamic forms based on node types
- **Input/Output Mapping**: Clear data flow visualization  
- **Parameter Validation**: Real-time error checking
- **Template Support**: Auto-complete for available variables

## 🚀 Key Accomplishments

### Telegram Bot Integration (@AI_MarketingTeambot)
- **Bot Token**: Successfully validated working bot token
- **API Integration**: Full Telegram Bot API implementation
- **Webhook System**: Complete webhook lifecycle management
- **Message Types**: Support for text, commands, callback queries

### Workflow Execution Engine
- **Node Processing**: Async execution with data passing
- **Error Handling**: Graceful failure with detailed logging
- **Template Processing**: Dynamic content replacement
- **Execution Tracking**: Full audit trail of workflow runs

### Developer Experience
- **Hot Reload**: Instant feedback during development
- **Debug Tools**: Comprehensive logging and error messages
- **Status Indicators**: Real-time system health monitoring
- **Setup Assistance**: Guided ngrok configuration

## 📁 File Structure

### Key Frontend Files
- `frontend/src/pages/Workflow.jsx` - Main workflow builder interface
- `frontend/src/utils/nodeSchemas.js` - Node definitions and validation
- `frontend/src/styles.css` - UI styling and components
- `frontend/vite.config.js` - API proxy configuration

### Key Backend Files  
- `backend/routes/webhooks.js` - Telegram webhook handling and workflow management
- `backend/services/telegramAPI.js` - Telegram Bot API integration
- `backend/services/logger.js` - Structured logging system
- `backend/workflowEngine.js` - Workflow execution engine
- `backend/middleware/errorHandler.js` - Error handling and validation

## 🔧 Development Setup

### Server Startup Commands
```bash
# Backend (Port 3001)
cd backend && npm start

# Frontend (Port 5175 with proxy)
cd frontend && npm run dev
```

### For Real Telegram Messages
```bash
# Run ngrok to expose backend
ngrok http 3001

# Copy HTTPS URL to Production mode in UI
# Example: https://abc123.ngrok.io
```

## 🎮 How to Use the System

### 1. Basic Workflow Creation
1. Access: `http://localhost:5175/workflow`
2. Add Telegram Trigger node from palette  
3. Configure with bot token: `[USER_BOT_TOKEN]`
4. Add Telegram Send node and connect them
5. Configure send parameters (bot token, chat ID, message)

### 2. Local Testing (Recommended for Development)
1. Set Telegram Trigger to "🏠 Local Testing" mode
2. Click "🎧 Start Listening for Messages"  
3. Click "🧪 Send Test Message" to simulate Telegram input
4. Watch "📨 Recent Messages" panel for results
5. Messages flow through connected nodes automatically

### 3. Production Testing (Real Telegram Messages)
1. Run `ngrok http 3001` in terminal
2. Copy HTTPS URL (e.g., `https://abc123.ngrok.io`)
3. Set Telegram Trigger to "🌐 Production" mode
4. Paste ngrok URL in webhook field
5. Click "🎧 Start Listening for Messages"
6. Send real message to `@AI_MarketingTeambot`
7. Watch real messages appear in Recent Messages panel

## 📊 System Capabilities

### Message Processing
- **Input**: Any text message sent to Telegram bot
- **Processing**: Template replacement, data transformation
- **Output**: Responses sent back through Telegram API
- **Monitoring**: Full message tracking and debugging

### Workflow Types Supported
- **Telegram Trigger → Telegram Send**: Echo bot, auto-responders
- **Telegram Trigger → Multiple Actions**: Broadcast, multi-platform posting
- **Conditional Logic**: (Framework ready for future node types)
- **Data Transformation**: Template processing and variable substitution

### Data Flow Example
```
Telegram Message → Trigger Node → Process Templates → Send Node → Telegram Response
```

### Template System
```javascript
// Input: "Hello {{message.from.first_name}}!"
// With data: {message: {from: {first_name: "John"}}}
// Output: "Hello John!"
```

## 🔍 Debugging and Monitoring

### Browser Console Logs
- `🧪 Simulating test message:` - Test message details
- `📨 Webhook response:` - Backend response status
- `✅ Test message sent successfully` - Successful processing

### Backend Console Logs  
- `🎯 Webhook received for node:` - Incoming webhook data
- `📦 Request body:` - Full Telegram update JSON
- `✅ Found config for node:` - Webhook configuration lookup
- `🔄 Executing workflow for node:` - Workflow execution start

### Recent Messages Panel
- Real-time message display with sender details
- Expandable JSON view for full Telegram data structure
- Clear distinction between test and real messages
- Message history (last 10 messages)

## ⚠️ Known Issues and Solutions

### Issue: Pink Screen / Frontend Crash
**Cause**: React component error due to complex conditional logic
**Solution**: Simplified ngrok detection and removed problematic useEffect
**Status**: ✅ Fixed

### Issue: Webhook Not Receiving Messages  
**Cause**: Missing workflow registration or webhook configuration
**Solution**: Auto-register workflow and webhook config on listening start
**Status**: ✅ Fixed

### Issue: Port Conflicts
**Cause**: Multiple dev server instances running
**Solution**: Frontend auto-detects available ports (5173→5174→5175)
**Status**: ✅ Handled automatically

## 🎯 Production Readiness

### Local Development: 100% Ready
- ✅ Complete local testing environment
- ✅ No external dependencies needed
- ✅ Full workflow development and testing

### Production Deployment: Framework Ready
- ✅ ngrok integration for development  
- ✅ Webhook validation and security
- ✅ Error handling and logging
- 🔄 Ready for cloud deployment with HTTPS domain

## 🚀 Future Enhancements Ready

### Architecture Extensions
- **New Node Types**: Easy to add via nodeSchemas.js
- **Database Persistence**: Workflow storage system ready
- **User Workspaces**: Multi-user support framework in place
- **API Integrations**: Template system supports any REST API

### Immediate Extension Points
- Add more Telegram node types (photo, document, location)
- Implement conditional logic nodes  
- Add external API integration nodes
- Create scheduling and timer nodes

## 📝 For Future Claude Instances

### What's Working
- Complete Telegram workflow system with visual builder
- Local testing mode requires no external setup
- Production mode works with user's real bot token
- Message monitoring and debugging tools functional
- Template system for dynamic content working

### Current Servers
- Backend: `http://localhost:3001` 
- Frontend: `http://localhost:5175/workflow` (may auto-increment port)

### User's Bot Details
- Bot Name: AI Marketing Team
- Username: @AI_MarketingTeambot  
- Bot ID: 8148982414
- Token validation: ✅ Working

### Quick Start for New Claude
1. Check servers are running (backend port 3001, frontend auto-detects)
2. Navigate to `/workflow` page in browser
3. System should show working Telegram workflow builder
4. Local testing mode works immediately
5. For production: help user set up ngrok if needed

### Development Approach
- Always use Local Testing mode for development
- Only switch to Production mode for real Telegram integration
- Use Recent Messages panel for debugging
- Check browser and backend console for detailed logs

This system represents a complete transition from a simple auth system to a sophisticated workflow automation platform with real-time Telegram integration.