🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/webhooks/whatsapp/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'present',
  timestamp: '2025-08-28T07:52:27.210Z'
}
[2025-08-28T07:52:27.210Z] WARN: 404 - Route not found: GET /api/webhooks/whatsapp/messages
[2025-08-28T07:52:27.210Z] INFO: Request completed {"method":"GET","url":"/","status":404,"duration":"1ms"}
[2025-08-28T07:53:12.452Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/whatsapp","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/whatsapp',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '480',
  authorization: 'missing',
  timestamp: '2025-08-28T07:53:12.452Z'
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
                "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBQzM4NjYxNTVERjMyQkJDREIxAA==",
                "timestamp": "1756367591",
                "text": {
                  "body": "Ff"
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
🔍 Checking 0 active workflows for WhatsApp triggers
📱 No WhatsApp trigger workflows found
[2025-08-28T07:53:12.454Z] INFO: Request completed {"method":"POST","url":"/whatsapp","status":200,"duration":"1ms"}
[2025-08-28T07:53:12.452Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/whatsapp","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/whatsapp',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '480',
  authorization: 'missing',
  timestamp: '2025-08-28T07:53:12.452Z'
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
                "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBQzM4NjYxNTVERjMyQkJDREIxAA==",
                "timestamp": "1756367591",
                "text": {
                  "body": "Ff"
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
🔍 Checking 0 active workflows for WhatsApp triggers
📱 No WhatsApp trigger workflows found
[2025-08-28T07:53:12.454Z] INFO: Request completed {"method":"POST","url":"/whatsapp","status":200,"duration":"1ms"}