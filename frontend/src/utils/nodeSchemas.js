// Node input/output schemas for data flow mapping
export const nodeSchemas = {
  'telegram-trigger': {
    input: null, // Trigger nodes don't have inputs
    output: {
      message: {
        message_id: "number",
        from: {
          id: "number",
          is_bot: "boolean",
          first_name: "string",
          last_name: "string",
          username: "string",
          language_code: "string"
        },
        chat: {
          id: "number",
          first_name: "string",
          last_name: "string",
          username: "string",
          type: "string"
        },
        date: "number",
        text: "string"
      },
      update_id: "number"
    },
    parameters: {
      botToken: { type: 'string', required: true, label: 'Bot Token' },
      updateType: { 
        type: 'select', 
        required: true, 
        label: 'Update Type',
        options: [
          { value: 'message', label: 'Any Message' },
          { value: 'command', label: 'Specific Command' },
          { value: 'callback_query', label: 'Callback Query' }
        ]
      },
      command: { 
        type: 'string', 
        required: false, 
        label: 'Command (with /)',
        condition: { field: 'updateType', value: 'command' }
      }
    }
  },
  
  'telegram-send': {
    input: {
      message: {
        message_id: "number",
        from: {
          id: "number",
          is_bot: "boolean",
          first_name: "string",
          last_name: "string",
          username: "string",
          language_code: "string"
        },
        chat: {
          id: "number",
          first_name: "string",
          last_name: "string",
          username: "string",
          type: "string"
        },
        date: "number",
        text: "string"
      },
      update_id: "number"
    },
    output: {
      ok: "boolean",
      result: {
        message_id: "number",
        from: {
          id: "number",
          is_bot: "boolean",
          first_name: "string",
          username: "string"
        },
        chat: {
          id: "number",
          type: "string"
        },
        date: "number",
        text: "string"
      }
    },
    parameters: {
      botToken: { type: 'string', required: true, label: 'Bot Token' },
      chatId: { 
        type: 'string', 
        required: true, 
        label: 'Chat ID',
        placeholder: '{{message.chat.id}} or @channel or 123456789',
        supportTemplates: true
      },
      messageText: { 
        type: 'textarea', 
        required: true, 
        label: 'Message Text',
        placeholder: 'Hello {{message.from.first_name}}! You said: {{message.text}}',
        supportTemplates: true
      },
      parseMode: { 
        type: 'select', 
        required: false, 
        label: 'Parse Mode',
        options: [
          { value: '', label: 'None' },
          { value: 'Markdown', label: 'Markdown' },
          { value: 'HTML', label: 'HTML' }
        ]
      },
      disableWebPagePreview: { 
        type: 'boolean', 
        required: false, 
        label: 'Disable Web Page Preview',
        default: false
      }
    }
  }
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
    'message.from.first_name': 'John',
    'message.from.last_name': 'Doe',
    'message.from.username': 'johndoe',
    'message.chat.id': '-1001234567890',
    'message.text': 'Hello bot!',
    'message.message_id': '123',
    'message.date': '1640995200',
    'update_id': '987654321'
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