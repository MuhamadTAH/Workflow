// Workflow list page component
// Shows all user's workflows in a list/grid view
// Allows creating new workflows, editing, deleting, and running existing ones
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/WorkflowBuilder.css'; // Using shared styles for the workflow module

// Placeholder data to simulate a list of existing workflows
const placeholderWorkflows = [
  { id: '1', name: 'Sync New Orders to Google Sheets', status: 'Active' },
  { id: '2', name: 'Send Telegram Notification for Low Stock', status: 'Inactive' },
  { id: '3', name: 'Customer Support Ticket Automation', status: 'Active' },
  { id: '4', name: 'Abandoned Cart Follow-up', status: 'Error' },
];

const WorkflowList = () => {
  return (
    <div className="workflow-list-page">
      {/* Page Header */}
      <header className="workflow-list-header">
        <h1>My Workflows</h1>
        <Link to="/workflow/builder" className="btn-create-workflow">
          <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
          Create New Workflow
        </Link>
      </header>

      {/* Grid of Workflow Cards */}
      <div className="workflow-list-container">
        {placeholderWorkflows.map(wf => (
          <div key={wf.id} className="workflow-card">
            <div className="workflow-card-info">
              <h3 className="workflow-name">{wf.name}</h3>
              <span className={`workflow-status status-${wf.status.toLowerCase()}`}>
                {wf.status}
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
    </div>
  );
};

export default WorkflowList;
