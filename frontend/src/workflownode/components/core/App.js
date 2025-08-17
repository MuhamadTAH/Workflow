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
import { getId } from '../../utils';
import WorkflowExecutor from '../../utils/workflowExecutor';
import { API_BASE_URL } from '../../../config/api.js';
import '../../styles/index.css';

// Register the custom node type so ReactFlow knows how to render it.
const nodeTypes = { custom: CustomLogicNode };

// API base URL
const API_BASE = API_BASE_URL;

const App = () => {
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
    
    if (loadWorkflowId && currentWorkflowId !== loadWorkflowId) {
      // Loading existing workflow
      const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
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
      // For new workflows without specified name, set initial state only once
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
  }, [setNodes, setEdges, currentWorkflowId, lastSavedState, workflowName]);

  // Add beforeunload listener for unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

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
      if (currentStatus === 'active' && !isActivated) {
        setIsActivated(true);
      } else if (currentStatus === 'inactive' && isActivated) {
        setIsActivated(false);
      }
    }
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentWorkflowId, isActivated]);

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

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, currentWorkflowId, generateWorkflowId]
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
  const handleSave = useCallback(() => {
    // Create workflow data to save
    const workflowId = currentWorkflowId || generateWorkflowId();
    const workflowData = {
      id: workflowId,
      name: workflowName,
      description: `Workflow with ${nodes.length} nodes`,
      nodes: nodes,
      edges: edges,
      createdAt: currentWorkflowId ? undefined : new Date().toISOString(), // Keep original creation date if editing
      updatedAt: new Date().toISOString(),
    };

    // Get existing workflows from localStorage
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
      setCurrentWorkflowId(workflowId); // Set current workflow ID for future saves
    }

    // Save to localStorage
    localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows));
    
    setLastSaved('just now');
    
    // Update saved state to mark as no longer having unsaved changes
    const newSavedState = createStateSnapshot();
    setLastSavedState(newSavedState);
    setHasUnsavedChanges(false);
    
    
    alert(`✅ Workflow "${workflowName}" saved successfully!`);
  }, [workflowName, nodes, edges, currentWorkflowId, generateWorkflowId, navigate, createStateSnapshot]);

  const handleActivate = useCallback(async () => {
    console.log('🚀 FRONTEND ACTIVATION STARTING...');
    
    if (nodes.length === 0) {
      alert('Please add some nodes to the workflow before activating.');
      return;
    }

    // Check if workflow has trigger nodes
    const triggerNodes = nodes.filter(node => 
      node.data.type === 'chatTrigger' || node.data.type === 'telegramTrigger'
    );

    if (triggerNodes.length === 0) {
      alert('Workflow must contain at least one trigger node (Chat Trigger or Telegram Trigger) to be activated.');
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
            if (trigger.type === 'chatTrigger') {
              message += `• Chat Trigger: ${trigger.hostedChatUrl}\n`;
            } else if (trigger.type === 'telegramTrigger') {
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

  return (
    <div className="professional-workflow-builder">
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
        onWorkflowNameChange={setWorkflowName}
        isExecuting={isExecuting}
        isActivated={isActivated}
        executionProgress={executionProgress}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      <div className="workflow-content">
        <div className="workflow-canvas" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
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
        <Sidebar />
      </div>
      {selectedNode && (
        <ConfigPanel 
          node={selectedNode} 
          nodes={nodes}
          edges={edges}
          onClose={onPanelClose}
          onNodeUpdate={onNodeUpdate}
        />
      )}
    </div>
  );
};

export default App;
