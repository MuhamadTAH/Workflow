import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import BillingDashboard from '../components/BillingDashboard';
import '../styles.css';
import '../styles/DashboardDark.css';

// Settings Components
const SettingsSection = ({ title, icon, description }) => (
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
        <i className={icon} style={{ color: '#4a90e2' }}></i>
        {title}
      </h2>
    </div>
    
    <div style={{
      padding: '1.5rem',
      backgroundColor: '#262626',
      borderRadius: '10px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
      <h3 style={{ color: '#E0E0E0', marginBottom: '0.5rem' }}>Coming Soon</h3>
      <p style={{ color: '#a0a0a0', margin: '0' }}>
        {description || 'This section is under development and will be available soon.'}
      </p>
    </div>
  </div>
);

const GeneralSettings = () => <SettingsSection title="General" icon="fas fa-cog" description="General application settings and preferences" />;
const AccountSettings = () => {
  // Mock user data (same as in main dashboard)
  const user = {
    id: 2,
    name: "Muhammad tarq", 
    email: "mhamadtah548@gmail.com",
    created_at: "2024-01-15T08:30:00Z" // Mock creation date
  };

  return (
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
          Account Information
        </h2>
      </div>
      
      {/* Profile Information */}
      <div style={{
        backgroundColor: '#262626',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ color: '#E0E0E0', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
          Profile Details
        </h3>
        
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <span style={{ color: '#A0A0A0', fontWeight: '500' }}>User ID</span>
            <span style={{ color: '#E0E0E0', fontWeight: '600' }}>#{user.id}</span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <span style={{ color: '#A0A0A0', fontWeight: '500' }}>Full Name</span>
            <span style={{ color: '#E0E0E0', fontWeight: '600' }}>{user.name || 'Not provided'}</span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <span style={{ color: '#A0A0A0', fontWeight: '500' }}>Email</span>
            <span style={{ color: '#E0E0E0', fontWeight: '600' }}>{user.email}</span>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <span style={{ color: '#A0A0A0', fontWeight: '500' }}>Member Since</span>
            <span style={{ color: '#E0E0E0', fontWeight: '600' }}>
              {new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div style={{
        backgroundColor: '#262626',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem'
      }}>
        <h3 style={{ color: '#E0E0E0', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
          Account Actions
        </h3>
        
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: '#1a1a1a',
            color: '#E0E0E0',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '0.95rem',
            fontWeight: '500',
            textAlign: 'left'
          }}>
            <i className="fas fa-edit" style={{ color: '#4a90e2', width: '20px', textAlign: 'center' }}></i>
            Edit Profile
          </button>
          
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: '#1a1a1a',
            color: '#E0E0E0',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '0.95rem',
            fontWeight: '500',
            textAlign: 'left'
          }}>
            <i className="fas fa-key" style={{ color: '#D4AF37', width: '20px', textAlign: 'center' }}></i>
            Change Password
          </button>
          
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.75rem 1rem',
            backgroundColor: '#1a1a1a',
            color: '#E0E0E0',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '0.95rem',
            fontWeight: '500',
            textAlign: 'left'
          }}>
            <i className="fas fa-download" style={{ color: '#10b981', width: '20px', textAlign: 'center' }}></i>
            Export Account Data
          </button>
        </div>
      </div>
    </div>
  );
};
const NotificationSettings = () => <SettingsSection title="Notifications" icon="fas fa-bell" description="Configure notification preferences and alerts" />;
const SecuritySettings = () => <SettingsSection title="Security" icon="fas fa-shield-alt" description="Security settings and two-factor authentication" />;
const APISettings = () => <SettingsSection title="API Keys" icon="fas fa-key" description="Manage your API keys and integrations" />;

function Settings() {
  const { theme, colors } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

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
         style={{ backgroundColor: '#1a1a1a', color: '#E0E0E0', minHeight: '100vh' }}>
      
      {/* Settings Navigation - Fixed Left Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '280px',
        height: '100vh',
        backgroundColor: '#1E1E1E',
        borderRight: '1px solid #333333',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem 0',
        zIndex: 1000,
        overflowY: 'auto'
      }}>
        {/* Sidebar Logo/Header */}
        <div style={{
          padding: '0 1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#E0E0E0',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#D4AF37',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              ⚙️
            </div>
            <span>Settings</span>
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1rem',
              margin: '0.25rem 0',
              backgroundColor: 'transparent',
              color: '#A0A0A0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.95rem',
              fontWeight: '500',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2C2C2C';
              e.target.style.color = '#D4AF37';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#A0A0A0';
            }}
          >
            <i className="fas fa-arrow-left" style={{ 
              color: 'inherit',
              fontSize: '1.1rem',
              width: '20px',
              textAlign: 'center'
            }}></i>
            Back to Dashboard
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ padding: '0 1rem', flex: 1 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'general') {
                  navigate('/settings');
                } else {
                  navigate(`/settings/${tab.id}`);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem 1rem',
                margin: '0.25rem 0',
                backgroundColor: (location.pathname === '/settings' && tab.id === 'general') || location.pathname === `/settings/${tab.id}` ? '#2C2C2C' : 'transparent',
                color: (location.pathname === '/settings' && tab.id === 'general') || location.pathname === `/settings/${tab.id}` ? '#D4AF37' : '#A0A0A0',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem',
                fontWeight: '500',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                const isActive = (location.pathname === '/settings' && tab.id === 'general') || location.pathname === `/settings/${tab.id}`;
                if (!isActive) {
                  e.target.style.backgroundColor = '#2C2C2C';
                  e.target.style.color = '#D4AF37';
                }
              }}
              onMouseLeave={(e) => {
                const isActive = (location.pathname === '/settings' && tab.id === 'general') || location.pathname === `/settings/${tab.id}`;
                if (!isActive) {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#A0A0A0';
                }
              }}
            >
              <i className={tab.icon} style={{ 
                color: (location.pathname === '/settings' && tab.id === 'general') || location.pathname === `/settings/${tab.id}` ? '#D4AF37' : '#A0A0A0',
                fontSize: '1.1rem',
                width: '20px',
                textAlign: 'center'
              }}></i>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content - Adjusted for sidebar */}
      <div style={{ marginLeft: '0px' }}>

        <div className="dashboard-content" style={{ 
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem 2rem 2rem'
        }}>
          {/* Settings Content */}
          <div className="dashboard-card" style={{
            backgroundColor: '#323232',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)'
          }}>
            <Routes>
              <Route path="/" element={<GeneralSettings />} />
              <Route path="/account" element={<AccountSettings />} />
              <Route path="/notifications" element={<NotificationSettings />} />
              <Route path="/security" element={<SecuritySettings />} />
              <Route path="/api" element={<APISettings />} />
              <Route path="/billing" element={<BillingDashboard />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;