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
    </div>
  );
}

export default Connections;