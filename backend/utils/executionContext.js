/*
=================================================================
FILE: backend/utils/executionContext.js
=================================================================
n8n-style execution context engine for backend workflow execution
*/

// Environment variables from process.env
const getEnvironmentVariables = () => ({
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_BASE: process.env.API_BASE || 'https://workflow-unlq.onrender.com',
  WORKFLOW_VERSION: process.env.WORKFLOW_VERSION || '1.0.0',
  PORT: process.env.PORT || '3001'
});

class BackendExecutionContext {
  constructor(currentNode, allNodes, workflowData, executionId, runIndex = 0) {
    this.currentNode = currentNode;
    this.allNodes = allNodes; // Map of nodeId -> nodeData
    this.workflowData = workflowData;
    this.executionId = executionId;
    this.runIndex = runIndex;
    this.itemIndex = 0;
  }

  /**
   * Build context for a specific node and item (backend version)
   */
  buildNodeContext(nodeId, itemData = null, itemIndex = 0) {
    console.log(`🔍 Looking for node ${nodeId} in allNodes:`, Object.keys(this.allNodes || {}));
    
    // Handle both Map and Object structures consistently
    const node = (this.allNodes && typeof this.allNodes.get === 'function') 
      ? this.allNodes.get(nodeId) 
      : (this.allNodes || {})[nodeId];
      
    if (!node) {
      console.error(`❌ Node ${nodeId} not found in execution context. Available nodes:`, Object.keys(this.allNodes || {}));
      console.error(`❌ AllNodes structure:`, JSON.stringify(this.allNodes, null, 2));
      
      // Create a fallback node context with the current node data
      const fallbackNode = {
        type: this.currentNode?.type || 'unknown',
        data: this.currentNode?.data || {},
        outputData: itemData || this.currentNode?.outputData || {},
        config: this.currentNode?.config || {}
      };
      
      console.log(`🔧 Creating fallback node for ${nodeId}:`, fallbackNode);
      
      // Add to allNodes to prevent future lookups from failing
      if (this.allNodes && typeof this.allNodes.set === 'function') {
        this.allNodes.set(nodeId, fallbackNode);
      } else if (this.allNodes) {
        this.allNodes[nodeId] = fallbackNode;
      } else {
        this.allNodes = { [nodeId]: fallbackNode };
      }
      
      // Use the fallback node directly instead of recursive call
      const finalNode = fallbackNode;
      
      this.itemIndex = itemIndex;

      // Core n8n context variables for backend with fallback node
      const context = {
        // Current item data for this node
        $json: itemData || finalNode.outputData || finalNode.data || {},
        
        // Access to other nodes (explicit cross-node references)
        $node: this.buildNodeReference(),
        
        // Environment variables from process.env
        $env: getEnvironmentVariables(),
        
        // Execution metadata
        $now: new Date(),
        $runIndex: this.runIndex,
        $executionId: this.executionId,
        $itemIndex: this.itemIndex,
        
        // Workflow metadata
        $workflow: {
          id: this.workflowData.id || 'unknown',
          name: this.workflowData.name || 'Untitled Workflow',
          active: this.workflowData.active || false
        },

        // Current node metadata
        $nodeId: nodeId,
        $nodeType: finalNode.type,
        $nodeLabel: finalNode.data?.label || finalNode.type
      };

      return context;
    }

    this.itemIndex = itemIndex;

    // Core n8n context variables for backend
    const context = {
      // Current item data for this node
      $json: itemData || node.outputData || node.data || {},
      
      // Access to other nodes (explicit cross-node references)
      $node: this.buildNodeReference(),
      
      // Environment variables from process.env
      $env: getEnvironmentVariables(),
      
      // Execution metadata
      $now: new Date(),
      $runIndex: this.runIndex,
      $executionId: this.executionId,
      $itemIndex: this.itemIndex,
      
      // Workflow metadata
      $workflow: {
        id: this.workflowData.id || 'unknown',
        name: this.workflowData.name || 'Untitled Workflow',
        active: this.workflowData.active || false
      },

      // Current node metadata
      $nodeId: nodeId,
      $nodeType: node.type,
      $nodeLabel: node.data?.label || node.type
    };

    return context;
  }

  /**
   * Build $node reference for accessing other nodes (backend version)
   */
  buildNodeReference() {
    const nodeRef = {};
    
    const processNode = (nodeId, node) => {
      const nodeLabel = node.data?.label || node.type || nodeId;
      
      nodeRef[nodeLabel] = {
        json: node.outputData || node.data || {},
        parameter: node.config || node.data || {},
        context: {
          type: node.type,
          id: nodeId,
          executionCount: node.executionCount || 0,
          lastExecuted: node.lastExecuted || null
        }
      };
    };

    // Handle both Map and Object structures
    if (this.allNodes && typeof this.allNodes.forEach === 'function') {
      // Map structure
      this.allNodes.forEach(processNode);
    } else if (this.allNodes && typeof this.allNodes === 'object') {
      // Object structure
      Object.entries(this.allNodes).forEach(([nodeId, node]) => {
        processNode(nodeId, node);
      });
    }

    return nodeRef;
  }

  /**
   * Evaluate expression with isolated node context (backend version)
   */
  evaluateExpression(expression, nodeId, itemData = null, itemIndex = 0) {
    if (!expression || typeof expression !== 'string') {
      return expression;
    }

    // Build isolated context for this specific node and item
    const context = this.buildNodeContext(nodeId, itemData, itemIndex);
    
    console.log(`🔒 Backend Isolated Context for ${nodeId}[${itemIndex}]:`, {
      $json: Object.keys(context.$json),
      availableNodes: Object.keys(context.$node),
      $env: Object.keys(context.$env)
    });

    // Replace expressions using the isolated context
    return expression.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, pathStr) => {
      const trimmedPath = pathStr.trim();
      
      try {
        // Evaluate the expression against the isolated context
        const result = this.evaluatePath(trimmedPath, context);
        
        if (result.found) {
          const value = typeof result.value === 'object' 
            ? JSON.stringify(result.value) 
            : String(result.value);
          
          console.log(`✅ Backend Resolved {{${trimmedPath}}} → ${value}`);
          return value;
        } else {
          console.log(`❌ Backend Path not found: {{${trimmedPath}}}`);
          return match; // Return unchanged if path not found
        }
      } catch (error) {
        console.error(`❌ Backend Expression evaluation error for {{${trimmedPath}}}:`, error);
        return match;
      }
    });
  }

  /**
   * Evaluate a path against the context (backend version)
   */
  evaluatePath(pathStr, context) {
    try {
      // Handle direct context variable access ($json, $env, etc.)
      if (pathStr.startsWith('$')) {
        return this.evaluateContextVariable(pathStr, context);
      }
      
      // Legacy support: if no $ prefix, assume $json
      return this.evaluateContextVariable(`$json.${pathStr}`, context);
      
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  /**
   * Evaluate context variables (backend version)
   */
  evaluateContextVariable(pathStr, context) {
    const parts = this.parseContextPath(pathStr);
    if (parts.length === 0) {
      return { found: false, value: undefined };
    }

    let current = context;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (current === null || current === undefined) {
        return { found: false, value: undefined };
      }

      // Handle array access
      if (typeof part === 'number') {
        if (!Array.isArray(current) || part >= current.length || part < 0) {
          return { found: false, value: undefined };
        }
        current = current[part];
      } 
      // Handle object property access
      else if (typeof current === 'object' && part in current) {
        current = current[part];
      }
      // Handle special cases like $node["Node Name"]
      else if (i === 1 && parts[0] === '$node' && typeof current === 'object') {
        // Remove quotes if present
        const nodeKey = part.replace(/^["']|["']$/g, '');
        if (nodeKey in current) {
          current = current[nodeKey];
        } else {
          return { found: false, value: undefined };
        }
      } else {
        return { found: false, value: undefined };
      }
    }

    return { found: true, value: current };
  }

  /**
   * Parse context path (backend version - same as frontend)
   */
  parseContextPath(pathStr) {
    const parts = [];
    let current = '';
    let inBracket = false;
    let inQuote = false;
    let quoteChar = '';
    
    for (let i = 0; i < pathStr.length; i++) {
      const char = pathStr[i];
      
      // Handle quotes
      if ((char === '"' || char === "'") && !inBracket) {
        if (!inQuote) {
          inQuote = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuote = false;
          quoteChar = '';
        }
        current += char;
        continue;
      }
      
      // Handle brackets
      if (char === '[' && !inQuote) {
        if (current) {
          parts.push(current);
          current = '';
        }
        inBracket = true;
      } else if (char === ']' && !inQuote) {
        if (inBracket && current) {
          // Parse array index as number, or keep as string for node references
          const bracketContent = current.replace(/^["']|["']$/g, ''); // Remove quotes
          const index = parseInt(bracketContent, 10);
          if (!isNaN(index)) {
            parts.push(index);
          } else {
            parts.push(bracketContent);
          }
          current = '';
        }
        inBracket = false;
      } else if (char === '.' && !inBracket && !inQuote) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }
    
    if (current) {
      parts.push(current);
    }
    
    return parts;
  }

  /**
   * Process multiple items for a node (multi-item support - backend)
   */
  processItems(nodeId, items = []) {
    if (!Array.isArray(items) || items.length === 0) {
      // Single item processing
      return [this.buildNodeContext(nodeId, null, 0)];
    }

    // Multi-item processing - each item gets its own context
    return items.map((item, index) => 
      this.buildNodeContext(nodeId, item, index)
    );
  }

  /**
   * Template processor for node configurations (backend helper)
   */
  processTemplates(config, nodeId, connectedNodes = []) {
    if (!config || typeof config !== 'object') {
      return config;
    }

    // Build allNodes map from connectedNodes (merge with existing, don't replace)
    const nodesMap = { ...this.allNodes }; // Preserve existing nodes
    
    if (Array.isArray(connectedNodes)) {
      connectedNodes.forEach(nodeData => {
        if (nodeData && nodeData.nodeId) {
          nodesMap[nodeData.nodeId] = {
            type: nodeData.nodeType,
            data: { label: nodeData.nodeLabel },
            outputData: nodeData.data,
            config: nodeData.config || {}
          };
        }
      });
    }
    
    // Add current node to nodesMap if not already present
    if (this.currentNode && !nodesMap[nodeId]) {
      nodesMap[nodeId] = {
        type: this.currentNode.type,
        data: this.currentNode.data || {},
        outputData: this.currentNode.outputData || {},
        config: this.currentNode.config || {}
      };
    }

    console.log(`🔧 processTemplates: Updated allNodes with keys:`, Object.keys(nodesMap));
    this.allNodes = nodesMap;

    const processedConfig = {};
    
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'string' && value.includes('{{')) {
        processedConfig[key] = this.evaluateExpression(value, nodeId, null, 0);
      } else if (typeof value === 'object' && value !== null) {
        processedConfig[key] = this.processTemplates(value, nodeId, connectedNodes);
      } else {
        processedConfig[key] = value;
      }
    }

    return processedConfig;
  }
}

// Helper function to create execution context (backend)
const createBackendExecutionContext = (currentNode, allNodes, workflowData, executionId = null) => {
  const id = executionId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const runIndex = workflowData.runIndex || 0;
  
  return new BackendExecutionContext(currentNode, allNodes, workflowData, id, runIndex);
};

module.exports = {
  BackendExecutionContext,
  createBackendExecutionContext
};