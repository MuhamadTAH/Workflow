import React, { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from 'reactflow';
import BaseNode from './BaseNode'; // Import the custom node

// We start with an empty array of nodes
const initialNodes = [];
let id = 0;
const getId = () => `dnd-node_${id++}`;

const WorkflowCanvas = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  // Register our custom node type
  const nodeTypes = useMemo(() => ({ 
    telegramTrigger: BaseNode,
    webhookTrigger: BaseNode,
    sendMessage: BaseNode,
    httpRequest: BaseNode,
    ifCondition: BaseNode,
  }), []);

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

      // Get the node data from the data transfer object
      const nodeDataString = event.dataTransfer.getData('application/reactflow');
      
      if (!nodeDataString) {
        return;
      }
      
      const nodeData = JSON.parse(nodeDataString);

      // Calculate the position where the node should be created
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode = {
        id: getId(),
        type: nodeData.type,
        position,
        data: { 
          label: nodeData.label,
          description: nodeData.description,
          icon: nodeData.icon,
        },
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
        nodeTypes={nodeTypes} // Pass the custom node types
        fitView
        className="react-flow-canvas"
      >
        <Background variant="dots" gap={15} size={1} />
        <Controls />
        <MiniMap nodeColor={() => '#6c5ce7'} nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </main>
  );
};

export default WorkflowCanvas;
