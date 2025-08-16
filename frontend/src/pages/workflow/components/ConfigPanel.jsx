import React, { useState, useEffect } from 'react';
import { FaTimes, FaCheck, FaSpinner, FaTelegram } from 'react-icons/fa';
import '../styles/ConfigPanel.css';

const ConfigPanel = ({ node, isOpen, onClose, onSave }) => {
  const [config, setConfig] = useState({
    botToken: '',
    isValid: null,
    isChecking: false
  });

  useEffect(() => {
    if (isOpen && node) {
      // Load existing config from node data
      setConfig({
        botToken: node.data?.config?.botToken || '',
        isValid: node.data?.config?.isValid || null,
        isChecking: false
      });
    }
  }, [isOpen, node]);

  const validateTelegramToken = async () => {
    if (!config.botToken.trim()) {
      alert('Please enter a bot token first');
      return;
    }

    setConfig(prev => ({ ...prev, isChecking: true, isValid: null }));

    try {
      // Call Telegram Bot API to validate token
      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/getMe`);
      const data = await response.json();

      if (data.ok) {
        setConfig(prev => ({ 
          ...prev, 
          isChecking: false, 
          isValid: true 
        }));
      } else {
        setConfig(prev => ({ 
          ...prev, 
          isChecking: false, 
          isValid: false 
        }));
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setConfig(prev => ({ 
        ...prev, 
        isChecking: false, 
        isValid: false 
      }));
    }
  };

  const handleSave = () => {
    // Save configuration back to node
    const newConfig = {
      botToken: config.botToken,
      isValid: config.isValid
    };
    
    onSave(node.id, newConfig);
    onClose();
  };

  const handleTokenChange = (e) => {
    setConfig(prev => ({
      ...prev,
      botToken: e.target.value,
      isValid: null // Reset validation when token changes
    }));
  };

  if (!isOpen || !node) return null;

  return (
    <div className="config-panel-overlay">
      <div className="config-panel">
        {/* Header */}
        <div className="config-header">
          <div className="config-title">
            <FaTelegram className="config-icon" />
            <span>Configure Telegram Bot</span>
          </div>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Content */}
        <div className="config-content">
          <div className="config-section">
            <label className="config-label">
              Bot Token
              <span className="required">*</span>
            </label>
            <div className="token-input-group">
              <input
                type="password"
                className="config-input"
                placeholder="Enter your Telegram bot token (e.g., 123456:ABC-DEF1234...)"
                value={config.botToken}
                onChange={handleTokenChange}
              />
              <button
                className="check-button"
                onClick={validateTelegramToken}
                disabled={config.isChecking || !config.botToken.trim()}
              >
                {config.isChecking ? (
                  <FaSpinner className="spinner" />
                ) : (
                  <FaCheck />
                )}
                {config.isChecking ? 'Checking...' : 'Check'}
              </button>
            </div>
            
            {/* Validation Status */}
            {config.isValid === true && (
              <div className="validation-status success">
                <FaCheck /> Token is valid! Bot is ready to use.
              </div>
            )}
            {config.isValid === false && (
              <div className="validation-status error">
                <FaTimes /> Invalid token. Please check your bot token.
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="config-help">
            <h4>How to get a Telegram Bot Token:</h4>
            <ol>
              <li>Open Telegram and search for @BotFather</li>
              <li>Send /newbot command</li>
              <li>Follow the instructions to create your bot</li>
              <li>Copy the token that BotFather gives you</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="config-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="save-button" 
            onClick={handleSave}
            disabled={!config.botToken.trim()}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;