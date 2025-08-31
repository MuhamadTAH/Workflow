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
        -80,
        96
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
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.instagram.com/v23.0/{{ $json.body.entry[0].messaging[0].recipient.id }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer IGAASK8KNQ8bVBZAE9TYlJLU25WcEtKSzlGaDNNZAjFOY2xhYnV4UFRoNzBTNXVzX2pyaU5RRWgwYlhlZAnZASQnpjUW1HejNaRjVpaUxnNlBsSWQ1c01RRERsMW0xRVZAzT3IwZAng2MjlMM25xV2NVNWRnelNNM0ltYk1sM0NnWmdtZAwZDZD"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"recipient\": {\n    \"id\": \"{{ $json.body.entry[0].messaging[0].sender.id }}\"\n  },\n  \"message\": {\n    \"text\": \"Hello! Thanks for reaching out.\"\n  }\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        464,
        240
      ],
      "id": "7ef06bee-558d-4156-b394-3362c4e076b3",
      "name": "HTTP Request"
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
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
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