# WorkflowNode Frontend Packages

Modular, reusable frontend packages for workflow builder applications. Each package is designed to be self-contained and easily integrated into other React projects.

## 📦 Available Packages

### 1. **config-panel** - Configuration Panel System
Professional n8n-style configuration panels with drag-and-drop template variables.

**Features:**
- ✅ Universal template parser (multiple formats)
- ✅ Drag-and-drop system for template creation
- ✅ Professional UI with clean design
- ✅ Auto-save functionality
- ✅ Node-specific parameter forms
- ✅ Real-time validation and preview

**Usage:**
```jsx
import { ConfigPanel } from './packages/config-panel';

<ConfigPanel 
  node={selectedNode}
  onClose={() => setSelectedNode(null)}
  edges={workflowEdges}
  nodes={workflowNodes}
/>
```

### 2. **node-system** - Visual Node System
Node components and metadata system for workflow builders.

**Features:**
- ✅ Visual node components with professional styling
- ✅ Draggable node palette/sidebar
- ✅ Node metadata and configuration system
- ✅ Category-based organization
- ✅ Extensible architecture for new node types

**Usage:**
```jsx
import { CustomNode, Sidebar } from './packages/node-system';

// Use in ReactFlow
const nodeTypes = { custom: CustomNode };

// Use sidebar for node palette
<Sidebar onSave={handleSave} onRestore={handleRestore} />
```

### 3. **workflow-builder** - Workflow Builder System
ReactFlow-based visual workflow building system.

**Features:**
- ✅ ReactFlow integration
- ✅ Drag-and-drop interface
- ✅ Connection management
- ✅ Zoom and pan controls
- ✅ Workflow state management

**Usage:**
```jsx
import { FlowEditor } from './packages/workflow-builder';

<FlowEditor 
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
/>
```

### 4. **api-client** - Backend Communication
HTTP client and API utilities for backend communication.

**Features:**
- ✅ Configured HTTP client
- ✅ Authentication handling
- ✅ Request/response interceptors
- ✅ Error handling utilities

**Usage:**
```jsx
import { api } from './packages/api-client';

const response = await api.post('/api/nodes/run-node', {
  node: nodeData,
  inputData: inputData
});
```

### 5. **shared** - Common Utilities
Shared utilities, hooks, and constants used across packages.

**Features:**
- ✅ Node metadata and configuration
- ✅ Common formatting functions
- ✅ React hooks (localStorage, debounce)
- ✅ Validation utilities

**Usage:**
```jsx
import { nodeMetadata, useLocalStorage, formatDate } from './shared';

const [savedData, setSavedData] = useLocalStorage('key', defaultValue);
const formattedDate = formatDate(new Date(), 'long');
```

## 🚀 Quick Start

### Using Individual Packages

```jsx
// Import specific packages
import { ConfigPanel } from './packages/config-panel';
import { CustomNode, Sidebar } from './packages/node-system';
import { api } from './packages/api-client';

function MyWorkflowApp() {
  return (
    <div className="workflow-app">
      <Sidebar />
      <div className="main-area">
        {/* Your ReactFlow component here */}
      </div>
      {selectedNode && (
        <ConfigPanel 
          node={selectedNode}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
```

### Using Master Package Import

```jsx
// Import everything from master package
import { 
  ConfigPanel, 
  CustomNode, 
  Sidebar, 
  api,
  nodeMetadata 
} from './packages';

// Same usage as above
```

## 📁 Package Structure

```
packages/
├── index.js                    # Master export point
├── config-panel/               # Configuration system
│   ├── index.js               # Package exports
│   ├── ConfigPanel.js         # Main component
│   ├── components/            # UI components
│   ├── drag-drop/             # Drag & drop system
│   ├── forms/                 # Node parameter forms
│   ├── utils/                 # Utilities and hooks
│   └── *.css                  # Styles
├── node-system/               # Visual node system
│   ├── index.js
│   ├── components/            # Node components
│   ├── types/                 # Node type definitions
│   └── *.css
├── workflow-builder/          # ReactFlow wrapper
│   ├── index.js
│   └── components/
├── api-client/                # Backend communication
│   ├── index.js
│   └── services/
└── shared/                    # Common utilities
    ├── index.js
    ├── constants/
    ├── utils/
    └── hooks/
```

## 🔧 Integration with Other Projects

### Step 1: Copy Packages
```bash
# Copy the entire packages folder to your project
cp -r packages/ /path/to/your/project/src/
```

### Step 2: Install Dependencies
```bash
# Required peer dependencies
npm install react react-dom reactflow
```

### Step 3: Import and Use
```jsx
import React from 'react';
import { ConfigPanel, CustomNode, Sidebar } from './packages';

function YourWorkflowApp() {
  // Your implementation here
}
```

### Step 4: Customize (Optional)
- Override CSS classes for custom styling
- Extend node types in `node-system/types/`
- Add custom parameter forms in `config-panel/forms/`
- Create additional shared utilities in `shared/`

## 🎨 Customization Guide

### Adding New Node Types

1. **Add metadata** in `shared/constants/nodeMetadata.js`
2. **Create parameter form** in `config-panel/forms/NodeParameters.js`
3. **Update node types** in `node-system/types/nodeTypes.js`

### Custom Styling

```css
/* Override default styles */
.config-panel-overlay {
  background-color: your-custom-color;
}

.custom-node-ai {
  border: 2px solid your-custom-border;
}
```

### Extending API Client

```jsx
// Add custom API endpoints
import { api } from './packages/api-client';

export const customAPI = {
  getCustomData: () => api.get('/api/custom-endpoint'),
  postCustomData: (data) => api.post('/api/custom-endpoint', data)
};
```

## 📊 Package Dependencies

| Package | React | ReactFlow | Other |
|---------|-------|-----------|-------|
| config-panel | ✅ | ❌ | - |
| node-system | ✅ | ✅ | - |
| workflow-builder | ✅ | ✅ | - |
| api-client | ✅ | ❌ | - |
| shared | ✅ | ❌ | - |

## 🧪 Development

### Package-Specific Development

```bash
# Work on individual packages
cd packages/config-panel
# Make changes to components, test individually

cd packages/node-system  
# Add new node types, test node rendering
```

### Integration Testing

```bash
# Test all packages together
npm start
# Verify all imports work correctly
# Test cross-package functionality
```

## 📝 License

MIT License - Each package can be used independently or together in other projects.

## 🤝 Contributing

1. Keep packages focused and single-purpose
2. Maintain clean import/export interfaces
3. Update documentation when adding features
4. Test packages both individually and together
5. Follow the established code style and structure

## 🔗 Related Documentation

- [Config Panel Package](./config-panel/README.md)
- [Node System Package](./node-system/README.md)
- [Original Project Documentation](../../../CLAUDE.md)