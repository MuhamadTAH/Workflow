/*
=================================================================
FILE: frontend/src/workflownode/components/core/Toolbar.js
=================================================================
Professional toolbar component for the workflow builder
*/
import React, { useState } from 'react';

const Toolbar = ({ 
    onSave, 
    onExecute, 
    onClear, 
    onUndo, 
    onRedo, 
    canUndo, 
    canRedo,
    workflowName,
    onWorkflowNameChange,
    isExecuting,
    lastSaved,
    hasUnsavedChanges
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
                        className="toolbar-btn primary"
                        onClick={onExecute}
                        disabled={isExecuting}
                    >
                        {isExecuting ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i>
                                Executing...
                            </>
                        ) : (
                            <>
                                <i className="fa-solid fa-play"></i>
                                Execute
                            </>
                        )}
                    </button>
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