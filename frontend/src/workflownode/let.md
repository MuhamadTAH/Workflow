[2025-08-13T11:34:13.266Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T11:34:13.267Z'
}
[2025-08-13T11:34:13.267Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows","status":200,"duration":"1ms"}
[2025-08-13T11:34:13.532Z] INFO: Incoming request {"method":"POST","url":"/api/workflows","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T11:34:13.533Z'
}
[workflows.create] INSERT params {
  userIdType: 'number',
  userId: 2,
  nameType: 'string',
  name: 'lando',
  descriptionType: 'string',
  description: 'Workflow with 1 nodes',
  dataType: 'string',
  dataLength: 466
}
[2025-08-13T11:34:13.544Z] ERROR: Application error {"message":"SQLITE_CONSTRAINT: NOT NULL constraint failed: workflows.name","stack":"Error: SQLITE_CONSTRAINT: NOT NULL constraint failed: workflows.name","context":"createWorkflow","userId":2}
[2025-08-13T11:34:13.544Z] INFO: Request completed {"method":"POST","url":"/","status":500,"duration":"12ms"}

the console 
index-CGzdJeTn.js:32 Fetching user profile...
index-CGzdJeTn.js:32 Profile loaded: Object
workflow-lg9z.onrender.com/api/workflows:1   Failed to load resource: the server responded with a status of 500 ()
index-CGzdJeTn.js:32  ❌ Backend save failed: Failed to create workflow