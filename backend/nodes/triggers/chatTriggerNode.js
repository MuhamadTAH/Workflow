/**
 * ChatTriggerNode
 * Place this file at: backend/nodes/triggers/chatTriggerNode.js
 *
 * This file implements a trigger node that:
 *  - generates a webhook URL for workflow activation
 *  - normalizes incoming requests from hosted or embedded chat widgets
 *  - returns a processed payload that your workflow executor can use as $json
 *
 * TODOs / NOTES (put these in README or pass to your AI dev):
 *  - Confirm how your server registers trigger nodes and routes (see route example below).
 *  - Secure the webhook (X-Webhook-Secret or Authorization Bearer) and add verification.
 *  - If you use a proxy, point the client widgets to your proxy endpoint (recommended).
 */

class ChatTriggerNode {
    constructor() {
      this.type = 'chatTrigger';            // must match frontend type
      this.name = 'Chat Trigger';           // display name
      this.description = 'Starts workflow from chat widget or hosted chat webhook';
      this.category = 'trigger';
      this.icon = 'fa-comments';
      this.color = 'text-green-500';
    }
  
    /**
     * generateWebhookUrl
     * Called when UI needs to show/copy the webhook URL for this node.
     *
     * @param {string} workflowId
     * @param {string} nodeId
     * @param {object} config - node config (may contain custom path)
     * @returns {string} - full webhook URL that client/widget should POST to
     */
    generateWebhookUrl(workflowId, nodeId, config = {}) {
      const base = process.env.BASE_URL || 'http://localhost:3000';
      const path = (config.webhookPath && String(config.webhookPath).trim()) || 'chat';
      // Example URL format: /api/webhooks/chatTrigger/:workflowId/:nodeId/:path
      return `${base}/api/webhooks/${this.type}/${workflowId}/${nodeId}/${encodeURIComponent(path)}`;
    }
  
    /**
     * processWebhookData
     * Normalizes the incoming HTTP request payload into the $json shape your workflow expects.
     *
     * @param {object} requestData - { body, headers, query, method, ip }
     * @param {object} config - node config (used for secret verification etc.)
     * @returns {object} processedData - object suitable as the workflow input item
     *
     * Standard output shape (returned as an "item"):
     * {
     *   json: {
     *     text: 'message text',
     *     userId: 'u_123',
     *     sessionId: 's_456',
     *     source: 'embedded_widget' | 'hosted_chat' | 'telegram' | ...,
     *     metadata: { ... },
     *     raw: { ... }  // full original body
     *   },
     *   headers: { ... },
     *   query: { ... },
     *   method: 'POST',
     *   nodeType: 'chatTrigger',
     *   timestamp: 'ISO string'
     * }
     */
    async processWebhookData(requestData = {}, config = {}) {
      const { body = {}, headers = {}, query = {}, method = 'POST', ip } = requestData;
      // Normalize: many chat widgets will send {text, userId, sessionId, source, metadata}
      // Different providers may nest text under message.text or update.message.text (e.g., Telegram). Try common fallbacks.
  
      const text =
        (body && (body.text || body.message || body.message?.text || body.update?.message?.text)) ||
        null;
  
      const userId =
        (body && (body.userId || body.user_id || body.from?.id || body.message?.from?.id)) ||
        (headers && (headers['x-user-id'] || headers['x-userid'])) ||
        null;
  
      const sessionId = (body && (body.sessionId || body.session_id)) || null;
      const source = (body && body.source) || (query && query.source) || 'unknown_chat';
  
      // metadata: keep everything else useful for debugging / routing
      const metadata = {
        page: (body && body.metadata && body.metadata.page) || query.page || null,
        referrer: headers.referer || headers.referrer || null,
        ip,
        originalQuery: query || {},
        // keep the original user-provided metadata if present
        userMetadata: (body && body.metadata) || null,
      };
  
      const processed = {
        json: {
          text,
          userId,
          sessionId,
          source,
          metadata,
          raw: body || {}
        },
        headers,
        query,
        method,
        nodeType: this.type,
        timestamp: new Date().toISOString()
      };
  
      return processed;
    }
  
    /**
     * Optional: simple validation for a secret token header.
     * Call this from your route before running the workflow.
     */
    verifySecret(requestData = {}, config = {}) {
      if (!config || !config.secret) return { ok: true };
  
      const expected = config.secret; // your workflow/node config holds the secret (server-only!)
      const headers = requestData.headers || {};
      const token = headers['x-webhook-secret'] || headers['x-workflow-secret'] || headers['authorization'];
  
      // Support "Bearer <token>" or plain token in header
      const parsed = token ? String(token).replace(/^Bearer\s+/i, '') : null;
      if (!parsed || parsed !== expected) {
        return { ok: false, reason: 'invalid_secret' };
      }
      return { ok: true };
    }
  
    /**
     * execute
     * For trigger node, this may be used by some systems that call node.execute directly.
     * We implement a simple wrapper that returns the processed data.
     *
     * @param {object} inputData - (not used for webhook trigger)
     * @param {object} config - node config
     * @param {object} context - optional context (should contain workflowId and nodeId)
     */
    async execute(inputData = {}, config = {}, context = {}) {
      // Try to get stored messages for manual execution
      const { workflowId, nodeId } = context || {};
      let chatMessages = [];
      
      if (workflowId && nodeId) {
        try {
          // Access the global nodeMessages Map from webhooks
          const nodeMessages = require('../routes/webhooks').nodeMessages || new Map();
          const key = `${workflowId}:${nodeId}`;
          
          if (nodeMessages.has(key)) {
            chatMessages = nodeMessages.get(key) || [];
            console.log(`[ChatTrigger] Retrieved ${chatMessages.length} stored messages for ${key}`);
            
            // Clear the messages after retrieval to prevent re-processing
            nodeMessages.delete(key);
          } else {
            console.log(`[ChatTrigger] No stored messages found for ${key}`);
            
            // For active workflows, provide sample/example data for development
            console.log(`[ChatTrigger] Providing sample message data for development`);
            chatMessages = [{
              text: "Sample message for development",
              userId: "hosted-chat-user", 
              sessionId: "sample-session-id",
              source: "hosted_chat_fallback",
              metadata: {
                page: "Sample page URL",
                timestamp: new Date().toISOString(),
                workflowId: workflowId,
                nodeId: nodeId
              },
              timestamp: new Date().toISOString(),
              note: "This is sample data for configuring Chat Response node"
            }];
          }
        } catch (error) {
          console.error('[ChatTrigger] Error retrieving stored messages:', error);
        }
      }
      
      // Return the stored messages as the trigger output
      const result = {
        success: true,
        nodeType: this.type,
        data: chatMessages.length > 0 ? chatMessages[0] : inputData || {},
        message: chatMessages.length > 0 
          ? `Chat Trigger executed: Retrieved ${chatMessages.length} stored messages`
          : 'Chat Trigger executed: No stored messages found',
        chatMessages: chatMessages,
        allMessages: chatMessages,
        timestamp: new Date().toISOString()
      };
      
      console.log('[ChatTrigger] Execute result:', {
        success: result.success,
        messageCount: chatMessages.length,
        workflowId,
        nodeId
      });
      
      return result;
    }
  }
  
  module.exports = ChatTriggerNode;
  