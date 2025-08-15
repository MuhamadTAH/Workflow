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
  // This function is called when a drag operation starts from the palette
  const onDragStart = (event, nodeType) => {
    // We store the node type in the drag event's data transfer object
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="node-palette">
      <h2>Nodes</h2>
      <div className="node-list">
        {availableNodes.map(node => (
          <div
            key={node.type}
            className="node-item"
            onDragStart={(event) => onDragStart(event, node.type)}
            draggable // Make the element draggable
          >
            <i className={node.icon}></i>
            <span>{node.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default NodePalette;
