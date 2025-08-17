import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/WorkflowsOverview.css';

const WorkflowsOverview = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);

  // Load workflow data from localStorage
  useEffect(() => {
    setTimeout(() => {
      const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
      const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
      const workflowExecutions = JSON.parse(localStorage.getItem('workflowExecutions') || '{}');
      
      const workflowsWithStatus = savedWorkflows.map(workflow => {
        const status = workflowStatuses[workflow.id] || 'inactive';
        const executions = workflowExecutions[workflow.id];
        
        // Calculate last modified time
        const lastModified = workflow.updatedAt ? 
          new Date(workflow.updatedAt).toLocaleDateString() : 
          new Date(workflow.createdAt).toLocaleDateString();
        
        return {
          ...workflow,
          status,
          lastModified,
          executions: executions?.runCount || 0,
          nodes: workflow.nodes?.length || 0
        };
      });
      
      setWorkflows(workflowsWithStatus);
      setIsLoading(false);
    }, 500); // Reduced loading time
  }, []);

  const handleNewWorkflow = () => {
    navigate('/workflow');
  };

  const handleEditWorkflow = (workflowId) => {
    navigate(`/workflow?load=${workflowId}`);
  };

  // Dropdown handlers
  const toggleDropdown = (workflowId, event) => {
    event.stopPropagation();
    setOpenDropdown(openDropdown === workflowId ? null : workflowId);
  };

  const handleDeleteWorkflow = (workflowId, event) => {
    event.stopPropagation();
    const updatedWorkflows = workflows.filter(w => w.id !== workflowId);
    setWorkflows(updatedWorkflows);
    
    // Update localStorage
    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    const filteredWorkflows = savedWorkflows.filter(w => w.id !== workflowId);
    localStorage.setItem('savedWorkflows', JSON.stringify(filteredWorkflows));
    
    setOpenDropdown(null);
    console.log(`Deleted workflow: ${workflowId}`);
  };

  const handleCopyJSON = (workflow, event) => {
    event.stopPropagation();
    const workflowJSON = JSON.stringify(workflow, null, 2);
    navigator.clipboard.writeText(workflowJSON).then(() => {
      console.log('Workflow JSON copied to clipboard');
      // You could add a toast notification here
    });
    setOpenDropdown(null);
  };

  const handleDuplicateWorkflow = (workflow, event) => {
    event.stopPropagation();
    const newWorkflow = {
      ...workflow,
      id: 'workflow-' + Date.now(),
      name: `${workflow.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedWorkflows = [...workflows, newWorkflow];
    setWorkflows(updatedWorkflows);
    
    // Update localStorage
    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    savedWorkflows.push(newWorkflow);
    localStorage.setItem('savedWorkflows', JSON.stringify(savedWorkflows));
    
    setOpenDropdown(null);
    console.log(`Duplicated workflow: ${workflow.name}`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="workflows-overview">
      {/* Header */}
      <div className="overview-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="page-title">
              <i className="fa-solid fa-share-nodes"></i>
              Workflows
            </h1>
            <p className="page-subtitle">
              Create, manage, and monitor your automation workflows
            </p>
          </div>
          <div className="header-actions">
            <button 
              className="new-workflow-btn"
              onClick={handleNewWorkflow}
            >
              <i className="fa-solid fa-plus"></i>
              New Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overview-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fa-solid fa-diagram-project"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">3</div>
              <div className="stat-label">Total Workflows</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fa-solid fa-play"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">2,139</div>
              <div className="stat-label">Total Executions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fa-solid fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">2</div>
              <div className="stat-label">Active Workflows</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">98.5%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="controls-section">
          <div className="search-box">
            <i className="fa-solid fa-search"></i>
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <button className="filter-btn active">All</button>
            <button className="filter-btn">Active</button>
            <button className="filter-btn">Draft</button>
          </div>
        </div>

        {/* Workflows Grid */}
        <div className="workflows-section">
          <div className="section-header">
            <h2>Your Workflows</h2>
            <span className="workflow-count">{filteredWorkflows.length} workflows</span>
          </div>

          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner">
                <i className="fa-solid fa-spinner fa-spin"></i>
              </div>
              <p>Loading workflows...</p>
            </div>
          ) : filteredWorkflows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fa-solid fa-diagram-project"></i>
              </div>
              <h3>No workflows found</h3>
              <p>Get started by creating your first automation workflow</p>
              <button className="new-workflow-btn" onClick={handleNewWorkflow}>
                <i className="fa-solid fa-plus"></i>
                Create Your First Workflow
              </button>
            </div>
          ) : (
            <div className="workflows-grid">
              {filteredWorkflows.map((workflow) => (
                <div key={workflow.id} className="workflow-card" onClick={() => handleEditWorkflow(workflow.id)} style={{cursor: 'pointer'}}>
                  <div className="card-header">
                    <div className="workflow-info">
                      <h3 className="workflow-name">{workflow.name}</h3>
                      <p className="workflow-description">{workflow.description}</p>
                    </div>
                    <div className="workflow-actions">
                      <button className="action-btn" title="Edit workflow" onClick={(e) => { e.stopPropagation(); handleEditWorkflow(workflow.id); }}>
                        <i className="fa-solid fa-edit"></i>
                      </button>
                      <div className="dropdown-container">
                        <button 
                          className="action-btn" 
                          title="More options"
                          onClick={(e) => toggleDropdown(workflow.id, e)}
                        >
                          <i className="fa-solid fa-ellipsis-v"></i>
                        </button>
                        {openDropdown === workflow.id && (
                          <div className="dropdown-menu">
                            <button 
                              className="dropdown-item delete-item"
                              onClick={(e) => handleDeleteWorkflow(workflow.id, e)}
                            >
                              <i className="fa-solid fa-trash"></i>
                              Delete Workflow
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={(e) => handleCopyJSON(workflow, e)}
                            >
                              <i className="fa-solid fa-copy"></i>
                              Copy JSON
                            </button>
                            <button 
                              className="dropdown-item"
                              onClick={(e) => handleDuplicateWorkflow(workflow, e)}
                            >
                              <i className="fa-solid fa-clone"></i>
                              Duplicate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-stats">
                    <div className="stat-item">
                      <i className="fa-solid fa-cube"></i>
                      <span>{workflow.nodes} nodes</span>
                    </div>
                    <div className="stat-item">
                      <i className="fa-solid fa-play"></i>
                      <span>{workflow.executions} runs</span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="workflow-status">
                      <span className={`status-badge ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                      </span>
                    </div>
                    <div className="last-modified">
                      <i className="fa-solid fa-clock"></i>
                      {workflow.lastModified}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowsOverview;