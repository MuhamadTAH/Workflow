[2025-08-13T11:27:48.851Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T11:27:48.852Z'
}
[2025-08-13T11:27:48.852Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows","status":200,"duration":"1ms"}
[2025-08-13T11:27:49.119Z] INFO: Incoming request {"method":"POST","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T11:27:49.119Z'
}
[workflows.create] INSERT params {
  userIdType: 'number',
  userId: 2,
  nameType: 'string',
  name: 'super',
  descriptionType: 'string',
  description: 'Workflow with 1 nodes',
  dataType: 'string',
  dataLength: 365
}
[workflows.create] Database result: { lastID: undefined, changes: undefined, resultType: 'undefined' }
[2025-08-13T11:27:49.156Z] INFO: Workflow created successfully {"userId":2,"name":"super","nodeCount":1,"edgeCount":0}
[2025-08-13T11:27:49.157Z] INFO: Request completed {"method":"POST","url":"/","status":201,"duration":"38ms"}
node:internal/process/promises:288
            triggerUncaughtException(err, true /* fromPromise */);
            ^
[Error: SQLITE_CONSTRAINT: NOT NULL constraint failed: workflows.name] {
  errno: 19,
  code: 'SQLITE_CONSTRAINT'
}
Node.js v18.20.8
==> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: 📡 version env with Radar: https://dotenvx.com/radar
[2025-08-13T11:27:57.366Z] INFO: Workflow engine initialized
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
[2025-08-13T11:27:57.669Z] INFO: Backend server started on port 10000 {"port":"10000"}
⚠️ Database workflow restoration temporarily disabled
✅ Connected to SQLite database
✅ Users table ready
✅ Social connections table ready
✅ Shops table ready
✅ Products table ready
[2025-08-13T11:28:04.558Z] INFO: Incoming request {"method":"HEAD","url":"/","ip":"::1","userAgent":"Go-http-client/1.1"}
[2025-08-13T11:28:04.561Z] WARN: 404 - Route not found: HEAD /
[2025-08-13T11:28:04.565Z] INFO: Request completed {"method":"HEAD","url":"/","status":404,"duration":"7ms"}

the console 
index-CGzdJeTn.js:32 Fetching user profile...
index-CGzdJeTn.js:32 Profile loaded: Object
index-CGzdJeTn.js:32 🆔 Setting currentWorkflowId to: undefined
index-CGzdJeTn.js:32 ✅ Workflow saved successfully to backend with ID: undefined