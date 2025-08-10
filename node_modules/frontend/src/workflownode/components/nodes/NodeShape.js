/*
=================================================================
FILE: NodeShape.js - MASTER NODE SHAPE CONTROLLER
=================================================================
🎯 MASTER FILE: Edit this file to change ALL node shapes in the project
When you modify this file, ALL nodes in the main project will update their shape

This file contains the pure visual structure and layout of nodes.
*/

import React from 'react';
import { Handle, Position } from 'reactflow';

const NodeShape = ({ data = {}, nodeHeight, totalInputHandles, totalOutputHandles }) => {
  
  // Determine node type for specific styling
  const isIfNode = data.type === 'if';
  const isLoopNode = data.type === 'loop';
  const isCompareNode = data.type === 'compare';
  const isSwitchNode = data.type === 'switch';
  const hasNoOutputs = data.type === 'stopAndError';
  const isMergeNode = data.type === 'merge';

  // Map icons to Unicode symbols as fallback
  const getIconSymbol = (icon) => {
    const iconMap = {
      'fa-telegram': '✈️',
      'fa-whatsapp': '💬',
      'fa-instagram': '📷',
      'fa-linkedin': '💼',
      'fa-tiktok': '🎵',
      'fa-facebook': '👤',
      'fa-twitter': '🐦',
      'fa-youtube': '📺',
      'fa-robot': '🤖',
      'fa-brain': '🧠',
      'fa-database': '🗄️',
      'fa-file-text': '📄',
      'fa-file-export': '📤',
      'fa-sitemap': '🔀',
      'fa-random': '🔄',
      'fa-filter': '🔍',
      'fa-share-alt': '🔗',
      'fa-edit': '✏️',
      'fa-sync-alt': '🔄',
      'fa-clock': '⏰',
      'fa-exclamation-triangle': '⚠️',
      'fa-plus-square': '➕',
      'fa-arrow-right': '→',
      'fa-comments': '💬'
    };
    return iconMap[icon] || '⚙️';
  };

  // Determine correct FontAwesome prefix and fix icon mappings
  const getIconClass = (icon) => {
    if (!icon) return '';
    
    // Complete mapping for all node icons from the sidebar
    const iconMapping = {
      // Trigger nodes
      'fa-telegram': 'fa-solid fa-paper-plane',           // Telegram trigger/send
      
      // AI nodes  
      'fa-robot': 'fa-solid fa-robot',                    // AI Agent
      'fa-brain': 'fa-solid fa-brain',                    // Model Node
      
      // Social Media nodes (brand icons)
      'fa-whatsapp': 'fa-brands fa-whatsapp',             // WhatsApp
      'fa-instagram': 'fa-brands fa-instagram',           // Instagram
      'fa-linkedin': 'fa-brands fa-linkedin',             // LinkedIn
      'fa-tiktok': 'fa-brands fa-tiktok',                 // TikTok
      'fa-facebook': 'fa-brands fa-facebook',             // Facebook
      'fa-twitter': 'fa-brands fa-twitter',               // Twitter
      'fa-youtube': 'fa-brands fa-youtube',               // YouTube
      
      // Utility nodes
      'fa-file-text': 'fa-solid fa-file-alt',            // Google Docs
      'fa-database': 'fa-solid fa-database',             // Data Storage
      'fa-file-export': 'fa-solid fa-file-export',       // File Converter
      
      // Logic nodes
      'fa-sitemap': 'fa-solid fa-sitemap',               // If node
      'fa-random': 'fa-solid fa-random',                 // Switch node  
      'fa-filter': 'fa-solid fa-filter',                 // Filter
      'fa-share-alt': 'fa-solid fa-share-alt',           // Merge
      'fa-edit': 'fa-solid fa-edit',                     // Set Data
      'fa-sync-alt': 'fa-solid fa-sync-alt',             // Loop Over Items
      'fa-clock': 'fa-solid fa-clock',                   // Wait
      'fa-exclamation-triangle': 'fa-solid fa-exclamation-triangle', // Stop and Error
      'fa-plus-square': 'fa-solid fa-plus-square',       // Compare Datasets
      'fa-arrow-right': 'fa-solid fa-arrow-right',       // Execute Workflow
      
      // Other common icons
      'fa-discord': 'fa-brands fa-discord',
      'fa-slack': 'fa-brands fa-slack',
      'fa-github': 'fa-brands fa-github',
      
      // Chat Trigger
      'fa-comments': 'fa-solid fa-comments'

    };
    
    // Return mapped class or default to solid
    return iconMapping[icon] || `fa-solid ${icon}`;
  };

  // Handle positioning calculations
  const getInputHandleStyle = (index, total) => {
    if (total === 1) return { top: '50%' };
    const spacing = 100 / (total + 1);
    return { top: `${spacing * (index + 1)}%` };
  };

  const getOutputHandleStyle = (index, total) => {
    if (total === 1) return { top: '50%' };
    const spacing = 100 / (total + 1);
    return { top: `${spacing * (index + 1)}%` };
  };

  // Generate input handles
  const renderInputHandles = () => {
    const handles = [];
    for (let i = 0; i < totalInputHandles; i++) {
      handles.push(
        <Handle
          key={`input-${i}`}
          type="target"
          position={Position.Left}
          id={`input-${i}`}
          style={getInputHandleStyle(i, totalInputHandles)}
          className="handle-input"
        />
      );
    }
    return handles;
  };

  // Generate output handles with labels
  const renderOutputHandles = () => {
    if (hasNoOutputs) return null;

    const handles = [];
    
    if (isIfNode) {
      // If node: True/False outputs
      handles.push(
        <Handle key="output-true" type="source" position={Position.Right} 
                id="output-true" style={getOutputHandleStyle(0, 2)} 
                className="handle-true" />,
        <Handle key="output-false" type="source" position={Position.Right} 
                id="output-false" style={getOutputHandleStyle(1, 2)} 
                className="handle-false" />
      );
    } else if (isLoopNode) {
      // Loop node: Loop/Done outputs
      handles.push(
        <Handle key="output-loop" type="source" position={Position.Right} 
                id="output-loop" style={getOutputHandleStyle(0, 2)} 
                className="handle-loop" />,
        <Handle key="output-done" type="source" position={Position.Right} 
                id="output-done" style={getOutputHandleStyle(1, 2)} 
                className="handle-done" />
      );
    } else if (isCompareNode) {
      // Compare node: Added/Removed/Changed outputs
      handles.push(
        <Handle key="output-added" type="source" position={Position.Right} 
                id="output-added" style={getOutputHandleStyle(0, 3)} 
                className="handle-true" />,
        <Handle key="output-removed" type="source" position={Position.Right} 
                id="output-removed" style={getOutputHandleStyle(1, 3)} 
                className="handle-false" />,
        <Handle key="output-changed" type="source" position={Position.Right} 
                id="output-changed" style={getOutputHandleStyle(2, 3)} 
                className="handle-loop" />
      );
    } else if (isSwitchNode) {
      // Switch node: Dynamic outputs based on rules
      const rulesCount = data.switchRules?.length || 1;
      const hasFallback = data.switchOptions?.includes('fallbackOutput');
      
      for (let i = 0; i < rulesCount; i++) {
        handles.push(
          <Handle key={`output-rule-${i}`} type="source" position={Position.Right} 
                  id={`output-rule-${i}`} style={getOutputHandleStyle(i, totalOutputHandles)} 
                  className="handle-true" />
        );
      }
      
      if (hasFallback) {
        handles.push(
          <Handle key="output-fallback" type="source" position={Position.Right} 
                  id="output-fallback" style={getOutputHandleStyle(rulesCount, totalOutputHandles)} 
                  className="handle-false" />
        );
      }
    } else {
      // Standard single output (plus icon handled by CSS)
      handles.push(
        <Handle key="output-main" type="source" position={Position.Right} 
                id="output-main" style={{ top: '50%' }} 
                className="handle-main" />
      );
    }
    
    return handles;
  };

  return (
    <div 
      className="custom-node-ai" 
      style={{ 
        height: `${nodeHeight}px`,
        minHeight: '80px'
      }}
    >
      {/* INPUT HANDLES */}
      {renderInputHandles()}

      {/* NODE CONTENT */}
      <div className="node-content">
        <div className="node-header">
          <div className={`node-icon ${data.color || 'text-gray-600'}`}>
            {data.icon ? (
              <i className={getIconClass(data.icon)} title={`FontAwesome: ${data.icon}`} />
            ) : (
              <span title={`Emoji fallback: ${data.icon}`}>{getIconSymbol(data.icon)}</span>
            )}
          </div>
          <div className="node-label">{data.label || data.type || 'Node'}</div>
        </div>
        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
        {data.status && (
          <div className="node-status">{data.status}</div>
        )}
      </div>

      {/* OUTPUT HANDLES */}
      {renderOutputHandles()}

      {/* HANDLE LABELS */}
      {isIfNode && (
        <>
          <div className="handle-label handle-label-right handle-label-true" 
               style={getOutputHandleStyle(0, 2)}>True</div>
          <div className="handle-label handle-label-right handle-label-false" 
               style={getOutputHandleStyle(1, 2)}>False</div>
        </>
      )}
      
      {isLoopNode && (
        <>
          <div className="handle-label handle-label-right handle-label-loop" 
               style={getOutputHandleStyle(0, 2)}>Loop</div>
          <div className="handle-label handle-label-right handle-label-done" 
               style={getOutputHandleStyle(1, 2)}>Done</div>
        </>
      )}
    </div>
  );
};



export default NodeShape;
