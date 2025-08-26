[2025-08-26T19:32:25.422Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/untitled-workflow-qanca1/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'OPTIONS',
  url: '/api/workflows/untitled-workflow-qanca1/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-26T19:32:25.422Z'
}
[2025-08-26T19:32:25.423Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/untitled-workflow-qanca1/activate","status":200,"duration":"1ms"}
[2025-08-26T19:32:25.687Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/untitled-workflow-qanca1/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'POST',
  url: '/api/workflows/untitled-workflow-qanca1/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '820',
  authorization: 'present',
  timestamp: '2025-08-26T19:32:25.687Z'
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
  originalUrl: '/api/workflows/untitled-workflow-qanca1/activate',
  params: {},
  query: {},
  bodySize: 820,
  timestamp: '2025-08-26T19:32:25.700Z'
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
  url: '/untitled-workflow-qanca1/activate',
  params: { id: 'untitled-workflow-qanca1' },
  bodyKeys: [ 'workflow' ],
  origin: 'https://fixdai.com',
  timestamp: '2025-08-26T19:32:25.701Z'
}
🔍 Activation data validation: {
  workflowId: 'untitled-workflow-qanca1',
  hasWorkflow: true,
  hasNodes: true,
  hasEdges: true,
  nodeCount: 2,
  edgeCount: 1,
  dryRun: false
}
============================================================
🚀 WORKFLOW ACTIVATION STARTED
🔄 Activating workflow: untitled-workflow-qanca1
📋 Found 1 trigger node(s): [ 'whatsappTrigger' ]
📊 Current active workflows count: 0
============================================================
Registering workflow untitled-workflow-qanca1 for automatic execution
Workflow config received: {
  nodes: 2,
  edges: 1,
  nodeTypes: [ 'whatsappTrigger (dndnode_0)', 'whatsappSendMessage (dndnode_1)' ],
  edgeConnections: [ 'dndnode_0 → dndnode_1' ]
}
Found trigger node: WhatsApp Trigger (dndnode_0)
Workflow untitled-workflow-qanca1 registered successfully with 2 nodes and 1 edges
✅ Workflow untitled-workflow-qanca1 registered for auto-execution
WorkflowExecutor active workflows count: 1
🔄 Auto-updating WhatsApp webhook for workflow: untitled-workflow-qanca1
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
🎯 Workflow ID: untitled-workflow-qanca1
📊 Controller active workflows: 1
🚀 Executor active workflows: 1
🔗 Trigger URLs generated: 1
   1. whatsappTrigger: https://workflow-lg9z.onrender.com/api/webhooks/whatsapp/untitled-workflow-qanca1
⏰ Activated at: 2025-08-26T19:32:25.703Z
============================================================
💾 Stored active workflow untitled-workflow-qanca1 to database
✅ ACTIVATION SUCCESS - Sending response: {
  success: true,
  workflowId: 'untitled-workflow-qanca1',
  triggerUrlCount: 1,
  responseSize: 309,
  timestamp: '2025-08-26T19:32:25.704Z'
}
[2025-08-26T19:32:25.704Z] INFO: Request completed {"method":"POST","url":"/untitled-workflow-qanca1/activate","status":200,"duration":"17ms"}
[2025-08-26T19:33:45.833Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/whatsapp","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/whatsapp',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '481',
  authorization: 'missing',
  timestamp: '2025-08-26T19:33:45.833Z'
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
                "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNTcyRUE1QTk4NTc5Mjc4RjZCAA==",
                "timestamp": "1756236823",
                "text": {
                  "body": "Fog"
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
🔍 Checking 1 active workflows for WhatsApp triggers
   📋 Workflow untitled-workflow-qanca1: 2 nodes
   ✅ Found WhatsApp trigger in workflow untitled-workflow-qanca1
🔄 Processing WhatsApp webhook for workflow untitled-workflow-qanca1...
📱 Extracted WhatsApp message data: {
  messageId: 'wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNTcyRUE1QTk4NTc5Mjc4RjZCAA==',
  from: '9647700716669',
  phoneNumber: '9647700716669',
  fromName: 'Muhammad Tarq',
  text: 'Fog',
  messageType: 'text',
  timestamp: '2025-08-26T19:33:43.000Z',
  contact: { profile: { name: 'Muhammad Tarq' }, wa_id: '9647700716669' },
  rawMessage: {
    from: '9647700716669',
    id: 'wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNTcyRUE1QTk4NTc5Mjc4RjZCAA==',
    timestamp: '1756236823',
    text: { body: 'Fog' },
    type: 'text'
  },
  rawWebhook: { object: 'whatsapp_business_account', entry: [ [Object] ] }
}
🚀 Triggering workflow untitled-workflow-qanca1 with WhatsApp data
=== EXECUTING WORKFLOW untitled-workflow-qanca1 ===
Trigger data: {
  "trigger": "whatsapp",
  "data": {
    "messageId": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNTcyRUE1QTk4NTc5Mjc4RjZCAA==",
    "from": "9647700716669",
    "phoneNumber": "9647700716669",
    "fromName": "Muhammad Tarq",
    "text": "Fog",
    "messageType": "text",
    "timestamp": "2025-08-26T19:33:43.000Z",
    "contact": {
      "profile": {
        "name": "Muhammad Tarq"
      },
      "wa_id": "9647700716669"
    },
    "rawMessage": {
      "from": "9647700716669",
      "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNTcyRUE1QTk4NTc5Mjc4RjZCAA==",
      "timestamp": "1756236823",
      "text": {
        "body": "Fog"
      },
      "type": "text"
    },
    "rawWebhook": {
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
                    "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNTcyRUE1QTk4NTc5Mjc4RjZCAA==",
                    "timestamp": "1756236823",
                    "text": {
                      "body": "Fog"
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
  },
  "whatsappWebhook": {
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
                  "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNTcyRUE1QTk4NTc5Mjc4RjZCAA==",
                  "timestamp": "1756236823",
                  "text": {
                    "body": "Fog"
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
  },
  "timestamp": "2025-08-26T19:33:45.837Z"
}
Building execution order from workflow: {
  totalNodes: 2,
  totalEdges: 1,
  nodes: [ 'whatsappTrigger (dndnode_0)', 'whatsappSendMessage (dndnode_1)' ],
  edges: [ 'dndnode_0 → dndnode_1' ]
}
Workflow execution failed: No trigger node found in workflow
🔥 WORKFLOW ERROR LOG: {
  "timestamp": "2025-08-26T19:33:45.838Z",
  "workflowId": "untitled-workflow-qanca1",
  "errorType": "Error",
  "errorMessage": "No trigger node found in workflow",
  "executionId": "exec_1756236825837_2uuxfhuqn",
  "executionTime": 0,
  "stackTrace": "Error: No trigger node found in workflow\n    at WorkflowExecutor.buildExecutionOrder (/opt/render/project/src/backend/services/workflowExecutor.js:312:19)\n    at WorkflowExecutor.executeWorkflow (/opt/render/project/src/backend/services/workflowExecutor.js:107:41)\n    at processWhatsAppWebhookForWorkflow (/opt/render/project/src/backend/routes/webhooks.js:1663:30)\n    at processWhatsAppWebhook (/opt/render/project/src/backend/routes/webhooks.js:1620:15)\n    at /opt/render/project/src/backend/routes/webhooks.js:1574:11\n    at /opt/render/project/src/backend/middleware/errorHandler.js:55:21\n    at Layer.handle [as handle_request] (/opt/render/project/src/backend/node_modules/express/lib/router/layer.js:95:5)\n    at next (/opt/render/project/src/backend/node_modules/express/lib/router/route.js:149:13)\n    at Route.dispatch (/opt/render/project/src/backend/node_modules/express/lib/router/route.js:119:3)\n    at Layer.handle [as handle_request] (/opt/render/project/src/backend/node_modules/express/lib/router/layer.js:95:5)"
}
[2025-08-26T19:33:45.838Z] INFO: Request completed {"method":"POST","url":"/whatsapp","status":200,"duration":"5ms"}
❌ Error processing WhatsApp webhook for workflow untitled-workflow-qanca1: Error: No trigger node found in workflow
    at WorkflowExecutor.buildExecutionOrder (/opt/render/project/src/backend/services/workflowExecutor.js:312:19)
    at WorkflowExecutor.executeWorkflow (/opt/render/project/src/backend/services/workflowExecutor.js:107:41)
    at processWhatsAppWebhookForWorkflow (/opt/render/project/src/backend/routes/webhooks.js:1663:30)
    at processWhatsAppWebhook (/opt/render/project/src/backend/routes/webhooks.js:1620:15)
    at /opt/render/project/src/backend/routes/webhooks.js:1574:11
    at /opt/render/project/src/backend/middleware/errorHandler.js:55:21
    at Layer.handle [as handle_request] (/opt/render/project/src/backend/node_modules/express/lib/router/layer.js:95:5)
    at next (/opt/render/project/src/backend/node_modules/express/lib/router/route.js:149:13)
    at Route.dispatch (/opt/render/project/src/backend/node_modules/express/lib/router/route.js:119:3)
    at Layer.handle [as handle_request] (/opt/render/project/src/backend/node_modules/express/lib/router/layer.js:95:5)