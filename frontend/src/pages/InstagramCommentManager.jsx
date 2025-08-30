import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const InstagramCommentManager = () => {
  // Instagram API Configuration State
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [instagramBusinessId, setInstagramBusinessId] = useState('');
  const [webhookToken, setWebhookToken] = useState('');
  
  // UI State
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  
  // Sidebar states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  // Initialize component
  useEffect(() => {
    setWebhookUrl(`${API_BASE_URL}/api/webhooks/instagram/comments`);
    
    const token = localStorage.getItem('token');
    if (!token || token === 'null' || token === 'undefined') {
      const mockToken = `MOCK_TOKEN_FOR_TESTING_${Date.now()}`;
      localStorage.setItem('token', mockToken);
    }
    
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status && data.status.isActive) {
          setIsActive(true);
        }
      }
    } catch (error) {
      console.error('Error checking backend status:', error);
    }
  };

  const handleActivate = async () => {
    if (!appId.trim() || !appSecret.trim() || !accessToken.trim() || !instagramBusinessId.trim() || !webhookToken.trim()) {
      setError('Please fill in all Instagram API configuration fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          appId: appId.trim(),
          appSecret: appSecret.trim(),
          accessToken: accessToken.trim(),
          instagramBusinessId: instagramBusinessId.trim(),
          webhookToken: webhookToken.trim()
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsActive(true);
        console.log('Instagram comment manager activated successfully');
      } else {
        setError(data.error || 'Failed to activate Instagram comment manager');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
      console.error('Activation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivate = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsActive(false);
        console.log('Instagram comment manager deactivated successfully');
      } else {
        setError(data.error || 'Failed to deactivate Instagram comment manager');
      }
    } catch (error) {
      setError('Network error: ' + error.message);
      console.error('Deactivation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    alert('Webhook URL copied to clipboard!');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
      <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '0 1rem' }}>
        {/* Fixed Toggle Buttons */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            left: isSidebarCollapsed ? '20px' : '400px',
            backgroundColor: '#E4405F',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: 1001
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#C13584'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#E4405F'}
        >
          {isSidebarCollapsed ? '☰' : '✕'}
        </button>
        
        <button
          onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
          style={{
            position: 'fixed',
            top: '20px',
            right: isRightSidebarCollapsed ? '20px' : '300px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            zIndex: 1001
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
        >
          {isRightSidebarCollapsed ? '☰' : '✕'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', position: 'relative' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
            <i className="fab fa-instagram" style={{ color: '#E4405F', marginRight: '0.5rem' }}></i>
            Instagram Comment Manager
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', position: 'relative' }}>
          
          {/* LEFT SIDEBAR - Configuration Panel */}
          <div style={{ 
            width: '400px',
            backgroundColor: '#f8fafc', 
            borderRadius: '8px 8px 0 0', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            left: '0',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            transform: isSidebarCollapsed ? 'translateX(-420px)' : 'translateX(0)',
            opacity: isSidebarCollapsed ? 0 : 1,
            zIndex: 1000
          }}>
              {/* Sidebar Header */}
              <div style={{ 
                backgroundColor: '#E4405F', 
                color: 'white', 
                padding: '1rem 1.5rem',
                borderRadius: '8px 8px 0 0'
              }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center' }}>
                  📷 Instagram Configuration
                </h2>
              </div>
              
              {/* Sidebar Content */}
              <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
                
                {/* Instagram API Configuration Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                    📷 Instagram API Setup
                  </h3>
                  
                  {/* Webhook URL */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                      Webhook URL
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <code style={{ 
                        display: 'block', 
                        width: '100%', 
                        padding: '0.5rem', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        wordBreak: 'break-all',
                        fontFamily: 'monospace'
                      }}>
                        {webhookUrl}
                      </code>
                      <button 
                        onClick={copyWebhookUrl}
                        style={{
                          padding: '0.5rem',
                          backgroundColor: '#E4405F',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                    <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      Use this URL as your webhook endpoint in Meta Developer Console
                    </p>
                  </div>

                  {/* Configuration Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Instagram App ID
                      </label>
                      <input
                        type="text"
                        value={appId}
                        onChange={(e) => setAppId(e.target.value)}
                        placeholder="123456789012345"
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        Get from Meta Developer Console → Your App → App ID
                      </p>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        App Secret
                      </label>
                      <input
                        type="password"
                        value={appSecret}
                        onChange={(e) => setAppSecret(e.target.value)}
                        placeholder="abcd1234efgh5678..."
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        From Meta Developer Console → Your App → App Secret
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Access Token
                      </label>
                      <input
                        type="password"
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="IGQVJxxxxxxxx..."
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        Long-lived user access token from Graph API Explorer
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Instagram Business Account ID
                      </label>
                      <input
                        type="text"
                        value={instagramBusinessId}
                        onChange={(e) => setInstagramBusinessId(e.target.value)}
                        placeholder="17841401441775531"
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        Your Instagram Business Account ID
                      </p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                        Webhook Verification Token
                      </label>
                      <input
                        type="text"
                        value={webhookToken}
                        onChange={(e) => setWebhookToken(e.target.value)}
                        placeholder="custom_verification_token"
                        disabled={isActive}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          border: '1px solid #d1d5db', 
                          borderRadius: '6px', 
                          fontSize: '0.875rem',
                          outline: 'none',
                          opacity: isActive ? '0.5' : '1'
                        }}
                      />
                      <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        Custom token for webhook verification
                      </p>
                    </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div style={{ 
                      padding: '1rem', 
                      borderRadius: '6px', 
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      marginTop: '1rem',
                      border: '1px solid #fecaca'
                    }}>
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    {!isActive ? (
                      <button
                        onClick={handleActivate}
                        disabled={isLoading || !appId.trim() || !appSecret.trim() || !accessToken.trim() || !instagramBusinessId.trim() || !webhookToken.trim()}
                        style={{ 
                          flex: '1',
                          backgroundColor: isLoading || !appId.trim() || !appSecret.trim() || !accessToken.trim() || !instagramBusinessId.trim() || !webhookToken.trim() ? '#9ca3af' : '#E4405F', 
                          color: 'white', 
                          padding: '0.75rem 1rem', 
                          border: 'none',
                          borderRadius: '6px', 
                          cursor: isLoading || !appId.trim() || !appSecret.trim() || !accessToken.trim() || !instagramBusinessId.trim() || !webhookToken.trim() ? 'not-allowed' : 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        {isLoading ? '⏳ Setting up...' : '🚀 Start Instagram Integration'}
                      </button>
                    ) : (
                      <button
                        onClick={handleDeactivate}
                        disabled={isLoading}
                        style={{ 
                          flex: '1',
                          backgroundColor: isLoading ? '#9ca3af' : '#dc2626', 
                          color: 'white', 
                          padding: '0.75rem 1rem', 
                          border: 'none',
                          borderRadius: '6px', 
                          cursor: isLoading ? 'not-allowed' : 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        {isLoading ? '⏳ Stopping...' : '🛑 Stop Integration'}
                      </button>
                    )}
                  </div>

                  {/* Status */}
                  {isActive && (
                    <div style={{ 
                      padding: '1rem', 
                      borderRadius: '6px', 
                      backgroundColor: '#f0fdf4',
                      color: '#15803d',
                      marginTop: '1rem'
                    }}>
                      ✅ Instagram comment manager is active and monitoring comments
                    </div>
                  )}

                  {/* Instructions */}
                  <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '6px', marginTop: '1rem' }}>
                    <h4 style={{ fontWeight: '500', color: '#1e3a8a', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>📋 Setup Instructions:</h4>
                    <ol style={{ paddingLeft: '1.5rem', fontSize: '0.75rem', color: '#1e40af', lineHeight: '1.4' }}>
                      <li>Create Instagram App in Meta Developer Console</li>
                      <li>Get Instagram Basic Display permissions</li>
                      <li>Generate long-lived access token</li>
                      <li>Set webhook URL in your app settings</li>
                      <li>Fill all fields above and click "Start Integration"</li>
                    </ol>
                  </div>
                </div>
                
              </div>
            </div>
          
          {/* MIDDLE COLUMN - Placeholder for Comment Interface */}
          <div style={{ 
            flex: '1',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem',
            minWidth: '500px',
            marginLeft: isSidebarCollapsed ? '0' : '400px',
            marginRight: isRightSidebarCollapsed ? '0' : '300px',
            transition: 'margin-left 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), margin-right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}>

            {/* Instagram Status Warning */}
            <div style={{
              opacity: isActive ? 1 : 0.6
            }}>
              {!isActive && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '1rem',
                  borderRadius: '6px',
                  marginBottom: '1rem',
                  border: '1px solid #fecaca'
                }}>
                  <p style={{ color: '#991b1b', fontSize: '0.875rem', margin: 0 }}>
                    ⚠️ Configure and activate Instagram API integration to start managing comments
                  </p>
                </div>
              )}
              
              {/* Placeholder for Comment Interface */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)', 
                padding: '2rem',
                textAlign: 'center',
                height: '500px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: '0.3' }}>💬</div>
                <h2 style={{ color: '#6b7280', marginBottom: '1rem' }}>Comment Management Interface</h2>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', maxWidth: '400px' }}>
                  {isActive 
                    ? "Comment monitoring is active. Comments will appear here when received from Instagram posts." 
                    : "Configure Instagram API settings in the left panel to start monitoring comments."
                  }
                </p>
              </div>
            </div>
          </div>
          
          {/* RIGHT SIDEBAR - Placeholder for Analytics */}
          <div style={{ 
            width: '300px',
            backgroundColor: '#f8fafc', 
            borderRadius: '8px 0 0 8px', 
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
            padding: '0',
            height: '100vh',
            position: 'fixed',
            top: '0',
            right: '0',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s ease',
            transform: isRightSidebarCollapsed ? 'translateX(320px)' : 'translateX(0)',
            opacity: isRightSidebarCollapsed ? 0 : 1,
            zIndex: 1000
          }}>
            {/* Right Sidebar Header */}
            <div style={{ 
              backgroundColor: '#10b981', 
              color: 'white', 
              padding: '1rem 1.5rem',
              borderRadius: '8px 8px 0 0'
            }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: '0', display: 'flex', alignItems: 'center' }}>
                📊 Analytics & Info
              </h2>
            </div>
            
            {/* Right Sidebar Content */}
            <div style={{ padding: '1.5rem', height: 'calc(100vh - 60px)', overflowY: 'auto' }}>
              
              {/* Placeholder Content */}
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                padding: '2rem', 
                textAlign: 'center', 
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
                <p>Analytics and comment statistics will appear here when the system is active.</p>
              </div>
              
            </div>
          </div>
          
        </div>

        {/* Status indicator for Instagram system */}
        {!isActive && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: isRightSidebarCollapsed ? '80px' : '320px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#991b1b',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            transition: 'right 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}>
            ⚠️ Instagram system is inactive. Configure API settings to start monitoring comments.
          </div>
        )}

      </div>
    </div>
  );
};

export default InstagramCommentManager;