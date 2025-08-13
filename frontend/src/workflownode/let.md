[2025-08-13T15:33:22.612Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:33:22.613Z'
}
[2025-08-13T15:33:22.613Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows","status":200,"duration":"1ms"}
[2025-08-13T15:33:22.929Z] INFO: Incoming request {"method":"POST","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:33:22.929Z'
}
[workflows.create] INSERT params {
  userIdType: 'number',
  userId: 2,
  nameType: 'string',
  name: 'Workflow-1',
  descriptionType: 'string',
  description: 'Workflow with 3 nodes',
  dataType: 'string',
  dataLength: 825
}
[workflows.create] Database result: {
  lastID: undefined,
  lastInsertRowid: 2,
  changes: 1,
  resultType: 'number'
}
[2025-08-13T15:33:22.949Z] INFO: Workflow created successfully {"userId":2,"workflowId":2,"name":"Workflow-1","nodeCount":3,"edgeCount":0}
[2025-08-13T15:33:22.990Z] INFO: Request completed {"method":"POST","url":"/","status":201,"duration":"61ms"}
[2025-08-13T15:33:24.476Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/2/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows/2/status',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:33:24.476Z'
}
[2025-08-13T15:33:24.477Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/2/status","status":200,"duration":"2ms"}
[2025-08-13T15:33:24.748Z] INFO: Incoming request {"method":"GET","url":"/api/workflows/2/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/workflows/2/status',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T15:33:24.749Z'
}
[2025-08-13T15:33:24.751Z] INFO: Request completed {"method":"GET","url":"/2/status","status":200,"duration":"3ms"}