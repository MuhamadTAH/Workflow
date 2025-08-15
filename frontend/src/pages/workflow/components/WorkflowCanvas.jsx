// Main canvas component for the workflow builder
// Handles drag-and-drop functionality
// Renders nodes and connections between them
// Manages canvas zoom, pan, and selection
import React from 'react';

const WorkflowCanvas = () => {
  return (
    <main className="workflow-canvas">
      {/* The react-flow-renderer component will go here */}
      <div className="canvas-placeholder">
        <p>Drag nodes from the left panel to build your workflow.</p>
      </div>
    </main>
  );
};

export default WorkflowCanvas;
