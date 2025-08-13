[2025-08-13T14:54:55.033Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T14:54:55.033Z'
}
[2025-08-13T14:54:55.034Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/2/activate","status":200,"duration":"1ms"}
[2025-08-13T14:54:55.332Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T14:54:55.333Z'
}
[workflows.activate] Raw workflow data: {
  dataType: 'string',
  dataLength: 1679,
  dataPreview: '{"nodes":[{"id":"dndnode_0","type":"custom","position":{"x":289,"y":283},"data":{"label":"Telegram T'
}
[workflows.activate] All nodes: [
  {
    id: 'dndnode_0',
    type: 'telegramTrigger',
    category: undefined,
    label: 'Telegram Trigger'
  }
]
[workflows.activate] Found trigger nodes: 1 Types: [ 'telegramTrigger' ]
✅ Registered workflow 2 for activation
[2025-08-13T14:54:55.336Z] INFO: Workflow activated for single-run execution {"userId":2,"workflowId":"2","triggerCount":1,"mode":"single-run"}
[2025-08-13T14:54:55.337Z] INFO: Request completed {"method":"POST","url":"/2/activate","status":200,"duration":"5ms"}

the console 
index-CGzdJeTn.js:32 Fetching user profile...
index-CGzdJeTn.js:32 Profile loaded: Object
index-CGzdJeTn.js:32 🆔 Setting currentWorkflowId to: 2
index-CGzdJeTn.js:32 ✅ Workflow saved successfully to backend with ID: 2
index-CGzdJeTn.js:32 📡 Loaded activation status for workflow 2: inactive
index-CGzdJeTn.js:32 ✅ Workflow 2 activated successfully: Object
