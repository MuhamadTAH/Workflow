/*
=================================================================
FILE: frontend/src/components/App.js (UPDATED)
=================================================================
This component has been updated to pass the full list of nodes and
edges to the ConfigPanel, enabling it to trace connections and
fetch data from previous nodes.
*/
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactFlow, {
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
import '../../styles/index.css';

// Register the custom node type so ReactFlow knows how to render it.
const nodeTypes = { custom: CustomLogicNode };

const App = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [currentWorkflowId, setCurrentWorkflowId] = useState(null);

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

  // Load workflow from URL parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loadWorkflowId = urlParams.get('load');
    
    if (loadWorkflowId) {
      const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
      const workflowToLoad = savedWorkflows.find(w => w.id === loadWorkflowId);
      
      if (workflowToLoad) {
        setNodes(workflowToLoad.nodes || []);
        setEdges(workflowToLoad.edges || []);
        setWorkflowName(workflowToLoad.name);
        setCurrentWorkflowId(workflowToLoad.id);
        setLastSaved(`Loaded: ${new Date(workflowToLoad.updatedAt).toLocaleTimeString()}`);
        console.log('Workflow loaded:', workflowToLoad);
      }
    }
  }, [setNodes, setEdges]);

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

      // Auto-generate workflow ID for chat trigger nodes
      if (nodeData.type === 'chatTrigger') {
        const workflowId = currentWorkflowId || generateWorkflowId();
        nodeData.workflowId = workflowId;
        
        // If this is a new workflow, set the current workflow ID
        if (!currentWorkflowId) {
          setCurrentWorkflowId(workflowId);
        }
      }

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
    console.log('Workflow saved:', workflowData);
    
    // Register workflow with backend for execution (if it has a chat trigger)
    const hasChatTrigger = nodes.some(node => node.data.type === 'chatTrigger');
    if (hasChatTrigger) {
      try {
        // Send workflow to backend for registration
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://workflow-lg9z.onrender.com';
        
        fetch(`${baseUrl}/api/workflows/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            workflowId: workflowId,
            workflow: {
              nodes: nodes.map(node => ({
                ...node,
                data: {
                  ...node.data,
                  type: node.data.type === 'chatTrigger' ? 'trigger' : node.data.type // Map chatTrigger to trigger
                }
              })),
              edges: edges
            }
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log(`✅ Workflow ${workflowId} registered for execution`);
            alert(`✅ Workflow "${workflowName}" saved and activated for chat triggers!`);
          } else {
            console.warn('⚠️ Workflow saved but not registered:', data.error);
            alert(`✅ Workflow "${workflowName}" saved successfully!`);
          }
        })
        .catch(error => {
          console.error('❌ Workflow registration failed:', error);
          alert(`✅ Workflow "${workflowName}" saved successfully!`);
        });
      } catch (error) {
        console.error('❌ Workflow registration error:', error);
        alert(`✅ Workflow "${workflowName}" saved successfully!`);
      }
    } else {
      alert(`✅ Workflow "${workflowName}" saved successfully!`);
    }
  }, [workflowName, nodes, edges, currentWorkflowId, generateWorkflowId]);

  const handleExecute = useCallback(() => {
    setIsExecuting(true);
    // Execute workflow logic here
    setTimeout(() => {
      setIsExecuting(false);
      console.log('Workflow execution completed');
    }, 2000);
  }, []);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  const handleUndo = useCallback(() => {
    // Undo logic here
    console.log('Undo action');
  }, []);

  const handleRedo = useCallback(() => {
    // Redo logic here
    console.log('Redo action');
  }, []);

  return (
    <div className="professional-workflow-builder">
      <Toolbar
        onSave={handleSave}
        onExecute={handleExecute}
        onClear={handleClear}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={false}
        canRedo={false}
        workflowName={workflowName}
        onWorkflowNameChange={setWorkflowName}
        isExecuting={isExecuting}
        lastSaved={lastSaved}
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
        />
      )}
    </div>
  );
};

export default App;
