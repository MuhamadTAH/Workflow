[2025-08-26T22:51:35.524Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/workflow-3-aqi3ik/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'OPTIONS',
  url: '/api/workflows/workflow-3-aqi3ik/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-26T22:51:35.524Z'
}
[2025-08-26T22:51:35.524Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/workflow-3-aqi3ik/activate","status":200,"duration":"0ms"}
[2025-08-26T22:51:35.784Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/workflow-3-aqi3ik/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'POST',
  url: '/api/workflows/workflow-3-aqi3ik/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '894',
  authorization: 'present',
  timestamp: '2025-08-26T22:51:35.784Z'
}
📦 ACTIVATION REQUEST BODY PREVIEW: {
  hasBody: false,
  bodyKeys: [],
  workflowPresent: false,
  nodeCount: 0,
  edgeCount: 0
}
🔧 WORKFLOW ROUTE DEBUG: {
  method: 'POST',
  originalUrl: '/api/workflows/workflow-3-aqi3ik/activate',
  params: {},
  query: {},
  bodySize: 894,
  timestamp: '2025-08-26T22:51:35.785Z'
}
🎯 WORKFLOW ACTIVATION ROUTE HIT: {
  workflowId: undefined,
  method: 'POST',
  hasWorkflowData: true,
  triggerNodeTypes: [ 'whatsappTrigger' ]
}
🚀 WORKFLOW ACTIVATION REQUEST RECEIVED!
📋 Request details: {
  method: 'POST',
  url: '/workflow-3-aqi3ik/activate',
  params: { id: 'workflow-3-aqi3ik' },
  bodyKeys: [ 'workflow' ],
  origin: 'https://fixdai.com',
  timestamp: '2025-08-26T22:51:35.786Z'
}
🔍 Activation data validation: {
  workflowId: 'workflow-3-aqi3ik',
  hasWorkflow: true,
  hasNodes: true,
  hasEdges: true,
  nodeCount: 2,
  edgeCount: 1,
  dryRun: false
}
============================================================
🚀 WORKFLOW ACTIVATION STARTED
🔄 Activating workflow: workflow-3-aqi3ik
📋 Found 1 trigger node(s): [ 'whatsappTrigger' ]
📊 Current active workflows count: 0
============================================================
Registering workflow workflow-3-aqi3ik for automatic execution
Workflow config received: {
  nodes: 2,
  edges: 1,
  nodeTypes: [ 'whatsappTrigger (dndnode_0)', 'whatsappSendMessage (dndnode_1)' ],
  edgeConnections: [ 'dndnode_0 → dndnode_1' ]
}
Found trigger node: WhatsApp Trigger (dndnode_0)
Workflow workflow-3-aqi3ik registered successfully with 2 nodes and 1 edges
✅ Workflow workflow-3-aqi3ik registered for auto-execution
WorkflowExecutor active workflows count: 1
🔄 Auto-updating WhatsApp webhook for workflow: workflow-3-aqi3ik
📋 WhatsApp trigger node data: {
  "label": "WhatsApp Trigger",
  "icon": "fa-whatsapp",
  "color": "text-green-500",
  "description": "Trigger workflow when receiving WhatsApp message from specific number",
  "type": "whatsappTrigger"
}
🔍 WhatsApp configuration search results:
   - whatsappTrigger.data.appId: not found
   - whatsappTrigger.data.clientSecret: not found
❌ No App ID or Client Secret found in WhatsApp trigger configuration
💡 Make sure the App ID and Client Secret are configured in the WhatsApp trigger node
============================================================
✅ WORKFLOW ACTIVATION COMPLETED SUCCESSFULLY!
🎯 Workflow ID: workflow-3-aqi3ik
📊 Controller active workflows: 1
🚀 Executor active workflows: 1
🔗 Trigger URLs generated: 1
   1. whatsappTrigger: https://workflow-lg9z.onrender.com/api/webhooks/whatsapp/workflow-3-aqi3ik
⏰ Activated at: 2025-08-26T22:51:35.788Z
============================================================
💾 Stored active workflow workflow-3-aqi3ik to database
✅ ACTIVATION SUCCESS - Sending response: {
  success: true,
  workflowId: 'workflow-3-aqi3ik',
  triggerUrlCount: 1,
  responseSize: 295,
  timestamp: '2025-08-26T22:51:35.788Z'
}
[2025-08-26T22:51:35.788Z] INFO: Request completed {"method":"POST","url":"/workflow-3-aqi3ik/activate","status":200,"duration":"4ms"}
[2025-08-26T22:52:04.426Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/workflow-3-aqi3ik","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows/workflow-3-aqi3ik',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-26T22:52:04.426Z'
}
[2025-08-26T22:52:04.427Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/workflow-3-aqi3ik","status":200,"duration":"1ms"}
[2025-08-26T22:52:04.693Z] INFO: Incoming request {"method":"PUT","url":"/api/workflows/workflow-3-aqi3ik","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'PUT',
  url: '/api/workflows/workflow-3-aqi3ik',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '947',
  authorization: 'present',
  timestamp: '2025-08-26T22:52:04.693Z'
}
[2025-08-26T22:52:04.694Z] INFO: Request completed {"method":"PUT","url":"/workflow-3-aqi3ik","status":404,"duration":"1ms"}