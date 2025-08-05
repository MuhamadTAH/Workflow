/*
=================================================================
NODE TYPES DEFINITIONS
=================================================================
Central registry of all available node types with their configurations.
*/

export const nodeTypes = {
  // ===== TRIGGER NODES =====
  telegram_trigger: {
    type: 'telegram_trigger',
    label: 'Telegram Trigger',
    description: 'Starts workflow when Telegram messages are received',
    icon: 'fas fa-paper-plane',
    category: 'trigger',
    color: '#0088cc',
    bgColor: '#e3f2fd',
    handles: {
      inputs: [],
      outputs: ['default']
    },
    defaultConfig: {
      botToken: '',
      webhookUrl: '',
      listenToAll: true
    }
  },

  webhook_trigger: {
    type: 'webhook_trigger',
    label: 'Webhook Trigger',
    description: 'Triggers workflow when HTTP requests are received',
    icon: 'fas fa-link',
    category: 'trigger',
    color: '#4caf50',
    bgColor: '#e8f5e8',
    handles: {
      inputs: [],
      outputs: ['default']
    },
    defaultConfig: {
      webhookUrl: '',
      httpMethod: 'POST',
      authentication: false
    }
  },

  // ===== ACTION NODES =====
  ai_agent: {
    type: 'ai_agent',
    label: 'AI Agent',
    description: 'Process data using Claude AI with configurable prompts',
    icon: 'fas fa-robot',
    category: 'action',
    color: '#7c3aed',
    bgColor: '#f3e8ff',
    handles: {
      inputs: ['default'],
      outputs: ['default', 'error']
    },
    defaultConfig: {
      systemPrompt: 'You are a helpful AI assistant.',
      userPrompt: '{{message.text}}',
      apiKey: '',
      model: 'claude-3-sonnet'
    }
  },

  model: {
    type: 'model',
    label: 'AI Chat Model',
    description: 'Interactive AI chat interface with conversation memory',
    icon: 'fas fa-comments',
    category: 'action',
    color: '#ec4899',
    bgColor: '#fdf2f8',
    handles: {
      inputs: ['default'],
      outputs: ['default']
    },
    defaultConfig: {
      apiKey: '',
      systemPrompt: '',
      userId: 'default_user',
      enableMemory: true
    }
  },

  google_docs: {
    type: 'google_docs',
    label: 'Google Docs',
    description: 'Read, create, and update Google Docs documents',
    icon: 'fab fa-google-drive',
    category: 'action',
    color: '#4285f4',
    bgColor: '#e8f0fe',
    handles: {
      inputs: ['default'],
      outputs: ['default', 'error']
    },
    defaultConfig: {
      action: 'get_document',
      documentUrl: '',
      content: '',
      title: ''
    }
  },

  telegram_send_message: {
    type: 'telegram_send_message',
    label: 'Telegram Send Message',
    description: 'Send messages to Telegram chats using your bot',
    icon: 'fas fa-paper-plane',
    category: 'action',
    color: '#0088cc',
    bgColor: '#e3f2fd',
    handles: {
      inputs: ['default'],
      outputs: ['default', 'error']
    },
    defaultConfig: {
      botToken: '',
      chatId: '',
      message: '',
      parseMode: 'HTML'
    }
  },

  data_storage: {
    type: 'data_storage',
    label: 'Data Storage',
    description: 'Store and manage key-value data for workflow use',
    icon: 'fas fa-database',
    category: 'utility',
    color: '#ff6b35',
    bgColor: '#fff4e6',
    handles: {
      inputs: ['default'],
      outputs: ['default']
    },
    defaultConfig: {
      storageData: {}
    }
  },

  // ===== LOGIC NODES =====
  if: {
    type: 'if',
    label: 'If Condition',
    description: 'Route workflow based on conditional logic',
    icon: 'fas fa-code-branch',
    category: 'logic',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    handles: {
      inputs: ['default'],
      outputs: ['true', 'false']
    },
    defaultConfig: {
      conditions: [{
        field: '',
        operator: 'equals',
        value: '',
        caseSensitive: true
      }],
      combineConditions: 'AND'
    }
  },

  filter: {
    type: 'filter',
    label: 'Data Filter',
    description: 'Filter arrays based on specified conditions',
    icon: 'fas fa-filter',
    category: 'utility',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    handles: {
      inputs: ['default'],
      outputs: ['default']
    },
    defaultConfig: {
      conditions: [{
        field: '',
        operator: 'equals',
        value: ''
      }],
      keepMatching: true
    }
  },

  merge: {
    type: 'merge',
    label: 'Data Merger',
    description: 'Combine data from multiple sources',
    icon: 'fas fa-link',
    category: 'utility',
    color: '#f97316',
    bgColor: '#fff7ed',
    handles: {
      inputs: ['input1', 'input2'],
      outputs: ['default']
    },
    defaultConfig: {
      mode: 'append',
      mergeByKey: ''
    }
  },

  set_data: {
    type: 'set_data',
    label: 'Set Data',
    description: 'Create and modify data fields',
    icon: 'fas fa-edit',
    category: 'utility',
    color: '#06b6d4',
    bgColor: '#cffafe',
    handles: {
      inputs: ['default'],
      outputs: ['default']
    },
    defaultConfig: {
      fields: {}
    }
  },

  wait: {
    type: 'wait',
    label: 'Wait/Delay',
    description: 'Pause workflow execution for specified time',
    icon: 'fas fa-clock',
    category: 'control',
    color: '#84cc16',
    bgColor: '#f7fee7',
    handles: {
      inputs: ['default'],
      outputs: ['default']
    },
    defaultConfig: {
      waitType: 'duration',
      duration: 5,
      unit: 'seconds'
    }
  },

  stop_error: {
    type: 'stop_error',
    label: 'Stop & Error',
    description: 'Halt workflow execution with custom error',
    icon: 'fas fa-stop',
    category: 'control',
    color: '#ef4444',
    bgColor: '#fef2f2',
    handles: {
      inputs: ['default'],
      outputs: []
    },
    defaultConfig: {
      errorMessage: 'Workflow stopped',
      errorType: 'simple'
    }
  }
};

// Helper functions
export const getNodeType = (type) => nodeTypes[type];

export const getNodesByCategory = () => {
  const categories = {};
  Object.values(nodeTypes).forEach(node => {
    if (!categories[node.category]) {
      categories[node.category] = [];
    }
    categories[node.category].push(node);
  });
  return categories;
};

export const createNodeData = (type, overrides = {}) => {
  const nodeType = getNodeType(type);
  if (!nodeType) throw new Error(`Unknown node type: ${type}`);
  
  return {
    ...nodeType,
    id: `${type}_${Date.now()}`,
    ...overrides
  };
};

export default nodeTypes;