import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { nodeSchemas, getAvailableTemplates, validateNodeConfig, getNodeInputSchema, processTemplates } from '../utils/nodeSchemas';
import '../styles.css';

function Workflow() {
  const [searchParams] = useSearchParams();
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
  const [nodeConfigs, setNodeConfigs] = useState({}); // Store node configurations
  const [configErrors, setConfigErrors] = useState({}); // Store validation errors
  const [tempInputValues, setTempInputValues] = useState({}); // Temporary input values
  const [listeningNodes, setListeningNodes] = useState(new Set()); // Track which nodes are listening
  const [recentMessages, setRecentMessages] = useState([]); // Store recent Telegram messages
  const [ngrokStatus, setNgrokStatus] = useState('unknown'); // Track ngrok status

  const handleDrop = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    // Adjust for current transform
    const x = (e.clientX - rect.left - transform.x) / transform.scale;
    const y = (e.clientY - rect.top - transform.y) / transform.scale;
    
    // Get node type from drag data (we'll need to set this up)
    const nodeType = e.dataTransfer.getData('nodeType') || 'telegram-send';
    
    const nodeConfig = {
      'telegram-trigger': { label: 'Telegram Trigger', icon: '🤖', hasInput: false, hasOutput: true },
      'telegram-send': { label: 'Telegram Send', icon: '📤', hasInput: true, hasOutput: true }
    };
    
    const config = nodeConfig[nodeType] || nodeConfig['telegram-send'];
    
    const newNode = {
      id: Date.now(),
      type: nodeType,
      x: x - 60, // Center the node
      y: y - 25,
      label: config.label,
      icon: config.icon,
      hasInput: config.hasInput,
      hasOutput: config.hasOutput
    };
    
    setNodes([...nodes, newNode]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handlePaletteDragStart = (e, nodeType) => {
    e.dataTransfer.setData('nodeType', nodeType);
  };

  const handlePortMouseDown = (e, nodeId, portType) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Port mouse down:', nodeId, portType);
    
    setIsConnecting(true);
    setConnectionStart({ nodeId, portType });
    
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasRect = document.getElementById('workflow-canvas').getBoundingClientRect();
    
    const startX = (rect.left + rect.width / 2 - canvasRect.left - transform.x) / transform.scale;
    const startY = (rect.top + rect.height / 2 - canvasRect.top - transform.y) / transform.scale;
    
    setTempConnection({
      startX,
      startY,
      endX: startX,
      endY: startY
    });
  };

  const handlePortMouseUp = (e, nodeId, portType) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('Port mouse up:', nodeId, portType, 'connecting:', isConnecting, 'start:', connectionStart);
    
    if (isConnecting && connectionStart && connectionStart.nodeId !== nodeId) {
      // Only allow output (+) -> input (●) connections
      if (connectionStart.portType === 'output' && portType === 'input') {
        // Check if connection already exists
        const connectionExists = connections.some(conn => 
          conn.from === connectionStart.nodeId && conn.to === nodeId
        );
        
        if (!connectionExists) {
          const newConnection = {
            id: Date.now(),
            from: connectionStart.nodeId,
            to: nodeId,
            fromPort: 'output',
            toPort: 'input'
          };
          
          console.log('Creating connection:', newConnection);
          setConnections(prev => [...prev, newConnection]);
        } else {
          console.log('Connection already exists');
        }
      } else {
        console.log('Invalid connection direction');
      }
    }
    
    setIsConnecting(false);
    setConnectionStart(null);
    setTempConnection(null);
  };

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    
    // Multi-select with Ctrl+click
    if (e.ctrlKey) {
      setSelectedNodes(prev => {
        if (prev.includes(nodeId)) {
          // Remove from selection
          const newSelection = prev.filter(id => id !== nodeId);
          setSelectedNode(newSelection.length === 1 ? newSelection[0] : null);
          return newSelection;
        } else {
          // Add to selection
          const newSelection = [...prev, nodeId];
          setSelectedNode(newSelection.length === 1 ? newSelection[0] : null);
          return newSelection;
        }
      });
    } else {
      // Single select
      setSelectedNodes([nodeId]);
      setSelectedNode(null); // Don't open config panel on single click
    }
    setSelectedConnections([]);
  };

  const handleNodeDoubleClick = (e, nodeId) => {
    e.stopPropagation();
    setSelectedNode(nodeId);
    setSelectedNodes([nodeId]);
    setSelectedConnections([]);
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    
    if (!selectedNodes.includes(nodeId)) {
      setSelectedNodes([nodeId]);
    }
    
    setIsDraggingNode(true);
    const canvasRect = document.getElementById('workflow-canvas').getBoundingClientRect();
    setDragStartPoint({
      x: (e.clientX - canvasRect.left - transform.x) / transform.scale,
      y: (e.clientY - canvasRect.top - transform.y) / transform.scale
    });
  };

  const handleConnectionClick = (e, connectionId) => {
    e.stopPropagation();
    setSelectedConnections([connectionId]);
    setSelectedNodes([]);
    setSelectedNode(null);
  };

  const handleMouseDown = (e) => {
    if (e.target.classList.contains('workflow-canvas') || e.target.classList.contains('nodes-layer')) {
      // Clear selections when clicking on empty canvas
      setSelectedNodes([]);
      setSelectedConnections([]);
      setSelectedNode(null);
      
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && !isDraggingNode) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      
      setTransform(prev => ({
        ...prev,
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
    
    // Handle node dragging
    if (isDraggingNode && selectedNodes.length > 0) {
      const canvasRect = document.getElementById('workflow-canvas').getBoundingClientRect();
      const currentX = (e.clientX - canvasRect.left - transform.x) / transform.scale;
      const currentY = (e.clientY - canvasRect.top - transform.y) / transform.scale;
      
      const deltaX = currentX - dragStartPoint.x;
      const deltaY = currentY - dragStartPoint.y;
      
      setNodes(prev => prev.map(node => {
        if (selectedNodes.includes(node.id)) {
          return {
            ...node,
            x: node.x + deltaX,
            y: node.y + deltaY
          };
        }
        return node;
      }));
      
      setDragStartPoint({ x: currentX, y: currentY });
    }
    
    // Update temp connection line while dragging
    if (isConnecting && tempConnection) {
      const canvasRect = document.getElementById('workflow-canvas').getBoundingClientRect();
      const endX = (e.clientX - canvasRect.left - transform.x) / transform.scale;
      const endY = (e.clientY - canvasRect.top - transform.y) / transform.scale;
      
      setTempConnection(prev => ({
        ...prev,
        endX,
        endY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsConnecting(false);
    setIsDraggingNode(false);
    setConnectionStart(null);
    setTempConnection(null);
  };

  const getNodePosition = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  const getPortPosition = (nodeId, portType) => {
    const node = getNodePosition(nodeId);
    const nodeWidth = 120; // Approximate node width
    const nodeHeight = 50; // Approximate node height
    
    if (portType === 'output') {
      return {
        x: node.x + nodeWidth + 12, // Account for button extending outside
        y: node.y + nodeHeight / 2
      };
    } else {
      return {
        x: node.x - 12, // Account for button extending outside
        y: node.y + nodeHeight / 2
      };
    }
  };

  const createPath = (start, end) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const cp1x = start.x + dx * 0.5;
    const cp2x = end.x - dx * 0.5;
    
    return `M ${start.x} ${start.y} C ${cp1x} ${start.y} ${cp2x} ${end.y} ${end.x} ${end.y}`;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(0.1, transform.scale + delta), 3);
    
    setTransform(prev => ({
      ...prev,
      scale: newScale
    }));
  };

  const zoomIn = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 3)
    }));
  };

  const zoomOut = () => {
    setTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale * 0.8, 0.1)
    }));
  };

  const resetView = () => {
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const deleteSelected = () => {
    // Delete selected nodes
    if (selectedNodes.length > 0) {
      setNodes(prev => prev.filter(node => !selectedNodes.includes(node.id)));
      
      // Also delete connections that involve deleted nodes
      setConnections(prev => prev.filter(conn => 
        !selectedNodes.includes(conn.from) && !selectedNodes.includes(conn.to)
      ));
      
      setSelectedNodes([]);
      setSelectedNode(null);
    }
    
    // Delete selected connections
    if (selectedConnections.length > 0) {
      setConnections(prev => prev.filter(conn => !selectedConnections.includes(conn.id)));
      setSelectedConnections([]);
    }
  };

  const copySelected = () => {
    if (selectedNodes.length > 0) {
      const nodesToCopy = nodes.filter(node => selectedNodes.includes(node.id));
      
      // Also copy connections between selected nodes
      const connectionsToCopy = connections.filter(conn => 
        selectedNodes.includes(conn.from) && selectedNodes.includes(conn.to)
      );
      
      const clipboardData = {
        nodes: nodesToCopy,
        connections: connectionsToCopy
      };
      
      setClipboard(clipboardData);
      
      // Copy JSON to system clipboard
      const jsonData = JSON.stringify(clipboardData, null, 2);
      navigator.clipboard.writeText(jsonData).catch(console.error);
    }
  };

  const pasteClipboard = () => {
    if (!clipboard || clipboard.nodes.length === 0) return;
    
    // Create ID mapping for copied nodes
    const idMap = new Map();
    const newNodes = clipboard.nodes.map(node => {
      const newId = Date.now() + Math.random();
      idMap.set(node.id, newId);
      
      return {
        ...node,
        id: newId,
        x: node.x + 50, // Offset to avoid overlap
        y: node.y + 50
      };
    });
    
    // Create new connections with updated IDs
    const newConnections = clipboard.connections.map(conn => ({
      ...conn,
      id: Date.now() + Math.random(),
      from: idMap.get(conn.from),
      to: idMap.get(conn.to)
    }));
    
    // Add to workflow
    setNodes(prev => [...prev, ...newNodes]);
    setConnections(prev => [...prev, ...newConnections]);
    
    // Select the newly pasted nodes
    setSelectedNodes(newNodes.map(node => node.id));
    setSelectedConnections([]);
  };

  const pasteFromJSON = (jsonText) => {
    try {
      const data = JSON.parse(jsonText);
      if (data.nodes && Array.isArray(data.nodes)) {
        // Create ID mapping for copied nodes
        const idMap = new Map();
        const newNodes = data.nodes.map(node => {
          const newId = Date.now() + Math.random();
          idMap.set(node.id, newId);
          
          return {
            ...node,
            id: newId,
            x: node.x + 50, // Offset to avoid overlap
            y: node.y + 50
          };
        });
        
        // Create new connections with updated IDs if they exist
        const newConnections = (data.connections || []).map(conn => ({
          ...conn,
          id: Date.now() + Math.random(),
          from: idMap.get(conn.from),
          to: idMap.get(conn.to)
        }));
        
        // Add to workflow
        setNodes(prev => [...prev, ...newNodes]);
        setConnections(prev => [...prev, ...newConnections]);
        
        // Select the newly pasted nodes
        setSelectedNodes(newNodes.map(node => node.id));
        setSelectedConnections([]);
        
        return true; // Success
      }
    } catch (error) {
      console.error('Failed to parse JSON:', error);
    }
    return false; // Failed
  };

  // Handle node configuration changes
  const updateNodeConfig = (nodeId, field, value) => {
    setNodeConfigs(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [field]: value
      }
    }));

    // Validate configuration
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const updatedConfig = {
        ...nodeConfigs[nodeId],
        [field]: value
      };
      const validation = validateNodeConfig(node.type, updatedConfig);
      
      setConfigErrors(prev => ({
        ...prev,
        [nodeId]: validation.errors
      }));
    }
  };

  // Get node configuration with defaults
  const getNodeConfig = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return {};

    const schema = nodeSchemas[node.type];
    const config = nodeConfigs[nodeId] || {};
    
    // Apply defaults
    const configWithDefaults = { ...config };
    if (schema?.parameters) {
      for (const [paramName, paramSchema] of Object.entries(schema.parameters)) {
        if (configWithDefaults[paramName] === undefined && paramSchema.default !== undefined) {
          configWithDefaults[paramName] = paramSchema.default;
        }
      }
    }
    
    return configWithDefaults;
  };

  // Get available templates for a node
  const getNodeTemplates = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    const inputSchema = getNodeInputSchema(nodeId, nodes, connections);
    return getAvailableTemplates(node.type, inputSchema);
  };

  // Handle temporary input changes
  const handleTempInputChange = (nodeId, fieldName, value) => {
    setTempInputValues(prev => ({
      ...prev,
      [`${nodeId}_${fieldName}`]: value
    }));
  };

  // Get temporary input value
  const getTempInputValue = (nodeId, fieldName) => {
    return tempInputValues[`${nodeId}_${fieldName}`] || '';
  };

  // Validate bot token using simplified endpoint
  const validateBotToken = async (nodeId) => {
    const botToken = getTempInputValue(nodeId, 'botToken');
    
    if (!botToken) {
      alert('Please enter a bot token first');
      return;
    }

    try {
      const response = await fetch('/api/webhooks/telegram-bot-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ botToken })
      });

      if (!response.ok) {
        // Handle non-200 responses
        let errorText;
        try {
          const errorResult = await response.json();
          errorText = errorResult.error?.description || errorResult.error || errorResult.message || 'Unknown error';
        } catch {
          errorText = `HTTP ${response.status}: ${response.statusText}`;
        }
        alert(`❌ Invalid bot token\n\nError: ${errorText}`);
        return;
      }

      const result = await response.json();
      
      // Handle successful response - check different response formats
      let bot;
      if (result.result && result.ok) {
        // Telegram API direct response format
        bot = result.result;
      } else if (result.id && result.first_name) {
        // Direct bot data response
        bot = result;
      } else if (result.success && result.botInfo) {
        // Wrapped response
        bot = result.botInfo;
      } else {
        // Unexpected response format
        console.log('Unexpected response:', result);
        alert('❌ Unexpected response format from server');
        return;
      }

      // Update the node to use the actual bot ID instead of generated node ID
      const actualBotId = bot.id.toString();
      const oldNodeId = nodeId;
      
      // Update nodes array
      setNodes(prevNodes => prevNodes.map(node => 
        node.id === oldNodeId ? { ...node, id: actualBotId } : node
      ));
      
      // Update connections to use new bot ID
      setConnections(prevConnections => prevConnections.map(conn => ({
        ...conn,
        from: conn.from === oldNodeId ? actualBotId : conn.from,
        to: conn.to === oldNodeId ? actualBotId : conn.to
      })));
      
      // Update node configurations
      setNodeConfigs(prevConfigs => {
        const newConfigs = { ...prevConfigs };
        if (newConfigs[oldNodeId]) {
          newConfigs[actualBotId] = { ...newConfigs[oldNodeId] };
          delete newConfigs[oldNodeId];
        }
        return newConfigs;
      });
      
      // Update temp input values
      setTempInputValues(prevValues => {
        const newValues = { ...prevValues };
        Object.keys(newValues).forEach(key => {
          if (key.startsWith(`${oldNodeId}_`)) {
            const fieldName = key.substring(oldNodeId.length + 1);
            newValues[`${actualBotId}_${fieldName}`] = newValues[key];
            delete newValues[key];
          }
        });
        return newValues;
      });
      
      // Update selected node if it was the one being updated
      if (selectedNode === oldNodeId) {
        setSelectedNode(actualBotId);
      }
      
      // Update selected nodes array if it contains the old node ID
      setSelectedNodes(prevSelected => 
        prevSelected.map(id => id === oldNodeId ? actualBotId : id)
      );
      
      alert(`✅ Bot token is valid!\n\nBot Name: ${bot.first_name}\nUsername: @${bot.username || 'N/A'}\nBot ID: ${bot.id}\n\n🔄 Node ID updated to use bot ID: ${actualBotId}`);
    } catch (error) {
      console.error('Error validating bot token:', error);
      alert('❌ Failed to validate bot token. Check your connection and try again.');
    }
  };

  // Show ngrok setup guide
  const showNgrokSetupGuide = () => {
    const guide = `🚀 ngrok Setup Guide

STEP 1: Install ngrok
Option A - NPM: npm install -g ngrok
Option B - Download: https://ngrok.com/download

STEP 2: Run ngrok
Open a new terminal and run:
→ ngrok http 3001

STEP 3: Copy HTTPS URL
You'll see output like:
Forwarding: https://abc123.ngrok.io -> http://localhost:3001

Copy the HTTPS URL (https://abc123.ngrok.io)

STEP 4: Paste URL
Come back here and paste it in the webhook URL field above.

STEP 5: Start Listening
Click "🎧 Start Listening for Messages" to register with Telegram.

STEP 6: Test!
Send a message to your bot @AI_MarketingTeambot and see it appear in Recent Messages!

💡 Keep ngrok running while testing. The URL changes each restart (unless you have a paid account).`;

    alert(guide);
    
    // Optional: Try to detect if ngrok is running
    setTimeout(() => {
      if (confirm('🔍 Want me to try detecting your ngrok URL automatically?')) {
        detectNgrokUrl();
      }
    }, 1000);
  };

  // Simplified ngrok detection
  const detectNgrokUrl = async () => {
    try {
      console.log('🔍 Attempting to detect ngrok URL...');
      
      const response = await fetch('http://127.0.0.1:4040/api/tunnels');
      const data = await response.json();
      
      const tunnel = data.tunnels?.find(t => 
        t.config?.addr === 'http://localhost:3001' && 
        t.public_url?.startsWith('https://')
      );
      
      if (tunnel?.public_url) {
        const ngrokUrl = tunnel.public_url;
        console.log('✅ Found ngrok URL:', ngrokUrl);
        
        if (selectedNode) {
          handleTempInputChange(selectedNode, 'webhookBaseUrl', ngrokUrl);
          alert(`✅ Auto-detected ngrok URL!\n\n${ngrokUrl}\n\nURL has been filled in automatically.`);
        }
        return ngrokUrl;
      } else {
        alert('❌ No ngrok tunnel found.\n\nMake sure ngrok is running with:\nngrok http 3001');
        return null;
      }
    } catch (error) {
      console.error('Could not detect ngrok:', error);
      alert('❌ Could not auto-detect ngrok.\n\nMake sure ngrok is running and try the manual setup.');
      return null;
    }
  };

  // Simplified ngrok status check
  useEffect(() => {
    setNgrokStatus('unknown');
  }, []);

  // Register current workflow with backend engine
  const registerCurrentWorkflowWithEngine = async (baseUrl = null) => {
    const currentWorkflow = {
      id: Date.now(), // Use timestamp as ID for current session
      name: 'Current Workflow',
      nodes: nodes,
      connections: connections,
      configs: nodeConfigs
    };

    console.log('📝 Registering current workflow:', currentWorkflow);

    // For production mode with custom baseUrl, register directly to that server
    const isProductionMode = baseUrl && baseUrl !== window.location.origin;
    const registrationUrl = isProductionMode 
      ? `${baseUrl}/api/webhooks/register-workflow`
      : '/api/webhooks/register-workflow';
    
    console.log(`📡 Registering workflow to: ${registrationUrl}`);

    const response = await fetch(registrationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currentWorkflow)
    });

    const result = await response.json();
    if (result.success) {
      console.log(`✅ Current workflow registered with backend`);
      return true;
    } else {
      console.error('Failed to register current workflow:', result.error);
      throw new Error(result.error || 'Failed to register workflow');
    }
  };

  // Start/Stop listening for Telegram messages
  const toggleTelegramListening = async (nodeId) => {
    const botToken = getTempInputValue(nodeId, 'botToken');
    const updateType = getTempInputValue(nodeId, 'updateType') || 'message';
    const command = getTempInputValue(nodeId, 'command');
    const devMode = getTempInputValue(nodeId, 'devMode') || 'local';
    const webhookBaseUrl = getTempInputValue(nodeId, 'webhookBaseUrl');
    
    if (!botToken) {
      alert('Please enter a bot token first');
      return;
    }

    const isListening = listeningNodes.has(nodeId);
    
    if (isListening) {
      // Stop listening
      setListeningNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
      console.log(`🛑 Stopped listening for node ${nodeId}`);
      alert('🛑 Stopped listening for Telegram messages');
      return;
    }

    // Start listening - different modes
    if (devMode === 'local') {
      // Local testing mode - simulate messages
      try {
        // Register the workflow first
        console.log('📝 Registering workflow for local testing...');
        await registerCurrentWorkflowWithEngine();
        
        // Register webhook config for local testing
        console.log('🔗 Registering webhook config for local testing...');
        const response = await fetch('/api/webhooks/register-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nodeId,
            botToken,
            updateType,
            command
          })
        });

        const webhookResult = await response.json();
        if (webhookResult.success) {
          console.log('✅ Webhook config registered for local testing');
        } else {
          console.warn('Warning: Could not register webhook config:', webhookResult.error);
        }
        
        setListeningNodes(prev => new Set(prev).add(nodeId));
        console.log(`🏠 Started local testing mode for node ${nodeId}`);
        alert('🏠 Started Local Testing Mode!\n\nClick "Send Test Message" below to simulate Telegram messages.');
        
        // Add test message functionality
        setTimeout(() => {
          if (confirm('🧪 Send a test message now?\n\nThis will simulate a message from Telegram.')) {
            simulateTestMessage(nodeId);
          }
        }, 1000);
      } catch (error) {
        console.error('Failed to register workflow:', error);
        alert('❌ Failed to register workflow. Check console for details.');
      }
      
    } else {
      // Production mode - real webhook registration
      if (!webhookBaseUrl) {
        alert('Please enter your ngrok URL first!\n\n1. Run: ngrok http 3001\n2. Copy the https://xxx.ngrok.io URL\n3. Paste it in the webhook URL field');
        return;
      }

      // Validate webhook URL format
      if (!webhookBaseUrl.startsWith('https://')) {
        alert('❌ Webhook URL must start with https://\n\nTelegram only accepts secure HTTPS URLs.');
        return;
      }

      if (webhookBaseUrl.includes('localhost')) {
        alert('❌ Webhook URL cannot contain localhost\n\nTelegram needs a public URL. Use ngrok or deploy to a server.');
        return;
      }

      try {
        console.log(`🎧 Starting to listen for node ${nodeId}...`);
        
        // Register the workflow first with the production backend
        console.log('📝 Registering workflow for production mode...');
        await registerCurrentWorkflowWithEngine(webhookBaseUrl);
        
        const result = await registerTelegramWebhook(nodeId, botToken, updateType, command, webhookBaseUrl);
        if (result) {
          setListeningNodes(prev => new Set(prev).add(nodeId));
          console.log(`✅ Now listening for Telegram messages on node ${nodeId}`);
          alert('🎧 Started listening for Telegram messages!\n\nSend a message to your bot to test.');
        }
      } catch (error) {
        console.error('Failed to start listening:', error);
        alert('❌ Failed to start listening. Check your bot token and ngrok URL.');
      }
    }
  };

  // Simulate a test message for local development
  const simulateTestMessage = async (nodeId) => {
    // First, register the workflow with the engine
    try {
      console.log('📝 Registering workflow with engine...');
      await registerCurrentWorkflowWithEngine();
    } catch (error) {
      console.warn('Warning: Could not register workflow:', error);
    }

    const testMessage = {
      message_id: Date.now(),
      from: {
        id: 123456789,
        is_bot: false,
        first_name: "Test",
        last_name: "User",
        username: "testuser"
      },
      chat: {
        id: 123456789,
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "Hello! This is a test message from the local simulator."
    };

    const telegramUpdate = {
      update_id: Date.now(),
      message: testMessage
    };

    try {
      console.log('🧪 Simulating test message to webhook:', `/api/webhooks/telegram-webhook/${nodeId}`);
      console.log('📦 Payload:', telegramUpdate);
      
      // Send to our webhook endpoint
      const response = await fetch(`/api/webhooks/telegram-webhook/${nodeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(telegramUpdate)
      });

      const responseText = await response.text();
      console.log('📨 Webhook response:', response.status, responseText);

      if (response.ok) {
        console.log('✅ Test message sent successfully');
        
        // Add message to recent messages list
        const messageData = {
          id: Date.now(),
          nodeId: nodeId,
          timestamp: new Date().toISOString(),
          type: 'test',
          data: telegramUpdate,
          status: 'received'
        };
        
        setRecentMessages(prev => [messageData, ...prev.slice(0, 9)]); // Keep only last 10 messages
        
        alert('✅ Test message sent!\n\nCheck the "Recent Messages" panel and console for details.');
      } else {
        console.error('❌ Failed to send test message:', response.status, responseText);
        alert(`❌ Failed to send test message.\n\nStatus: ${response.status}\nResponse: ${responseText}`);
      }
    } catch (error) {
      console.error('Error simulating test message:', error);
      alert('❌ Error simulating test message. Check the console for details.');
    }
  };

  const registerTelegramWebhook = async (nodeId, botToken, updateType, command, baseUrl) => {
    try {
      console.log(`🔗 Registering Telegram webhook for node ${nodeId}...`);
      
      // For production mode with custom baseUrl, register directly to that server
      const isProductionMode = baseUrl && baseUrl !== window.location.origin;
      const registrationUrl = isProductionMode 
        ? `${baseUrl}/api/webhooks/register-telegram-webhook`
        : '/api/webhooks/register-telegram-webhook';
      
      console.log(`📡 Registering to: ${registrationUrl}`);
      
      const response = await fetch(registrationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId,
          botToken,
          updateType,
          command,
          baseUrl
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Telegram webhook registered successfully for node ${nodeId}:`, {
          webhookUrl: result.webhookUrl,
          botInfo: result.botInfo,
          message: result.message
        });
        return result;
      } else if (response.status === 409) {
        // 409 means webhook already registered - treat as success
        console.log(`✅ Webhook already registered for node ${nodeId} - continuing...`);
        console.log('📋 Existing webhook status:', result);
        return { 
          success: true, 
          message: 'Webhook already registered',
          existingWebhook: true,
          status: result.status
        };
      } else {
        console.error('❌ Failed to register Telegram webhook:', result);
        alert(`Failed to register webhook: ${result.error || result.message}`);
        return null;
      }
    } catch (error) {
      console.error('Error registering webhook:', error);
      return null;
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

    // Register workflow with backend engine
    try {
      const response = await fetch('/api/webhooks/register-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workflow)
      });

      const result = await response.json();
      if (result.success) {
        console.log(`✅ Workflow registered with backend: ${workflow.name}`);
      } else {
        console.error('Failed to register workflow with backend:', result.error);
      }
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

  const deleteWorkflow = (workflowId) => {
    const saved = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    const updated = saved.filter(w => w.id !== workflowId);
    localStorage.setItem('savedWorkflows', JSON.stringify(updated));
    setSavedWorkflows(updated);
  };

  const newWorkflow = () => {
    setNodes([]);
    setConnections([]);
    setTransform({ x: 0, y: 0, scale: 1 });
    setWorkflowName('Untitled Workflow');
    setSelectedNodes([]);
    setSelectedConnections([]);
    setSelectedNode(null);
  };

  // Load saved workflows on component mount
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    setSavedWorkflows(saved);
    
    // Register existing workflows with backend
    saved.forEach(async (workflow) => {
      try {
        const response = await fetch('/api/webhooks/register-workflow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(workflow)
        });

        const result = await response.json();
        if (result.success) {
          console.log(`✅ Existing workflow registered: ${workflow.name}`);
        }
      } catch (error) {
        console.error('Error registering existing workflow:', error);
      }
    });
  }, []);

  // Check for load parameter in URL
  useEffect(() => {
    const loadId = searchParams.get('load');
    if (loadId) {
      const saved = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
      const workflowToLoad = saved.find(w => w.id === parseInt(loadId));
      if (workflowToLoad) {
        loadWorkflow(workflowToLoad);
      }
    }
  }, [searchParams]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if user is typing in an input field
      const isTypingInInput = (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.tagName === 'SELECT' ||
        e.target.isContentEditable ||
        e.target.closest('.config-panel-section') // If focus is anywhere in config panel
      );

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete nodes if NOT typing in an input field
        if (!isTypingInInput) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (e.ctrlKey && e.key === 'c') {
        if (!isTypingInInput) {
          e.preventDefault();
          copySelected();
        }
      } else if (e.ctrlKey && e.key === 'v') {
        if (!isTypingInInput) {
          e.preventDefault();
          pasteClipboard();
        }
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        setShowSaveDialog(true);
      } else if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        setShowLoadDialog(true);
      } else if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        newWorkflow();
      } else if (e.key === 'Escape') {
        // Close configuration panel with Escape key
        if (selectedNode) {
          setSelectedNode(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, selectedConnections, nodes, connections, clipboard]);

  return (
    <div className="workflow-container">
      <div className="workflow-header">
        <div className="workflow-title-section">
          <h1>Workflow Builder</h1>
          <span className="workflow-name">📋 {workflowName}</span>
        </div>
        <div className="workflow-actions">
          <button onClick={newWorkflow} className="btn btn-secondary">📄 New</button>
          <button onClick={() => setShowSaveDialog(true)} className="btn btn-secondary">💾 Save</button>
          <button onClick={() => setShowLoadDialog(true)} className="btn btn-secondary">📁 Load</button>
          <div className="workflow-zoom-controls">
            <button onClick={zoomOut} className="btn btn-secondary">−</button>
            <span style={{ padding: '0 1rem', color: '#4a5568', fontWeight: '500' }}>
              {Math.round(transform.scale * 100)}%
            </span>
            <button onClick={zoomIn} className="btn btn-secondary">+</button>
            <button onClick={resetView} className="btn btn-secondary">Reset View</button>
          </div>
          <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      <div className="workflow-editor">
        {/* Sidebar for tools */}
        <div className="workflow-sidebar">
          <h3>Nodes</h3>
          <div className="node-palette">
            <div 
              className="palette-node telegram-trigger" 
              draggable 
              data-node-type="telegram-trigger"
              onDragStart={(e) => handlePaletteDragStart(e, 'telegram-trigger')}
            >
              🤖 Telegram Trigger
            </div>
            <div 
              className="palette-node telegram-send" 
              draggable 
              data-node-type="telegram-send"
              onDragStart={(e) => handlePaletteDragStart(e, 'telegram-send')}
            >
              📤 Telegram Send
            </div>
          </div>

          <h3 style={{ marginTop: '2rem' }}>Import JSON</h3>
          <div className="json-import-section">
            <textarea
              className="json-import-textarea"
              placeholder="Paste node JSON here..."
              onPaste={(e) => {
                setTimeout(() => {
                  const jsonText = e.target.value;
                  if (jsonText.trim()) {
                    const success = pasteFromJSON(jsonText);
                    if (success) {
                      e.target.value = ''; // Clear on success
                    }
                  }
                }, 100);
              }}
              rows={6}
            />
            <p className="json-import-hint">
              💡 Copy nodes with Ctrl+C, then paste JSON here
            </p>
          </div>

          <h3 style={{ marginTop: '2rem' }}>📨 Recent Messages</h3>
          <div className="recent-messages-section">
            {recentMessages.length === 0 ? (
              <div style={{ 
                padding: '1rem', 
                textAlign: 'center', 
                color: '#718096',
                background: '#f7fafc',
                borderRadius: '6px',
                border: '1px dashed #cbd5e0'
              }}>
                <p>📭 No messages received yet</p>
                <small>Start listening on a Telegram Trigger node and send a test message</small>
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {recentMessages.map(msg => (
                  <div key={msg.id} style={{
                    background: '#f0f4f8',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ fontWeight: 'bold', color: '#2d3748' }}>
                        {msg.type === 'test' ? '🧪 Test' : '📱 Real'} Message
                      </span>
                      <span style={{ color: '#718096', fontSize: '0.7rem' }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ color: '#4a5568', marginBottom: '0.25rem' }}>
                      <strong>From:</strong> {msg.data.message?.from?.first_name || 'Unknown'}
                    </div>
                    <div style={{ color: '#4a5568', marginBottom: '0.25rem' }}>
                      <strong>Text:</strong> {msg.data.message?.text || 'No text'}
                    </div>
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary style={{ cursor: 'pointer', color: '#667eea' }}>
                        📋 View JSON Data
                      </summary>
                      <pre style={{ 
                        background: '#2d3748', 
                        color: '#e2e8f0', 
                        padding: '0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        overflow: 'auto',
                        marginTop: '0.25rem'
                      }}>
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
            
            {recentMessages.length > 0 && (
              <button 
                className="btn btn-secondary"
                onClick={() => setRecentMessages([])}
                style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.8rem' }}
              >
                🗑️ Clear Messages
              </button>
            )}
          </div>

          <h3 style={{ marginTop: '2rem' }}>🧪 Test Telegram</h3>
          <div className="telegram-test-section">
            <div className="config-field">
              <label>Bot Token:</label>
              <input
                type="password"
                className="form-input"
                placeholder="123456:ABC-DEF..."
                id="test-bot-token"
              />
            </div>
            <div className="config-field">
              <label>Chat ID:</label>
              <input
                type="text"
                className="form-input"
                placeholder="@channel or 123456789"
                id="test-chat-id"
              />
            </div>
            <div className="config-field">
              <label>Test Message:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Hello from workflow!"
                id="test-message"
                defaultValue="🤖 Test message from workflow builder"
              />
            </div>
            <button
              onClick={async () => {
                const token = document.getElementById('test-bot-token').value;
                const chatId = document.getElementById('test-chat-id').value;
                const message = document.getElementById('test-message').value;
                
                if (!token || !chatId || !message) {
                  alert('Please fill all fields');
                  return;
                }
                
                try {
                  const response = await fetch('/api/webhooks/test-telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ botToken: token, chatId, message })
                  });
                  
                  const result = await response.json();
                  if (result.success) {
                    alert(`✅ Message sent! Message ID: ${result.messageResult.result.message_id}`);
                  } else {
                    alert(`❌ Error: ${result.error}`);
                  }
                } catch (error) {
                  alert(`❌ Network error: ${error.message}`);
                }
              }}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              🚀 Send Test Message
            </button>
          </div>
        </div>

        {/* Main canvas area */}
        <div className="workflow-canvas-container">
          <div 
            className="workflow-canvas" 
            id="workflow-canvas"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{
              cursor: isPanning ? 'grabbing' : 'grab'
            }}
          >
            <svg 
              className="connections-layer"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
              }}
            >
              {/* Existing connections */}
              {connections.map(connection => {
                const start = getPortPosition(connection.from, 'output');
                const end = getPortPosition(connection.to, 'input');
                const isSelected = selectedConnections.includes(connection.id);
                return (
                  <path
                    key={connection.id}
                    d={createPath(start, end)}
                    stroke={isSelected ? "#f56565" : "#667eea"}
                    strokeWidth={isSelected ? "3" : "2"}
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                    onClick={(e) => handleConnectionClick(e, connection.id)}
                  />
                );
              })}
              
              {/* Temporary connection while dragging */}
              {tempConnection && (
                <path
                  d={createPath(
                    { x: tempConnection.startX, y: tempConnection.startY },
                    { x: tempConnection.endX, y: tempConnection.endY }
                  )}
                  stroke="#667eea"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                />
              )}
              
              {/* Arrow marker definition */}
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
                    fill="#667eea"
                  />
                </marker>
              </defs>
            </svg>
            <div 
              className="nodes-layer"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`
              }}
            >
              {nodes.map(node => (
                <div
                  key={node.id}
                  data-node-id={node.id}
                  data-node-type={node.type}
                  className={`workflow-node ${selectedNodes.includes(node.id) ? 'selected' : ''} ${isDraggingNode && selectedNodes.includes(node.id) ? 'dragging' : ''} ${selectedNode ? 'config-panel-open' : ''}`}
                  style={{ left: node.x, top: node.y }}
                  onClick={(e) => handleNodeClick(e, node.id)}
                  onDoubleClick={(e) => handleNodeDoubleClick(e, node.id)}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                >
                  <div className="node-content">
                    {node.icon} {node.label}
                  </div>
                  <div className="node-ports">
                    {node.hasInput && (
                      <button 
                        className="node-port-button input-button"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handlePortMouseDown(e, node.id, 'input');
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          handlePortMouseUp(e, node.id, 'input');
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title="Input port"
                      >
                        ●
                      </button>
                    )}
                    {node.hasOutput && (
                      <button 
                        className="node-port-button output-button"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handlePortMouseDown(e, node.id, 'output');
                        }}
                        onMouseUp={(e) => {
                          e.stopPropagation();
                          handlePortMouseUp(e, node.id, 'output');
                        }}
                        onClick={(e) => e.stopPropagation()}
                        title="Output port"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Config Panel */}
        {selectedNode && (
          <div className="workflow-config-panel">
            <div className="config-header">
              <h2>Node Configuration - {(() => {
                const node = nodes.find(n => n.id === selectedNode);
                return node ? `${node.icon} ${node.label}` : '';
              })()}</h2>
              <button 
                className="btn btn-secondary" 
                onClick={() => setSelectedNode(null)}
                style={{ padding: '0.5rem 1rem' }}
              >
                Close ×
              </button>
            </div>
            <div className="config-content">
              {(() => {
                const node = nodes.find(n => n.id === selectedNode);
                return node ? (
                  <div className="config-sections">
                    {/* Input Section - LEFT */}
                    <div className="config-panel-section">
                      <h3>🔽 Input</h3>
                      <div className="section-content">
                        {node.hasInput ? (
                          <div>
                            {node.type === 'telegram-send' ? (
                              <div>
                                <div className="config-field">
                                  <label>Input Type:</label>
                                  <input 
                                    type="text"
                                    className="form-input" 
                                    value="JSON Object"
                                    readOnly
                                    style={{ background: '#f0f4f8' }}
                                  />
                                </div>
                                <div className="config-field">
                                  <label>Expected Input JSON:</label>
                                  <textarea 
                                    className="form-input" 
                                    rows="8" 
                                    readOnly
                                    style={{ background: '#f0f4f8', fontFamily: 'monospace', fontSize: '0.75rem' }}
                                    value={JSON.stringify({
                                      "message": {
                                        "text": "Hello from workflow!",
                                        "from": {
                                          "id": 987654321,
                                          "username": "johnsmith"
                                        },
                                        "chat": {
                                          "id": 987654321
                                        }
                                      }
                                    }, null, 2)}
                                  />
                                </div>
                                <div className="config-field">
                                  <label>Available Data:</label>
                                  <div style={{ 
                                    background: '#f0f4f8', 
                                    padding: '0.75rem', 
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontFamily: 'monospace'
                                  }}>
                                    <div>From previous nodes or trigger:</div>
                                    <div>• Text content</div>
                                    <div>• User information</div>
                                    <div>• Chat details</div>
                                    <div>• Any processed data</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="config-field">
                                  <label>Input Type:</label>
                                  <select className="form-input">
                                    <option>Any</option>
                                    <option>String</option>
                                    <option>Number</option>
                                    <option>Object</option>
                                    <option>Array</option>
                                  </select>
                                </div>
                                <div className="config-field">
                                  <label>Required:</label>
                                  <input type="checkbox" defaultChecked />
                                </div>
                                <div className="config-field">
                                  <label>Description:</label>
                                  <textarea 
                                    className="form-input" 
                                    rows="3" 
                                    placeholder="Describe what this input expects..."
                                  ></textarea>
                                </div>
                                <div className="config-field">
                                  <label>Example Input:</label>
                                  <textarea 
                                    className="form-input" 
                                    rows="3" 
                                    placeholder='{"data": "example value"}'
                                  ></textarea>
                                </div>
                                <div className="config-field">
                                  <label>Validation:</label>
                                  <textarea 
                                    className="form-input" 
                                    rows="2" 
                                    placeholder="Input validation rules..."
                                  ></textarea>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p style={{ color: '#718096', fontStyle: 'italic', marginBottom: '1rem' }}>
                              🔥 This is a trigger node - no input required
                            </p>
                            <div className="config-field">
                              <label>Trigger receives data from:</label>
                              <div style={{ 
                                background: '#f0f4f8', 
                                padding: '0.75rem', 
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                color: '#4a5568'
                              }}>
                                {node.type === 'telegram-trigger' ? (
                                  "🤖 Telegram webhook calls"
                                ) : (
                                  "External source or manual trigger"
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Settings Section - MIDDLE */}
                    <div className="config-panel-section">
                      <h3>⚙️ Parameters & Settings</h3>
                      <div className="section-content">
                        {node.type === 'telegram-trigger' ? (
                          <div>
                            <div className="config-field">
                              <label>Bot Token:</label>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                  type="password"
                                  className="form-input" 
                                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                  value={getTempInputValue(selectedNode, 'botToken')}
                                  onChange={(e) => handleTempInputChange(selectedNode, 'botToken', e.target.value)}
                                  style={{ flex: 1 }}
                                />
                                <button 
                                  className="btn btn-secondary"
                                  onClick={() => validateBotToken(selectedNode)}
                                  style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                  disabled={!getTempInputValue(selectedNode, 'botToken')}
                                >
                                  ✅ Check
                                </button>
                              </div>
                            </div>
                            <div className="config-field">
                              <label>Update Type:</label>
                              <select 
                                className="form-input"
                                value={getTempInputValue(selectedNode, 'updateType')}
                                onChange={(e) => handleTempInputChange(selectedNode, 'updateType', e.target.value)}
                              >
                                <option value="message">Any Message</option>
                                <option value="command">Specific Command</option>
                                <option value="callback_query">Callback Query</option>
                              </select>
                            </div>
                            <div className="config-field">
                              <label>Command (if specific):</label>
                              <input 
                                type="text"
                                className="form-input" 
                                placeholder="/start"
                                value={getTempInputValue(selectedNode, 'command')}
                                onChange={(e) => handleTempInputChange(selectedNode, 'command', e.target.value)}
                              />
                              <small style={{ color: '#718096', fontSize: '0.8rem' }}>
                                Only used when Update Type is "Specific Command"
                              </small>
                            </div>
                            <div className="config-field">
                              <label>Webhook Path:</label>
                              <input 
                                type="text"
                                className="form-input" 
                                value={`telegram-webhook-${node.id}`}
                                readOnly
                                style={{ background: '#f0f4f8' }}
                              />
                              <small style={{ color: '#718096', fontSize: '0.8rem' }}>
                                Auto-generated webhook endpoint
                              </small>
                            </div>
                            <div className="config-field">
                              <label>🌐 Development Mode:</label>
                              <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                  <input 
                                    type="radio" 
                                    name={`devMode_${selectedNode}`}
                                    value="local"
                                    checked={getTempInputValue(selectedNode, 'devMode') !== 'production'}
                                    onChange={() => handleTempInputChange(selectedNode, 'devMode', 'local')}
                                  />
                                  🏠 Local Testing (mock messages)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <input 
                                    type="radio" 
                                    name={`devMode_${selectedNode}`}
                                    value="production"
                                    checked={getTempInputValue(selectedNode, 'devMode') === 'production'}
                                    onChange={() => handleTempInputChange(selectedNode, 'devMode', 'production')}
                                  />
                                  🌐 Production (real Telegram webhooks)
                                </label>
                              </div>
                              
                              {getTempInputValue(selectedNode, 'devMode') === 'production' && (
                                <>
                                  <label>Public Webhook URL (ngrok/domain):</label>
                                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input 
                                      type="text"
                                      className="form-input" 
                                      placeholder="https://your-ngrok-url.ngrok.io or your domain"
                                      value={getTempInputValue(selectedNode, 'webhookBaseUrl')}
                                      onChange={(e) => handleTempInputChange(selectedNode, 'webhookBaseUrl', e.target.value)}
                                      style={{ flex: 1 }}
                                    />
                                    <button 
                                      className="btn btn-secondary"
                                      onClick={() => showNgrokSetupGuide()}
                                      style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                    >
                                      🚀 Setup ngrok
                                    </button>
                                  </div>
                                  <small style={{ color: '#718096', fontSize: '0.8rem', display: 'block' }}>
                                    📖 Telegram requires HTTPS and public domains. Click "Setup ngrok" for help!
                                  </small>
                                </>
                              )}
                              
                              {getTempInputValue(selectedNode, 'devMode') !== 'production' && (
                                <div style={{ 
                                  background: '#e7f3ff', 
                                  padding: '1rem', 
                                  borderRadius: '6px',
                                  border: '1px solid #b3d9ff'
                                }}>
                                  <strong>🏠 Local Testing Mode</strong>
                                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                                    Simulates Telegram messages without needing ngrok. Perfect for development!
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="config-field">
                              <label>Generated Webhook URL:</label>
                              <div style={{ 
                                background: '#f0f4f8', 
                                padding: '0.75rem', 
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                                wordBreak: 'break-all',
                                color: getTempInputValue(selectedNode, 'webhookBaseUrl') ? '#333' : '#999'
                              }}>
                                {getTempInputValue(selectedNode, 'webhookBaseUrl') ? 
                                  `${getTempInputValue(selectedNode, 'webhookBaseUrl')}/api/webhooks/telegram-webhook/${node.id}` :
                                  'Enter ngrok URL above to see webhook URL'
                                }
                              </div>
                              <small style={{ color: '#718096', fontSize: '0.8rem' }}>
                                This is the URL that will be registered with Telegram
                              </small>
                            </div>
                            
                            {/* Start/Stop Listening Button */}
                            <div className="config-field" style={{ marginTop: '1.5rem' }}>
                              <button 
                                className={`btn ${listeningNodes.has(selectedNode) ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => toggleTelegramListening(selectedNode)}
                                disabled={!getTempInputValue(selectedNode, 'botToken') || (!listeningNodes.has(selectedNode) && getTempInputValue(selectedNode, 'devMode') === 'production' && !getTempInputValue(selectedNode, 'webhookBaseUrl'))}
                                style={{ 
                                  width: '100%', 
                                  padding: '0.75rem',
                                  fontSize: '1rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                {listeningNodes.has(selectedNode) ? (
                                  <>🛑 Stop Listening</>
                                ) : (
                                  <>🎧 Start Listening for Messages</>
                                )}
                              </button>
                              <small style={{ color: '#718096', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                                {listeningNodes.has(selectedNode) ? 
                                  (getTempInputValue(selectedNode, 'devMode') === 'production' ? 
                                    'Your bot is actively listening for Telegram messages' :
                                    'Local testing mode is active'
                                  ) : 
                                  'Click to start receiving Telegram messages'
                                }
                              </small>
                              
                              {/* Test Message Button for Local Mode */}
                              {listeningNodes.has(selectedNode) && getTempInputValue(selectedNode, 'devMode') !== 'production' && (
                                <button 
                                  className="btn btn-secondary"
                                  onClick={() => simulateTestMessage(selectedNode)}
                                  style={{ 
                                    width: '100%', 
                                    padding: '0.5rem',
                                    fontSize: '0.9rem',
                                    marginTop: '0.5rem'
                                  }}
                                >
                                  🧪 Send Test Message
                                </button>
                              )}
                            </div>
                          </div>
                        ) : node.type === 'telegram-send' ? (
                          <div>
                            <div className="config-field">
                              <label>Bot Token:</label>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                  type="password"
                                  className="form-input" 
                                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                  value={getTempInputValue(selectedNode, 'botToken')}
                                  onChange={(e) => handleTempInputChange(selectedNode, 'botToken', e.target.value)}
                                  style={{ flex: 1 }}
                                />
                                <button 
                                  className="btn btn-secondary"
                                  onClick={() => validateBotToken(selectedNode)}
                                  style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                  disabled={!getTempInputValue(selectedNode, 'botToken')}
                                >
                                  ✅ Check
                                </button>
                              </div>
                            </div>
                            <div className="config-field">
                              <label>Chat ID:</label>
                              <input 
                                type="text"
                                className="form-input" 
                                placeholder="@yourchannel or 987654321"
                                value={getTempInputValue(selectedNode, 'chatId')}
                                onChange={(e) => handleTempInputChange(selectedNode, 'chatId', e.target.value)}
                              />
                              <small style={{ color: '#718096', fontSize: '0.8rem' }}>
                                Use template: {'{{message.chat.id}}'} for reply to sender
                              </small>
                            </div>
                            <div className="config-field">
                              <label>Message Text:</label>
                              <textarea 
                                className="form-input" 
                                rows="4" 
                                placeholder="Hello {{message.from.username}}! You said: {{message.text}}"
                                value={getTempInputValue(selectedNode, 'messageText')}
                                onChange={(e) => handleTempInputChange(selectedNode, 'messageText', e.target.value)}
                              />
                              <small style={{ color: '#718096', fontSize: '0.8rem' }}>
                                Supports templates from input data
                              </small>
                            </div>
                            <div className="config-field">
                              <label>Parse Mode:</label>
                              <select 
                                className="form-input"
                                value={getTempInputValue(selectedNode, 'parseMode')}
                                onChange={(e) => handleTempInputChange(selectedNode, 'parseMode', e.target.value)}
                              >
                                <option value="">Plain Text</option>
                                <option value="Markdown">Markdown</option>
                                <option value="HTML">HTML</option>
                              </select>
                            </div>
                            <div className="config-field">
                              <label>Disable Web Page Preview:</label>
                              <input 
                                type="checkbox" 
                                checked={getTempInputValue(selectedNode, 'disableWebPagePreview') === true}
                                onChange={(e) => handleTempInputChange(selectedNode, 'disableWebPagePreview', e.target.checked)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div>
                            {/* Default settings for other node types */}
                          </div>
                        )}
                        
                        {/* Common settings for all nodes */}
                        <div style={{ 
                          marginTop: (node.type === 'telegram-trigger' || node.type === 'telegram-send') ? '2rem' : '0', 
                          paddingTop: (node.type === 'telegram-trigger' || node.type === 'telegram-send') ? '1rem' : '0', 
                          borderTop: (node.type === 'telegram-trigger' || node.type === 'telegram-send') ? '1px solid #e2e8f0' : 'none' 
                        }}>
                          <div className="config-field">
                            <label>Node Name:</label>
                            <input 
                              type="text" 
                              value={node.label} 
                              onChange={(e) => {
                                setNodes(prev => prev.map(n => 
                                  n.id === selectedNode 
                                    ? { ...n, label: e.target.value }
                                    : n
                                ));
                              }}
                              className="form-input"
                            />
                          </div>
                          <div className="config-field">
                            <label>Description:</label>
                            <textarea 
                              className="form-input" 
                              rows="2" 
                              placeholder="What does this node do?"
                            ></textarea>
                          </div>
                          <div className="config-field">
                            <label>Timeout (ms):</label>
                            <input 
                              type="number" 
                              className="form-input" 
                              defaultValue="5000"
                            />
                          </div>
                          <div className="config-field">
                            <label>Enable Logging:</label>
                            <input type="checkbox" defaultChecked />
                          </div>
                          <div className="config-field">
                            <label>Debug Info:</label>
                            <div style={{ fontSize: '0.8rem', color: '#4a5568' }}>
                              <div>ID: <code>{node.id}</code></div>
                              <div>Type: <code>{node.type}</code></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Output Section - RIGHT */}
                    <div className="config-panel-section">
                      <h3>🔼 Output</h3>
                      <div className="section-content">
                        {node.hasOutput ? (
                          <div>
                            {node.type === 'telegram-trigger' ? (
                              <div>
                                <div className="config-field">
                                  <label>Output Type:</label>
                                  <input 
                                    type="text"
                                    className="form-input" 
                                    value="JSON Object"
                                    readOnly
                                    style={{ background: '#f0f4f8' }}
                                  />
                                </div>
                                <div className="config-field">
                                  <label>Output JSON Structure:</label>
                                  <textarea 
                                    className="form-input" 
                                    rows="12" 
                                    readOnly
                                    style={{ background: '#f0f4f8', fontFamily: 'monospace', fontSize: '0.75rem' }}
                                    value={JSON.stringify({
                                      "update_id": 123456789,
                                      "message": {
                                        "message_id": 123,
                                        "from": {
                                          "id": 987654321,
                                          "first_name": "John",
                                          "username": "johnsmith"
                                        },
                                        "chat": {
                                          "id": 987654321,
                                          "type": "private"
                                        },
                                        "date": 1640995200,
                                        "text": "/start"
                                      }
                                    }, null, 2)}
                                  />
                                </div>
                                <div className="config-field">
                                  <label>Template Usage:</label>
                                  <div style={{ 
                                    background: '#f0f4f8', 
                                    padding: '0.75rem', 
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontFamily: 'monospace'
                                  }}>
                                    <div>{'{{message.text}}'} → Message content</div>
                                    <div>{'{{message.from.id}}'} → User ID</div>
                                    <div>{'{{message.chat.id}}'} → Chat ID</div>
                                    <div>{'{{message.from.username}}'} → Username</div>
                                  </div>
                                </div>
                              </div>
                            ) : node.type === 'telegram-send' ? (
                              <div>
                                <div className="config-field">
                                  <label>Output Type:</label>
                                  <input 
                                    type="text"
                                    className="form-input" 
                                    value="JSON Object"
                                    readOnly
                                    style={{ background: '#f0f4f8' }}
                                  />
                                </div>
                                <div className="config-field">
                                  <label>Output JSON Structure:</label>
                                  <textarea 
                                    className="form-input" 
                                    rows="10" 
                                    readOnly
                                    style={{ background: '#f0f4f8', fontFamily: 'monospace', fontSize: '0.75rem' }}
                                    value={JSON.stringify({
                                      "ok": true,
                                      "result": {
                                        "message_id": 456,
                                        "from": {
                                          "id": 123456789,
                                          "is_bot": true,
                                          "first_name": "YourBot",
                                          "username": "your_bot"
                                        },
                                        "chat": {
                                          "id": 987654321,
                                          "type": "private"
                                        },
                                        "date": 1640995260,
                                        "text": "Hello John! You said: /start"
                                      }
                                    }, null, 2)}
                                  />
                                </div>
                                <div className="config-field">
                                  <label>Available for Next Nodes:</label>
                                  <div style={{ 
                                    background: '#f0f4f8', 
                                    padding: '0.75rem', 
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontFamily: 'monospace'
                                  }}>
                                    <div>{'{{result.message_id}}'} → Sent message ID</div>
                                    <div>{'{{result.text}}'} → Sent message text</div>
                                    <div>{'{{ok}}'} → Success status</div>
                                    <div>{'{{result.date}}'} → Timestamp</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="config-field">
                                  <label>Output Type:</label>
                                  <select className="form-input">
                                    <option>Any</option>
                                    <option>String</option>
                                    <option>Number</option>
                                    <option>Object</option>
                                    <option>Array</option>
                                    <option>Boolean</option>
                                  </select>
                                </div>
                                <div className="config-field">
                                  <label>Sample Output:</label>
                                  <textarea 
                                    className="form-input" 
                                    rows="4" 
                                    placeholder='{"result": "success", "data": {...}}'
                                  ></textarea>
                                </div>
                                <div className="config-field">
                                  <label>Output Description:</label>
                                  <textarea 
                                    className="form-input" 
                                    rows="3" 
                                    placeholder="Describe what this node outputs..."
                                  ></textarea>
                                </div>
                                <div className="config-field">
                                  <label>Output Format:</label>
                                  <select className="form-input">
                                    <option>JSON</option>
                                    <option>Plain Text</option>
                                    <option>XML</option>
                                    <option>CSV</option>
                                    <option>Custom</option>
                                  </select>
                                </div>
                                <div className="config-field">
                                  <label>Post-processing:</label>
                                  <textarea 
                                    className="form-input" 
                                    rows="2" 
                                    placeholder="Transform output data..."
                                  ></textarea>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p style={{ color: '#718096', fontStyle: 'italic' }}>
                            This node doesn't have an output port
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        )}

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>💾 Save Workflow</h3>
                <button onClick={() => setShowSaveDialog(false)} className="modal-close">×</button>
              </div>
              <div className="modal-content">
                <div className="form-group">
                  <label>Workflow Name:</label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="form-input"
                    placeholder="Enter workflow name..."
                    autoFocus
                  />
                </div>
                <div className="workflow-stats">
                  <span>📊 {nodes.length} nodes, {connections.length} connections</span>
                </div>
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowSaveDialog(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={() => saveWorkflow()} className="btn btn-primary">💾 Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Load Dialog */}
        {showLoadDialog && (
          <div className="modal-overlay" onClick={() => setShowLoadDialog(false)}>
            <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📁 Load Workflow</h3>
                <button onClick={() => setShowLoadDialog(false)} className="modal-close">×</button>
              </div>
              <div className="modal-content">
                {savedWorkflows.length === 0 ? (
                  <div className="empty-state">
                    <p>📭 No saved workflows found</p>
                    <p style={{ color: '#718096', fontSize: '0.9rem' }}>Create and save your first workflow!</p>
                  </div>
                ) : (
                  <div className="workflows-grid">
                    {savedWorkflows.map(workflow => (
                      <div key={workflow.id} className="workflow-item">
                        <div className="workflow-item-header">
                          <h4>{workflow.name}</h4>
                          <button 
                            onClick={() => deleteWorkflow(workflow.id)}
                            className="delete-workflow-btn"
                            title="Delete workflow"
                          >
                            🗑️
                          </button>
                        </div>
                        <div className="workflow-item-meta">
                          <span>📊 {workflow.nodes?.length || 0} nodes, {workflow.connections?.length || 0} connections</span>
                          <span>📅 {new Date(workflow.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="workflow-item-actions">
                          <button 
                            onClick={() => loadWorkflow(workflow)}
                            className="btn btn-primary"
                          >
                            📁 Load
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowLoadDialog(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Workflow;