[2025-08-13T15:45:37.773Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/profile","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/profile',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:45:37.774Z'
}
[2025-08-13T15:45:37.775Z] INFO: Request completed {"method":"OPTIONS","url":"/api/profile","status":200,"duration":"2ms"}
[2025-08-13T15:45:38.084Z] INFO: Incoming request {"method":"GET","url":"/api/profile","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/profile',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:45:38.084Z'
}
[2025-08-13T15:45:38.090Z] INFO: Request completed {"method":"GET","url":"/profile","status":304,"duration":"6ms"}
[2025-08-13T15:45:42.948Z] INFO: Incoming request {"method":"GET","url":"/api/profile","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/profile',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:45:42.948Z'
}
[2025-08-13T15:45:42.951Z] INFO: Request completed {"method":"GET","url":"/profile","status":304,"duration":"3ms"}
[2025-08-13T15:45:44.843Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:45:44.843Z'
}
[2025-08-13T15:45:44.844Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows","status":200,"duration":"1ms"}
[2025-08-13T15:45:45.127Z] INFO: Incoming request {"method":"GET","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:45:45.127Z'
}
[2025-08-13T15:45:45.129Z] INFO: Workflows retrieved {"userId":2,"count":0}
[2025-08-13T15:45:45.130Z] INFO: Request completed {"method":"GET","url":"/","status":200,"duration":"3ms"}
[2025-08-13T15:46:08.543Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:46:08.544Z'
}
[2025-08-13T15:46:08.544Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows","status":200,"duration":"1ms"}
[2025-08-13T15:46:08.939Z] INFO: Incoming request {"method":"POST","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:46:08.939Z'
}
[workflows.create] INSERT params {
  userIdType: 'number',
  userId: 2,
  nameType: 'string',
  name: 'Workflow-1',
  descriptionType: 'string',
  description: 'Workflow with 1 nodes',
  dataType: 'string',
  dataLength: 336
}
[workflows.create] Database result: {
  lastID: undefined,
  lastInsertRowid: 2,
  changes: 1,
  resultType: 'number'
}
[2025-08-13T15:46:08.970Z] INFO: Workflow created successfully {"userId":2,"workflowId":2,"name":"Workflow-1","nodeCount":1,"edgeCount":0}
[2025-08-13T15:46:08.971Z] INFO: Request completed {"method":"POST","url":"/","status":201,"duration":"33ms"}
[2025-08-13T15:46:10.992Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/2/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows/2/status',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:46:10.992Z'
}
[2025-08-13T15:46:10.993Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/2/status","status":200,"duration":"1ms"}
[2025-08-13T15:46:11.296Z] INFO: Incoming request {"method":"GET","url":"/api/workflows/2/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/workflows/2/status',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:46:11.296Z'
}
[2025-08-13T15:46:11.299Z] INFO: Request completed {"method":"GET","url":"/2/status","status":200,"duration":"3ms"}
[2025-08-13T15:46:14.483Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/profile","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/profile',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:46:14.484Z'
}
[2025-08-13T15:46:14.484Z] INFO: Request completed {"method":"OPTIONS","url":"/api/profile","status":200,"duration":"1ms"}
[2025-08-13T15:46:14.782Z] INFO: Incoming request {"method":"GET","url":"/api/profile","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/profile',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:46:14.782Z'
}
[2025-08-13T15:46:14.784Z] INFO: Request completed {"method":"GET","url":"/profile","status":304,"duration":"2ms"}
the console 
index-u1W7QU-Q.js:32 Fetching user profile...
index-u1W7QU-Q.js:32 Profile loaded: Object
index-u1W7QU-Q.js:32 Fetching user profile...
index-u1W7QU-Q.js:32 Profile loaded: Object
index-u1W7QU-Q.js:32 📊 Current workflow count: 0, generating name: Workflow-1
index-u1W7QU-Q.js:32 🆔 Setting currentWorkflowId to: 2
index-u1W7QU-Q.js:32 ✅ Workflow saved successfully to backend with ID: 2
index-u1W7QU-Q.js:32 📡 Loaded activation status for workflow 2: inactive
index-u1W7QU-Q.js:32 Fetching user profile...
index-u1W7QU-Q.js:32 Profile loaded: Object