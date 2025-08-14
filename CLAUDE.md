# Claude Code Project Documentation

## 🔄 DEPLOYMENT & CONNECTION ARCHITECTURE

### How Backend & Frontend Connect
This project uses a **full production deployment architecture**:
- **Frontend**: Production hosted on Render (https://frontend-dpcg.onrender.com)
- **Backend**: Production hosted on Render (https://shoppro-backend.onrender.com)
- **Connection**: Frontend makes API calls directly to production backend via VITE_API_BASE_URL

**Architecture Benefits**:
1. **Full Production Setup**: Both frontend and backend hosted on Render
2. **Environment Variables**: VITE_API_BASE_URL automatically configures API connections
3. **Auto Deployment**: Both services auto-deploy on git push
4. **No Local Development Required**: Complete cloud-based development

### Development Process:
```bash
# 1. Make Changes (edit frontend/backend code locally)

# 2. Commit & Push (initiates auto-deployment of both services)
git add .
git commit -m "feature: description"
git push origin main

# 3. Render Auto-Deploys:
#    - Backend: https://shoppro-backend.onrender.com (1-2 minutes)
#    - Frontend: https://frontend-dpcg.onrender.com (2-3 minutes)

# 4. Access live application at frontend URL
```

### URLs & Connections:
- **Frontend**: https://frontend-dpcg.onrender.com (Production)
- **Backend**: https://shoppro-backend.onrender.com (Production API)
- **GitHub**: https://github.com/MuhamadTAH/Workflow.git
- **Database**: SQLite (hosted with backend on Render)
- **Local Development**: `cd frontend && npm run dev` (optional, for hot reload)

---

## 🌐 API CONNECTION SYSTEM

### Frontend → Backend Communication

#### 1. Environment-Based API Selection
Most components use environment detection:
```javascript
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://shoppro-backend.onrender.com'
  : 'http://localhost:3001';
```

#### 2. Production-Only API Calls
Some features always use production for consistency:
```javascript
// Always use production backend
const API_BASE = 'https://shoppro-backend.onrender.com';
```

#### 3. CORS Configuration
Backend allows multiple frontend ports:
```javascript
// backend/index.js
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### Authentication Flow
```
1. User Login → Frontend sends to /api/login
2. Backend validates → Returns JWT token  
3. Frontend stores in localStorage
4. All API calls include: Authorization: Bearer {token}
5. Backend middleware validates JWT for protected routes
```

### Key API Endpoints:
- `/api/signup`, `/api/login` - Authentication
- `/api/profile` - User data  
- `/api/connections/*` - Social media OAuth
- `/api/shops/*` - E-commerce shop management
- `/api/products/*` - Product management
- `/api/uploads/*` - File uploads

---

## 📱 OAUTH & SOCIAL MEDIA INTEGRATION

### OAuth Flow Architecture
```
1. Frontend: User clicks "Connect Platform" 
2. Redirect to: /api/auth/{platform} (Google, Facebook, etc.)
3. Backend: Initiates OAuth flow with platform
4. Platform: Redirects back with authorization code
5. Backend: Exchanges code for access tokens
6. Database: Stores tokens in social_connections table
7. Frontend: Updates UI to show connected status
```

### Social Connections Table:
```sql
social_connections: 
  - user_id (foreign key to users)
  - platform (tiktok, youtube, facebook, etc.)  
  - access_token, refresh_token
  - token_expires_at
  - platform_user_id, platform_username
  - is_active (boolean)
```

### Platform Integration Status:
- ✅ **Database Ready**: All OAuth fields prepared
- ✅ **Frontend UI**: Professional connection cards  
- 🔄 **Backend Routes**: OAuth handlers need implementation
- 📋 **Supported Platforms**: TikTok, YouTube, Facebook, Instagram, Telegram, WhatsApp, Twitter/X, LinkedIn

---

## 🛒 E-COMMERCE SHOP SYSTEM

### Shop Management Features:
- **Shop Creation**: Users can create and manage their own shop
- **Product Management**: Add, edit, delete products with images and videos
- **Public Store**: Each shop gets a public URL for customers
- **Analytics**: Track shop performance and sales
- **Categories**: Organize products into categories

### Database Schema:
```sql
shops: 
  - id, user_id, shop_name, shop_display_name
  - description, contact_method, contact_value
  - is_active, created_at, updated_at

products:
  - id, shop_id, title, description, price
  - image_url, videos, is_active, is_visible
  - created_at, updated_at
```

---

## 🚀 PROJECT OVERVIEW

### Technology Stack
- **Frontend**: React 18 + Vite + Axios + React Router DOM
- **Backend**: Node.js + Express + SQLite + JWT + bcrypt  
- **Hosting**: Render (both frontend and backend)
- **Integration**: OAuth providers + File uploads

### Complete Feature Set:
✅ **Authentication**: Signup/login with JWT tokens  
✅ **Social Connections**: OAuth-ready for 8 platforms at `/connections`  
✅ **Shop Management**: Create and manage e-commerce shops at `/shop`
✅ **Product Management**: Add products with images and videos
✅ **Public Storefronts**: Customer-facing shop pages
✅ **File Uploads**: Image and video upload system
✅ **Responsive Design**: Mobile-friendly interface

### Database Schema:
```sql
users: id, name, email, password, created_at

social_connections: id, user_id, platform, access_token, refresh_token,
                   token_expires_at, platform_user_id, platform_username, 
                   platform_profile_url, connected_at, updated_at, is_active

shops: id, user_id, shop_name, shop_display_name, description, 
       contact_method, contact_value, is_active, created_at, updated_at

products: id, shop_id, title, description, price, image_url, videos,
          is_active, is_visible, created_at, updated_at
```

---

## 🛠️ DEVELOPMENT COMMANDS

### Daily Development:
```bash
# Start frontend (automatically connects to production backend)
cd frontend && npm run dev
```

### Deployment (Automatic):
```bash
git add .
git commit -m "feature: description"
git push origin main
# Render auto-deploys both services in 1-2 minutes
```

### Troubleshooting:
```bash  
# Check backend logs
# View at: Render dashboard → shoppro-backend → Logs

# Test API endpoints
curl https://shoppro-backend.onrender.com/api/hello

# Install missing dependencies
cd backend && npm install package-name
git add package.json && git commit -m "Add dependency" && git push
```

---

## 📞 QUICK REFERENCE

### For New Developers:
1. **Clone**: `git clone https://github.com/MuhamadTAH/Workflow.git`
2. **Install**: `cd frontend && npm install` 
3. **Run**: `npm run dev` (connects to production backend automatically)
4. **Access**: Open browser to displayed localhost URL
5. **Develop**: Edit code, changes auto-reload
6. **Deploy**: Commit and push (auto-deploys)

### Key Files to Understand:
- `frontend/src/App.jsx` - Main routing and authentication
- `frontend/src/pages/` - All application pages
- `backend/index.js` - Server setup and route registration
- `backend/routes/` - All API endpoints
- `backend/dbWrapper.js` - Database connection and schema

### Production URLs:
- **Frontend**: https://frontend-dpcg.onrender.com
- **Backend API**: https://shoppro-backend.onrender.com
- **GitHub Repo**: https://github.com/MuhamadTAH/Workflow.git

---

### 🎯 DEVELOPMENT RULES & Guidelines

**CRITICAL DEVELOPMENT RULES**:

1. **🖥️ DUAL RENDER DEPLOYMENT**: Both frontend and backend are hosted on Render
   - Frontend: Render static site deployment
   - Backend: Render web service deployment

2. **📤 MANDATORY GITHUB PUSH**: All changes MUST be pushed to GitHub
   - GitHub initiates auto-deployment on both Render services
   - No changes take effect until pushed to main branch

3. **📋 PLAN-FIRST DEVELOPMENT**: No coding without approval
   - Present detailed step-by-step plan before any implementation
   - Get explicit "OK" confirmation from user before proceeding
   - No code changes without user approval

4. **🔄 FRONTEND-TO-BACKEND PROCESS**: Development order is critical
   - **Step 1**: Always start with frontend changes
   - **Step 2**: Test frontend changes locally
   - **Step 3**: Then proceed to backend changes  
   - **Step 4**: Push both frontend and backend together
   - **Step 5**: Verify production deployment

**STEP-BY-STEP VERIFICATION**:
After each step, user should see:
- **Frontend Step**: Code changes made and ready for push
- **Backend Step**: Code changes made and ready for push
- **Push Step**: GitHub commit appears in repository
- **Deploy Step**: Render services rebuild successfully
- **Production Step**: Live URLs show updated functionality

**MANDATORY PROCESS**:
```
1. Present Plan → Get User OK
2. Frontend Changes → User Reviews Code
3. Backend Changes → User Reviews Code  
4. Push to GitHub → User Confirms Commit
5. Render Deploy → User Confirms Live Site
```

*No exceptions to this process - ensures quality control and prevents production issues*

---

*Complete E-Commerce Platform with Social Media Connections and Production-Ready Architecture*