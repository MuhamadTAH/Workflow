import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api.js';

const ChatDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    activeSessions: 0,
    pendingMessages: 0
  });
  
  // Sidebar states
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadSessions();
    connectAgentWebSocket();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadSessions, 30000);
    
    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/sessions`);
      const data = await response.json();
      
      if (data.success) {
        setSessions(data.sessions || []);
        
        // Update stats
        const activeSessions = data.sessions?.filter(s => s.isActive).length || 0;
        const pendingMessages = data.sessions?.reduce((acc, s) => 
          acc + (s.messages?.filter(m => m.sender === 'user' && !m.read).length || 0), 0) || 0;
        
        setStats({
          totalSessions: data.sessions?.length || 0,
          activeSessions,
          pendingMessages
        });
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const connectAgentWebSocket = () => {
    const wsUrl = `wss://workflow-lg9z.onrender.com/chat/agent`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      console.log('Agent WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'new_message_notification') {
        // Update sessions list
        loadSessions();
        
        // If this is the selected session, add message
        if (selectedSession && data.sessionId === selectedSession.id) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            text: data.message,
            sender: data.sender,
            timestamp: data.timestamp
          }]);
        }
      } else if (data.type === 'message' && selectedSession) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: data.message,
          sender: data.sender,
          timestamp: data.timestamp
        }]);
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      console.log('Agent WebSocket disconnected');
      
      // Attempt to reconnect after 5 seconds
      setTimeout(connectAgentWebSocket, 5000);
    };
  };

  const selectSession = async (session) => {
    try {
      setSelectedSession(session);
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/session/${session.id}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.session.messages || []);
        
        // Join this session as agent
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'agent_join',
            sessionId: session.id
          }));
        }
      }
    } catch (error) {
      console.error('Error loading session messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedSession || !wsRef.current) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'agent',
      timestamp: new Date()
    };

    // Add to local messages
    setMessages(prev => [...prev, message]);
    
    // Send via WebSocket
    if (wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'message',
        message: newMessage,
        sessionId: selectedSession.id
      }));
    }

    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSessionStatus = (session) => {
    if (!session.isActive) return 'Closed';
    if (session.agentSocket) return 'Agent Active';
    return 'Waiting for Agent';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f5f5' }}>
      {/* Left Sidebar - Sessions */}
      <div style={{
        width: isLeftSidebarCollapsed ? '60px' : '350px',
        background: 'white',
        borderRight: '1px solid #ddd',
        transition: 'width 0.3s ease',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {!isLeftSidebarCollapsed && <h2>Chat Sessions</h2>}
          <button 
            onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
            style={{ background: 'none', border: 'none', fontSize: '18px' }}
          >
            {isLeftSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        {!isLeftSidebarCollapsed && (
          <>
            {/* Stats */}
            <div style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                    {stats.totalSessions}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                    {stats.activeSessions}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Active</div>
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                    {stats.pendingMessages}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
                </div>
              </div>
            </div>

            {/* Sessions List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              {sessions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '50px' }}>
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
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: selectedSession?.id === session.id ? '#e3f2fd' : 'white',
                      transition: 'background 0.2s'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      Session {session.id.slice(0, 8)}...
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                      {getSessionStatus(session)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(session.createdAt).toLocaleString()}
                    </div>
                    {session.messages && session.messages.length > 0 && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#333', 
                        marginTop: '5px',
                        fontStyle: 'italic',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        Last: {session.messages[session.messages.length - 1].text}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedSession ? (
          <>
            {/* Chat Header */}
            <div style={{ 
              padding: '20px', 
              background: 'white', 
              borderBottom: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h3 style={{ margin: 0 }}>Session {selectedSession.id.slice(0, 8)}...</h3>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                  Status: {getSessionStatus(selectedSession)} | 
                  Started: {new Date(selectedSession.createdAt).toLocaleString()}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  color: isConnected ? '#28a745' : '#dc3545',
                  fontSize: '14px'
                }}>
                  ● {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '20px', 
              background: '#f8f9fa' 
            }}>
              {isLoading ? (
                <div style={{ textAlign: 'center', color: '#666' }}>Loading messages...</div>
              ) : (
                <>
                  {messages.map((message, index) => (
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
                        background: message.sender === 'agent' ? '#007bff' : 
                                  message.sender === 'user' ? 'white' : '#e9ecef',
                        color: message.sender === 'agent' ? 'white' : '#333',
                        border: message.sender === 'user' ? '1px solid #ddd' : 'none'
                      }}>
                        {message.text}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#999', 
                        marginTop: '4px',
                        padding: '0 4px'
                      }}>
                        {message.sender === 'agent' ? 'You' : 
                         message.sender === 'user' ? 'User' : 'Bot'} • 
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div style={{ 
              padding: '20px', 
              background: 'white', 
              borderTop: '1px solid #ddd',
              display: 'flex',
              gap: '12px',
              alignItems: 'end'
            }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your response..."
                style={{
                  flex: 1,
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  padding: '12px 16px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  maxHeight: '100px',
                  minHeight: '20px'
                }}
                rows="1"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                style={{
                  padding: '12px 24px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  opacity: !newMessage.trim() || !isConnected ? 0.5 : 1
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#666',
            fontSize: '18px'
          }}>
            Select a session to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDashboard;