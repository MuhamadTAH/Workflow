# 🔧 Backend Environment Variables Update

## 🚨 **CRITICAL: n8n Iframe Configuration**

Your backend is showing "JavaScript required" error in iframe. Update these environment variables:

### **UPDATED Environment Variables:**

```env
DB_SQLITE_DATABASE=/opt/render/.n8n/database.sqlite
DB_TYPE=sqlite
GENERIC_TIMEZONE=UTC
N8N_API_KEY=workflow2025_api_key
N8N_BASIC_AUTH_ACTIVE=false
N8N_BASIC_AUTH_PASSWORD=workflow2025
N8N_BASIC_AUTH_USER=admin
N8N_CORS_ORIGIN=*
N8N_FRAME_ANCESTORS=*
N8N_HOST=0.0.0.0
N8N_LOG_LEVEL=info
N8N_PORT=10000
N8N_PROTOCOL=https
N8N_PUBLIC_API_DISABLED=false
N8N_SECURE_COOKIE=false
WEBHOOK_URL=https://workflow-lg9z.onrender.com
N8N_DISABLE_UI=false
N8N_EDITOR_BASE_URL=/
N8N_USER_MANAGEMENT_DISABLED=true
N8N_OWNER_NAME=Admin
N8N_OWNER_EMAIL=admin@workflow.com
N8N_OWNER_PASSWORD=workflow2025
```

### **CRITICAL Changes for Public Access:**
- 🔧 `N8N_BASIC_AUTH_ACTIVE=false` (disable authentication)
- 🔧 `N8N_USER_MANAGEMENT_DISABLED=true` (skip owner setup screen)
- 🔧 `N8N_OWNER_NAME=Admin` (auto-create owner)
- 🔧 `N8N_OWNER_EMAIL=admin@workflow.com` (auto-create owner)
- 🔧 `N8N_OWNER_PASSWORD=workflow2025` (auto-create owner)
- 🔧 `N8N_FRAME_ANCESTORS=*` (allow iframe embedding)
- 🔧 `N8N_CORS_ORIGIN=*` (allow all origins)

## 📋 **Steps to Apply:**

1. **Go to Render Dashboard**
2. **Select your backend service** (`workflow-lg9z`)
3. **Go to Environment tab**
4. **Update the variables** above
5. **Deploy/Restart the service**

## ✅ **After Update:**

Your iframe will work perfectly:
- **Frontend URL**: `https://frontend-prox.onrender.com/workflow`
- **Shows**: n8n embedded seamlessly
- **No**: CORS errors or iframe blocking

## 🚀 **Ready to Deploy:**

1. ✅ Frontend updated (WorkflowBuilder.jsx with professional iframe)
2. ⏳ Backend env vars (update these now)
3. ⏳ Push frontend changes to trigger deployment

**After both steps, your iframe will work perfectly!**