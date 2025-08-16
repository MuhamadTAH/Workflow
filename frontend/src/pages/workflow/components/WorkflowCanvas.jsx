import React, { useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge 
} from 'reactflow';
import 'reactflow/dist/style.css';
import BaseNode from './BaseNode';
import ConfigPanel from './ConfigPanel';

// Wrapper components to pass the node type
const TelegramTriggerNode = (props) => <BaseNode {...props} type="telegramTrigger" />;
import '../styles/WorkflowCanvas.css';

// Create a stable reference outside the component
let globalDoubleClickHandler = null;

const WorkflowCanvas = () => {
  const [configPanel, setConfigPanel] = useState({
    isOpen: false,
    selectedNode: null
  });
  
  const nodesRef = React.useRef([]);

  // Set the global handler once
  if (!globalDoubleClickHandler) {
    globalDoubleClickHandler = (nodeId, nodeType) => {
      const node = nodesRef.current.find(n => n.id === nodeId);
      // Use a callback to access the latest setConfigPanel
      WorkflowCanvas.setConfigPanelRef.current({
        isOpen: true,
        selectedNode: node || { id: nodeId, type: nodeType, data: { config: {} } }
      });
    };
  }

  // Store the setter in a ref for the global handler
  const setConfigPanelRef = React.useRef();
  setConfigPanelRef.current = setConfigPanel;
  WorkflowCanvas.setConfigPanelRef = setConfigPanelRef;

  // Try direct initialization with useNodesState
  const initialNodesStatic = React.useMemo(() => [
    {
      id: '1',
      type: 'telegramTrigger',
      position: { x: 250, y: 100 },
      data: {
        icon: 'fab fa-telegram-plane',
        label: 'Telegram Trigger',
        description: 'Triggered when a message is received',
        onDoubleClick: globalDoubleClickHandler,
        config: {
          botToken: '',
          isValid: null
        }
      }
    }
  ], []); // Empty deps - create only once

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesStatic);
  
  console.log('Component render - nodes length:', nodes.length);

  // Debug: Log when nodes change
  React.useEffect(() => {
    console.log('Current nodes array:', nodes.length, nodes.map(n => n.id));
    if (nodes.length === 0) {
      console.warn('⚠️ Nodes array is empty! Something cleared it.');
    }
  }, [nodes]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Keep nodes ref updated (no console log to prevent spam)
  React.useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  // Handle config panel close
  const handleConfigClose = useCallback(() => {
    setConfigPanel({
      isOpen: false,
      selectedNode: null
    });
  }, []);

  // Handle config save
  const handleConfigSave = useCallback((nodeId, config) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            config: config,
            onDoubleClick: globalDoubleClickHandler // Use the stable global handler
          }
        };
      }
      return node;
    }));
  }, [setNodes]);

  // Define custom node types
  const nodeTypes = { 
    telegramTrigger: TelegramTriggerNode,
  };

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = event.target.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode = {
        id: `${Date.now()}`,
        type,
        position,
        data: { 
          icon: 'fab fa-telegram-plane',
          label: 'New Node',
          description: 'Node description'
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  return (
    <div className="workflow-canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
      >
        <Background variant="dots" gap={20} size={1} />
        <Controls />
        <MiniMap 
          nodeColor="#6c5ce7"
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Configuration Panel */}
      <ConfigPanel
        node={configPanel.selectedNode}
        isOpen={configPanel.isOpen}
        onClose={handleConfigClose}
        onSave={handleConfigSave}
      />
    </div>
  );
};

export default WorkflowCanvas;