import React, { useState, useRef, useEffect } from 'react';

const DashboardChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "🤖 Hi! I'm a chatbot that needs to be connected to a workflow to respond intelligently.\n\n⚙️ To connect me:",
      timestamp: new Date(),
      options: [
        { text: "🔗 Connect to workflow", action: "connect_workflow" },
        { text: "📚 Learn about workflows", action: "learn_workflows" }
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectedWorkflowId, setConnectedWorkflowId] = useState(null);
  const [sessionId] = useState(() => 'session_' + Math.random().toString(36).substring(2, 15));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const botResponses = {
    connect_workflow: {
      content: "🔗 To connect me to a workflow:\n\n1. **Create a workflow** with a Chat Trigger node\n2. **Copy the webhook URL** from the Chat Trigger\n3. **Paste it below** to connect me\n\n📝 **Format:** `https://workflow-lg9z.onrender.com/api/chat/webhook/your-workflow-id`\n\n💡 **Tip:** The webhook URL appears automatically when you add a Chat Trigger node!",
      options: [
        { text: "🚀 Go create workflow", action: "goto_builder" },
        { text: "❓ How to get webhook URL?", action: "webhook_help" }
      ]
    },
    learn_workflows: {
      content: "📚 **About Workflow Chatbots:**\n\n🤖 **How I Work:**\n• I'm a chatbot that connects to your workflows\n• Without a workflow connection, I can only give basic info\n• Once connected, I become intelligent via your workflow logic\n\n✨ **What You Can Do:**\n• Create workflows with Chat Trigger + AI Agent nodes\n• Connect me to those workflows via webhook URL\n• I'll process messages through your workflow\n• Get smart AI responses, data processing, integrations",
      options: [
        { text: "🔗 Connect me to workflow", action: "connect_workflow" },
        { text: "🚀 Create new workflow", action: "goto_builder" }
      ]
    },
    webhook_help: {
      content: "🔗 **Getting Your Webhook URL:**\n\n**Step by Step:**\n1. Go to Workflow Builder\n2. Drag a **'Chat Trigger'** node to canvas\n3. Double-click the Chat Trigger node\n4. **Copy the webhook URL** (auto-generated)\n5. Come back here and paste it below\n\n**URL Format:**\n`https://workflow-lg9z.onrender.com/api/chat/webhook/your-id`",
      options: [
        { text: "🚀 Go to Workflow Builder", action: "goto_builder" },
        { text: "🔙 Back to connect", action: "connect_workflow" }
      ]
    },
    goto_builder: {
      content: "🚀 **Opening Workflow Builder...**\n\nCreate a workflow with these steps:\n1. **Drag Chat Trigger** node to canvas\n2. **Add AI Agent** or other processing nodes\n3. **Connect the nodes** with lines\n4. **Copy the webhook URL** from Chat Trigger\n5. **Come back and paste it** to connect me!\n\n🎯 **Tip:** Double-click any node to configure it!",
      options: []
    }
  };

  const addBotMessage = (content, options = [], delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      const newMessage = {
        id: Date.now(),
        type: 'bot',
        content,
        timestamp: new Date(),
        options
      };
      setMessages(prev => [...prev, newMessage]);
      setIsTyping(false);
    }, delay);
  };

  const handleOptionClick = (action) => {
    // Add user's choice as a message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: `Selected: ${action.replace(/_/g, ' ')}`,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Handle special actions
    if (action === 'goto_builder') {
      setTimeout(() => {
        window.location.href = '/workflow-builder';
      }, 1500);
      addBotMessage("🚀 Redirecting you to the Workflow Builder...", [], 500);
      return;
    }

    if (action === 'open_chat') {
      addBotMessage("💬 Type your question below and I'll help you!", [], 500);
      return;
    }

    // Get bot response
    const response = botResponses[action];
    if (response) {
      addBotMessage(response.content, response.options);
    }
  };

  // Check if input looks like a webhook URL
  const isWebhookUrl = (text) => {
    return text.includes('workflow-lg9z.onrender.com/api/chat/webhook/') ||
           text.includes('/api/chat/webhook/') ||
           text.match(/[a-z0-9\-]+\/[a-z0-9\-]+/); // matches workflow-id patterns
  };

  // Extract workflow ID from webhook URL
  const extractWorkflowId = (webhookUrl) => {
    // Handle full URLs
    let match = webhookUrl.match(/\/api\/chat\/webhook\/([^\/?&]+)/);
    if (match) return match[1];
    
    // Handle partial URLs (just the workflow ID part)
    match = webhookUrl.match(/workflow-lg9z\.onrender\.com\/api\/chat\/webhook\/([^\/?&]+)/);
    if (match) return match[1];
    
    // Handle just workflow ID
    if (webhookUrl.match(/^[a-z0-9\-]+$/)) {
      return webhookUrl;
    }
    
    return null;
  };

  // Send message to workflow webhook
  const sendToWorkflow = async (message, workflowId) => {
    try {
      // Try production first, fallback to local for testing
      const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://workflow-lg9z.onrender.com';
      const response = await fetch(`${baseUrl}/api/chat/webhook/${workflowId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          sessionId: sessionId,
          userName: 'Dashboard User',
          websiteUrl: window.location.origin
        })
      });

      if (response.ok) {
        // Poll for response
        setTimeout(() => pollForResponse(sessionId), 1000);
      } else {
        addBotMessage("❌ Failed to send message to workflow. Please check the webhook URL.", []);
      }
    } catch (error) {
      addBotMessage("❌ Error connecting to workflow: " + error.message, []);
    }
  };

  // Poll for workflow response
  const pollForResponse = async (sessionId) => {
    try {
      const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://workflow-lg9z.onrender.com';
      const response = await fetch(`${baseUrl}/api/chat/session/${sessionId}/messages`);
      if (response.ok) {
        const data = await response.json();
        if (data.pendingResponses && data.pendingResponses.length > 0) {
          data.pendingResponses.forEach(botResponse => {
            addBotMessage(botResponse.content, [], 500);
          });
        }
      }
    } catch (error) {
      console.error('Error polling for response:', error);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Check if user is trying to connect webhook
    if (isWebhookUrl(inputMessage)) {
      const workflowId = extractWorkflowId(inputMessage);
      if (workflowId) {
        setConnectedWorkflowId(workflowId);
        addBotMessage(
          `✅ **Connected to workflow!**\n\nWorkflow ID: \`${workflowId}\`\n\n🤖 I'm now intelligent! Send me messages and I'll process them through your workflow.\n\n💬 **Try saying something...**`,
          []
        );
      } else {
        addBotMessage(
          "❌ Invalid webhook URL format.\n\n📝 **Expected format:**\n\`https://workflow-lg9z.onrender.com/api/chat/webhook/your-workflow-id\`",
          [{ text: "❓ How to get webhook?", action: "webhook_help" }]
        );
      }
      setInputMessage('');
      return;
    }

    // If connected to workflow, send message through workflow
    if (connectedWorkflowId) {
      sendToWorkflow(inputMessage, connectedWorkflowId);
      setInputMessage('');
      return;
    }

    // If not connected, show limited responses
    let response = "🤖 I can't respond intelligently yet because I'm not connected to a workflow.";
    let options = [
      { text: "🔗 Connect to workflow", action: "connect_workflow" },
      { text: "🚀 Create new workflow", action: "goto_builder" }
    ];

    if (inputMessage.toLowerCase().includes('help')) {
      response = "❓ I need to be connected to a workflow to help you properly.\n\nPaste your webhook URL below to connect me!";
    }

    addBotMessage(response, options);
    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)'
        }}
      >
        <div style={{ 
          color: 'white', 
          fontSize: '24px',
          transition: 'transform 0.3s ease'
        }}>
          {isOpen ? '✕' : '🤖'}
        </div>
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '380px',
          height: '600px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '16px 16px 0 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Workflow Assistant</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  {connectedWorkflowId 
                    ? `🟢 Connected to: ${connectedWorkflowId.substring(0, 20)}...`
                    : '🔴 Not connected to workflow'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            background: '#f8f9fa'
          }}>
            {messages.map((message) => (
              <div key={message.id} style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: message.type === 'user' 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'white',
                    color: message.type === 'user' ? 'white' : '#333',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    boxShadow: message.type === 'user' 
                      ? '0 2px 8px rgba(102, 126, 234, 0.3)' 
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    whiteSpace: 'pre-line'
                  }}>
                    {message.content}
                  </div>
                </div>

                {/* Action Buttons */}
                {message.options && message.options.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {message.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOptionClick(option.action)}
                        style={{
                          background: 'white',
                          border: '2px solid #e5e7eb',
                          borderRadius: '20px',
                          padding: '8px 16px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'left',
                          color: '#667eea',
                          fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.borderColor = '#667eea';
                          e.target.style.background = '#f0f7ff';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.background = 'white';
                        }}
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3].map(dot => (
                      <div
                        key={dot}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: '#667eea',
                          animation: `bounce 1.4s infinite both ${dot * 0.16}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            background: 'white'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={connectedWorkflowId 
                  ? "Send a message through workflow..." 
                  : "Paste webhook URL or ask basic questions..."}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '20px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                style={{
                  width: '44px',
                  height: '44px',
                  background: inputMessage.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#e5e7eb',
                  border: 'none',
                  borderRadius: '50%',
                  color: 'white',
                  fontSize: '16px',
                  cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </>
  );
};

export default DashboardChatbot;