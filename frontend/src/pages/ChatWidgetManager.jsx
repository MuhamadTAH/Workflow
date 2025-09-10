import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';
import ChatWidget from '../components/ChatWidget.jsx';

const ChatWidgetManager = () => {
  const [widgets, setWidgets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  
  // Form state
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

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/widgets`);
      const data = await response.json();
      
      if (data.success) {
        setWidgets(data.widgets);
      }
    } catch (error) {
      console.error('Error loading widgets:', error);
    } finally {
      setIsLoading(false);
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
        setEmbedCode(data.embedCode);
      }
    } catch (error) {
      console.error('Error creating widget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateWidget = async (widgetId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/widget/${widgetId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      
      if (data.success) {
        setWidgets(prev => prev.map(w => w.id === widgetId ? data.config : w));
        if (selectedWidget && selectedWidget.id === widgetId) {
          setSelectedWidget(data.config);
          setEmbedCode(data.embedCode);
        }
      }
    } catch (error) {
      console.error('Error updating widget:', error);
    }
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

  const getEmbedCode = async (widget) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/widget/${widget.id}/config`);
      const data = await response.json();
      
      if (data.success) {
        setSelectedWidget(widget);
        
        // Generate embed code
        const baseUrl = window.location.origin;
        const scriptCode = `<script>
(function() {
  var script = document.createElement('script');
  script.src = '${baseUrl}/widget.js';
  script.onload = function() {
    ChatWidget.init({
      widgetId: '${widget.id}',
      apiUrl: '${API_BASE_URL}',
      config: ${JSON.stringify(widget)}
    });
  };
  document.head.appendChild(script);
})();
</script>`;

        const iframeCode = `<iframe 
  src="${baseUrl}/chat-widget/${widget.id}" 
  style="position: fixed; ${widget.position.includes('bottom') ? 'bottom' : 'top'}: 20px; ${widget.position.includes('right') ? 'right' : 'left'}: 20px; width: 350px; height: 500px; border: none; z-index: 9999;"
  frameborder="0">
</iframe>`;

        setEmbedCode({ script: scriptCode, iframe: iframeCode });
      }
    } catch (error) {
      console.error('Error getting embed code:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f5f5' }}>
      {/* Left Sidebar */}
      <div style={{
        width: isLeftSidebarCollapsed ? '60px' : '300px',
        background: 'white',
        borderRight: '1px solid #ddd',
        transition: 'width 0.3s ease',
        overflowY: 'auto'
      }}>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            {!isLeftSidebarCollapsed && <h2>Chat Widgets</h2>}
            <button 
              onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
              style={{ background: 'none', border: 'none', fontSize: '18px' }}
            >
              {isLeftSidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {!isLeftSidebarCollapsed && (
            <>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  cursor: 'pointer'
                }}
              >
                + Create Widget
              </button>

              {/* Widget List */}
              <div>
                {widgets.map(widget => (
                  <div key={widget.id} style={{
                    padding: '15px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    background: selectedWidget?.id === widget.id ? '#e3f2fd' : 'white'
                  }}>
                    <h4 style={{ margin: '0 0 8px 0' }}>{widget.name}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                      Created: {new Date(widget.createdAt).toLocaleDateString()}
                    </p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px' }}>
                      Status: <span style={{ color: widget.enabled ? 'green' : 'red' }}>
                        {widget.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </p>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => getEmbedCode(widget)}
                        style={{
                          padding: '6px 12px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Get Code
                      </button>
                      <button
                        onClick={() => {
                          setSelectedWidget(widget);
                          setShowPreview(true);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => deleteWidget(widget.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#dc3545',
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
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        {showCreateForm && (
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            marginBottom: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3>Create New Chat Widget</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label>Widget Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    marginBottom: '15px'
                  }}
                  placeholder="My Website Chat"
                />

                <label>Primary Color</label>
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    marginBottom: '15px'
                  }}
                />

                <label>Position</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    marginBottom: '15px'
                  }}
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              <div>
                <label>Chat Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    marginBottom: '15px'
                  }}
                />

                <label>Welcome Message</label>
                <textarea
                  value={formData.welcomeMessage}
                  onChange={(e) => setFormData({...formData, welcomeMessage: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    resize: 'vertical'
                  }}
                  rows="3"
                />

                <label>Input Placeholder</label>
                <input
                  type="text"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({...formData, placeholder: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    marginBottom: '15px'
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
                  background: '#007bff',
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
                  background: '#6c757d',
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

        {selectedWidget && embedCode && (
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3>Embed Code for "{selectedWidget.name}"</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4>Option 1: JavaScript Widget (Recommended)</h4>
              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '12px'
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
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div>
              <h4>Option 2: iFrame</h4>
              <div style={{ position: 'relative' }}>
                <pre style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '6px',
                  overflow: 'auto',
                  fontSize: '12px'
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
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedWidget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            position: 'relative',
            width: '80%',
            height: '80%'
          }}>
            <button
              onClick={() => setShowPreview(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            <h3>Widget Preview</h3>
            <div style={{ position: 'relative', height: 'calc(100% - 60px)', background: '#f0f0f0' }}>
              <ChatWidget widgetId={selectedWidget.id} config={selectedWidget} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidgetManager;