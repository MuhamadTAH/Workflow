import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { nodeSchemas, validateNodeConfig } from '../utils/nodeSchemas';
import '../styles.css';

function Workflow() {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [tempConnection, setTempConnection] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedConnections, setSelectedConnections] = useState([]);
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [savedWorkflows, setSavedWorkflows] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [nodeConfigs, setNodeConfigs] = useState({});
  const [configErrors, setConfigErrors] = useState({});

  // Available node types (ready for future integrations)
  const nodeTypes = {
    // Node types can be added here when integrations are implemented
    // Example: 'http-request': { label: 'HTTP Request', icon: '🌐', hasInput: true, hasOutput: true }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - transform.x) / transform.scale;
    const y = (e.clientY - rect.top - transform.y) / transform.scale;
    
    const nodeType = e.dataTransfer.getData('nodeType');
    if (!nodeType || !nodeTypes[nodeType]) {
      console.warn('Unknown node type:', nodeType);
      return;
    }
    
    const config = nodeTypes[nodeType];
    const newNode = {
      id: Date.now(),
      type: nodeType,
      x: x,
      y: y,
      label: config.label,
      icon: config.icon,
      hasInput: config.hasInput,
      hasOutput: config.hasOutput
    };
    
    setNodes(prev => [...prev, newNode]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Register workflow with backend
  const registerCurrentWorkflowWithEngine = async (baseUrl = null) => {
    const currentWorkflow = {
      id: Date.now(),
      name: workflowName,
      nodes: nodes,
      connections: connections,
      configs: nodeConfigs
    };

    console.log('📝 Registering workflow:', currentWorkflow);

    const registrationUrl = baseUrl 
      ? `${baseUrl}/api/webhooks/register-workflow`
      : '/api/webhooks/register-workflow';

    const response = await fetch(registrationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currentWorkflow)
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Workflow registered successfully');
      return true;
    } else {
      console.error('Failed to register workflow:', result.error);
      throw new Error(result.error || 'Failed to register workflow');
    }
  };

  const saveWorkflow = async (name) => {
    const workflow = {
      id: Date.now(),
      name: name || workflowName,
      nodes,
      connections,
      transform,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const saved = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    saved.push(workflow);
    localStorage.setItem('savedWorkflows', JSON.stringify(saved));
    
    setSavedWorkflows(saved);
    setWorkflowName(workflow.name);
    setShowSaveDialog(false);

    // Register workflow with backend
    try {
      await registerCurrentWorkflowWithEngine();
    } catch (error) {
      console.error('Error registering workflow with backend:', error);
    }
  };

  const loadWorkflow = (workflow) => {
    setNodes(workflow.nodes || []);
    setConnections(workflow.connections || []);
    setTransform(workflow.transform || { x: 0, y: 0, scale: 1 });
    setWorkflowName(workflow.name);
    setSelectedNodes([]);
    setSelectedConnections([]);
    setSelectedNode(null);
    setShowLoadDialog(false);
  };

  // Load saved workflows on component mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    setSavedWorkflows(saved);
  }, []);

  const deleteSelectedItems = () => {
    if (selectedNodes.length > 0) {
      setNodes(prev => prev.filter(node => !selectedNodes.includes(node.id)));
      setConnections(prev => prev.filter(conn => 
        !selectedNodes.includes(conn.from) && !selectedNodes.includes(conn.to)
      ));
      setSelectedNodes([]);
      setSelectedNode(null);
    }
    
    if (selectedConnections.length > 0) {
      setConnections(prev => prev.filter(conn => !selectedConnections.includes(conn.id)));
      setSelectedConnections([]);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelectedItems();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, selectedConnections]);

  return (
    <div className="workflow-container">
      {/* Navigation Header */}
      <div className="workflow-header">
        <div className="workflow-header-left">
          <Link to="/" className="btn btn-secondary">← Back to Dashboard</Link>
          <h1 className="workflow-title">{workflowName}</h1>
        </div>
        <div className="workflow-header-right">
          <button 
            className="btn btn-secondary"
            onClick={() => setShowLoadDialog(true)}
          >
            📁 Load
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setShowSaveDialog(true)}
          >
            💾 Save
          </button>
        </div>
      </div>

      <div className="workflow-main">
        {/* Node Palette */}
        <div className="node-palette">
          <h3>Node Types</h3>
          <div className="palette-section">
            <h4>Available Integrations</h4>
            <div className="palette-info">
              <p>🚀 Ready for integrations!</p>
              <p>Node types will appear here when integrations are added.</p>
              <p>Supported node types: HTTP requests, database operations, file processing, and more.</p>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div 
          className="workflow-canvas"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
          }}
        >
          <div className="canvas-content">
            {nodes.length === 0 && (
              <div className="canvas-placeholder">
                <h3>Welcome to Workflow Builder</h3>
                <p>🎯 System is ready for integrations</p>
                <p>Node types will be available when integrations are implemented</p>
                <p>📖 Drag nodes from the palette to build workflows</p>
              </div>
            )}
            
            {/* Render nodes */}
            {nodes.map(node => (
              <div
                key={node.id}
                className={`workflow-node ${selectedNodes.includes(node.id) ? 'selected' : ''}`}
                style={{
                  left: node.x,
                  top: node.y
                }}
              >
                <div className="node-header">
                  <span className="node-icon">{node.icon}</span>
                  <span className="node-label">{node.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="properties-panel">
          {selectedNode ? (
            <div>
              <h3>Node Properties</h3>
              <p>Select a node to configure its properties.</p>
              <p>Configuration options will appear here based on the node type.</p>
            </div>
          ) : (
            <div>
              <h3>Workflow Builder</h3>
              <div className="panel-section">
                <h4>📊 System Status</h4>
                <div className="status-grid">
                  <div className="status-item">
                    <span className="status-label">Nodes:</span>
                    <span className="status-value">{nodes.length}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Connections:</span>
                    <span className="status-value">{connections.length}</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Workflow:</span>
                    <span className="status-value">{workflowName}</span>
                  </div>
                </div>
              </div>
              
              <div className="panel-section">
                <h4>🎯 Ready for Integration</h4>
                <p>The workflow system is ready for adding integrations like:</p>
                <ul>
                  <li>🌐 HTTP/API requests</li>
                  <li>📧 Email sending</li>
                  <li>🗄️ Database operations</li>
                  <li>📁 File processing</li>
                  <li>🔄 Data transformations</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Save Workflow</h3>
            <input 
              type="text" 
              placeholder="Workflow name"
              defaultValue={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => saveWorkflow()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Load Workflow</h3>
            <div className="workflow-list">
              {savedWorkflows.length === 0 ? (
                <p>No saved workflows found.</p>
              ) : (
                savedWorkflows.map(workflow => (
                  <div key={workflow.id} className="workflow-item">
                    <div className="workflow-info">
                      <h4>{workflow.name}</h4>
                      <small>{new Date(workflow.createdAt).toLocaleString()}</small>
                    </div>
                    <button 
                      className="btn btn-small btn-primary"
                      onClick={() => loadWorkflow(workflow)}
                    >
                      Load
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowLoadDialog(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Workflow;