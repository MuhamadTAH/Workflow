[2025-08-30T05:13:10.676Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/whatsapp","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/whatsapp',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '481',
  authorization: 'missing',
  timestamp: '2025-08-30T05:13:10.676Z'
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
                "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBRTQ0QjY0MDNGNTM3RTlEMTlFAA==",
                "timestamp": "1756530789",
                "text": {
                  "body": "Hey"
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
  text: 'Hey',
  type: 'text'
}
✅ Message stored with ID: 1
💾 WhatsApp message storage result: {
  stored: true,
  id: 1,
  messageData: {
    phoneNumber: '9647700716669',
    contactName: 'Muhammad Tarq',
    messageText: 'Hey',
    messageId: 'wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBRTQ0QjY0MDNGNTM3RTlEMTlFAA==',
    messageType: 'text',
    timestamp: '2025-08-30T05:13:09.000Z',
    rawData: '{"object":"whatsapp_business_account","entry":[{"id":"1411124906823702","changes":[{"value":{"messaging_product":"whatsapp","metadata":{"display_phone_number":"15556646119","phone_number_id":"628007790405551"},"contacts":[{"profile":{"name":"Muhammad Tarq"},"wa_id":"9647700716669"}],"messages":[{"from":"9647700716669","id":"wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBRTQ0QjY0MDNGNTM3RTlEMTlFAA==","timestamp":"1756530789","text":{"body":"Hey"},"type":"text"}]},"field":"messages"}]}]}'
  }
}
🤖 Processing WhatsApp message for Claude AI auto-response...
📱 WhatsApp AI Processing: { from: '9647700716669', name: 'Muhammad Tarq', text: 'Hey' }
🧠 Using Advanced AI Processing for WhatsApp message
🔍 Using Claude config from user: default_user
✅ Found Claude API key for WhatsApp AI responses
🔄 Processing WhatsApp message with Claude AI...
📞 Making direct Claude API call for WhatsApp...
✅ Claude API response generated: Hi there! 👋 How can I help you today?
✅ Claude AI generated response for WhatsApp: Hi there! 👋 How can I help you today?
📤 Sending AI response via WhatsApp...
🔍 Checking for active WhatsApp workflows...
❌ WhatsApp AI processing error: ReferenceError: axios is not defined
📊 Found 0 active WhatsApp workflows
    at /opt/render/project/src/backend/routes/webhooks.js:1373:32
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[2025-08-30T05:13:11.507Z] INFO: Request completed {"method":"POST","url":"/whatsapp","status":200,"duration":"831ms"}