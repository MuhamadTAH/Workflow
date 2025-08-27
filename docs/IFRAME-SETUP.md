# n8n Iframe Embedding Setup Instructions

## ✅ Frontend Changes Applied
The WorkflowBuilder.jsx has been updated to embed n8n directly in an iframe instead of using popup windows.

## 🔧 Required Backend Configuration

### Add Environment Variable on Render
Go to your Render backend service (workflow-lg9z) and add this environment variable:

```
N8N_FRAME_ANCESTORS=https://frontend-prox.onrender.com
```

**Why this is needed:**
- n8n has X-Frame-Options security headers that prevent iframe embedding by default
- This environment variable tells n8n to allow embedding from your frontend domain
- Without this, the iframe will show "refused to connect" error

### Alternative: Allow All Domains (Less Secure)
If you need to allow embedding from any domain:
```
N8N_FRAME_ANCESTORS=*
```

## 🚀 Result After Setup
- Users visit: `https://frontend-prox.onrender.com/workflow`
- See n8n embedded seamlessly (no popup)
- Professional user experience
- Same domain appearance

## 📝 Deployment Steps
1. ✅ Frontend updated (WorkflowBuilder.jsx modified)
2. ⏳ Add N8N_FRAME_ANCESTORS environment variable to backend
3. ⏳ Redeploy backend service
4. ✅ Push frontend changes to trigger deployment

After both steps, your workflow will be accessible at your frontend URL with professional iframe embedding.