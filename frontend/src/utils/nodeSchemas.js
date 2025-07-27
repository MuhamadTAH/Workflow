// Node input/output schemas for data flow mapping
export const nodeSchemas = {
  // Telegram nodes removed - system now ready for other integrations
};

// Get available template variables from input data
export function getAvailableTemplates(nodeType, inputData = null) {
  const schema = nodeSchemas[nodeType];
  if (!schema || !schema.input) return [];

  const templates = [];
  
  function extractTemplates(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        extractTemplates(value, path);
      } else {
        templates.push({
          path,
          type: value,
          example: getExampleValue(value, path)
        });
      }
    }
  }

  extractTemplates(schema.input);
  return templates;
}

// Get example value for a template path
function getExampleValue(type, path) {
  const examples = {
    // Generic examples for future node types
  };

  if (examples[path]) {
    return examples[path];
  }

  switch (type) {
    case 'string': return 'sample text';
    case 'number': return 123;
    case 'boolean': return true;
    default: return 'value';
  }
}

// Validate node configuration
export function validateNodeConfig(nodeType, config) {
  const schema = nodeSchemas[nodeType];
  if (!schema || !schema.parameters) return { valid: true, errors: [] };

  const errors = [];

  for (const [paramName, paramSchema] of Object.entries(schema.parameters)) {
    const value = config[paramName];

    // Check required fields
    if (paramSchema.required && (!value || value.toString().trim() === '')) {
      errors.push(`${paramSchema.label} is required`);
      continue;
    }

    // Check conditional fields
    if (paramSchema.condition) {
      const conditionField = paramSchema.condition.field;
      const conditionValue = paramSchema.condition.value;
      if (config[conditionField] === conditionValue && (!value || value.toString().trim() === '')) {
        errors.push(`${paramSchema.label} is required when ${conditionField} is ${conditionValue}`);
      }
    }

    // Type-specific validation
    if (value && paramSchema.type === 'string' && typeof value !== 'string') {
      errors.push(`${paramSchema.label} must be a string`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Process templates in configuration values
export function processTemplates(text, inputData) {
  if (!text || typeof text !== 'string' || !inputData) {
    return text;
  }

  return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getValueByPath(inputData, path.trim());
    return value !== undefined ? value.toString() : match;
  });
}

// Get value from object by dot notation path
function getValueByPath(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Get input schema for a node based on connected inputs
export function getNodeInputSchema(nodeId, nodes, connections) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  // Find incoming connections
  const incomingConnections = connections.filter(conn => conn.to === nodeId);
  
  if (incomingConnections.length === 0) {
    // No incoming connections, use default schema
    return nodeSchemas[node.type]?.input || null;
  }

  // Merge schemas from all incoming connections
  let mergedSchema = {};
  
  for (const connection of incomingConnections) {
    const sourceNode = nodes.find(n => n.id === connection.from);
    if (sourceNode) {
      const sourceOutputSchema = nodeSchemas[sourceNode.type]?.output;
      if (sourceOutputSchema) {
        mergedSchema = { ...mergedSchema, ...sourceOutputSchema };
      }
    }
  }

  return Object.keys(mergedSchema).length > 0 ? mergedSchema : null;
}

// Generate data flow documentation
export function generateDataFlowDocs(nodes, connections) {
  const docs = {
    nodes: {},
    flow: []
  };

  // Document each node
  for (const node of nodes) {
    const schema = nodeSchemas[node.type];
    docs.nodes[node.id] = {
      type: node.type,
      label: node.label,
      input: schema?.input,
      output: schema?.output,
      parameters: schema?.parameters
    };
  }

  // Document data flow
  for (const connection of connections) {
    const sourceNode = nodes.find(n => n.id === connection.from);
    const targetNode = nodes.find(n => n.id === connection.to);
    
    if (sourceNode && targetNode) {
      docs.flow.push({
        from: {
          id: sourceNode.id,
          type: sourceNode.type,
          label: sourceNode.label
        },
        to: {
          id: targetNode.id,
          type: targetNode.type,
          label: targetNode.label
        },
        dataSchema: nodeSchemas[sourceNode.type]?.output
      });
    }
  }

  return docs;
}