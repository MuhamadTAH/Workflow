import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaPlay } from 'react-icons/fa';

const WorkflowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(id);

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
        <h1 style={{ margin: 0, flex: 1 }}>
          {isEditing ? 'Edit Workflow' : 'Create New Workflow'}
        </h1>
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

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '32px',
        textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h2>Workflow Builder</h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          This is a placeholder for the workflow builder. The visual editor will be implemented in the next steps.
        </p>
        {isEditing && (
          <p style={{ color: '#3b82f6' }}>
            Editing workflow ID: {id}
          </p>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;