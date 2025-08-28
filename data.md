[2025-08-28T02:39:40.410Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/telegram-livechat/2","ip":"::1"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/telegram-livechat/2',
  origin: undefined,
  userAgent: undefined,
  contentType: 'application/json',
  contentLength: '385',
  authorization: 'missing',
  timestamp: '2025-08-28T02:39:40.410Z'
}
📞 LIVE CHAT: Message received for user: 2
📦 Update data: {
  "update_id": 292397100,
  "message": {
    "message_id": 459,
    "from": {
      "id": 5483214193,
      "is_bot": false,
      "first_name": "Muhammad",
      "last_name": "Tarq",
      "username": "Muh0mmad",
      "language_code": "en"
    },
    "chat": {
      "id": 5483214193,
      "first_name": "Muhammad",
      "last_name": "Tarq",
      "username": "Muh0mmad",
      "type": "private"
    },
    "date": 1756348780,
    "text": "1234567890-",
    "entities": [
      {
        "offset": 0,
        "length": 10,
        "type": "phone_number"
      }
    ]
  }
}
🔍 Webhook called at: 2025-08-28T02:39:40.411Z
💾 Attempting to create/update conversation for user: 2 chat: 5483214193
✅ Conversation created/updated successfully. LastID: 2 Changes: 1
🔍 Looking up conversation ID for user: 2 chat: 5483214193
📋 Conversation lookup result: { id: 1 }
💬 Saving message to conversation: 1
✅ Message saved successfully. LastID: 2
✅ LIVE CHAT: Message stored successfully
[2025-08-28T02:39:40.422Z] INFO: Request completed {"method":"POST","url":"/telegram-livechat/2","status":200,"duration":"12ms"}