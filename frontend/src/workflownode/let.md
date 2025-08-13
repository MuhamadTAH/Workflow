2025-08-13T14:38:18.858Z] INFO: Request completed {"method":"GET","url":"/2/status","status":200,"duration":"3ms"}
[2025-08-13T14:38:22.176Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T14:38:22.177Z'
}
[2025-08-13T14:38:22.177Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/2/activate","status":200,"duration":"1ms"}
[2025-08-13T14:38:22.574Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T14:38:22.574Z'
}
[workflows.activate] Raw workflow data: {
  dataType: 'string',
  dataLength: 351,
  dataPreview: '{"nodes":[{"id":"dndnode_0","type":"custom","position":{"x":249,"y":252.79999923706055},"data":{"lab'
}
[2025-08-13T14:38:22.577Z] INFO: Request completed {"method":"POST","url":"/2/activate","status":400,"duration":"3ms"}

the console 
Fetching user profile...
index-CGzdJeTn.js:32 Profile loaded: Object
index-CGzdJeTn.js:32 🆔 Setting currentWorkflowId to: 2
index-CGzdJeTn.js:32 ✅ Workflow saved successfully to backend with ID: 2
index-CGzdJeTn.js:32 📡 Loaded activation status for workflow 2: inactive
workflow-lg9z.onrender.com/api/workflows/2/activate:1   Failed to load resource: the server responded with a status of 400 ()
index-CGzdJeTn.js:32  ❌ Failed to activate workflow: Workflow must have at least one trigger node to activate