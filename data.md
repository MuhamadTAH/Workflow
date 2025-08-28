[2025-08-28T02:55:29.360Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/whatsapp","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/whatsapp',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '481',
  authorization: 'missing',
  timestamp: '2025-08-28T02:55:29.361Z'
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
                "id": "wamid.HBgNOTY0NzcwMDcxNjY2ORUCABIYFDNBQkJBMDQxNEY2MjI0OUQ4RUVEAA==",
                "timestamp": "1756349727",
                "text": {
                  "body": "jDh"
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
[2025-08-28T02:55:29.363Z] INFO: Request completed {"method":"POST","url":"/whatsapp","status":200,"duration":"3ms"}