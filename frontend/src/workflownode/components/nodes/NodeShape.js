/*
=================================================================
FILE: NodeShape.js - MASTER NODE SHAPE CONTROLLER
=================================================================
🎯 MASTER FILE: Edit this file to change ALL node shapes in the project
When you modify this file, ALL nodes in the main project will update their shape

This file contains the pure visual structure and layout of nodes.
*/

import React from 'react';
import { Handle, Position } from 'reactflow';

const NodeShape = ({ data = {}, nodeHeight, totalInputHandles, totalOutputHandles }) => {
  // Determine node type for specific styling
  const isIfNode = data.type === 'if';
  const isLoopNode = data.type === 'loop';
  const isCompareNode = data.type === 'compare';
  const isSwitchNode = data.type === 'switch';
  const hasNoOutputs = data.type === 'stopAndError';
  const isMergeNode = data.type === 'merge';

  // Handle positioning calculations
  const getInputHandleStyle = (index, total) => {
    if (total === 1) return { top: '50%' };
    const spacing = 100 / (total + 1);
    return { top: `${spacing * (index + 1)}%` };
  };

  const getOutputHandleStyle = (index, total) => {
    if (total === 1) return { top: '50%' };
    const spacing = 100 / (total + 1);
    return { top: `${spacing * (index + 1)}%` };
  };

  // Generate input handles
  const renderInputHandles = () => {
    const handles = [];
    for (let i = 0; i < totalInputHandles; i++) {
      handles.push(
        <Handle
          key={`input-${i}`}
          type="target"
          position={Position.Left}
          id={`input-${i}`}
          style={getInputHandleStyle(i, totalInputHandles)}
          className="handle-input"
        />
      );
    }
    return handles;
  };

  // Generate output handles with labels
  const renderOutputHandles = () => {
    if (hasNoOutputs) return null;

    const handles = [];
    
    if (isIfNode) {
      // If node: True/False outputs
      handles.push(
        <Handle key="output-true" type="source" position={Position.Right} 
                id="output-true" style={getOutputHandleStyle(0, 2)} 
                className="handle-true" />,
        <Handle key="output-false" type="source" position={Position.Right} 
                id="output-false" style={getOutputHandleStyle(1, 2)} 
                className="handle-false" />
      );
    } else if (isLoopNode) {
      // Loop node: Loop/Done outputs
      handles.push(
        <Handle key="output-loop" type="source" position={Position.Right} 
                id="output-loop" style={getOutputHandleStyle(0, 2)} 
                className="handle-loop" />,
        <Handle key="output-done" type="source" position={Position.Right} 
                id="output-done" style={getOutputHandleStyle(1, 2)} 
                className="handle-done" />
      );
    } else if (isCompareNode) {
      // Compare node: Added/Removed/Changed outputs
      handles.push(
        <Handle key="output-added" type="source" position={Position.Right} 
                id="output-added" style={getOutputHandleStyle(0, 3)} 
                className="handle-true" />,
        <Handle key="output-removed" type="source" position={Position.Right} 
                id="output-removed" style={getOutputHandleStyle(1, 3)} 
                className="handle-false" />,
        <Handle key="output-changed" type="source" position={Position.Right} 
                id="output-changed" style={getOutputHandleStyle(2, 3)} 
                className="handle-loop" />
      );
    } else if (isSwitchNode) {
      // Switch node: Dynamic outputs based on rules
      const rulesCount = data.switchRules?.length || 1;
      const hasFallback = data.switchOptions?.includes('fallbackOutput');
      
      for (let i = 0; i < rulesCount; i++) {
        handles.push(
          <Handle key={`output-rule-${i}`} type="source" position={Position.Right} 
                  id={`output-rule-${i}`} style={getOutputHandleStyle(i, totalOutputHandles)} 
                  className="handle-true" />
        );
      }
      
      if (hasFallback) {
        handles.push(
          <Handle key="output-fallback" type="source" position={Position.Right} 
                  id="output-fallback" style={getOutputHandleStyle(rulesCount, totalOutputHandles)} 
                  className="handle-false" />
        );
      }
    } else {
      // Standard single output with a plus icon, as per the new design
      handles.push(
        <Handle key="output-main" type="source" position={Position.Right} id="output-main" style={{ top: '50%' }} className="handle-main">
          +
        </Handle>
      );
    }
    
    return handles;
  };

  return (
    <div 
      className="custom-node-ai" 
      style={{ 
        height: `${nodeHeight}px`,
        minHeight: '80px'
      }}
    >
      {/* INPUT HANDLES */}
      {renderInputHandles()}

      {/* NODE CONTENT */}
      <div className="node-content">
        <div className="node-header">
          {data.icon && <i className={`fa-solid ${data.icon} node-icon ${data.color || ''}`}></i>}
          <div className="node-label">{data.label || data.type || 'Node'}</div>
        </div>
        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
        {data.status && (
          <div className="node-status">{data.status}</div>
        )}
      </div>

      {/* OUTPUT HANDLES */}
      {renderOutputHandles()}

      {/* HANDLE LABELS */}
      {isIfNode && (
        <>
          <div className="handle-label handle-label-right handle-label-true" 
               style={getOutputHandleStyle(0, 2)}>True</div>
          <div className="handle-label handle-label-right handle-label-false" 
               style={getOutputHandleStyle(1, 2)}>False</div>
        </>
      )}
      
      {isLoopNode && (
        <>
          <div className="handle-label handle-label-right handle-label-loop" 
               style={getOutputHandleStyle(0, 2)}>Loop</div>
          <div className="handle-label handle-label-right handle-label-done" 
               style={getOutputHandleStyle(1, 2)}>Done</div>
        </>
      )}
    </div>
  );
};

export default NodeShape;
