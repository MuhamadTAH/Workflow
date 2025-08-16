import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaPlay, FaEdit, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { workflowAPI } from '../../../api';
import WorkflowCanvas from '../components/WorkflowCanvas';

const WorkflowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(id);

  // Fetch workflow data if editing
  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!isEditing) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        console.log('Fetching workflow with ID:', id);
        const response = await workflowAPI.getWorkflow(id);
        console.log('Workflow API response:', response.data);
        
        if (response.data.success) {
          setWorkflow(response.data.workflow);
          setEditTitle(response.data.workflow.name || 'Untitled Workflow');
          console.log('Workflow loaded successfully:', response.data.workflow);
        } else {
          console.log('Failed to load workflow:', response.data);
          setError('Failed to load workflow');
        }
      } catch (error) {
        console.error('Error fetching workflow:', error);
        setError('Error loading workflow. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflow();
  }, [id, isEditing]);

  // Handle title editing
  const handleTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const handleTitleSave = async () => {
    if (!editTitle.trim() || !isEditing) return;

    try {
      setSaving(true);
      const response = await workflowAPI.updateWorkflow(id, {
        name: editTitle.trim()
      });

      if (response.data.success) {
        setWorkflow(prev => ({
          ...prev,
          name: editTitle.trim()
        }));
        setIsEditingTitle(false);
      } else {
        setError('Failed to update workflow name');
      }
    } catch (error) {
      console.error('Error updating workflow name:', error);
      setError('Error updating workflow name');
    } finally {
      setSaving(false);
    }
  };

  const handleTitleCancel = () => {
    setEditTitle(workflow?.name || 'Untitled Workflow');
    setIsEditingTitle(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        padding: '24px', 
        minHeight: '100vh', 
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <FaSpinner style={{ fontSize: '32px', color: '#3b82f6', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <h3>Loading workflow...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        marginBottom: '24px',
        background: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <button 
          onClick={() => navigate('/workflow/dashboard')}
          style={{
            background: '#f3f4f6',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isEditingTitle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  border: '2px solid #3b82f6',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  background: 'white',
                  flex: 1,
                  minWidth: '200px'
                }}
                autoFocus
                disabled={saving}
              />
              <button
                onClick={handleTitleSave}
                disabled={saving || !editTitle.trim()}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: saving || !editTitle.trim() ? 0.5 : 1
                }}
              >
                {saving ? <FaSpinner style={{ animation: 'spin 1s linear infinite' }} /> : <FaCheck />}
              </button>
              <button
                onClick={handleTitleCancel}
                disabled={saving}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: saving ? 0.5 : 1
                }}
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: isEditing ? 'pointer' : 'default',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onClick={isEditing ? handleTitleEdit : undefined}
              onMouseEnter={(e) => {
                if (isEditing) e.target.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                if (isEditing) e.target.style.backgroundColor = 'transparent';
              }}
            >
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                {isEditing ? (workflow?.name || 'Untitled Workflow') : 'Create New Workflow'}
              </h1>
              {isEditing && (
                <FaEdit style={{ 
                  color: '#6b7280', 
                  fontSize: '16px',
                  opacity: 0.7
                }} />
              )}
            </div>
          )}
        </div>
        <button style={{
          background: '#10b981',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FaSave /> Save
        </button>
        <button style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FaPlay /> Test
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '16px 24px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <p style={{ margin: 0, fontWeight: '500' }}>{error}</p>
          <button 
            onClick={() => setError('')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* N8N-Style Workflow Canvas */}
      <WorkflowCanvas />

    </div>
  );
};

export default WorkflowBuilder;