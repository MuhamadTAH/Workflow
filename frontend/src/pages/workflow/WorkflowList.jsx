// Workflow list page component
// Shows all user's workflows in a list/grid view
// Allows creating new workflows, editing, deleting, and running existing ones
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { workflowAPI } from './services/workflowAPI';
import './styles/WorkflowBuilder.css';

const WorkflowList = () => {
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch workflows from the backend when the component mounts
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await workflowAPI.getAllWorkflows();
        setWorkflows(response.data);
      } catch (err) {
        setError('Failed to fetch workflows. Please try again later.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  // Handle the creation of a new workflow
  const handleCreateWorkflow = async () => {
    try {
      // Determine the new workflow's name
      const newName = `Workflow - ${workflows.length + 1}`;
      const response = await workflowAPI.createWorkflow(newName);
      
      // Redirect to the builder page for the new workflow
      if (response.data && response.data.id) {
        navigate(`/workflow/builder/${response.data.id}`);
      }
    } catch (err) {
      setError('Failed to create a new workflow.');
      console.error(err);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="loading-message">Loading workflows...</div>;
    }

    if (error) {
      return <div className="error-message">{error}</div>;
    }

    if (workflows.length === 0) {
      return (
        <div className="empty-state">
          <h3>No Workflows Found</h3>
          <p>Get started by creating your first automation.</p>
          <button onClick={handleCreateWorkflow} className="btn-create-workflow">
            <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
            Create Your First Workflow
          </button>
        </div>
      );
    }

    return (
      <div className="workflow-list-container">
        {workflows.map(wf => (
          <div key={wf.id} className="workflow-card">
            <div className="workflow-card-info">
              <h3 className="workflow-name">{wf.name}</h3>
              <span className={`workflow-status ${wf.is_active ? 'status-active' : 'status-inactive'}`}>
                {wf.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="workflow-card-actions">
              <Link to={`/workflow/builder/${wf.id}`} className="btn-edit-workflow">
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="workflow-list-page">
      <header className="workflow-list-header">
        <h1>My Workflows</h1>
        {workflows.length > 0 && (
          <button onClick={handleCreateWorkflow} className="btn-create-workflow">
            <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
            Create New Workflow
          </button>
        )}
      </header>
      {renderContent()}
    </div>
  );
};

export default WorkflowList;

