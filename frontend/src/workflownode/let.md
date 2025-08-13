==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
[2025-08-13T13:22:30.122Z] INFO: Workflow engine initialized
✅ WorkflowExecutor singleton loaded successfully
✅ Active workflows table initialized
🚀 LOADING NODES ROUTES FILE
📝 REGISTERING /validate-telegram-token route
📝 REGISTERING /verify-claude route (MOCK VERSION)
📝 REGISTERING /telegram-get-updates route
✅ EXPORTING NODES ROUTER WITH ROUTES: [
  '/run-node',
  '/validate-telegram-token',
  '/validate-telegram-token',
  '/verify-claude',
  '/telegram-get-updates',
  '/telegram-get-updates'
]
🚀 Backend server with IF node routing fix started on port 10000
[2025-08-13T13:22:30.418Z] INFO: Backend server started on port 10000 {"port":"10000"}
⚠️ Database workflow restoration temporarily disabled
✅ Connected to SQLite database
✅ Users table ready
✅ Social connections table ready
✅ Shops table ready
✅ Products table ready
✅ Workflows table ready
[2025-08-13T13:22:36.126Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T13:22:36.127Z'
}
[2025-08-13T13:22:36.131Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/2/activate","status":200,"duration":"5ms"}
[2025-08-13T13:22:36.440Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T13:22:36.440Z'
}
[workflows.activate] Raw workflow data: {
  dataType: 'undefined',
  dataLength: undefined,
  dataPreview: undefined
}
[workflows.activate] JSON parse error: Unexpected token u in JSON at position 0
[workflows.activate] Invalid data: undefined
[2025-08-13T13:22:36.519Z] INFO: Request completed {"method":"POST","url":"/2/activate","status":400,"duration":"79ms"}

the console 
index-CGzdJeTn.js:32 Fetching user profile...
index-CGzdJeTn.js:32 Profile loaded: Object
index-CGzdJeTn.js:32 🆔 Setting currentWorkflowId to: 2
index-CGzdJeTn.js:32 ✅ Workflow saved successfully to backend with ID: 2
index-CGzdJeTn.js:32 📡 Loaded activation status for workflow 2: inactive
workflow-lg9z.onrender.com/api/workflows/2/activate:1   Failed to load resource: the server responded with a status of 400 ()
index-CGzdJeTn.js:32  ❌ Failed to activate workflow: Invalid workflow data format
(anonymous) @ index-CGzdJeTn.js:32
