import React from 'react';
import { ReactFlowProvider } from 'reactflow'; // Import the provider
import WorkflowToolbar from './components/WorkflowToolbar';
import NodePalette from './components/NodePalette';
import WorkflowCanvas from './components/WorkflowCanvas';
import '../styles/WorkflowBuilder.css';
import 'reactflow/dist/style.css'; // Import React Flow styles

const WorkflowBuilder = () => {
  return (
    <ReactFlowProvider> {/* Wrap the entire component */}
      <div className="workflow-builder-layout">
        <WorkflowToolbar />
        <div className="workflow-builder-main">
          <NodePalette />
          <WorkflowCanvas />
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default WorkflowBuilder;
