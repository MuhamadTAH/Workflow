[2025-08-28T15:18:24.720Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/telegram-listener/setup","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/telegram-listener/setup',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-28T15:18:24.720Z'
}
[2025-08-28T15:18:24.721Z] INFO: Request completed {"method":"OPTIONS","url":"/api/telegram-listener/setup","status":200,"duration":"1ms"}
[2025-08-28T15:18:24.989Z] INFO: Incoming request {"method":"POST","url":"/api/telegram-listener/setup","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/telegram-listener/setup',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '61',
  authorization: 'present',
  timestamp: '2025-08-28T15:18:24.989Z'
}
🔧 Setting up webhook for bot: 7778920669...
📡 Setting webhook URL: https://workflow-lg9z.onrender.com/api/telegram-listener/webhook/listener_1756394305016_lleq8l06
✅ Webhook setup successful for listener: listener_1756394305016_lleq8l06
[2025-08-28T15:18:25.573Z] INFO: Telegram listener webhook setup successful {"listenerId":"listener_1756394305016_lleq8l06","webhookUrl":"https://workflow-lg9z.onrender.com/api/telegram-listener/webhook/listener_1756394305016_lleq8l06","botTokenPrefix":"7778920669..."}
[2025-08-28T15:18:25.574Z] INFO: Request completed {"method":"POST","url":"/setup","status":200,"duration":"585ms"}
[2025-08-28T15:18:48.909Z] INFO: Incoming request {"method":"POST","url":"/api/telegram-listener/webhook/listener_1756394305016_lleq8l06","ip":"::1"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/telegram-listener/webhook/listener_1756394305016_lleq8l06',
  origin: undefined,
  userAgent: undefined,
  contentType: 'application/json',
  contentLength: '384',
  authorization: 'missing',
  timestamp: '2025-08-28T15:18:48.909Z'
}
📥 Telegram message received for listener: listener_1756394305016_lleq8l06
📦 Update data: {
  "update_id": 292397117,
  "message": {
    "message_id": 477,
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
    "date": 1756394328,
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
👤 From: Muhammad Tarq
💬 Chat ID: 5483214193
📝 Message: 1234567890
🕐 Date: 2025-08-28T15:18:48.000Z
[2025-08-28T15:18:48.913Z] INFO: 🤖 Telegram listener-listener_1756394305016_lleq8l06: message_received {"updateId":292397117,"messageId":477,"chatId":5483214193,"text":"1234567890","fromUserId":5483214193,"fromUsername":"Muh0mmad","messageCount":1}
✅ Message processed successfully for listener: listener_1756394305016_lleq8l06
[2025-08-28T15:18:48.913Z] INFO: Request completed {"method":"POST","url":"/webhook/listener_1756394305016_lleq8l06","status":200,"duration":"4ms"}