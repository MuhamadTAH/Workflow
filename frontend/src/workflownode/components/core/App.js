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
  const [lastSaved, setLastSaved] = useState(null);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedState, setLastSavedState] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState('inactive'); // inactive, listening, executing, completed

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

  // Save workflow activation state to localStorage
  const saveWorkflowActivationState = useCallback((workflowId, status) => {
    const workflowActivations = JSON.parse(localStorage.getItem('workflowActivations') || '{}');
    workflowActivations[workflowId] = status;
    localStorage.setItem('workflowActivations', JSON.stringify(workflowActivations));
  }, []);

  // Load workflow activation state from backend
  const loadWorkflowActivationStatus = useCallback(async (workflowId) => {
    if (!workflowId) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/workflows/${workflowId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWorkflowStatus(result.status);
          saveWorkflowActivationState(workflowId, result.status);
          console.log(`📡 Loaded activation status for workflow ${workflowId}: ${result.status}`);
        }
      } else {
        // Fallback to localStorage if backend fails
        const workflowActivations = JSON.parse(localStorage.getItem('workflowActivations') || '{}');
        const localStatus = workflowActivations[workflowId] || 'inactive';
        setWorkflowStatus(localStatus);
        console.log(`📱 Using local activation status for workflow ${workflowId}: ${localStatus}`);
      }
    } catch (error) {
      console.error('❌ Error loading activation status:', error);
      // Fallback to localStorage
      const workflowActivations = JSON.parse(localStorage.getItem('workflowActivations') || '{}');
      const localStatus = workflowActivations[workflowId] || 'inactive';
      setWorkflowStatus(localStatus);
    }
  }, [saveWorkflowActivationState]);

  // Load workflow activation state
  useEffect(() => {
    if (currentWorkflowId) {
      loadWorkflowActivationStatus(currentWorkflowId);
    }
  }, [currentWorkflowId, loadWorkflowActivationStatus]);

  // Load workflow from URL parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loadWorkflowId = urlParams.get('load');
    
    if (loadWorkflowId && currentWorkflowId !== loadWorkflowId) {
      const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
      const workflowToLoad = savedWorkflows.find(w => w.id === loadWorkflowId);
      
      if (workflowToLoad) {
        setNodes(workflowToLoad.nodes || []);
        setEdges(workflowToLoad.edges || []);
        setWorkflowName(workflowToLoad.name);
        setCurrentWorkflowId(workflowToLoad.id);
        setLastSaved(`Loaded: ${new Date(workflowToLoad.updatedAt).toLocaleTimeString()}`);
        
        // Load workflow activation state
        const workflowActivations = JSON.parse(localStorage.getItem('workflowActivations') || '{}');
        setWorkflowStatus(workflowActivations[workflowToLoad.id] || 'inactive');
        
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
    } else if (!loadWorkflowId && !currentWorkflowId && lastSavedState === null) {
      // For new workflows, set initial state only once
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
  }, [setNodes, setEdges, currentWorkflowId, lastSavedState]);

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

  // Workflow activation handler
  const handleActivateWorkflow = useCallback(async () => {
    if (!currentWorkflowId) {
      console.error('No workflow loaded. Please save the workflow first.');
      return;
    }

    if (workflowStatus === 'inactive' || workflowStatus === 'completed') {
      try {
        // Set to listening immediately for UI feedback
        setWorkflowStatus('listening');
        
        const response = await fetch(`${API_BASE}/api/workflows/${currentWorkflowId}/activate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        const result = await response.json();
        
        if (result.success) {
          // Update both local state and localStorage
          setWorkflowStatus('listening');
          saveWorkflowActivationState(currentWorkflowId, 'listening');
          
          console.log(`✅ Workflow ${currentWorkflowId} activated successfully:`, {
            triggerNodes: result.triggerNodes,
            triggerUrls: result.triggerUrls,
            activatedAt: result.activatedAt
          });
        } else {
          // Handle activation failure
          console.error('❌ Failed to activate workflow:', result.error);
          setWorkflowStatus('inactive');
          saveWorkflowActivationState(currentWorkflowId, 'inactive');
          
          // Show error to user
          alert(`Failed to activate workflow: ${result.error}`);
        }
      } catch (error) {
        console.error('❌ Error activating workflow:', error);
        setWorkflowStatus('inactive');
        saveWorkflowActivationState(currentWorkflowId, 'inactive');
        
        // Show error to user
        alert('Failed to activate workflow. Please check your connection and try again.');
      }
    }
  }, [workflowStatus, currentWorkflowId, saveWorkflowActivationState]);

  // Update workflow activation state (for backend updates)
  const updateWorkflowStatus = useCallback((newStatus) => {
    setWorkflowStatus(newStatus);
    if (currentWorkflowId) {
      saveWorkflowActivationState(currentWorkflowId, newStatus);
    }
  }, [currentWorkflowId, saveWorkflowActivationState]);

  return (
    <div className="professional-workflow-builder">
      <Toolbar
        onSave={handleSave}
        onClear={handleClear}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={false}
        canRedo={false}
        workflowName={workflowName}
        onWorkflowNameChange={setWorkflowName}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        workflowStatus={workflowStatus}
        onActivateWorkflow={handleActivateWorkflow}
        currentWorkflowId={currentWorkflowId}
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
          workflowId={currentWorkflowId}
          onClose={onPanelClose}
          onNodeUpdate={onNodeUpdate}
        />
      )}
    </div>
  );
};

export default App;
