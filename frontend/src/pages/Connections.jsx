import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager, connectionsAPI } from '../api';
import { 
  FaTiktok, 
  FaYoutube, 
  FaFacebook, 
  FaInstagram, 
  FaTelegram, 
  FaWhatsapp, 
  FaTwitter, 
  FaLinkedin 
} from 'react-icons/fa';

const platforms = [
  { id: 'tiktok', name: 'TikTok', icon: FaTiktok, color: '#000000', description: 'Create and share short videos' },
  { id: 'youtube', name: 'YouTube', icon: FaYoutube, color: '#FF0000', description: 'Upload and manage videos' },
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: '#1877F2', description: 'Connect with friends and family' },
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: '#E4405F', description: 'Share photos and stories' },
  { id: 'telegram', name: 'Telegram', icon: FaTelegram, color: '#0088CC', description: 'Send messages and media' },
  { id: 'whatsapp', name: 'WhatsApp', icon: FaWhatsapp, color: '#25D366', description: 'Message and call contacts' },
  { id: 'twitter', name: 'X (Twitter)', icon: FaTwitter, color: '#1DA1F2', description: 'Share thoughts and updates' },
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: '#0A66C2', description: 'Professional networking' }
];

// Telegram Token Modal Component
function TelegramTokenModal({ isOpen, onClose, onConnect, isConnecting }) {
  const [botToken, setBotToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!botToken.trim()) {
      setError('Bot token is required');
      return;
    }

    if (!botToken.match(/^\d+:[A-Za-z0-9_-]+$/)) {
      setError('Invalid bot token format. Should be like: 123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ');
      return;
    }

    try {
      await onConnect(botToken.trim());
      setBotToken('');
      setError('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect bot');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={modalOverlayStyle}>
      <div className="modal-content" style={modalContentStyle}>
        <div className="modal-header" style={modalHeaderStyle}>
          <h3 style={{ margin: 0, color: '#0088CC' }}>🤖 Connect Telegram Bot</h3>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Bot Token:</label>
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
              style={inputStyle}
              disabled={isConnecting}
            />
            <small style={helpTextStyle}>
              Get your bot token from @BotFather on Telegram
            </small>
          </div>
          
          {error && (
            <div style={errorStyle}>{error}</div>
          )}
          
          <div style={buttonGroupStyle}>
            <button
              type="button"
              onClick={onClose}
              style={cancelButtonStyle}
              disabled={isConnecting}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={submitButtonStyle}
              disabled={isConnecting || !botToken.trim()}
            >
              {isConnecting ? 'Connecting...' : 'Connect Bot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal styles
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '500px',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
};

const modalHeaderStyle = {
  padding: '20px',
  borderBottom: '1px solid #eee',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  color: '#999',
  padding: '0',
  width: '30px',
  height: '30px'
};

const formStyle = {
  padding: '20px'
};

const inputGroupStyle = {
  marginBottom: '20px'
};

const labelStyle = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: '600',
  color: '#333'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '2px solid #ddd',
  borderRadius: '8px',
  fontSize: '14px',
  fontFamily: 'monospace',
  transition: 'border-color 0.2s'
};

const helpTextStyle = {
  display: 'block',
  marginTop: '5px',
  color: '#666',
  fontSize: '12px'
};

const errorStyle = {
  backgroundColor: '#fee',
  border: '1px solid #fcc',
  color: '#c00',
  padding: '10px',
  borderRadius: '6px',
  marginBottom: '15px',
  fontSize: '14px'
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '10px',
  justifyContent: 'flex-end'
};

const cancelButtonStyle = {
  padding: '10px 20px',
  border: '2px solid #ddd',
  backgroundColor: 'white',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
};

const submitButtonStyle = {
  padding: '10px 20px',
  border: 'none',
  backgroundColor: '#0088CC',
  color: 'white',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px'
};

function ConnectionCard({ platform, isConnected, isConnecting, onConnect, onDisconnect }) {
  const getStatusIcon = () => {
    if (isConnecting) return '🟡';
    return isConnected ? '🟢' : '🔴';
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    return isConnected ? 'Connected' : 'Not Connected';
  };

  const getButtonText = () => {
    if (isConnecting) return 'Connecting...';
    return isConnected ? 'Disconnect' : 'Connect';
  };

  const handleButtonClick = () => {
    if (isConnecting) return;
    if (isConnected) {
      onDisconnect(platform.id);
    } else {
      onConnect(platform.id);
    }
  };

  return (
    <div className="connection-card" style={{ borderColor: platform.color }}>
      <div className="connection-card-header">
        <div className="platform-info">
          <div className="platform-icon" style={{ color: platform.color }}>
            <platform.icon size={24} />
          </div>
          <div className="platform-details">
            <h3 className="platform-name">{platform.name}</h3>
            <p className="platform-description">{platform.description}</p>
          </div>
        </div>
        <div className="connection-status">
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>
      <div className="connection-card-footer">
        <button
          className={`connection-btn ${isConnected ? 'btn-disconnect' : 'btn-connect'}`}
          onClick={handleButtonClick}
          disabled={isConnecting}
          style={!isConnected ? { backgroundColor: platform.color } : {}}
        >
          {getButtonText()}
        </button>
      </div>
    </div>
  );
}

function Connections() {
  const [connections, setConnections] = useState({});
  const [connectingPlatforms, setConnectingPlatforms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [showTelegramModal, setShowTelegramModal] = useState(false);

  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const response = await connectionsAPI.getConnections();
        setConnections(response.data.connections);
      } catch (error) {
        console.error('Error loading connections:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConnections();
  }, []);

  const handleConnect = async (platformId) => {
    // Show modal for Telegram
    if (platformId === 'telegram') {
      setShowTelegramModal(true);
      return;
    }

    // Handle other platforms normally
    setConnectingPlatforms(prev => new Set([...prev, platformId]));
    
    try {
      const response = await connectionsAPI.connect(platformId);
      setConnections(prev => ({
        ...prev,
        [platformId]: response.data.connection
      }));
    } catch (error) {
      console.error('Error connecting to platform:', error);
      alert(`Failed to connect to ${platformId}. Please try again.`);
    } finally {
      setConnectingPlatforms(prev => {
        const newSet = new Set(prev);
        newSet.delete(platformId);
        return newSet;
      });
    }
  };

  const handleTelegramConnect = async (botToken) => {
    setConnectingPlatforms(prev => new Set([...prev, 'telegram']));
    
    try {
      const response = await connectionsAPI.connectTelegram(botToken);
      setConnections(prev => ({
        ...prev,
        telegram: response.data.connection
      }));
    } catch (error) {
      console.error('Error connecting Telegram bot:', error);
      throw error; // Re-throw to let modal handle the error
    } finally {
      setConnectingPlatforms(prev => {
        const newSet = new Set(prev);
        newSet.delete('telegram');
        return newSet;
      });
    }
  };

  const handleDisconnect = async (platformId) => {
    try {
      await connectionsAPI.disconnect(platformId);
      setConnections(prev => {
        const newConnections = { ...prev };
        delete newConnections[platformId];
        return newConnections;
      });
    } catch (error) {
      console.error('Error disconnecting from platform:', error);
      alert(`Failed to disconnect from ${platformId}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading your connections...</div>
      </div>
    );
  }

  return (
    <div className="connections-page">
      <div className="connections-container">
        <div className="connections-header">
          <h1 className="connections-title">🔗 Connect Your Social Media Accounts</h1>
          <p className="connections-subtitle">
            Link your social media accounts to automate content sharing and engagement
          </p>
          <div className="connections-stats">
            <span className="stat">
              {Object.keys(connections).length} of {platforms.length} platforms connected
            </span>
          </div>
        </div>

        <div className="connections-grid">
          {platforms.map(platform => (
            <ConnectionCard
              key={platform.id}
              platform={platform}
              isConnected={!!connections[platform.id]}
              isConnecting={connectingPlatforms.has(platform.id)}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      </div>

      <TelegramTokenModal
        isOpen={showTelegramModal}
        onClose={() => setShowTelegramModal(false)}
        onConnect={handleTelegramConnect}
        isConnecting={connectingPlatforms.has('telegram')}
      />
    </div>
  );
}

export default Connections;