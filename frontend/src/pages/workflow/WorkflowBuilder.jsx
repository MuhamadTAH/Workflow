import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlowProvider, useNodesState, useEdgesState, useReactFlow } from 'reactflow';
import { workflowAPI } from './services/workflowAPI';
import WorkflowToolbar from './components/WorkflowToolbar';
import NodePalette from './components/NodePalette';
import WorkflowCanvas from './components/WorkflowCanvas';
import './styles/WorkflowBuilder.css';
import 'reactflow/dist/style.css';

let id = 0;
const getId = () => `dnd-node_${id++}`;

// This is the main component that orchestrates the builder page
const WorkflowBuilderContent = () => {
  const { id: workflowId } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { screenToFlowPosition, toObject } = useReactFlow();

  // Fetch the workflow data when the component mounts
  useEffect(() => {
    if (workflowId) {
      setIsLoading(true);
      workflowAPI.getWorkflowById(workflowId)
        .then(response => {
          const { name, data } = response.data;
          setWorkflowName(name);
          if (data && data.nodes) {
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
          }
        })
        .catch(err => console.error("Failed to fetch workflow", err))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [workflowId, setNodes, setEdges]);

  // Handle saving the workflow
  const handleSave = useCallback(async () => {
    if (!workflowId) return;
    try {
      const flowData = toObject(); // Gets nodes, edges, and viewport
      await workflowAPI.updateWorkflow(workflowId, flowData);
      alert('Workflow saved successfully!'); // Replace with a proper notification later
    } catch (err) {
      console.error("Failed to save workflow", err);
      alert('Error saving workflow.');
    }
  }, [workflowId, toObject]);

  // Handle dropping a new node onto the canvas
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const nodeDataString = event.dataTransfer.getData('application/reactflow');
      if (!nodeDataString) return;
      
      const nodeData = JSON.parse(nodeDataString);
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      const newNode = {
        id: getId(),
        type: nodeData.type,
        position,
        data: { 
          label: nodeData.label,
          description: nodeData.description,
          icon: nodeData.icon,
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  if (isLoading) {
    return <div>Loading workflow...</div>;
  }

  return (
    <div className="workflow-builder-layout">
      <WorkflowToolbar
        name={workflowName}
        setName={setWorkflowName}
        onSave={handleSave}
      />
      <div className="workflow-builder-main">
        <NodePalette />
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          setEdges={setEdges}
          onDrop={onDrop}
        />
      </div>
    </div>
  );
};

// We need to wrap the main component in the provider
const WorkflowBuilder = () => (
  <ReactFlowProvider>
    <WorkflowBuilderContent />
  </ReactFlowProvider>
);

export default WorkflowBuilder;
