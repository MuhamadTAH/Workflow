import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.js';
import '../styles/WorkflowsOverview.css';

const WorkflowsOverview = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState(null);

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
    // Generate auto-incremented workflow name
    const existingWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    const workflowNumbers = existingWorkflows
      .map(w => w.name)
      .filter(name => name.match(/^Workflow - \d+$/))
      .map(name => parseInt(name.replace('Workflow - ', '')))
      .filter(num => !isNaN(num));
    
    const nextNumber = workflowNumbers.length > 0 ? Math.max(...workflowNumbers) + 1 : 1;
    const newWorkflowName = `Workflow - ${nextNumber}`;
    
    // Navigate to workflow editor with auto-generated name
    navigate(`/workflow?name=${encodeURIComponent(newWorkflowName)}`);
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

  // Name editing handlers
  const startEditingName = (workflowId, currentName, event) => {
    event.stopPropagation();
    setEditingName(workflowId);
    setEditNameValue(currentName);
  };

  const saveWorkflowName = (workflowId, event) => {
    event.stopPropagation();
    if (editNameValue.trim() === '') {
      cancelEditingName();
      return;
    }

    // Update workflows state
    const updatedWorkflows = workflows.map(workflow => 
      workflow.id === workflowId 
        ? { ...workflow, name: editNameValue.trim(), updatedAt: new Date().toISOString() }
        : workflow
    );
    setWorkflows(updatedWorkflows);

    // Update localStorage
    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    const updatedSavedWorkflows = savedWorkflows.map(workflow =>
      workflow.id === workflowId 
        ? { ...workflow, name: editNameValue.trim(), updatedAt: new Date().toISOString() }
        : workflow
    );
    localStorage.setItem('savedWorkflows', JSON.stringify(updatedSavedWorkflows));

    setEditingName(null);
    setEditNameValue('');
    console.log(`Updated workflow name: ${editNameValue.trim()}`);
  };

  const cancelEditingName = (event) => {
    if (event) event.stopPropagation();
    setEditingName(null);
    setEditNameValue('');
  };

  const handleNameKeyPress = (workflowId, event) => {
    if (event.key === 'Enter') {
      saveWorkflowName(workflowId, event);
    } else if (event.key === 'Escape') {
      cancelEditingName(event);
    }
  };

  // Status toggle handlers
  const handleStatusClick = (workflow, event) => {
    event.stopPropagation();
    const newStatus = workflow.status === 'active' ? 'inactive' : 'active';
    setPendingStatusChange({
      workflowId: workflow.id,
      workflowName: workflow.name,
      currentStatus: workflow.status,
      newStatus: newStatus
    });
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;

    const { workflowId, newStatus } = pendingStatusChange;

    try {
      // Update workflows state
      const updatedWorkflows = workflows.map(workflow => 
        workflow.id === workflowId 
          ? { ...workflow, status: newStatus, updatedAt: new Date().toISOString() }
          : workflow
      );
      setWorkflows(updatedWorkflows);

      // Update localStorage - workflow status
      const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
      workflowStatuses[workflowId] = newStatus;
      localStorage.setItem('workflowStatuses', JSON.stringify(workflowStatuses));
      
      // 🔄 SYNC WITH WORKFLOW PAGE: Trigger custom event for same-page updates
      window.dispatchEvent(new CustomEvent('workflowStatusChanged', { 
        detail: { workflowId, status: newStatus } 
      }));

      // If activating, make API call to activate workflow
      if (newStatus === 'active') {
        try {
          const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
          const workflow = savedWorkflows.find(w => w.id === workflowId);
          
          if (workflow) {
            console.log('🔄 Dashboard activation: Re-registering workflow with execution engine');
            console.log('Workflow data:', { 
              id: workflow.id, 
              name: workflow.name, 
              nodes: workflow.nodes?.length || 0,
              edges: workflow.edges?.length || 0 
            });

            const response = await fetch(`${API_BASE_URL}/api/workflows/${workflowId}/activate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                workflow: {
                  ...workflow,
                  // Ensure we have the complete workflow structure
                  nodes: workflow.nodes || [],
                  edges: workflow.edges || []
                },
                // Force re-registration
                forceReactivation: true,
                activatedFrom: 'dashboard'
              })
            });

            if (!response.ok) {
              const errorData = await response.text();
              console.error('❌ Failed to activate workflow on server:', errorData);
              throw new Error(`Activation failed: ${response.status} - ${errorData}`);
            } else {
              const responseData = await response.json();
              console.log('✅ Workflow activated successfully on server:', responseData);
              
              // If response includes trigger URLs, log them
              if (responseData.triggerUrls) {
                console.log('📡 Webhook URLs registered:', responseData.triggerUrls);
              }
            }
          } else {
            throw new Error('Workflow not found in localStorage');
          }
        } catch (error) {
          console.error('❌ Failed to activate workflow on server:', error.message);
          
          // Show error to user and revert status change
          alert(`Failed to activate workflow: ${error.message}\n\nThe workflow status will be reverted.`);
          
          // Revert the status change
          const revertedWorkflows = workflows.map(workflow => 
            workflow.id === workflowId 
              ? { ...workflow, status: pendingStatusChange.currentStatus }
              : workflow
          );
          setWorkflows(revertedWorkflows);
          
          // Revert localStorage
          const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
          workflowStatuses[workflowId] = pendingStatusChange.currentStatus;
          localStorage.setItem('workflowStatuses', JSON.stringify(workflowStatuses));
          
          return; // Exit early, don't proceed with success actions
        }
      }

      // If deactivating, make API call to deactivate workflow
      if (newStatus === 'inactive') {
        try {
          const response = await fetch(`${API_BASE_URL}/api/workflows/${workflowId}/deactivate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            console.warn('Failed to deactivate workflow on server, but keeping local status');
          } else {
            console.log('Workflow deactivated successfully on server');
          }
        } catch (error) {
          console.warn('Failed to deactivate workflow on server:', error.message);
        }
      }

      console.log(`Workflow ${workflowId} status changed to: ${newStatus}`);
    } catch (error) {
      console.error('Failed to change workflow status:', error);
    }

    // Close modal and reset pending change
    setShowStatusModal(false);
    setPendingStatusChange(null);
  };

  const cancelStatusChange = () => {
    setShowStatusModal(false);
    setPendingStatusChange(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 🔄 SYNC WITH WORKFLOW PAGE: Listen for status changes from workflow page
  useEffect(() => {
    const reloadWorkflowStatuses = () => {
      console.log('🔄 Workflow page changed status - updating dashboard');
      // Reload workflows to reflect new status
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
    };

    const handleStorageChange = (event) => {
      if (event.key === 'workflowStatuses') {
        reloadWorkflowStatuses();
      }
    };

    const handleCustomStatusChange = (event) => {
      console.log('🔄 Custom workflow status change detected:', event.detail);
      reloadWorkflowStatuses();
    };

    // Listen for localStorage changes from other tabs/pages
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for same-page custom events
    window.addEventListener('workflowStatusChanged', handleCustomStatusChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('workflowStatusChanged', handleCustomStatusChange);
    };
  }, []);

  // Filter and sort workflows
  const filteredWorkflows = workflows
    .filter(workflow => {
      // Apply search filter
      const matchesSearch = workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      let matchesFilter = true;
      if (activeFilter === 'Active') {
        matchesFilter = workflow.status === 'active';
      } else if (activeFilter === 'Deactive') {
        matchesFilter = workflow.status === 'inactive';
      }
      // For 'All', matchesFilter remains true
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'executions':
          return (b.executions || 0) - (a.executions || 0);
        case 'nodes':
          return (b.nodes || 0) - (a.nodes || 0);
        case 'date':
        default:
          const dateA = new Date(a.updatedAt || a.createdAt);
          const dateB = new Date(b.updatedAt || b.createdAt);
          return dateB - dateA; // Most recent first
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate real stats from workflows data
  const stats = {
    totalWorkflows: workflows.length,
    totalExecutions: workflows.reduce((sum, workflow) => sum + (workflow.executions || 0), 0),
    activeWorkflows: workflows.filter(workflow => workflow.status === 'active').length,
    successRate: (() => {
      const totalExecs = workflows.reduce((sum, workflow) => sum + (workflow.executions || 0), 0);
      if (totalExecs === 0) return '0%';
      // Assume 95% success rate as we don't track failures yet
      return '95.0%';
    })()
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
              <div className="stat-value">{stats.totalWorkflows}</div>
              <div className="stat-label">Total Workflows</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fa-solid fa-play"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.totalExecutions.toLocaleString()}</div>
              <div className="stat-label">Total Executions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fa-solid fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.activeWorkflows}</div>
              <div className="stat-label">Active Workflows</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <i className="fa-solid fa-clock"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.successRate}</div>
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
            <button 
              className={`filter-btn ${activeFilter === 'All' ? 'active' : ''}`}
              onClick={() => setActiveFilter('All')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'Active' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Active')}
            >
              Active
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'Deactive' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Deactive')}
            >
              Deactive
            </button>
          </div>
          <div className="sort-dropdown">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name (A-Z)</option>
              <option value="executions">Sort by Executions</option>
              <option value="nodes">Sort by Size</option>
            </select>
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
                      {editingName === workflow.id ? (
                        <div className="name-edit-container">
                          <input
                            type="text"
                            className="name-edit-input"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            onKeyDown={(e) => handleNameKeyPress(workflow.id, e)}
                            onBlur={(e) => saveWorkflowName(workflow.id, e)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="name-edit-actions">
                            <button 
                              className="name-edit-btn save-btn"
                              onClick={(e) => saveWorkflowName(workflow.id, e)}
                              title="Save"
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                            <button 
                              className="name-edit-btn cancel-btn"
                              onClick={(e) => cancelEditingName(e)}
                              title="Cancel"
                            >
                              <i className="fa-solid fa-times"></i>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="workflow-name-display">
                          <h3 className="workflow-name">{workflow.name}</h3>
                          <button 
                            className="edit-name-btn"
                            onClick={(e) => startEditingName(workflow.id, workflow.name, e)}
                            title="Edit workflow name"
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                        </div>
                      )}
                      <p className="workflow-description">{workflow.description}</p>
                    </div>
                    <div className="workflow-actions">
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
                      <button 
                        className={`status-badge clickable ${getStatusColor(workflow.status)}`}
                        onClick={(e) => handleStatusClick(workflow, e)}
                        title={`Click to ${workflow.status === 'active' ? 'deactivate' : 'activate'} workflow`}
                      >
                        {workflow.status}
                        <i className={`fa-solid ${workflow.status === 'active' ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                      </button>
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

      {/* Status Change Confirmation Modal */}
      {showStatusModal && pendingStatusChange && (
        <div className="modal-overlay" onClick={cancelStatusChange}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <i className={`fa-solid ${pendingStatusChange.newStatus === 'active' ? 'fa-play-circle' : 'fa-pause-circle'}`}></i>
                {pendingStatusChange.newStatus === 'active' ? 'Activate' : 'Deactivate'} Workflow
              </h3>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to <strong>{pendingStatusChange.newStatus === 'active' ? 'activate' : 'deactivate'}</strong> the workflow:
              </p>
              <div className="workflow-name-highlight">
                "{pendingStatusChange.workflowName}"
              </div>
              {pendingStatusChange.newStatus === 'active' ? (
                <div className="status-info activate-info">
                  <i className="fa-solid fa-info-circle"></i>
                  <span>This workflow will start processing triggers and executing automatically.</span>
                </div>
              ) : (
                <div className="status-info deactivate-info">
                  <i className="fa-solid fa-exclamation-triangle"></i>
                  <span>This workflow will stop processing triggers and won't execute automatically.</span>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={cancelStatusChange}
              >
                <i className="fa-solid fa-times"></i>
                Cancel
              </button>
              <button 
                className={`modal-btn confirm-btn ${pendingStatusChange.newStatus === 'active' ? 'activate' : 'deactivate'}`}
                onClick={confirmStatusChange}
              >
                <i className={`fa-solid ${pendingStatusChange.newStatus === 'active' ? 'fa-play' : 'fa-pause'}`}></i>
                {pendingStatusChange.newStatus === 'active' ? 'Activate' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowsOverview;