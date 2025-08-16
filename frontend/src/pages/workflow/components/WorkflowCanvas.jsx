import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge 
} from 'reactflow';
import 'reactflow/dist/style.css';
import BaseNode from './BaseNode';

// Wrapper components to pass the node type
const TelegramTriggerNode = (props) => <BaseNode {...props} type="telegramTrigger" />;
import '../styles/WorkflowCanvas.css';

// Initial nodes - starting with just the Telegram trigger
const initialNodes = [
  {
    id: '1',
    type: 'telegramTrigger',
    position: { x: 250, y: 100 },
    data: {
      icon: 'fab fa-telegram-plane',
      label: 'Telegram Trigger',
      description: 'Triggered when a message is received'
    }
  }
];

const initialEdges = [];

// Define custom node types
const nodeTypes = { 
  telegramTrigger: TelegramTriggerNode,
};

const WorkflowCanvas = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = event.target.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = {
        id: `${Date.now()}`,
        type,
        position,
        data: { 
          icon: 'fab fa-telegram-plane',
          label: 'New Node',
          description: 'Node description'
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  return (
    <div className="workflow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <Background variant="dots" gap={20} size={1} />
        <Controls />
        <MiniMap 
          nodeColor="#6c5ce7"
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};

export default WorkflowCanvas;