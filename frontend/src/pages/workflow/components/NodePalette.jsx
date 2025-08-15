// Node palette/sidebar component
// Lists all available nodes (triggers, actions, conditions)
// Users can drag nodes from here to the canvas
// Organized by categories (Telegram, Email, Conditions, etc.)
import React from 'react';

// Placeholder for the available nodes
const availableNodes = [
  { type: 'telegramTrigger', label: 'Telegram Trigger', icon: 'fab fa-telegram-plane' },
  { type: 'webhookTrigger', label: 'Webhook', icon: 'fas fa-globe' },
  { type: 'sendMessage', label: 'Send Telegram Message', icon: 'fas fa-paper-plane' },
  { type: 'httpRequest', label: 'HTTP Request', icon: 'fas fa-server' },
  { type: 'ifCondition', label: 'IF Condition', icon: 'fas fa-code-branch' },
];

const NodePalette = () => {
  return (
    <aside className="node-palette">
      <h2>Nodes</h2>
      <div className="node-list">
        {availableNodes.map(node => (
          <div key={node.type} className="node-item">
            <i className={node.icon}></i>
            <span>{node.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default NodePalette;
