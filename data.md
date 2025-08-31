{
  "nodes": [
    {
      "parameters": {
        "multipleMethods": true,
        "path": "2772efc5-ae9f-4573-8f8b-f2d56a13d740",
        "responseMode": "responseNode",
        "options": {}
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [
        -368,
        -16
      ],
      "id": "984c7abf-f31c-47b2-bd49-59ee8a7c4083",
      "name": "Webhook",
      "webhookId": "2772efc5-ae9f-4573-8f8b-f2d56a13d740"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "={{ $json.body.entry[0].messaging[0].message.text }}",
        "options": {
          "systemMessage": "You are a helpful assistant, you are answer my instagram followerrs when they anthing you should answer them by using only five words"
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2.2,
      "position": [
        -16,
        80
      ],
      "id": "c3520f72-bfdf-4681-9692-72d5dad9cae5",
      "name": "AI Agent"
    },
    {
      "parameters": {
        "model": {
          "__rl": true,
          "mode": "list",
          "value": "claude-sonnet-4-20250514",
          "cachedResultName": "Claude 4 Sonnet"
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "typeVersion": 1.3,
      "position": [
        -160,
        288
      ],
      "id": "67343d37-73d8-4dfc-8a0c-3f5de32cdf03",
      "name": "Anthropic Chat Model",
      "credentials": {
        "anthropicApi": {
          "id": "xE1nPWsmufEEiZrn",
          "name": "Anthropic account"
        }
      }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=https://graph.instagram.com/v23.0/{{ $('Webhook').item.json.body.entry[0].messaging[0].recipient.id }}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "Authorization",
              "value": "Bearer IGAASK8KNQ8bVBZAFBiWE80aG9Jck5rU1BfaGQ0bHh4QVdEWFNhQzhIS3dRY29iV25hMkR1cEt6eTkwS2ZAqLWhidk5xWXN4M0F0elRnamJTU2NGS3NqVFhUT0FGV05nRXFSVGFoTkVmcTV3TzUzZAnJDa1dNT3ZArSG5VczhjQ21kQQZDZD"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"recipient\": {\n    \"id\": \"{{ $('Webhook').item.json.body.entry[0].messaging[0].sender.id }}\"\n  },\n  \"message\": {\n    \"text\": \"{{ $json.output }}\"\n  }\n}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        480,
        80
      ],
      "id": "87360622-b306-4dc5-b6dd-14114c3d4092",
      "name": "HTTP Request"
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
              "id": "5ab9917f-86f4-477d-886d-f87bd3b3bbe5",
              "leftValue": "={{ $json.query[\"hub.mode\"] }}",
              "rightValue": "subscribe",
              "operator": {
                "type": "string",
                "operation": "equals",
                "name": "filter.operator.equals"
              }
            },
            {
              "id": "f895daec-74ae-43cf-8a0f-c18adf6e402f",
              "leftValue": "={{ $json.query[\"hub.verify_token\"] }}",
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
        -16,
        -112
      ],
      "id": "e56f041c-a7af-42d5-a5fc-737b00025293",
      "name": "If"
    },
    {
      "parameters": {
        "respondWith": "text",
        "responseBody": "={{ $json.query[\"hub.challenge\"] }}",
        "options": {}
      },
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.4,
      "position": [
        384,
        -176
      ],
      "id": "51efb05b-403c-4c7a-8cd5-c8a192b5e9e0",
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
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Anthropic Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent",
            "type": "ai_languageModel",
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
    "templateCredsSetupCompleted": true,
    "instanceId": "cdb134ca0095a1d4a0b035b6bbf4c6d5e84da0c199849d169362c7d01d059361"
  }
}