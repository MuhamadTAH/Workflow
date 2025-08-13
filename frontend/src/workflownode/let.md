[2025-08-13T14:47:05.259Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T14:47:05.259Z'
}
[2025-08-13T14:47:05.260Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/2/activate","status":200,"duration":"1ms"}
[2025-08-13T14:47:05.548Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-13T14:47:05.548Z'
}
[workflows.activate] Raw workflow data: {
  dataType: 'string',
  dataLength: 336,
  dataPreview: '{"nodes":[{"id":"dndnode_0","type":"custom","position":{"x":297,"y":241},"data":{"label":"Telegram T'
}
[workflows.activate] All nodes: [
  {
    id: 'dndnode_0',
    type: 'telegramTrigger',
    category: undefined,
    label: 'Telegram Trigger'
  }
]
[workflows.activate] Found trigger nodes: 0
[2025-08-13T14:47:05.550Z] INFO: Request completed {"method":"POST","url":"/2/activate","status":400,"duration":"2ms"}

the console 
orkflow-lg9z.onrender.com/api/workflows/2/activate:1   Failed to load resource: the server responded with a status of 400 ()
index-CGzdJeTn.js:32  ❌ Failed to activate workflow: Workflow must have at least one trigger node to activate