import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import NodeSidebar from '../components/Panels/NodeSidebar';
import SettingsPanel from '../components/Panels/SettingsPanel';
import TriggerNode from '../components/Nodes/TriggerNode';
import useWorkflowState from '../hooks/useWorkflowState';
import { saveWorkflow } from '../api/workflowService';

const EditorPage = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNewNode,
    updateNodeData
  } = useWorkflowState();
  
  const [selectedNode, setSelectedNode] = useState(null);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const nodeTypes = useMemo(() => ({ trigger: TriggerNode }), []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNewNode(type, position);
    },
    [reactFlowInstance, addNewNode]
  );
  
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

  // This function now handles the double-click event to open the panel.
  const onNodeDoubleClick = useCallback((event, node) => {
    // DEBUG: Log to the console to confirm the event is firing.
    console.log('Node double-clicked:', node);
    setSelectedNode(node);
  }, []);

  // Add a handler to close the panel when clicking the canvas background.
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const closeSettingsPanel = () => {
    setSelectedNode(null);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      <ReactFlowProvider>
        <NodeSidebar />
        <div style={{ flexGrow: 1, height: '100%', position: 'relative' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDoubleClick={onNodeDoubleClick} // Changed from onNodeClick
            onPaneClick={onPaneClick} // Add pane click handler
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background />
          </ReactFlow>
          
          <SettingsPanel
            node={selectedNode}
            onClose={closeSettingsPanel}
            onSave={updateNodeData}
          />

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
              zIndex: 10,
              fontSize: '16px'
            }}
          >
            Save Workflow
          </button>
        </div>
      </ReactFlowProvider>
    </div>
  );
};

export default EditorPage;
