import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaPlus } from 'react-icons/fa';
import './styles/WorkflowBuilder.css';

function SimpleWorkflowBuilder() {
  const { id } = useParams();
  const [workflowName, setWorkflowName] = useState('My Workflow');
  const [nodes, setNodes] = useState([]);
  const [saving, setSaving] = useState(false);

  const addNode = (type) => {
    const newNode = {
      id: Date.now(),
      type: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      x: Math.random() * 400,
      y: Math.random() * 300
    };
    setNodes([...nodes, newNode]);
  };

  const removeNode = (nodeId) => {
    setNodes(nodes.filter(node => node.id !== nodeId));
  };

  const saveWorkflow = async () => {
    setSaving(true);
    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Workflow saved successfully!');
    } catch (error) {
      alert('Error saving workflow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workflow-builder-layout">
      {/* Toolbar */}
      <div className="workflow-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/workflows" className="btn-toolbar-action">
            <FaArrowLeft /> Back
          </Link>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="workflow-title-input"
            placeholder="Workflow name"
          />
        </div>
        
        <div className="workflow-actions">
          <button 
            className="btn-toolbar-action"
            onClick={saveWorkflow}
            disabled={saving}
          >
            <FaSave /> {saving ? 'Saving...' : 'Save'}
          </button>
          <button className="btn-toolbar-run">
            ▶ Run
          </button>
        </div>
      </div>

      <div className="workflow-builder-main">
        {/* Node Palette */}
        <div className="node-palette">
          <h2>Workflow Nodes</h2>
          <div className="node-list">
            <div 
              className="node-item"
              onClick={() => addNode('trigger')}
            >
              <i className="fas fa-play"></i>
              <span>Trigger</span>
            </div>
            <div 
              className="node-item"
              onClick={() => addNode('action')}
            >
              <i className="fas fa-cog"></i>
              <span>Action</span>
            </div>
            <div 
              className="node-item"
              onClick={() => addNode('condition')}
            >
              <i className="fas fa-question"></i>
              <span>Condition</span>
            </div>
            <div 
              className="node-item"
              onClick={() => addNode('webhook')}
            >
              <i className="fas fa-link"></i>
              <span>Webhook</span>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="workflow-canvas" style={{ 
          background: '#f8fafc',
          position: 'relative',
          minHeight: '500px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ padding: '2rem' }}>
            <h3>Workflow Canvas</h3>
            <p>Click on nodes in the palette to add them to your workflow.</p>
            
            {nodes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#666',
                background: '#fff',
                border: '2px dashed #e2e8f0',
                borderRadius: '8px',
                marginTop: '2rem'
              }}>
                <FaPlus size={48} style={{ color: '#cbd5e0', marginBottom: '1rem' }} />
                <p>No nodes yet. Add nodes from the palette on the left.</p>
              </div>
            ) : (
              <div style={{ marginTop: '2rem' }}>
                <h4>Workflow Nodes ({nodes.length})</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  {nodes.map((node) => (
                    <div 
                      key={node.id}
                      style={{
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <strong>{node.label}</strong>
                        <button 
                          onClick={() => removeNode(node.id)}
                          style={{
                            background: '#e53e3e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '0.25rem 0.5rem',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                        Type: {node.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimpleWorkflowBuilder;