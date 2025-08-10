# 🚀 WorkflowNode Developer Guide

Complete guide for creating custom nodes in the WorkflowNode visual workflow builder.

## 📋 Table of Contents

1. [Quick Start](#-quick-start)
2. [Architecture Overview](#-architecture-overview)
3. [Frontend Integration](#-frontend-integration)
4. [Backend Implementation](#-backend-implementation)
5. [File Update Checklist](#-file-update-checklist)
6. [Node Types & Examples](#-node-types--examples)
7. [Testing Guide](#-testing-guide)
8. [Troubleshooting](#-troubleshooting)
9. [API Reference](#-api-reference)

---

## 🚀 Quick Start

### **30-Second Node Creation Checklist**

1. **Choose node type**: Action, Trigger, or Logic
2. **Create backend file**: `backend/nodes/{category}/{nodeName}Node.js`
3. **Update frontend sidebar**: Add to `frontend/src/workflownode/components/core/Sidebar.js`
4. **Add configuration UI**: Update `frontend/src/workflownode/components/panels/ConfigPanel.js`
5. **Add visual styling**: Update `frontend/src/workflownode/components/nodes/NodeShape.js`
6. **Test locally**: Create test workflow and verify functionality
7. **Deploy**: Commit and push to production

### **File Locations**
```
📁 Project Structure
├── 📁 backend/nodes/
│   ├── 📁 actions/     ← Action nodes (send email, API calls, etc.)
│   ├── 📁 triggers/    ← Trigger nodes (webhooks, schedules, etc.)
│   └── 📁 logic/       ← Logic nodes (if/else, loops, etc.)
├── 📁 frontend/src/workflownode/
│   ├── 📁 components/core/Sidebar.js        ← Node library
│   ├── 📁 components/panels/ConfigPanel.js ← Configuration UI
│   └── 📁 components/nodes/NodeShape.js    ← Visual styling
```

---

## 🏗️ Architecture Overview

### **How Nodes Work**
- **Frontend**: Visual representation, configuration UI, drag-and-drop
- **Backend**: Business logic, API calls, data processing
- **Data Flow**: Each node receives input data, processes it, outputs result
- **Templates**: Nodes support `{{variable}}` expressions for dynamic data

### **Node Lifecycle**
```
1. User drags node to canvas
2. User configures node parameters
3. Workflow execution begins
4. Node receives input data from previous node
5. Node processes data using backend logic
6. Node outputs result to next connected node
```

### **Integration Points**
- **Sidebar**: Node appears in draggable library
- **ConfigPanel**: Node shows custom configuration form
- **NodeShape**: Node displays with proper icon and styling
- **Backend**: Node executes with proper data processing
- **Routes**: (Optional) Custom API endpoints for node

---

## 🎨 Frontend Integration

### **🎨 Node Visual Design System**

All nodes follow a consistent visual design system for professional appearance and user experience:

#### **Node Categories & Colors**
```javascript
// Color scheme by category (use these exact colors)
TRIGGER_NODES = {
  colors: ['text-green-500', 'text-blue-500', 'text-purple-500'],
  examples: 'Chat Trigger (green), Telegram Trigger (blue)'
}

ACTION_NODES = {
  colors: ['text-purple-500', 'text-indigo-500', 'text-pink-500', 'text-red-500'],
  examples: 'AI Agent (purple), Email Send (indigo), API Call (pink)'
}

UTILITY_NODES = {
  colors: ['text-blue-600', 'text-gray-600', 'text-orange-500'],
  examples: 'Google Docs (blue), Data Storage (gray), File Convert (orange)'
}

LOGIC_NODES = {
  colors: ['text-green-500', 'text-indigo-500', 'text-blue-500', 'text-orange-500'],
  examples: 'If (green), Switch (indigo), Filter (blue), Merge (orange)'
}
```

#### **Icon Selection Guidelines**
```javascript
// Icon categories and when to use them
TRIGGER_ICONS = {
  'fa-comments': 'Chat/Message triggers',
  'fa-clock': 'Time-based triggers',
  'fa-bell': 'Notification triggers',
  'fa-bolt': 'Event triggers'
}

ACTION_ICONS = {
  'fa-robot': 'AI/ML actions',
  'fa-envelope': 'Email actions',
  'fa-upload': 'Upload/Send actions',
  'fa-download': 'Download/Fetch actions'
}

BRAND_ICONS = {
  'fa-telegram': 'Telegram',
  'fa-whatsapp': 'WhatsApp',
  'fa-github': 'GitHub',
  // Use official brand colors
}

UTILITY_ICONS = {
  'fa-database': 'Data storage',
  'fa-file-text': 'Document operations',
  'fa-cog': 'Configuration/Settings',
  'fa-tools': 'General utilities'
}

LOGIC_ICONS = {
  'fa-sitemap': 'Branching logic (If/Then)',
  'fa-random': 'Multi-path logic (Switch)',
  'fa-filter': 'Data filtering',
  'fa-sync-alt': 'Loops/Iteration'
}
```

#### **Node Description Standards**
```javascript
// Description format: "Action + Object + Context"
GOOD_DESCRIPTIONS = [
  'Send messages via Telegram Bot API',      // Action + Method + Context
  'Start workflow from webhook messages',    // Action + Trigger + Source
  'Filter data by custom conditions',       // Action + Object + Method
  'Store data for workflows',               // Action + Purpose
]

BAD_DESCRIPTIONS = [
  'Telegram stuff',           // Too vague
  'Does AI things',           // Unclear action
  'Node for data',            // No specific purpose
  'Handles webhooks maybe',   // Uncertain language
]
```

#### **Visual Layout Standards**
```javascript
// Node appearance rules
NODE_VISUAL_RULES = {
  title: 'Keep titles under 20 characters',
  description: 'One clear sentence, under 50 characters',
  icon: 'Use FontAwesome solid/brands only',
  color: 'Use Tailwind color classes only',
  emoji: 'Provide emoji fallback for icons'
}
```

### **1. Add Node to Sidebar**
File: `frontend/src/workflownode/components/core/Sidebar.js`

```javascript
// Add to appropriate category section
<DraggableNode 
  nodeInfo={{ 
    label: 'Your Node Name', 
    icon: 'fa-your-icon',           // FontAwesome icon
    color: 'text-blue-500',         // Tailwind color class
    description: 'Brief description of what node does',
    type: 'yourNodeType'            // Unique identifier
  }} 
/>
```

**Icon Categories:**
- **Solid icons**: `fa-robot`, `fa-database`, `fa-clock`
- **Brand icons**: `fa-telegram`, `fa-whatsapp`, `fa-github`
- **See NodeShape.js** for complete icon mapping

### **2. Add Visual Styling**
File: `frontend/src/workflownode/components/nodes/NodeShape.js`

```javascript
// Add to getIconSymbol function (emoji fallback)
const getIconSymbol = (icon) => {
  const iconMap = {
    'fa-your-icon': '🔧',  // Your emoji
    // ... existing icons
  };
  return iconMap[icon] || '⚙️';
};

// Add to getIconClass function (FontAwesome mapping)
const iconMapping = {
  'fa-your-icon': 'fa-solid fa-your-icon',  // FontAwesome class
  // ... existing mappings
};
```

### **3. Add Configuration Panel**
File: `frontend/src/workflownode/components/panels/ConfigPanel.js`

#### **🎨 Configuration UI Design Standards**

All configuration panels follow consistent styling for professional appearance:

```javascript
// UI Component Standards
FORM_STANDARDS = {
  spacing: 'mt-6 for sections, mt-4 for form groups',
  labels: 'Clear, descriptive labels with proper htmlFor',
  inputs: 'Full width with consistent padding and styling',
  descriptions: 'text-sm text-gray-500 mt-1 for help text',
  buttons: 'copy-btn class with appropriate colors and icons'
}

// Color Coding for Different UI Elements
BUTTON_COLORS = {
  test: 'backgroundColor: "#28a745" (green)',
  action: 'backgroundColor: "#0088cc" (blue)', 
  warning: 'backgroundColor: "#ffc107" (yellow)',
  danger: 'backgroundColor: "#dc3545" (red)'
}

// Status Message Colors
STATUS_COLORS = {
  success: 'color: "#16a34a" with ✅ prefix',
  error: 'color: "#dc2626" with ❌ prefix',
  warning: 'color: "#d97706" with ⚠️ prefix',
  info: 'color: "#0c5460" with ℹ️ prefix'
}
```

#### **Standard Form Components**

```javascript
// Text Input Template
<div className="form-group">
  <label htmlFor="parameterName">Parameter Display Name</label>
  <input
    type="text"                    // or "password", "email", etc.
    name="parameterName"
    id="parameterName"
    value={formData.parameterName || ''}
    onChange={handleInputChange}
    placeholder="Clear example or instruction"
    style={{ flex: 1 }}           // For inputs in flex containers
  />
  <p className="text-sm text-gray-500 mt-1">
    Clear description of what this parameter does
  </p>
</div>

// Template Expression Input
<ExpressionInput 
  name="templateField" 
  value={formData.templateField || '{{$json.defaultField}}'} 
  onChange={handleInputChange} 
  inputData={inputData} 
  placeholder="{{$json.field}} or static value"
  isTextarea={true}              // For multi-line inputs
  currentNode={node} 
  allNodes={nodes}
/>

// Dropdown Select
<div className="custom-select-wrapper">
  <select 
    name="optionField" 
    value={formData.optionField || ''} 
    onChange={handleInputChange}
  >
    <option value="">Choose option...</option>
    <option value="option1">Option 1 Display</option>
    <option value="option2">Option 2 Display</option>
  </select>
</div>

// Checkbox
<label>
  <input 
    type="checkbox" 
    name="booleanField" 
    checked={formData.booleanField || false} 
    onChange={handleInputChange} 
  /> 
  Enable this feature
</label>

// Action Button with Icon
<button
  type="button"
  className="copy-btn w-full"        // or just "copy-btn" for inline
  onClick={async () => { /* action logic */ }}
  style={{ backgroundColor: '#28a745', color: 'white' }}
  disabled={!formData.requiredField} // Disable if invalid
>
  <i className="fa-solid fa-play mr-2"></i>
  Action Button Text
</button>
```

Add your node configuration section:

```javascript
// Add after existing node configurations
{node.data.type === 'yourNodeType' && (
  <div className="form-group mt-6">
    <label htmlFor="yourParameter">Your Parameter</label>
    <input
      type="text"
      name="yourParameter"
      id="yourParameter"
      value={formData.yourParameter || ''}
      onChange={handleInputChange}
      placeholder="Enter value"
    />
    <p className="text-sm text-gray-500 mt-1">Parameter description</p>
    
    {/* For template expressions */}
    <ExpressionInput 
      name="yourTemplateField" 
      value={formData.yourTemplateField || ''} 
      onChange={handleInputChange} 
      inputData={inputData} 
      placeholder="{{$json.field}} or static value"
      currentNode={node} 
      allNodes={nodes}
    />
    
    {/* For dropdowns */}
    <div className="custom-select-wrapper">
      <select 
        name="yourOption" 
        value={formData.yourOption || ''} 
        onChange={handleInputChange}
      >
        <option value="">Select option</option>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
      </select>
    </div>
    
    {/* For checkboxes */}
    <label>
      <input 
        type="checkbox" 
        name="yourCheckbox" 
        checked={formData.yourCheckbox || false} 
        onChange={handleInputChange} 
      /> 
      Enable feature
    </label>
    
    {/* Status Display Box */}
    <div className="webhook-url-display mt-4 p-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
      <strong>Connection Status:</strong>
      <code style={{ display: 'block', marginTop: '0.5rem', wordBreak: 'break-all', fontSize: '0.875rem' }}>
        {formData.isConnected ? '✅ Connected' : '❌ Not Connected'}
      </code>
    </div>
    
    {/* Test button with proper state handling */}
    <button
      type="button"
      className="copy-btn w-full mt-4"
      onClick={async () => {
        try {
          setTokenCheck({ status: 'checking', message: 'Testing...' });
          
          const response = await fetch(`${API_BASE}/api/your-test-endpoint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const result = await response.json();
          
          if (response.ok) {
            updateOutputData([result]);
            setTokenCheck({ status: 'valid', message: '✅ Test successful' });
          } else {
            setTokenCheck({ status: 'invalid', message: `❌ Test failed: ${result.error}` });
          }
        } catch (error) {
          setTokenCheck({ status: 'invalid', message: `❌ Error: ${error.message}` });
        }
      }}
      style={{ backgroundColor: '#28a745', color: 'white' }}
      disabled={!formData.requiredField}
    >
      <i className="fa-solid fa-play mr-2"></i>
      {tokenCheck?.status === 'checking' ? 'Testing...' : 'Test Node'}
    </button>
    
    {/* Status Messages */}
    {tokenCheck?.status === 'valid' && (
      <p className="text-sm" style={{ color: '#16a34a', marginTop: '0.5rem' }}>
        {tokenCheck.message}
      </p>
    )}
    {tokenCheck?.status === 'invalid' && (
      <p className="text-sm" style={{ color: '#dc2626', marginTop: '0.5rem' }}>
        {tokenCheck.message}
      </p>
    )}
    {tokenCheck?.status === 'checking' && (
      <p className="text-sm" style={{ color: '#0c5460', marginTop: '0.5rem' }}>
        ℹ️ {tokenCheck.message}
      </p>
    )}
  </div>
)}

#### **🎨 Advanced UI Patterns**

```javascript
// Multi-step Configuration
<div className="form-group">
  <label>Configuration Steps</label>
  <div className="steps-container">
    <div className={`step ${currentStep >= 1 ? 'completed' : ''}`}>
      <span className="step-number">1</span>
      <span className="step-title">Basic Settings</span>
    </div>
    <div className={`step ${currentStep >= 2 ? 'completed' : ''}`}>
      <span className="step-number">2</span>
      <span className="step-title">Authentication</span>
    </div>
    <div className={`step ${currentStep >= 3 ? 'completed' : ''}`}>
      <span className="step-number">3</span>
      <span className="step-title">Test Connection</span>
    </div>
  </div>
</div>

// Collapsible Advanced Options
<details className="advanced-options mt-4">
  <summary style={{ cursor: 'pointer', fontWeight: '600' }}>
    ⚙️ Advanced Options
  </summary>
  <div className="mt-2">
    {/* Advanced configuration fields */}
  </div>
</details>

// Copy-to-Clipboard Pattern
<div className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
  <input
    type="text"
    value={generatedValue}
    readOnly
    style={{ flex: 1 }}
  />
  <button
    type="button"
    className="copy-btn"
    onClick={() => {
      navigator.clipboard.writeText(generatedValue);
      alert('Copied to clipboard!');
    }}
  >
    Copy
  </button>
</div>

// Dynamic Field Lists
<div className="dynamic-fields">
  <label>API Headers</label>
  {formData.headers?.map((header, index) => (
    <div key={index} className="flex mt-2" style={{ gap: '0.5rem' }}>
      <input
        type="text"
        placeholder="Header Name"
        value={header.name}
        onChange={(e) => updateHeaderField(index, 'name', e.target.value)}
      />
      <input
        type="text"
        placeholder="Header Value"
        value={header.value}
        onChange={(e) => updateHeaderField(index, 'value', e.target.value)}
      />
      <button
        type="button"
        onClick={() => removeHeader(index)}
        style={{ color: '#dc3545' }}
      >
        ✕
      </button>
    </div>
  ))}
  <button
    type="button"
    className="copy-btn mt-2"
    onClick={addNewHeader}
  >
    + Add Header
  </button>
</div>
```

#### **🎨 Responsive Design & Accessibility Standards**

```javascript
// Responsive Design Rules
RESPONSIVE_STANDARDS = {
  mobile: 'All forms must work on 375px width minimum',
  tablet: 'Configuration panels should adapt to 768px+ screens',  
  desktop: 'Full functionality available on 1024px+ screens',
  flexbox: 'Use flexbox for layouts, avoid fixed widths',
  overflow: 'Long content should scroll or wrap gracefully'
}

// Accessibility Requirements
ACCESSIBILITY_STANDARDS = {
  labels: 'Every input must have a proper <label> with htmlFor',
  colors: 'Text contrast must meet WCAG 2.1 AA standards',
  focus: 'All interactive elements must be keyboard accessible',
  aria: 'Use aria-describedby for help text associations',
  errors: 'Error messages must be clearly associated with fields'
}

// Example Accessible Form Field
<div className="form-group">
  <label htmlFor="apiKey" className="required">
    API Key *
  </label>
  <input
    type="password"
    id="apiKey"
    name="apiKey"
    value={formData.apiKey || ''}
    onChange={handleInputChange}
    aria-describedby="apiKey-help"
    aria-invalid={!!errors.apiKey}
    required
  />
  <p id="apiKey-help" className="text-sm text-gray-500 mt-1">
    Your API key from the service dashboard
  </p>
  {errors.apiKey && (
    <p className="text-sm text-red-600 mt-1" role="alert">
      {errors.apiKey}
    </p>
  )}
</div>
```

#### **🎨 Animation & Interaction Standards**

```javascript
// Loading States
LOADING_PATTERNS = {
  buttons: 'Disable + spinner + text change ("Connecting..." vs "Connect")',
  forms: 'Show progress indicators for multi-step processes',
  data: 'Skeleton loaders for data being fetched',
  status: 'Smooth transitions between success/error states'
}

// Hover Effects (CSS-in-JS)
HOVER_EFFECTS = {
  buttons: 'Subtle background color change on hover',
  inputs: 'Border color change to indicate focus',
  cards: 'Box shadow elevation on hover',
  icons: 'Color transition for interactive icons'
}

// Example Interactive Button
<button
  type="button"
  className="copy-btn"
  onClick={handleClick}
  disabled={isLoading}
  style={{
    backgroundColor: isLoading ? '#6c757d' : '#28a745',
    color: 'white',
    opacity: isLoading ? 0.6 : 1,
    cursor: isLoading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease'
  }}
>
  {isLoading ? (
    <>
      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
      Processing...
    </>
  ) : (
    <>
      <i className="fa-solid fa-check mr-2"></i>
      Submit
    </>
  )}
</button>
```

---

## ⚙️ Backend Implementation

### **1. Create Node Class**
File: `backend/nodes/{category}/{nodeName}Node.js`

```javascript
const logger = require('../../services/logger');

/**
 * Your Node - Description of what it does
 */
class YourNode {
    constructor() {
        this.type = 'yourNodeType';           // Must match frontend type
        this.name = 'Your Node Name';         // Display name
        this.description = 'What node does';  // Description
        this.category = 'action';             // action, trigger, logic
        this.icon = 'fa-your-icon';           // FontAwesome icon
        this.color = 'text-blue-500';         // Tailwind color
    }

    /**
     * Execute the node logic
     * @param {object} inputData - Data from previous nodes
     * @param {object} config - Node configuration from UI
     * @param {object} context - Execution context (optional)
     * @returns {object} - Result data for next nodes
     */
    async execute(inputData, config = {}, context = {}) {
        try {
            logger.info(`Executing ${this.name}`, {
                hasInput: !!inputData,
                configKeys: Object.keys(config)
            });

            // Validate required configuration
            const validation = this.validateConfig(config);
            if (!validation.valid) {
                throw new Error(`Configuration error: ${validation.errors.join(', ')}`);
            }

            // Process templates in config
            const processedConfig = this.processTemplates(config, inputData);

            // Your main node logic here
            const result = await this.performAction(inputData, processedConfig);

            logger.info(`${this.name} executed successfully`, {
                hasResult: !!result
            });

            return result;

        } catch (error) {
            logger.logError(error, { 
                context: `${this.type}_execution`,
                inputData: JSON.stringify(inputData, null, 2),
                config: JSON.stringify(config, null, 2)
            });
            throw error;
        }
    }

    /**
     * Main action logic - implement your functionality here
     */
    async performAction(inputData, config) {
        // Example: API call
        // const response = await fetch(config.apiUrl, {
        //     method: 'POST',
        //     headers: { 'Authorization': `Bearer ${config.apiKey}` },
        //     body: JSON.stringify(inputData)
        // });
        // return await response.json();

        // Example: Data transformation
        return {
            success: true,
            processedData: inputData,
            timestamp: new Date().toISOString(),
            nodeType: this.type
        };
    }

    /**
     * Process template expressions in configuration
     */
    processTemplates(config, inputData) {
        const processed = { ...config };
        
        for (const [key, value] of Object.entries(processed)) {
            if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
                processed[key] = this.resolveTemplate(value, inputData);
            }
        }
        
        return processed;
    }

    /**
     * Resolve single template expression
     */
    resolveTemplate(template, data) {
        // Simple template resolution - you can enhance this
        return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            const keys = path.trim().split('.');
            let value = data;
            
            for (const key of keys) {
                if (value && typeof value === 'object' && key in value) {
                    value = value[key];
                } else {
                    return match; // Return original if path not found
                }
            }
            
            return String(value);
        });
    }

    /**
     * Validate node configuration
     */
    validateConfig(config) {
        const errors = [];
        
        // Add your validation rules
        // if (!config.requiredField) {
        //     errors.push('Required field is missing');
        // }
        
        // if (config.numericField && isNaN(config.numericField)) {
        //     errors.push('Numeric field must be a number');
        // }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get node information for display
     */
    getNodeInfo(config = {}) {
        return {
            type: this.type,
            name: this.name,
            category: this.category,
            status: 'ready',
            hasRequiredConfig: this.validateConfig(config).valid
        };
    }
}

module.exports = YourNode;
```

### **2. For Trigger Nodes (Webhooks)**
Additional methods for trigger nodes:

```javascript
/**
 * Generate webhook URL for trigger
 */
generateWebhookUrl(workflowId, nodeId, config = {}) {
    const path = config.webhookPath || 'default';
    const baseUrl = process.env.BASE_URL || 'https://workflow-lg9z.onrender.com';
    return `${baseUrl}/api/webhooks/${this.type}/${nodeId}/${path}`;
}

/**
 * Process incoming webhook data
 */
async processWebhookData(requestData, config = {}) {
    const { body, headers, query, method } = requestData;
    
    // Process and extract relevant data
    const processedData = {
        json: body || {},
        headers: headers || {},
        query: query || {},
        method: method,
        timestamp: new Date().toISOString(),
        nodeType: this.type
    };
    
    return processedData;
}
```

### **3. Add Route Integration (If Needed)**
File: `backend/routes/nodes.js` or create new route file

```javascript
// Add custom endpoint if node needs special API routes
router.post('/your-node-endpoint', asyncHandler(async (req, res) => {
    const YourNode = require('../nodes/actions/yourNodeNode');
    const yourNode = new YourNode();
    
    try {
        const result = await yourNode.execute(req.body.inputData, req.body.config);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}));
```

---

## ✅ File Update Checklist

### **🔴 ALWAYS UPDATE (Required for every node)**

| File | What to Add | Purpose |
|------|-------------|---------|
| `backend/nodes/{category}/{nodeName}Node.js` | **Create entire file** | Core node logic |
| `frontend/.../Sidebar.js` | **Add DraggableNode entry** | Make node draggable |
| `frontend/.../ConfigPanel.js` | **Add configuration section** | Node settings UI |
| `frontend/.../NodeShape.js` | **Add icon mappings** | Visual representation |

### **🟡 CONDITIONALLY UPDATE (Depends on node type)**

| File | When to Update | What to Add |
|------|----------------|-------------|
| `backend/routes/webhooks.js` | **Trigger nodes only** | Webhook endpoints |
| `backend/routes/nodes.js` | **If custom API needed** | Custom endpoints |
| `backend/services/workflowExecutor.js` | **If special execution needed** | Execution logic |
| `backend/controllers/nodeController.js` | **If controller integration needed** | Controller methods |

### **🟢 AUTO-GENERATED (Updated automatically)**
- Database entries (if applicable)
- Route registrations (if using auto-discovery)
- API documentation (if using auto-generation)

---

## 📝 Node Types & Examples

### **1. Action Node Example (Email Sender)**
```javascript
// backend/nodes/actions/emailSenderNode.js
class EmailSenderNode {
    constructor() {
        this.type = 'emailSender';
        this.name = 'Send Email';
        this.category = 'action';
    }

    async execute(inputData, config) {
        // Send email logic
        const emailResult = await sendEmail({
            to: config.recipient,
            subject: config.subject,
            body: this.processTemplates(config.body, inputData)
        });
        
        return {
            success: true,
            messageId: emailResult.id,
            sentAt: new Date().toISOString()
        };
    }
}
```

### **2. Trigger Node Example (File Watcher)**
```javascript
// backend/nodes/triggers/fileWatcherNode.js
class FileWatcherNode {
    constructor() {
        this.type = 'fileWatcher';
        this.name = 'File Watcher';
        this.category = 'trigger';
    }

    async setupTrigger(config) {
        // Setup file system watcher
        // This runs when workflow is activated
    }

    async processFileChange(filePath, changeType) {
        return {
            filePath,
            changeType,
            timestamp: new Date().toISOString(),
            fileStats: await fs.stat(filePath)
        };
    }
}
```

### **3. Logic Node Example (Data Filter)**
```javascript
// backend/nodes/logic/dataFilterNode.js
class DataFilterNode {
    constructor() {
        this.type = 'dataFilter';
        this.name = 'Filter Data';
        this.category = 'logic';
    }

    async execute(inputData, config) {
        const filteredData = inputData.filter(item => {
            return this.evaluateCondition(item, config.condition);
        });
        
        return {
            filtered: filteredData,
            originalCount: inputData.length,
            filteredCount: filteredData.length
        };
    }
}
```

---

## 🧪 Testing Guide

### **1. Local Testing**
```bash
# Test backend node directly
cd backend
node -e "
const YourNode = require('./nodes/actions/yourNodeNode');
const node = new YourNode();
node.execute({test: 'data'}, {param: 'value'})
  .then(result => console.log('✅ Result:', result))
  .catch(err => console.error('❌ Error:', err));
"
```

### **2. Frontend Testing**
1. Start frontend: `npm run dev`
2. Go to workflow builder
3. Drag your node to canvas
4. Configure node parameters
5. Connect to other nodes
6. Test workflow execution

### **3. Integration Testing**
```bash
# Test webhook endpoint (for triggers)
curl -X POST "https://workflow-lg9z.onrender.com/api/webhooks/yourNodeType/test-node/test" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Test node API endpoint
curl -X POST "https://workflow-lg9z.onrender.com/api/nodes/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "nodeType": "yourNodeType",
    "inputData": {"test": "data"},
    "config": {"param": "value"}
  }'
```

### **4. Template Testing**
Test template resolution:
```javascript
// In ConfigPanel.js test button
const testData = {
  $json: { name: "John", age: 30 },
  previousNode: { result: "success" }
};

// Test template: "Hello {{$json.name}}, you are {{$json.age}} years old"
```

---

## 🔧 Troubleshooting

### **Common Issues & Solutions**

#### **❌ "Route not found" Error**
**Problem**: Node endpoints return 404
**Solutions**:
1. Check route registration in `backend/routes/`
2. Verify node file exports correctly: `module.exports = YourNode`
3. Check for syntax errors: `node -c yourNodeFile.js`
4. Ensure all dependencies are installed

#### **❌ Node not appearing in sidebar**
**Problem**: Node doesn't show up in draggable library
**Solutions**:
1. Check `Sidebar.js` has correct `DraggableNode` entry
2. Verify `type` matches between frontend and backend
3. Clear browser cache and restart frontend
4. Check for JavaScript errors in browser console

#### **❌ Configuration panel not showing**
**Problem**: Node config UI doesn't appear
**Solutions**:
1. Check `ConfigPanel.js` has matching `node.data.type === 'yourType'`
2. Verify conditional logic and syntax
3. Check for missing closing braces/tags
4. Use browser developer tools to debug

#### **❌ Template expressions not working**
**Problem**: `{{variable}}` not resolving
**Solutions**:
1. Check `processTemplates` method implementation
2. Verify data structure matches template path
3. Use `console.log` to debug data flow
4. Test with simple templates first

#### **❌ Workflow execution fails**
**Problem**: Node throws errors during execution
**Solutions**:
1. Add comprehensive error handling
2. Validate all required configuration
3. Check input data structure
4. Add logging for debugging
5. Test node in isolation first

### **Debugging Tools**
```javascript
// Add to node execute method
console.log('🔍 DEBUG - Input:', JSON.stringify(inputData, null, 2));
console.log('🔍 DEBUG - Config:', JSON.stringify(config, null, 2));
console.log('🔍 DEBUG - Result:', JSON.stringify(result, null, 2));
```

### **Production Deployment Issues**
1. **Dependencies**: Ensure all npm packages are in `package.json`
2. **Environment Variables**: Check required env vars are set
3. **Route Loading**: Verify routes load without errors
4. **File Paths**: Use relative paths, not absolute paths

---

## 📚 API Reference

### **Available Utilities**

#### **Logger**
```javascript
const logger = require('../../services/logger');

logger.info('Info message', { context: 'data' });
logger.logError(error, { context: 'node_execution' });
```

#### **Expression Resolver**
```javascript
// In ConfigPanel.js
<ExpressionInput 
  name="field" 
  value={formData.field} 
  onChange={handleInputChange} 
  inputData={inputData}
  currentNode={node} 
  allNodes={nodes}
/>
```

#### **Template Processing**
```javascript
// Resolve {{variable}} expressions
const resolved = this.processTemplates(config, inputData);
```

### **Data Structures**

#### **Input Data Format**
```javascript
{
  $json: {},           // Main data object
  $binary: {},         // Binary data (files, images)
  $previous: {},       // Data from previous node
  nodeId: "string",    // Source node ID
  nodeType: "string",  // Source node type
  executionId: "string" // Workflow execution ID
}
```

#### **Configuration Format**
```javascript
{
  // User-configured parameters from UI
  parameter1: "value",
  parameter2: 123,
  templateField: "{{$json.field}}",
  
  // Metadata
  nodeId: "string",
  nodeType: "string"
}
```

#### **Output Data Format**
```javascript
{
  // Your processed data
  result: {},
  success: true,
  
  // Metadata (optional but recommended)
  timestamp: "ISO string",
  nodeType: "string",
  executionTime: "number (ms)"
}
```

### **Hook Points**

#### **Workflow Execution Hooks**
- `beforeExecution(node, inputData, config)`
- `afterExecution(node, result)`
- `onError(node, error)`

#### **UI Hooks**
- `onNodeSelect(node)`
- `onNodeConfigChange(node, config)`
- `onNodeDelete(node)`

### **Constants**
```javascript
// Node categories
const CATEGORIES = {
  TRIGGER: 'trigger',
  ACTION: 'action', 
  LOGIC: 'logic'
};

// Common icons
const ICONS = {
  API: 'fa-plug',
  DATABASE: 'fa-database',
  EMAIL: 'fa-envelope',
  FILE: 'fa-file',
  TIME: 'fa-clock'
};
```

---

## 🎯 Advanced Topics

### **Custom Route Integration**
For nodes that need special API endpoints:

```javascript
// backend/routes/customRoutes.js
const express = require('express');
const router = express.Router();

router.post('/your-special-endpoint', async (req, res) => {
  // Custom logic
  res.json({ result: 'success' });
});

module.exports = router;

// Register in main server file
app.use('/api/custom', require('./routes/customRoutes'));
```

### **Database Integration**
For nodes that need data persistence:

```javascript
const db = require('../../db');

async execute(inputData, config) {
  // Save to database
  await db.run('INSERT INTO your_table (data) VALUES (?)', 
    [JSON.stringify(inputData)]);
    
  return { saved: true };
}
```

### **Real-time Updates**
For nodes that need WebSocket/SSE:

```javascript
const WebSocket = require('ws');

class RealtimeNode {
  setupWebSocket(config) {
    this.ws = new WebSocket(config.wsUrl);
    this.ws.on('message', this.handleMessage.bind(this));
  }
}
```

---

## 🏆 Best Practices

### **✅ Do**
- Always validate configuration
- Add comprehensive error handling
- Use descriptive node and parameter names
- Include helpful descriptions and examples
- Test with various input data formats
- Add logging for debugging
- Follow existing code patterns
- Document complex logic

### **❌ Don't**
- Hard-code URLs or secrets
- Ignore error conditions
- Create nodes without proper validation
- Use unclear parameter names
- Skip testing with edge cases
- Commit sensitive data
- Break existing node patterns
- Forget to update all required files

---

## 🤝 Contributing

When creating nodes for the community:

1. **Follow this guide exactly**
2. **Test thoroughly** with multiple scenarios
3. **Document** any special requirements
4. **Add examples** of usage
5. **Consider** backward compatibility
6. **Submit** clean, well-commented code

---

## 📞 Support

- **Issues**: Check troubleshooting section first
- **Examples**: See existing nodes in `backend/nodes/`
- **Architecture**: Review `CLAUDE.md` for system overview
- **Community**: Share nodes and get help from other developers

---

*Happy Node Building! 🚀*

**Last Updated**: August 2025  
**Compatible With**: WorkflowNode v1.0+  
**Node Examples**: 17+ working node implementations included