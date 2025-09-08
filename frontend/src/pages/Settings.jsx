import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles.css';
import '../styles/DashboardDark.css';

function Settings() {
  const { theme, colors } = useTheme();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: 'fas fa-cog' },
    { id: 'account', name: 'Account', icon: 'fas fa-user' },
    { id: 'notifications', name: 'Notifications', icon: 'fas fa-bell' },
    { id: 'security', name: 'Security', icon: 'fas fa-shield-alt' },
    { id: 'api', name: 'API Keys', icon: 'fas fa-key' },
    { id: 'billing', name: 'Billing', icon: 'fas fa-credit-card' }
  ];

  return (
    <div className={`professional-dashboard ${theme === 'dark' ? 'variant-1' : 'light-theme'}`} 
         style={{ backgroundColor: '#1a1a1a', color: '#E0E0E0', minHeight: '100vh', paddingLeft: '80px' }}>
      
      {/* Header */}
      <div className="dashboard-hero" style={{ 
        backgroundColor: '#323232', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 className="hero-title" style={{ 
            fontSize: '2.5rem', 
            fontWeight: '600', 
            margin: '0 0 0.5rem 0',
            color: '#E0E0E0'
          }}>
            ⚙️ Settings
          </h1>
          <p className="hero-subtitle" style={{ 
            color: '#a0a0a0', 
            fontSize: '1.1rem',
            margin: 0 
          }}>
            Manage your account preferences and application settings
          </p>
        </div>
      </div>

      <div className="dashboard-content" style={{ 
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem 2rem 2rem'
      }}>
        <div className="content-grid" style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '2rem'
        }}>
        
        {/* Settings Navigation */}
        <div className="dashboard-card" style={{
          backgroundColor: '#323232',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '1.5rem',
          height: 'fit-content',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)'
        }}>
          <div className="card-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ 
              color: '#E0E0E0',
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-list" style={{ color: '#4a90e2' }}></i>
              Categories
            </h3>
          </div>
          <nav>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  margin: '0.25rem 0',
                  backgroundColor: activeTab === tab.id ? 'rgba(74, 144, 226, 0.2)' : '#262626',
                  color: activeTab === tab.id ? '#4a90e2' : '#E0E0E0',
                  border: activeTab === tab.id ? '1px solid rgba(74, 144, 226, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = '#424242';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = '#262626';
                  }
                }}
              >
                <i className={tab.icon} style={{ color: activeTab === tab.id ? '#4a90e2' : '#a0a0a0' }}></i>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="dashboard-card" style={{
          backgroundColor: '#323232',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)'
        }}>
          {activeTab === 'general' && (
            <div className="settings-section">
              <div className="card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{ 
                  color: '#E0E0E0', 
                  fontSize: '1.3rem', 
                  fontWeight: '600',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fas fa-cog" style={{ color: '#4a90e2' }}></i>
                  General Settings
                </h2>
              </div>
              
              <div className="setting-group" style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block',
                  color: '#E0E0E0',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  Application Name
                </label>
                <input
                  type="text"
                  defaultValue="WorkflowPro"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#262626',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#E0E0E0',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(74, 144, 226, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>

              <div className="setting-group" style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block',
                  color: '#E0E0E0',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  Default Language
                </label>
                <select style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#262626',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#E0E0E0',
                  fontSize: '1rem',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
                }}>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                </select>
              </div>

              <div className="setting-group">
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#E0E0E0',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  <input type="checkbox" defaultChecked style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#4a90e2'
                  }} />
                  Enable auto-save for workflows
                </label>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <div className="card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{ 
                  color: '#E0E0E0', 
                  fontSize: '1.3rem', 
                  fontWeight: '600',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fas fa-user" style={{ color: '#4a90e2' }}></i>
                  Account Settings
                </h2>
              </div>
              
              <div className="setting-group" style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block',
                  color: '#E0E0E0',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="Muhammad tarq"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#262626',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#E0E0E0',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(74, 144, 226, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>

              <div className="setting-group" style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block',
                  color: '#E0E0E0',
                  fontWeight: '500',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="mhamadtah548@gmail.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#262626',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#E0E0E0',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(74, 144, 226, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
              </div>

              <button style={{
                backgroundColor: '#4a90e2',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(74, 144, 226, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#357abd';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#4a90e2';
                e.target.style.transform = 'translateY(0px)';
              }}>
                💾 Save Changes
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{ 
                  color: '#E0E0E0', 
                  fontSize: '1.3rem', 
                  fontWeight: '600',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fas fa-bell" style={{ color: '#4a90e2' }}></i>
                  Notification Settings
                </h2>
              </div>
              
              <div className="setting-group" style={{ 
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#262626',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#E0E0E0',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  <input type="checkbox" defaultChecked style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#4a90e2'
                  }} />
                  Email notifications for workflow completions
                </label>
              </div>

              <div className="setting-group" style={{ 
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#262626',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#E0E0E0',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  <input type="checkbox" defaultChecked style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#4a90e2'
                  }} />
                  Push notifications for system alerts
                </label>
              </div>

              <div className="setting-group" style={{
                padding: '1rem',
                backgroundColor: '#262626',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#E0E0E0',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  <input type="checkbox" style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#4a90e2'
                  }} />
                  SMS notifications for critical errors
                </label>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <div className="card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{ 
                  color: '#E0E0E0', 
                  fontSize: '1.3rem', 
                  fontWeight: '600',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fas fa-shield-alt" style={{ color: '#4a90e2' }}></i>
                  Security Settings
                </h2>
              </div>
              
              <div className="setting-group" style={{ marginBottom: '2rem' }}>
                <h3 style={{ 
                  color: '#E0E0E0', 
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  🔒 Change Password
                </h3>
                
                <input
                  type="password"
                  placeholder="Current Password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#262626',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#E0E0E0',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(74, 144, 226, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
                
                <input
                  type="password"
                  placeholder="New Password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#262626',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#E0E0E0',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(74, 144, 226, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
                
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#262626',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#E0E0E0',
                    fontSize: '1rem',
                    marginBottom: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(74, 144, 226, 0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                />
                
                <button style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.transform = 'translateY(0px)';
                }}>
                  🔄 Update Password
                </button>
              </div>

              <div className="setting-group" style={{
                padding: '1rem',
                backgroundColor: '#262626',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#E0E0E0',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500'
                }}>
                  <input type="checkbox" style={{
                    width: '18px',
                    height: '18px',
                    accentColor: '#4a90e2'
                  }} />
                  Enable two-factor authentication
                </label>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="settings-section">
              <div className="card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{ 
                  color: '#E0E0E0', 
                  fontSize: '1.3rem', 
                  fontWeight: '600',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fas fa-key" style={{ color: '#4a90e2' }}></i>
                  API Keys
                </h2>
              </div>
              
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#262626',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '2rem'
              }}>
                <p style={{ 
                  color: '#a0a0a0', 
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  Manage your API keys for external integrations and services. These keys allow 
                  third-party applications to access your WorkflowPro account securely.
                </p>
                
                <button style={{
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#d97706';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f59e0b';
                  e.target.style.transform = 'translateY(0px)';
                }}>
                  🔑 Manage API Keys
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="settings-section">
              <div className="card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{ 
                  color: '#E0E0E0', 
                  fontSize: '1.3rem', 
                  fontWeight: '600',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className="fas fa-credit-card" style={{ color: '#4a90e2' }}></i>
                  Billing & Usage
                </h2>
              </div>
              
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#262626',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '2rem'
              }}>
                <p style={{ 
                  color: '#a0a0a0', 
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}>
                  View your billing information, usage statistics, and manage your subscription. 
                  Monitor your workflow executions, API calls, and service usage.
                </p>
                
                <button style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#059669';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#10b981';
                  e.target.style.transform = 'translateY(0px)';
                }}>
                  💰 View Billing Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;