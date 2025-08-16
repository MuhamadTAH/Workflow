import { useState, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge } from '@xyflow/react';

// A counter to ensure unique node IDs
let id = 1;
const getNextId = () => `dndnode_${id++}`;

/**
 * Custom hook to manage the state of the workflow canvas.
 * It encapsulates the logic for nodes, edges, and connections.
 */
const useWorkflowState = () => {
  // Manages the state of all nodes on the canvas.
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  
  // Manages the state of all edges (connections) on the canvas.
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  /**
   * A memoized callback for when a user connects two nodes.
   * It adds a new edge to the edges state.
   */
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  /**
   * A callback to handle adding a new node to the canvas when
   * it's dropped from the sidebar.
   */
  const addNewNode = useCallback((type, position) => {
    const newNode = {
      id: getNextId(),
      type,
      position,
      data: { label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node` },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);


  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNewNode,
  };
};

export default useWorkflowState;
