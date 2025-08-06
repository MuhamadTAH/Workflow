import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles.css';

function Overview() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedWorkflows, setSelectedWorkflows] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showLogs, setShowLogs] = useState(null);

  // Load workflows from localStorage and enhance with status/execution data
  useEffect(() => {
    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
    const workflowExecutions = JSON.parse(localStorage.getItem('workflowExecutions') || '{}');

    const enhancedWorkflows = savedWorkflows.map(workflow => ({
      ...workflow,
      status: workflowStatuses[workflow.id] || 'inactive',
      runCount: workflowExecutions[workflow.id]?.runCount || 0,
      lastRun: workflowExecutions[workflow.id]?.lastRun || null,
      logs: workflowExecutions[workflow.id]?.logs || []
    }));

    setWorkflows(enhancedWorkflows);
  }, []);

  // Filter and sort workflows
  useEffect(() => {
    let filtered = workflows;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(workflow =>
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(workflow => workflow.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'lastRun') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }

      if (sortField === 'name') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredWorkflows(filtered);
  }, [workflows, searchTerm, statusFilter, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleWorkflowStatus = (workflowId) => {
    const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
    const currentStatus = workflowStatuses[workflowId] || 'inactive';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    workflowStatuses[workflowId] = newStatus;
    localStorage.setItem('workflowStatuses', JSON.stringify(workflowStatuses));

    setWorkflows(prev => prev.map(workflow =>
      workflow.id === workflowId ? { ...workflow, status: newStatus } : workflow
    ));
  };

  const runWorkflow = (workflowId) => {
    const workflowExecutions = JSON.parse(localStorage.getItem('workflowExecutions') || '{}');
    const now = new Date().toISOString();
    
    if (!workflowExecutions[workflowId]) {
      workflowExecutions[workflowId] = { runCount: 0, logs: [] };
    }
    
    workflowExecutions[workflowId].runCount += 1;
    workflowExecutions[workflowId].lastRun = now;
    workflowExecutions[workflowId].logs.unshift({
      id: Date.now(),
      timestamp: now,
      status: 'success',
      message: 'Workflow executed successfully',
      duration: Math.floor(Math.random() * 5000) + 1000 // Random duration 1-6 seconds
    });

    // Keep only last 50 logs
    if (workflowExecutions[workflowId].logs.length > 50) {
      workflowExecutions[workflowId].logs = workflowExecutions[workflowId].logs.slice(0, 50);
    }

    localStorage.setItem('workflowExecutions', JSON.stringify(workflowExecutions));

    setWorkflows(prev => prev.map(workflow =>
      workflow.id === workflowId 
        ? { 
            ...workflow, 
            runCount: workflowExecutions[workflowId].runCount,
            lastRun: now,
            logs: workflowExecutions[workflowId].logs
          } 
        : workflow
    ));
  };

  const deleteWorkflow = (workflowId) => {
    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    const updated = savedWorkflows.filter(w => w.id !== workflowId);
    localStorage.setItem('savedWorkflows', JSON.stringify(updated));

    // Clean up related data
    const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
    const workflowExecutions = JSON.parse(localStorage.getItem('workflowExecutions') || '{}');
    delete workflowStatuses[workflowId];
    delete workflowExecutions[workflowId];
    localStorage.setItem('workflowStatuses', JSON.stringify(workflowStatuses));
    localStorage.setItem('workflowExecutions', JSON.stringify(workflowExecutions));

    setWorkflows(prev => prev.filter(w => w.id !== workflowId));
    setShowDeleteConfirm(null);
  };

  const handleSelectWorkflow = (workflowId) => {
    setSelectedWorkflows(prev =>
      prev.includes(workflowId)
        ? prev.filter(id => id !== workflowId)
        : [...prev, workflowId]
    );
  };

  const handleRowDoubleClick = (workflowId) => {
    navigate(`/workflow?load=${workflowId}`);
  };

  const handleSelectAll = () => {
    if (selectedWorkflows.length === filteredWorkflows.length) {
      setSelectedWorkflows([]);
    } else {
      setSelectedWorkflows(filteredWorkflows.map(w => w.id));
    }
  };

  const bulkActivate = () => {
    const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
    selectedWorkflows.forEach(id => {
      workflowStatuses[id] = 'active';
    });
    localStorage.setItem('workflowStatuses', JSON.stringify(workflowStatuses));

    setWorkflows(prev => prev.map(workflow =>
      selectedWorkflows.includes(workflow.id) ? { ...workflow, status: 'active' } : workflow
    ));
    setSelectedWorkflows([]);
  };

  const bulkDeactivate = () => {
    const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
    selectedWorkflows.forEach(id => {
      workflowStatuses[id] = 'inactive';
    });
    localStorage.setItem('workflowStatuses', JSON.stringify(workflowStatuses));

    setWorkflows(prev => prev.map(workflow =>
      selectedWorkflows.includes(workflow.id) ? { ...workflow, status: 'inactive' } : workflow
    ));
    setSelectedWorkflows([]);
  };

  const bulkDelete = () => {
    const savedWorkflows = JSON.parse(localStorage.getItem('savedWorkflows') || '[]');
    const updated = savedWorkflows.filter(w => !selectedWorkflows.includes(w.id));
    localStorage.setItem('savedWorkflows', JSON.stringify(updated));

    // Clean up related data
    const workflowStatuses = JSON.parse(localStorage.getItem('workflowStatuses') || '{}');
    const workflowExecutions = JSON.parse(localStorage.getItem('workflowExecutions') || '{}');
    selectedWorkflows.forEach(id => {
      delete workflowStatuses[id];
      delete workflowExecutions[id];
    });
    localStorage.setItem('workflowStatuses', JSON.stringify(workflowStatuses));
    localStorage.setItem('workflowExecutions', JSON.stringify(workflowExecutions));

    setWorkflows(prev => prev.filter(w => !selectedWorkflows.includes(w.id)));
    setSelectedWorkflows([]);
  };

  const formatLastRun = (lastRun) => {
    if (!lastRun) return 'Never';
    const date = new Date(lastRun);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="overview-container">
      <div className="overview-header">
        <div className="overview-title-section">
          <h1>🎯 My Workflows</h1>
          <p className="overview-subtitle">
            {workflows.length} total workflows • {workflows.filter(w => w.status === 'active').length} active
          </p>
          <p className="overview-hint">
            💡 Double-click any row to open workflow editor
          </p>
        </div>
        <div className="overview-actions">
          <Link to="/workflow" className="btn btn-primary">
            ✨ New Workflow
          </Link>
          <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
            🏠 Dashboard
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="overview-filters">
        <div className="search-section">
          <input
            type="text"
            placeholder="🔍 Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-section">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedWorkflows.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-selected">
            {selectedWorkflows.length} workflow{selectedWorkflows.length !== 1 ? 's' : ''} selected
          </span>
          <div className="bulk-actions">
            <button onClick={bulkActivate} className="btn btn-secondary">
              ✅ Activate
            </button>
            <button onClick={bulkDeactivate} className="btn btn-secondary">
              ⏸️ Deactivate
            </button>
            <button onClick={bulkDelete} className="btn btn-danger">
              🗑️ Delete
            </button>
          </div>
        </div>
      )}

      {/* Workflows Table */}
      <div className="workflows-table-container">
        <table className="workflows-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectedWorkflows.length === filteredWorkflows.length && filteredWorkflows.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th 
                className={`sortable ${sortField === 'name' ? 'sorted' : ''}`}
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Status</th>
              <th 
                className={`sortable ${sortField === 'lastRun' ? 'sorted' : ''}`}
                onClick={() => handleSort('lastRun')}
              >
                Last Run {sortField === 'lastRun' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortField === 'runCount' ? 'sorted' : ''}`}
                onClick={() => handleSort('runCount')}
              >
                Runs {sortField === 'runCount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredWorkflows.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state-row">
                  <div className="table-empty-state">
                    <p>📭 No workflows found</p>
                    <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                      {workflows.length === 0 
                        ? 'Create your first workflow to get started!'
                        : 'Try adjusting your search or filter criteria.'
                      }
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredWorkflows.map(workflow => (
                <tr 
                  key={workflow.id} 
                  className="workflow-row"
                  onDoubleClick={() => handleRowDoubleClick(workflow.id)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedWorkflows.includes(workflow.id)}
                      onChange={() => handleSelectWorkflow(workflow.id)}
                    />
                  </td>
                  <td className="workflow-name">
                    <div className="workflow-name-content">
                      <span className="workflow-title">{workflow.name}</span>
                      <span className="workflow-meta">
                        {workflow.nodes?.length || 0} nodes • Updated {new Date(workflow.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`status-toggle ${workflow.status}`}
                      onClick={() => toggleWorkflowStatus(workflow.id)}
                    >
                      {workflow.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
                    </button>
                  </td>
                  <td className="last-run">
                    {formatLastRun(workflow.lastRun)}
                  </td>
                  <td className="run-count">
                    {workflow.runCount.toLocaleString()}
                  </td>
                  <td className="actions" onClick={(e) => e.stopPropagation()}>
                    <div className="action-buttons">
                      <button
                        onClick={() => runWorkflow(workflow.id)}
                        className="action-btn run-btn"
                        title="Run Now"
                      >
                        ▶️
                      </button>
                      <button
                        onClick={() => navigate(`/workflow?load=${workflow.id}`)}
                        className="action-btn edit-btn"
                        title="Edit Workflow"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => navigate(`/workflow?load=${workflow.id}`)}
                        className="action-btn open-btn"
                        title="Open Workflow"
                      >
                        📂
                      </button>
                      <button
                        onClick={() => setShowLogs(workflow)}
                        className="action-btn logs-btn"
                        title="View Logs"
                      >
                        📊
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(workflow.id)}
                        className="action-btn delete-btn"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Delete Workflow</h3>
              <button onClick={() => setShowDeleteConfirm(null)} className="modal-close">×</button>
            </div>
            <div className="modal-content">
              <p>Are you sure you want to delete this workflow? This action cannot be undone.</p>
              <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '1rem' }}>
                All execution history and logs will be permanently deleted.
              </p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteConfirm(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={() => deleteWorkflow(showDeleteConfirm)} className="btn btn-danger">
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(null)}>
          <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Execution Logs - {showLogs.name}</h3>
              <button onClick={() => setShowLogs(null)} className="modal-close">×</button>
            </div>
            <div className="modal-content">
              {showLogs.logs.length === 0 ? (
                <div className="empty-state">
                  <p>📭 No execution logs found</p>
                  <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                    Run this workflow to see execution history here.
                  </p>
                </div>
              ) : (
                <div className="logs-container">
                  {showLogs.logs.map(log => (
                    <div key={log.id} className={`log-entry ${log.status}`}>
                      <div className="log-header">
                        <span className="log-status">
                          {log.status === 'success' ? '✅' : '❌'} {log.status.toUpperCase()}
                        </span>
                        <span className="log-timestamp">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span className="log-duration">
                          {log.duration}ms
                        </span>
                      </div>
                      <div className="log-message">
                        {log.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowLogs(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Overview;