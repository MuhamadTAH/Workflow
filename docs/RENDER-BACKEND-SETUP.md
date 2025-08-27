# Backend n8n Render Service Setup Guide

## Service Overview
**Service Type**: Web Service  
**Purpose**: Runs n8n workflow automation platform  
**Service Name**: `workflow-lg9z` (your existing service)

---

## 🔧 Basic Configuration

### Repository Settings
```
Repository: https://github.com/MuhamadTAH/Workflow.git
Branch: mains
Root Directory: . (empty - uses repository root)
```

**Why these settings:**
- **Repository**: Same repo as frontend for easy management
- **Branch**: `mains` ensures latest code is deployed
- **Root Directory**: Empty because root `package.json` contains n8n configuration

---

## 🏗️ Build & Deploy Settings

### Build Command
```bash
npm install
```

**Why this command:**
- Installs n8n and its dependencies
- Simple command because n8n doesn't need compilation
- Uses root `package.json` which has n8n as dependency

### Start Command
```bash
npx n8n start
```

**Why this command:**
- `npx`: Runs n8n executable from node_modules
- `n8n start`: Official n8n command to start the workflow platform
- Automatically handles database initialization and web server startup

---

## 🌐 Environment Variables (Critical for Functionality)

### Core n8n Settings

#### N8N_HOST=0.0.0.0
**Purpose**: Bind to all network interfaces  
**Why needed**: Allows external access from Render's proxy  
**Without it**: n8n only accessible locally, Render can't route traffic

#### N8N_PORT=10000
**Purpose**: Defines port n8n listens on  
**Why 10000**: Render's default port for web services  
**Why needed**: Ensures n8n and Render proxy communicate correctly

#### N8N_PROTOCOL=https
**Purpose**: Tells n8n it's behind HTTPS proxy  
**Why needed**: 
- Render provides HTTPS termination
- n8n generates correct URLs for webhooks
- Prevents mixed content errors

#### WEBHOOK_URL=https://workflow-lg9z.onrender.com
**Purpose**: Base URL for webhook endpoints  
**Why needed**: 
- External services call webhooks at this URL
- n8n generates webhook URLs for triggers
- Critical for automation that receives external data

### Authentication & Security

#### N8N_BASIC_AUTH_ACTIVE=true
**Purpose**: Enables built-in authentication  
**Why needed**: 
- Prevents unauthorized access to your workflows
- Required for production deployments
- Simple authentication without complex setup

#### N8N_BASIC_AUTH_USER=admin
**Purpose**: Username for n8n login  
**Why admin**: Simple, recognizable admin username  
**Security note**: Can be changed to any username you prefer

#### N8N_BASIC_AUTH_PASSWORD=workflow2025
**Purpose**: Password for n8n access  
**Why this password**: 
- Strong enough for basic security
- Easy to remember during development
- **IMPORTANT**: Change this for production

#### N8N_SECURE_COOKIE=true
**Purpose**: Enables secure cookies over HTTPS  
**Why needed**: 
- Security best practice for HTTPS sites
- Prevents cookie theft over insecure connections
- Required for proper authentication flow

### Database Configuration

#### DB_TYPE=sqlite
**Purpose**: Tells n8n to use SQLite database  
**Why SQLite**: 
- Simple, file-based database
- No external database service needed
- Perfect for small to medium workflows
- Reduces complexity and cost

#### DB_SQLITE_DATABASE=/opt/render/.n8n/database.sqlite
**Purpose**: Defines database file location  
**Why this path**: 
- `/opt/render/`: Render's persistent storage area
- `.n8n/`: n8n's standard config directory
- Ensures database persists across deployments

### Operational Settings

#### N8N_LOG_LEVEL=info
**Purpose**: Controls logging verbosity  
**Why info**: 
- Provides useful information for debugging
- Not too verbose (debug) or too quiet (warn)
- Good balance for production monitoring

#### GENERIC_TIMEZONE=UTC
**Purpose**: Sets timezone for workflow scheduling  
**Why UTC**: 
- Universal standard, no daylight saving issues
- Easier to coordinate with external systems
- Consistent across different deployment regions

---

## 🔒 Optional Security Settings (For iframe embedding)

### If you want to embed n8n in iframe:

#### N8N_FRAME_ANCESTORS=*
**Purpose**: Allows n8n to be embedded in iframes  
**Why needed**: Bypasses X-Frame-Options security header  
**Security note**: Use specific domains instead of `*` for better security

#### Alternative for specific domain:
```bash
N8N_FRAME_ANCESTORS=https://your-frontend.onrender.com
```

---

## 📊 How n8n Uses These Settings

### Startup Process:
1. **n8n reads environment variables**
2. **Initializes SQLite database** (creates file if not exists)
3. **Starts web server** on specified host/port
4. **Enables authentication** with provided credentials
5. **Registers webhook endpoints** using WEBHOOK_URL
6. **Becomes ready** to receive requests from frontend

### Runtime Behavior:
- **Workflows execute** using configured timezone
- **Webhooks receive** external data at WEBHOOK_URL
- **Authentication required** for all access
- **Logs written** at specified level
- **Database persists** all workflows and executions

---

## 🔍 Troubleshooting Common Issues

### n8n Won't Start
**Check**: PORT and HOST settings  
**Solution**: Ensure HOST=0.0.0.0 and PORT matches Render

### Cannot Access n8n Interface  
**Check**: PROTOCOL and authentication settings  
**Solution**: Verify HTTPS protocol and auth credentials

### Webhooks Don't Work
**Check**: WEBHOOK_URL setting  
**Solution**: Must match your actual Render service URL

### Database Errors
**Check**: Database path permissions  
**Solution**: Use Render's persistent storage paths

### Authentication Loops
**Check**: SECURE_COOKIE and PROTOCOL  
**Solution**: Ensure both match HTTPS setup

---

## 💡 Production Optimization Tips

### Security Enhancements:
- Change default password to strong unique value
- Use specific domain for FRAME_ANCESTORS instead of `*`
- Consider adding IP restrictions if needed

### Performance Improvements:
- Monitor LOG_LEVEL - reduce to 'warn' if logs get too verbose
- Consider PostgreSQL for high-volume workflows
- Monitor database size and clean old executions

### Monitoring:
- Check Render logs regularly for errors
- Monitor webhook success rates
- Set up alerts for service downtime

---

## 🌐 Integration with Frontend

The backend provides these endpoints for the frontend:
- **Main Interface**: `https://workflow-lg9z.onrender.com`
- **API Endpoints**: `/api/v1/*` (for future integration)
- **Webhook Receivers**: `/webhook/*` (for external triggers)
- **Health Check**: `/healthz` (for monitoring)

This setup creates a robust, production-ready workflow automation platform that integrates seamlessly with your frontend launcher.