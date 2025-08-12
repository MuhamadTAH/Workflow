🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/workflows/untitled-workflow-i5chjl/trigger-info',
  origin: undefined,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-12T22:29:29.927Z'
}
Parse error for workflow untitled-workflow-i5chjl : Unexpected token u in JSON at position 0
[2025-08-12T22:29:29.930Z] INFO: Request completed {"method":"GET","url":"/untitled-workflow-i5chjl/trigger-info","status":200,"duration":"4ms"}
[2025-08-12T22:29:35.569Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/chatTrigger/untitled-workflow-i5chjl/dndnode_0/chat","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/chatTrigger/untitled-workflow-i5chjl/dndnode_0/chat',
  origin: 'https://workflow-lg9z.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-12T22:29:35.569Z'
}
[webhook] Chat Trigger incoming request {
  workflowId: 'untitled-workflow-i5chjl',
  nodeId: 'dndnode_0',
  path: 'chat',
  ip: '::1',
  bodyKeys: [ 'text', 'userId', 'sessionId', 'source', 'metadata' ]
}
[webhook] Processed data: {
  "json": {
    "text": "hello",
    "userId": "hosted-chat-user",
    "sessionId": "chat-session-1755037774409-qllqk0x63",
    "source": "hosted_chat_fallback",
    "metadata": {
      "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-i5chjl&nodeId=dndnode_0&path=chat&title=Chat%20Support",
      "referrer": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-i5chjl&nodeId=dndnode_0&path=chat&title=Chat%20Support",
      "ip": "::1",
      "originalQuery": {},
      "userMetadata": {
        "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-i5chjl&nodeId=dndnode_0&path=chat&title=Chat%20Support",
        "timestamp": "2025-08-12T22:29:34.410Z",
        "workflowId": "untitled-workflow-i5chjl",
        "nodeId": "dndnode_0"
      }
    },
    "raw": {
      "text": "hello",
      "userId": "hosted-chat-user",
      "sessionId": "chat-session-1755037774409-qllqk0x63",
      "source": "hosted_chat_fallback",
      "metadata": {
        "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-i5chjl&nodeId=dndnode_0&path=chat&title=Chat%20Support",
        "timestamp": "2025-08-12T22:29:34.410Z",
        "workflowId": "untitled-workflow-i5chjl",
        "nodeId": "dndnode_0"
      }
    }
  },
  "headers": {
    "host": "workflow-lg9z.onrender.com",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
    "content-length": "392",
    "accept": "*/*",
    "accept-encoding": "gzip, br",
    "accept-language": "en-US,en;q=0.9",
    "cdn-loop": "cloudflare; loops=1",
    "cf-connecting-ip": "62.201.244.196",
    "cf-ipcountry": "IQ",
    "cf-ray": "96e369906c8cf772-PDX",
    "cf-visitor": "{\"scheme\":\"https\"}",
    "content-type": "application/json",
    "origin": "https://workflow-lg9z.onrender.com",
    "priority": "u=1, i",
    "referer": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-i5chjl&nodeId=dndnode_0&path=chat&title=Chat%20Support",
    "render-proxy-ttl": "4",
    "rndr-id": "d5f14d2b-fa53-4bd5",
    "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Microsoft Edge\";v=\"138\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "true-client-ip": "62.201.244.196",
[webhook] ⚠️ Workflow not found or not active: untitled-workflow-i5chjl
    "x-forwarded-for": "62.201.244.196, 172.68.175.32, 10.214.91.90",
    "x-forwarded-proto": "https",
    "x-request-start": "1755037775564614"
  },
  "query": {},
  "method": "POST",
  "nodeType": "chatTrigger",
  "timestamp": "2025-08-12T22:29:35.583Z"
}
[webhook] Message stored for key: untitled-workflow-i5chjl-dndnode_0
[webhook] 🚀 Triggering workflow execution for: untitled-workflow-i5chjl
[webhook] 🔍 Checking workflow status for untitled-workflow-i5chjl:
[webhook] WorkflowExecutor available: true
[webhook] Active workflows in executor: 0
[webhook] Workflow untitled-workflow-i5chjl active: false
[webhook] 📋 All active workflows: []
[webhook] 🔍 Matching workflows: []
[webhook] 📋 Available workflows: []
📨 getMessages called for session: "chat-session-1755037774409-qllqk0x63"
❌ No session found for: chat-session-1755037774409-qllqk0x63
📋 Available sessions: 
[2025-08-12T22:29:35.584Z] INFO: Request completed {"method":"POST","url":"/chatTrigger/untitled-workflow-i5chjl/dndnode_0/chat","status":200,"duration":"16ms"}
[2025-08-12T22:29:37.695Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/nodes/run-node","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/nodes/run-node',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-12T22:29:37.696Z'
}
[2025-08-12T22:29:37.696Z] INFO: Request completed {"method":"OPTIONS","url":"/api/nodes/run-node","status":200,"duration":"1ms"}
[2025-08-12T22:29:38.054Z] INFO: Incoming request {"method":"POST","url":"/api/nodes/run-node","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/nodes/run-node',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-12T22:29:38.054Z'
}
🔍 NODES API REQUEST DEBUG: {
  method: 'POST',
  url: '/run-node',
  path: '/run-node',
  origin: 'https://frontend-dpcg.onrender.com',
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
      type: 'chatTrigger',
      config: [Object],
      data: [Object]
    },
    inputData: null,
    connectedNodes: [],
    workflowId: 'live_test_workflow',
    workflowName: 'Live Test Workflow',
    executionId: 'live_1755037776421'
  }
}
🔍 NODES ROUTE HIT: {
  method: 'POST',
  url: '/run-node',
  originalUrl: '/api/nodes/run-node',
  body: {
    node: {
      id: 'dndnode_0',
      type: 'chatTrigger',
      config: [Object],
      data: [Object]
    },
    inputData: null,
    connectedNodes: [],
    workflowId: 'live_test_workflow',
    workflowName: 'Live Test Workflow',
    executionId: 'live_1755037776421'
  },
  timestamp: '2025-08-12T22:29:38.056Z'
}
=== n8n-style Node Execution ===
Node type: chatTrigger
Node ID: dndnode_0
Node structure: {
  "id": "dndnode_0",
  "type": "chatTrigger",
  "config": {
    "label": "Chat Trigger",
    "description": "Start workflow from hosted or embedded chat messages",
    "fieldsToMatch": [
      {
        "key1": "",
        "key2": ""
      }
    ],
    "resumeCondition": "afterTimeInterval",
    "waitAmount": 5,
    "waitUnit": "seconds",
    "conditions": [
      {
        "value1": "",
        "operator": "is_equal_to",
        "value2": ""
      }
    ],
    "combinator": "AND",
    "ignoreCase": false,
    "errorType": "errorMessage",
    "errorMessage": "An error occurred!",
    "switchRules": [
      {
        "value1": "",
        "operator": "is_equal_to",
        "value2": ""
      }
    ],
    "switchOptions": [],
    "source": "database",
    "workflow": "fromList",
    "workflowId": "",
    "mode": "hosted",
    "mergeMode": "append",
    "batchSize": 1,
    "fields": [
      {
        "key": "",
        "value": ""
      }
    ],
    "botToken": "",
    "chatId": "{{message.chat.id}}",
    "messageType": "text",
    "messageText": "Hello! This is a message from your bot.",
    "parseMode": "",
    "disableWebPagePreview": false,
    "photoUrl": "",
    "photoCaption": "",
    "videoUrl": "",
    "videoCaption": "",
    "videoDuration": "",
    "audioUrl": "",
    "audioCaption": "",
    "voiceUrl": "",
    "documentUrl": "",
    "animationUrl": "",
    "stickerFileId": "",
    "latitude": "",
    "longitude": "",
    "locationHorizontalAccuracy": "",
    "contactPhoneNumber": "",
    "contactFirstName": "",
    "contactLastName": "",
    "pollQuestion": "",
    "pollOptions": "",
    "banUserId": "",
    "apiKey": "",
    "model": "claude-3-5-sonnet-20241022",
    "systemPrompt": "",
    "userMessage": "",
    "webhookPath": "chat",
    "secret": "",
    "chatTitle": "Chat Support",
    "sessionId": "{{$json.sessionId}}",
    "message": "Hello! I received your message: {{$json.text}}"
  },
  "data": {
    "label": "Chat Trigger",
    "icon": "fa-comments",
    "color": "text-green-500",
    "description": "Start workflow from hosted or embedded chat messages",
    "type": "chatTrigger",
    "fieldsToMatch": [
      {
        "key1": "",
        "key2": ""
      }
    ],
    "resumeCondition": "afterTimeInterval",
    "waitAmount": 5,
    "waitUnit": "seconds",
    "conditions": [
      {
        "value1": "",
        "operator": "is_equal_to",
        "value2": ""
      }
    ],
    "combinator": "AND",
    "ignoreCase": false,
    "errorType": "errorMessage",
    "errorMessage": "An error occurred!",
    "switchRules": [
      {
        "value1": "",
        "operator": "is_equal_to",
        "value2": ""
      }
    ],
    "switchOptions": [],
    "source": "database",
    "workflow": "fromList",
    "workflowId": "",
    "mode": "hosted",
    "mergeMode": "append",
    "batchSize": 1,
    "fields": [
      {
        "key": "",
        "value": ""
      }
    ],
    "botToken": "",
    "chatId": "{{message.chat.id}}",
    "messageType": "text",
    "messageText": "Hello! This is a message from your bot.",
    "parseMode": "",
    "disableWebPagePreview": false,
    "photoUrl": "",
    "photoCaption": "",
    "videoUrl": "",
    "videoCaption": "",
    "videoDuration": "",
    "audioUrl": "",
    "audioCaption": "",
    "voiceUrl": "",
    "documentUrl": "",
    "animationUrl": "",
    "stickerFileId": "",
    "latitude": "",
    "longitude": "",
    "locationHorizontalAccuracy": "",
    "contactPhoneNumber": "",
    "contactFirstName": "",
    "contactLastName": "",
    "pollQuestion": "",
    "pollOptions": "",
    "banUserId": "",
    "apiKey": "",
    "model": "claude-3-5-sonnet-20241022",
    "systemPrompt": "",
    "userMessage": "",
    "webhookPath": "chat",
    "secret": "",
    "chatTitle": "Chat Support",
    "sessionId": "{{$json.sessionId}}",
    "message": "Hello! I received your message: {{$json.text}}",
    "inputData": null,
    "outputData": null
  }
}
Connected nodes: 0
Input data preview: null...
🔧 Creating execution context with:
- Current node ID: dndnode_0
- AllNodes keys: [ 'dndnode_0' ]
- AllNodes structure: {
  "dndnode_0": {
    "type": "chatTrigger",
    "data": {
      "label": "Chat Trigger",
      "icon": "fa-comments",
      "color": "text-green-500",
      "description": "Start workflow from hosted or embedded chat messages",
      "type": "chatTrigger",
      "fieldsToMatch": [
        {
          "key1": "",
          "key2": ""
        }
      ],
      "resumeCondition": "afterTimeInterval",
      "waitAmount": 5,
      "waitUnit": "seconds",
      "conditions": [
        {
          "value1": "",
          "operator": "is_equal_to",
          "value2": ""
        }
      ],
      "combinator": "AND",
      "ignoreCase": false,
      "errorType": "errorMessage",
      "errorMessage": "An error occurred!",
      "switchRules": [
        {
          "value1": "",
          "operator": "is_equal_to",
          "value2": ""
        }
      ],
      "switchOptions": [],
      "source": "database",
      "workflow": "fromList",
      "workflowId": "",
      "mode": "hosted",
      "mergeMode": "append",
      "batchSize": 1,
      "fields": [
        {
          "key": "",
          "value": ""
        }
      ],
      "botToken": "",
      "chatId": "{{message.chat.id}}",
      "messageType": "text",
      "messageText": "Hello! This is a message from your bot.",
      "parseMode": "",
      "disableWebPagePreview": false,
      "photoUrl": "",
      "photoCaption": "",
      "videoUrl": "",
      "videoCaption": "",
      "videoDuration": "",
      "audioUrl": "",
      "audioCaption": "",
      "voiceUrl": "",
      "documentUrl": "",
      "animationUrl": "",
      "stickerFileId": "",
      "latitude": "",
      "longitude": "",
      "locationHorizontalAccuracy": "",
      "contactPhoneNumber": "",
      "contactFirstName": "",
      "contactLastName": "",
      "pollQuestion": "",
      "pollOptions": "",
      "banUserId": "",
      "apiKey": "",
      "model": "claude-3-5-sonnet-20241022",
      "systemPrompt": "",
      "userMessage": "",
      "webhookPath": "chat",
      "secret": "",
      "chatTitle": "Chat Support",
      "sessionId": "{{$json.sessionId}}",
      "message": "Hello! I received your message: {{$json.text}}",
      "inputData": null,
      "outputData": null
    },
    "config": {
      "label": "Chat Trigger",
      "description": "Start workflow from hosted or embedded chat messages",
      "fieldsToMatch": [
        {
          "key1": "",
          "key2": ""
        }
      ],
      "resumeCondition": "afterTimeInterval",
      "waitAmount": 5,
      "waitUnit": "seconds",
      "conditions": [
        {
          "value1": "",
          "operator": "is_equal_to",
          "value2": ""
        }
      ],
      "combinator": "AND",
      "ignoreCase": false,
      "errorType": "errorMessage",
      "errorMessage": "An error occurred!",
      "switchRules": [
        {
          "value1": "",
          "operator": "is_equal_to",
          "value2": ""
        }
      ],
      "switchOptions": [],
      "source": "database",
      "workflow": "fromList",
      "workflowId": "",
      "mode": "hosted",
      "mergeMode": "append",
      "batchSize": 1,
      "fields": [
        {
          "key": "",
          "value": ""
        }
      ],
      "botToken": "",
      "chatId": "{{message.chat.id}}",
      "messageType": "text",
      "messageText": "Hello! This is a message from your bot.",
      "parseMode": "",
      "disableWebPagePreview": false,
      "photoUrl": "",
      "photoCaption": "",
      "videoUrl": "",
      "videoCaption": "",
      "videoDuration": "",
      "audioUrl": "",
      "audioCaption": "",
      "voiceUrl": "",
      "documentUrl": "",
      "animationUrl": "",
      "stickerFileId": "",
      "latitude": "",
      "longitude": "",
      "locationHorizontalAccuracy": "",
      "contactPhoneNumber": "",
      "contactFirstName": "",
      "contactLastName": "",
      "pollQuestion": "",
      "pollOptions": "",
      "banUserId": "",
      "apiKey": "",
      "model": "claude-3-5-sonnet-20241022",
      "systemPrompt": "",
      "userMessage": "",
      "webhookPath": "chat",
      "secret": "",
      "chatTitle": "Chat Support",
      "sessionId": "{{$json.sessionId}}",
      "message": "Hello! I received your message: {{$json.text}}"
    },
    "outputData": null
  }
}
✅ Execution context created successfully
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔧 processTemplates: Updated allNodes with keys: [ 'dndnode_0' ]
🔍 Looking for node dndnode_0 in allNodes: [ 'dndnode_0' ]
🔒 Backend Isolated Context for dndnode_0[0]: {
  '$json': [
    'label',
    'icon',
    'color',
    'description',
    'type',
    'fieldsToMatch',
    'resumeCondition',
    'waitAmount',
    'waitUnit',
    'conditions',
    'combinator',
    'ignoreCase',
    'errorType',
    'errorMessage',
    'switchRules',
    'switchOptions',
    'source',
    'workflow',
    'workflowId',
    'mode',
    'mergeMode',
    'batchSize',
    'fields',
    'botToken',
    'chatId',
    'messageType',
    'messageText',
    'parseMode',
    'disableWebPagePreview',
    'photoUrl',
    'photoCaption',
    'videoUrl',
    'videoCaption',
    'videoDuration',
    'audioUrl',
    'audioCaption',
    'voiceUrl',
    'documentUrl',
    'animationUrl',
    'stickerFileId',
    'latitude',
    'longitude',
    'locationHorizontalAccuracy',
    'contactPhoneNumber',
    'contactFirstName',
    'contactLastName',
    'pollQuestion',
    'pollOptions',
    'banUserId',
    'apiKey',
    'model',
    'systemPrompt',
    'userMessage',
    'webhookPath',
    'secret',
    'chatTitle',
    'sessionId',
    'message',
    'inputData',
    'outputData'
  ],
  availableNodes: [ 'Chat Trigger' ],
  '$env': [ 'NODE_ENV', 'API_BASE', 'WORKFLOW_VERSION', 'PORT' ]
}
❌ Backend Path not found: {{message.chat.id}}
🔍 Looking for node dndnode_0 in allNodes: [ 'dndnode_0' ]
🔒 Backend Isolated Context for dndnode_0[0]: {
  '$json': [
    'label',
    'icon',
    'color',
    'description',
    'type',
    'fieldsToMatch',
    'resumeCondition',
    'waitAmount',
    'waitUnit',
    'conditions',
    'combinator',
    'ignoreCase',
    'errorType',
    'errorMessage',
    'switchRules',
    'switchOptions',
    'source',
    'workflow',
    'workflowId',
    'mode',
    'mergeMode',
    'batchSize',
    'fields',
    'botToken',
    'chatId',
    'messageType',
    'messageText',
    'parseMode',
    'disableWebPagePreview',
    'photoUrl',
    'photoCaption',
    'videoUrl',
    'videoCaption',
    'videoDuration',
    'audioUrl',
    'audioCaption',
    'voiceUrl',
    'documentUrl',
    'animationUrl',
    'stickerFileId',
    'latitude',
    'longitude',
    'locationHorizontalAccuracy',
    'contactPhoneNumber',
    'contactFirstName',
    'contactLastName',
    'pollQuestion',
    'pollOptions',
    'banUserId',
    'apiKey',
    'model',
    'systemPrompt',
    'userMessage',
    'webhookPath',
    'secret',
    'chatTitle',
    'sessionId',
    'message',
    'inputData',
    'outputData'
  ],
  availableNodes: [ 'Chat Trigger' ],
  '$env': [ 'NODE_ENV', 'API_BASE', 'WORKFLOW_VERSION', 'PORT' ]
}
✅ Backend Resolved {{$json.sessionId}} → {{$json.sessionId}}
🔍 Looking for node dndnode_0 in allNodes: [ 'dndnode_0' ]
🔒 Backend Isolated Context for dndnode_0[0]: {
  '$json': [
    'label',
    'icon',
    'color',
    'description',
    'type',
    'fieldsToMatch',
    'resumeCondition',
    'waitAmount',
    'waitUnit',
    'conditions',
    'combinator',
    'ignoreCase',
    'errorType',
    'errorMessage',
    'switchRules',
    'switchOptions',
    'source',
    'workflow',
    'workflowId',
    'mode',
    'mergeMode',
    'batchSize',
    'fields',
    'botToken',
    'chatId',
    'messageType',
    'messageText',
    'parseMode',
    'disableWebPagePreview',
    'photoUrl',
    'photoCaption',
    'videoUrl',
    'videoCaption',
    'videoDuration',
    'audioUrl',
    'audioCaption',
    'voiceUrl',
    'documentUrl',
    'animationUrl',
    'stickerFileId',
    'latitude',
    'longitude',
    'locationHorizontalAccuracy',
    'contactPhoneNumber',
    'contactFirstName',
    'contactLastName',
    'pollQuestion',
    'pollOptions',
    'banUserId',
    'apiKey',
    'model',
    'systemPrompt',
    'userMessage',
    'webhookPath',
    'secret',
    'chatTitle',
    'sessionId',
    'message',
    'inputData',
    'outputData'
  ],
  availableNodes: [ 'Chat Trigger' ],
  '$env': [ 'NODE_ENV', 'API_BASE', 'WORKFLOW_VERSION', 'PORT' ]
}
❌ Backend Path not found: {{$json.text}}
🔒 Processed config with isolated context - contains 55 fields
📋 Processing 1 item(s) for node chatTrigger
🔄 Processing item 1/1
🔍 [ChatTrigger] Executing with context: {
  workflowId: 'live_test_workflow',
  nodeId: 'dndnode_0',
  configWorkflowId: ''
}
✅ n8n-style execution completed: processed 1 item(s)
Result preview: {
  "success": true,
  "nodeType": "chatTrigger",
  "data": {},
  "message": "Chat Trigger node executed successfully",
  "timestamp": "2025-08-12T22:29:38.062Z",
  "itemIndex": 0,
  "processedAt": "2...
[2025-08-12T22:29:38.062Z] INFO: Request completed {"method":"POST","url":"/run-node","status":200,"duration":"8ms"}