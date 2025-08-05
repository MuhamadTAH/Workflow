# Config Panel Package

Modular, reusable configuration panel system for workflow builders with professional n8n-style UI.

## Features

- ✅ **Universal Template Parser** - Supports multiple template formats
- ✅ **Drag-and-Drop System** - Visual template variable creation  
- ✅ **Professional UI** - Clean, n8n-style interface
- ✅ **Auto-Save Functionality** - Automatic configuration persistence
- ✅ **Node-Specific Forms** - Dynamic parameter forms for different node types
- ✅ **Real-Time Validation** - Live preview and error checking

## Installation

```bash
# If using in another project, copy the package folder
cp -r packages/config-panel /path/to/your/project/src/
```

## Usage

### Basic Usage

```jsx
import { ConfigPanel } from './packages/config-panel';

function App() {
  return (
    <ConfigPanel 
      node={selectedNode}
      onClose={() => setSelectedNode(null)}
      edges={workflowEdges}
      nodes={workflowNodes}
    />
  );
}
```

### Advanced Usage with Individual Components

```jsx
import { 
  InputPanel, 
  OutputPanel,
  DraggableJSONField,
  DroppableTextInput 
} from './packages/config-panel';

// Use individual components for custom layouts
function CustomPanel({ data }) {
  return (
    <div className="custom-layout">
      <InputPanel data={data} />
      <div className="custom-form">
        <DroppableTextInput 
          placeholder="Enter template..."
          showPreview={true}
        />
      </div>
      <OutputPanel results={results} />
    </div>
  );
}
```

## Package Structure

```
config-panel/
├── index.js                    # Main package entry point
├── ConfigPanel.js              # Main component orchestrator
├── package.json                # Package configuration
├── ConfigPanel.css             # Main styles
├── components/                 # UI components
│   ├── PanelSections.js       # Input/Output panels
│   └── JSONViewer.js          # JSON tree viewer
├── drag-drop/                  # Drag & drop system
│   └── DragDropSystem.js      # Template drag-drop components
├── forms/                      # Node-specific forms
│   └── NodeParameters.js      # Parameter form renderer
├── utils/                      # Utilities and hooks
│   └── utils.js              # Auto-save, form handlers
└── templates/                  # Template processing
    └── (reserved for future use)
```

## Key Components

### ConfigPanel
Main orchestrator component that manages all sub-components and state.

### DragDropSystem
- `DraggableJSONField` - Makes JSON fields draggable
- `DroppableTextInput` - Text inputs that accept templates
- `processTemplate` - Template variable processor

### PanelSections  
- `InputPanel` - Left panel with data viewer
- `OutputPanel` - Right panel with results
- `MainPanelHeader` - Top header with actions

### NodeParameters
Dynamic form renderer that creates appropriate parameter forms based on node type.

## Template System

Supports multiple template formats:

- `{{$json.field}}` - Backend JSON format
- `{{nodePrefix.field}}` - Frontend node format  
- `{{variable}}` - Simple variable format

## Styling

The package includes modular CSS with:
- Professional n8n-style interface
- Clean color palette and typography
- Responsive design
- Hover states and animations

## Dependencies

- React 18.2.0+
- React DOM 18.2.0+

## Integration with Other Projects

1. Copy the package folder to your project
2. Install React dependencies
3. Import components as needed
4. Customize styling via CSS overrides
5. Extend with your own node types

## Customization

### Adding New Node Types

1. Add node metadata to `shared/constants/nodeMetadata.js`
2. Add parameter form to `forms/NodeParameters.js`
3. Update the form renderer logic

### Custom Styling

Override CSS classes or import your own styles:

```css
/* Override default styles */
.config-panel-overlay {
  background-color: your-color;
}

.input-panel {
  border: your-border;
}
```

## License

MIT License - See project LICENSE file for details.