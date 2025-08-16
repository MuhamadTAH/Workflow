import React from 'react';
import { Handle, Position } from '@xyflow/react';

/**
 * A custom node component for the Telegram Trigger.
 * It displays the node's title, an icon, and connection handles.
 */
const TriggerNode = ({ data }) => {
  return (
    <>
      {/* This Handle is the connection point for outgoing edges. */}
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
      
      {/* Main node body */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        minWidth: '180px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        fontFamily: 'sans-serif',
      }}>
        {/* Telegram Icon SVG */}
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2AABEE">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-1.37.2-1.64l16.74-6.3c.75-.28 1.45.27 1.23 1.25l-2.54 12.08c-.24.93-1 .9-1.5.43l-4.98-3.87-2.32 2.23c-.25.24-.46.45-.83.45z"/>
        </svg>
        
        {/* Node Label */}
        <div style={{ color: '#333', fontWeight: 'bold' }}>
          {data?.label || 'Telegram Trigger'}
        </div>
      </div>
    </>
  );
};

export default TriggerNode;
