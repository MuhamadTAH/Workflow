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

[2025-08-31T14:21:44.607Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/instagram/comments","ip":"::1","userAgent":"facebookexternalua"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/instagram/comments',
  origin: undefined,
  userAgent: 'facebookexternalua',
  contentType: 'application/json',
  contentLength: '402',
  authorization: 'missing',
  timestamp: '2025-08-31T14:21:44.608Z'
}
📷 Instagram webhook received for workflow: comments
📷 Instagram update data: {
  "object": "instagram",
  "entry": [
    {
      "time": 1756650104449,
      "id": "17841445204646276",
      "messaging": [
        {
          "sender": {
            "id": "751391291169578"
          },
          "recipient": {
            "id": "17841445204646276"
          },
          "timestamp": 1756649218759,
          "message": {
            "mid": "aWdfZAG1faXRlbToxOklHTWVzc2FnZAUlEOjE3ODQxNDQ1MjA0NjQ2Mjc2OjM0MDI4MjM2Njg0MTcxMDMwMTI0NDI1OTkyNDE4MDE3NjkwMDgzOTozMjQwNDQ1ODU2NTczMzA4MTQ1NDA0MjUwNzIyNzY5MzA1NgZDZD",
            "text": "Hello’s"
          }
        }
      ]
    }
  ]
}
❌ Instagram webhook: workflow not found: comments
[2025-08-31T14:21:44.610Z] INFO: Request completed {"method":"POST","url":"/instagram/comments","status":404,"duration":"3ms"}