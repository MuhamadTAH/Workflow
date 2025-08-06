/*
=================================================================
FILE: workflownode/utils/nodeHelpers.js
=================================================================
Utility functions for node creation and manipulation
*/

// Simple utility to generate unique IDs for new nodes
let id = 0;
export const getId = () => `dndnode_${id++}`;

// Helper to create new node with standard properties
export const createNewNode = (nodeType, position, data = {}) => {
  return {
    id: getId(),
    type: 'custom',
    position,
    data: {
      nodeType,
      ...data
    }
  };
};

// Helper to find connected nodes
export const findConnectedNodes = (nodeId, edges, direction = 'input') => {
  return edges.filter(edge => 
    direction === 'input' ? edge.target === nodeId : edge.source === nodeId
  );
};

// Helper to validate node connections
export const validateNodeConnection = (source, target, edges) => {
  // Prevent self-connection
  if (source === target) return false;
  
  // Check for existing connection
  const existingConnection = edges.find(edge => 
    edge.source === source && edge.target === target
  );
  
  return !existingConnection;
};