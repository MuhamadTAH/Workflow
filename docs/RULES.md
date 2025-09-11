# 🚀 Workflow Platform Deployment Rules

## 📋 **Core Rules**

### **Rule 1: Focus on Workflow Folder Only**
- ✅ **ONLY work on files in the `/Workflow` folder**
- ❌ **NEVER modify files in other directories**
- 🎯 **All development happens within the Workflow project structure**

### **Rule 2: Use Render Hosting (NO Local Server)**
- 🌐 **Frontend URL**: https://frontend-dpcg.onrender.com
- 🌐 **Custom Domain**: https://fixdai.com (production domain with custom hostname)
- 🔧 **Backend URL**: https://workflow-lg9z.onrender.com
- ❌ **NEVER use localhost URLs in code**
- 🔄 **Always update code to use Render URLs**

### **Rule 3: GitHub Integration**
- 📦 **Repository**: https://github.com/MuhamadTAH/Workflow.git
- 🌳 **Branch**: `mains` (always push to mains branch)
- 💾 **Auto-deployment**: Code pushed to GitHub automatically deploys to Render
- 📝 **Always commit changes with descriptive messages**

## 🛠️ **Development Workflow**

### **Step 1: Code Development**
1. Work on files in `/Workflow` directory only
2. Update URLs to use Render endpoints
3. Test functionality thoroughly

### **Step 2: Deployment Process**
1. Create/update code files
2. Update URLs from localhost to Render URLs
3. Commit to GitHub mains branch
4. Render automatically deploys changes

### **Step 3: Testing**
1. Test on Render frontend: https://frontend-dpcg.onrender.com
2. Test on custom domain: https://fixdai.com
3. Verify backend API: https://workflow-lg9z.onrender.com
4. Check all features work in production

## 🌐 **URL Configuration**

### **Frontend URLs**
```
Render URL: https://frontend-dpcg.onrender.com
Custom Domain: https://fixdai.com
API Base: https://workflow-lg9z.onrender.com/api
```

### **Backend URLs**
```
Main API: https://workflow-lg9z.onrender.com
Webhooks: https://workflow-lg9z.onrender.com/api/webhooks
Nodes: https://workflow-lg9z.onrender.com/api/nodes
```

### **Webhook Endpoints**
```
Telegram: https://workflow-lg9z.onrender.com/api/webhooks/telegram
Instagram: https://workflow-lg9z.onrender.com/api/webhooks/instagram
General: https://workflow-lg9z.onrender.com/api/webhooks/
```

## 📝 **Code Standards**

### **API Calls**
- ✅ Use Render backend URL: `https://workflow-lg9z.onrender.com`
- ❌ Never hardcode `localhost:3001`
- 🔧 Use environment variables when possible

### **Frontend Configuration**
```javascript
// ✅ CORRECT
const API_BASE = 'https://workflow-lg9z.onrender.com/api';

// ❌ WRONG
const API_BASE = 'http://localhost:3001/api';
```

### **Test Files**
- Update all test HTML files to use Render URLs
- Replace localhost references with production URLs
- Test directly on Render environment

## 🚀 **Deployment Checklist**

### **Before Pushing to GitHub:**
- [ ] All localhost URLs updated to Render URLs
- [ ] Code tested and working
- [ ] Files only in `/Workflow` directory
- [ ] No hardcoded local paths

### **After Pushing to GitHub:**
- [ ] Check Render deployment logs
- [ ] Test on production URLs
- [ ] Verify all features work
- [ ] Update documentation if needed

## 🔄 **Git Commands**

### **Standard Workflow**
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Add Instagram Response Node functionality"

# Push to mains branch
git push origin mains
```

### **Repository Setup**
```bash
# Clone repository
git clone https://github.com/MuhamadTAH/Workflow.git

# Set remote origin
git remote set-url origin https://github.com/MuhamadTAH/Workflow.git
```

## ⚠️ **Important Notes**

### **File Locations**
- All workflow files in: `/Workflow/`
- Backend files: `/Workflow/backend/`
- Frontend files: `/Workflow/frontend/`
- Test files: `/Workflow/test-*.html`

### **Environment Variables**
- Set in Render dashboard, not in code
- Use `process.env.VARIABLE_NAME` in backend
- Frontend gets variables via API calls

### **Database**
- SQLite database in `/Workflow/backend/database.sqlite`
- Automatic migrations on deployment
- No manual database setup needed

## 🎯 **Success Criteria**

A successful deployment means:
- ✅ Code pushed to GitHub mains branch
- ✅ Render automatically deploys changes
- ✅ Frontend works at https://frontend-dpcg.onrender.com
- ✅ Custom domain works at https://fixdai.com
- ✅ Backend API works at https://workflow-lg9z.onrender.com
- ✅ All features functional in production
- ✅ No localhost references in code

---

**Last Updated**: $(date)
**Repository**: https://github.com/MuhamadTAH/Workflow.git
**Frontend (Render)**: https://frontend-dpcg.onrender.com
**Frontend (Custom Domain)**: https://fixdai.com
**Backend**: https://workflow-lg9z.onrender.com