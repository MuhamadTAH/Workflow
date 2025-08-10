/*
=================================================================
FILE: frontend/src/workflownode/utils/workflowExecutor.js
=================================================================
Workflow execution engine for automatic step-by-step processing
*/

import { API_BASE_URL } from '../../config/api.js';

const API_BASE = API_BASE_URL;

class WorkflowExecutor {
  constructor(nodes, edges, onProgress = null) {
    this.nodes = nodes;
    this.edges = edges;
    this.onProgress = onProgress; // Callback for progress updates
    this.results = new Map(); // Store results from each node
    this.isExecuting = false;
    this.executionOrder = [];
  }

  // Build execution order based on node connections
  buildExecutionOrder() {
    const visited = new Set();
    const order = [];
    const inDegree = new Map();
    
    // Initialize in-degree count for all nodes
    this.nodes.forEach(node => {
      inDegree.set(node.id, 0);
    });
    
    // Calculate in-degrees
    this.edges.forEach(edge => {
      const currentInDegree = inDegree.get(edge.target) || 0;
      inDegree.set(edge.target, currentInDegree + 1);
    });
    
    // Start with nodes that have no incoming edges (trigger nodes)
    const queue = [];
    this.nodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node);
      }
    });
    
    // Topological sort
    while (queue.length > 0) {
      const currentNode = queue.shift();
      order.push(currentNode);
      visited.add(currentNode.id);
      
      // Find all outgoing edges from current node
      const outgoingEdges = this.edges.filter(edge => edge.source === currentNode.id);
      
      outgoingEdges.forEach(edge => {
        const targetNode = this.nodes.find(n => n.id === edge.target);
        if (targetNode) {
          const newInDegree = inDegree.get(edge.target) - 1;
          inDegree.set(edge.target, newInDegree);
          
          if (newInDegree === 0 && !visited.has(edge.target)) {
            queue.push(targetNode);
          }
        }
      });
    }
    
    this.executionOrder = order;
    return order;
  }

  // Get input data for a node from its predecessors
  getInputData(nodeId) {
    const incomingEdges = this.edges.filter(edge => edge.target === nodeId);
    
    if (incomingEdges.length === 0) {
      // No incoming edges, this is a trigger node
      return this.generateTriggerData();
    }
    
    let inputData = [];
    
    incomingEdges.forEach(edge => {
      const sourceResult = this.results.get(edge.source);
      if (sourceResult && sourceResult.success) {
        // Handle different result formats
        if (sourceResult.result) {
          if (Array.isArray(sourceResult.result)) {
            inputData = inputData.concat(sourceResult.result);
          } else {
            inputData.push(sourceResult.result);
          }
        } else if (sourceResult.data) {
          if (Array.isArray(sourceResult.data)) {
            inputData = inputData.concat(sourceResult.data);
          } else {
            inputData.push(sourceResult.data);
          }
        } else {
          // Use the entire result object
          inputData.push(sourceResult);
        }
      }
    });
    
    return inputData.length > 0 ? inputData : [{}];
  }

  // Generate sample trigger data for testing
  generateTriggerData() {
    return [{
      message: "Test message for workflow execution",
      user: {
        id: "test-user",
        name: "Test User"
      },
      timestamp: new Date().toISOString(),
      source: "manual_trigger"
    }];
  }

  // Execute a single node
  async executeNode(node) {
    try {
      this.onProgress?.(`Executing ${node.data.label || node.data.type}...`);
      
      // Get input data from previous nodes
      const inputData = this.getInputData(node.id);
      
      console.log(`🔄 Executing node ${node.id} (${node.data.type})`);
      console.log('Input data:', inputData);
      
      // Prepare connected nodes information
      const connectedNodes = this.edges
        .filter(edge => edge.source === node.id)
        .map(edge => {
          const targetNode = this.nodes.find(n => n.id === edge.target);
          return targetNode ? {
            id: targetNode.id,
            type: targetNode.data.type,
            config: targetNode.data
          } : null;
        })
        .filter(Boolean);

      // Call backend to execute the node
      const response = await fetch(`${API_BASE}/api/nodes/run-node`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          node: {
            id: node.id,
            type: node.data.type,
            config: node.data
          },
          inputData: inputData,
          connectedNodes: connectedNodes
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Node execution failed');
      }
      
      console.log(`✅ Node ${node.id} executed successfully:`, result);
      
      // Store result for next nodes
      this.results.set(node.id, result);
      
      // Update node's output data for UI display
      this.updateNodeOutputData(node.id, result);
      
      return result;
      
    } catch (error) {
      console.error(`❌ Node ${node.id} execution failed:`, error);
      const errorResult = {
        success: false,
        error: error.message,
        nodeId: node.id
      };
      this.results.set(node.id, errorResult);
      throw error;
    }
  }

  // Update node's output data in the UI
  updateNodeOutputData(nodeId, result) {
    const node = this.nodes.find(n => n.id === nodeId);
    if (node) {
      node.data.outputData = result.result || result.data || result;
      node.data.lastExecuted = new Date().toISOString();
      node.data.executionCount = (node.data.executionCount || 0) + 1;
    }
  }

  // Execute the entire workflow
  async executeWorkflow() {
    if (this.isExecuting) {
      throw new Error('Workflow is already executing');
    }

    this.isExecuting = true;
    this.results.clear();
    
    try {
      this.onProgress?.('Building execution order...');
      const executionOrder = this.buildExecutionOrder();
      
      if (executionOrder.length === 0) {
        throw new Error('No nodes to execute');
      }
      
      console.log('🚀 Starting workflow execution');
      console.log('Execution order:', executionOrder.map(n => `${n.id} (${n.data.type})`));
      
      const results = [];
      
      // Execute nodes in order
      for (let i = 0; i < executionOrder.length; i++) {
        const node = executionOrder[i];
        this.onProgress?.(`Step ${i + 1}/${executionOrder.length}: ${node.data.label || node.data.type}`);
        
        try {
          const result = await this.executeNode(node);
          results.push({
            nodeId: node.id,
            nodeType: node.data.type,
            success: true,
            result: result
          });
          
          // Small delay between nodes for visual feedback
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Node ${node.id} failed:`, error);
          results.push({
            nodeId: node.id,
            nodeType: node.data.type,
            success: false,
            error: error.message
          });
          
          // Continue execution even if one node fails
          continue;
        }
      }
      
      const successfulNodes = results.filter(r => r.success).length;
      const failedNodes = results.filter(r => !r.success).length;
      
      console.log(`✅ Workflow execution completed: ${successfulNodes} successful, ${failedNodes} failed`);
      
      this.onProgress?.(`Completed: ${successfulNodes} successful, ${failedNodes} failed nodes`);
      
      return {
        success: true,
        totalNodes: executionOrder.length,
        successfulNodes,
        failedNodes,
        results: results,
        executionOrder: executionOrder.map(n => n.id)
      };
      
    } catch (error) {
      console.error('❌ Workflow execution failed:', error);
      this.onProgress?.(`Failed: ${error.message}`);
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  // Stop workflow execution
  stop() {
    this.isExecuting = false;
    this.onProgress?.('Execution stopped');
  }

  // Get execution results
  getResults() {
    return Object.fromEntries(this.results);
  }

  // Check if workflow is currently executing
  isRunning() {
    return this.isExecuting;
  }
}

export default WorkflowExecutor;