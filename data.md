{
  "nodes": [
    {
      "parameters": {
        "public": true,
        "mode": "webhook",
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.chatTrigger",
      "typeVersion": 1.3,
      "position": [
        0,
        0
      ],
      "id": "cc908e49-74df-43e3-9ebb-c23ec9586570",
      "name": "When chat message received",
      "webhookId": "7e07e69e-d1d0-448a-ae89-29f36c3526f8"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2.2,
      "position": [
        208,
        0
      ],
      "id": "0e99ad30-7650-4aba-ae65-b447f1c68c6b",
      "name": "AI Agent"
    },
    {
      "parameters": {
        "model": {
          "__rl": true,
          "mode": "list",
          "value": "gpt-4.1-mini"
        },
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi",
      "typeVersion": 1.2,
      "position": [
        96,
        320
      ],
      "id": "066d33b1-d8a2-4b16-90d4-87f4b4893140",
      "name": "OpenAI Chat Model",
      "credentials": {
        "openAiApi": {
          "id": "l8IhMLvtnZTM4p11",
          "name": "OpenAi account"
        }
      }
    }
  ],
  "connections": {
    "When chat message received": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "OpenAI Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "bdc4f79e7e630b00cf87113281a249d9aacb6335b6df19424763a47103e43ab2"
  }
}