# Updated Environment Variables for Render Backend

## 🔧 Current Issue
Your backend environment has:
```
N8N_CORS_ORIGIN=https://frontend-dpcg.onrender.com
```

But your actual frontend URL is:
```
https://frontend-prox.onrender.com
```

## ✅ Corrected Environment Variables
Update these in your Render backend service (workflow-lg9z):

```
DB_SQLITE_DATABASE=/opt/render/.n8n/database.sqlite
DB_TYPE=sqlite
GENERIC_TIMEZONE=UTC
N8N_API_KEY=workflow2025_api_key
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_PASSWORD=workflow2025
N8N_BASIC_AUTH_USER=admin
N8N_CORS_ORIGIN=https://frontend-prox.onrender.com
N8N_FRAME_ANCESTORS=https://frontend-prox.onrender.com
N8N_HOST=0.0.0.0
N8N_LOG_LEVEL=info
N8N_PORT=10000
N8N_PROTOCOL=https
N8N_PUBLIC_API_DISABLED=false
N8N_SECURE_COOKIE=false
WEBHOOK_URL=https://workflow-lg9z.onrender.com
```

## 🔑 Key Changes Made
1. **N8N_CORS_ORIGIN**: Updated to `https://frontend-prox.onrender.com`
2. **N8N_FRAME_ANCESTORS**: Updated to `https://frontend-prox.onrender.com`

## 🚀 After Updating These Variables
1. Your iframe will load properly
2. No more CORS errors
3. Seamless workflow experience at `/workflow`

Your n8n is already running correctly - just need these CORS/iframe settings updated!