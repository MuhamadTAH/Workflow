[2025-08-14T07:35:55.219Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-14T07:35:55.219Z'
}
[2025-08-14T07:35:55.219Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/2/activate","status":200,"duration":"0ms"}
[2025-08-14T07:35:55.481Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/2/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows/2/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-14T07:35:55.481Z'
}
[workflows.activate] Raw workflow data: {
  dataType: 'string',
  dataLength: 947,
  dataPreview: '{"nodes":[{"id":"dndnode_0","type":"custom","position":{"x":-4,"y":355},"data":{"label":"Telegram Tr'
}
[workflows.activate] All nodes: [
  {
    id: 'dndnode_0',
    type: 'telegramTrigger',
    category: undefined,
    label: 'Telegram Trigger'
  },
  {
    id: 'dndnode_1',
    type: 'telegramSendMessage',
    category: undefined,
    label: 'Telegram Send Message'
  }
]
[workflows.activate] Found trigger nodes: 1 Types: [ 'telegramTrigger' ]
✅ Registered workflow 2 for activation
[2025-08-14T07:35:55.485Z] INFO: Workflow activated for single-run execution {"userId":2,"workflowId":"2","triggerCount":1,"mode":"single-run"}
[2025-08-14T07:35:55.485Z] INFO: Request completed {"method":"POST","url":"/2/activate","status":200,"duration":"4ms"}