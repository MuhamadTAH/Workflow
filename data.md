{
  "nodes": [
    {
      "parameters": {
        "multipleMethods": true,
        "path": "1d90b74f-b031-4a5b-87bb-638f315fd38d",
        "responseMode": "responseNode",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [
        -288,
        80
      ],
      "id": "332af39d-a389-4010-ab06-9b5e97203f9a",
      "name": "Webhook",
      "webhookId": "1d90b74f-b031-4a5b-87bb-638f315fd38d"
    },
    {
      "parameters": {
        "conditions": {
          "options": {
            "caseSensitive": true,
            "leftValue": "",
            "typeValidation": "strict",
            "version": 2
          },
          "conditions": [
            {
              "id": "618ffe40-bc32-4f9c-b57e-e531853e7e84",
              "leftValue": "={{ $json.query['hub.mode'] }}",
              "rightValue": "subscribe",
              "operator": {
                "type": "string",
                "operation": "equals",
                "name": "filter.operator.equals"
              }
            },
            {
              "id": "db0ccf66-11ab-409b-bf91-0dce38329d43",
              "leftValue": "={{ $json.query['hub.verify_token'] }}",
              "rightValue": "muhammad",
              "operator": {
                "type": "string",
                "operation": "equals",
                "name": "filter.operator.equals"
              }
            }
          ],
          "combinator": "and"
        },
        "options": {}
      },
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [
        192,
        -112
      ],
      "id": "09bbdc88-0f77-4c99-a91b-40b92c754c34",
      "name": "If"
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "={{ $json.query['hub.challenge'] }}",
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.4,
      "position": [
        416,
        -96
      ],
      "id": "12a3436b-15de-4e68-9e1a-5c2b6b21c86d",
      "name": "Respond to Webhook"
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "If",
            "type": "main",
            "index": 0
          }
        ],
        []
      ]
    },
    "If": {
      "main": [
        [
          {
            "node": "Respond to Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "instanceId": "cdb134ca0095a1d4a0b035b6bbf4c6d5e84da0c199849d169362c7d01d059361"
  }
}

[2025-08-31T14:29:32.992Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:32.993Z'
}
[2025-08-31T14:29:32.994Z] INFO: Instagram webhook status requested
[2025-08-31T14:29:32.994Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/status","status":304,"duration":"2ms"}
[2025-08-31T14:29:38.399Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/instagram-comments/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'OPTIONS',
  url: '/api/instagram-comments/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:38.400Z'
}
[2025-08-31T14:29:38.401Z] INFO: Request completed {"method":"OPTIONS","url":"/api/instagram-comments/activate","status":200,"duration":"2ms"}
[2025-08-31T14:29:38.670Z] INFO: Incoming request {"method":"POST","url":"/api/instagram-comments/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🚨 WORKFLOW ACTIVATION: {
  method: 'POST',
  url: '/api/instagram-comments/activate',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: 'application/json',
  contentLength: '0',
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:38.671Z'
}
📦 ACTIVATION REQUEST BODY PREVIEW: {
  hasBody: false,
  bodyKeys: [],
  workflowPresent: false,
  nodeCount: 0,
  edgeCount: 0
}
[2025-08-31T14:29:38.687Z] INFO: 🚀 Starting to wait for Instagram webhook call
[2025-08-31T14:29:38.687Z] INFO: ✅ Now waiting for webhook call from Meta
[2025-08-31T14:29:38.688Z] INFO: Request completed {"method":"POST","url":"/instagram-comments/activate","status":200,"duration":"18ms"}
[2025-08-31T14:29:41.963Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:41.964Z'
}
[2025-08-31T14:29:41.964Z] INFO: Instagram webhook status requested
[2025-08-31T14:29:41.965Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/status","status":200,"duration":"2ms"}
[2025-08-31T14:29:42.442Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/comments","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/comments',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:42.442Z'
}
[2025-08-31T14:29:42.443Z] INFO: Instagram messages requested {"messageCount":0,"isWaiting":true}
[2025-08-31T14:29:42.444Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/comments","status":200,"duration":"2ms"}
[2025-08-31T14:29:44.955Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/comments","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/comments',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:44.955Z'
}
[2025-08-31T14:29:44.956Z] INFO: Instagram messages requested {"messageCount":0,"isWaiting":true}
[2025-08-31T14:29:44.956Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/comments","status":304,"duration":"1ms"}
[2025-08-31T14:29:44.971Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:44.972Z'
}
[2025-08-31T14:29:44.972Z] INFO: Instagram webhook status requested
[2025-08-31T14:29:44.972Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/status","status":304,"duration":"1ms"}
[2025-08-31T14:29:47.933Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:47.934Z'
}
[2025-08-31T14:29:47.934Z] INFO: Instagram webhook status requested
[2025-08-31T14:29:47.935Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/status","status":304,"duration":"2ms"}
[2025-08-31T14:29:47.959Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/comments","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/comments',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:47.959Z'
}
[2025-08-31T14:29:47.959Z] INFO: Instagram messages requested {"messageCount":0,"isWaiting":true}
[2025-08-31T14:29:47.960Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/comments","status":304,"duration":"1ms"}
[2025-08-31T14:29:48.105Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/instagram/comments","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/instagram/comments',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '395',
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:48.105Z'
}
[2025-08-31T14:29:48.106Z] INFO: 🔥 INSTAGRAM WEBHOOK RECEIVED! {"method":"POST","query":{},"hasBody":true,"timestamp":"2025-08-31T14:29:48.106Z"}
[2025-08-31T14:29:48.106Z] INFO: 💬 INSTAGRAM MESSAGE DATA! {"hasEntry":true,"entryCount":1,"fullBody":"{\n  \"object\": \"instagram\",\n  \"entry\": [\n    {\n      \"time\": 1756650587761,\n      \"id\": \"17841445204646276\",\n      \"messaging\": [\n        {\n          \"sender\": {\n            \"id\": \"751391291169578\"\n          },\n          \"recipient\": {\n            \"id\": \"17841445204646276\"\n          },\n          \"timestamp\": 1756650587321,\n          \"message\": {\n            \"mid\": \"aWdfZAG1faXRlbToxOklHTWVzc2FnZAUlEOjE3ODQxNDQ1MjA0NjQ2Mjc2OjM0MDI4MjM2Njg0MTcxMDMwMTI0NDI1OTkyNDE4MDE3NjkwMDgzOTozMjQwNDQ4MzgxMTI1OTYzOTcwODUxNjIwOTg2MzQyNjA0OAZDZD\",\n            \"text\": \"Hello\"\n          }\n        }\n      ]\n    }\n  ]\n}"}
[2025-08-31T14:29:48.107Z] INFO: 📝 Processing entry: {"id":"17841445204646276","hasMessaging":true,"messagingCount":1}
[2025-08-31T14:29:48.107Z] INFO: 💬 Processing messaging event: {"sender":"751391291169578","recipient":"17841445204646276","hasMessage":true,"messageText":"Hello"}
[2025-08-31T14:29:48.107Z] INFO: ✅ Instagram DM stored successfully! {"messageId":"aWdfZAG1faXRlbToxOklHTWVzc2FnZAUlEOjE3ODQxNDQ1MjA0NjQ2Mjc2OjM0MDI4MjM2Njg0MTcxMDMwMTI0NDI1OTkyNDE4MDE3NjkwMDgzOTozMjQwNDQ4MzgxMTI1OTYzOTcwODUxNjIwOTg2MzQyNjA0OAZDZD","senderId":"751391291169578","text":"Hello...","totalMessages":1}
[2025-08-31T14:29:48.108Z] INFO: Request completed {"method":"POST","url":"/webhooks/instagram/comments","status":200,"duration":"3ms"}
[2025-08-31T14:29:50.973Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:50.973Z'
}
[2025-08-31T14:29:50.973Z] INFO: Instagram webhook status requested
[2025-08-31T14:29:50.974Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/status","status":304,"duration":"2ms"}
[2025-08-31T14:29:50.975Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/comments","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/comments',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:50.975Z'
}
[2025-08-31T14:29:50.975Z] INFO: Instagram messages requested {"messageCount":1,"isWaiting":true}
[2025-08-31T14:29:50.976Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/comments","status":200,"duration":"1ms"}
[2025-08-31T14:29:53.938Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/comments","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/comments',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:53.938Z'
}
[2025-08-31T14:29:53.938Z] INFO: Instagram messages requested {"messageCount":1,"isWaiting":true}
[2025-08-31T14:29:53.939Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/comments","status":304,"duration":"1ms"}
[2025-08-31T14:29:53.958Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:53.958Z'
}
[2025-08-31T14:29:53.958Z] INFO: Instagram webhook status requested
[2025-08-31T14:29:53.959Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/status","status":304,"duration":"1ms"}
[2025-08-31T14:29:56.955Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/comments","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/comments',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:56.955Z'
}
[2025-08-31T14:29:56.955Z] INFO: Instagram messages requested {"messageCount":1,"isWaiting":true}
[2025-08-31T14:29:56.955Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/comments","status":304,"duration":"1ms"}
[2025-08-31T14:29:56.982Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:56.982Z'
}
[2025-08-31T14:29:56.982Z] INFO: Instagram webhook status requested
[2025-08-31T14:29:56.983Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/status","status":304,"duration":"1ms"}
[2025-08-31T14:29:59.958Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/comments","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/comments',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:59.958Z'
}
[2025-08-31T14:29:59.958Z] INFO: Instagram messages requested {"messageCount":1,"isWaiting":true}
[2025-08-31T14:29:59.959Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/comments","status":304,"duration":"1ms"}
[2025-08-31T14:29:59.970Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:29:59.970Z'
}
[2025-08-31T14:29:59.970Z] INFO: Instagram webhook status requested
[2025-08-31T14:29:59.971Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/status","status":304,"duration":"1ms"}
[2025-08-31T14:30:02.947Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/comments","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/comments',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:30:02.947Z'
}
[2025-08-31T14:30:02.947Z] INFO: Instagram messages requested {"messageCount":1,"isWaiting":true}
[2025-08-31T14:30:02.948Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/comments","status":304,"duration":"1ms"}
[2025-08-31T14:30:02.963Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:30:02.964Z'
}
[2025-08-31T14:30:02.964Z] INFO: Instagram webhook status requested
[2025-08-31T14:30:02.964Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/status","status":304,"duration":"1ms"}
[2025-08-31T14:30:05.975Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/comments","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/comments',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:30:05.975Z'
}
[2025-08-31T14:30:05.975Z] INFO: Instagram messages requested {"messageCount":1,"isWaiting":true}
[2025-08-31T14:30:05.976Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/comments","status":304,"duration":"1ms"}
[2025-08-31T14:30:05.979Z] INFO: Incoming request {"method":"GET","url":"/api/instagram-comments/status","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/instagram-comments/status',
  origin: 'https://fixdai.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  contentType: undefined,
  contentLength: undefined,
  authorization: 'missing',
  timestamp: '2025-08-31T14:30:05.979Z'
}
[2025-08-31T14:30:05.980Z] INFO: Instagram webhook status requested
[2025-08-31T14:30:05.980Z] INFO: Request completed {"method":"GET","url":"/instagram-comments/status","status":304,"duration":"1ms"}