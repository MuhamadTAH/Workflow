export const validateNode = (node) => {
  if (!node || !node.type) {
    return { isValid: false, errors: ['Node type is required'] };
  }
  
  return { isValid: true, errors: [] };
};

export const validateWorkflow = (nodes, edges) => {
  const errors = [];
  
  if (!nodes || nodes.length === 0) {
    errors.push('Workflow must contain at least one node');
  }
  
  nodes.forEach(node => {
    const validation = validateNode(node);
    if (!validation.isValid) {
      errors.push(...validation.errors);
    }
  });
  
  return { isValid: errors.length === 0, errors };
};

export default { validateNode, validateWorkflow };