/*
=================================================================
FILE: frontend/src/workflownode/utils/executionContext.js
=================================================================
n8n-style execution context engine with isolated node contexts
*/

// Environment variables simulation (in real app, these come from backend)
import { API_BASE_URL } from '../../config/api.js';

const ENV_VARIABLES = {
  NODE_ENV: import.meta.env.MODE || 'development',
  API_BASE: API_BASE_URL,
  WORKFLOW_VERSION: '1.0.0'
};

class ExecutionContext {
  constructor(currentNode, allNodes, workflowData, executionId, runIndex = 0) {
    this.currentNode = currentNode;
    this.allNodes = allNodes; // Map of nodeId -> nodeData
    this.workflowData = workflowData; // Global workflow execution data
    this.executionId = executionId;
    this.runIndex = runIndex;
    this.itemIndex = 0; // Current item being processed
  }

  /**
   * Build context for a specific node and item
   * This is called for each field evaluation in each node
   */
  buildNodeContext(nodeId, itemData = null, itemIndex = 0) {
    const node = this.allNodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found in execution context`);
    }

    this.itemIndex = itemIndex;

    // Core n8n context variables
    const context = {
      // Current item data for this node
      $json: itemData || node.outputData || {},
      
      // Access to other nodes (explicit cross-node references)
      $node: this.buildNodeReference(),
      
      // Environment variables
      $env: { ...ENV_VARIABLES },
      
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
   * Build $node reference for accessing other nodes
   * Usage: $node["Telegram Trigger"].json or $node["1. AI Agent"].json
   */
  buildNodeReference() {
    const nodeRef = {};
    
    this.allNodes.forEach((node, nodeId) => {
      const nodeLabel = node.data?.label || node.type;
      
      nodeRef[nodeLabel] = {
        json: node.outputData || {},
        parameter: node.data || {},
        context: {
          type: node.type,
          id: nodeId,
          executionCount: node.executionCount || 0,
          lastExecuted: node.lastExecuted || null
        }
      };
    });

    return nodeRef;
  }

  /**
   * Evaluate expression with isolated node context
   * This replaces the old resolveExpression function
   */
  evaluateExpression(expression, nodeId, itemData = null, itemIndex = 0) {
    if (!expression || typeof expression !== 'string') {
      return expression;
    }

    // Build isolated context for this specific node and item
    const context = this.buildNodeContext(nodeId, itemData, itemIndex);
    
    console.log(`🔒 Isolated Context for ${nodeId}[${itemIndex}]:`, {
      $json: context.$json,
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
          
          console.log(`✅ Resolved {{${trimmedPath}}} → ${value}`);
          return value;
        } else {
          console.log(`❌ Path not found: {{${trimmedPath}}}`);
          return match; // Return unchanged if path not found
        }
      } catch (error) {
        console.error(`❌ Expression evaluation error for {{${trimmedPath}}}:`, error);
        return match;
      }
    });
  }

  /**
   * Evaluate a path against the context (like $json.message or $node["AI Agent"].json.response)
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
   * Evaluate context variables like $json.message, $node["AI"].json, $env.NODE_ENV
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
   * Parse context path like $json.message[0] or $node["AI Agent"].json
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
   * Process multiple items for a node (multi-item support)
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
}

// Helper function to create execution context
export const createExecutionContext = (currentNode, allNodes, workflowData, executionId = null) => {
  const id = executionId || `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const runIndex = workflowData.runIndex || 0;
  
  return new ExecutionContext(currentNode, allNodes, workflowData, id, runIndex);
};

export default ExecutionContext;