import React from 'react';

// Updated node data to include description and a specific icon for each
const availableNodes = [
  { 
    type: 'telegramTrigger', 
    label: 'Telegram Trigger', 
    description: 'Starts when a message is received',
    icon: 'fab fa-telegram-plane' 
  },
  { 
    type: 'webhookTrigger', 
    label: 'Webhook', 
    description: 'Triggers on an HTTP request',
    icon: 'fas fa-globe' 
  },
  { 
    type: 'sendMessage', 
    label: 'Telegram Send Message', 
    description: 'Send messages to Telegram bot chats',
    icon: 'fas fa-paper-plane' 
  },
  { 
    type: 'httpRequest', 
    label: 'HTTP Request', 
    description: 'Make an outbound HTTP request',
    icon: 'fas fa-server' 
  },
  { 
    type: 'ifCondition', 
    label: 'IF Condition', 
    description: 'Branch your workflow based on logic',
    icon: 'fas fa-code-branch' 
  },
];

const NodePalette = () => {
  // This function is called when a drag operation starts from the palette
  const onDragStart = (event, node) => {
    // We now stringify the whole node object to pass all its data
    event.dataTransfer.setData('application/reactflow', JSON.stringify(node));
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
            onDragStart={(event) => onDragStart(event, node)}
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
