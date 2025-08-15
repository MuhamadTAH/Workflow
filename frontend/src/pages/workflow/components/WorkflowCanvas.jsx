import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
} from 'reactflow';
import BaseNode from './BaseNode';

const WorkflowCanvas = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  setEdges,
  onDrop,
}) => {
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

  return (
    <main className="workflow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
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
