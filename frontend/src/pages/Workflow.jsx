import { useState, useRef, useCallback, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager, workflowAPI } from '../api';

const Workflow = () => {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [draggedNode, setDraggedNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [nodeCounter, setNodeCounter] = useState(1);
  const [copiedNode, setCopiedNode] = useState(null);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);
  const [workflowName, setWorkflowName] = useState('');
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [showLoadDropdown, setShowLoadDropdown] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [configPanelNode, setConfigPanelNode] = useState(null);
  const [nodeConfig, setNodeConfig] = useState({});
  const [latestTelegramMessage, setLatestTelegramMessage] = useState(null);
  const [webhookStatus, setWebhookStatus] = useState('');
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false);

  // Check authentication
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  // Generate unique node ID
  const generateNodeId = () => {
    const id = `node_${nodeCounter}`;
    setNodeCounter(prev => prev + 1);
    return id;
  };

  // Load saved workflows on component mount
  useEffect(() => {
    loadSavedWorkflows();
  }, []);

  const loadSavedWorkflows = async () => {
    try {
      const response = await workflowAPI.getWorkflows();
      setSavedWorkflows(response.data.workflows || []);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  // Save workflow function
  const saveWorkflow = async () => {
    if (!workflowName.trim()) {
      const name = prompt('Enter workflow name:');
      if (!name) return;
      setWorkflowName(name);
    }

    setLoading(true);
    setSaveStatus('Saving...');

    try {
      const workflowData = {
        name: workflowName || 'Untitled Workflow',
        description: '',
        nodes: nodes,
        connections: connections
      };

      let response;
      if (currentWorkflowId) {
        // Update existing workflow
        response = await workflowAPI.updateWorkflow(currentWorkflowId, workflowData);
      } else {
        // Create new workflow
        response = await workflowAPI.createWorkflow(workflowData);
        setCurrentWorkflowId(response.data.workflow.id);
      }

      setSaveStatus('✅ Saved!');
      setTimeout(() => setSaveStatus(''), 2000);
      await loadSavedWorkflows();
    } catch (error) {
      console.error('Failed to save workflow:', error);
      setSaveStatus('❌ Save failed');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Load workflow function
  const loadWorkflow = async (workflowId) => {
    setLoading(true);
    try {
      const response = await workflowAPI.getWorkflow(workflowId);
      const workflow = response.data.workflow;
      
      setNodes(workflow.data.nodes || []);
      setConnections(workflow.data.connections || []);
      setWorkflowName(workflow.name);
      setCurrentWorkflowId(workflow.id);
      setShowLoadDropdown(false);
      
      // Update node counter to avoid ID conflicts
      const maxNodeNum = Math.max(
        0,
        ...(workflow.data.nodes || []).map(node => {
          const match = node.id.match(/node_(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
      );
      setNodeCounter(maxNodeNum + 1);
      
      setSaveStatus('✅ Loaded!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Failed to load workflow:', error);
      setSaveStatus('❌ Load failed');
      setTimeout(() => setSaveStatus(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Copy workflow JSON to clipboard
  const copyWorkflowToClipboard = async () => {
    const workflowData = {
      name: workflowName || 'Untitled Workflow',
      nodes: nodes,
      connections: connections,
      metadata: {
        version: '1.0',
        exportedAt: new Date().toISOString()
      }
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(workflowData, null, 2));
      setSaveStatus('📋 Copied to clipboard!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      setSaveStatus('❌ Copy failed');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // Create new workflow
  const createNewWorkflow = () => {
    setNodes([]);
    setConnections([]);
    setWorkflowName('');
    setCurrentWorkflowId(null);
    setNodeCounter(1);
    setConfigPanelNode(null);
    setSaveStatus('New workflow created');
    setTimeout(() => setSaveStatus(''), 2000);
  };

  // Close configuration panel
  const closeConfigPanel = () => {
    setConfigPanelNode(null);
    setNodeConfig({});
  };

  // Save node configuration
  const saveNodeConfig = () => {
    if (!configPanelNode) return;

    setNodes(prev => prev.map(node => 
      node.id === configPanelNode.id 
        ? { 
            ...node, 
            config: nodeConfig,
            label: nodeConfig.label || node.label
          }
        : node
    ));
    closeConfigPanel();
  };

  // Update node config field
  const updateConfigField = (field, value) => {
    setNodeConfig(prev => ({ ...prev, [field]: value }));
  };

  // Auto-generate webhook URL for Telegram Trigger nodes
  const generateWebhookUrl = (nodeId) => {
    return `https://workflow-lg9z.onrender.com/api/webhooks/telegram-${nodeId}`;
  };

  // Register Telegram webhook
  const handleRegisterWebhook = async () => {
    if (!configPanelNode || !nodeConfig.botToken) {
      setWebhookStatus('❌ Bot token is required');
      return;
    }

    setIsRegisteringWebhook(true);
    setWebhookStatus('🔄 Registering webhook...');

    try {
      const webhookUrl = generateWebhookUrl(configPanelNode.id);
      const response = await fetch('https://workflow-lg9z.onrender.com/api/webhooks/register-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          botToken: nodeConfig.botToken,
          nodeId: configPanelNode.id,
          webhookUrl: webhookUrl
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setWebhookStatus('✅ Webhook registered successfully!');
        updateConfigField('webhookRegistered', true);
        updateConfigField('webhookUrl', webhookUrl);
      } else {
        setWebhookStatus(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Webhook registration error:', error);
      setWebhookStatus('❌ Network error during registration');
    } finally {
      setIsRegisteringWebhook(false);
      setTimeout(() => setWebhookStatus(''), 5000);
    }
  };

  // Poll for latest Telegram message for this node
  const pollLatestMessage = async () => {
    if (!configPanelNode || configPanelNode.type !== 'TelegramTrigger') return;

    try {
      const response = await fetch(`https://workflow-lg9z.onrender.com/api/webhooks/latest-message/${configPanelNode.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.message) {
          setLatestTelegramMessage(data.message);
        }
      }
    } catch (error) {
      console.error('Error polling latest message:', error);
    }
  };

  // Poll for messages when config panel is open for Telegram Trigger
  useEffect(() => {
    if (configPanelNode && configPanelNode.type === 'TelegramTrigger') {
      pollLatestMessage();
      const interval = setInterval(pollLatestMessage, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [configPanelNode]);

  // Handle dragging new node from palette onto canvas
  const handlePaletteDragStart = (e, nodeType) => {
    e.dataTransfer.setData('nodeType', nodeType);
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    if (!nodeType) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = (e.clientX - rect.left - canvasTransform.x) / canvasTransform.scale;
    const canvasY = (e.clientY - rect.top - canvasTransform.y) / canvasTransform.scale;

    const newNode = {
      id: generateNodeId(),
      type: nodeType,
      label: `${nodeType} ${nodeCounter}`,
      x: canvasX,
      y: canvasY,
      width: 120,
      height: 60
    };

    setNodes(prev => [...prev, newNode]);
  };

  const handleCanvasDragOver = (e) => {
    e.preventDefault();
  };

  // Handle node double click for configuration
  const handleNodeDoubleClick = (node) => {
    setConfigPanelNode(node);
    setNodeConfig(node.config || {});
  };

  // Handle node dragging within canvas
  const handleNodeMouseDown = (e, node) => {
    e.stopPropagation();
    
    if (e.detail === 2) { // Double click
      handleNodeDoubleClick(node);
      return;
    }

    setSelectedNode(node.id);
    setSelectedConnection(null);
    setDraggedNode({
      node,
      offsetX: e.clientX - node.x * canvasTransform.scale - canvasTransform.x,
      offsetY: e.clientY - node.y * canvasTransform.scale - canvasTransform.y
    });
  };

  const handleMouseMove = useCallback((e) => {
    if (draggedNode) {
      const newX = (e.clientX - draggedNode.offsetX - canvasTransform.x) / canvasTransform.scale;
      const newY = (e.clientY - draggedNode.offsetY - canvasTransform.y) / canvasTransform.scale;
      
      setNodes(prev => prev.map(node => 
        node.id === draggedNode.node.id 
          ? { ...node, x: newX, y: newY }
          : node
      ));
    } else if (isPanning) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      
      setCanvasTransform(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }, [draggedNode, isPanning, panStart, canvasTransform]);

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
    setIsPanning(false);
    setConnecting(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Handle canvas panning
  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-background')) {
      setSelectedNode(null);
      setSelectedConnection(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle zoom
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.max(0.1, Math.min(3, canvasTransform.scale + delta));
    
    setCanvasTransform(prev => ({
      ...prev,
      scale: newScale
    }));
  };

  // Handle connection creation
  const handlePortMouseDown = (e, nodeId, portType) => {
    e.stopPropagation();
    setConnecting({ nodeId, portType, startX: e.clientX, startY: e.clientY });
  };

  const handlePortMouseUp = (e, nodeId, portType) => {
    e.stopPropagation();
    if (connecting && connecting.nodeId !== nodeId) {
      // Create connection
      const newConnection = {
        id: `conn_${Date.now()}`,
        from: connecting.portType === 'output' ? connecting.nodeId : nodeId,
        to: connecting.portType === 'output' ? nodeId : connecting.nodeId
      };
      
      // Check if connection already exists
      const exists = connections.some(conn => 
        conn.from === newConnection.from && conn.to === newConnection.to
      );
      
      if (!exists) {
        setConnections(prev => [...prev, newConnection]);
      }
    }
    setConnecting(null);
  };

  // Copy node function
  const copyNode = (node) => {
    setCopiedNode({
      ...node,
      id: null // Will be regenerated on paste
    });
  };

  // Paste node function
  const pasteNode = () => {
    if (!copiedNode) return;
    
    const newNode = {
      ...copiedNode,
      id: generateNodeId(),
      x: copiedNode.x + 20, // Offset to avoid overlap
      y: copiedNode.y + 20
    };
    
    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
  };

  // Delete key and copy/paste handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if we're typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Delete') {
        if (selectedNode) {
          setNodes(prev => prev.filter(node => node.id !== selectedNode));
          setConnections(prev => prev.filter(conn => 
            conn.from !== selectedNode && conn.to !== selectedNode
          ));
          setSelectedNode(null);
        } else if (selectedConnection) {
          setConnections(prev => prev.filter(conn => conn.id !== selectedConnection));
          setSelectedConnection(null);
        }
      } else if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        if (selectedNode) {
          const nodeToCopy = nodes.find(node => node.id === selectedNode);
          if (nodeToCopy) {
            copyNode(nodeToCopy);
          }
        }
      } else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteNode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedConnection, nodes, copiedNode]);

  // Get node position including transform
  const getNodeScreenPosition = (node) => ({
    x: node.x * canvasTransform.scale + canvasTransform.x,
    y: node.y * canvasTransform.scale + canvasTransform.y
  });

  // Render connection line
  const renderConnection = (connection) => {
    const fromNode = nodes.find(n => n.id === connection.from);
    const toNode = nodes.find(n => n.id === connection.to);
    
    if (!fromNode || !toNode) return null;

    const fromPos = getNodeScreenPosition(fromNode);
    const toPos = getNodeScreenPosition(toNode);
    
    const startX = fromPos.x + (fromNode.width * canvasTransform.scale);
    const startY = fromPos.y + (fromNode.height * canvasTransform.scale / 2);
    const endX = toPos.x;
    const endY = toPos.y + (toNode.height * canvasTransform.scale / 2);

    return (
      <line
        key={connection.id}
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={selectedConnection === connection.id ? "#3b82f6" : "#6b7280"}
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
        onClick={() => {
          setSelectedConnection(connection.id);
          setSelectedNode(null);
        }}
        style={{ cursor: 'pointer' }}
      />
    );
  };

  return (
    <div className="workflow-container">
      {/* Header */}
      <div className="workflow-header">
        <div className="workflow-title-section">
          <div className="workflow-title-row">
            <h1>🔧 Workflow Builder</h1>
            {workflowName && (
              <span className="current-workflow-name">
                "{workflowName}" {currentWorkflowId && <span className="workflow-id">#{currentWorkflowId}</span>}
              </span>
            )}
            {saveStatus && <span className="save-status">{saveStatus}</span>}
          </div>
          <div className="shortcuts-info">
            <span className="shortcut-tip">
              💡 <strong>Ctrl+C</strong> copy • <strong>Ctrl+V</strong> paste • <strong>Del</strong> delete
              {copiedNode && <span className="copied-indicator"> • 📋 Node copied!</span>}
            </span>
          </div>
        </div>
        <div className="workflow-controls">
          <button 
            className="btn btn-primary" 
            onClick={createNewWorkflow}
            disabled={loading}
          >
            ✨ New
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={saveWorkflow}
            disabled={loading}
          >
            {loading && saveStatus.includes('Saving') ? '⏳' : '💾'} Save
          </button>
          <div className="dropdown-container">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowLoadDropdown(!showLoadDropdown)}
              disabled={loading}
            >
              📁 Load {savedWorkflows.length > 0 && `(${savedWorkflows.length})`}
            </button>
            {showLoadDropdown && (
              <div className="dropdown-menu">
                {savedWorkflows.length === 0 ? (
                  <div className="dropdown-item disabled">No saved workflows</div>
                ) : (
                  savedWorkflows.map(workflow => (
                    <div
                      key={workflow.id}
                      className="dropdown-item"
                      onClick={() => loadWorkflow(workflow.id)}
                    >
                      <div className="workflow-item-name">{workflow.name}</div>
                      <div className="workflow-item-date">
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button 
            className="btn btn-secondary"
            onClick={copyWorkflowToClipboard}
            disabled={loading}
          >
            📋 Copy JSON
          </button>
        </div>
      </div>

      <div className="workflow-main">
        {/* Node Palette */}
        <div className="node-palette">
          <h3>Trigger Nodes</h3>
          <div
            className="palette-node telegram-trigger-node"
            draggable
            onDragStart={(e) => handlePaletteDragStart(e, 'TelegramTrigger')}
          >
            📞 Telegram Trigger
          </div>
          
          <h3>Action Nodes</h3>
          <div
            className="palette-node action-node"
            draggable
            onDragStart={(e) => handlePaletteDragStart(e, 'Action')}
          >
            🎯 Action
          </div>
        </div>

        {/* Canvas */}
        <div 
          className="workflow-canvas"
          ref={canvasRef}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
        >
          <div className="canvas-background" />
          
          {/* SVG for connections */}
          <svg className="connections-svg">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill="#6b7280"
                />
              </marker>
            </defs>
            {connections.map(renderConnection)}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const screenPos = getNodeScreenPosition(node);
            return (
              <div
                key={node.id}
                className={`workflow-node ${node.type.toLowerCase()}-node ${
                  selectedNode === node.id ? 'selected' : ''
                }`}
                style={{
                  left: screenPos.x,
                  top: screenPos.y,
                  width: node.width * canvasTransform.scale,
                  height: node.height * canvasTransform.scale,
                  fontSize: `${12 * canvasTransform.scale}px`
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
              >
                <div className="node-content">
                  {node.label}
                </div>
                
                {/* Input port */}
                <div
                  className="node-port input-port"
                  onMouseDown={(e) => handlePortMouseDown(e, node.id, 'input')}
                  onMouseUp={(e) => handlePortMouseUp(e, node.id, 'input')}
                />
                
                {/* Output port */}
                <div
                  className="node-port output-port"
                  onMouseDown={(e) => handlePortMouseDown(e, node.id, 'output')}
                  onMouseUp={(e) => handlePortMouseUp(e, node.id, 'output')}
                />
              </div>
            );
          })}
        </div>

        {/* Zoom Controls */}
        <div className="zoom-controls">
          <button 
            className="zoom-btn"
            onClick={() => setCanvasTransform(prev => ({
              ...prev,
              scale: Math.min(3, prev.scale + 0.1)
            }))}
          >
            +
          </button>
          <span className="zoom-level">{Math.round(canvasTransform.scale * 100)}%</span>
          <button 
            className="zoom-btn"
            onClick={() => setCanvasTransform(prev => ({
              ...prev,
              scale: Math.max(0.1, prev.scale - 0.1)
            }))}
          >
            -
          </button>
        </div>
      </div>

      {/* Configuration Panel Modal */}
      {configPanelNode && (
        <div className="config-modal-overlay" onClick={closeConfigPanel}>
          <div className="config-modal" onClick={(e) => e.stopPropagation()}>
            <div className="config-modal-header">
              <h3>🔧 Configure Node: {configPanelNode.label}</h3>
              <button className="close-btn" onClick={closeConfigPanel}>✕</button>
            </div>
            
            <div className="config-modal-content">
              {configPanelNode.type === 'TelegramTrigger' ? (
                // Telegram Trigger Node Configuration
                <>
                  {/* Left: Output */}
                  <div className="config-section config-outputs-section">
                    <h4>📤 Output</h4>
                    <div className="config-outputs">
                      <div className="output-item">
                        <span>Message Output</span>
                        <div className="output-port telegram">●</div>
                      </div>
                      <div className="output-item">
                        <span>Success</span>
                        <div className="output-port">●</div>
                      </div>
                    </div>
                    <div className="output-preview">
                      <h5>Latest Output:</h5>
                      <pre className="json-preview">
                        {latestTelegramMessage 
                          ? JSON.stringify(latestTelegramMessage, null, 2)
                          : '{\n  "waiting": "for message..."\n}'
                        }
                      </pre>
                    </div>
                  </div>

                  {/* Middle: Parameters */}
                  <div className="config-section config-params-section">
                    <h4>⚙️ Parameters</h4>
                    <div className="config-form">
                      <div className="form-group">
                        <label>Node Label:</label>
                        <input
                          type="text"
                          value={nodeConfig.label || configPanelNode.label || ''}
                          onChange={(e) => updateConfigField('label', e.target.value)}
                          placeholder="Telegram Trigger"
                        />
                      </div>

                      <div className="form-group">
                        <label>Bot Token:</label>
                        <input
                          type="password"
                          value={nodeConfig.botToken || '8148982414:AAEPKCLwwxiMp0KH3wKqrqdTnPI3W3E_0VQ'}
                          onChange={(e) => updateConfigField('botToken', e.target.value)}
                          placeholder="Your Telegram Bot Token"
                        />
                      </div>

                      <div className="form-group">
                        <label>Webhook URL:</label>
                        <input
                          type="text"
                          value={nodeConfig.webhookUrl || generateWebhookUrl(configPanelNode.id)}
                          disabled
                          className="disabled-input"
                        />
                        <small className="form-help">Auto-generated based on node ID</small>
                      </div>

                      <div className="form-group">
                        <button 
                          className={`btn ${isRegisteringWebhook ? 'btn-loading' : 'btn-primary'}`}
                          onClick={handleRegisterWebhook}
                          disabled={isRegisteringWebhook || !nodeConfig.botToken}
                        >
                          {isRegisteringWebhook ? '🔄 Registering...' : '📡 Register Webhook'}
                        </button>
                        {webhookStatus && (
                          <div className="webhook-status">{webhookStatus}</div>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Status:</label>
                        <div className="status-indicators">
                          <div className={`status-indicator ${nodeConfig.webhookRegistered ? 'active' : ''}`}>
                            📡 Webhook {nodeConfig.webhookRegistered ? 'Registered' : 'Not Registered'}
                          </div>
                          <div className={`status-indicator ${latestTelegramMessage ? 'active' : ''}`}>
                            📨 {latestTelegramMessage ? 'Message Received' : 'Waiting for Messages'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Input */}
                  <div className="config-section config-inputs-section">
                    <h4>📥 Input (Latest Message)</h4>
                    <div className="input-preview">
                      <pre className="json-preview">
                        {latestTelegramMessage 
                          ? JSON.stringify(latestTelegramMessage, null, 2)
                          : '{\n  "status": "waiting",\n  "message": "Send a message to your bot"\n}'
                        }
                      </pre>
                    </div>
                    <div className="input-actions">
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={pollLatestMessage}
                      >
                        🔄 Refresh
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                // Regular Action Node Configuration
                <>
                  {/* Left: Inputs */}
                  <div className="config-section config-inputs-section">
                    <h4>📥 Inputs</h4>
                    <div className="config-inputs">
                      <div className="input-item">
                        <div className="input-port">●</div>
                        <span>Trigger Input</span>
                      </div>
                      <div className="input-item">
                        <div className="input-port">●</div>
                        <span>Data Input</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Parameters & Settings */}
                  <div className="config-section config-params-section">
                    <h4>⚙️ Parameters</h4>
                    <div className="config-form">
                      <div className="form-group">
                        <label>Node Label:</label>
                        <input
                          type="text"
                          value={nodeConfig.label || configPanelNode.label || ''}
                          onChange={(e) => updateConfigField('label', e.target.value)}
                          placeholder="Enter node label"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Description:</label>
                        <textarea
                          value={nodeConfig.description || ''}
                          onChange={(e) => updateConfigField('description', e.target.value)}
                          placeholder="Describe what this node does"
                          rows="2"
                        />
                      </div>

                      {configPanelNode.type === 'Action' && (
                        <>
                          <div className="form-group">
                            <label>Action Type:</label>
                            <select
                              value={nodeConfig.actionType || 'webhook'}
                              onChange={(e) => updateConfigField('actionType', e.target.value)}
                            >
                              <option value="webhook">Webhook</option>
                              <option value="email">Send Email</option>
                              <option value="database">Database Query</option>
                              <option value="api">API Call</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>URL/Endpoint:</label>
                            <input
                              type="text"
                              value={nodeConfig.url || ''}
                              onChange={(e) => updateConfigField('url', e.target.value)}
                              placeholder="https://api.example.com/webhook"
                            />
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>HTTP Method:</label>
                              <select
                                value={nodeConfig.method || 'POST'}
                                onChange={(e) => updateConfigField('method', e.target.value)}
                              >
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Timeout (ms):</label>
                              <input
                                type="number"
                                value={nodeConfig.timeout || '5000'}
                                onChange={(e) => updateConfigField('timeout', e.target.value)}
                                placeholder="5000"
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Request Body (JSON):</label>
                            <textarea
                              value={nodeConfig.requestBody || ''}
                              onChange={(e) => updateConfigField('requestBody', e.target.value)}
                              placeholder='{"message": "{{input.data}}"}'
                              rows="3"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Outputs */}
                  <div className="config-section config-outputs-section">
                    <h4>📤 Outputs</h4>
                    <div className="config-outputs">
                      <div className="output-item">
                        <span>Success Output</span>
                        <div className="output-port">●</div>
                      </div>
                      <div className="output-item">
                        <span>Error Output</span>
                        <div className="output-port error">●</div>
                      </div>
                      <div className="output-item">
                        <span>Data Output</span>
                        <div className="output-port data">●</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="config-modal-footer">
              <button className="btn btn-secondary" onClick={closeConfigPanel}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveNodeConfig}>
                💾 Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workflow;