import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles.css';

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
    <div className={`settings-page ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`} 
         style={{ backgroundColor: colors.primaryBg, color: colors.primaryText, minHeight: '100vh', paddingLeft: '80px' }}>
      
      {/* Header */}
      <div className="settings-header" style={{ 
        backgroundColor: colors.secondaryBg, 
        borderBottom: `1px solid ${colors.border}`,
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: '600', 
          margin: '0 0 0.5rem 0',
          color: colors.primaryText 
        }}>
          ⚙️ Settings
        </h1>
        <p style={{ 
          color: colors.secondaryText, 
          fontSize: '1rem',
          margin: 0 
        }}>
          Manage your account preferences and application settings
        </p>
      </div>

      <div className="settings-container" style={{ 
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem 2rem 2rem',
        display: 'grid',
        gridTemplateColumns: '250px 1fr',
        gap: '2rem'
      }}>
        
        {/* Settings Navigation */}
        <div className="settings-nav" style={{
          backgroundColor: colors.secondaryBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '1.5rem',
          height: 'fit-content'
        }}>
          <h3 style={{ 
            color: colors.primaryText,
            fontSize: '1.1rem',
            fontWeight: '600',
            margin: '0 0 1rem 0'
          }}>
            Categories
          </h3>
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
                  backgroundColor: activeTab === tab.id ? colors.accent + '20' : 'transparent',
                  color: activeTab === tab.id ? colors.accent : colors.secondaryText,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = colors.border;
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <i className={tab.icon}></i>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="settings-content" style={{
          backgroundColor: colors.secondaryBg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '2rem'
        }}>
          {activeTab === 'general' && (
            <div className="settings-section">
              <h2 style={{ color: colors.primaryText, marginBottom: '1.5rem' }}>General Settings</h2>
              
              <div className="setting-group" style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block',
                  color: colors.primaryText,
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Application Name
                </label>
                <input
                  type="text"
                  defaultValue="WorkflowPro"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: colors.primaryBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.primaryText,
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div className="setting-group" style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block',
                  color: colors.primaryText,
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Default Language
                </label>
                <select style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: colors.primaryBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  color: colors.primaryText,
                  fontSize: '1rem'
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
                  color: colors.primaryText,
                  cursor: 'pointer'
                }}>
                  <input type="checkbox" defaultChecked />
                  Enable auto-save for workflows
                </label>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <h2 style={{ color: colors.primaryText, marginBottom: '1.5rem' }}>Account Settings</h2>
              
              <div className="setting-group" style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block',
                  color: colors.primaryText,
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Full Name
                </label>
                <input
                  type="text"
                  defaultValue="Muhammad tarq"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: colors.primaryBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.primaryText,
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div className="setting-group" style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block',
                  color: colors.primaryText,
                  fontWeight: '600',
                  marginBottom: '0.5rem'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  defaultValue="mhamadtah548@gmail.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: colors.primaryBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.primaryText,
                    fontSize: '1rem'
                  }}
                />
              </div>

              <button style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2 style={{ color: colors.primaryText, marginBottom: '1.5rem' }}>Notification Settings</h2>
              
              <div className="setting-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: colors.primaryText,
                  cursor: 'pointer'
                }}>
                  <input type="checkbox" defaultChecked />
                  Email notifications for workflow completions
                </label>
              </div>

              <div className="setting-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: colors.primaryText,
                  cursor: 'pointer'
                }}>
                  <input type="checkbox" defaultChecked />
                  Push notifications for system alerts
                </label>
              </div>

              <div className="setting-group">
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: colors.primaryText,
                  cursor: 'pointer'
                }}>
                  <input type="checkbox" />
                  SMS notifications for critical errors
                </label>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h2 style={{ color: colors.primaryText, marginBottom: '1.5rem' }}>Security Settings</h2>
              
              <div className="setting-group" style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: colors.primaryText, marginBottom: '1rem' }}>Change Password</h3>
                
                <input
                  type="password"
                  placeholder="Current Password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: colors.primaryBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.primaryText,
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}
                />
                
                <input
                  type="password"
                  placeholder="New Password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: colors.primaryBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.primaryText,
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}
                />
                
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: colors.primaryBg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.primaryText,
                    fontSize: '1rem',
                    marginBottom: '1rem'
                  }}
                />
                
                <button style={{
                  backgroundColor: '#10B981',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Update Password
                </button>
              </div>

              <div className="setting-group">
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: colors.primaryText,
                  cursor: 'pointer'
                }}>
                  <input type="checkbox" />
                  Enable two-factor authentication
                </label>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="settings-section">
              <h2 style={{ color: colors.primaryText, marginBottom: '1.5rem' }}>API Keys</h2>
              <p style={{ color: colors.secondaryText, marginBottom: '2rem' }}>
                Manage your API keys for external integrations and services.
              </p>
              
              <button style={{
                backgroundColor: '#F59E0B',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                🔑 Manage API Keys
              </button>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="settings-section">
              <h2 style={{ color: colors.primaryText, marginBottom: '1.5rem' }}>Billing & Usage</h2>
              <p style={{ color: colors.secondaryText, marginBottom: '2rem' }}>
                View your billing information, usage statistics, and manage your subscription.
              </p>
              
              <button style={{
                backgroundColor: '#10B981',
                color: 'white',
                padding: '0.75rem 1.5rem',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                💰 View Billing Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;