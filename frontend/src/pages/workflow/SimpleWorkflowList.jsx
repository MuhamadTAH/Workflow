import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaCog, FaPlay, FaEye } from 'react-icons/fa';
import './styles/WorkflowBuilder.css';

function SimpleWorkflowList() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const response = await fetch('https://workflow-lg9z.onrender.com/api/workflows-simple');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Error loading workflows:', error);
      setError('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const createNewWorkflow = async () => {
    try {
      const response = await fetch('https://workflow-lg9z.onrender.com/api/workflows-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New Workflow' })
      });
      const newWorkflow = await response.json();
      setWorkflows([newWorkflow, ...workflows]);
      
      // Navigate to workflow builder page
      navigate(`/workflow-builder/${newWorkflow.id}`);
    } catch (error) {
      console.error('Error creating workflow:', error);
      setError('Failed to create workflow');
    }
  };

  if (loading) {
    return (
      <div className="workflow-list-page">
        <div className="loading">Loading workflows...</div>
      </div>
    );
  }

  return (
    <div className="workflow-list-page">
      <div className="workflow-list-header">
        <h1>Workflows</h1>
        <button 
          className="btn-create-workflow"
          onClick={createNewWorkflow}
        >
          <FaPlus /> Create Workflow
        </button>
      </div>

      {error && (
        <div className="error-message" style={{ 
          color: '#e53e3e', 
          background: '#fed7d7', 
          padding: '1rem', 
          borderRadius: '8px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}

      <div className="workflow-list-container">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="workflow-card">
            <div className="workflow-name">{workflow.name}</div>
            <div className="workflow-description">{workflow.description}</div>
            
            <div className="workflow-meta">
              <span className="workflow-nodes">{workflow.nodes} nodes</span>
              <span className={`workflow-status status-${workflow.status}`}>
                {workflow.status}
              </span>
            </div>

            <div className="workflow-card-actions">
              <Link 
                to={`/workflow-builder/${workflow.id}`} 
                className="btn-edit-workflow"
              >
                <FaCog /> Edit
              </Link>
            </div>
          </div>
        ))}
      </div>

      {workflows.length === 0 && !loading && (
        <div className="no-workflows" style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#666'
        }}>
          <h3>No workflows yet</h3>
          <p>Create your first workflow to get started!</p>
          <button 
            className="btn-create-workflow"
            onClick={createNewWorkflow}
          >
            <FaPlus /> Create Your First Workflow
          </button>
        </div>
      )}
    </div>
  );
}

export default SimpleWorkflowList;