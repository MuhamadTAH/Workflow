output
{
  "success": true,
  "result": {
    "success": false,
    "error": "Webhook validation failed: Invalid webhook object type, No entry data in webhook",
    "nodeType": "whatsappTrigger",
    "timestamp": "2025-08-25T18:47:44.474Z",
    "itemIndex": 0,
    "processedAt": "2025-08-25T18:47:44.475Z"
  },
  "nodeType": "whatsappTrigger",
  "executedAt": "2025-08-25T18:47:44.475Z",
  "executionContext": {
    "nodeId": "dndnode_0",
    "executionId": "live_1756147663919",
    "runIndex": 0,
    "itemsProcessed": 1,
    "isolatedContext": true
  }
}
console show this 
🔍 Execute Step Debug: {API_BASE_URL: 'https://workflow-lg9z.onrender.com', constructedURL: 'https://workflow-lg9z.onrender.com/nodes/run-node', currentDomain: 'https://fixdai.com', hostname: 'fixdai.com'}
index-CV3r8QNO.js:37 🔍 Bypassing API_BASE due to proxy issues, using: https://workflow-lg9z.onrender.com/api/nodes/run-node
index-CV3r8QNO.js:37 🔧 Config filtered for whatsappTrigger: {originalFieldCount: 68, filteredFieldCount: 4, relevantFields: Array(2), filteredConfig: {…}}
index-CV3r8QNO.js:37 🔍 Checking nodes for chatbot triggers: 1
index-CV3r8QNO.js:37 📋 All node types: [{…}]
index-CV3r8QNO.js:37 🔍 Node dndnode_0: type=whatsappTrigger, isChatbotTrigger=false, enableChatbot=undefined, isEnabled=true
index-CV3r8QNO.js:37 ✅ Found chatbot trigger nodes: 0
index-CV3r8QNO.js:37 🤖 No chatbot widgets active
index-CV3r8QNO.js:37 🔍 Checking nodes for chatbot triggers: 1
index-CV3r8QNO.js:37 📋 All node types: [{…}]
index-CV3r8QNO.js:37 🔍 Node dndnode_0: type=whatsappTrigger, isChatbotTrigger=false, enableChatbot=undefined, isEnabled=true
index-CV3r8QNO.js:37 ✅ Found chatbot trigger nodes: 0
index-CV3r8QNO.js:37 🤖 No chatbot widgets active

backend show this 
[2025-08-25T18:47:41.191Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/nodes/validate-whatsapp","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/nodes/validate-whatsapp',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-25T18:47:41.191Z'
}
[2025-08-25T18:47:41.192Z] INFO: Request completed {"method":"OPTIONS","url":"/api/nodes/validate-whatsapp","status":200,"duration":"1ms"}
[2025-08-25T18:47:41.516Z] INFO: Incoming request {"method":"POST","url":"/api/nodes/validate-whatsapp","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/nodes/validate-whatsapp',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '99',
  authorization: 'missing',
  timestamp: '2025-08-25T18:47:41.516Z'
}
🔍 NODES API REQUEST DEBUG: {
  method: 'POST',
  url: '/validate-whatsapp',
  path: '/validate-whatsapp',
  origin: 'https://fixdai.com',
  headers: [
    'host',             'user-agent',
    'content-length',   'accept',
    'accept-encoding',  'accept-language',
    'cdn-loop',         'cf-connecting-ip',
    'cf-ipcountry',     'cf-ray',
    'cf-visitor',       'content-type',
    'origin',           'priority',
    'referer',          'render-proxy-ttl',
    'rndr-id',          'sec-ch-ua',
    'sec-ch-ua-mobile', 'sec-ch-ua-platform',
    'sec-fetch-dest',   'sec-fetch-mode',
    'sec-fetch-site',   'true-client-ip',
    'x-forwarded-for',  'x-forwarded-proto',
    'x-request-start'
  ],
  body: {
    appId: '1261111005587060',
    clientSecret: 'f04db1124f610ae4d7c4a201c73a4c73',
    nodeType: 'trigger'
  }
}
🔍 NODES ROUTE HIT: {
  method: 'POST',
  url: '/validate-whatsapp',
  originalUrl: '/api/nodes/validate-whatsapp',
  body: {
    appId: '1261111005587060',
    clientSecret: 'f04db1124f610ae4d7c4a201c73a4c73',
    nodeType: 'trigger'
  },
  timestamp: '2025-08-25T18:47:41.518Z'
}
🔍 Validating WhatsApp trigger credentials...
✅ WhatsApp credentials validated successfully
[2025-08-25T18:47:42.033Z] INFO: Request completed {"method":"POST","url":"/validate-whatsapp","status":200,"duration":"517ms"}
[2025-08-25T18:47:44.198Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/nodes/run-node","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/nodes/run-node',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-25T18:47:44.198Z'
}
[2025-08-25T18:47:44.199Z] INFO: Request completed {"method":"OPTIONS","url":"/api/nodes/run-node","status":200,"duration":"1ms"}
[2025-08-25T18:47:44.472Z] INFO: Incoming request {"method":"POST","url":"/api/nodes/run-node","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/nodes/run-node',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '588',
  authorization: 'missing',
  timestamp: '2025-08-25T18:47:44.472Z'
}
🔍 NODES API REQUEST DEBUG: {
  method: 'POST',
  url: '/run-node',
  path: '/run-node',
  origin: 'https://fixdai.com',
  headers: [
    'host',             'user-agent',
    'content-length',   'accept',
    'accept-encoding',  'accept-language',
    'cdn-loop',         'cf-connecting-ip',
    'cf-ipcountry',     'cf-ray',
    'cf-visitor',       'content-type',
    'origin',           'priority',
    'referer',          'render-proxy-ttl',
    'rndr-id',          'sec-ch-ua',
    'sec-ch-ua-mobile', 'sec-ch-ua-platform',
    'sec-fetch-dest',   'sec-fetch-mode',
    'sec-fetch-site',   'true-client-ip',
    'x-forwarded-for',  'x-forwarded-proto',
    'x-request-start'
  ],
  body: {
    node: {
      id: 'dndnode_0',
      type: 'whatsappTrigger',
      config: [Object],
      data: [Object]
    },
    inputData: null,
    connectedNodes: [],
    workflowId: 'live_test_workflow',
    workflowName: 'Live Test Workflow',
    executionId: 'live_1756147663919'
  }
}
🔍 NODES ROUTE HIT: {
  method: 'POST',
  url: '/run-node',
  originalUrl: '/api/nodes/run-node',
  body: {
    node: {
      id: 'dndnode_0',
      type: 'whatsappTrigger',
      config: [Object],
      data: [Object]
    },
    inputData: null,
    connectedNodes: [],
    workflowId: 'live_test_workflow',
    workflowName: 'Live Test Workflow',
    executionId: 'live_1756147663919'
  },
  timestamp: '2025-08-25T18:47:44.473Z'
}
=== n8n-style Node Execution ===
Node type: whatsappTrigger
Node ID: dndnode_0
Node structure: {
  "id": "dndnode_0",
  "type": "whatsappTrigger",
  "config": {
    "label": "WhatsApp Trigger",
    "description": "Trigger workflow when receiving WhatsApp message from specific number",
    "appId": "1261111005587060",
    "clientSecret": "f04db1124f610ae4d7c4a201c73a4c73"
  },
  "data": {
    "label": "WhatsApp Trigger",
    "icon": "fa-whatsapp",
    "color": "text-green-500",
    "description": "Trigger workflow when receiving WhatsApp message from specific number",
    "type": "whatsappTrigger"
  }
}
Connected nodes: 0
Input data preview: null...
🔧 Creating execution context with:
- Current node ID: dndnode_0
- AllNodes keys: [ 'dndnode_0' ]
- AllNodes structure: {
  "dndnode_0": {
    "type": "whatsappTrigger",
    "data": {
      "label": "WhatsApp Trigger",
      "icon": "fa-whatsapp",
      "color": "text-green-500",
      "description": "Trigger workflow when receiving WhatsApp message from specific number",
      "type": "whatsappTrigger"
    },
    "config": {
      "label": "WhatsApp Trigger",
      "description": "Trigger workflow when receiving WhatsApp message from specific number",
      "appId": "1261111005587060",
      "clientSecret": "f04db1124f610ae4d7c4a201c73a4c73"
    },
    "outputData": null
  }
}
✅ Execution context created successfully
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔒 Processed config with isolated context - contains 4 fields
📋 Processing 1 item(s) for node whatsappTrigger
🔄 Processing item 1/1
📱 Executing WhatsApp Trigger Node
🚀 Executing WhatsApp Trigger Node
Config: {
  "label": "WhatsApp Trigger",
  "description": "Trigger workflow when receiving WhatsApp message from specific number",
  "appId": "1261111005587060",
  "clientSecret": "f04db1124f610ae4d7c4a201c73a4c73"
}
Input data: {}
🔒 Processed config with context: {
  label: 'WhatsApp Trigger',
  description: 'Trigger workflow when receiving WhatsApp message from specific number',
  appId: '1261111005587060',
  clientSecret: 'f04db1124f610ae4d7c4a201c73a4c73'
}
⚠️ Webhook validation failed: Invalid webhook object type, No entry data in webhook
📱 WhatsApp Trigger Result: {
  success: false,
  error: 'Webhook validation failed: Invalid webhook object type, No entry data in webhook',
  nodeType: 'whatsappTrigger',
  timestamp: '2025-08-25T18:47:44.474Z'
}
✅ n8n-style execution completed: processed 1 item(s)
Result preview: {
  "success": false,
  "error": "Webhook validation failed: Invalid webhook object type, No entry data in webhook",
  "nodeType": "whatsappTrigger",
  "timestamp": "2025-08-25T18:47:44.474Z",
  "item...
[2025-08-25T18:47:44.475Z] INFO: Request completed {"method":"POST","url":"/run-node","status":200,"duration":"3ms"}