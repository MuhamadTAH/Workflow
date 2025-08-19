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

// Instagram OAuth Modal Component
function InstagramOAuthModal({ isOpen, onClose, onConnect, isConnecting, authUrl }) {
  const [error, setError] = useState('');

  const handleConnect = async () => {
    try {
      setError('');
      
      if (!authUrl) {
        // Request auth URL from backend
        await onConnect();
        return;
      }
      
      // Open Instagram OAuth in new window
      const popup = window.open(authUrl, 'instagram-oauth', 'width=600,height=600,scrollbars=yes,resizable=yes');
      
      // Listen for the OAuth callback
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          // Check if connection was successful by reloading connections
          window.location.reload();
        }
      }, 1000);

      // Listen for postMessage from OAuth callback
      const messageListener = (event) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'INSTAGRAM_OAUTH_SUCCESS') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageListener);
          onClose();
          // Refresh connections to show the new connection
          window.location.reload();
        } else if (event.data.type === 'INSTAGRAM_OAUTH_ERROR') {
          clearInterval(checkClosed);
          popup.close();
          window.removeEventListener('message', messageListener);
          setError(event.data.error || 'Instagram connection failed');
        }
      };

      window.addEventListener('message', messageListener);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start Instagram connection');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={modalOverlayStyle}>
      <div className="modal-content" style={modalContentStyle}>
        <div className="modal-header" style={modalHeaderStyle}>
          <h3 style={{ margin: 0, color: '#E4405F' }}>📷 Connect Instagram Business Account</h3>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>
        
        <div style={formStyle}>
          <div style={inputGroupStyle}>
            <p style={{ margin: '0 0 15px 0', color: '#666', lineHeight: '1.5' }}>
              Connect your Instagram Business account to enable content publishing and management through workflows.
            </p>
            
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              border: '1px solid #dee2e6', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '20px' 
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#495057', fontSize: '14px' }}>Requirements:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '13px' }}>
                <li>Instagram Business or Creator account</li>
                <li>Account must be connected to a Facebook Page</li>
                <li>Facebook Page admin permissions required</li>
              </ul>
            </div>
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
              type="button"
              onClick={handleConnect}
              style={{...submitButtonStyle, backgroundColor: '#E4405F'}}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Instagram'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Telegram Token Modal Component
function TelegramTokenModal({ isOpen, onClose, onConnect, isConnecting }) {
  const [connectionType, setConnectionType] = useState('bot'); // 'bot' or 'client'
  const [botToken, setBotToken] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('connection_type'); // 'connection_type', 'phone', 'verification'
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (connectionType === 'bot') {
      // Handle Bot API connection
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
        
        // After successful bot connection, automatically show Client API option
        setConnectionType('client');
        setStep('phone');
        
        // Show success message and transition
        setError('✅ Bot connected! Now set up Client API to read bot message history.');
        
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to connect bot');
      }
    } else {
      // Handle Client API connection
      if (step === 'connection_type') {
        setStep('phone');
      } else if (step === 'phone') {
        if (!phoneNumber.trim()) {
          setError('Phone number is required');
          return;
        }
        
        try {
          // Send phone number to backend
          const API_BASE = process.env.NODE_ENV === 'production' 
            ? 'https://workflow-lg9z.onrender.com'
            : 'http://localhost:3001';
          const response = await fetch(`${API_BASE}/api/connections/telegram-client/send-code`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenManager.getToken()}`
            },
            body: JSON.stringify({ phoneNumber: phoneNumber.trim() })
          });
          
          const data = await response.json();
          if (data.success) {
            setStep('verification');
            // Show the verification code in the error field (as a success message)
            if (data.data && data.data.verificationCode) {
              setError(`✅ Code sent! Your verification code is: ${data.data.verificationCode}`);
            } else if (data.data && data.data.message) {
              setError(`✅ ${data.data.message}`);
            } else {
              setError('✅ Verification code sent to your phone');
            }
          } else {
            setError(data.error || 'Failed to send verification code');
          }
        } catch (err) {
          setError('Failed to send verification code');
        }
      } else if (step === 'verification') {
        if (!verificationCode.trim()) {
          setError('Verification code is required');
          return;
        }
        
        try {
          // Verify code and complete connection
          const API_BASE = process.env.NODE_ENV === 'production' 
            ? 'https://workflow-lg9z.onrender.com'
            : 'http://localhost:3001';
          const response = await fetch(`${API_BASE}/api/connections/telegram-client/verify-code`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenManager.getToken()}`
            },
            body: JSON.stringify({ 
              phoneNumber: phoneNumber.trim(),
              verificationCode: verificationCode.trim()
            })
          });
          
          const data = await response.json();
          if (data.success) {
            // Reset form and close modal
            setStep('connection_type');
            setPhoneNumber('');
            setVerificationCode('');
            setError('');
            onClose();
            // Refresh connections list
            window.location.reload();
          } else {
            setError(data.error || 'Failed to verify code');
          }
        } catch (err) {
          setError('Failed to verify code');
        }
      }
    }
  };

  if (!isOpen) return null;

  const renderConnectionTypeSelection = () => (
    <>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Choose Connection Method:</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            onClick={() => setConnectionType('bot')}
            style={{
              ...submitButtonStyle,
              backgroundColor: connectionType === 'bot' ? '#0088CC' : '#gray',
              flex: 1
            }}
          >
            🤖 Bot API
          </button>
          <button
            type="button"
            onClick={() => setConnectionType('client')}
            style={{
              ...submitButtonStyle,
              backgroundColor: connectionType === 'client' ? '#0088CC' : '#gray',
              flex: 1
            }}
          >
            📱 Client API
          </button>
        </div>
        <small style={helpTextStyle}>
          {connectionType === 'bot' 
            ? 'Connect using bot token (for sending messages)'
            : 'Connect using your Telegram account (for reading bot message history)'
          }
        </small>
      </div>
      
      {connectionType === 'bot' && (
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
      )}
    </>
  );

  const renderPhoneStep = () => (
    <div style={inputGroupStyle}>
      <label style={labelStyle}>Phone Number:</label>
      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="+1234567890"
        style={inputStyle}
        disabled={isConnecting}
      />
      <small style={helpTextStyle}>
        Enter your phone number linked to your Telegram account (with country code).
        This allows reading your bot's message history. A verification code will be sent via SMS.
      </small>
    </div>
  );

  const renderVerificationStep = () => (
    <div style={inputGroupStyle}>
      <label style={labelStyle}>Verification Code:</label>
      <input
        type="text"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        placeholder="12345"
        style={inputStyle}
        disabled={isConnecting}
        maxLength={5}
      />
      <small style={helpTextStyle}>
        Enter the 5-digit verification code sent to your phone: {phoneNumber}
      </small>
    </div>
  );

  const getTitle = () => {
    if (connectionType === 'client' && step === 'phone') return '📱 Enter Phone Number for Client API';
    if (connectionType === 'client' && step === 'verification') return '🔐 Enter Verification Code';
    if (connectionType === 'bot' && step === 'connection_type') return '🤖 Connect Telegram Bot';
    return '🔗 Connect Telegram';
  };

  const getButtonText = () => {
    if (isConnecting) return 'Connecting...';
    if (connectionType === 'bot') return 'Connect Bot';
    if (step === 'phone') return 'Send Code';
    if (step === 'verification') return 'Verify & Connect';
    return 'Next';
  };

  const isFormValid = () => {
    if (connectionType === 'bot') return botToken.trim();
    if (step === 'phone') return phoneNumber.trim();
    if (step === 'verification') return verificationCode.trim();
    return true;
  };

  return (
    <div className="modal-overlay" style={modalOverlayStyle}>
      <div className="modal-content" style={modalContentStyle}>
        <div className="modal-header" style={modalHeaderStyle}>
          <h3 style={{ margin: 0, color: '#0088CC' }}>{getTitle()}</h3>
          <button onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit} style={formStyle}>
          {step === 'connection_type' && renderConnectionTypeSelection()}
          {connectionType === 'client' && step === 'phone' && renderPhoneStep()}
          {connectionType === 'client' && step === 'verification' && renderVerificationStep()}
          
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
              {connectionType === 'client' && step === 'phone' ? 'Skip Client API' : 'Cancel'}
            </button>
            <button
              type="submit"
              style={submitButtonStyle}
              disabled={isConnecting || !isFormValid()}
            >
              {getButtonText()}
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
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [instagramAuthUrl, setInstagramAuthUrl] = useState('');

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

    // Show modal for Instagram
    if (platformId === 'instagram') {
      setShowInstagramModal(true);
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

  const handleInstagramConnect = async () => {
    setConnectingPlatforms(prev => new Set([...prev, 'instagram']));
    
    try {
      const response = await connectionsAPI.connectInstagram();
      if (response.data.authUrl) {
        setInstagramAuthUrl(response.data.authUrl);
      } else if (response.data.connection) {
        setConnections(prev => ({
          ...prev,
          instagram: response.data.connection
        }));
        setShowInstagramModal(false);
      }
    } catch (error) {
      console.error('Error starting Instagram connection:', error);
      throw error; // Re-throw to let modal handle the error
    } finally {
      setConnectingPlatforms(prev => {
        const newSet = new Set(prev);
        newSet.delete('instagram');
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

      <InstagramOAuthModal
        isOpen={showInstagramModal}
        onClose={() => {
          setShowInstagramModal(false);
          setInstagramAuthUrl('');
        }}
        onConnect={handleInstagramConnect}
        isConnecting={connectingPlatforms.has('instagram')}
        authUrl={instagramAuthUrl}
      />
    </div>
  );
}

export default Connections;