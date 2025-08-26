[2025-08-26T20:34:09.342Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/untitled-workflow-zk1ulg/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'OPTIONS',
  url: '/api/workflows/untitled-workflow-zk1ulg/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-26T20:34:09.342Z'
}
[2025-08-26T20:34:09.343Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/untitled-workflow-zk1ulg/activate","status":200,"duration":"1ms"}
[2025-08-26T20:34:09.611Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/untitled-workflow-zk1ulg/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'POST',
  url: '/api/workflows/untitled-workflow-zk1ulg/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '816',
  authorization: 'present',
  timestamp: '2025-08-26T20:34:09.611Z'
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
  originalUrl: '/api/workflows/untitled-workflow-zk1ulg/activate',
  params: {},
  query: {},
  bodySize: 816,
  timestamp: '2025-08-26T20:34:09.627Z'
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
  url: '/untitled-workflow-zk1ulg/activate',
  params: { id: 'untitled-workflow-zk1ulg' },
  bodyKeys: [ 'workflow' ],
  origin: 'https://fixdai.com',
  timestamp: '2025-08-26T20:34:09.628Z'
}
🔍 Activation data validation: {
  workflowId: 'untitled-workflow-zk1ulg',
  hasWorkflow: true,
  hasNodes: true,
  hasEdges: true,
  nodeCount: 2,
  edgeCount: 1,
  dryRun: false
}
============================================================
🚀 WORKFLOW ACTIVATION STARTED
🔄 Activating workflow: untitled-workflow-zk1ulg
📋 Found 1 trigger node(s): [ 'whatsappTrigger' ]
📊 Current active workflows count: 0
============================================================
Registering workflow untitled-workflow-zk1ulg for automatic execution
Workflow config received: {
  nodes: 2,
  edges: 1,
  nodeTypes: [ 'whatsappTrigger (dndnode_0)', 'whatsappSendMessage (dndnode_1)' ],
  edgeConnections: [ 'dndnode_0 → dndnode_1' ]
}
Found trigger node: WhatsApp Trigger (dndnode_0)
Workflow untitled-workflow-zk1ulg registered successfully with 2 nodes and 1 edges
✅ Workflow untitled-workflow-zk1ulg registered for auto-execution
WorkflowExecutor active workflows count: 1
🔄 Auto-updating WhatsApp webhook for workflow: untitled-workflow-zk1ulg
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
🎯 Workflow ID: untitled-workflow-zk1ulg
📊 Controller active workflows: 1
🚀 Executor active workflows: 1
🔗 Trigger URLs generated: 1
   1. whatsappTrigger: https://workflow-lg9z.onrender.com/api/webhooks/whatsapp/untitled-workflow-zk1ulg
⏰ Activated at: 2025-08-26T20:34:09.629Z
============================================================
💾 Stored active workflow untitled-workflow-zk1ulg to database
✅ ACTIVATION SUCCESS - Sending response: {
  success: true,
  workflowId: 'untitled-workflow-zk1ulg',
  triggerUrlCount: 1,
  responseSize: 309,
  timestamp: '2025-08-26T20:34:09.630Z'
}
[2025-08-26T20:34:09.630Z] INFO: Request completed {"method":"POST","url":"/untitled-workflow-zk1ulg/activate","status":200,"duration":"19ms"}
[2025-08-26T20:34:56.274Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/whatsapp","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/whatsapp',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '484',
  authorization: 'missing',
  timestamp: '2025-08-26T20:34:56.274Z'
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
                "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                "timestamp": "1756240495",
                "text": {
                  "body": "Do she"
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
   📋 Workflow untitled-workflow-zk1ulg: 2 nodes
   ✅ Found WhatsApp trigger in workflow untitled-workflow-zk1ulg
🔄 Processing WhatsApp webhook for workflow untitled-workflow-zk1ulg...
📱 Extracted WhatsApp message data: {
  messageId: 'wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==',
  from: '9647700716669',
  phoneNumber: '9647700716669',
  fromName: 'Muhammad Tarq',
  text: 'Do she',
  messageType: 'text',
  timestamp: '2025-08-26T20:34:55.000Z',
  contact: { profile: { name: 'Muhammad Tarq' }, wa_id: '9647700716669' },
  rawMessage: {
    from: '9647700716669',
    id: 'wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==',
    timestamp: '1756240495',
    text: { body: 'Do she' },
    type: 'text'
  },
  rawWebhook: { object: 'whatsapp_business_account', entry: [ [Object] ] }
}
🚀 Triggering workflow untitled-workflow-zk1ulg with WhatsApp data
=== EXECUTING WORKFLOW untitled-workflow-zk1ulg ===
Trigger data: {
  "trigger": "whatsapp",
  "data": {
    "messageId": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
    "from": "9647700716669",
    "phoneNumber": "9647700716669",
    "fromName": "Muhammad Tarq",
    "text": "Do she",
    "messageType": "text",
    "timestamp": "2025-08-26T20:34:55.000Z",
    "contact": {
      "profile": {
        "name": "Muhammad Tarq"
      },
      "wa_id": "9647700716669"
    },
    "rawMessage": {
      "from": "9647700716669",
      "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
      "timestamp": "1756240495",
      "text": {
        "body": "Do she"
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
                    "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                    "timestamp": "1756240495",
                    "text": {
                      "body": "Do she"
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
                  "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                  "timestamp": "1756240495",
                  "text": {
                    "body": "Do she"
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
  "timestamp": "2025-08-26T20:34:56.277Z"
}
Building execution order from workflow: {
  totalNodes: 2,
  totalEdges: 1,
  nodes: [ 'whatsappTrigger (dndnode_0)', 'whatsappSendMessage (dndnode_1)' ],
  edges: [ 'dndnode_0 → dndnode_1' ]
}
Starting execution order with trigger: dndnode_0
Processing node: dndnode_0
Adding node to execution order: whatsappTrigger (dndnode_0)
Found 1 outgoing edges from dndnode_0: [ 'dndnode_0 → dndnode_1' ]
Following edge: dndnode_0 → dndnode_1
Processing node: dndnode_1
Adding node to execution order: whatsappSendMessage (dndnode_1)
Found 0 outgoing edges from dndnode_1: []
Final execution order: 2 nodes
Step 1: whatsappTrigger (dndnode_0)
Step 2: whatsappSendMessage (dndnode_1)
Execution order: [ 'WhatsApp Trigger (dndnode_0)', 'Send WhatsApp Message (dndnode_1)' ]
--- Step 1: Executing WhatsApp Trigger ---
✅ Added trigger step: step_1_WhatsApp_Trigger with aliases: trigger, triggerData, whatsappTrigger
Step 1 completed: ⏭️
--- Step 2: Executing Send WhatsApp Message ---
Step-based input data for node: {
  "step_1_WhatsApp_Trigger": {
    "trigger": "whatsapp",
    "data": {
      "messageId": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
      "from": "9647700716669",
      "phoneNumber": "9647700716669",
      "fromName": "Muhammad Tarq",
      "text": "Do she",
      "messageType": "text",
      "timestamp": "2025-08-26T20:34:55.000Z",
      "contact": {
        "profile": {
          "name": "Muhammad Tarq"
        },
        "wa_id": "9647700716669"
      },
      "rawMessage": {
        "from": "9647700716669",
        "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
        "timestamp": "1756240495",
        "text": {
          "body": "Do she"
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
                      "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                      "timestamp": "1756240495",
                      "text": {
                        "body": "Do she"
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
                    "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                    "timestamp": "1756240495",
                    "text": {
                      "body": "Do she"
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
    "timestamp": "2025-08-26T20:34:56.277Z"
  },
  "trigger": "whatsapp",
  "triggerData": {
    "trigger": "whatsapp",
    "data": {
      "messageId": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
      "from": "9647700716669",
      "phoneNumber": "9647700716669",
      "fromName": "Muhammad Tarq",
      "text": "Do she",
      "messageType": "text",
      "timestamp": "2025-08-26T20:34:55.000Z",
      "contact": {
        "profile": {
          "name": "Muhammad Tarq"
        },
        "wa_id": "9647700716669"
      },
      "rawMessage": {
        "from": "9647700716669",
        "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
        "timestamp": "1756240495",
        "text": {
          "body": "Do she"
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
                      "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                      "timestamp": "1756240495",
                      "text": {
                        "body": "Do she"
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
                    "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                    "timestamp": "1756240495",
                    "text": {
                      "body": "Do she"
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
    "timestamp": "2025-08-26T20:34:56.277Z"
  },
  "whatsapp": {
    "trigger": "whatsapp",
    "data": {
      "messageId": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
      "from": "9647700716669",
      "phoneNumber": "9647700716669",
      "fromName": "Muhammad Tarq",
      "text": "Do she",
      "messageType": "text",
      "timestamp": "2025-08-26T20:34:55.000Z",
      "contact": {
        "profile": {
          "name": "Muhammad Tarq"
        },
        "wa_id": "9647700716669"
      },
      "rawMessage": {
        "from": "9647700716669",
        "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
        "timestamp": "1756240495",
        "text": {
          "body": "Do she"
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
                      "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                      "timestamp": "1756240495",
                      "text": {
                        "body": "Do she"
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
                    "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                    "timestamp": "1756240495",
                    "text": {
                      "body": "Do she"
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
    "timestamp": "2025-08-26T20:34:56.277Z"
  },
  "message": {
    "trigger": "whatsapp",
    "data": {
      "messageId": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
      "from": "9647700716669",
      "phoneNumber": "9647700716669",
      "fromName": "Muhammad Tarq",
      "text": "Do she",
      "messageType": "text",
      "timestamp": "2025-08-26T20:34:55.000Z",
      "contact": {
        "profile": {
          "name": "Muhammad Tarq"
        },
        "wa_id": "9647700716669"
      },
      "rawMessage": {
        "from": "9647700716669",
        "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
        "timestamp": "1756240495",
        "text": {
          "body": "Do she"
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
                      "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                      "timestamp": "1756240495",
                      "text": {
                        "body": "Do she"
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
                    "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                    "timestamp": "1756240495",
                    "text": {
                      "body": "Do she"
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
    "timestamp": "2025-08-26T20:34:56.277Z"
  },
  "data": {
    "messageId": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
    "from": "9647700716669",
    "phoneNumber": "9647700716669",
    "fromName": "Muhammad Tarq",
    "text": "Do she",
    "messageType": "text",
    "timestamp": "2025-08-26T20:34:55.000Z",
    "contact": {
      "profile": {
        "name": "Muhammad Tarq"
      },
      "wa_id": "9647700716669"
    },
    "rawMessage": {
      "from": "9647700716669",
      "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
      "timestamp": "1756240495",
      "text": {
        "body": "Do she"
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
                    "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                    "timestamp": "1756240495",
                    "text": {
                      "body": "Do she"
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
❌ Node execution failed: whatsappSendMessage (dndnode_1)
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
                  "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
                  "timestamp": "1756240495",
                  "text": {
                    "body": "Do she"
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
  "timestamp": "2025-08-26T20:34:56.277Z"
}
🔧 Executing node: whatsappSendMessage (dndnode_1) [Attempt 1/4]
📋 Raw ConfigPanel data: {
  "label": "Send WhatsApp Message",
  "icon": "fa-whatsapp",
  "color": "text-green-500",
  "description": "Send WhatsApp messages via WhatsApp Business API",
  "type": "whatsappSendMessage"
}
🔍 Resolving templates for whatsappSendMessage node...
🔍 Enhanced template resolution context:
  - Available step keys: [ 'step_1_WhatsApp_Trigger' ]
  - Total context keys: 11
  - Sample context: {
  "step_1_WhatsApp_Trigger": {
    "trigger": "whatsapp",
    "data": {
      "messageId": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzEwOUU0NTQwOTc3MTk1NjQzAA==",
      "from": "9647700716669",
      "phoneNumber": "9647700716669",
      "fromName": "Muhammad Tarq",
      "text": "Do she",
      "messageType": "text",
      "timestamp": "2025-08-26T20:34:55.000Z",
      "contact": {
        "profile": {
          "name": "Muhammad Tarq"
        },
        "wa_id": "9647700716669"
      },
      ...
✨ Resolved ConfigPanel data: {
  "label": "Send WhatsApp Message",
  "icon": "fa-whatsapp",
  "color": "text-green-500",
  "description": "Send WhatsApp messages via WhatsApp Business API",
  "type": "whatsappSendMessage"
}
[2025-08-26T20:34:56.280Z] INFO: Request completed {"method":"POST","url":"/whatsapp","status":200,"duration":"6ms"}
❌ Error details: Unsupported node type: whatsappSendMessage
❌ Stack trace: Error: Unsupported node type: whatsappSendMessage
    at WorkflowExecutor.executeNodeByType (/opt/render/project/src/backend/services/workflowExecutor.js:463:23)
    at WorkflowExecutor.executeNode (/opt/render/project/src/backend/services/workflowExecutor.js:394:31)
    at WorkflowExecutor.executeWorkflow (/opt/render/project/src/backend/services/workflowExecutor.js:179:49)
    at processWhatsAppWebhookForWorkflow (/opt/render/project/src/backend/routes/webhooks.js:1663:30)
    at processWhatsAppWebhook (/opt/render/project/src/backend/routes/webhooks.js:1620:15)
    at /opt/render/project/src/backend/routes/webhooks.js:1574:11
    at /opt/render/project/src/backend/middleware/errorHandler.js:55:21
    at Layer.handle [as handle_request] (/opt/render/project/src/backend/node_modules/express/lib/router/layer.js:95:5)
    at next (/opt/render/project/src/backend/node_modules/express/lib/router/route.js:149:13)
    at Route.dispatch (/opt/render/project/src/backend/node_modules/express/lib/router/route.js:119:3)
💥 Node execution failed permanently after 1 attempts
📊 STRUCTURED ERROR LOG: {
  "timestamp": "2025-08-26T20:34:56.281Z",
  "nodeType": "whatsappSendMessage",
  "nodeLabel": "Send WhatsApp Message",
  "errorType": "Error",
  "errorMessage": "Unsupported node type: whatsappSendMessage",
  "attemptCount": 1,
  "isRetryable": false,
  "stackTrace": "Error: Unsupported node type: whatsappSendMessage\n    at WorkflowExecutor.executeNodeByType (/opt/render/project/src/backend/services/workflowExecutor.js:463:23)\n    at WorkflowExecutor.executeNode (/opt/render/project/src/backend/services/workflowExecutor.js:394:31)\n    at WorkflowExecutor.executeWorkflow (/opt/render/project/src/backend/services/workflowExecutor.js:179:49)\n    at processWhatsAppWebhookForWorkflow (/opt/render/project/src/backend/routes/webhooks.js:1663:30)\n    at processWhatsAppWebhook (/opt/render/project/src/backend/routes/webhooks.js:1620:15)\n    at /opt/render/project/src/backend/routes/webhooks.js:1574:11\n    at /opt/render/project/src/backend/middleware/errorHandler.js:55:21\n    at Layer.handle [as handle_request] (/opt/render/project/src/backend/node_modules/express/lib/router/layer.js:95:5)\n    at next (/opt/render/project/src/backend/node_modules/express/lib/router/route.js:149:13)\n    at Route.dispatch (/opt/render/project/src/backend/node_modules/express/lib/router/route.js:119:3)"
}
🚨 Node execution failed in workflow: {
  message: 'Unsupported node type: whatsappSendMessage',
  type: 'Error',
  code: 'EXECUTION_ERROR',
  retryCount: 1,
  isRetryable: false,
  timestamp: '2025-08-26T20:34:56.281Z',
  nodeId: 'dndnode_1',
  nodeType: 'whatsappSendMessage',
  nodeLabel: 'Send WhatsApp Message'
}
⚠️ Continuing workflow execution despite node error
✅ Added node step: step_2_Send_WhatsApp_Message with type alias: whatsappSendMessage
Step 2 completed: ✅
=== WORKFLOW untitled-workflow-zk1ulg COMPLETED ===
Total steps: 2
Duration: 4ms