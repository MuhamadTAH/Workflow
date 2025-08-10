this is backend data when i active the workflow[2025-08-10T17:50:05.405Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/chatTrigger/test-workflow/dndnode_0/chat","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/chatTrigger/test-workflow/dndnode_0/chat',
  origin: 'https://workflow-lg9z.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-10T17:50:05.405Z'
}
❌ CORS blocked origin: https://workflow-lg9z.onrender.com
[webhook] Chat Trigger incoming request {
  workflowId: 'test-workflow',
  nodeId: 'dndnode_0',
  path: 'chat',
  ip: '::1',
  bodyKeys: [ 'text', 'userId', 'sessionId', 'source', 'metadata' ]
}
[2025-08-10T17:50:05.407Z] INFO: Chat Trigger processing webhook data {"method":"POST","hasBody":true,"bodyType":"object","headerCount":27}
[2025-08-10T17:50:05.407Z] INFO: Chat Trigger processed data successfully {"hasText":true,"userId":"hosted-chat-user","method":"POST"}
[webhook] Processed data: {
  "json": {
    "text": "hello",
    "userId": "hosted-chat-user",
    "sessionId": "chat-session-1754848070332-ouck6t46h",
    "source": "hosted_chat_fallback",
    "metadata": {
      "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=test-workflow&nodeId=dndnode_0&path=chat&title=Chat%20Support",
      "timestamp": "2025-08-10T17:50:04.356Z",
      "workflowId": "test-workflow",
      "nodeId": "dndnode_0"
    }
  },
  "headers": {
    "host": "workflow-lg9z.onrender.com",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
    "content-length": "370",
    "accept": "*/*",
    "accept-encoding": "gzip, br",
    "accept-language": "en-US,en;q=0.9",
    "cdn-loop": "cloudflare; loops=1",
    "cf-connecting-ip": "62.201.244.196",
    "cf-ipcountry": "IQ",
    "cf-ray": "96d15561fc97f75e-PDX",
    "cf-visitor": "{\"scheme\":\"https\"}",
    "content-type": "application/json",
    "origin": "https://workflow-lg9z.onrender.com",
    "priority": "u=1, i",
    "referer": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=test-workflow&nodeId=dndnode_0&path=chat&title=Chat%20Support",
    "render-proxy-ttl": "4",
    "rndr-id": "1d596e04-5a6d-4d2d",
    "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Microsoft Edge\";v=\"138\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "true-client-ip": "62.201.244.196",
    "x-forwarded-for": "62.201.244.196, 172.68.174.104, 10.214.1.12",
    "x-forwarded-proto": "https",
    "x-request-start": "1754848205404152"
  },
  "query": {},
  "method": "POST",
  "text": "hello",
  "userId": "hosted-chat-user",
  "sessionId": "chat-session-1754848070332-ouck6t46h",
  "timestamp": "2025-08-10T17:50:05.407Z",
  "nodeType": "chatTrigger",
  "webhookPath": "chat"
}
[webhook] Message stored for key: test-workflow-dndnode_0
[webhook] 🚀 Triggering workflow execution for: test-workflow
[webhook] Found immediate response: hello
[2025-08-10T17:50:05.408Z] INFO: Request completed {"method":"POST","url":"/chatTrigger/test-workflow/dndnode_0/chat","status":200,"duration":"3ms"}
[webhook] ⚠️ Workflow not found or not active: test-workflow
[2025-08-10T17:50:07.718Z] INFO: Incoming request {"method":"GET","url":"/api/chat-messages/chat-session-1754848070332-ouck6t46h","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/chat-messages/chat-session-1754848070332-ouck6t46h',
  origin: undefined,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-10T17:50:07.718Z'
}
[2025-08-10T17:50:07.719Z] INFO: Request completed {"method":"GET","url":"/api/chat-messages/chat-session-1754848070332-ouck6t46h","status":200,"duration":"1ms"}
[2025-08-10T17:50:09.718Z] INFO: Incoming request {"method":"GET","url":"/api/chat-messages/chat-session-1754848070332-ouck6t46h","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/chat-messages/chat-session-1754848070332-ouck6t46h',
  origin: undefined,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-10T17:50:09.719Z'
}
[2025-08-10T17:50:09.720Z] INFO: Request completed {"method":"GET","url":"/api/chat-messages/chat-session-1754848070332-ouck6t46h","status":304,"duration":"2ms"}
[2025-08-10T17:50:11.727Z] INFO: Incoming request {"method":"GET","url":"/api/chat-messages/chat-session-1754848070332-ouck6t46h","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/chat-messages/chat-session-1754848070332-ouck6t46h',
  origin: undefined,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-10T17:50:11.727Z'
}
[2025-08-10T17:50:11.728Z] INFO: Request completed {"method":"GET","url":"/api/chat-messages/chat-session-1754848070332-ouck6t46h","status":304,"duration":"1ms"}

and when i did it manually it response with this ❌ Chat session ended - workflow deactivated and the console said this hosted-chat.html?workflowId=test-workflow&nodeId=dndnode_0&path=chat&title=Chat%20Support:121   GET https://workflow-lg9z.onrender.com/api/chat-messages/chat-session-1754848323381-6iupb062j 502 (Bad Gateway)
pollReplies @ hosted-chat.html?workflowId=test-workflow&nodeId=dndnode_0&path=chat&title=Chat%20Support:121
(anonymous) @ hosted-chat.html?workflowId=test-workflow&nodeId=dndnode_0&path=chat&title=Chat%20Support:186
setInterval
startPolling @ hosted-chat.html?workflowId=test-workflow&nodeId=dndnode_0&path=chat&title=Chat%20Support:184
window.sendMessage @ hosted-chat.html?workflowId=test-workflow&nodeId=dndnode_0&path=chat&title=Chat%20Support:327
await in window.sendMessage
onkeypress @ hosted-chat.html?workflowId=test-workflow&nodeId=dndnode_0&path=chat&title=Chat%20Support:1
hosted-chat.html?workflowId=test-workflow&nodeId=dndnode_0&path=chat&title=Chat%20Support:143  Error polling replies: Error: HTTP 502: Unknown error
    at pollReplies (hosted-chat.html?workflowId=test-workflow&nodeId=dndnode_0&path=chat&title=Chat%20Support:133:27)