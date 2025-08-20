# Render Settings for Frontend with n8n Proxy

## Frontend Static Site Settings
**Service**: `frontend-dpcg`

### Build & Deploy
- **Root Directory**: `frontend`
- **Build Command**: `npm install --legacy-peer-deps && npm run build && npm run start`
- **Publish Directory**: `dist`

**IMPORTANT**: Change from "Static Site" to "Web Service" to run the proxy server!

### Environment Variables
```
NODE_ENV=production
VITE_API_BASE_URL=https://frontend-dpcg.onrender.com/api
```

## Backend n8n Settings  
**Service**: `workflow-lg9z`

### Build & Deploy
- **Root Directory**: `.` (empty)
- **Build Command**: `npm install`
- **Start Command**: `npx n8n start`

### Environment Variables
```
N8N_HOST=0.0.0.0
N8N_PORT=10000
N8N_PROTOCOL=https
WEBHOOK_URL=https://workflow-lg9z.onrender.com
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=workflow2025
DB_TYPE=sqlite
N8N_SECURE_COOKIE=true
N8N_LOG_LEVEL=info
GENERIC_TIMEZONE=UTC
```

## How It Works
1. User goes to `frontend-dpcg.onrender.com/workflow`
2. Frontend proxy server catches the request
3. Redirects to `/workflow-editor` which proxies to n8n backend
4. User stays on frontend domain but gets n8n functionality
5. Perfect for production - no backend URLs visible to users

## URLs After Deployment
- **Main App**: https://frontend-dpcg.onrender.com
- **Workflow Editor**: https://frontend-dpcg.onrender.com/workflow-editor
- **n8n Direct (hidden)**: https://workflow-lg9z.onrender.com

Users only see the frontend domain!