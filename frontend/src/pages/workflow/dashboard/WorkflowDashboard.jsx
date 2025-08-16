import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaPlay, FaPause, FaEdit, FaCopy, FaTrash, FaSearch, FaSpinner } from 'react-icons/fa';
import { workflowAPI } from '../../../api';
import './WorkflowDashboard.css';

const WorkflowDashboard = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch workflows from API
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await workflowAPI.getWorkflows();
        
        if (response.data.success) {
          // Transform API data to match our component structure
          const transformedWorkflows = response.data.workflows.map(workflow => ({
            id: workflow.id,
            name: workflow.name || 'Untitled Workflow',
            description: workflow.description || 'No description',
            status: workflow.status || 'inactive',
            lastRun: workflow.last_executed_at ? new Date(workflow.last_executed_at).toLocaleString() : 'Never',
            executions: workflow.execution_count || 0,
            successRate: workflow.success_rate || 0
          }));
          
          setWorkflows(transformedWorkflows);
        } else {
          setError('Failed to fetch workflows');
        }
      } catch (error) {
        console.error('Error fetching workflows:', error);
        setError('Error connecting to server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || workflow.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    inactive: workflows.filter(w => w.status === 'inactive').length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.executions, 0)
  };

  const handleCreateWorkflow = () => {
    navigate('/workflow/builder');
  };

  const handleEditWorkflow = (id) => {
    navigate(`/workflow/builder/${id}`);
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await workflowAPI.toggleStatus(id);
      if (response.data.success) {
        // Update the workflow in the list
        setWorkflows(workflows.map(workflow => 
          workflow.id === id 
            ? { ...workflow, status: response.data.workflow.status }
            : workflow
        ));
      } else {
        setError('Failed to toggle workflow status');
      }
    } catch (error) {
      console.error('Error toggling workflow status:', error);
      setError('Error updating workflow status');
    }
  };

  const handleDuplicateWorkflow = async (id) => {
    try {
      const response = await workflowAPI.duplicateWorkflow(id);
      if (response.data.success) {
        // Transform and add the duplicated workflow to the list
        const newWorkflow = {
          id: response.data.workflow.id,
          name: response.data.workflow.name,
          description: response.data.workflow.description || 'No description',
          status: response.data.workflow.status || 'inactive',
          lastRun: 'Never',
          executions: 0,
          successRate: 0
        };
        setWorkflows([...workflows, newWorkflow]);
      } else {
        setError('Failed to duplicate workflow');
      }
    } catch (error) {
      console.error('Error duplicating workflow:', error);
      setError('Error duplicating workflow');
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        const response = await workflowAPI.deleteWorkflow(id);
        if (response.data.success) {
          setWorkflows(workflows.filter(w => w.id !== id));
        } else {
          setError('Failed to delete workflow');
        }
      } catch (error) {
        console.error('Error deleting workflow:', error);
        setError('Error deleting workflow');
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="workflow-dashboard">
        <div className="loading-state">
          <FaSpinner className="loading-spinner" />
          <h3>Loading workflows...</h3>
          <p>Please wait while we fetch your workflows</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-dashboard">
      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Workflow Dashboard</h1>
          <p>Manage and monitor your automated workflows</p>
        </div>
        <button className="create-btn" onClick={handleCreateWorkflow}>
          <FaPlus /> Create Workflow
        </button>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Workflows</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inactive}</div>
          <div className="stat-label">Inactive</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalExecutions}</div>
          <div className="stat-label">Total Executions</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="status-filter"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Workflows Grid */}
      <div className="workflows-grid">
        {filteredWorkflows.map(workflow => (
          <div key={workflow.id} className="workflow-card">
            <div className="workflow-header">
              <div className="workflow-info">
                <h3 className="workflow-name">{workflow.name}</h3>
                <p className="workflow-description">{workflow.description}</p>
              </div>
              <div className={`status-badge ${workflow.status}`}>
                {workflow.status === 'active' ? <FaPlay /> : <FaPause />}
                {workflow.status}
              </div>
            </div>

            <div className="workflow-stats">
              <div className="stat-item">
                <span className="stat-label">Last Run:</span>
                <span className="stat-value">{workflow.lastRun}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Executions:</span>
                <span className="stat-value">{workflow.executions}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Success Rate:</span>
                <span className="stat-value">{workflow.successRate}%</span>
              </div>
            </div>

            <div className="workflow-actions">
              <button 
                className="action-btn edit"
                onClick={() => handleEditWorkflow(workflow.id)}
                title="Edit Workflow"
              >
                <FaEdit />
              </button>
              <button 
                className="action-btn copy"
                onClick={() => handleDuplicateWorkflow(workflow.id)}
                title="Duplicate Workflow"
              >
                <FaCopy />
              </button>
              <button 
                className={`action-btn toggle ${workflow.status}`}
                onClick={() => handleToggleStatus(workflow.id)}
                title={workflow.status === 'active' ? 'Deactivate' : 'Activate'}
              >
                {workflow.status === 'active' ? <FaPause /> : <FaPlay />}
              </button>
              <button 
                className="action-btn delete"
                onClick={() => handleDeleteWorkflow(workflow.id)}
                title="Delete Workflow"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="empty-state">
          <h3>No workflows found</h3>
          <p>Create your first workflow to get started</p>
          <button className="create-btn" onClick={handleCreateWorkflow}>
            <FaPlus /> Create Workflow
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowDashboard;