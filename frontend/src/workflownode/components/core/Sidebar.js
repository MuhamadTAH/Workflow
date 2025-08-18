/*
=================================================================
FILE: frontend/src/components/Sidebar.js
=================================================================
This component renders the sidebar with a complete list of all
available draggable nodes for the workflow.
*/
import React from 'react';

const DraggableNode = ({ nodeInfo }) => {
  const onDragStart = (event, nodeInfo) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeInfo));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Determine correct FontAwesome prefix for sidebar icons
  const getIconClass = (icon) => {
    if (!icon) return '';
    
    // Brand icons (social media, etc.) use fa-brands
    const brandIcons = [
      'fa-telegram', 'fa-whatsapp', 'fa-instagram', 'fa-linkedin', 
      'fa-tiktok', 'fa-facebook', 'fa-twitter', 'fa-youtube',
      'fa-discord', 'fa-slack', 'fa-github'
    ];
    
    // Check if it's a brand icon
    if (brandIcons.includes(icon)) {
      return `fa-brands ${icon}`;
    }
    
    // Default to solid icons for utility/logic icons
    return `fa-solid ${icon}`;
  };

  return (
    <div
      className="sidebar-node-item"
      onDragStart={(event) => onDragStart(event, nodeInfo)}
      draggable
    >
      <div className="node-icon">
        <i className={`${getIconClass(nodeInfo.icon)} ${nodeInfo.color}`}></i>
      </div>
      <div className="node-info">
        <div className="node-title">{nodeInfo.label}</div>
        <div className="node-description">{nodeInfo.description}</div>
      </div>
    </div>
  );
};

const Sidebar = () => {
  return (
    <aside className="workflow-sidebar">
      
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <h3>Node Library</h3>
        <div className="sidebar-search">
          <i className="fa-solid fa-search"></i>
          <input type="text" placeholder="Search nodes..." />
        </div>
      </div>

      {/* TRIGGER NODES */}
      <div className="node-category">
        <div className="category-header">
          <i className="fa-solid fa-bolt category-icon"></i>
          <span>Trigger Nodes</span>
        </div>
      <DraggableNode 
        nodeInfo={{ 
            label: 'Telegram Trigger', 
            icon: 'fa-telegram', 
            color: 'text-blue-500',
            description: 'Start workflow from Telegram messages',
            type: 'telegramTrigger' 
        }} 
      />
      {/* Chat Trigger permanently removed */}
      
      </div>

      {/* AI NODES */}
      <div className="node-category">
        <div className="category-header">
          <i className="fa-solid fa-robot category-icon"></i>
          <span>AI Nodes</span>
        </div>
      <DraggableNode 
        nodeInfo={{ 
            label: 'AI Agent', 
            icon: 'fa-robot', 
            color: 'text-purple-500',
            description: 'AI processing with templates',
            type: 'aiAgent' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Model Node', 
            icon: 'fa-brain', 
            color: 'text-indigo-500',
            description: 'AI chat interface',
            type: 'modelNode' 
        }} 
      />
      
      </div>

      {/* SOCIAL MEDIA NODES */}
      <div className="node-category">
        <div className="category-header">
          <i className="fa-solid fa-share-alt category-icon"></i>
          <span>Social Media</span>
        </div>
      <DraggableNode 
        nodeInfo={{ 
            label: 'Telegram Send Message', 
            icon: 'fa-telegram', 
            color: 'text-blue-500',
            description: 'Send messages via Telegram Bot API',
            type: 'telegramSendMessage' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'WhatsApp', 
            icon: 'fa-whatsapp', 
            color: 'text-green-500',
            description: 'WhatsApp integration',
            type: 'whatsapp' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Instagram', 
            icon: 'fa-instagram', 
            color: 'text-pink-500',
            description: 'Instagram integration',
            type: 'instagram' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'LinkedIn', 
            icon: 'fa-linkedin', 
            color: 'text-blue-700',
            description: 'LinkedIn integration',
            type: 'linkedin' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'TikTok', 
            icon: 'fa-tiktok', 
            color: 'text-black',
            description: 'TikTok integration',
            type: 'tiktok' 
        }} 
      />
      
      </div>

      {/* UTILITY NODES */}
      <div className="node-category">
        <div className="category-header">
          <i className="fa-solid fa-tools category-icon"></i>
          <span>Utility Nodes</span>
        </div>
      <DraggableNode 
        nodeInfo={{ 
            label: 'Google Docs', 
            icon: 'fa-file-text', 
            color: 'text-blue-600',
            description: 'Google Docs operations',
            type: 'googleDocs' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Data Storage', 
            icon: 'fa-database', 
            color: 'text-gray-600',
            description: 'Store data for workflows',
            type: 'dataStorage' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'File Converter', 
            icon: 'fa-file-export', 
            color: 'text-orange-500',
            description: 'Convert file formats',
            type: 'fileConverter' 
        }} 
      />

      </div>

      {/* LOGIC NODES */}
      <div className="node-category">
        <div className="category-header">
          <i className="fa-solid fa-sitemap category-icon"></i>
          <span>Logic Nodes</span>
        </div>
      <DraggableNode 
        nodeInfo={{ 
            label: 'If', 
            icon: 'fa-sitemap', 
            color: 'text-green-500',
            description: 'Route items true/false',
            type: 'if' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Switch', 
            icon: 'fa-random', 
            color: 'text-indigo-500',
            description: 'Route by rules',
            type: 'switch',
            switchRules: [{ value1: '', operator: 'is_equal_to', value2: '' }],
            switchOptions: []
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Filter', 
            icon: 'fa-filter', 
            color: 'text-blue-500',
            description: 'Remove items by condition',
            type: 'filter' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Merge', 
            icon: 'fa-share-alt', 
            color: 'text-orange-500',
            description: 'Merge data from streams',
            type: 'merge' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Set Data', 
            icon: 'fa-edit', 
            color: 'text-teal-500',
            description: 'Create custom data fields',
            type: 'setData' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Loop Over Items', 
            icon: 'fa-sync-alt', 
            color: 'text-purple-500',
            description: 'Iterate over each item',
            type: 'loop' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Wait', 
            icon: 'fa-clock', 
            color: 'text-pink-500',
            description: 'Pause the workflow',
            type: 'wait' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Stop and Error', 
            icon: 'fa-exclamation-triangle', 
            color: 'text-yellow-500',
            description: 'Throw a workflow error',
            type: 'stopAndError' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Compare Datasets', 
            icon: 'fa-plus-square', 
            color: 'text-red-500',
            description: 'Compare two inputs',
            type: 'compare' 
        }} 
      />
      <DraggableNode 
        nodeInfo={{ 
            label: 'Execute Workflow', 
            icon: 'fa-arrow-right', 
            color: 'text-gray-500',
            description: 'Call another workflow',
            type: 'executeSubWorkflow' 
        }} 
      />
      </div>
    </aside>
  );
};

export default Sidebar;
