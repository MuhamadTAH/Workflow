=> Running 'node index.js'
[dotenv@17.2.1] injecting env (3) from .env -- tip: 🔐 prevent committing .env to code: https://dotenvx.com/precommit
[2025-08-13T10:32:14.372Z] INFO: Workflow engine initialized
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
[2025-08-13T10:32:14.749Z] INFO: Backend server started on port 10000 {"port":"10000"}
⚠️ Database workflow restoration temporarily disabled
✅ Connected to SQLite database
✅ Users table ready
✅ Social connections table ready
✅ Shops table ready
✅ Products table ready
[2025-08-13T10:32:16.922Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T10:32:16.922Z'
}
[2025-08-13T10:32:16.926Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows","status":200,"duration":"5ms"}
[2025-08-13T10:32:17.005Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T10:32:17.006Z'
}
[2025-08-13T10:32:17.007Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows","status":200,"duration":"1ms"}
[2025-08-13T10:32:17.144Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T10:32:17.145Z'
}
[2025-08-13T10:32:17.145Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows","status":200,"duration":"1ms"}
[2025-08-13T10:32:17.339Z] INFO: Incoming request {"method":"POST","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T10:32:17.339Z'
}
[workflows.create] INSERT params {
  userIdType: 'number',
  userId: 2,
  nameType: 'string',
  name: 'gg',
  descriptionType: 'string',
  description: 'Workflow with 2 nodes',
  dataType: 'string',
  dataLength: 849
}
[2025-08-13T10:32:17.421Z] INFO: Incoming request {"method":"POST","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T10:32:17.422Z'
}
[workflows.create] INSERT params {
  userIdType: 'number',
  userId: 2,
  nameType: 'string',
  name: 'gg',
  descriptionType: 'string',
  description: 'Workflow with 2 nodes',
  dataType: 'string',
  dataLength: 849
}
[2025-08-13T10:32:17.450Z] INFO: Incoming request {"method":"POST","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T10:32:17.450Z'
}
[workflows.create] INSERT params {
  userIdType: 'number',
  userId: 2,
  nameType: 'string',
  name: 'gg',
  descriptionType: 'string',
  description: 'Workflow with 2 nodes',
  dataType: 'string',
  dataLength: 849
}
node:internal/process/promises:288
            triggerUncaughtException(err, true /* fromPromise */);
            ^
[Error: SQLITE_ERROR: cannot start a transaction within a transaction] {
  errno: 1,
  code: 'SQLITE_ERROR'
}
Node.js v18.20.8