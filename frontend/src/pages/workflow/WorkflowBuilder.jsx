// Main workflow builder page component
// This is the main page where users create and edit workflows
// Contains the canvas, node palette, and workflow controls
import React from 'react';
import WorkflowToolbar from './components/WorkflowToolbar';
import NodePalette from './components/NodePalette';
import WorkflowCanvas from './components/WorkflowCanvas';
import './styles/WorkflowBuilder.css';

const WorkflowBuilder = () => {
  return (
    <div className="workflow-builder-layout">
      <WorkflowToolbar />
      <div className="workflow-builder-main">
        <NodePalette />
        <WorkflowCanvas />
      </div>
    </div>
  );
};

export default WorkflowBuilder;
