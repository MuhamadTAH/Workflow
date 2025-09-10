import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';
import { useTheme } from '../contexts/ThemeContext';

const ChatSupport = () => {
  const { theme, colors } = useTheme();
  
  // Widget Management State
  const [widgets, setWidgets] = useState([]);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  
  // Chat Sessions State
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  // Form state for widget creation
  const [formData, setFormData] = useState({
    name: '',
    primaryColor: '#007bff',
    position: 'bottom-right',
    welcomeMessage: 'Hello! How can we help you today?',
    placeholder: 'Type your message...',
    title: 'Chat with us',
    enabled: true
  });

  // Sidebar states
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('widgets'); // 'widgets', 'dashboard', or 'messages'
  
  // Live Messages State
  const [liveMessages, setLiveMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    loadWidgets();
    loadSessions();
    loadLiveMessages();
  }, []);

  // Auto-select first widget and generate embed code for testing
  useEffect(() => {
    if (widgets.length > 0 && !selectedWidget && activeTab === 'widgets') {
      const firstWidget = widgets[0];
      setSelectedWidget(firstWidget);
      generateEmbedCode(firstWidget);
    }
  }, [widgets, selectedWidget, activeTab]);

  const loadWidgets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/widgets`);
      const data = await response.json();
      
      if (data.success) {
        setWidgets(data.widgets || []);
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/sessions`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadLiveMessages = async () => {
    try {
      setIsLoadingMessages(true);
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/messages/all`);
      const data = await response.json();
      
      if (data.success) {
        setLiveMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading live messages:', error);
      // Create mock data for demo
      setLiveMessages([
        {
          id: '1',
          sessionId: '6de4b2b9-1aad-494d-ad44-c7c56db8d195',
          widgetId: '82b7af23-0cd7-4696-bfd6-3ac0c7051f62',
          message: 'Hello, I need help with my order',
          sender: 'user',
          timestamp: new Date(Date.now() - 300000), // 5 minutes ago
          userInfo: { ip: '192.168.1.1', userAgent: 'Chrome' }
        },
        {
          id: '2',
          sessionId: '6de4b2b9-1aad-494d-ad44-c7c56db8d195',
          widgetId: '82b7af23-0cd7-4696-bfd6-3ac0c7051f62',
          message: 'Can you help me with pricing information?',
          sender: 'user',
          timestamp: new Date(Date.now() - 120000), // 2 minutes ago
          userInfo: { ip: '10.0.0.5', userAgent: 'Safari' }
        },
        {
          id: '3',
          sessionId: 'abc123-def456-789',
          widgetId: '82b7af23-0cd7-4696-bfd6-3ac0c7051f62',
          message: 'Is customer support available?',
          sender: 'user',
          timestamp: new Date(Date.now() - 60000), // 1 minute ago
          userInfo: { ip: '172.16.0.1', userAgent: 'Firefox' }
        }
      ]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const createWidget = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/widget/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        setWidgets(prev => [...prev, data.config]);
        setShowCreateForm(false);
        setFormData({
          name: '',
          primaryColor: '#007bff',
          position: 'bottom-right',
          welcomeMessage: 'Hello! How can we help you today?',
          placeholder: 'Type your message...',
          title: 'Chat with us',
          enabled: true
        });
        
        // Show embed code
        setSelectedWidget(data.config);
        generateEmbedCode(data.config);
      }
    } catch (error) {
      console.error('Error creating widget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateEmbedCode = (widget) => {
    const baseUrl = 'https://fixdai.com';
    
    // Complete HTML page example
    const completeHtmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Website</title>
</head>
<body>
    <h1>Your Website Content</h1>
    <p>Your normal website content goes here...</p>
    
    <!-- Chat Widget - Add this before closing </body> tag -->
    <script src="${baseUrl}/widget.js"></script>
    <script>
    ChatWidget.init({
      widgetId: '${widget.id}',
      apiUrl: '${API_BASE_URL}',
      config: ${JSON.stringify(widget, null, 2)}
    });
    </script>
</body>
</html>`;

    // Simple script code (for existing websites)
    const scriptCode = `<!-- Add this before closing </body> tag -->
<script src="${baseUrl}/widget.js"></script>
<script>
ChatWidget.init({
  widgetId: '${widget.id}',
  apiUrl: '${API_BASE_URL}',
  config: ${JSON.stringify(widget, null, 2)}
});
</script>`;

    // iframe alternative
    const iframeCode = `<!-- Alternative: iframe embed -->
<iframe 
  src="${baseUrl}/chat-widget/${widget.id}" 
  style="position: fixed; ${widget.position.includes('bottom') ? 'bottom' : 'top'}: 20px; ${widget.position.includes('right') ? 'right' : 'left'}: 20px; width: 350px; height: 500px; border: none; z-index: 9999;"
  frameborder="0">
</iframe>`;

    setEmbedCode({ 
      complete: completeHtmlCode,
      script: scriptCode, 
      iframe: iframeCode 
    });
  };

  const deleteWidget = async (widgetId) => {
    if (!confirm('Are you sure you want to delete this widget?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/widget/${widgetId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (data.success) {
        setWidgets(prev => prev.filter(w => w.id !== widgetId));
        if (selectedWidget && selectedWidget.id === widgetId) {
          setSelectedWidget(null);
          setEmbedCode('');
        }
      }
    } catch (error) {
      console.error('Error deleting widget:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const selectSession = async (session) => {
    try {
      setSelectedSession(session);
      
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/session/${session.id}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.session.messages || []);
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: colors.background }}>
      {/* Left Sidebar */}
      <div style={{
        width: isLeftSidebarCollapsed ? '60px' : '300px',
        background: colors.cardBackground,
        borderRight: `1px solid ${colors.border}`,
        transition: 'width 0.3s ease',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            {!isLeftSidebarCollapsed && (
              <h2 style={{ margin: 0, color: '#000000' }}>Chat Support</h2>
            )}
            <button 
              onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '18px',
                color: '#000000',
                cursor: 'pointer'
              }}
            >
              {isLeftSidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {!isLeftSidebarCollapsed && (
            <>
              {/* Tab Navigation */}
              <div style={{ 
                display: 'flex', 
                marginBottom: '20px',
                background: colors.background,
                borderRadius: '8px',
                padding: '4px'
              }}>
                <button
                  onClick={() => setActiveTab('widgets')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: activeTab === 'widgets' ? colors.primary : 'transparent',
                    color: activeTab === 'widgets' ? 'white' : colors.text,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Widgets
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: activeTab === 'dashboard' ? colors.primary : 'transparent',
                    color: activeTab === 'dashboard' ? 'white' : colors.text,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    setActiveTab('messages');
                    loadLiveMessages();
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: activeTab === 'messages' ? colors.primary : 'transparent',
                    color: activeTab === 'messages' ? 'white' : colors.text,
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  📨 Messages
                </button>
              </div>

              {activeTab === 'widgets' ? (
                <>
                  {/* Widget Management */}
                  <button
                    onClick={() => setShowCreateForm(true)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      cursor: 'pointer'
                    }}
                  >
                    + Create Widget
                  </button>

                  {widgets.map(widget => (
                    <div key={widget.id} style={{
                      padding: '15px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      marginBottom: '10px',
                      background: selectedWidget?.id === widget.id ? colors.primaryLight : colors.cardBackground
                    }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#000000' }}>{widget.name}</h4>
                      <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#333333' }}>
                        Created: {new Date(widget.createdAt).toLocaleDateString()}
                      </p>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#333333' }}>
                        Status: <span style={{ color: widget.enabled ? '#28a745' : '#dc3545' }}>
                          {widget.enabled ? '✅ Active' : '❌ Disabled'}
                        </span>
                      </p>
                      
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => {
                            setSelectedWidget(widget);
                            generateEmbedCode(widget);
                          }}
                          style={{
                            padding: '6px 12px',
                            background: colors.success,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          📋 Get Embed Code
                        </button>
                        <button
                          onClick={() => deleteWidget(widget.id)}
                          style={{
                            padding: '6px 12px',
                            background: colors.error,
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              ) : activeTab === 'messages' ? (
                <>
                  {/* Live Messages Panel */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h4 style={{ margin: 0, color: '#000000' }}>📨 Live Chat Messages</h4>
                      <button
                        onClick={loadLiveMessages}
                        disabled={isLoadingMessages}
                        style={{
                          padding: '8px 16px',
                          background: colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: isLoadingMessages ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {isLoadingMessages ? '🔄 Loading...' : '🔄 Refresh'}
                      </button>
                    </div>

                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 1fr', 
                      gap: '10px', 
                      textAlign: 'center',
                      padding: '15px',
                      background: colors.background,
                      borderRadius: '8px',
                      marginBottom: '20px'
                    }}>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: colors.primary }}>
                          {liveMessages.length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#333333' }}>Total Messages</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: colors.success }}>
                          {liveMessages.filter(m => m.sender === 'user').length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#333333' }}>From Users</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: colors.warning }}>
                          {liveMessages.filter(m => Date.now() - new Date(m.timestamp).getTime() < 300000).length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#333333' }}>Last 5 min</div>
                      </div>
                    </div>
                  </div>

                  {/* Messages List */}
                  <div>
                    {liveMessages.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#333333', 
                        marginTop: '50px',
                        padding: '40px'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
                        <div style={{ fontSize: '18px', marginBottom: '10px' }}>No messages yet</div>
                        <div style={{ fontSize: '14px' }}>Messages from your chat widgets will appear here</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {liveMessages
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map((message, index) => (
                          <div
                            key={message.id}
                            style={{
                              padding: '20px',
                              background: colors.cardBackground,
                              borderRadius: '12px',
                              border: `1px solid ${colors.border}`,
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0)';
                              e.target.style.boxShadow = 'none';
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                              <div>
                                <div style={{ 
                                  fontSize: '14px', 
                                  fontWeight: 'bold', 
                                  color: '#000000',
                                  marginBottom: '4px'
                                }}>
                                  💬 User Message #{index + 1}
                                </div>
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: '#333333' 
                                }}>
                                  Session: {message.sessionId.slice(0, 8)}... | Widget: {widgets.find(w => w.id === message.widgetId)?.name || 'Unknown'}
                                </div>
                              </div>
                              <div style={{ 
                                fontSize: '11px', 
                                color: '#333333',
                                textAlign: 'right'
                              }}>
                                <div>{new Date(message.timestamp).toLocaleString()}</div>
                                <div style={{ marginTop: '2px' }}>
                                  {Math.round((Date.now() - new Date(message.timestamp).getTime()) / 60000)} min ago
                                </div>
                              </div>
                            </div>
                            
                            <div style={{
                              padding: '15px',
                              background: colors.background,
                              borderRadius: '8px',
                              marginBottom: '12px'
                            }}>
                              <div style={{ 
                                fontSize: '15px', 
                                color: '#000000',
                                lineHeight: '1.5',
                                wordBreak: 'break-word'
                              }}>
                                "{message.message}"
                              </div>
                            </div>
                            
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              fontSize: '12px',
                              color: '#333333'
                            }}>
                              <div>
                                🌐 IP: {message.userInfo?.ip || 'Unknown'} | 
                                🖥️ {message.userInfo?.userAgent?.split(' ')[0] || 'Unknown Browser'}
                              </div>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  
                                  try {
                                    // Load the full session data including all messages
                                    const response = await fetch(`${API_BASE_URL}/api/chat-widget/session/${message.sessionId}`);
                                    const data = await response.json();
                                    
                                    if (data.success) {
                                      // Create a session object with the loaded data
                                      const fullSession = {
                                        id: message.sessionId,
                                        widgetId: message.widgetId,
                                        messages: data.session.messages || [],
                                        isActive: true,
                                        createdAt: data.session.createdAt || message.timestamp
                                      };
                                      
                                      setSelectedSession(fullSession);
                                      setActiveTab('dashboard');
                                      
                                      // Also add to sessions list if not already there
                                      setSessions(prev => {
                                        const exists = prev.find(s => s.id === message.sessionId);
                                        if (!exists) {
                                          return [...prev, fullSession];
                                        }
                                        return prev.map(s => s.id === message.sessionId ? fullSession : s);
                                      });
                                    } else {
                                      alert('Could not load conversation. The session may have ended.');
                                    }
                                  } catch (error) {
                                    console.error('Error loading session:', error);
                                    alert('Error loading conversation. Please try again.');
                                  }
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: colors.primary,
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                💬 Reply
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Chat Dashboard */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#000000' }}>Active Sessions</h4>
                    
                    {/* Quick Widget Code Access */}
                    {widgets.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <button
                          onClick={() => setActiveTab('widgets')}
                          style={{
                            width: '100%',
                            padding: '10px',
                            background: colors.primary,
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          📋 Get Widget Embed Code
                        </button>
                      </div>
                    )}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr', 
                      gap: '10px', 
                      textAlign: 'center',
                      padding: '10px',
                      background: colors.background,
                      borderRadius: '8px'
                    }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.primary }}>
                          {sessions.length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#333333' }}>Total</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: colors.success }}>
                          {sessions.filter(s => s.isActive).length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#333333' }}>Active</div>
                      </div>
                    </div>
                  </div>

                  {sessions.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#333333', marginTop: '50px' }}>
                      No active sessions
                    </div>
                  ) : (
                    sessions.map(session => (
                      <div
                        key={session.id}
                        onClick={() => selectSession(session)}
                        style={{
                          padding: '15px',
                          margin: '5px 0',
                          border: `1px solid ${colors.border}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          background: selectedSession?.id === session.id ? colors.primaryLight : colors.cardBackground,
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#000000' }}>
                          Session {session.id.slice(0, 8)}...
                        </div>
                        <div style={{ fontSize: '12px', color: '#333333', marginBottom: '5px' }}>
                          {session.isActive ? 'Active' : 'Closed'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#333333' }}>
                          {new Date(session.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', background: colors.background }}>
        {showCreateForm && (
          <div style={{
            background: colors.cardBackground,
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ color: '#000000' }}>Create New Chat Widget</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ color: '#000000' }}>Widget Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    marginBottom: '15px',
                    background: colors.inputBackground,
                    color: '#000000'
                  }}
                  placeholder="My Website Chat"
                />

                <label style={{ color: '#000000' }}>Primary Color</label>
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    marginBottom: '15px'
                  }}
                />

                <label style={{ color: '#000000' }}>Position</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    marginBottom: '15px',
                    background: colors.inputBackground,
                    color: '#000000'
                  }}
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div>
                <label style={{ color: '#000000' }}>Chat Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    marginBottom: '15px',
                    background: colors.inputBackground,
                    color: '#000000'
                  }}
                />

                <label style={{ color: '#000000' }}>Welcome Message</label>
                <textarea
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({...formData, welcomeMessage: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    marginBottom: '15px',
                    resize: 'vertical',
                    background: colors.inputBackground,
                    color: '#000000'
                  }}
                  rows="3"
                />

                <label style={{ color: '#000000' }}>Input Placeholder</label>
                <input
                  type="text"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({...formData, placeholder: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    marginBottom: '15px',
                    background: colors.inputBackground,
                    color: '#000000'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={createWidget}
                disabled={!formData.name || isLoading}
                style={{
                  padding: '12px 24px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {isLoading ? 'Creating...' : 'Create Widget'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '12px 24px',
                  background: colors.secondary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {embedCode && activeTab === 'widgets' && (
          <div style={{
            background: colors.cardBackground,
            padding: '30px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            <h3 style={{ color: '#000000', marginBottom: '10px' }}>
              🔗 Complete Embed Code{selectedWidget ? ` for "${selectedWidget.name}"` : ''}
            </h3>
            <p style={{ color: '#333333', marginBottom: '25px', fontSize: '14px' }}>
              Choose the option that works best for your website. Copy and paste the code exactly as shown.
            </p>
            
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#000000', marginBottom: '10px' }}>📄 Option 1: Complete HTML Page Example</h4>
              <p style={{ color: '#333333', marginBottom: '10px', fontSize: '13px' }}>
                Use this if you're creating a new HTML page or want to see exactly where to place the code:
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: colors.codeBackground,
                  padding: '15px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '11px',
                  color: '#000000',
                  maxHeight: '300px'
                }}>
                  {embedCode.complete}
                </pre>
                <button
                  onClick={() => copyToClipboard(embedCode.complete)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '5px 10px',
                    background: colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy Full HTML
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ color: '#000000', marginBottom: '10px' }}>⚡ Option 2: Add to Existing Website (Recommended)</h4>
              <p style={{ color: '#333333', marginBottom: '10px', fontSize: '13px' }}>
                Just copy this code and paste it before the closing &lt;/body&gt; tag in your existing website:
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: colors.codeBackground,
                  padding: '15px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '12px',
                  color: '#000000'
                }}>
                  {embedCode.script}
                </pre>
                <button
                  onClick={() => copyToClipboard(embedCode.script)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '5px 10px',
                    background: colors.success,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy Script
                </button>
              </div>
            </div>

            <div>
              <h4 style={{ color: '#000000', marginBottom: '10px' }}>🖼️ Option 3: iframe Embed</h4>
              <p style={{ color: '#333333', marginBottom: '10px', fontSize: '13px' }}>
                Alternative method - works with any website builder (Wix, Squarespace, etc.):
              </p>
              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: colors.codeBackground,
                  padding: '15px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '12px',
                  color: '#000000'
                }}>
                  {embedCode.iframe}
                </pre>
                <button
                  onClick={() => copyToClipboard(embedCode.iframe)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    padding: '5px 10px',
                    background: colors.secondary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy iframe
                </button>
              </div>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              background: colors.primaryLight, 
              borderRadius: '8px',
              border: `1px solid ${colors.primary}`
            }}>
              <h5 style={{ color: '#000000', margin: '0 0 8px 0' }}>📋 Quick Instructions:</h5>
              <ol style={{ color: '#333333', fontSize: '13px', margin: 0, paddingLeft: '18px' }}>
                <li>Copy Option 2 code above</li>
                <li>Paste it before the &lt;/body&gt; tag in your website</li>
                <li>Save and publish your website</li>
                <li>The chat widget will appear on your site!</li>
              </ol>
            </div>
          </div>
        )}

        {selectedSession && activeTab === 'dashboard' && (
          <div style={{
            background: colors.cardBackground,
            padding: '30px',
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            height: 'calc(100vh - 120px)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: '#000000', margin: '0 0 8px 0' }}>
                💬 Chat Session {selectedSession.id.slice(0, 8)}...
              </h3>
              <div style={{ 
                fontSize: '14px', 
                color: '#333333',
                display: 'flex',
                gap: '15px'
              }}>
                <span>📅 Started: {new Date(selectedSession.createdAt).toLocaleString()}</span>
                <span>📊 Messages: {selectedSession.messages?.length || 0}</span>
                <span>🔗 Widget: {widgets.find(w => w.id === selectedSession.widgetId)?.name || 'Unknown'}</span>
              </div>
            </div>
            
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '20px', 
              background: colors.background,
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {!selectedSession.messages || selectedSession.messages.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: '#333333',
                  padding: '40px'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>💬</div>
                  <div>No messages in this conversation yet</div>
                  <div style={{ fontSize: '14px', marginTop: '8px' }}>
                    Messages will appear here when the user starts chatting
                  </div>
                </div>
              ) : (
                selectedSession.messages.map((message, index) => (
                  <div key={index} style={{
                    marginBottom: '15px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: message.sender === 'agent' ? 'flex-end' : 'flex-start'
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '18px',
                      background: message.sender === 'agent' ? colors.primary : 
                                message.sender === 'user' ? colors.cardBackground : colors.secondary,
                      color: message.sender === 'agent' ? 'white' : '#000000',
                      border: message.sender === 'user' ? `1px solid ${colors.border}` : 'none'
                    }}>
                      {message.text || message.message}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#333333', 
                      marginTop: '4px',
                      padding: '0 4px'
                    }}>
                      {message.sender === 'agent' ? '👤 You' : 
                       message.sender === 'user' ? '💬 User' : '🤖 Bot'} • 
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ 
              display: 'flex',
              gap: '12px',
              alignItems: 'end'
            }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your response..."
                style={{
                  flex: 1,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '20px',
                  padding: '12px 16px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  maxHeight: '100px',
                  minHeight: '20px',
                  background: colors.inputBackground,
                  color: '#000000'
                }}
                rows="1"
              />
              <button
                onClick={() => {
                  // Send message logic would go here
                  setNewMessage('');
                }}
                disabled={!newMessage.trim()}
                style={{
                  padding: '12px 24px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: !newMessage.trim() ? 0.5 : 1
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {!selectedWidget && !selectedSession && !showCreateForm && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60%',
            color: '#333333',
            fontSize: '18px',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '20px', fontSize: '48px' }}>
              {activeTab === 'widgets' ? '💬' : '📱'}
            </div>
            <div style={{ marginBottom: '10px' }}>
              {activeTab === 'widgets' ? 
                'Create a widget or click "Get Embed Code" on existing widgets' : 
                'Select a chat session to view conversation'
              }
            </div>
            {activeTab === 'widgets' && widgets.length === 0 && (
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  marginTop: '15px',
                  padding: '12px 24px',
                  background: colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                + Create Your First Widget
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSupport;