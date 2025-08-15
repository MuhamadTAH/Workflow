import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from 'reactflow';

// We start with an empty array of nodes
const initialNodes = [];
let id = 0;
const getId = () => `dnd-node_${id++}`;

const WorkflowCanvas = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  // Function to handle new connections between nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // This allows the canvas to accept dropped items
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // This function handles the drop event
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      // Get the node type from the data transfer object
      const type = event.dataTransfer.getData('application/reactflow');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      // Calculate the position where the node should be created
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      // Add the new node to the existing nodes
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  return (
    <main className="workflow-canvas" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        className="react-flow-canvas"
      >
        <Background variant="dots" gap={15} size={1} />
        <Controls />
        <MiniMap nodeColor={(n) => '#4a90e2'} nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </main>
  );
};

export default WorkflowCanvas;
