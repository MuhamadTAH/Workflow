[2025-08-12T21:23:30.258Z] INFO: Incoming request {"method":"OPTIONS","url":"/api/workflows/untitled-workflow-5q9wr5/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'OPTIONS',
  url: '/api/workflows/untitled-workflow-5q9wr5/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-12T21:23:30.258Z'
}
[2025-08-12T21:23:30.259Z] INFO: Request completed {"method":"OPTIONS","url":"/api/workflows/untitled-workflow-5q9wr5/activate","status":200,"duration":"2ms"}
[2025-08-12T21:23:30.551Z] INFO: Incoming request {"method":"POST","url":"/api/workflows/untitled-workflow-5q9wr5/activate","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/workflows/untitled-workflow-5q9wr5/activate',
  origin: 'https://frontend-dpcg.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-12T21:23:30.551Z'
}
🔄 Activating workflow untitled-workflow-5q9wr5...
Found 1 trigger node(s): [ 'chatTrigger' ]
Current active workflows count: 0
🔗 Registered Chat Trigger: {
  workflowId: 'untitled-workflow-5q9wr5',
  nodeId: 'dndnode_0',
  webhookUrl: 'https://workflow-lg9z.onrender.com/api/webhooks/chatTrigger/untitled-workflow-5q9wr5/dndnode_0/chat'
}
Registering workflow untitled-workflow-5q9wr5 for automatic execution
Workflow config received: {
  nodes: 1,
  edges: 0,
  nodeTypes: [ 'chatTrigger (dndnode_0)' ],
  edgeConnections: []
}
Found trigger node: Chat Trigger (dndnode_0)
Workflow untitled-workflow-5q9wr5 registered successfully with 1 nodes and 0 edges
✅ Workflow untitled-workflow-5q9wr5 registered for auto-execution
WorkflowExecutor active workflows count: 1
📊 Activation complete - Controller active workflows: 1, Executor active workflows: 1
⚠️ Database storage temporarily disabled - workflow active in memory only
[2025-08-12T21:23:30.574Z] INFO: Request completed {"method":"POST","url":"/untitled-workflow-5q9wr5/activate","status":200,"duration":"23ms"}
[2025-08-12T21:24:04.025Z] INFO: Incoming request {"method":"GET","url":"/api/chat-messages/chat-session-1755031772149-cd06ihw2t","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
📨 getMessages called for session: "chat-session-1755031772149-cd06ihw2t"
❌ No session found for: chat-session-1755031772149-cd06ihw2t
📋 Available sessions: 
[2025-08-12T21:24:04.026Z] INFO: Request completed {"method":"GET","url":"/api/chat-messages/chat-session-1755031772149-cd06ihw2t","status":200,"duration":"1ms"}
[2025-08-12T21:24:05.523Z] INFO: Incoming request {"method":"GET","url":"/api/chat-messages/chat-session-1755031772149-cd06ihw2t","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
📨 getMessages called for session: "chat-session-1755031772149-cd06ihw2t"
❌ No session found for: chat-session-1755031772149-cd06ihw2t
📋 Available sessions: 
[2025-08-12T21:24:05.524Z] INFO: Request completed {"method":"GET","url":"/api/chat-messages/chat-session-1755031772149-cd06ihw2t","status":304,"duration":"1ms"}
[2025-08-12T21:24:08.034Z] INFO: Incoming request {"method":"GET","url":"/api/chat-messages/chat-session-1755031772149-cd06ihw2t","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
📨 getMessages called for session: "chat-session-1755031772149-cd06ihw2t"
❌ No session found for: chat-session-1755031772149-cd06ihw2t
📋 Available sessions: 
[2025-08-12T21:24:08.036Z] INFO: Request completed {"method":"GET","url":"/api/chat-messages/chat-session-1755031772149-cd06ihw2t","status":304,"duration":"1ms"}
[2025-08-12T21:24:08.132Z] INFO: Incoming request {"method":"GET","url":"/chat/untitled-workflow-5q9wr5/dndnode_0/chat?title=Chat%20Support","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/chat/untitled-workflow-5q9wr5/dndnode_0/chat?title=Chat%20Support',
  origin: undefined,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-12T21:24:08.132Z'
}
[2025-08-12T21:24:08.135Z] INFO: Request completed {"method":"GET","url":"/chat/untitled-workflow-5q9wr5/dndnode_0/chat?title=Chat%20Support","status":302,"duration":"3ms"}
[2025-08-12T21:24:08.449Z] INFO: Incoming request {"method":"GET","url":"/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support',
  origin: undefined,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-12T21:24:08.449Z'
}
[2025-08-12T21:24:08.454Z] INFO: Request completed {"method":"GET","url":"/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support","status":200,"duration":"5ms"}
[2025-08-12T21:24:08.892Z] INFO: Incoming request {"method":"GET","url":"/api/workflows/untitled-workflow-5q9wr5/trigger-info","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'GET',
  url: '/api/workflows/untitled-workflow-5q9wr5/trigger-info',
  origin: undefined,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-12T21:24:08.892Z'
}
[2025-08-12T21:24:08.893Z] INFO: Request completed {"method":"GET","url":"/untitled-workflow-5q9wr5/trigger-info","status":200,"duration":"1ms"}
[2025-08-12T21:24:12.671Z] INFO: Incoming request {"method":"POST","url":"/api/webhooks/chatTrigger/untitled-workflow-5q9wr5/dndnode_0/chat","ip":"::1","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0"}
🌐 INCOMING REQUEST: {
  method: 'POST',
  url: '/api/webhooks/chatTrigger/untitled-workflow-5q9wr5/dndnode_0/chat',
  origin: 'https://workflow-lg9z.onrender.com',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWeb',
  timestamp: '2025-08-12T21:24:12.671Z'
}
[webhook] Chat Trigger incoming request {
  workflowId: 'untitled-workflow-5q9wr5',
  nodeId: 'dndnode_0',
  path: 'chat',
  ip: '::1',
  bodyKeys: [ 'text', 'userId', 'sessionId', 'source', 'metadata' ]
}
[webhook] Processed data: {
  "json": {
    "text": "hello",
    "userId": "hosted-chat-user",
    "sessionId": "chat-session-1755033851565-kutpfgrr9",
    "source": "hosted_chat_fallback",
    "metadata": {
      "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
      "referrer": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
      "ip": "::1",
      "originalQuery": {},
      "userMetadata": {
        "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
        "timestamp": "2025-08-12T21:24:11.565Z",
        "workflowId": "untitled-workflow-5q9wr5",
        "nodeId": "dndnode_0"
      }
    },
    "raw": {
      "text": "hello",
      "userId": "hosted-chat-user",
      "sessionId": "chat-session-1755033851565-kutpfgrr9",
      "source": "hosted_chat_fallback",
      "metadata": {
        "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
        "timestamp": "2025-08-12T21:24:11.565Z",
        "workflowId": "untitled-workflow-5q9wr5",
        "nodeId": "dndnode_0"
      }
    }
  },
  "headers": {
    "host": "workflow-lg9z.onrender.com",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0",
    "content-length": "392",
    "accept": "*/*",
    "accept-encoding": "gzip, br",
    "accept-language": "en-US,en;q=0.9",
    "cdn-loop": "cloudflare; loops=1",
    "cf-connecting-ip": "62.201.244.196",
    "cf-ipcountry": "IQ",
    "cf-ray": "96e309ca48e9f76e-PDX",
    "cf-visitor": "{\"scheme\":\"https\"}",
    "content-type": "application/json",
    "origin": "https://workflow-lg9z.onrender.com",
    "priority": "u=1, i",
    "referer": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
    "render-proxy-ttl": "4",
    "rndr-id": "36948015-9c63-4ffb",
    "sec-ch-ua": "\"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"138\", \"Microsoft Edge\";v=\"138\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "true-client-ip": "62.201.244.196",
    "x-forwarded-for": "62.201.244.196, 104.23.160.74, 10.214.6.127",
    "x-forwarded-proto": "https",
    "x-request-start": "1755033852665319"
  },
  "query": {},
  "method": "POST",
  "nodeType": "chatTrigger",
  "timestamp": "2025-08-12T21:24:12.673Z"
}
[webhook] Message stored for key: untitled-workflow-5q9wr5-dndnode_0
[webhook] 🚀 Triggering workflow execution for: untitled-workflow-5q9wr5
[webhook] 🔍 Checking workflow status for untitled-workflow-5q9wr5:
[webhook] WorkflowExecutor available: true
[webhook] Active workflows in executor: 1
[webhook] Workflow untitled-workflow-5q9wr5 active: true
[webhook] 📋 All active workflows: [untitled-workflow-5q9wr5]
[webhook] 🔍 Matching workflows: [untitled-workflow-5q9wr5]
[webhook] 🚀 Executing workflow with trigger data: [
  {
    "json": {
      "text": "hello",
      "userId": "hosted-chat-user",
      "sessionId": "chat-session-1755033851565-kutpfgrr9",
      "source": "hosted_chat_fallback",
      "metadata": {
        "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
        "referrer": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
        "ip": "::1",
        "originalQuery": {},
        "userMetadata": {
          "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
          "timestamp": "2025-08-12T21:24:11.565Z",
          "workflowId": "untitled-workflow-5q9wr5",
          "nodeId": "dndnode_0"
        }
      },
      "raw": {
        "text": "hello",
        "userId": "hosted-chat-user",
        "sessionId": "chat-session-1755033851565-kutpfgrr9",
        "source": "hosted_chat_fallback",
        "metadata": {
          "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
          "timestamp": "2025-08-12T21:24:11.565Z",
          "workflowId": "untitled-workflow-5q9wr5",
          "nodeId": "dndnode_0"
        }
      }
    },
    "nodeId": "dndnode_0",
    "nodeType": "chatTrigger"
  }
]
=== EXECUTING WORKFLOW untitled-workflow-5q9wr5 ===
Trigger data: [
  {
    "json": {
      "text": "hello",
      "userId": "hosted-chat-user",
      "sessionId": "chat-session-1755033851565-kutpfgrr9",
      "source": "hosted_chat_fallback",
      "metadata": {
        "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
        "referrer": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
        "ip": "::1",
        "originalQuery": {},
        "userMetadata": {
          "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
          "timestamp": "2025-08-12T21:24:11.565Z",
          "workflowId": "untitled-workflow-5q9wr5",
          "nodeId": "dndnode_0"
        }
      },
      "raw": {
        "text": "hello",
        "userId": "hosted-chat-user",
        "sessionId": "chat-session-1755033851565-kutpfgrr9",
        "source": "hosted_chat_fallback",
        "metadata": {
          "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
          "timestamp": "2025-08-12T21:24:11.565Z",
          "workflowId": "untitled-workflow-5q9wr5",
          "nodeId": "dndnode_0"
        }
      }
    },
    "nodeId": "dndnode_0",
    "nodeType": "chatTrigger"
  }
]
Building execution order from workflow: {
  totalNodes: 1,
  totalEdges: 0,
  nodes: [ 'chatTrigger (dndnode_0)' ],
  edges: []
}
Starting execution order with trigger: dndnode_0
Processing node: dndnode_0
Adding node to execution order: chatTrigger (dndnode_0)
Found 0 outgoing edges from dndnode_0: []
Final execution order: 1 nodes
Step 1: chatTrigger (dndnode_0)
Execution order: [ 'Chat Trigger (dndnode_0)' ]
--- Step 1: Executing Chat Trigger ---
Extracted trigger message data: {
  "text": "hello",
  "userId": "hosted-chat-user",
  "sessionId": "chat-session-1755033851565-kutpfgrr9",
  "source": "hosted_chat_fallback",
  "metadata": {
    "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
    "referrer": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
    "ip": "::1",
    "originalQuery": {},
    "userMetadata": {
      "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
      "timestamp": "2025-08-12T21:24:11.565Z",
      "workflowId": "untitled-workflow-5q9wr5",
      "nodeId": "dndnode_0"
    }
  },
  "raw": {
    "text": "hello",
    "userId": "hosted-chat-user",
    "sessionId": "chat-session-1755033851565-kutpfgrr9",
    "source": "hosted_chat_fallback",
    "metadata": {
      "page": "https://workflow-lg9z.onrender.com/public/hosted-chat.html?workflowId=untitled-workflow-5q9wr5&nodeId=dndnode_0&path=chat&title=Chat%20Support",
      "timestamp": "2025-08-12T21:24:11.565Z",
      "workflowId": "untitled-workflow-5q9wr5",
      "nodeId": "dndnode_0"
    }
  }
}
Added trigger step: step_1_Chat_Trigger
Step 1 completed: ⏭️
=== WORKFLOW untitled-workflow-5q9wr5 COMPLETED ===
Total steps: 1
Duration: 1ms
[webhook] ✅ Workflow executed successfully: completed
📨 getMessages called for session: "chat-session-1755033851565-kutpfgrr9"
❌ No session found for: chat-session-1755033851565-kutpfgrr9
📋 Available sessions: 