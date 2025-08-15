// Workflow toolbar component
// Contains save, run, stop, and other workflow controls
// Workflow name editing and status indicators
// Undo/redo functionality
import React from 'react';

const WorkflowToolbar = ({ name, setName, onSave }) => {
  return (
    <header className="workflow-toolbar">
      <div className="workflow-title-container">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="workflow-title-input"
        />
      </div>
      <div className="workflow-actions">
        <button className="btn-toolbar-action" onClick={onSave}>
          <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
          Save
        </button>
        <button className="btn-toolbar-run">
          <i className="fas fa-play" style={{ marginRight: '8px' }}></i>
          Run Workflow
        </button>
      </div>
    </header>
  );
};

export default WorkflowToolbar;

