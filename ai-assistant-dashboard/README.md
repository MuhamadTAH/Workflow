# AI Assistant Dashboard

This is the frontend interface for the Easy AI Assistant system - a comprehensive web-based dashboard for setting up, managing, and monitoring AI-powered customer service automation.

## Features

### 🎨 **Beautiful Design**
- Modern, responsive design with Tailwind CSS
- Professional color palette and smooth animations
- Collapsible configuration sidebar for clean workspace
- Three-column live operations dashboard

### ⚙️ **Configuration Management**
1. **Telegram Bot Setup** - Secure token input with connection testing
2. **AI Model Settings** - Provider selection (OpenAI, Claude) with API testing  
3. **AI Behavior Instructions** - System prompt editor with pre-built templates
4. **Knowledge Base** - Drag-and-drop document upload (PDF, DOCX, TXT, MD)

### 📊 **Live Operations Dashboard**
- **Conversations Panel** - List of all active customer chats
- **Live Feed Panel** - Real-time conversation monitoring with AI/human responses
- **Control Panel** - User information display and system controls
- **Manual Override** - Human takeover functionality with message input

### 🚀 **Advanced Features**
- **Real-time Updates** - WebSocket integration for live conversation monitoring
- **Performance Metrics** - Success rates, conversation counts, response times
- **System Controls** - One-click AI activation/deactivation
- **Human Handoff** - Seamless transition between AI and human agents

## Backend Integration

The dashboard integrates with the following backend endpoints:

### Core AI Assistant APIs
- `POST /api/ai-assistant/create` - Create new assistant
- `POST /api/ai-assistant/:id/activate` - Activate AI assistant
- `POST /api/ai-assistant/:id/test-telegram` - Test Telegram connection
- `POST /api/ai-assistant/:id/test-ai-api` - Test AI API connection
- `POST /api/ai-assistant/:id/upload-documents` - Upload knowledge base files

### Real-time Features
- `WebSocket /socket.io` - Real-time conversation updates
- `GET /api/ai-assistant-realtime/performance/:id` - Live metrics
- `GET /api/ai-assistant-realtime/connection-stats` - Connection statistics

### Advanced Features
- `GET /api/ai-assistant-advanced/analytics/overview` - Dashboard analytics
- `POST /api/ai-assistant-advanced/:id/handoff` - Human takeover
- `GET /api/ai-assistant-advanced/customer/:id` - Customer information

## Getting Started

1. **Start the Backend Server**
   ```bash
   cd backend
   npm start
   ```
   Server runs on `http://localhost:3001`

2. **Open the Dashboard**
   - Open `index.html` in your browser
   - Or serve through a web server for full functionality

3. **Configure Your AI Assistant**
   - Enter Telegram bot token and test connection
   - Add AI API key (OpenAI/Claude) and test
   - Set system prompt using templates or custom text
   - Upload knowledge base documents

4. **Activate and Monitor**
   - Click "ACTIVATE AI" to start the assistant
   - Monitor live conversations in real-time
   - Use human takeover when needed

## Technical Details

### Frontend Technologies
- **HTML5** with semantic structure
- **Tailwind CSS** for responsive styling
- **Lucide Icons** for beautiful iconography
- **Socket.IO Client** for real-time communication
- **Vanilla JavaScript** for functionality

### Integration Points
- **REST APIs** for configuration and control
- **WebSocket** for real-time updates
- **File Upload** with FormData for documents
- **JWT Authentication** with Bearer tokens

### Browser Compatibility
- Modern browsers with ES6+ support
- Responsive design for desktop, tablet, and mobile
- Progressive enhancement for older browsers

## File Structure

```
ai-assistant-dashboard/
├── index.html          # Main dashboard interface
├── README.md          # This documentation
└── assets/            # Static assets (optional)
```

## Customization

The dashboard is designed to be easily customizable:

- **Colors**: Modify Tailwind classes or CSS variables
- **Layout**: Adjust grid columns and responsive breakpoints  
- **Templates**: Add custom system prompt templates
- **Branding**: Update logos, colors, and text content

## Backend Requirements

Requires the AI Assistant backend system with:
- Express.js server on port 3001
- SQLite database with AI assistant tables
- Socket.IO server for real-time features
- JWT authentication middleware
- File upload support with Multer

## Production Deployment

For production deployment:

1. **Serve Static Files**
   - Use nginx, Apache, or CDN
   - Enable gzip compression
   - Set appropriate cache headers

2. **Environment Configuration**
   - Update API_BASE URL for production backend
   - Configure WebSocket endpoint
   - Set up proper authentication

3. **Security Considerations**
   - Use HTTPS for all communications
   - Implement proper CORS policies
   - Secure API tokens and credentials

## Support

For issues and questions:
- Check the backend logs at `backend/logs/`
- Verify API endpoints are responding
- Test WebSocket connection manually
- Ensure proper authentication tokens

The dashboard provides a complete, professional interface for managing AI-powered customer service automation with enterprise-grade features and real-time monitoring capabilities.