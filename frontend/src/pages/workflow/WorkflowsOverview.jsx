import React from 'react';
import { Link } from 'react-router-dom';

const WorkflowsOverview = () => {
  return (
    <div className="workflows-overview">
      <div className="workflows-header">
        <h1>Workflow Automation</h1>
        <p>Create powerful workflows to automate your business processes</p>
      </div>
      
      <div className="workflows-actions">
        <Link to="/workflow" className="btn-primary">
          View All Workflows
        </Link>
        <Link to="/workflow/builder" className="btn-secondary">
          Create New Workflow
        </Link>
      </div>
    </div>
  );
};

export default WorkflowsOverview;