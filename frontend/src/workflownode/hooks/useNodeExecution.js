/*
=================================================================
FILE: workflownode/hooks/useNodeExecution.js
=================================================================
Custom hook for node execution logic
*/

import { useState, useCallback } from 'react';
import { processApiResponse } from '../utils';

export const useNodeExecution = () => {
  const [executionResults, setExecutionResults] = useState({});
  const [isExecuting, setIsExecuting] = useState(false);

  // Execute a single node
  const executeNode = useCallback(async (nodeId, nodeConfig, inputData) => {
    setIsExecuting(true);
    
    try {
      const response = await fetch('/api/nodes/run-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node: { type: nodeConfig.nodeType, config: nodeConfig },
          inputData: inputData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const processedResult = processApiResponse(result);

      // Store execution result
      setExecutionResults(prev => ({
        ...prev,
        [nodeId]: {
          result: processedResult,
          timestamp: new Date().toISOString(),
          success: true
        }
      }));

      return processedResult;

    } catch (error) {
      console.error('Node execution error:', error);
      
      const errorResult = {
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false
      };

      setExecutionResults(prev => ({
        ...prev,
        [nodeId]: errorResult
      }));

      throw error;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  // Get execution result for a node
  const getNodeResult = useCallback((nodeId) => {
    return executionResults[nodeId];
  }, [executionResults]);

  // Clear execution results
  const clearResults = useCallback(() => {
    setExecutionResults({});
  }, []);

  // Clear result for specific node
  const clearNodeResult = useCallback((nodeId) => {
    setExecutionResults(prev => {
      const newResults = { ...prev };
      delete newResults[nodeId];
      return newResults;
    });
  }, []);

  return {
    executeNode,
    getNodeResult,
    clearResults,
    clearNodeResult,
    executionResults,
    isExecuting
  };
};