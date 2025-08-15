export const serializeWorkflow = (nodes, edges, viewport = {}) => {
  return {
    nodes: nodes || [],
    edges: edges || [],
    viewport: viewport || { x: 0, y: 0, zoom: 1 }
  };
};

export const deserializeWorkflow = (data) => {
  if (!data) {
    return {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 }
    };
  }
  
  return {
    nodes: data.nodes || [],
    edges: data.edges || [],
    viewport: data.viewport || { x: 0, y: 0, zoom: 1 }
  };
};

export default { serializeWorkflow, deserializeWorkflow };