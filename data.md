[2025-08-25T16:27:38.237Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/nodes/run-node","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/nodes/run-node',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-25T16:27:38.237Z'
}
[2025-08-25T16:27:38.237Z] INFO: Request completed {"method":"OPTIONS","url":"/api/nodes/run-node","status":200,"duration":"0ms"}
[2025-08-25T16:27:38.522Z] INFO: Incoming request {"method":"POST","url":"/api/nodes/run-node","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/nodes/run-node',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '2270',
  authorization: 'missing',
  timestamp: '2025-08-25T16:27:38.523Z'
}
🔍 NODES API REQUEST DEBUG: {
  method: 'POST',
  url: '/run-node',
  path: '/run-node',
  origin: 'https://fixdai.com',
  headers: [
    'host',              'user-agent',
    'content-length',    'accept',
    'accept-encoding',   'accept-language',
    'cdn-loop',          'cf-connecting-ip',
    'cf-ipcountry',      'cf-ray',
    'cf-visitor',        'content-type',
    'origin',            'priority',
    'referer',           'render-proxy-ttl',
    'rndr-id',           'sec-ch-ua',
    'sec-ch-ua-mobile',  'sec-ch-ua-platform',
    'sec-fetch-dest',    'sec-fetch-mode',
    'sec-fetch-site',    'sec-gpc',
    'true-client-ip',    'x-forwarded-for',
    'x-forwarded-proto', 'x-request-start'
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
    executionId: 'live_1756139257707'
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
    executionId: 'live_1756139257707'
  },
  timestamp: '2025-08-25T16:27:38.524Z'
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
    "mode": "runOnce",
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
    "chatSessionName": "My Chat Bot",
    "welcomeMessage": "👋 Welcome! How can I help you today?",
    "allowFileUploads": false,
    "allowedFileTypes": "*",
    "chatbotTitle": "Customer Support",
    "chatbotSubtitle": "How can we help you?",
    "chatbotTheme": "#667eea",
    "enableChatbot": true,
    "accountId": "",
    "responseType": "dm",
    "responseMessage": "Hello {{$json.sender_name || \"there\"}}! Thanks for your message. We'll get back to you soon! 🙌",
    "triggerKeywords": "",
    "responseDelay": 2,
    "enableSmartResponse": false,
    "accessToken": "{{$env.INSTAGRAM_ACCESS_TOKEN}}",
    "instagramAccountStatus": null,
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
      "mode": "runOnce",
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
      "chatSessionName": "My Chat Bot",
      "welcomeMessage": "👋 Welcome! How can I help you today?",
      "allowFileUploads": false,
      "allowedFileTypes": "*",
      "chatbotTitle": "Customer Support",
      "chatbotSubtitle": "How can we help you?",
      "chatbotTheme": "#667eea",
      "enableChatbot": true,
      "accountId": "",
      "responseType": "dm",
      "responseMessage": "Hello {{$json.sender_name || \"there\"}}! Thanks for your message. We'll get back to you soon! 🙌",
      "triggerKeywords": "",
      "responseDelay": 2,
      "enableSmartResponse": false,
      "accessToken": "{{$env.INSTAGRAM_ACCESS_TOKEN}}",
      "instagramAccountStatus": null,
      "appId": "1261111005587060",
      "clientSecret": "f04db1124f610ae4d7c4a201c73a4c73"
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
  '$json': [ 'label', 'icon', 'color', 'description', 'type' ],
  availableNodes: [ 'WhatsApp Trigger' ],
  '$env': [ 'NODE_ENV', 'API_BASE', 'WORKFLOW_VERSION', 'PORT' ]
}
❌ Backend Path not found: {{message.chat.id}}
🔍 Looking for node dndnode_0 in allNodes: [ 'dndnode_0' ]
🔒 Backend Isolated Context for dndnode_0[0]: {
  '$json': [ 'label', 'icon', 'color', 'description', 'type' ],
  availableNodes: [ 'WhatsApp Trigger' ],
  '$env': [ 'NODE_ENV', 'API_BASE', 'WORKFLOW_VERSION', 'PORT' ]
}
❌ Backend Path not found: {{$json.sender_name || "there"}}
🔍 Looking for node dndnode_0 in allNodes: [ 'dndnode_0' ]
🔒 Backend Isolated Context for dndnode_0[0]: {
  '$json': [ 'label', 'icon', 'color', 'description', 'type' ],
  availableNodes: [ 'WhatsApp Trigger' ],
  '$env': [ 'NODE_ENV', 'API_BASE', 'WORKFLOW_VERSION', 'PORT' ]
}
❌ Backend Path not found: {{$env.INSTAGRAM_ACCESS_TOKEN}}
🔒 Processed config with isolated context - contains 68 fields
📋 Processing 1 item(s) for node whatsappTrigger
🔄 Processing item 1/1
📱 Executing WhatsApp Trigger Node
🚀 Executing WhatsApp Trigger Node
Config: {
  "label": "WhatsApp Trigger",
  "description": "Trigger workflow when receiving WhatsApp message from specific number",
  "fieldsToMatch": {
    "0": {
      "key1": "",
      "key2": ""
    }
  },
  "resumeCondition": "afterTimeInterval",
  "waitAmount": 5,
  "waitUnit": "seconds",
  "conditions": {
    "0": {
      "value1": "",
      "operator": "is_equal_to",
      "value2": ""
    }
  },
  "combinator": "AND",
  "ignoreCase": false,
  "errorType": "errorMessage",
  "errorMessage": "An error occurred!",
  "switchRules": {
    "0": {
      "value1": "",
      "operator": "is_equal_to",
      "value2": ""
    }
  },
  "switchOptions": {},
  "source": "database",
  "workflow": "fromList",
  "workflowId": "",
  "mode": "runOnce",
  "mergeMode": "append",
  "batchSize": 1,
  "fields": {
    "0": {
      "key": "",
      "value": ""
    }
  },
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
  "chatSessionName": "My Chat Bot",
  "welcomeMessage": "👋 Welcome! How can I help you today?",
  "allowFileUploads": false,
  "allowedFileTypes": "*",
  "chatbotTitle": "Customer Support",
  "chatbotSubtitle": "How can we help you?",
  "chatbotTheme": "#667eea",
  "enableChatbot": true,
  "accountId": "",
  "responseType": "dm",
  "responseMessage": "Hello {{$json.sender_name || \"there\"}}! Thanks for your message. We'll get back to you soon! 🙌",
  "triggerKeywords": "",
  "responseDelay": 2,
  "enableSmartResponse": false,
  "accessToken": "{{$env.INSTAGRAM_ACCESS_TOKEN}}",
  "instagramAccountStatus": null,
  "appId": "1261111005587060",
  "clientSecret": "f04db1124f610ae4d7c4a201c73a4c73"
}
Input data: {}
🔍 Looking for node dndnode_0 in allNodes: [ 'dndnode_0' ]
🔒 Backend Isolated Context for dndnode_0[0]: {
  '$json': [],
  availableNodes: [ 'WhatsApp Trigger' ],
  '$env': [ 'NODE_ENV', 'API_BASE', 'WORKFLOW_VERSION', 'PORT' ]
}
❌ Backend Path not found: {{$env.INSTAGRAM_ACCESS_TOKEN}}
🔧 Template resolved: accessToken: "{{$env.INSTAGRAM_ACCESS_TOKEN}}" → "{{$env.INSTAGRAM_ACCESS_TOKEN}}"
🔒 Processed config with context: {
  label: 'WhatsApp Trigger',
  description: 'Trigger workflow when receiving WhatsApp message from specific number',
  fieldsToMatch: { '0': { key1: '', key2: '' } },
  resumeCondition: 'afterTimeInterval',
  waitAmount: 5,
  waitUnit: 'seconds',
  conditions: { '0': { value1: '', operator: 'is_equal_to', value2: '' } },
  combinator: 'AND',
  ignoreCase: false,
  errorType: 'errorMessage',
  errorMessage: 'An error occurred!',
  switchRules: { '0': { value1: '', operator: 'is_equal_to', value2: '' } },
  switchOptions: {},
  source: 'database',
  workflow: 'fromList',
  workflowId: '',
  mode: 'runOnce',
  mergeMode: 'append',
  batchSize: 1,
  fields: { '0': { key: '', value: '' } },
  botToken: '',
  chatId: '{{message.chat.id}}',
  messageType: 'text',
  messageText: 'Hello! This is a message from your bot.',
  parseMode: '',
  disableWebPagePreview: false,
  photoUrl: '',
  photoCaption: '',
  videoUrl: '',
  videoCaption: '',
  videoDuration: '',
  audioUrl: '',
  audioCaption: '',
  voiceUrl: '',
  documentUrl: '',
  animationUrl: '',
  stickerFileId: '',
  latitude: '',
  longitude: '',
  locationHorizontalAccuracy: '',
  contactPhoneNumber: '',
  contactFirstName: '',
  contactLastName: '',
  pollQuestion: '',
  pollOptions: '',
  banUserId: '',
  apiKey: '',
  model: 'claude-3-5-sonnet-20241022',
  systemPrompt: '',
  userMessage: '',
  chatSessionName: 'My Chat Bot',
  welcomeMessage: '👋 Welcome! How can I help you today?',
  allowFileUploads: false,
  allowedFileTypes: '*',
  chatbotTitle: 'Customer Support',
  chatbotSubtitle: 'How can we help you?',
  chatbotTheme: '#667eea',
  enableChatbot: true,
  accountId: '',
  responseType: 'dm',
  responseMessage: `Hello {{$json.sender_name || "there"}}! Thanks for your message. We'll get back to you soon! 🙌`,
  triggerKeywords: '',
  responseDelay: 2,
  enableSmartResponse: false,
  accessToken: '{{$env.INSTAGRAM_ACCESS_TOKEN}}',
  instagramAccountStatus: null,
  appId: '1261111005587060',
  clientSecret: 'f04db1124f610ae4d7c4a201c73a4c73'
}
⚠️ Webhook validation failed: Invalid webhook object type, No entry data in webhook
📱 WhatsApp Trigger Result: {
  success: false,
  error: 'Webhook validation failed: Invalid webhook object type, No entry data in webhook',
  nodeType: 'whatsappTrigger',
  timestamp: '2025-08-25T16:27:38.527Z'
}
✅ n8n-style execution completed: processed 1 item(s)
Result preview: {
  "success": false,
  "error": "Webhook validation failed: Invalid webhook object type, No entry data in webhook",
  "nodeType": "whatsappTrigger",
  "timestamp": "2025-08-25T16:27:38.527Z",
  "item...
[2025-08-25T16:27:38.528Z] INFO: Request completed {"method":"POST","url":"/run-node","status":200,"duration":"6ms"}