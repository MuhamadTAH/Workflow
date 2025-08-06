# WorkflowBuilder Platform Architecture

## 🏗️ System Overview

The WorkflowBuilder Platform is a full-stack workflow automation system with professional-grade UI components and real-time integrations.

## 📁 Project Structure

```
WorkflowBuilder-Platform/
├── backend/          # Express.js API server (Production on Render)
├── frontend/         # React frontend with Vite (Local development)
├── workflownode/     # Advanced node system with master control
├── docs/            # Documentation files
├── scripts/         # Development and deployment scripts
└── archive/         # Legacy/unused code
```

## 🔧 Core Systems

### 1. Authentication System
- **JWT-based authentication** with localStorage
- **Routes**: `/auth/login`, `/auth/signup`, `/dashboard`
- **Protection**: Auto-redirect for unauthenticated users

### 2. WorkflowNode System 
- **Master Control Architecture**: Edit 2 files to change all nodes
- **17+ Node Types**: Each with unique FontAwesome icons
- **Files**: `workflownode/components/nodes/NodeShape.js` + `NodeStyles.css`

### 3. Telegram Integration
- **Bot**: @AI_MarketingTeambot
- **Real-time processing** with webhook support
- **Local/Production modes** for development and testing

### 4. Social Media Connections
- **8 Platforms**: OAuth-ready infrastructure
- **Database**: `social_connections` table with complete schema

## 🚀 Technology Stack

### Frontend
- **React 19** with Vite build system
- **ReactFlow** for visual workflow editor
- **Tailwind CSS** for responsive design
- **FontAwesome** for professional icons

### Backend  
- **Node.js + Express** REST API
- **SQLite** database with JWT authentication
- **Real-time webhooks** for external integrations
- **Production deployment** on Render

### Development Tools
- **Hot reload** development environment
- **Automated scripts** for common tasks
- **Comprehensive logging** and error handling

## 🎯 Key Features

1. **Visual Workflow Builder** - Drag-and-drop interface
2. **Real-time Integrations** - Telegram, social media APIs  
3. **Professional UI** - Enterprise-grade design system
4. **Modular Architecture** - Clean separation of concerns
5. **Production Ready** - Deployed backend, local frontend development