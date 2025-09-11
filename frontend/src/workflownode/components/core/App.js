/*
=================================================================
FILE: frontend/src/components/App.js (UPDATED)
=================================================================
This component has been updated to pass the full list of nodes and
edges to the ConfigPanel, enabling it to trace connections and
fetch data from previous nodes.
*/
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import { CustomLogicNode } from '../nodes';
import { ConfigPanel } from '../panels';
import FloatingChatbot from '../widgets/FloatingChatbot';
import { getId } from '../../utils';
import WorkflowExecutor from '../../utils/workflowExecutor';
import { API_BASE_URL } from '../../../config/api.js';
import '../../styles/index.css';

// Register the custom node type so ReactFlow knows how to render it.
const nodeTypes = { custom: CustomLogicNode };

// API base URL
const API_BASE = API_BASE_URL;

const App = ({ botContext }) => {
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState(null);
  const [isActivated, setIsActivated] = useState(false);
  const [executionProgress, setExecutionProgress] = useState('');
  const [workflowExecutor, setWorkflowExecutor] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  // Custom nodes change handler that protects certain nodes from deletion
  const handleNodesChange = useCallback((changes) => {
    // Filter out deletion changes for protected nodes
    const filteredChanges = changes.filter(change => {
      if (change.type === 'remove') {
        const nodeToRemove = nodes.find(node => node.id === change.id);
        if (nodeToRemove?.data?.isProtected) {
          console.log(`🔒 Protected node "${nodeToRemove.data.label}" cannot be deleted`);
          return false; // Prevent deletion
        }
      }
      return true;
    });
    
    onNodesChange(filteredChanges);
  }, [nodes, onNodesChange]);
  
  // Custom workflow name change handler that protects Telegram Workflow
  const handleWorkflowNameChange = useCallback((newName) => {
    // Check if current workflow is the protected Telegram Workflow
    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    const currentWorkflow = savedWorkflows.find(w => w.id === currentWorkflowId);
    
    if (currentWorkflow?.name === 'Telegram Workflow' && newName !== 'Telegram Workflow') {
      console.log('🔒 Cannot rename protected "Telegram Workflow"');
      return; // Prevent renaming
    }
    
    setWorkflowName(newName);
  }, [currentWorkflowId]);
  
  // Floating Chatbot state
  const [activeChatbots, setActiveChatbots] = useState([]);

  // Generate a unique, readable workflow ID (moved to top to fix hoisting issue)
  const generateWorkflowId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const cleanName = workflowName.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')  // Remove special characters
      .replace(/\s+/g, '-')         // Replace spaces with hyphens
      .substring(0, 20);            // Limit length
    return `${cleanName || 'workflow'}-${random}`;
  }, [workflowName]);

  // Create a snapshot of current state for comparison
  const createStateSnapshot = useCallback(() => {
    return JSON.stringify({
      name: workflowName,
      nodes: nodes.map(node => ({ id: node.id, position: node.position, data: node.data })),
      edges: edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target }))
    });
  }, [workflowName, nodes, edges]);

  // Check for unsaved changes
  useEffect(() => {
    const currentState = createStateSnapshot();
    if (lastSavedState && lastSavedState !== currentState) {
      setHasUnsavedChanges(true);
    } else if (lastSavedState === currentState) {
      setHasUnsavedChanges(false);
    }
  }, [workflowName, nodes, edges, lastSavedState, createStateSnapshot]);

  // Load workflow from URL parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loadWorkflowId = urlParams.get('load');
    const newWorkflowName = urlParams.get('name');
    
    // Check for Telegram Workflow first - auto-create/load if needed
    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    const telegramWorkflow = savedWorkflows.find(w => w.name === 'Telegram Workflow');
    
    if (!telegramWorkflow) {
      // Auto-create empty Telegram Workflow - will be populated with real virtual workflow
      const telegramWorkflowId = `telegram-workflow-${Date.now()}`;
      
      const newTelegramWorkflow = {
        id: telegramWorkflowId,
        name: 'Telegram Workflow',
        nodes: [], // Empty - will load real virtual workflow
        edges: [], // Empty - will load real virtual workflow
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isProtected: true, // Cannot be deleted
        isTelegramWorkflow: true // Flag to identify this as the real Telegram workflow
      };
      
      // Save to localStorage
      savedWorkflows.push(newTelegramWorkflow);
      localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows));
      
      console.log('🤖 Auto-created empty Telegram Workflow - ready for real virtual workflow');
    } else {
      // Clean up any old fake nodes from existing Telegram Workflow
      const existingIndex = savedWorkflows.findIndex(w => w.name === 'Telegram Workflow');
      if (existingIndex >= 0) {
        savedWorkflows[existingIndex].nodes = []; // Clear old fake nodes
        savedWorkflows[existingIndex].edges = []; // Clear old fake edges
        savedWorkflows[existingIndex].isTelegramWorkflow = true;
        localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows));
        console.log('🧹 Cleaned up existing Telegram Workflow - removed fake nodes');
      }
    }
    
    if (loadWorkflowId && currentWorkflowId !== loadWorkflowId) {
      // Loading existing workflow
      const workflowToLoad = savedWorkflows.find(w => w.id === loadWorkflowId);
      
      if (workflowToLoad) {
        setNodes(workflowToLoad.nodes || []);
        setEdges(workflowToLoad.edges || []);
        setWorkflowName(workflowToLoad.name);
        setCurrentWorkflowId(workflowToLoad.id);
        setLastSaved(`Loaded: ${new Date(workflowToLoad.updatedAt).toLocaleTimeString()}`);
        
        // Set initial saved state to prevent false unsaved changes detection
        setTimeout(() => {
          const initialState = JSON.stringify({
            name: workflowToLoad.name,
            nodes: (workflowToLoad.nodes || []).map(node => ({ id: node.id, position: node.position, data: node.data })),
            edges: (workflowToLoad.edges || []).map(edge => ({ id: edge.id, source: edge.source, target: edge.target }))
          });
          setLastSavedState(initialState);
          setHasUnsavedChanges(false);
        }, 100);
      }
    } else if (newWorkflowName && workflowName !== newWorkflowName) {
      // Creating new workflow with auto-generated name
      setWorkflowName(newWorkflowName);
      setCurrentWorkflowId(null); // Clear current workflow ID for new workflow
      
      // Set initial saved state with new name
      setTimeout(() => {
        const initialState = JSON.stringify({
          name: newWorkflowName,
          nodes: [],
          edges: []
        });
        setLastSavedState(initialState);
        setHasUnsavedChanges(false);
      }, 100);
    } else if (!loadWorkflowId && !newWorkflowName && !currentWorkflowId && lastSavedState === null) {
      // Auto-load Telegram Workflow if no specific workflow requested
      const updatedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
      const telegramWorkflowToLoad = updatedWorkflows.find(w => w.name === 'Telegram Workflow');
      
      if (telegramWorkflowToLoad) {
        // Clear any old fake nodes first
        setNodes([]);
        setEdges([]);
        setWorkflowName('Telegram Workflow');
        setCurrentWorkflowId(telegramWorkflowToLoad.id);
        setLastSaved(`Loaded: ${new Date(telegramWorkflowToLoad.updatedAt).toLocaleTimeString()}`);
        
        console.log('🤖 Auto-loaded Telegram Workflow - will load real workflow via API');
        
        // Don't set nodes/edges here - let loadTelegramVirtualWorkflow handle it
        setTimeout(() => {
          const initialState = JSON.stringify({
            name: 'Telegram Workflow',
            nodes: [],
            edges: []
          });
          setLastSavedState(initialState);
          setHasUnsavedChanges(false);
        }, 100);
      } else {
        // Fallback to default empty workflow
        setTimeout(() => {
          const initialState = JSON.stringify({
            name: 'Untitled Workflow',
            nodes: [],
            edges: []
          });
          setLastSavedState(initialState);
          setHasUnsavedChanges(false);
        }, 100);
      }
    }
  }, [setNodes, setEdges, currentWorkflowId, lastSavedState, workflowName]);

  // Load real Telegram virtual workflow data
  const loadTelegramVirtualWorkflow = useCallback(async () => {
    try {
      // Check if this is the Telegram Workflow
      const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
      const currentWorkflow = savedWorkflows.find(w => w.id === currentWorkflowId);
      
      if (currentWorkflow?.name === 'Telegram Workflow' || currentWorkflow?.isTelegramWorkflow) {
        console.log('🔄 Loading real Telegram virtual workflow...');
        console.log('🔍 API call to:', `${API_BASE_URL}/api/workflows/telegram-workflow`);
        
        // Fetch actual Telegram workflow from backend
        const response = await fetch(`${API_BASE_URL}/api/workflows/telegram-workflow`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('📡 API Response status:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 API Response data:', data);
          
          if (data.success && data.workflow) {
            console.log('✅ Connected to actual Telegram workflow:', data.workflow.description);
            console.log('📊 Bot stats:', data.workflow.botConfig);
            
            // Show information about the actual running workflow
            // Don't create fake nodes - just display that it's connected to real system
            setNodes([]);
            setEdges([]);
            
            // Update saved state
            setTimeout(() => {
              const initialState = JSON.stringify({
                name: 'Telegram Workflow',
                nodes: [],
                edges: [],
                realWorkflowData: data.workflow
              });
              setLastSavedState(initialState);
              setHasUnsavedChanges(false);
            }, 100);
            
            return true;
          }
        } else {
          const errorText = await response.text();
          console.log('❌ API Error response:', errorText);
          console.log('ℹ️ No active Telegram bot found');
          
          // Show empty workflow - user needs to setup Telegram bot first
          setNodes([]);
          setEdges([]);
        }
      }
    } catch (error) {
      console.error('❌ Error loading Telegram virtual workflow:', error);
      // Load empty workflow as fallback
      setNodes([]);
      setEdges([]);
    }
    return false;
  }, [currentWorkflowId, setNodes, setEdges, setLastSavedState, setHasUnsavedChanges]);

  // Load real Telegram workflow when Telegram Workflow is selected
  useEffect(() => {
    if (currentWorkflowId && workflowName === 'Telegram Workflow') {
      loadTelegramVirtualWorkflow();
    }
  }, [currentWorkflowId, workflowName, loadTelegramVirtualWorkflow]);

  // Add beforeunload listener for unsaved changes and unactivated bot workflows
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
      
      // Warn if this is a bot workflow that hasn't been activated
      if (botContext && botContext.mode === 'bot-specific' && !isActivated && nodes.length > 0) {
        event.preventDefault();
        event.returnValue = 'This workflow is not activated yet. If you leave without activating, it won\'t connect with your bot. Are you sure?';
        return 'This workflow is not activated yet. If you leave without activating, it won\'t connect with your bot. Are you sure?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, botContext, isActivated, nodes.length]);

  // 🔄 SYNC WITH DASHBOARD: Listen for status changes from dashboard
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'workflowStatuses' && currentWorkflowId) {
        const workflowStatuses = JSON.parse(event.newValue || '{}');
        const newStatus = workflowStatuses[currentWorkflowId];
        
        if (newStatus === 'active' && !isActivated) {
          console.log('🔄 Dashboard activated workflow - updating button state');
          setIsActivated(true);
        } else if (newStatus === 'inactive' && isActivated) {
          console.log('🔄 Dashboard deactivated workflow - updating button state');
          setIsActivated(false);
        }
      }
    };

    // Listen for localStorage changes from other tabs/pages
    window.addEventListener('storage', handleStorageChange);
    
    // Also check current status on page load/workflow change
    if (currentWorkflowId) {
      const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
      const currentStatus = workflowStatuses[currentWorkflowId];
      
      console.log('🔄 DEBUG: LocalStorage sync check:', {
        currentWorkflowId,
        currentStatus,
        isActivated,
        allStatuses: workflowStatuses
      });
      
      if (currentStatus === 'active' && !isActivated) {
        console.log('🚨 AUTO-ACTIVATION TRIGGER: LocalStorage says active, setting isActivated=true');
        setIsActivated(true);
      } else if (currentStatus === 'inactive' && isActivated) {
        console.log('🔄 Auto-deactivation: LocalStorage says inactive, setting isActivated=false');
        setIsActivated(false);
      }
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentWorkflowId, isActivated]);

  // 🤖 FLOATING CHATBOT: Monitor for Chatbot Trigger nodes
  useEffect(() => {
    console.log('🔍 Checking nodes for chatbot triggers:', nodes.length);
    
    // First, let's see all node types
    const nodeTypes = nodes.map(node => ({ id: node.id, type: node.data?.type }));
    console.log('📋 All node types:', nodeTypes);
    
    const chatbotNodes = nodes.filter(node => {
      const isChatbotTrigger = node.data?.type === 'chatbotTrigger';
      const isEnabled = node.data?.enableChatbot !== undefined ? node.data.enableChatbot : true;
      
      console.log(`🔍 Node ${node.id}: type=${node.data?.type}, isChatbotTrigger=${isChatbotTrigger}, enableChatbot=${node.data?.enableChatbot}, isEnabled=${isEnabled}`);
      
      return isChatbotTrigger && isEnabled;
    });
    
    console.log('✅ Found chatbot trigger nodes:', chatbotNodes.length);
    
    // Only show the first enabled chatbot to avoid positioning conflicts
    if (chatbotNodes.length > 0) {
      const firstChatbot = chatbotNodes[0];
      setActiveChatbots([{
        id: firstChatbot.id,
        title: firstChatbot.data.chatbotTitle || 'Customer Support',
        subtitle: firstChatbot.data.chatbotSubtitle || 'How can we help you?',
        themeColor: firstChatbot.data.chatbotTheme || '#667eea'
      }]);
      
      console.log('🤖 Chatbot widget activated for node:', firstChatbot.id);
    } else {
      setActiveChatbots([]);
      console.log('🤖 No chatbot widgets active');
    }
  }, [nodes]);

  // Handle bot context from Live Chat
  useEffect(() => {
    if (botContext && botContext.mode === 'bot-specific') {
      console.log('🔧 Setting up bot-specific workflow:', botContext);
      
      // Set workflow name based on bot with timestamp to ensure uniqueness
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
      const botWorkflowName = `${botContext.botUsername || 'Bot'} Automation ${timestamp}`;
      setWorkflowName(botWorkflowName);
      
      // Clear any existing workflow status to ensure fresh start
      const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
      // Don't inherit any previous workflow statuses
      setCurrentWorkflowId(null);
      
      // Create initial Telegram trigger node with bot token pre-configured
      if (nodes.length === 0) {
        const triggerNode = {
          id: getId(),
          type: 'custom', // Same as dropped from sidebar
          position: { x: 250, y: 100 },
          data: {
            label: 'Telegram Trigger',
            icon: 'fa-telegram',
            color: 'text-blue-500',
            description: 'Start workflow from Telegram messages',
            type: 'telegramTrigger',
            // Pre-configure bot token
            config: {
              botToken: botContext.botToken,
              botUsername: botContext.botUsername,
              preConfigured: true
            }
          }
        };
        
        console.log('🔧 Adding pre-configured Telegram trigger node');
        setNodes([triggerNode]);
        
        // Mark as having unsaved changes since we added a node
        setHasUnsavedChanges(true);
        
        // Ensure workflow starts as inactive (not auto-activated)
        setIsActivated(false);
      }
    }
  }, [botContext]); // Only run when botContext changes

  // Handles creating a new edge when connecting two nodes.
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Allows the canvas to be a valid drop target.
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handles dropping a new node from the sidebar onto the canvas.
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeDataString = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeDataString) return;
      
      const nodeData = JSON.parse(nodeDataString);

      // Project the screen coordinates to the ReactFlow pane coordinates.
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });


      const newNode = {
        id: getId(),
        type: 'custom', // All nodes use the custom renderer
        position,
        data: nodeData,
      };

      // Auto-configure Telegram nodes with bot token if available from bot context
      if (botContext && botContext.botToken && (nodeData.type === 'telegramTrigger' || nodeData.type === 'telegramSendMessage')) {
        newNode.data = {
          ...nodeData,
          botToken: botContext.botToken,
          config: {
            botToken: botContext.botToken,
            botUsername: botContext.botUsername,
            preConfigured: true
          }
        };
      }

      setNodes((nds) => nds.concat(newNode));

      // Auto-register Chat Trigger nodes after adding to nodes
      if (nodeData.type === 'chatTrigger') {
        setTimeout(() => registerChatTrigger(newNode), 100);
      }
    },
    [reactFlowInstance, setNodes, currentWorkflowId, generateWorkflowId, botContext]
  );

  // Sets the currently selected node when double-clicked.
  const onNodeDoubleClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Handles closing the config panel and updating the node's data.
  const onPanelClose = (updatedData) => {
    if (updatedData && selectedNode) {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    // Merge the updated data into the node's data object.
                    node.data = { ...node.data, ...updatedData };
                }
                return node;
            })
        );
        
        // Auto-save disabled - user must manually save
        console.log('📝 Node parameters updated (auto-save disabled)');
    }
    setSelectedNode(null); // Close the panel
  };

  // Handles updating node data immediately (for live preview output data)
  const onNodeUpdate = useCallback((nodeId, dataUpdate) => {
    setNodes((nds) =>
        nds.map((node) => {
            if (node.id === nodeId) {
                // Merge the updated data into the node's data object.
                node.data = { ...node.data, ...dataUpdate };
            }
            return node;
        })
    );
  }, [setNodes]);

  // Toolbar action handlers
  const handleSave = useCallback(async () => {
    console.log('💾 Saving workflow to database...');
    console.log('💾 DEBUG: Current nodes state:', nodes);
    console.log('💾 DEBUG: Current edges state:', edges);
    console.log('💾 DEBUG: Nodes count:', nodes.length);
    console.log('💾 DEBUG: Edges count:', edges.length);
    
    // ADDITIONAL DEBUG: Check ReactFlow instance state
    if (reactFlowInstance) {
      const reactFlowNodes = reactFlowInstance.getNodes();
      const reactFlowEdges = reactFlowInstance.getEdges();
      console.log('💾 DEBUG: ReactFlow nodes count:', reactFlowNodes.length);
      console.log('💾 DEBUG: ReactFlow edges count:', reactFlowEdges.length);
      console.log('💾 DEBUG: ReactFlow nodes:', reactFlowNodes);
      
      // If ReactFlow has nodes but our state doesn't, there's a sync issue
      if (reactFlowNodes.length > 0 && nodes.length === 0) {
        console.log('🚨 STATE SYNC ISSUE: ReactFlow has nodes but React state is empty!');
        console.log('💡 Using ReactFlow data instead of React state');
        
        // Use ReactFlow data as fallback
        const workflowData = {
          id: currentWorkflowId || generateWorkflowId(),
          name: workflowName,
          description: `Workflow with ${reactFlowNodes.length} nodes`,
          nodes: reactFlowNodes,
          connections: reactFlowEdges,
          createdAt: currentWorkflowId ? undefined : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log('💾 Using ReactFlow data for save:', {
          nodeCount: reactFlowNodes.length,
          edgeCount: reactFlowEdges.length
        });
        
        // Continue with save using ReactFlow data...
        // We'll implement this save logic below
      }
    }
    
    // Create workflow data to save
    const workflowId = currentWorkflowId || generateWorkflowId();
    const workflowData = {
      id: workflowId,
      name: workflowName,
      description: `Workflow with ${nodes.length} nodes`,
      nodes: nodes,
      connections: edges, // Backend expects "connections", not "edges"
      createdAt: currentWorkflowId ? undefined : new Date().toISOString(), // Keep original creation date if editing
      updatedAt: new Date().toISOString(),
    };

    console.log('💾 Workflow data to save (SUMMARY):', {
      id: workflowData.id,
      name: workflowData.name,
      nodeCount: workflowData.nodes.length,
      connectionCount: workflowData.connections.length
    });
    
    console.log('💾 ACTUAL NODES DATA being sent:', workflowData.nodes);
    console.log('💾 ACTUAL CONNECTIONS DATA being sent:', workflowData.connections);

    try {
      // Save to database first
      const token = localStorage.getItem('token');
      const isNewWorkflow = !currentWorkflowId;
      
      const apiUrl = isNewWorkflow 
        ? `${API_BASE}/api/workflows`
        : `${API_BASE}/api/workflows/${workflowId}`;
      
      const method = isNewWorkflow ? 'POST' : 'PUT';
      
      console.log(`💾 Making ${method} request to ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: workflowData.name,
          description: workflowData.description,
          nodes: workflowData.nodes,
          connections: workflowData.connections
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Handle token expiration
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(result.error || `Database save failed: ${response.status}`);
      }

      console.log('✅ Database save successful:', result);

      // Set current workflow ID for future saves (for new workflows)
      if (isNewWorkflow && result.workflow?.id) {
        console.log('🔄 DEBUG: Setting new workflow ID:', result.workflow.id.toString());
        
        // CLEAR any existing status for this workflow ID to prevent auto-activation
        const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
        const workflowIdStr = result.workflow.id.toString();
        
        console.log('🔄 DEBUG: Status BEFORE clearing:', workflowStatuses[workflowIdStr]);
        
        // Clear the status for this workflow (new workflows should start inactive)
        delete workflowStatuses[workflowIdStr];
        localStorage.setItem('workflowStatuses', JSON.stringify(workflowStatuses));
        
        console.log('🔄 DEBUG: Status AFTER clearing:', workflowStatuses[workflowIdStr]);
        
        setCurrentWorkflowId(workflowIdStr);
      }

      // Also save to localStorage for offline access
      const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
      
      // Check if workflow already exists (editing existing workflow)
      const existingIndex = savedWorkflows.findIndex(w => w.id === workflowId);
      
      if (existingIndex >= 0) {
        // Update existing workflow, preserve creation date
        savedWorkflows[existingIndex] = { 
          ...savedWorkflows[existingIndex], 
          ...workflowData,
          createdAt: savedWorkflows[existingIndex].createdAt, // Keep original creation date
          updatedAt: new Date().toISOString() 
        };
      } else {
        // Add new workflow
        workflowData.createdAt = new Date().toISOString();
        savedWorkflows.push(workflowData);
      }

      // Save to localStorage
      localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows));
      
      setLastSaved('just now');
      
      // Update saved state to mark as no longer having unsaved changes
      const newSavedState = createStateSnapshot();
      setLastSavedState(newSavedState);
      setHasUnsavedChanges(false);
      
      alert(`✅ Workflow "${workflowName}" saved successfully to database!`);

    } catch (error) {
      console.error('❌ Database save error:', error);
      alert(`❌ Failed to save workflow to database: ${error.message}\n\nWorkflow saved to local storage only.`);
      
      // Still save to localStorage as fallback
      const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
      
      const existingIndex = savedWorkflows.findIndex(w => w.id === workflowId);
      
      if (existingIndex >= 0) {
        savedWorkflows[existingIndex] = { 
          ...savedWorkflows[existingIndex], 
          ...workflowData,
          createdAt: savedWorkflows[existingIndex].createdAt,
          updatedAt: new Date().toISOString() 
        };
      } else {
        workflowData.createdAt = new Date().toISOString();
        savedWorkflows.push(workflowData);
        setCurrentWorkflowId(workflowId);
      }

      localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows));
      setLastSaved('just now (local only)');
      
      const newSavedState = createStateSnapshot();
      setLastSavedState(newSavedState);
      setHasUnsavedChanges(false);
    }
  }, [workflowName, nodes, edges, currentWorkflowId, generateWorkflowId, createStateSnapshot]);

  const handleActivate = useCallback(async () => {
    console.log('🚀 FRONTEND ACTIVATION STARTING...');
    
    if (nodes.length === 0) {
      alert('Please add some nodes to the workflow before activating.');
      return;
    }

    // Check if workflow has trigger nodes
    const triggerNodes = nodes.filter(node => 
      node.data.type === 'telegramTrigger' || node.data.type === 'whatsappTrigger'
    );

    if (triggerNodes.length === 0) {
      alert('Workflow must contain at least one trigger node (Telegram Trigger or WhatsApp Trigger) to be activated.');
      return;
    }

    // Ensure workflow has an ID - generate one if needed
    let workflowId = currentWorkflowId;
    if (!workflowId) {
      workflowId = generateWorkflowId();
      setCurrentWorkflowId(workflowId);
    }

    setIsExecuting(true);
    setExecutionProgress('Activating workflow...');

    console.log('📝 FRONTEND ACTIVATION DEBUG:', {
      workflowId: workflowId,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      triggerNodes: triggerNodes.map(n => n.data.type),
      apiBase: API_BASE,
      hasToken: !!localStorage.getItem('token')
    });

    try {
      // Call the activation endpoint instead of executing immediately
      const workflowData = {
        nodes: nodes,
        edges: edges
      };

      const requestUrl = `${API_BASE}/api/workflows/${workflowId}/activate`;
      console.log('🌐 FRONTEND MAKING REQUEST TO:', requestUrl);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          workflow: workflowData
        })
      });

      console.log('📡 FRONTEND RESPONSE STATUS:', response.status, response.statusText);

      const result = await response.json();
      console.log('📦 FRONTEND RESPONSE DATA:', result);

      // Handle token expiration
      if (response.status === 401 && (result.error === 'Invalid token' || result.error === 'No token provided')) {
        console.log('🔄 Token expired, clearing localStorage and redirecting to login...');
        localStorage.clear();
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return;
      }

      if (response.ok && result.success) {
        setIsActivated(true);
        setExecutionProgress(`✅ Workflow activated! Listening for triggers...`);
        
        // 🔄 SYNC WITH DASHBOARD: Update shared workflow status
        const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
        workflowStatuses[workflowId] = 'active';
        localStorage.setItem('workflowStatuses', JSON.stringify(workflowStatuses));
        
        // Trigger custom event for same-page updates
        window.dispatchEvent(new CustomEvent('workflowStatusChanged', { 
          detail: { workflowId, status: 'active' } 
        }));
        
        // Show activation success with trigger URLs
        let message = result.message + '\n\n';
        if (result.triggerUrls && result.triggerUrls.length > 0) {
          message += 'Trigger URLs:\n';
          result.triggerUrls.forEach(trigger => {
            if (trigger.type === 'telegramTrigger') {
              message += `• Telegram Webhook: ${trigger.webhookUrl}\n`;
            }
          });
        }
        
        alert(message);
        setIsExecuting(false);
      } else {
        throw new Error(result.message || 'Failed to activate workflow');
      }

    } catch (error) {
      console.error('❌ FRONTEND ACTIVATION ERROR:', error);
      setExecutionProgress(`❌ Activation failed: ${error.message}`);
      alert(`❌ Workflow activation failed:\n${error.message}`);
      setIsExecuting(false);
      setIsActivated(false);
    }
  }, [nodes, edges, workflowName, currentWorkflowId, generateWorkflowId]);

  const handleDeactivate = useCallback(async () => {
    if (!currentWorkflowId) {
      alert('No workflow ID found for deactivation.');
      return;
    }

    setIsExecuting(true);
    setExecutionProgress('Deactivating workflow...');

    try {
      const response = await fetch(`${API_BASE}/api/workflows/${currentWorkflowId}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      // Handle token expiration
      if (response.status === 401 && (result.error === 'Invalid token' || result.error === 'No token provided')) {
        console.log('🔄 Token expired, clearing localStorage and redirecting to login...');
        localStorage.clear();
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
        return;
      }

      if (response.ok && result.success) {
        setIsActivated(false);
        setExecutionProgress('');
        
        // 🔄 SYNC WITH DASHBOARD: Update shared workflow status
        const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
        workflowStatuses[currentWorkflowId] = 'inactive';
        localStorage.setItem('workflowStatuses', JSON.stringify(workflowStatuses));
        
        // Trigger custom event for same-page updates
        window.dispatchEvent(new CustomEvent('workflowStatusChanged', { 
          detail: { workflowId: currentWorkflowId, status: 'inactive' } 
        }));
        
        alert(`✅ Workflow deactivated successfully! No longer listening for triggers.`);
      } else {
        throw new Error(result.message || 'Failed to deactivate workflow');
      }

    } catch (error) {
      console.error('❌ Workflow deactivation failed:', error);
      setExecutionProgress(`❌ Deactivation failed: ${error.message}`);
      alert(`❌ Workflow deactivation failed:\n${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  }, [currentWorkflowId]);

  const handleStopExecution = useCallback(() => {
    if (workflowExecutor && workflowExecutor.isRunning()) {
      workflowExecutor.stop();
      setIsExecuting(false);
      setIsActivated(false);
      setExecutionProgress('Execution stopped by user');
      
      setTimeout(() => {
        setExecutionProgress('');
      }, 2000);
    }
  }, [workflowExecutor]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  const handleUndo = useCallback(() => {
    // Undo logic here
  }, []);

  const handleRedo = useCallback(() => {
    // Redo logic here
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarVisible(prev => !prev);
  }, []);

  // Register Chat Trigger node automatically
  const registerChatTrigger = async (node) => {
    try {
      const workflowId = currentWorkflowId || `workflow-${Date.now()}`;
      
      const config = {
        chatSessionName: node.data.chatSessionName || `Chat Session ${node.id.slice(-4)}`,
        welcomeMessage: node.data.welcomeMessage || '👋 Welcome! How can I help you today?',
        allowFileUploads: node.data.allowFileUploads || false,
        allowedFileTypes: node.data.allowedFileTypes || '*'
      };

      const response = await fetch(`${API_BASE}/api/chat-trigger/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nodeId: node.id,
          workflowId: workflowId,
          config: config
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Chat Trigger registered successfully:', result);
        // Update node with chat URL and session info
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  chatUrl: result.chatUrl,
                  sessionId: result.sessionId,
                  status: '🟢 Chat Active'
                }
              };
            }
            return n;
          })
        );
      } else {
        console.error('❌ Failed to register Chat Trigger:', result.error);
      }
    } catch (error) {
      console.error('❌ Error registering Chat Trigger:', error);
    }
  };

  return (
    <div className={`professional-workflow-builder ${!sidebarVisible ? 'sidebar-hidden' : ''}`}>
      <Toolbar
        onSave={handleSave}
        onActivate={handleActivate}
        onDeactivate={handleDeactivate}
        onStopExecution={handleStopExecution}
        onClear={handleClear}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={false}
        canRedo={false}
        workflowName={workflowName}
        onWorkflowNameChange={handleWorkflowNameChange}
        isExecuting={isExecuting}
        isActivated={isActivated}
        executionProgress={executionProgress}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        onToggleSidebar={toggleSidebar}
        sidebarVisible={sidebarVisible}
      />
      <div className="workflow-content">
        <div className="workflow-canvas" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls position="bottom-right" />
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={16} 
              size={2} 
              color="#d1d5db"
              backgroundColor="#ffffff"
            />
          </ReactFlow>
        </div>
        {sidebarVisible && <Sidebar />}
      </div>
      {selectedNode && (
        <ConfigPanel 
          node={selectedNode} 
          nodes={nodes}
          edges={edges}
          onClose={onPanelClose}
          onNodeUpdate={onNodeUpdate}
          workflowId={currentWorkflowId}
        />
      )}

      {/* 🤖 FLOATING CHATBOT WIDGETS */}
      {activeChatbots.map((chatbot, index) => (
        <div
          key={`chatbot-container-${chatbot.id}`}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            pointerEvents: 'none'
          }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            <FloatingChatbot
              key={chatbot.id}
              isVisible={true}
              nodeId={chatbot.id}
              title={chatbot.title}
              subtitle={chatbot.subtitle}
              themeColor={chatbot.themeColor}
              onClose={() => {
                setActiveChatbots(prev => prev.filter(cb => cb.id !== chatbot.id));
              }}
            />
          </div>
        </div>
      ))}
      
    </div>
  );
};

export default App;
