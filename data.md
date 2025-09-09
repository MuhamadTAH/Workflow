[2025-09-09T11:32:54.502Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/messenger/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'OPTIONS',
  url: '/api/messenger/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:32:54.502Z'
}
[2025-09-09T11:32:54.503Z] INFO: Request completed {"method":"OPTIONS","url":"/api/messenger/activate","status":200,"duration":"1ms"}
[2025-09-09T11:32:54.763Z] INFO: Incoming request {"method":"POST","url":"/api/messenger/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'POST',
  url: '/api/messenger/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '359',
  authorization: 'present',
  timestamp: '2025-09-09T11:32:54.763Z'
}
📦 ACTIVATION REQUEST BODY PREVIEW: {
  hasBody: false,
  bodyKeys: [],
  workflowPresent: false,
  nodeCount: 0,
  edgeCount: 0
}
[2025-09-09T11:32:54.785Z] INFO: 🚀 Activating Messenger webhook {"userId":1,"appId":"775154548408358","pageId":"704281729441285"}
[2025-09-09T11:32:54.818Z] INFO: ✅ Messenger bot configuration saved and waiting for webhook call
[2025-09-09T11:32:54.820Z] INFO: Request completed {"method":"POST","url":"/messenger/activate","status":200,"duration":"56ms"}
[2025-09-09T11:32:58.093Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:32:58.093Z'
}
[2025-09-09T11:32:58.094Z] INFO: 💬 Messenger messages requested {"userId":1,"count":0}
[2025-09-09T11:32:58.094Z] INFO: Request completed {"method":"GET","url":"/messenger/messages","status":304,"duration":"1ms"}
[2025-09-09T11:32:58.363Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/users","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/users',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:32:58.363Z'
}
[2025-09-09T11:32:58.364Z] INFO: 👥 Messenger users requested {"userId":1,"count":0}
[2025-09-09T11:32:58.365Z] INFO: Request completed {"method":"GET","url":"/messenger/users","status":304,"duration":"2ms"}
[2025-09-09T11:32:58.542Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:32:58.542Z'
}
[2025-09-09T11:32:58.544Z] INFO: 📊 Messenger webhook status requested {"userId":1,"hasBotConfig":true}
[2025-09-09T11:32:58.545Z] INFO: Request completed {"method":"GET","url":"/messenger/status","status":200,"duration":"3ms"}
[2025-09-09T11:33:01.086Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:01.086Z'
}
[2025-09-09T11:33:01.087Z] INFO: 💬 Messenger messages requested {"userId":1,"count":0}
[2025-09-09T11:33:01.088Z] INFO: Request completed {"method":"GET","url":"/messenger/messages","status":304,"duration":"1ms"}
[2025-09-09T11:33:01.092Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:01.092Z'
}
[2025-09-09T11:33:01.093Z] INFO: 📊 Messenger webhook status requested {"userId":1,"hasBotConfig":true}
[2025-09-09T11:33:01.093Z] INFO: Request completed {"method":"GET","url":"/messenger/status","status":304,"duration":"1ms"}
[2025-09-09T11:33:01.370Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/users","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/users',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:01.370Z'
}
[2025-09-09T11:33:01.371Z] INFO: 👥 Messenger users requested {"userId":1,"count":0}
[2025-09-09T11:33:01.371Z] INFO: Request completed {"method":"GET","url":"/messenger/users","status":304,"duration":"1ms"}
[2025-09-09T11:33:04.096Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:04.097Z'
}
[2025-09-09T11:33:04.098Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:04.098Z'
}
[2025-09-09T11:33:04.098Z] INFO: 💬 Messenger messages requested {"userId":1,"count":0}
[2025-09-09T11:33:04.099Z] INFO: Request completed {"method":"GET","url":"/messenger/messages","status":304,"duration":"3ms"}
[2025-09-09T11:33:04.099Z] INFO: 📊 Messenger webhook status requested {"userId":1,"hasBotConfig":true}
[2025-09-09T11:33:04.100Z] INFO: Request completed {"method":"GET","url":"/messenger/status","status":304,"duration":"3ms"}
[2025-09-09T11:33:04.362Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/users","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/users',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:04.362Z'
}
[2025-09-09T11:33:04.363Z] INFO: 👥 Messenger users requested {"userId":1,"count":0}
[2025-09-09T11:33:04.364Z] INFO: Request completed {"method":"GET","url":"/messenger/users","status":304,"duration":"2ms"}
[2025-09-09T11:33:07.088Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:07.088Z'
}
[2025-09-09T11:33:07.089Z] INFO: 📊 Messenger webhook status requested {"userId":1,"hasBotConfig":true}
[2025-09-09T11:33:07.090Z] INFO: Request completed {"method":"GET","url":"/messenger/status","status":304,"duration":"1ms"}
[2025-09-09T11:33:07.093Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:07.093Z'
}
[2025-09-09T11:33:07.093Z] INFO: 💬 Messenger messages requested {"userId":1,"count":0}
[2025-09-09T11:33:07.094Z] INFO: Request completed {"method":"GET","url":"/messenger/messages","status":304,"duration":"1ms"}
[2025-09-09T11:33:07.353Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/users","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/users',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:07.354Z'
}
[2025-09-09T11:33:07.355Z] INFO: 👥 Messenger users requested {"userId":1,"count":0}
[2025-09-09T11:33:07.355Z] INFO: Request completed {"method":"GET","url":"/messenger/users","status":304,"duration":"2ms"}
[2025-09-09T11:33:10.085Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:10.085Z'
}
[2025-09-09T11:33:10.086Z] INFO: 📊 Messenger webhook status requested {"userId":1,"hasBotConfig":true}
[2025-09-09T11:33:10.087Z] INFO: Request completed {"method":"GET","url":"/messenger/status","status":304,"duration":"2ms"}
[2025-09-09T11:33:10.094Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:10.094Z'
}
[2025-09-09T11:33:10.095Z] INFO: 💬 Messenger messages requested {"userId":1,"count":0}
[2025-09-09T11:33:10.096Z] INFO: Request completed {"method":"GET","url":"/messenger/messages","status":304,"duration":"2ms"}
[2025-09-09T11:33:10.353Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/users","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/users',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:10.353Z'
}
[2025-09-09T11:33:10.354Z] INFO: 👥 Messenger users requested {"userId":1,"count":0}
[2025-09-09T11:33:10.355Z] INFO: Request completed {"method":"GET","url":"/messenger/users","status":304,"duration":"2ms"}
[2025-09-09T11:33:13.080Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:13.081Z'
}
[2025-09-09T11:33:13.082Z] INFO: 📊 Messenger webhook status requested {"userId":1,"hasBotConfig":true}
[2025-09-09T11:33:13.082Z] INFO: Request completed {"method":"GET","url":"/messenger/status","status":304,"duration":"2ms"}
[2025-09-09T11:33:13.089Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:13.089Z'
}
[2025-09-09T11:33:13.090Z] INFO: 💬 Messenger messages requested {"userId":1,"count":0}
[2025-09-09T11:33:13.090Z] INFO: Request completed {"method":"GET","url":"/messenger/messages","status":304,"duration":"1ms"}
[2025-09-09T11:33:13.346Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/users","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/users',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:13.346Z'
}
[2025-09-09T11:33:13.347Z] INFO: 👥 Messenger users requested {"userId":1,"count":0}
[2025-09-09T11:33:13.347Z] INFO: Request completed {"method":"GET","url":"/messenger/users","status":304,"duration":"1ms"}
[2025-09-09T11:33:13.626Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/messenger/comments","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/messenger/comments',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '312',
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:13.626Z'
}
[2025-09-09T11:33:13.627Z] INFO: 🔥 MESSENGER WEBHOOK RECEIVED! {"method":"POST","query":{},"hasBody":true,"timestamp":"2025-09-09T11:33:13.627Z"}
[2025-09-09T11:33:13.628Z] INFO: 📨 POST webhook data received: {"hasEntry":true,"entryCount":1,"fullBody":"{\n  \"object\": \"page\",\n  \"entry\": [\n    {\n      \"time\": 1757417593369,\n      \"id\": \"704281729441285\",\n      \"messaging\": [\n        {\n          \"sender\": {\n            \"id\": \"23940669822267407\"\n          },\n          \"recipient\": {\n            \"id\": \"704281729441285\"\n          },\n          \"timestamp\": 1757417592746,\n          \"message\": {\n            \"mid\": \"m_wJv1BB6FL0KtuHUtCmkbVAaquogg2Qkpw7FJNykc3e77wGJIVZYhQ4lSpXzvaWTfvuGMFsOP7mOPqLekqVic2w\",\n            \"text\": \"hello\"\n          }\n        }\n      ]\n    }\n  ]\n}"}
[2025-09-09T11:33:13.628Z] INFO: 📝 Processing entry: {"id":"704281729441285","hasMessaging":true,"messagingCount":1}
[2025-09-09T11:33:13.628Z] INFO: 💬 Processing messaging event: {"sender":"23940669822267407","recipient":"704281729441285","hasMessage":true,"messageText":"hello","hasRead":false,"hasDelivery":false}
[2025-09-09T11:33:13.628Z] ERROR: 💥 Error processing messaging event: {"error":"messengerUsers is not defined","senderId":"23940669822267407","messageText":"hello"}
[2025-09-09T11:33:13.629Z] INFO: Request completed {"method":"POST","url":"/webhooks/messenger/comments","status":200,"duration":"3ms"}
[2025-09-09T11:33:16.086Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:16.086Z'
}
[2025-09-09T11:33:16.087Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:16.087Z'
}
[2025-09-09T11:33:16.088Z] INFO: 💬 Messenger messages requested {"userId":1,"count":0}
[2025-09-09T11:33:16.089Z] INFO: Request completed {"method":"GET","url":"/messenger/messages","status":304,"duration":"3ms"}
[2025-09-09T11:33:16.091Z] INFO: 📊 Messenger webhook status requested {"userId":1,"hasBotConfig":true}
[2025-09-09T11:33:16.091Z] INFO: Request completed {"method":"GET","url":"/messenger/status","status":304,"duration":"4ms"}
[2025-09-09T11:33:16.334Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/users","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/users',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:16.334Z'
}
[2025-09-09T11:33:16.335Z] INFO: 👥 Messenger users requested {"userId":1,"count":0}
[2025-09-09T11:33:16.336Z] INFO: Request completed {"method":"GET","url":"/messenger/users","status":304,"duration":"2ms"}
[2025-09-09T11:33:19.085Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:19.085Z'
}
[2025-09-09T11:33:19.086Z] INFO: 💬 Messenger messages requested {"userId":1,"count":0}
[2025-09-09T11:33:19.086Z] INFO: Request completed {"method":"GET","url":"/messenger/messages","status":304,"duration":"1ms"}
[2025-09-09T11:33:19.091Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:19.091Z'
}
[2025-09-09T11:33:19.093Z] INFO: 📊 Messenger webhook status requested {"userId":1,"hasBotConfig":true}
[2025-09-09T11:33:19.094Z] INFO: Request completed {"method":"GET","url":"/messenger/status","status":304,"duration":"3ms"}
[2025-09-09T11:33:19.341Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/users","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/users',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:19.342Z'
}
[2025-09-09T11:33:19.343Z] INFO: 👥 Messenger users requested {"userId":1,"count":0}
[2025-09-09T11:33:19.344Z] INFO: Request completed {"method":"GET","url":"/messenger/users","status":304,"duration":"3ms"}
[2025-09-09T11:33:22.085Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:22.085Z'
}
[2025-09-09T11:33:22.086Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/messages","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/messages',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:22.086Z'
}
[2025-09-09T11:33:22.092Z] INFO: 💬 Messenger messages requested {"userId":1,"count":0}
[2025-09-09T11:33:22.093Z] INFO: Request completed {"method":"GET","url":"/messenger/messages","status":304,"duration":"7ms"}
[2025-09-09T11:33:22.094Z] INFO: 📊 Messenger webhook status requested {"userId":1,"hasBotConfig":true}
[2025-09-09T11:33:22.094Z] INFO: Request completed {"method":"GET","url":"/messenger/status","status":304,"duration":"9ms"}
[2025-09-09T11:33:22.356Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/users","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/messenger/users',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-09-09T11:33:22.356Z'
}
[2025-09-09T11:33:22.358Z] INFO: 👥 Messenger users requested {"userId":1,"count":0}
[2025-09-09T11:33:22.358Z] INFO: Request completed {"method":"GET","url":"/messenger/users","status":304,"duration":"2ms"}
[2025-09-09T11:33:25.060Z] INFO: Incoming request {"method":"GET","url":"/api/messenger/status","ip"