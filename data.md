[2025-08-26T18:22:44.197Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/untitled-workflow-jzepz7/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'OPTIONS',
  url: '/api/workflows/untitled-workflow-jzepz7/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-26T18:22:44.197Z'
}
[2025-08-26T18:22:44.198Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/untitled-workflow-jzepz7/activate","status":200,"duration":"1ms"}
[2025-08-26T18:22:44.498Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/untitled-workflow-jzepz7/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'POST',
  url: '/api/workflows/untitled-workflow-jzepz7/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '2162',
  authorization: 'present',
  timestamp: '2025-08-26T18:22:44.498Z'
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
  originalUrl: '/api/workflows/untitled-workflow-jzepz7/activate',
  params: {},
  query: {},
  bodySize: 2158,
  timestamp: '2025-08-26T18:22:44.499Z'
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
  url: '/untitled-workflow-jzepz7/activate',
  params: { id: 'untitled-workflow-jzepz7' },
  bodyKeys: [ 'workflow' ],
  origin: 'https://fixdai.com',
  timestamp: '2025-08-26T18:22:44.499Z'
}
🔍 Activation data validation: {
  workflowId: 'untitled-workflow-jzepz7',
  hasWorkflow: true,
  hasNodes: true,
  hasEdges: true,
  nodeCount: 1,
  edgeCount: 0,
  dryRun: false
}
============================================================
🚀 WORKFLOW ACTIVATION STARTED
🔄 Activating workflow: untitled-workflow-jzepz7
📋 Found 1 trigger node(s): [ 'whatsappTrigger' ]
📊 Current active workflows count: 0
============================================================
Registering workflow untitled-workflow-jzepz7 for automatic execution
Workflow config received: {
  nodes: 1,
  edges: 0,
  nodeTypes: [ 'whatsappTrigger (dndnode_0)' ],
  edgeConnections: []
}
Found trigger node: WhatsApp Trigger (dndnode_0)
Workflow untitled-workflow-jzepz7 registered successfully with 1 nodes and 0 edges
✅ Workflow untitled-workflow-jzepz7 registered for auto-execution
WorkflowExecutor active workflows count: 1
🔄 Auto-updating WhatsApp webhook for workflow: untitled-workflow-jzepz7
📋 WhatsApp trigger node data: {
  "label": "WhatsApp Trigger",
  "icon": "fa-whatsapp",
  "color": "text-green-500",
  "description": "Trigger workflow when receiving WhatsApp message from specific number",
  "type": "whatsappTrigger",
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
  "inputData": null,
  "outputData": null
}
🔍 WhatsApp configuration search results:
   - whatsappTrigger.data.appId: not found
   - whatsappTrigger.data.clientSecret: not found
❌ No App ID or Client Secret found in WhatsApp trigger configuration
💡 Make sure the App ID and Client Secret are configured in the WhatsApp trigger node
============================================================
✅ WORKFLOW ACTIVATION COMPLETED SUCCESSFULLY!
🎯 Workflow ID: untitled-workflow-jzepz7
📊 Controller active workflows: 1
🚀 Executor active workflows: 1
🔗 Trigger URLs generated: 1
   1. whatsappTrigger: https://workflow-lg9z.onrender.com/api/webhooks/whatsapp/untitled-workflow-jzepz7
⏰ Activated at: 2025-08-26T18:22:44.500Z
============================================================
💾 Stored active workflow untitled-workflow-jzepz7 to database
✅ ACTIVATION SUCCESS - Sending response: {
  success: true,
  workflowId: 'untitled-workflow-jzepz7',
  triggerUrlCount: 1,
  responseSize: 309,
  timestamp: '2025-08-26T18:22:44.501Z'
}
[2025-08-26T18:22:44.501Z] INFO: Request completed {"method":"POST","url":"/untitled-workflow-jzepz7/activate","status":200,"duration":"3ms"}
[2025-08-26T18:23:06.142Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/whatsapp","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/whatsapp',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '483',
  authorization: 'missing',
  timestamp: '2025-08-26T18:23:06.142Z'
}
📱 WhatsApp webhook received: {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1411124906823702",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15556646119",
              "phone_number_id": "628007790405551"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Muhammad Tarq"
                },
                "wa_id": "9647700716669"
              }
            ],
            "messages": [
              {
                "from": "9647700716669",
                "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBMzZGMDQxRDUxQUUxMjlCNEYzAA==",
                "timestamp": "1756232585",
                "text": {
                  "body": "Burke"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
🔄 Processing WhatsApp webhook...
📱 No WhatsApp trigger workflows found
[2025-08-26T18:23:06.145Z] INFO: Request completed {"method":"POST","url":"/whatsapp","status":200,"duration":"3ms"}