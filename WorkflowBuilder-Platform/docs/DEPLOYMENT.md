# Deployment Guide

## 🔄 Production Deployment

### Backend (Render)
- **URL**: https://workflow-lg9z.onrender.com
- **Repository**: https://github.com/MuhamadTAH/Workflownode.git
- **Auto-deploy**: Pushes to `main` branch trigger automatic deployment
- **Database**: SQLite with persistent storage

### Frontend (Local Development)
- **Port**: Auto-detects (usually 5177)
- **Proxy**: Configured to connect to production backend
- **Hot reload**: Instant updates during development

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Quick Start
```bash
# Clone repository (if needed)
git clone https://github.com/MuhamadTAH/Workflownode.git

# Start development (use provided script)
./scripts/dev-start.bat  # Windows
./scripts/dev-start.sh   # Linux/Mac

# Or manually:
cd frontend
npm install
npm run dev
```

### Environment Variables
Backend environment variables are configured on Render:
- `JWT_SECRET`: Authentication secret
- `TELEGRAM_BOT_TOKEN`: Bot API token
- `DATABASE_URL`: SQLite database path

## 🚀 Deployment Process

### Backend Updates
1. **Commit changes**: `git add . && git commit -m "Update backend"`
2. **Push to GitHub**: `git push origin main`
3. **Auto-deploy**: Render automatically deploys from GitHub
4. **Verify**: Check https://workflow-lg9z.onrender.com/api/hello

### Frontend Updates
- No deployment needed - runs locally
- Changes are instant with hot reload
- Connect to production backend automatically

## 🔍 Monitoring

### Health Checks
- **Backend**: `GET /api/hello` should return success message
- **Database**: `GET /api/profile` (with auth) tests database connection
- **Telegram**: `POST /api/webhooks/telegram` receives bot messages

### Logs
- **Render Dashboard**: View deployment and runtime logs
- **Local logs**: `backend/logs/app-YYYY-MM-DD.log`

## ⚠️ Important Notes

1. **Backend runs on Render** - do not start locally for production
2. **Frontend runs locally** - connects to production backend
3. **Database changes** require backend restart (automatic on Render)
4. **Telegram webhooks** registered to production URL