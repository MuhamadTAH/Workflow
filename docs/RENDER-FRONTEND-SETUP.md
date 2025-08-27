# Frontend Render Service Setup Guide

## Service Overview
**Service Type**: Web Service (NOT Static Site)  
**Purpose**: Serves React frontend + provides professional workflow launcher  
**Service Name**: `frontend-proxy` (or your chosen name)

---

## 🔧 Basic Configuration

### Repository Settings
```
Repository: https://github.com/MuhamadTAH/Workflow.git
Branch: mains
Root Directory: frontend
```

**Why these settings:**
- **Repository**: Your GitHub repo containing both frontend and backend code
- **Branch**: `mains` is your main development branch where all changes are pushed
- **Root Directory**: `frontend` tells Render to build from the frontend folder specifically

---

## 🏗️ Build & Deploy Settings

### Build Command
```bash
npm install --legacy-peer-deps && npm run build
```

**Why this command:**
- `npm install --legacy-peer-deps`: Installs dependencies, handles React peer dependency conflicts
- `npm run build`: Creates optimized production build using Vite (creates `dist` folder)
- We need the build step to create static assets before starting the Express server

### Start Command
```bash
node proxy-server.js
```

**Why this command:**
- Starts the Express server that serves your React app
- `proxy-server.js` handles both static file serving AND workflow launcher
- Uses Node.js to run the server (not just static file hosting)

---

## 🌐 Environment Variables

### Required Variables

#### NODE_ENV=production
**Purpose**: Tells Node.js this is production environment  
**Why needed**: 
- Optimizes performance
- Disables development warnings
- Enables production-level security

#### PORT (Optional)
**Default**: Render auto-assigns  
**Purpose**: Defines which port the server listens on  
**Why optional**: Render automatically sets this, but you can override if needed

---

## 🎯 Service Type: Web Service vs Static Site

### Why Web Service (NOT Static Site)?

#### Static Site Limitations:
❌ Only serves pre-built HTML/CSS/JS files  
❌ Cannot run server code  
❌ Cannot handle dynamic routing  
❌ Cannot create custom launchers or redirects  

#### Web Service Benefits:
✅ Runs Express server for custom functionality  
✅ Can serve static files AND handle dynamic requests  
✅ Enables professional workflow launcher  
✅ Allows future API integrations  
✅ Supports server-side routing  

---

## 📁 File Structure Expected by Render

```
frontend/
├── package.json          ← Contains build/start scripts
├── proxy-server.js       ← Express server for serving app
├── src/                  ← React source code
├── dist/                 ← Built files (created by build command)
├── public/               ← Static assets
└── ... other React files
```

**What Render does:**
1. Runs `npm install --legacy-peer-deps && npm run build`
2. This creates the `dist/` folder with built React app
3. Runs `node proxy-server.js`
4. Express server serves files from `dist/` folder + handles workflow launcher

---

## 🚀 How It All Works Together

### User Journey:
1. **User visits**: `your-frontend.onrender.com`
2. **Express server**: Serves React app from `dist/` folder
3. **User navigates**: Normal React routing works
4. **User clicks Workflow**: Gets professional launcher page
5. **User launches n8n**: Opens in new window with full functionality

### Technical Flow:
```
User Request → Render → Express Server → Serve React App → Launch n8n
```

---

## 🔍 Troubleshooting Common Issues

### Build Fails
**Symptom**: "vite: command not found" or similar  
**Solution**: Vite is in dependencies (not devDependencies) for production builds

### Server Won't Start
**Symptom**: "Cannot find module" errors  
**Solution**: Check that `proxy-server.js` exists in frontend directory

### App Loads But Workflow Button Doesn't Work
**Symptom**: Clicking workflow does nothing  
**Solution**: Check that n8n backend service is running

---

## 💰 Cost Considerations

**Web Service Cost**: ~$7/month for basic plan  
**vs Static Site**: Free tier available  

**Why the cost is worth it:**
- Professional workflow launcher
- Future expandability  
- Custom server functionality
- Better user experience
- No iframe limitations

---

## 🔄 Deployment Process

### Automatic Deployment:
1. Push code to `mains` branch
2. Render detects changes
3. Runs build command
4. Starts server with start command
5. Service becomes available at your Render URL

### Manual Deploy:
- Use Render dashboard "Manual Deploy" button
- Useful for troubleshooting or immediate deployments

---

This setup provides a professional, scalable frontend that can evolve with your needs while maintaining clean separation from the backend workflow engine.