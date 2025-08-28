[2025-08-28T10:14:53.217Z] INFO: Incoming request {"method":"POST","url":"/api/ai-assistant/1/test-telegram","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/ai-assistant/1/test-telegram',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '67',
  authorization: 'present',
  timestamp: '2025-08-28T10:14:53.218Z'
}
🔍 Testing Telegram connection for assistant: 1
🔍 User ID: test-user-1
🔍 Token provided: Yes
✅ Assistant record ensured
[2025-08-28T10:14:53.728Z] INFO: Request completed {"method":"POST","url":"/1/test-telegram","status":200,"duration":"511ms"}
[2025-08-28T10:16:41.970Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/ai-assistant/1","ip":"::1"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/ai-assistant/1',
  origin: undefined,
  userAgent: undefined,
  contentType: 'application/json',
  contentLength: '384',
  authorization: 'missing',
  timestamp: '2025-08-28T10:16:41.971Z'
}
🤖 AI Assistant webhook received: 1
📦 Update data: {
  "update_id": 292397116,
  "message": {
    "message_id": 475,
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
    "date": 1756376201,
    "text": "1234567890",
    "entities": [
      {
        "offset": 0,
        "length": 10,
        "type": "phone_number"
      }
    ]
  }
}
🧠 Using Advanced AI Processing for assistant: 1
👤 Customer: Muhammad (5483214193)
💬 Message: 1234567890
[2025-08-28T10:16:41.976Z] INFO: Request completed {"method":"POST","url":"/ai-assistant/1","status":200,"duration":"6ms"}
📝 Skipping AI processing - saving message directly to database
💾 Saving simple message to database...
🔍 DEBUG: Saving with assistantId: 1, chatId: 5483214193, customerName: Muhammad, messageText: 1234567890
📤 Sending acknowledgment to customer...
✅ Message saved to database with ID: 1
✅ DEBUG: Saved conversation - assistant_id: 1, customer_id: 5483214193, message: "1234567890"
📤 Acknowledgment sent: true