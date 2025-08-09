/*
=================================================================
FILE: frontend/src/components/ConfigPanel.js (UPDATED & COMPLETE)
=================================================================
This is the complete and fully functional ConfigPanel component,
including all node variations and the expression system with
drag-and-drop functionality.
*/
import React, { useState, useEffect } from 'react';

// Helper function to resolve expressions like {{ a.b }} and {{ a[0].b }}
const resolveExpression = (expression, data) => {
    if (!expression || typeof expression !== 'string' || !data) {
        return expression;
    }
    
    // Helper function to parse path with array notation
    const parsePath = (pathStr) => {
        const parts = [];
        let current = '';
        let inBracket = false;
        
        // First, check if the path starts with a numbered node key like "1. Node Name"
        const nodeKeyMatch = pathStr.match(/^(\d+\.\s+[^[.]+)/);
        if (nodeKeyMatch) {
            const nodeKey = nodeKeyMatch[1];
            parts.push(nodeKey);
            // Continue parsing the rest of the path after the node key
            pathStr = pathStr.substring(nodeKey.length);
            if (pathStr.startsWith('.')) {
                pathStr = pathStr.substring(1); // Remove leading dot
            }
        }
        
        for (let i = 0; i < pathStr.length; i++) {
            const char = pathStr[i];
            
            if (char === '[') {
                if (current) {
                    parts.push(current);
                    current = '';
                }
                inBracket = true;
            } else if (char === ']') {
                if (inBracket && current) {
                    // Parse array index as number
                    const index = parseInt(current, 10);
                    if (!isNaN(index)) {
                        parts.push(index);
                    } else {
                        parts.push(current); // Keep as string if not a number
                    }
                    current = '';
                }
                inBracket = false;
            } else if (char === '.' && !inBracket) {
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) {
            parts.push(current);
        }
        
        return parts;
    };
    
    // Helper function to traverse object/array path
    const traversePath = (obj, pathParts) => {
        let current = obj;
        
        for (const part of pathParts) {
            if (current === null || current === undefined) {
                return { found: false, value: undefined };
            }
            
            if (typeof part === 'number') {
                // Array index
                if (!Array.isArray(current) || part >= current.length || part < 0) {
                    return { found: false, value: undefined };
                }
                current = current[part];
            } else {
                // Object property
                if (typeof current !== 'object' || !(part in current)) {
                    return { found: false, value: undefined };
                }
                current = current[part];
            }
        }
        
        return { found: true, value: current };
    };
    
    // This regex finds all instances of {{ path.to.key }}
    return expression.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        const pathStr = path.trim();
        console.log('🔍 Resolving path:', pathStr);
        
        const pathParts = parsePath(pathStr);
        console.log('🔧 Parsed path parts:', pathParts);
        
        // Try direct path resolution
        console.log('📊 Available data keys:', Object.keys(data));
        console.log('📋 Full data structure:', JSON.stringify(data, null, 2));
        const result = traversePath(data, pathParts);
        console.log('🎯 Direct path result:', result);
        
        if (result.found) {
            const resolvedValue = typeof result.value === 'object' ? JSON.stringify(result.value) : String(result.value);
            console.log('✅ Resolved to:', resolvedValue);
            return resolvedValue;
        }
        
        // If direct path fails, try nested search in each data node
        for (const [nodeKey, nodeData] of Object.entries(data)) {
            if (typeof nodeData === 'object' && nodeData !== null) {
                const nestedResult = traversePath(nodeData, pathParts);
                if (nestedResult.found) {
                    const resolvedValue = typeof nestedResult.value === 'object' ? JSON.stringify(nestedResult.value) : String(nestedResult.value);
                    console.log('✅ Nested resolved to:', resolvedValue);
                    return resolvedValue;
                }
            }
        }
        
        console.log('❌ Path not found:', pathStr);
        return match; // Return original {{...}} if path is invalid anywhere
    });
};


// Reusable component for a single draggable JSON key
const JsonKey = ({ path, value }) => {
    const onDragStart = (e) => {
        // Use 'text/plain' for broader browser compatibility
        e.dataTransfer.setData('text/plain', `{{${path}}}`);
    };
    return (
        <div draggable onDragStart={onDragStart} className="draggable-key">
            <strong>{path.split('.').pop()}:</strong> {JSON.stringify(value)}
        </div>
    );
};

// Reusable component to display the JSON tree view
const JsonTreeView = ({ data, parentPath = '' }) => {
    if (data === null || typeof data !== 'object') {
        return null;
    }
    return (
        <div className="json-tree">
            {Object.entries(data).map(([key, value]) => {
                const currentPath = parentPath ? `${parentPath}.${key}` : key;
                
                // Handle arrays
                if (Array.isArray(value)) {
                    return (
                        <details key={currentPath} className="json-node" open>
                            <summary className="json-key">{key} (array)</summary>
                            <div className="json-value">
                                {value.map((item, index) => {
                                    const arrayPath = `${currentPath}[${index}]`;
                                    if (typeof item === 'object' && item !== null) {
                                        return (
                                            <div key={arrayPath}>
                                                <div className="array-index">Index {index}:</div>
                                                <JsonTreeView data={item} parentPath={arrayPath} />
                                            </div>
                                        );
                                    }
                                    return <JsonKey key={arrayPath} path={arrayPath} value={item} />;
                                })}
                            </div>
                        </details>
                    );
                }
                
                // Handle objects
                if (typeof value === 'object' && value !== null) {
                    return (
                        <details key={currentPath} className="json-node" open>
                            <summary className="json-key">{key}</summary>
                            <div className="json-value">
                                <JsonTreeView data={value} parentPath={currentPath} />
                            </div>
                        </details>
                    );
                }
                
                // Handle primitive values
                return <JsonKey key={currentPath} path={currentPath} value={value} />;
            })}
        </div>
    );
};


// Enhanced input component with drag-drop and live preview
const ExpressionInput = ({ name, value, onChange, inputData, placeholder, isTextarea = false }) => {
    const [resolvedValue, setResolvedValue] = useState('');
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    useEffect(() => {
        console.log('🔍 ExpressionInput DEBUG:', { 
            hasInputData: !!inputData, 
            inputDataType: Array.isArray(inputData) ? 'array' : typeof inputData,
            inputDataLength: Array.isArray(inputData) ? inputData.length : 'not-array',
            value: value,
            hasTemplates: value && typeof value === 'string' && value.includes('{{'),
            inputDataPreview: inputData ? JSON.stringify(inputData).substring(0, 200) + '...' : null
        });
        
        if (inputData && value && typeof value === 'string' && value.includes('{{')) {
            // Handle cascading data structure from collectAllPreviousNodeData
            let dataToUse;
            if (Array.isArray(inputData) && inputData.length > 0 && inputData[0].nodeId) {
                console.log('📊 Processing cascading data structure');
                // This is cascading data structure - convert to flat object for template resolution
                dataToUse = {};
                inputData.forEach(nodeInfo => {
                    // Create entries like "1. AI Agent" for easy template access
                    const nodeKey = `${nodeInfo.order}. ${nodeInfo.nodeLabel}`;
                    dataToUse[nodeKey] = nodeInfo.data;
                    
                    // Also create direct data entries for backwards compatibility
                    if (nodeInfo.data && typeof nodeInfo.data === 'object') {
                        Object.keys(nodeInfo.data).forEach(key => {
                            // Priority: Give Telegram Trigger data priority over AI Agent data for common keys
                            if (!(key in dataToUse) || nodeInfo.nodeType === 'telegramTrigger') {
                                dataToUse[key] = nodeInfo.data[key];
                            }
                        });
                    }
                });
                console.log('🔧 Final dataToUse for cascading:', dataToUse);
            } else if (Array.isArray(inputData)) {
                console.log('📊 Processing legacy array structure');
                // Legacy array structure - take first element
                dataToUse = inputData[0];
                console.log('🔧 Final dataToUse for legacy:', dataToUse);
            } else {
                console.log('📊 Processing direct object structure');
                // Direct object structure
                dataToUse = inputData;
                console.log('🔧 Final dataToUse for direct:', dataToUse);
            }
            
            console.log('🔧 Calling resolveExpression with:', { value, dataToUse });
            const resolved = resolveExpression(value, dataToUse);
            console.log('✅ resolveExpression returned:', resolved);
            setResolvedValue(resolved);
        } else {
            setResolvedValue('');
        }
    }, [value, inputData]);

    const handleDrop = (e) => {
        e.preventDefault();
        const path = e.dataTransfer.getData('text/plain');
        if (path) {
            const newValue = e.target.value ? `${e.target.value} ${path}` : path;
            onChange({ target: { name: name, value: newValue } });
        }
        setIsDraggingOver(false);
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const InputComponent = isTextarea ? 'textarea' : 'input';

    return (
        <div className="expression-input-wrapper">
            <InputComponent
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={isDraggingOver ? 'dragging-over' : ''}
                rows={isTextarea ? 4 : undefined}
            />
            {resolvedValue && <div className="live-preview">Preview: {resolvedValue}</div>}
            {value && value.includes('{{') && !resolvedValue && <div className="live-preview" style={{color: 'red'}}>Debug: No resolved value for "{value}"</div>}
        </div>
    );
};


const ConfigPanel = ({ node, nodes, edges, onClose, onNodeUpdate }) => {
  const [formData, setFormData] = useState({
      label: node.data.label || '',
      description: node.data.description || '',
      fieldsToMatch: node.data.fieldsToMatch || [{ key1: '', key2: '' }],
      resumeCondition: node.data.resumeCondition || 'afterTimeInterval',
      waitAmount: node.data.waitAmount || 5,
      waitUnit: node.data.waitUnit || 'seconds',
      conditions: node.data.conditions || [{ value1: '', operator: 'is_equal_to', value2: '' }],
      combinator: node.data.combinator || 'AND',
      ignoreCase: node.data.ignoreCase || false,
      errorType: node.data.errorType || 'errorMessage',
      errorMessage: node.data.errorMessage || 'An error occurred!',
      switchRules: node.data.switchRules || [{ value1: '', operator: 'is_equal_to', value2: '' }],
      switchOptions: node.data.switchOptions || [],
      source: node.data.source || 'database',
      workflow: node.data.workflow || 'fromList',
      workflowId: node.data.workflowId || '',
      mode: node.data.mode || 'runOnce',
      mergeMode: node.data.mergeMode || 'append',
      batchSize: node.data.batchSize || 1,
      fields: node.data.fields || [{ key: '', value: '' }],
      // Chat trigger specific fields
      filterKeywords: node.data.filterKeywords || [],
      allowedDomains: node.data.allowedDomains || [],
      requireUserInfo: node.data.requireUserInfo || false,
      autoRespond: node.data.autoRespond || false,
      autoResponseMessage: node.data.autoResponseMessage || 'Thank you for your message. We\'ll get back to you soon!',
      // Telegram trigger specific fields
      botToken: node.data.botToken || '',
      // Telegram send message fields
      chatId: node.data.chatId || '{{message.chat.id}}',
      messageType: node.data.messageType || 'text',
      // text
      messageText: node.data.messageText || 'Hello! This is a message from your bot.',
      parseMode: node.data.parseMode || '',
      disableWebPagePreview: node.data.disableWebPagePreview || false,
      // photo
      photoUrl: node.data.photoUrl || '',
      photoCaption: node.data.photoCaption || '',
      // video
      videoUrl: node.data.videoUrl || '',
      videoCaption: node.data.videoCaption || '',
      videoDuration: node.data.videoDuration || '',
      // audio
      audioUrl: node.data.audioUrl || '',
      audioCaption: node.data.audioCaption || '',
      // voice
      voiceUrl: node.data.voiceUrl || '',
      // document
      documentUrl: node.data.documentUrl || '',
      // animation
      animationUrl: node.data.animationUrl || '',
      // sticker
      stickerFileId: node.data.stickerFileId || '',
      // location
      latitude: node.data.latitude || '',
      longitude: node.data.longitude || '',
      locationHorizontalAccuracy: node.data.locationHorizontalAccuracy || '',
      // contact
      contactPhoneNumber: node.data.contactPhoneNumber || '',
      contactFirstName: node.data.contactFirstName || '',
      contactLastName: node.data.contactLastName || '',
      // poll
      pollQuestion: node.data.pollQuestion || '',
      pollOptions: node.data.pollOptions || '',
      // admin
      banUserId: node.data.banUserId || '',
      // AI Agent
      apiKey: node.data.apiKey || '',
      model: node.data.model || 'claude-3-5-sonnet-20241022',
      systemPrompt: node.data.systemPrompt || '',
      userMessage: node.data.userMessage || '',
  });

  useEffect(() => {
    setFormData({
      label: node.data.label || '',
      description: node.data.description || '',
      fieldsToMatch: node.data.fieldsToMatch || [{ key1: '', key2: '' }],
      resumeCondition: node.data.resumeCondition || 'afterTimeInterval',
      waitAmount: node.data.waitAmount || 5,
      waitUnit: node.data.waitUnit || 'seconds',
      conditions: node.data.conditions || [{ value1: '', operator: 'is_equal_to', value2: '' }],
      combinator: node.data.combinator || 'AND',
      ignoreCase: node.data.ignoreCase || false,
      errorType: node.data.errorType || 'errorMessage',
      errorMessage: node.data.errorMessage || 'An error occurred!',
      switchRules: node.data.switchRules || [{ value1: '', operator: 'is_equal_to', value2: '' }],
      switchOptions: node.data.switchOptions || [],
      source: node.data.source || 'database',
      workflow: node.data.workflow || 'fromList',
      workflowId: node.data.workflowId || '',
      mode: node.data.mode || 'runOnce',
      mergeMode: node.data.mergeMode || 'append',
      batchSize: node.data.batchSize || 1,
      fields: node.data.fields || [{ key: '', value: '' }],
      // Chat trigger specific fields
      filterKeywords: node.data.filterKeywords || [],
      allowedDomains: node.data.allowedDomains || [],
      requireUserInfo: node.data.requireUserInfo || false,
      autoRespond: node.data.autoRespond || false,
      autoResponseMessage: node.data.autoResponseMessage || 'Thank you for your message. We\'ll get back to you soon!',
      // Telegram trigger specific fields
      botToken: node.data.botToken || '',
      // Telegram send message fields
      chatId: node.data.chatId || '{{message.chat.id}}',
      messageType: node.data.messageType || 'text',
      // text
      messageText: node.data.messageText || 'Hello! This is a message from your bot.',
      parseMode: node.data.parseMode || '',
      disableWebPagePreview: node.data.disableWebPagePreview || false,
      // photo
      photoUrl: node.data.photoUrl || '',
      photoCaption: node.data.photoCaption || '',
      // video
      videoUrl: node.data.videoUrl || '',
      videoCaption: node.data.videoCaption || '',
      videoDuration: node.data.videoDuration || '',
      // audio
      audioUrl: node.data.audioUrl || '',
      audioCaption: node.data.audioCaption || '',
      // voice
      voiceUrl: node.data.voiceUrl || '',
      // document
      documentUrl: node.data.documentUrl || '',
      // animation
      animationUrl: node.data.animationUrl || '',
      // sticker
      stickerFileId: node.data.stickerFileId || '',
      // location
      latitude: node.data.latitude || '',
      longitude: node.data.longitude || '',
      locationHorizontalAccuracy: node.data.locationHorizontalAccuracy || '',
      // contact
      contactPhoneNumber: node.data.contactPhoneNumber || '',
      contactFirstName: node.data.contactFirstName || '',
      contactLastName: node.data.contactLastName || '',
      // poll
      pollQuestion: node.data.pollQuestion || '',
      pollOptions: node.data.pollOptions || '',
      // admin
      banUserId: node.data.banUserId || '',
      // AI Agent
      apiKey: node.data.apiKey || '',
      model: node.data.model || 'claude-3-5-sonnet-20241022',
      systemPrompt: node.data.systemPrompt || '',
      userMessage: node.data.userMessage || '',
    });
  }, [node.id]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [tokenCheck, setTokenCheck] = useState({ status: 'idle', message: '' });
  const [activeTab, setActiveTab] = useState('parameters');
  const [inputData, setInputData] = useState(node.data.inputData || null);
  const [outputData, setOutputData] = useState(node.data.outputData || null);

  // Custom function to update both local state and node data
  const updateOutputData = (newOutputData) => {
    setOutputData(newOutputData);
    if (onNodeUpdate) {
      onNodeUpdate(node.id, { outputData: newOutputData });
    }
  };

  const handleInputChange = (e, index) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    if (['value1', 'operator', 'value2'].includes(name) && (node.data.type === 'if' || node.data.type === 'filter')) {
        const newConditions = formData.conditions.map((cond, i) => {
            if (i === index) { return { ...cond, [name]: val }; }
            return cond;
        });
        setFormData(prev => ({ ...prev, conditions: newConditions }));
    } else if (['value1', 'operator', 'value2'].includes(name) && node.data.type === 'switch') {
        const newRules = formData.switchRules.map((rule, i) => {
            if (i === index) { return { ...rule, [name]: val }; }
            return rule;
        });
        setFormData(prev => ({ ...prev, switchRules: newRules }));
    } else if (name === 'key1' || name === 'key2') {
        const newFields = formData.fieldsToMatch.map((field, i) => {
            if (i === index) { return { ...field, [name]: val }; }
            return field;
        });
        setFormData(prev => ({ ...prev, fieldsToMatch: newFields }));
    } else if (name === 'key' || name === 'value') {
        const newFields = formData.fields.map((field, i) => {
            if (i === index) { return { ...field, [name]: val }; }
            return field;
        });
        setFormData(prev => ({ ...prev, fields: newFields }));
    } else {
        setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const handleAddDataField = () => {
    setFormData(prev => ({ ...prev, fields: [...prev.fields, { key: '', value: '' }] }));
  };
  const handleRemoveDataField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, fields: newFields }));
  };
  const handleAddCondition = () => {
    setFormData(prev => ({ ...prev, conditions: [...prev.conditions, { value1: '', operator: 'is_equal_to', value2: '' }] }));
  };
  const handleRemoveCondition = (index) => {
    const newConditions = formData.conditions.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, conditions: newConditions }));
  };
  const handleAddSwitchRule = () => {
    setFormData(prev => ({ ...prev, switchRules: [...prev.switchRules, { value1: '', operator: 'is_equal_to', value2: '' }] }));
  };
  const handleRemoveSwitchRule = (index) => {
    const newRules = formData.switchRules.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, switchRules: newRules }));
  };
  const handleInsertSwitchRule = (index) => {
    const newRules = [...formData.switchRules];
    newRules.splice(index + 1, 0, { value1: '', operator: 'is_equal_to', value2: '' });
    setFormData(prev => ({ ...prev, switchRules: newRules }));
  };
  const handleOptionToggle = (option) => {
    const currentIndex = formData.switchOptions.indexOf(option);
    const newOptions = [...formData.switchOptions];
    if (currentIndex === -1) { newOptions.push(option); } 
    else { newOptions.splice(currentIndex, 1); }
    setFormData(prev => ({ ...prev, switchOptions: newOptions }));
  };

  const handleClose = () => {
    const allUpdatedData = { ...formData, inputData, outputData };
    onClose(allUpdatedData);
  };
  
  // Helper function to get correct execution order using topological sort
  const getExecutionOrder = () => {
    const inDegree = new Map();
    const nodeMap = new Map();
    
    // Initialize in-degree count and node map
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      nodeMap.set(node.id, node);
    });
    
    // Calculate in-degree for each node
    edges.forEach(edge => {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });
    
    // Find nodes with no incoming edges (start nodes)
    const queue = [];
    nodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node);
      }
    });
    
    // Topological sort
    const order = [];
    while (queue.length > 0) {
      const currentNode = queue.shift();
      order.push(currentNode);
      
      // Find all outgoing edges from current node
      const outgoingEdges = edges.filter(edge => edge.source === currentNode.id);
      
      outgoingEdges.forEach(edge => {
        const newInDegree = inDegree.get(edge.target) - 1;
        inDegree.set(edge.target, newInDegree);
        
        if (newInDegree === 0) {
          const targetNode = nodeMap.get(edge.target);
          if (targetNode) {
            queue.push(targetNode);
          }
        }
      });
    }
    
    return order;
  };

  // Helper function to recursively collect data from all previous nodes in the workflow chain
  const collectAllPreviousNodeData = (currentNodeId, visited = new Set()) => {
    // Prevent infinite loops
    if (visited.has(currentNodeId)) {
      return [];
    }
    visited.add(currentNodeId);

    const result = [];
    const incomingEdges = edges.filter(edge => edge.target === currentNodeId);
    
    // Get the correct execution order
    const executionOrder = getExecutionOrder();
    const nodeOrderMap = new Map();
    executionOrder.forEach((node, index) => {
      nodeOrderMap.set(node.id, index + 1);
    });
    
    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode) {
        // First collect data from nodes even further back
        const parentData = collectAllPreviousNodeData(sourceNode.id, visited);
        result.push(...parentData);
        
        // Then add this node's data if it has output
        if (sourceNode.data.outputData) {
          result.push({
            nodeId: sourceNode.id,
            nodeType: sourceNode.data.type,
            nodeLabel: sourceNode.data.label || `${sourceNode.data.type} Node`,
            data: sourceNode.data.outputData,
            order: nodeOrderMap.get(sourceNode.id) || result.length + 1
          });
        }
      }
    }
    
    return result;
  };

  const handleGetData = () => {
    
    // Special handling for telegram trigger nodes that should fetch from their own output
    if (node.data.type === 'telegramTrigger') {
        if (outputData && outputData.length > 0) {
            setInputData(outputData);
            return;
        } else {
            setInputData({ message: "No telegram data available. Click 'Fetch Messages' button first to get real telegram data." });
            return;
        }
    }

    // Note: telegramSendMessage now uses the general cascading data collection below

    // Special handling for merge node - collect data from all connected nodes
    if (node.data.type === 'merge') {
        const incomingEdges = edges.filter(edge => edge.target === node.id);
        if (incomingEdges.length === 0) {
            setInputData({ message: "No nodes are connected to the input." });
            return;
        }

        const mergedInputData = {};
        let hasValidData = false;

        incomingEdges.forEach((edge, index) => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            if (sourceNode && sourceNode.data.outputData) {
                // Use the source handle ID if available, otherwise use index
                const outputKey = edge.sourceHandle || `output${index + 1}`;
                mergedInputData[outputKey] = sourceNode.data.outputData;
                hasValidData = true;
            }
        });

        if (!hasValidData) {
            setInputData({ message: "Connected nodes have not been executed or have no output data." });
            return;
        }

        setInputData(mergedInputData);
    } else {
        // Enhanced logic: collect data from ALL previous nodes in the workflow chain
        const allPreviousData = collectAllPreviousNodeData(node.id);
        
        
        if (allPreviousData.length === 0) {
            setInputData({ message: "No nodes are connected to the input, or connected nodes have no output data." });
            return;
        }
        
        // Pass the cascading data structure directly for live preview
        // This preserves the nodeId, nodeType, nodeLabel structure that ExpressionInput expects
        allPreviousData.reverse(); // Reverse to show closest node first
        setInputData(allPreviousData);
    }
  };

  const handlePostData = async () => {
    setIsLoading(true);
    updateOutputData(null);

    if (node.data.type === 'setData') {
        const output = {};
        formData.fields.forEach(field => {
            if (field.key) {
                output[field.key] = field.value;
            }
        });
        updateOutputData([output]);
        setIsLoading(false);
        return;
    }

    try {
        // Always use production backend (as per deployment setup)
        const API_BASE = 'https://workflow-lg9z.onrender.com';
        
        // Special handling for AI agent nodes due to routing issues
        let endpoint = `${API_BASE}/api/nodes/run-node`;
        if (node.data.type === 'aiAgent') {
            endpoint = `${API_BASE}/api/run-ai-agent`;
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                node: { type: node.data.type, config: formData },
                inputData: inputData
            })
        });
        const result = await response.json();
        if (!response.ok) { throw new Error(result.message || 'Execution failed.'); }
        updateOutputData(result);
    } catch (error) {
        console.error("Error executing node:", error);
        updateOutputData({ error: error.message });
    }
    setIsLoading(false);
  };
  
  return (
    <div className="config-panel-overlay" onClick={handleClose}>
        <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
                <span>INPUT</span>
                <button className="side-panel-btn" onClick={handleGetData} disabled={node.data.type === 'setData'}>GET</button>
            </div>
            <div className="panel-content-area data-panel">
                {inputData ? (
                    node.data.type === 'merge' && typeof inputData === 'object' && !Array.isArray(inputData) ? (
                        <JsonTreeView data={inputData} />
                    ) : Array.isArray(inputData) ? (
                        // Check if it's cascading data structure (with nodeId properties)
                        inputData.length > 0 && inputData[0].nodeId ? (
                            // For cascading data, show flattened structure like the old format
                            (() => {
                                const flattened = {};
                                inputData.forEach((nodeData) => {
                                    // Use the actual node order from the data, not array index
                                    const key = `${nodeData.order || 1}. ${nodeData.nodeLabel}`;
                                    flattened[key] = nodeData.data;
                                });
                                return <JsonTreeView data={flattened} />;
                            })()
                        ) : (
                            // For regular arrays, show first element
                            <JsonTreeView data={inputData[0]} />
                        )
                    ) : (
                        <JsonTreeView data={inputData} />
                    )
                ) : (
                    <div className="empty-state">
                        <i className="fa-solid fa-hand-pointer text-4xl mb-4"></i>
                        <h4 className="font-bold">Wire me up</h4>
                        <p>This node can receive input data from connected nodes or use the GET button to fetch test data.</p>
                    </div>
                )}
            </div>
        </div>
        <div className="main-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
                <h3><i className={`${node.data.icon} mr-2`}></i>{formData.label}</h3>
                <div className="flex items-center">
                    <span className="saved-status"><i className="fa-solid fa-check mr-2"></i>Saved</span>
                    <button className="execute-step-btn" disabled={isLoading} onClick={handlePostData}>Execute Step</button>
                    <button onClick={handleClose} className="close-button">&times;</button>
                </div>
            </div>
            <div className="tabs">
                <button className={`tab ${activeTab === 'parameters' ? 'active' : ''}`} onClick={() => setActiveTab('parameters')}>Parameters</button>
                <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
            </div>
            <div className="panel-content-area">
                {activeTab === 'parameters' && (
                    <div className="parameters-content">
                        <div className="description-box">
                            <i className={`fa-solid ${node.data.icon} mr-3 text-lg ${node.data.color}`}></i>
                            <div>
                                <div className="font-bold text-gray-800">{node.data.label}</div>
                                <p className="text-sm text-gray-600">{node.data.description}</p>
                            </div>
                        </div>
                        
                        {node.data.type === 'compare' && (
                            <div className="form-group mt-6">
                                <label>Fields to Match</label>
                                <p className="text-sm text-gray-500 mb-4">Define pairs of keys to match items between Input 1 and Input 2.</p>
                                {formData.fieldsToMatch.map((field, index) => (
                                    <div key={index} className="key-value-row">
                                        <ExpressionInput name="key1" value={field.key1} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="Key from Input 1" />
                                        <ExpressionInput name="key2" value={field.key2} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="Key from Input 2" />
                                        <button onClick={() => handleRemoveDataField(index)} className="remove-field-btn">&times;</button>
                                    </div>
                                ))}
                                <button onClick={handleAddDataField} className="add-field-btn"><i className="fa-solid fa-plus mr-2"></i> Add fields to match</button>
                            </div>
                        )}

                        {node.data.type === 'aiAgent' && (
                            <div className="form-group mt-6">
                                <label>AI Agent</label>
                                <div className="form-group">
                                    <label htmlFor="apiKey">Claude API Key</label>
                                    <div className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="password"
                                            name="apiKey"
                                            id="apiKey"
                                            value={formData.apiKey || ''}
                                            onChange={handleInputChange}
                                            placeholder="sk-ant-..."
                                            style={{ flex: 1 }}
                                        />
                                        <button
                                            type="button"
                                            className="copy-btn"
                                            onClick={async () => {
                                                try {
                                                    setTokenCheck({ status: 'checking', message: '' });
                                                    const API_BASE = 'https://workflow-lg9z.onrender.com';
                                                    // Use auth namespace as temporary workaround
                                                    const res = await fetch(`${API_BASE}/api/verify-claude`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ apiKey: formData.apiKey })
                                                    });
                                                    const json = await res.json();
                                                    if (res.ok && json.ok) {
                                                        setTokenCheck({ status: 'valid', message: `Valid (model: ${json.model || 'claude'})` });
                                                    } else {
                                                        setTokenCheck({ status: 'invalid', message: json.message || 'Invalid API key' });
                                                    }
                                                } catch (e) {
                                                    setTokenCheck({ status: 'invalid', message: e.message || 'Verification failed' });
                                                }
                                            }}
                                        >
                                            {tokenCheck.status === 'checking' ? 'Checking…' : 'Check Key'}
                                        </button>
                                    </div>
                                    {tokenCheck.status === 'valid' && (
                                        <p className="text-sm" style={{ color: '#16a34a', marginTop: '0.5rem' }}>✅ {tokenCheck.message}</p>
                                    )}
                                    {tokenCheck.status === 'invalid' && (
                                        <p className="text-sm" style={{ color: '#dc2626', marginTop: '0.5rem' }}>❌ {tokenCheck.message}</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="model">Model</label>
                                    <div className="custom-select-wrapper">
                                        <select name="model" id="model" value={formData.model || 'claude-3-5-sonnet-20241022'} onChange={handleInputChange}>
                                            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet (Latest)</option>
                                            <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast)</option>
                                            <option value="gpt-4">GPT-4 (Coming Soon)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="systemPrompt">System Prompt</label>
                                    <ExpressionInput name="systemPrompt" value={formData.systemPrompt || ''} onChange={handleInputChange} inputData={inputData} isTextarea={true} placeholder="You are a helpful assistant..." />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="userMessage">User Message</label>
                                    <ExpressionInput name="userMessage" value={formData.userMessage || ''} onChange={handleInputChange} inputData={inputData} isTextarea={true} placeholder="e.g. {{message.text}}" />
                                </div>
                            </div>
                        )}

                        {node.data.type === 'wait' && (
                            <><div className="form-group"><label htmlFor="resumeCondition">Resume</label><div className="custom-select-wrapper"><select name="resumeCondition" id="resumeCondition" value={formData.resumeCondition} onChange={handleInputChange}><option value="afterTimeInterval">After Time Interval</option><option value="atSpecifiedTime">At Specified Time</option><option value="onWebhookCall">On Webhook Call</option><option value="onFormSubmitted">On Form Submitted</option></select></div></div>{formData.resumeCondition === 'afterTimeInterval' && (<><div className="form-group"><label htmlFor="waitAmount">Wait Amount</label><ExpressionInput name="waitAmount" value={formData.waitAmount} onChange={handleInputChange} inputData={inputData} /></div><div className="form-group"><label htmlFor="waitUnit">Wait Unit</label><div className="custom-select-wrapper"><select name="waitUnit" id="waitUnit" value={formData.waitUnit} onChange={handleInputChange}><option value="seconds">Seconds</option><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option></select></div></div></>)}</>
                        )}

                        {(node.data.type === 'if' || node.data.type === 'filter') && (
                            <div className="form-group mt-6">
                                <label>Conditions</label>
                                {formData.conditions.map((cond, index) => (<div key={index}>{node.data.type === 'if' && index > 0 && (<div className="combinator-row"><select name="combinator" value={formData.combinator} onChange={handleInputChange}><option value="AND">AND</option><option value="OR">OR</option></select></div>)}<div className="condition-row"><ExpressionInput name="value1" value={cond.value1} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="value1" /><div className="operator-select-wrapper"><select name="operator" value={cond.operator} onChange={(e) => handleInputChange(e, index)}><option value="is_equal_to">is equal to</option><option value="is_not_equal_to">is not equal to</option><option value="contains">contains</option><option value="greater_than">is greater than</option><option value="less_than">is less than</option></select></div><ExpressionInput name="value2" value={cond.value2} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="value2" /><button onClick={() => handleRemoveCondition(index)} className="remove-field-btn">&times;</button></div></div>))}
                                <button onClick={handleAddCondition} className="add-field-btn"><i className="fa-solid fa-plus mr-2"></i> Add condition</button>
                                {node.data.type === 'if' && <div className="form-group mt-6"><label>Options</label><div className="toggle-option"><label htmlFor="ignoreCase" className="toggle-label">Ignore Case</label><div className="toggle-switch"><input type="checkbox" name="ignoreCase" id="ignoreCase" checked={formData.ignoreCase} onChange={handleInputChange} /><span className="slider"></span></div></div></div>}
                            </div>
                        )}

                        {node.data.type === 'stopAndError' && (
                            <><div className="form-group"><label htmlFor="errorType">Error Type</label><div className="custom-select-wrapper"><select name="errorType" id="errorType" value={formData.errorType} onChange={handleInputChange}><option value="errorMessage">Error Message</option><option value="errorObject">Error Object</option></select></div></div>{formData.errorType === 'errorMessage' && (<div className="form-group"><label htmlFor="errorMessage">Error Message</label><ExpressionInput name="errorMessage" value={formData.errorMessage} onChange={handleInputChange} inputData={inputData} isTextarea={true} /></div>)}{formData.errorType === 'errorObject' && (<div className="empty-state"><p>Configuration for Error Object is not yet implemented.</p></div>)}</>
                        )}

                        {node.data.type === 'switch' && (
                            <div className="form-group mt-6">
                                <label>Routing Rules</label>
                                {formData.switchRules.map((rule, index) => (
                                    <div key={index} className="rule-box">
                                        <div className="rule-number">{index + 1}</div>
                                        <div className="rule-inputs">
                                            <ExpressionInput name="value1" value={rule.value1} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="value1" />
                                            <div className="operator-select-wrapper">
                                                <select name="operator" value={rule.operator} onChange={(e) => handleInputChange(e, index)}>
                                                    <option value="is_equal_to">is equal to</option>
                                                    <option value="is_not_equal_to">is not equal to</option>
                                                    <option value="contains">contains</option>
                                                    <option value="does_not_contain">does not contain</option>
                                                    <option value="starts_with">starts with</option>
                                                    <option value="ends_with">ends with</option>
                                                </select>
                                            </div>
                                            <ExpressionInput name="value2" value={rule.value2} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="value2" />
                                        </div>
                                        <div className="rule-actions">
                                            <button onClick={() => handleInsertSwitchRule(index)} className="rule-action-btn">+</button>
                                            <button onClick={() => handleRemoveSwitchRule(index)} className="remove-field-btn">&times;</button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleAddSwitchRule} className="add-field-btn"><i className="fa-solid fa-plus mr-2"></i> Add Routing Rule</button>
                                <div className="form-group mt-6"><label>Options</label><div className="toggle-option"><label htmlFor="fallbackOutput" className="toggle-label">Fallback Output</label><div className="toggle-switch"><input type="checkbox" id="fallbackOutput" checked={formData.switchOptions.includes('fallbackOutput')} onChange={() => handleOptionToggle('fallbackOutput')} /><span className="slider"></span></div></div><div className="toggle-option mt-2"><label htmlFor="ignoreCaseSwitch" className="toggle-label">Ignore Case</label><div className="toggle-switch"><input type="checkbox" id="ignoreCaseSwitch" checked={formData.switchOptions.includes('ignoreCase')} onChange={() => handleOptionToggle('ignoreCase')} /><span className="slider"></span></div></div></div>
                            </div>
                        )}

                        {node.data.type === 'telegramTrigger' && (
                            <div className="form-group mt-6">
                                <label htmlFor="botToken">Telegram Bot Token</label>
                                <div className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                                    <input
                                        type="password"
                                        name="botToken"
                                        id="botToken"
                                        value={formData.botToken}
                                        onChange={handleInputChange}
                                        placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        className="copy-btn"
                                        onClick={async () => {
                                            try {
                                                setTokenCheck({ status: 'checking', message: '' });
                                                // Always use production backend (as per deployment setup)
                                                const API_BASE = 'https://workflow-lg9z.onrender.com';
                                                const res = await fetch(`${API_BASE}/api/nodes/validate-telegram-token`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ token: formData.botToken })
                                                });
                                                const json = await res.json();
                                                if (res.ok && json.success) {
                                                    setTokenCheck({ status: 'valid', message: `@${json.bot?.username || 'bot'} (${json.bot?.first_name || ''})` });
                                                } else {
                                                    setTokenCheck({ status: 'invalid', message: json.error || 'Invalid token' });
                                                }
                                            } catch (e) {
                                                setTokenCheck({ status: 'invalid', message: e.message || 'Validation failed' });
                                            }
                                        }}
                                    >
                                        {tokenCheck.status === 'checking' ? 'Checking…' : 'Check Token'}
                                    </button>
                                </div>
                                {tokenCheck.status === 'valid' && (
                                    <p className="text-sm" style={{ color: '#16a34a', marginTop: '0.5rem' }}>✅ Valid token: {tokenCheck.message}</p>
                                )}
                                {tokenCheck.status === 'invalid' && (
                                    <p className="text-sm" style={{ color: '#dc2626', marginTop: '0.5rem' }}>❌ {tokenCheck.message}</p>
                                )}
                                <p className="text-sm text-gray-500 mt-2">Paste your bot token from BotFather and click Check to validate.</p>
                                
                                <div className="form-group mt-4">
                                    <button
                                        type="button"
                                        className="copy-btn w-full"
                                        onClick={async () => {
                                            if (!formData.botToken) {
                                                alert('Please enter a bot token first');
                                                return;
                                            }
                                            
                                            try {
                                                setTokenCheck({ status: 'checking', message: 'Fetching real messages...' });
                                                
                                                // Always use production backend
                                                const API_BASE = 'https://workflow-lg9z.onrender.com';
                                                const response = await fetch(`${API_BASE}/api/nodes/telegram-get-updates`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ 
                                                        token: formData.botToken,
                                                        limit: 5,  // Get last 5 messages
                                                        offset: -1 // Get recent messages
                                                    })
                                                });
                                                
                                                const result = await response.json();
                                                console.log('🔍 Telegram API Response:', { status: response.status, result });
                                                
                                                if (!response.ok) {
                                                    throw new Error(`HTTP ${response.status}: ${result.error || result.message || 'Unknown error'}`);
                                                }
                                                
                                                if (result.success && result.updates && result.updates.length > 0) {
                                                    // Use the most recent message
                                                    const latestUpdate = result.updates[result.updates.length - 1];
                                                    updateOutputData([latestUpdate]);
                                                    setTokenCheck({ status: 'valid', message: `✅ Fetched ${result.updates.length} real message(s)` });
                                                    
                                                } else if (result.success && result.updates && result.updates.length === 0) {
                                                    setTokenCheck({ status: 'invalid', message: '⚠️ No messages found. Send a message to your bot first.' });
                                                } else {
                                                    setTokenCheck({ status: 'invalid', message: result.error || 'Failed to fetch messages' });
                                                    console.error('❌ Failed to fetch messages:', result.error);
                                                }
                                            } catch (error) {
                                                setTokenCheck({ status: 'invalid', message: `Network error: ${error.message}` });
                                                console.error('❌ Error fetching real messages:', error);
                                            }
                                        }}
                                        style={{ backgroundColor: '#0088cc', color: 'white' }}
                                        disabled={!formData.botToken}
                                    >
                                        <i className="fa-solid fa-download mr-2"></i>
                                        {tokenCheck.status === 'checking' && tokenCheck.message.includes('Fetching') ? 'Fetching...' : 'Get Real Messages'}
                                    </button>
                                    <p className="text-sm text-gray-500 mt-2">Fetch real messages sent to your Telegram bot for testing downstream nodes.</p>
                                </div>
                            </div>
                        )}

                        {node.data.type === 'telegramSendMessage' && (
                            <div className="form-group mt-6">
                                <label>Telegram Send Message</label>
                                <div className="form-group">
                                    <label htmlFor="botToken">Bot Token</label>
                                    <div className="flex" style={{ gap: '0.5rem', alignItems: 'center' }}>
                                        <input type="password" name="botToken" id="botToken" value={formData.botToken} onChange={handleInputChange} placeholder="123456:ABC-..." style={{ flex: 1 }} />
                                        <button
                                            type="button"
                                            className="copy-btn"
                                            onClick={async () => {
                                                try {
                                                    setTokenCheck({ status: 'checking', message: '' });
                                                    const API_BASE = 'https://workflow-lg9z.onrender.com';
                                                    const res = await fetch(`${API_BASE}/api/nodes/validate-telegram-token`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ token: formData.botToken })
                                                    });
                                                    const json = await res.json();
                                                    if (res.ok && json.success) {
                                                        setTokenCheck({ status: 'valid', message: `@${json.bot?.username || 'bot'} (${json.bot?.first_name || ''})` });
                                                    } else {
                                                        setTokenCheck({ status: 'invalid', message: json.error || 'Invalid token' });
                                                    }
                                                } catch (e) {
                                                    setTokenCheck({ status: 'invalid', message: e.message || 'Validation failed' });
                                                }
                                            }}
                                        >
                                            {tokenCheck.status === 'checking' ? 'Checking…' : 'Check Token'}
                                        </button>
                                    </div>
                                    {tokenCheck.status === 'valid' && (
                                        <p className="text-sm" style={{ color: '#16a34a', marginTop: '0.5rem' }}>✅ Valid token: {tokenCheck.message}</p>
                                    )}
                                    {tokenCheck.status === 'invalid' && (
                                        <p className="text-sm" style={{ color: '#dc2626', marginTop: '0.5rem' }}>❌ {tokenCheck.message}</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label htmlFor="chatId">Chat ID</label>
                                    <ExpressionInput name="chatId" value={formData.chatId} onChange={handleInputChange} inputData={inputData} placeholder="123456789 or {{message.chat.id}}" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="messageType">Message Type</label>
                                    <div className="custom-select-wrapper">
                                        <select name="messageType" id="messageType" value={formData.messageType} onChange={handleInputChange}>
                                            <option value="text">Text</option>
                                            <option value="photo">Photo</option>
                                            <option value="video">Video</option>
                                            <option value="audio">Audio</option>
                                            <option value="voice">Voice</option>
                                            <option value="document">Document</option>
                                            <option value="animation">Animation</option>
                                            <option value="sticker">Sticker</option>
                                            <option value="location">Location</option>
                                            <option value="contact">Contact</option>
                                            <option value="poll">Poll</option>
                                            <option value="banUser">Ban User</option>
                                        </select>
                                    </div>
                                </div>

                                {formData.messageType === 'text' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="messageText">Message Text</label>
                                            <ExpressionInput name="messageText" value={formData.messageText} onChange={handleInputChange} inputData={inputData} isTextarea={true} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="parseMode">Parse Mode</label>
                                            <div className="custom-select-wrapper">
                                                <select name="parseMode" id="parseMode" value={formData.parseMode} onChange={handleInputChange}>
                                                    <option value="">None</option>
                                                    <option value="Markdown">Markdown</option>
                                                    <option value="MarkdownV2">MarkdownV2</option>
                                                    <option value="HTML">HTML</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="toggle-option">
                                            <label htmlFor="disableWebPagePreview" className="toggle-label">Disable Web Page Preview</label>
                                            <div className="toggle-switch">
                                                <input type="checkbox" name="disableWebPagePreview" id="disableWebPagePreview" checked={formData.disableWebPagePreview} onChange={handleInputChange} />
                                                <span className="slider"></span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {formData.messageType === 'photo' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="photoUrl">Photo URL or File ID</label>
                                            <ExpressionInput name="photoUrl" value={formData.photoUrl} onChange={handleInputChange} inputData={inputData} placeholder="https://... or file_id" />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="photoCaption">Photo Caption</label>
                                            <ExpressionInput name="photoCaption" value={formData.photoCaption} onChange={handleInputChange} inputData={inputData} />
                                        </div>
                                    </>
                                )}

                                {formData.messageType === 'video' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="videoUrl">Video URL or File ID</label>
                                            <ExpressionInput name="videoUrl" value={formData.videoUrl} onChange={handleInputChange} inputData={inputData} placeholder="https://... or file_id" />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="videoCaption">Video Caption</label>
                                            <ExpressionInput name="videoCaption" value={formData.videoCaption} onChange={handleInputChange} inputData={inputData} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="videoDuration">Video Duration (seconds)</label>
                                            <ExpressionInput name="videoDuration" value={formData.videoDuration} onChange={handleInputChange} inputData={inputData} />
                                        </div>
                                    </>
                                )}

                                {formData.messageType === 'audio' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="audioUrl">Audio URL or File ID</label>
                                            <ExpressionInput name="audioUrl" value={formData.audioUrl} onChange={handleInputChange} inputData={inputData} placeholder="https://... or file_id" />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="audioCaption">Audio Caption</label>
                                            <ExpressionInput name="audioCaption" value={formData.audioCaption} onChange={handleInputChange} inputData={inputData} />
                                        </div>
                                    </>
                                )}

                                {formData.messageType === 'voice' && (
                                    <div className="form-group">
                                        <label htmlFor="voiceUrl">Voice OGG URL or File ID</label>
                                        <ExpressionInput name="voiceUrl" value={formData.voiceUrl} onChange={handleInputChange} inputData={inputData} placeholder="https://... or file_id" />
                                    </div>
                                )}

                                {formData.messageType === 'document' && (
                                    <div className="form-group">
                                        <label htmlFor="documentUrl">Document URL or File ID</label>
                                        <ExpressionInput name="documentUrl" value={formData.documentUrl} onChange={handleInputChange} inputData={inputData} placeholder="https://... or file_id" />
                                    </div>
                                )}

                                {formData.messageType === 'animation' && (
                                    <div className="form-group">
                                        <label htmlFor="animationUrl">Animation/GIF URL or File ID</label>
                                        <ExpressionInput name="animationUrl" value={formData.animationUrl} onChange={handleInputChange} inputData={inputData} placeholder="https://... or file_id" />
                                    </div>
                                )}

                                {formData.messageType === 'sticker' && (
                                    <div className="form-group">
                                        <label htmlFor="stickerFileId">Sticker File ID</label>
                                        <ExpressionInput name="stickerFileId" value={formData.stickerFileId} onChange={handleInputChange} inputData={inputData} placeholder="file_id" />
                                    </div>
                                )}

                                {formData.messageType === 'location' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="latitude">Latitude</label>
                                            <ExpressionInput name="latitude" value={formData.latitude} onChange={handleInputChange} inputData={inputData} placeholder="e.g. 37.7749" />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="longitude">Longitude</label>
                                            <ExpressionInput name="longitude" value={formData.longitude} onChange={handleInputChange} inputData={inputData} placeholder="e.g. -122.4194" />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="locationHorizontalAccuracy">Horizontal Accuracy (meters)</label>
                                            <ExpressionInput name="locationHorizontalAccuracy" value={formData.locationHorizontalAccuracy} onChange={handleInputChange} inputData={inputData} placeholder="Optional" />
                                        </div>
                                    </>
                                )}

                                {formData.messageType === 'contact' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="contactPhoneNumber">Phone Number</label>
                                            <ExpressionInput name="contactPhoneNumber" value={formData.contactPhoneNumber} onChange={handleInputChange} inputData={inputData} placeholder="+1234567890" />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="contactFirstName">First Name</label>
                                            <ExpressionInput name="contactFirstName" value={formData.contactFirstName} onChange={handleInputChange} inputData={inputData} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="contactLastName">Last Name</label>
                                            <ExpressionInput name="contactLastName" value={formData.contactLastName} onChange={handleInputChange} inputData={inputData} />
                                        </div>
                                    </>
                                )}

                                {formData.messageType === 'poll' && (
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="pollQuestion">Question</label>
                                            <ExpressionInput name="pollQuestion" value={formData.pollQuestion} onChange={handleInputChange} inputData={inputData} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="pollOptions">Options</label>
                                            <ExpressionInput name="pollOptions" value={formData.pollOptions} onChange={handleInputChange} inputData={inputData} placeholder='["Option 1","Option 2"] or Option 1, Option 2' />
                                        </div>
                                    </>
                                )}

                                {formData.messageType === 'banUser' && (
                                    <div className="form-group">
                                        <label htmlFor="banUserId">User ID to Ban</label>
                                        <ExpressionInput name="banUserId" value={formData.banUserId} onChange={handleInputChange} inputData={inputData} placeholder="User ID" />
                                    </div>
                                )}
                            </div>
                        )}

                        {node.data.type === 'executeSubWorkflow' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="source">Source</label>
                                    <div className="custom-select-wrapper">
                                        <select name="source" id="source" value={formData.source} onChange={handleInputChange}>
                                            <option value="database">Database</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="workflow">Workflow</label>
                                    <div className="flex gap-2">
                                        <div className="custom-select-wrapper flex-shrink-0">
                                            <select name="workflow" id="workflow" value={formData.workflow} onChange={handleInputChange}>
                                                <option value="fromList">From List</option>
                                            </select>
                                        </div>
                                        <div className="custom-select-wrapper flex-grow">
                                            <select name="workflowId" id="workflowId" value={formData.workflowId} onChange={handleInputChange}>
                                                <option value="">Choose...</option>
                                                <option value="wf_123">Customer Onboarding</option>
                                                <option value="wf_456">Daily Report Generation</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="mode">Mode</label>
                                    <div className="custom-select-wrapper">
                                        <select name="mode" id="mode" value={formData.mode} onChange={handleInputChange}>
                                            <option value="runOnce">Run once with all items</option>
                                            <option value="runForEach">Run for each item</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {node.data.type === 'merge' && (
                            <div className="form-group">
                                <label htmlFor="mergeMode">Mode</label>
                                <div className="custom-select-wrapper">
                                    <select name="mergeMode" id="mergeMode" value={formData.mergeMode} onChange={handleInputChange}>
                                        <option value="append">Append</option>
                                        <option value="mergeByKey">Merge By Key</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {node.data.type === 'loop' && (
                            <div className="form-group">
                                <label htmlFor="batchSize">Batch Size</label>
                                <ExpressionInput name="batchSize" value={formData.batchSize} onChange={handleInputChange} inputData={inputData} />
                            </div>
                        )}

                        {node.data.type === 'setData' && (
                            <div className="form-group mt-6">
                                <label>Data Fields</label>
                                <p className="text-sm text-gray-500 mb-4">Define the key-value pairs for the data you want to create.</p>
                                {formData.fields.map((field, index) => (
                                    <div key={index} className="key-value-row">
                                        <ExpressionInput name="key" value={field.key} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="Key" />
                                        <ExpressionInput name="value" value={field.value} onChange={(e) => handleInputChange(e, index)} inputData={inputData} placeholder="Value" />
                                        <button onClick={() => handleRemoveDataField(index)} className="remove-field-btn">&times;</button>
                                    </div>
                                ))}
                                <button onClick={handleAddDataField} className="add-field-btn"><i className="fa-solid fa-plus mr-2"></i> Add Field</button>
                            </div>
                        )}

                        {node.data.type === 'chatTrigger' && (
                            <div className="form-group mt-6">
                                <label>Webhook Configuration</label>
                                <div className="form-group">
                                    <label htmlFor="workflowId">Workflow ID</label>
                                    <input 
                                        type="text" 
                                        name="workflowId" 
                                        id="workflowId" 
                                        value={formData.workflowId} 
                                        readOnly 
                                        className="readonly-input"
                                        style={{ backgroundColor: '#f0f7ff', color: '#2563eb', fontWeight: '500', border: '2px solid #bfdbfe' }}
                                        placeholder="Auto-generated workflow ID"
                                    />
                                    <p className="text-sm text-green-600 mt-2">✅ Automatically generated unique ID for your webhook</p>
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="webhookUrl">🔗 Ready-to-Use Webhook URL</label>
                                    <div className="webhook-url-container">
                                        <input 
                                            type="text" 
                                            value={formData.workflowId ? `${process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://workflow-lg9z.onrender.com'}/api/chat/webhook/${formData.workflowId}` : 'Generating webhook URL...'} 
                                            readOnly 
                                            className="webhook-url-input"
                                            style={{ 
                                                backgroundColor: '#f0fdf4', 
                                                color: '#15803d', 
                                                fontFamily: 'monospace',
                                                fontSize: '13px',
                                                border: '2px solid #bbf7d0',
                                                padding: '12px'
                                            }}
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const url = `https://workflow-lg9z.onrender.com/api/chat/webhook/${formData.workflowId}`;
                                                navigator.clipboard.writeText(url).then(() => {
                                                    // Optional: show success feedback
                                                    const btn = document.querySelector('.copy-btn');
                                                    const originalText = btn.innerHTML;
                                                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                                                    btn.style.backgroundColor = '#16a34a';
                                                    setTimeout(() => {
                                                        btn.innerHTML = originalText;
                                                        btn.style.backgroundColor = '#2563eb';
                                                    }, 2000);
                                                });
                                            }}
                                            className="copy-btn"
                                            disabled={!formData.workflowId}
                                            style={{
                                                backgroundColor: '#2563eb',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 16px',
                                                borderRadius: '8px',
                                                fontWeight: '600'
                                            }}
                                        >
                                            <i className="fa-solid fa-copy"></i> Copy URL
                                        </button>
                                    </div>
                                    <p className="text-sm text-blue-600 mt-2">📋 <strong>Ready to use:</strong> Copy this complete URL and paste it directly into your website's chat widget configuration. No modifications needed!</p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="filterKeywords">Filter Keywords (Optional)</label>
                                    <ExpressionInput name="filterKeywords" value={formData.filterKeywords.join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, filterKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k) }))} inputData={inputData} placeholder="support, help, question" />
                                    <p className="text-sm text-gray-500 mt-2">Only trigger workflow for messages containing these keywords</p>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="allowedDomains">Allowed Domains (Optional)</label>
                                    <ExpressionInput name="allowedDomains" value={formData.allowedDomains.join(', ')} onChange={(e) => setFormData(prev => ({ ...prev, allowedDomains: e.target.value.split(',').map(d => d.trim()).filter(d => d) }))} inputData={inputData} placeholder="yoursite.com, app.yoursite.com" />
                                    <p className="text-sm text-gray-500 mt-2">Only allow messages from these domains</p>
                                </div>

                                <div className="form-group">
                                    <label>Options</label>
                                    <div className="toggle-option">
                                        <label htmlFor="requireUserInfo" className="toggle-label">Require User Info</label>
                                        <div className="toggle-switch">
                                            <input type="checkbox" name="requireUserInfo" id="requireUserInfo" checked={formData.requireUserInfo} onChange={handleInputChange} />
                                            <span className="slider"></span>
                                        </div>
                                    </div>
                                    <div className="toggle-option mt-2">
                                        <label htmlFor="autoRespond" className="toggle-label">Auto Respond</label>
                                        <div className="toggle-switch">
                                            <input type="checkbox" name="autoRespond" id="autoRespond" checked={formData.autoRespond} onChange={handleInputChange} />
                                            <span className="slider"></span>
                                        </div>
                                    </div>
                                </div>

                                {formData.autoRespond && (
                                    <div className="form-group">
                                        <label htmlFor="autoResponseMessage">Auto Response Message</label>
                                        <ExpressionInput name="autoResponseMessage" value={formData.autoResponseMessage} onChange={handleInputChange} inputData={inputData} isTextarea={true} />
                                        <p className="text-sm text-gray-500 mt-2">Message to send automatically when triggered</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'settings' && (
                    <div className="parameters-content">
                      <div className="form-group"><label htmlFor="label">Label</label><input type="text" name="label" id="label" value={formData.label} onChange={handleInputChange} placeholder="Enter a custom node label"/></div>
                      <div className="form-group"><label htmlFor="description">Description</label><textarea name="description" id="description" rows="4" value={formData.description} onChange={handleInputChange} placeholder="Add custom notes or a description for this node..."></textarea></div>
                    </div>
                )}
            </div>
        </div>
        <div className="side-panel" onClick={(e) => e.stopPropagation()}>
            <div className="panel-header">
                <span>OUTPUT</span>
                <button className="side-panel-btn" onClick={handlePostData}>POST</button>
            </div>
            <div className="panel-content-area data-panel">
                {isLoading ? (<div className="empty-state">Loading...</div>) : outputData ? (<pre><code className={outputData.error ? 'error-json' : ''}>{JSON.stringify(outputData, null, 2)}</code></pre>) : (<div className="empty-state"><i className="fa-solid fa-play text-4xl mb-4"></i><h4 className="font-bold">Execute this node to view data</h4><button className="mock-data-btn">or set mock data</button></div>)}
            </div>
        </div>
    </div>
  );
};

export default ConfigPanel;
