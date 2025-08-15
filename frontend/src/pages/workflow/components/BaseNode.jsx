// Base node component
// All specific nodes (triggers, actions, conditions) extend this
// Handles common node functionality like selection, connection points, dragging
// Provides consistent node styling and behavior

import React from 'react';
import { Handle, Position } from 'reactflow';
import '../styles/Nodes.css'; // We will create styles for this component

const BaseNode = ({ data }) => {
  // data object will contain icon, label, and description
  const { icon, label, description } = data;

  return (
    <div className="custom-node">
      {/* Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="handle-left"
      />

      {/* Node Body */}
      <div className="node-body">
        <div className="node-icon">
          <i className={icon || 'fas fa-question-circle'}></i>
        </div>
        <div className="node-content">
          <div className="node-title">{label}</div>
          <div className="node-description">{description}</div>
        </div>
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="handle-right"
      />
    </div>
  );
};

export default BaseNode;
