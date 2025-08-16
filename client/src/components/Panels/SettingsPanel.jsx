import React, { useState, useEffect } from 'react';

/**
 * A configuration panel that opens to show the settings for a selected node.
 */
const SettingsPanel = ({ node, onSave, onClose }) => {
  // State to manage the value of the bot token input field
  const [botToken, setBotToken] = useState(node?.data?.botToken || '');

  // When a new node is selected, update the panel's internal state
  useEffect(() => {
    setBotToken(node?.data?.botToken || '');
  }, [node]);

  // Handler for when the input value changes
  const handleChange = (event) => {
    const { value } = event.target;
    setBotToken(value);
    // Call the onSave function passed from the parent to update the global state
    onSave(node.id, { botToken: value });
  };

  if (!node) {
    return null;
  }

  return (
    <aside style={{
      position: 'absolute',
      right: '20px',
      top: '80px', // Adjusted position
      width: '350px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 10,
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Panel Header */}
      <div style={{
        padding: '15px 20px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>
          {node.data.label || 'Settings'}
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            color: '#888'
          }}
        >
          &times;
        </button>
      </div>

      {/* Panel Body */}
      <div style={{ padding: '20px', flexGrow: 1 }}>
        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="botToken"
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              color: '#555'
            }}
          >
            Telegram Bot Token
          </label>
          <input
            type="text"
            id="botToken"
            name="botToken"
            value={botToken}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              boxSizing: 'border-box'
            }}
            placeholder="Enter your bot token"
          />
        </div>
      </div>
    </aside>
  );
};

export default SettingsPanel;
