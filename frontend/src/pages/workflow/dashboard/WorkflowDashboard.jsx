import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaPlay, FaPause, FaEdit, FaCopy, FaTrash, FaSearch } from 'react-icons/fa';
import './WorkflowDashboard.css';

const WorkflowDashboard = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock data for now
  const mockWorkflows = [
    {
      id: 1,
      name: 'Customer Email Automation',
      description: 'Send welcome emails to new customers',
      status: 'active',
      lastRun: '2025-01-15 10:30 AM',
      executions: 145,
      successRate: 98.5
    },
    {
      id: 2,
      name: 'Order Processing Workflow',
      description: 'Automate order confirmation and tracking',
      status: 'inactive',
      lastRun: '2025-01-14 3:15 PM',
      executions: 89,
      successRate: 95.2
    },
    {
      id: 3,
      name: 'Inventory Alert System',
      description: 'Alert when product stock is low',
      status: 'active',
      lastRun: '2025-01-15 2:45 PM',
      executions: 67,
      successRate: 100
    }
  ];

  useEffect(() => {
    setWorkflows(mockWorkflows);
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

  const handleToggleStatus = (id) => {
    setWorkflows(workflows.map(workflow => 
      workflow.id === id 
        ? { ...workflow, status: workflow.status === 'active' ? 'inactive' : 'active' }
        : workflow
    ));
  };

  const handleDuplicateWorkflow = (id) => {
    const workflowToDuplicate = workflows.find(w => w.id === id);
    const newWorkflow = {
      ...workflowToDuplicate,
      id: Date.now(),
      name: `${workflowToDuplicate.name} (Copy)`,
      status: 'inactive',
      executions: 0,
      lastRun: 'Never'
    };
    setWorkflows([...workflows, newWorkflow]);
  };

  const handleDeleteWorkflow = (id) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      setWorkflows(workflows.filter(w => w.id !== id));
    }
  };

  return (
    <div className="workflow-dashboard">
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