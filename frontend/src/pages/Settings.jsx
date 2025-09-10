import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import BillingDashboard from '../components/BillingDashboard';
import APIKeysDashboard from '../components/APIKeysDashboard';
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

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const validatePasswords = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordUpdate = async () => {
    if (!validatePasswords()) return;
    
    setIsUpdating(true);
    try {
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock current password verification (simulate backend check)
      // In real implementation, backend would verify current password against database
      // For demo purposes, we'll simulate a more realistic password system
      const mockUserPasswords = {
        "password": true,
        "123456": true,
        "admin": true,
        "user123": true,
        "mypassword": true,
        "currentpass123": true  // Keep the old one for backwards compatibility
      };
      
      if (!mockUserPasswords[passwordData.currentPassword]) {
        setErrors({ currentPassword: 'Current password is incorrect' });
        setIsUpdating(false);
        return;
      }
      
      // Additional password strength validation (server-side style)
      const strength = checkPasswordStrength(passwordData.newPassword);
      if (strength < 3) {
        setErrors({ newPassword: 'Password is too weak. Please choose a stronger password.' });
        setIsUpdating(false);
        return;
      }
      
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_BASE_URL}/api/user/change-password`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify({
      //     currentPassword: passwordData.currentPassword,
      //     newPassword: passwordData.newPassword
      //   })
      // });
      // 
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   if (response.status === 401) {
      //     setErrors({ currentPassword: 'Current password is incorrect' });
      //   } else {
      //     alert(errorData.message || 'Failed to update password');
      //   }
      //   return;
      // }
      
      // Mock success only if all validations pass
      alert('Password updated successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({});
    } catch (error) {
      alert('Failed to update password. Please try again.');
    } finally {
      setIsUpdating(false);
    }
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
          
          <button 
            onClick={() => setShowPasswordModal(true)}
            style={{
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
            }}
          >
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

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            backgroundColor: '#323232',
            borderRadius: '12px',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            margin: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ 
                color: '#E0E0E0', 
                margin: '0 0 0.5rem 0', 
                fontSize: '1.2rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <i className="fas fa-key" style={{ color: '#D4AF37' }}></i>
                Change Password
              </h3>
              <p style={{ color: '#A0A0A0', margin: '0', fontSize: '0.9rem' }}>
                Enter your current password and choose a new secure password
              </p>
              {/* Demo helper - Remove in production */}
              <div style={{ 
                backgroundColor: '#1a1a1a', 
                padding: '0.75rem', 
                borderRadius: '6px', 
                marginTop: '0.75rem',
                border: '1px solid rgba(255, 193, 7, 0.3)'
              }}>
                <p style={{ color: '#ffc107', margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '500' }}>
                  🔧 Demo Mode - Try any of these passwords:
                </p>
                <p style={{ color: '#ffc107', margin: '0', fontSize: '0.75rem', opacity: '0.8' }}>
                  password • 123456 • admin • user123 • mypassword • currentpass123
                </p>
              </div>
            </div>

            {/* Current Password */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#E0E0E0', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }));
                  if (errors.currentPassword) setErrors(prev => ({ ...prev, currentPassword: '' }));
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#1a1a1a',
                  border: errors.currentPassword ? '1px solid #f44336' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#E0E0E0',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your current password"
              />
              {errors.currentPassword && (
                <p style={{ color: '#f44336', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                  {errors.currentPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#E0E0E0', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                New Password
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => {
                  const value = e.target.value;
                  setPasswordData(prev => ({ ...prev, newPassword: value }));
                  setPasswordStrength(checkPasswordStrength(value));
                  if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: '' }));
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#1a1a1a',
                  border: errors.newPassword ? '1px solid #f44336' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#E0E0E0',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your new password"
              />
              
              {/* Password Strength Indicator */}
              {passwordData.newPassword && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map(level => (
                      <div
                        key={level}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          backgroundColor: level <= passwordStrength 
                            ? passwordStrength <= 2 ? '#f44336' 
                              : passwordStrength <= 3 ? '#ff9800' 
                              : '#4caf50'
                            : '#1a1a1a'
                        }}
                      ></div>
                    ))}
                  </div>
                  <p style={{ 
                    color: passwordStrength <= 2 ? '#f44336' : passwordStrength <= 3 ? '#ff9800' : '#4caf50',
                    fontSize: '0.8rem',
                    margin: '0'
                  }}>
                    {passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong'} password
                  </p>
                </div>
              )}
              
              {errors.newPassword && (
                <p style={{ color: '#f44336', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#E0E0E0', fontSize: '0.9rem', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => {
                  setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }));
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#1a1a1a',
                  border: errors.confirmPassword ? '1px solid #f44336' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#E0E0E0',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Confirm your new password"
              />
              {errors.confirmPassword && (
                <p style={{ color: '#f44336', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div style={{ 
              backgroundColor: '#1a1a1a', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <p style={{ color: '#A0A0A0', fontSize: '0.8rem', margin: '0 0 0.5rem 0', fontWeight: '500' }}>
                Password must contain:
              </p>
              <ul style={{ margin: '0', paddingLeft: '1rem', color: '#8E8E8E', fontSize: '0.8rem' }}>
                <li>At least 8 characters</li>
                <li>One lowercase letter (a-z)</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One number (0-9)</li>
                <li>One special character (!@#$%^&*)</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setErrors({});
                  setPasswordStrength(0);
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'transparent',
                  color: '#A0A0A0',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordUpdate}
                disabled={isUpdating}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isUpdating ? '#1a1a1a' : '#D4AF37',
                  color: isUpdating ? '#8E8E8E' : '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isUpdating && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #8E8E8E',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
                {isUpdating ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}
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
              <Route path="/api" element={<APIKeysDashboard />} />
              <Route path="/billing" element={<BillingDashboard />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;