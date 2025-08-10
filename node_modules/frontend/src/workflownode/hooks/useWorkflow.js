/*
=================================================================
FILE: workflownode/hooks/useWorkflow.js
=================================================================
Custom hook for workflow state management
*/

import { useState, useCallback } from 'react';
import { addEdge } from 'reactflow';

export const useWorkflow = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // Handle node changes
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => nds.map(node => {
      const change = changes.find(c => c.id === node.id);
      if (change) {
        return { ...node, ...change };
      }
      return node;
    }));
  }, []);

  // Handle edge changes
  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => eds.map(edge => {
      const change = changes.find(c => c.id === edge.id);
      if (change) {
        return { ...edge, ...change };
      }
      return edge;
    }));
  }, []);

  // Handle connection creation
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  // Add new node
  const addNode = useCallback((newNode) => {
    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Remove node
  const removeNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    setEdges((eds) => eds.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
  }, []);

  // Update node data
  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) => nds.map(node => 
      node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node
    ));
  }, []);

  return {
    nodes,
    edges,
    selectedNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    removeNode,
    updateNodeData
  };
};