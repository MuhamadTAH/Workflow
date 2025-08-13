/*
=================================================================
FILE: frontend/src/workflownode/components/core/Toolbar.js
=================================================================
Professional toolbar component for the workflow builder
*/
import React, { useState } from 'react';

const Toolbar = ({ 
    onSave, 
    onClear, 
    onUndo, 
    onRedo, 
    canUndo, 
    canRedo,
    workflowName,
    onWorkflowNameChange,
    lastSaved,
    hasUnsavedChanges,
    workflowStatus,
    onActivateWorkflow,
    currentWorkflowId
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="workflow-toolbar">
            {/* Left Section - Logo and Workflow Name */}
            <div className="toolbar-left">
                <div className="toolbar-logo">
                    <i className="fa-solid fa-share-nodes text-blue-600 text-xl"></i>
                    <span className="logo-text">WorkflowBuilder</span>
                </div>
                <div className="workflow-name-section">
                    <input
                        type="text"
                        value={workflowName}
                        onChange={(e) => onWorkflowNameChange(e.target.value)}
                        placeholder="Untitled Workflow"
                        className="workflow-name-input"
                    />
                    {hasUnsavedChanges ? (
                        <span className="unsaved-changes">
                            <i className="fa-solid fa-circle text-orange-500 text-xs"></i>
                            Unsaved changes
                        </span>
                    ) : lastSaved && (
                        <span className="last-saved">
                            <i className="fa-solid fa-check text-green-500 text-xs"></i>
                            Saved {lastSaved}
                        </span>
                    )}
                </div>
            </div>

            {/* Center Section - Main Actions */}
            <div className="toolbar-center">
                <div className="action-group">
                    <button 
                        className={`toolbar-btn ${hasUnsavedChanges ? 'primary' : 'secondary'}`}
                        onClick={onSave}
                    >
                        <i className="fa-solid fa-save"></i>
                        {hasUnsavedChanges ? 'Save Changes' : 'Save'}
                    </button>
                </div>

                <div className="action-group">
                    <button 
                        className={`toolbar-btn activate-btn ${workflowStatus}`}
                        onClick={onActivateWorkflow}
                        disabled={workflowStatus === 'executing' || !currentWorkflowId}
                        title={!currentWorkflowId ? 'Save workflow first to activate' : ''}
                    >
                        {workflowStatus === 'inactive' && (
                            <>
                                <i className="fa-solid fa-play"></i>
                                Activate
                            </>
                        )}
                        {workflowStatus === 'listening' && (
                            <>
                                <i className="fa-solid fa-stop"></i>
                                Deactivate
                            </>
                        )}
                        {workflowStatus === 'executing' && (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Executing...
                            </>
                        )}
                        {workflowStatus === 'completed' && (
                            <>
                                <i className="fa-solid fa-check"></i>
                                Completed
                            </>
                        )}
                    </button>
                    <div className="workflow-status-indicator">
                        <span className={`status-text ${workflowStatus}`}>
                            {workflowStatus === 'inactive' && 'Ready to activate'}
                            {workflowStatus === 'listening' && 'Waiting for trigger data'}
                            {workflowStatus === 'executing' && 'Running workflow'}
                            {workflowStatus === 'completed' && 'Execution finished'}
                        </span>
                    </div>
                </div>

                <div className="action-group">
                    <button 
                        className="toolbar-btn icon-only"
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo"
                    >
                        <i className="fa-solid fa-undo"></i>
                    </button>
                    <button 
                        className="toolbar-btn icon-only"
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo"
                    >
                        <i className="fa-solid fa-redo"></i>
                    </button>
                </div>
            </div>

            {/* Right Section - Settings and User */}
            <div className="toolbar-right">
                <button className="toolbar-btn icon-only" title="Zoom to fit">
                    <i className="fa-solid fa-expand-arrows-alt"></i>
                </button>
                
                <button className="toolbar-btn icon-only" title="Grid view">
                    <i className="fa-solid fa-th"></i>
                </button>

                <div className="toolbar-dropdown">
                    <button 
                        className="toolbar-btn icon-only"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        title="More options"
                    >
                        <i className="fa-solid fa-ellipsis-v"></i>
                    </button>
                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <button onClick={() => { onClear(); setIsDropdownOpen(false); }}>
                                <i className="fa-solid fa-trash"></i>
                                Clear Canvas
                            </button>
                            <button onClick={() => setIsDropdownOpen(false)}>
                                <i className="fa-solid fa-download"></i>
                                Export Workflow
                            </button>
                            <button onClick={() => setIsDropdownOpen(false)}>
                                <i className="fa-solid fa-upload"></i>
                                Import Workflow
                            </button>
                            <hr />
                            <button onClick={() => setIsDropdownOpen(false)}>
                                <i className="fa-solid fa-cog"></i>
                                Settings
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Toolbar;