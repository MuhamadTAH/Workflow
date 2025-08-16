import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Import all the custom components and hooks we've created
import NodeSidebar from '../components/Panels/NodeSidebar';
import TriggerNode from '../components/Nodes/TriggerNode';
import useWorkflowState from '../hooks/useWorkflowState';
import { saveWorkflow } from '../api/workflowService';

/**
 * EditorPage serves as the main container for the workflow builder.
 * It integrates the sidebar, canvas, state management, and API calls.
 */
const EditorPage = () => {
  // Use our custom hook to manage the state of the workflow
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNewNode } = useWorkflowState();
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Register our custom node type so ReactFlow knows how to render it.
  const nodeTypes = useMemo(() => ({ trigger: TriggerNode }), []);

  // Prevents the default browser behavior for drag-and-drop.
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handles dropping a new node from the sidebar onto the canvas.
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is a valid node type
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Calculate the position of the new node on the canvas
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      // Add the new node to the state
      addNewNode(type, position);
    },
    [reactFlowInstance, addNewNode]
  );
  
  // Handles the "Save Workflow" button click.
  const handleSave = async () => {
    if (nodes.length === 0) {
      alert('Cannot save an empty workflow.');
      return;
    }
    
    const workflowData = { nodes, edges };
    try {
      await saveWorkflow(workflowData);
      alert('Workflow saved successfully!');
    } catch (error) {
      alert('Failed to save workflow. See console for details.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <ReactFlowProvider>
        {/* The sidebar for dragging new nodes */}
        <NodeSidebar />
        
        {/* The main workflow canvas area */}
        <div style={{ flexGrow: 1, height: '100%' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes} // Register custom nodes
            fitView
          >
            <Controls />
            <Background />
          </ReactFlow>
        </div>
        
        {/* Save button positioned over the canvas */}
        <button
          onClick={handleSave}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            zIndex: 4, // Ensure it's above the canvas
            fontSize: '16px'
          }}
        >
          Save Workflow
        </button>
      </ReactFlowProvider>
    </div>
  );
};

export default EditorPage;
