[2025-08-28T15:20:26.576Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/whatsapp-receiver/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'OPTIONS',
  url: '/api/whatsapp-receiver/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-28T15:20:26.577Z'
}
[2025-08-28T15:20:26.577Z] INFO: Request completed {"method":"OPTIONS","url":"/api/whatsapp-receiver/activate","status":200,"duration":"1ms"}
[2025-08-28T15:20:26.839Z] INFO: Incoming request {"method":"POST","url":"/api/whatsapp-receiver/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'POST',
  url: '/api/whatsapp-receiver/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '78',
  authorization: 'present',
  timestamp: '2025-08-28T15:20:26.839Z'
}
📦 ACTIVATION REQUEST BODY PREVIEW: {
  hasBody: false,
  bodyKeys: [],
  workflowPresent: false,
  nodeCount: 0,
  edgeCount: 0
}
🚀 Activating WhatsApp message receiver...
📋 Credentials: { appId: 'present', clientSecret: 'present' }
✅ WhatsApp receiver activated successfully
📡 Webhook URL: http://workflow-lg9z.onrender.com/api/webhooks/whatsapp
[2025-08-28T15:20:26.842Z] INFO: Request completed {"method":"POST","url":"/activate","status":200,"duration":"3ms"}
🧹 Previous messages cleared
[2025-08-28T15:20:29.108Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/whatsapp-receiver/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/whatsapp-receiver/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-28T15:20:29.108Z'
}
[2025-08-28T15:20:29.109Z] INFO: Request completed {"method":"OPTIONS","url":"/api/whatsapp-receiver/messages","status":200,"duration":"1ms"}
[2025-08-28T15:20:29.376Z] INFO: Incoming request {"method":"GET","url":"/api/whatsapp-receiver/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/whatsapp-receiver/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'present',
  timestamp: '2025-08-28T15:20:29.376Z'
}
📱 Fetching WhatsApp receiver messages...
📊 Found 0 messages
[2025-08-28T15:20:29.378Z] INFO: Request completed {"method":"GET","url":"/messages","status":200,"duration":"2ms"}
[2025-08-28T15:20:31.146Z] INFO: Incoming request {"method":"GET","url":"/api/whatsapp-receiver/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/whatsapp-receiver/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'present',
  timestamp: '2025-08-28T15:20:31.146Z'
}
📱 Fetching WhatsApp receiver messages...
📊 Found 0 messages
[2025-08-28T15:20:31.148Z] INFO: Request completed {"method":"GET","url":"/messages","status":304,"duration":"3ms"}
[2025-08-28T15:20:31.337Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/whatsapp","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/whatsapp',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '488',
  authorization: 'missing',
  timestamp: '2025-08-28T15:20:31.337Z'
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
                "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzI3QTI3OTM0QkYzM0JGMTVCAA==",
                "timestamp": "1756394429",
                "text": {
                  "body": "Egged  Hff"
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
📱 WhatsApp query params: {}
💾 Storing WhatsApp message from receiver...
📝 Message data to store: {
  from: '9647700716669',
  name: 'Muhammad Tarq',
  text: 'Egged  Hff',
  type: 'text'
}
✅ Message stored with ID: 1
💾 WhatsApp message storage result: {
  stored: true,
  id: 1,
  messageData: {
    phoneNumber: '9647700716669',
    contactName: 'Muhammad Tarq',
    messageText: 'Egged  Hff',
    messageId: 'wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzI3QTI3OTM0QkYzM0JGMTVCAA==',
    messageType: 'text',
    timestamp: '2025-08-28T15:20:29.000Z',
    rawData: '{"object":"whatsapp_business_account","entry":[{"id":"1411124906823702","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"15556646119","phone_number_id":"628007790405551"},"contacts":[{"profile":{"name":"Muhammad Tarq"},"wa_id":"9647700716669"}],"messages":[{"from":"9647700716669","id":"wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBNzI3QTI3OTM0QkYzM0JGMTVCAA==","timestamp":"1756394429","text":{"body":"Egged  Hff"},"type":"text"}]},"field":"messages"}]}]}'
  }
}
🔍 Checking for active WhatsApp workflows...
📊 Found 0 active WhatsApp workflows
[2025-08-28T15:20:31.351Z] INFO: Request completed {"method":"POST","url":"/whatsapp","status":200,"duration":"14ms"}