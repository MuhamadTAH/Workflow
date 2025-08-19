# N8N Integration for Workflow Platform

## 🚀 Setup Instructions

### Option 1: Local Development with Docker
```bash
cd n8n
docker-compose up -d
```
- N8N will be available at: http://localhost:5678
- Username: admin
- Password: workflow2025

### Option 2: Direct N8N Installation
```bash
cd n8n
npm install
npm start
```

### Option 3: Render Deployment
1. Create new Render service
2. Connect to your GitHub repo
3. Set build path: `n8n`
4. Set start command: `npm start`
5. Add environment variables:
   - `N8N_BASIC_AUTH_USER=admin`
   - `N8N_BASIC_AUTH_PASSWORD=workflow2025`
   - `WEBHOOK_URL=https://your-n8n-service.onrender.com`

## 🔗 Integration with Main App

### Frontend Integration
Add this to your existing workflow page:

```javascript
// In WorkflowBuilder.jsx
const openN8N = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/auth/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  
  if (response.ok) {
    const { n8nUrl } = await response.json();
    window.open(n8nUrl, '_blank');
  }
};
```

### Authentication Bridge
The auth-bridge.js service validates your JWT tokens and grants access to n8n.

## 🛡️ Security Features
- JWT token validation
- CORS protection
- Basic authentication for n8n
- Isolated n8n database

## 📊 Migration Strategy

### Phase 1: Parallel Testing (Current)
- N8N runs alongside existing system
- Users can choose which to use
- Zero risk to current workflows

### Phase 2: Gradual Migration
- Export existing workflows
- Import to n8n format
- User-by-user migration

### Phase 3: Full Integration
- Replace current workflow builder
- Maintain Live Chat integration
- Remove legacy system

## 🔄 API Endpoints

### Auth Bridge (Port 3002)
- `POST /api/auth/validate` - Validate JWT and get n8n access
- `GET /api/health` - Health check
- `ALL /api/n8n/*` - Proxy to n8n (future)

### N8N (Port 5678)
- Full n8n API available
- Webhook endpoints
- Workflow management
- Node execution

## 🚨 Rollback Plan
If anything goes wrong:
1. Stop n8n service
2. Remove n8n folder
3. Your existing system remains 100% intact
4. No data loss, no downtime

## 📝 Next Steps
1. Test n8n locally: `docker-compose up`
2. Visit: http://localhost:5678
3. Create test workflow
4. Test authentication bridge
5. Deploy to Render when ready