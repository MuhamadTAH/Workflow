# 🐳 Docker Local Development Setup

## 🚀 Quick Start

### **Prerequisites:**
- Docker Desktop installed
- Git repository cloned

### **Run Everything Locally:**

```bash
# Navigate to project directory
cd D:\n8n\allofthem\Workflow-mains

# Start all services
docker-compose up --build

# Wait for services to start, then access:
```

### **🌐 Local URLs:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001  
- **n8n Workflows**: http://localhost:5678

### **✅ What This Gives You:**
- ✅ **Full local development** environment
- ✅ **n8n with no setup screen** (pre-configured)
- ✅ **Hot reload** - changes update instantly
- ✅ **No Render deployment** needed for testing
- ✅ **Debug all issues** locally

## 🔧 Individual Services

### **Start Only Frontend:**
```bash
cd frontend
docker build -t workflow-frontend .
docker run -p 5173:5173 workflow-frontend
```

### **Start Only Backend:**
```bash
cd backend  
docker build -t workflow-backend .
docker run -p 3001:3001 workflow-backend
```

### **Start Only n8n:**
```bash
docker run -it --rm \
  -p 5678:5678 \
  -e N8N_HOST=0.0.0.0 \
  -e N8N_PORT=5678 \
  -e N8N_BASIC_AUTH_ACTIVE=false \
  -e N8N_USER_MANAGEMENT_DISABLED=true \
  -e N8N_OWNER_NAME=Admin \
  -e N8N_OWNER_EMAIL=admin@workflow.com \
  -e N8N_OWNER_PASSWORD=workflow2025 \
  n8nio/n8n
```

## 🐛 Debugging

### **Check Logs:**
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs n8n
```

### **Restart Services:**
```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart frontend
```

### **Clean Start:**
```bash
# Stop and remove everything
docker-compose down

# Rebuild and start fresh
docker-compose up --build --force-recreate
```

## 🎯 Benefits for Your Issue

### **Why This Helps:**
1. **See changes instantly** - No Render deployment delays
2. **Debug n8n setup** - See exactly what's happening
3. **Test all features** - Full environment locally
4. **Compare with production** - Identify differences

### **Workflow Builder Testing:**
- Frontend: http://localhost:5173/workflow
- Should redirect to: http://localhost:5678
- n8n should open **without setup screen**

**This will help us figure out why Render deployments aren't working!** 🚀