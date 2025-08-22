/*
=================================================================
FILE: CustomLogicNode.js - NODE LOGIC CONTROLLER
=================================================================
This component handles the business logic and imports the master
shape and styling from independent files.

🎯 SHAPE: Controlled by NodeShape.js
🎯 STYLING: Controlled by NodeStyles.css

Edit NodeShape.js to change visual structure
Edit NodeStyles.css to change visual appearance
*/
import React from 'react';
import NodeShape from './NodeShape.js';
import './NodeStyles.css';

const CustomLogicNode = ({ data = {} }) => {
  // Business logic calculations (not visual)
  const isIfNode = data.type === 'if';
  const isLoopNode = data.type === 'loop';
  const isCompareNode = data.type === 'compare';
  const isSwitchNode = data.type === 'switch';
  const hasNoOutputs = data.type === 'stopAndError';
  const isMergeNode = data.type === 'merge';
  
  // Trigger nodes - these nodes start workflows and have no inputs
  const isTriggerNode = data.type === 'chatTrigger' || 
                        data.type === 'telegramTrigger' || 
                        data.type === 'trigger';

  // Calculate total number of output handles for dynamic sizing
  const getTotalOutputHandles = () => {
    if (isIfNode || isLoopNode) return 2;
    if (isCompareNode) return 3;
    if (isSwitchNode) {
      const rulesCount = data.switchRules?.length || 1;
      const fallbackCount = data.switchOptions?.includes('fallbackOutput') ? 1 : 0;
      return rulesCount + fallbackCount;
    }
    if (hasNoOutputs) return 0;
    return 1;
  };

  // Calculate total number of input handles for dynamic sizing
  const getTotalInputHandles = () => {
    // Trigger nodes have no inputs - they start workflows
    if (isTriggerNode) return 0;
    if (isCompareNode) return 2;
    return 1;
  };

  const totalOutputHandles = getTotalOutputHandles();
  const totalInputHandles = getTotalInputHandles();
  
  // Dynamic node height based on number of handles
  const getNodeHeight = () => {
    const baseHeight = 80;
    const handleHeight = 20;
    const maxHandles = Math.max(totalOutputHandles, totalInputHandles);
    return Math.max(baseHeight, maxHandles * handleHeight + 40);
  };

  const nodeHeight = getNodeHeight();

  // Return the NodeShape with calculated props
  return (
    <NodeShape 
      data={data}
      nodeHeight={nodeHeight}
      totalInputHandles={totalInputHandles}
      totalOutputHandles={totalOutputHandles}
    />
  );
};

export default CustomLogicNode;