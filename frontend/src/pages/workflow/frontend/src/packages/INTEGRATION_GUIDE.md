# Integration Guide: Using WorkflowNode Packages in Other Projects

This guide shows you how to integrate the modular WorkflowNode packages into your own React projects.

## 🎯 Quick Integration Scenarios

### Scenario 1: Complete Workflow Builder
You want to build a full workflow automation tool like n8n or Zapier.

```jsx
import React, { useState } from 'react';
import ReactFlow, { ReactFlowProvider } from 'reactflow';
import { 
  ConfigPanel, 
  CustomNode, 
  Sidebar, 
  api,
  nodeMetadata 
} from './packages';

const WorkflowApp = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  return (
    <ReactFlowProvider>
      <div className="workflow-app" style={{ display: 'flex', height: '100vh' }}>
        <Sidebar onSave={handleSave} onRestore={handleRestore} />
        
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={{ custom: CustomNode }}
            onNodeClick={(event, node) => setSelectedNode(node)}
          />
        </div>

        {selectedNode && (
          <ConfigPanel 
            node={selectedNode}
            edges={edges}
            nodes={nodes}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </ReactFlowProvider>
  );
};
```

### Scenario 2: Configuration Panel Only
You want to add professional configuration panels to your existing app.

```jsx
import React, { useState } from 'react';
import { ConfigPanel, DraggableJSONField, DroppableTextInput } from './packages/config-panel';

const SettingsApp = () => {
  const [config, setConfig] = useState({});
  const [showPanel, setShowPanel] = useState(false);

  return (
    <div>
      <button onClick={() => setShowPanel(true)}>
        Configure Settings
      </button>

      {showPanel && (
        <ConfigPanel 
          node={{ 
            id: 'settings',
            data: { type: 'ai_agent', ...config }
          }}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  );
};
```

### Scenario 3: Node System Only
You want to add draggable nodes to your existing React app.

```jsx
import React from 'react';
import { CustomNode, Sidebar, nodeMetadata } from './packages/node-system';

const NodeApp = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      
      <div className="canvas-area">
        {/* Your existing canvas or ReactFlow setup */}
        <CustomNode 
          data={{
            type: 'ai_agent',
            label: 'AI Processor',
            description: 'Process data with AI'
          }}
        />
      </div>
    </div>
  );
};
```

## 🛠️ Step-by-Step Integration

### Step 1: Copy Package Files

```bash
# Option A: Copy entire packages folder
cp -r /path/to/workflownode/frontend/src/packages /path/to/your/project/src/

# Option B: Copy specific packages only
mkdir -p /path/to/your/project/src/packages
cp -r /path/to/workflownode/frontend/src/packages/config-panel /path/to/your/project/src/packages/
cp -r /path/to/workflownode/frontend/src/packages/shared /path/to/your/project/src/packages/
```

### Step 2: Install Required Dependencies

```bash
# Core React dependencies (usually already installed)
npm install react react-dom

# ReactFlow (required for node-system and workflow-builder packages)
npm install reactflow

# Optional: Styling framework
npm install tailwindcss  # If you want to use Tailwind classes
```

### Step 3: Import Styles

```jsx
// In your main App.js or index.js
import './packages/config-panel/ConfigPanel.css';
import './packages/node-system/CustomNode.css';
import 'reactflow/dist/style.css';  // If using ReactFlow
```

### Step 4: Basic Integration

```jsx
// App.js
import React from 'react';
import { ConfigPanel, CustomNode } from './packages';

function App() {
  return (
    <div className="App">
      {/* Your existing app content */}
      
      {/* Add WorkflowNode components where needed */}
      <ConfigPanel 
        node={yourNodeData}
        onClose={handleClose}
      />
    </div>
  );
}

export default App;
```

## 🔧 Advanced Integration Patterns

### Pattern 1: Custom Node Types

```jsx
// 1. Add your node metadata
// packages/shared/constants/nodeMetadata.js
export const nodeMetadata = {
  ...existingMetadata,
  
  your_custom_node: {
    title: "Your Custom Node",
    description: "Does something specific to your app",
    icon: "🎯",
    category: "custom",
    color: "#ff6b35",
    bgColor: "#fff4e6"
  }
};

// 2. Add parameter form
// packages/config-panel/forms/NodeParameters.js
export const renderNodeParameters = (nodeType, formData, handleInputChange, inputData) => {
  // ... existing node types
  
  if (nodeType === 'your_custom_node') {
    return (
      <div>
        <DroppableTextInput
          label="Custom Setting"
          value={formData.customSetting || ''}
          onChange={(value) => handleInputChange('customSetting', value)}
        />
      </div>
    );
  }
  
  // ... rest of function
};
```

### Pattern 2: Custom API Integration

```jsx
// Extend the API client
// your-project/src/services/customAPI.js
import { api } from './packages/api-client';

export const customAPI = {
  // Use existing API client as base
  ...api,
  
  // Add your custom endpoints
  processCustomData: async (data) => {
    return api.post('/api/your-custom-endpoint', data);
  },
  
  getCustomConfiguration: async (id) => {
    return api.get(`/api/your-config/${id}`);
  }
};
```

### Pattern 3: Custom Styling Theme

```css
/* your-project/src/styles/custom-theme.css */

/* Override package styles with your theme */
.config-panel-overlay {
  background-color: rgba(0, 0, 0, 0.7); /* Your modal background */
}

.config-panel {
  background-color: #1a1a1a; /* Dark theme */
  color: #ffffff;
}

.custom-node-ai {
  border: 2px solid #your-brand-color;
  background: linear-gradient(135deg, #your-color-1, #your-color-2);
}

.sidebar {
  background-color: #your-sidebar-color;
}
```

### Pattern 4: Selective Package Import

```jsx
// Import only what you need to reduce bundle size
import { ConfigPanel } from './packages/config-panel';
import { DroppableTextInput } from './packages/config-panel/drag-drop/DragDropSystem';
import { useLocalStorage } from './packages/shared/hooks/useLocalStorage';

// Don't import unused packages
// import { FlowEditor } from './packages/workflow-builder'; // Skip if not needed
```

## 🎨 Customization Examples

### Example 1: Custom Color Scheme

```jsx
// Override node colors dynamically
import { nodeMetadata } from './packages/shared/constants/nodeMetadata';

const customNodeMetadata = {
  ...nodeMetadata,
  ai_agent: {
    ...nodeMetadata.ai_agent,
    color: '#your-brand-primary',
    bgColor: '#your-brand-light'
  }
};

// Use in your components
const CustomConfigPanel = (props) => {
  return (
    <ConfigPanel 
      {...props}
      nodeMetadata={customNodeMetadata}
    />
  );
};
```

### Example 2: Custom Node Parameter Form

```jsx
// Create completely custom parameter forms
const CustomNodeForm = ({ nodeType, formData, onChange }) => {
  if (nodeType === 'your_special_node') {
    return (
      <div className="custom-form">
        <h3>Special Configuration</h3>
        <input 
          type="text"
          value={formData.specialField || ''}
          onChange={(e) => onChange('specialField', e.target.value)}
          placeholder="Enter special value..."
        />
        
        <select 
          value={formData.mode || 'default'}
          onChange={(e) => onChange('mode', e.target.value)}
        >
          <option value="default">Default Mode</option>
          <option value="advanced">Advanced Mode</option>
        </select>
      </div>
    );
  }
  
  // Fall back to default form
  return renderNodeParameters(nodeType, formData, onChange);
};
```

### Example 3: Custom API Backend

```jsx
// Adapt to your existing backend
import { api } from './packages/api-client';

// Configure API client for your backend
api.defaults.baseURL = 'https://your-api-domain.com';
api.defaults.headers.common['Authorization'] = `Bearer ${yourAuthToken}`;

// Create custom node execution handler
const executeCustomNode = async (nodeData, inputData) => {
  // Transform data for your backend format
  const backendPayload = {
    node_type: nodeData.type,
    configuration: nodeData.config,
    input: inputData
  };
  
  const response = await api.post('/your-workflow-endpoint', backendPayload);
  
  // Transform response back to WorkflowNode format
  return {
    success: response.data.success,
    output: response.data.result,
    error: response.data.error
  };
};
```

## 🚀 Production Deployment

### Bundle Optimization

```jsx
// Use dynamic imports for package components
const ConfigPanel = React.lazy(() => 
  import('./packages/config-panel').then(module => ({ 
    default: module.ConfigPanel 
  }))
);

const LazyConfigPanel = () => (
  <React.Suspense fallback={<div>Loading...</div>}>
    <ConfigPanel {...props} />
  </React.Suspense>
);
```

### Environment Configuration

```jsx
// Configure packages based on environment
const packageConfig = {
  development: {
    apiBaseURL: 'http://localhost:3001',
    enableDebugLogs: true
  },
  production: {
    apiBaseURL: 'https://your-production-api.com',
    enableDebugLogs: false
  }
};

// Apply configuration
import { api } from './packages/api-client';
api.defaults.baseURL = packageConfig[process.env.NODE_ENV].apiBaseURL;
```

## 🧪 Testing Integration

```jsx
// Test your integration
import { render, screen } from '@testing-library/react';
import { ConfigPanel } from './packages/config-panel';

test('ConfigPanel renders with custom node', () => {
  const mockNode = {
    id: 'test-node',
    data: { type: 'ai_agent', label: 'Test Node' }
  };
  
  render(
    <ConfigPanel 
      node={mockNode}
      onClose={() => {}}
    />
  );
  
  expect(screen.getByText('Test Node')).toBeInTheDocument();
});
```

## 📚 Additional Resources

- [Package-specific READMEs](./README.md) - Detailed documentation for each package
- [Original WorkflowNode Documentation](../../../CLAUDE.md) - Complete project context
- [ReactFlow Documentation](https://reactflow.dev/) - For workflow builder integration
- [React Documentation](https://react.dev/) - For React integration patterns

## 🤝 Support

If you encounter issues during integration:

1. Check package-specific documentation
2. Review the integration examples above
3. Examine the original WorkflowNode implementation
4. Create custom wrapper components for specific needs
5. Override styles and configurations as needed

The packages are designed to be flexible and adaptable to different project requirements.