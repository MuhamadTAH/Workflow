import React from 'react';

/**
 * NodeSidebar component provides a list of draggable nodes that can be
 * added to the workflow canvas.
 */
const NodeSidebar = () => {

  /**
   * Handles the drag start event for a node in the sidebar.
   * It stores the node's type and label in the dataTransfer object,
   * which ReactFlow uses to create the new node on drop.
   * @param {React.DragEvent} event - The drag event.
   * @param {string} nodeType - The type of the node being dragged (e.g., 'trigger').
   */
  const onDragStart = (event, nodeType) => {
    // The 'application/reactflow' type is a convention used by ReactFlow.
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{
      borderRight: '1px solid #ddd',
      padding: '20px',
      width: '250px',
      backgroundColor: '#f7f7f7',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Nodes</h2>
      
      {/* Draggable Telegram Trigger Node */}
      <div
        className="dndnode"
        onDragStart={(event) => onDragStart(event, 'trigger')}
        draggable
        style={{
          padding: '10px 15px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: 'white',
          cursor: 'grab',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          color: '#444'
        }}
      >
        Telegram Trigger
      </div>
    </aside>
  );
};

export default NodeSidebar;
