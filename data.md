[2025-08-28T08:34:59.250Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/ai-assistant/1/test-telegram","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/ai-assistant/1/test-telegram',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-28T08:34:59.251Z'
}
[2025-08-28T08:34:59.251Z] INFO: Request completed {"method":"OPTIONS","url":"/api/ai-assistant/1/test-telegram","status":200,"duration":"1ms"}
[2025-08-28T08:34:59.514Z] INFO: Incoming request {"method":"POST","url":"/api/ai-assistant/1/test-telegram","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/ai-assistant/1/test-telegram',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '67',
  authorization: 'present',
  timestamp: '2025-08-28T08:34:59.514Z'
}
🔍 Testing Telegram connection for assistant: 1
🔍 User ID: test-user-1
🔍 Token provided: Yes
✅ Assistant record ensured
[2025-08-28T08:35:00.117Z] INFO: Request completed {"method":"POST","url":"/1/test-telegram","status":200,"duration":"603ms"}
[2025-08-28T08:35:09.017Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/telegram-livechat/2","ip":"::1"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/telegram-livechat/2',
  origin: undefined,
  userAgent: undefined,
  contentType: 'application/json',
  contentLength: '323',
  authorization: 'missing',
  timestamp: '2025-08-28T08:35:09.017Z'
}
📞 LIVE CHAT: Message received for user: 2
📦 Update data: {
  "update_id": 292397112,
  "message": {
    "message_id": 471,
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
    "date": 1756370108,
    "text": "123456789"
  }
}
🔍 Webhook called at: 2025-08-28T08:35:09.018Z
💾 Attempting to create/update conversation for user: 2 chat: 5483214193
✅ Conversation created/updated successfully. LastID: 2 Changes: 1
🔍 Looking up conversation ID for user: 2 chat: 5483214193
📋 Conversation lookup result: { id: 1 }
💬 Saving message to conversation: 1
✅ Message saved successfully. LastID: 3
✅ LIVE CHAT: Message stored successfully
[2025-08-28T08:35:09.030Z] INFO: Request completed {"method":"POST","url":"/telegram-livechat/2","status":200,"duration":"13ms"}