import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Overview from './pages/Overview';
import Workflow from './pages/Workflow';
import Connections from './pages/Connections';
import { authAPI, tokenManager } from './api';
import './styles.css';

function Home() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (tokenManager.isLoggedIn()) {
          const response = await authAPI.getProfile();
          setUser(response.data.user);
        }
      } catch (error) {
        tokenManager.removeToken();
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const callBackend = async () => {
    setTestLoading(true);
    try {
      const response = await authAPI.testConnection();
      setMessage(response.data.message);
    } catch (error) {
      setMessage('❌ Could not connect to backend');
    } finally {
      setTestLoading(false);
    }
  };

  const logout = () => {
    tokenManager.removeToken();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading your dashboard...</div>
      </div>
    );
  }

  if (!tokenManager.isLoggedIn() || !user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1 className="welcome-text">Welcome back, {user.name || user.email}! 👋</h1>
          <p className="welcome-subtitle">
            You're successfully logged in to your secure dashboard
          </p>
          
          <div className="dashboard-actions">
            <Link to="/overview" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              🎯 My Workflows
            </Link>
            <Link to="/workflow" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              🔧 Workflow Builder
            </Link>
            <Link to="/connections" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              🔗 Connections
            </Link>
            <button 
              onClick={callBackend} 
              disabled={testLoading}
              className={`btn btn-secondary ${testLoading ? 'btn-loading' : ''}`}
            >
              {testLoading ? 'Testing...' : '🔗 Test Backend'}
            </button>
            <button onClick={logout} className="btn btn-primary">
              👋 Sign Out
            </button>
          </div>

          {message && (
            <div className={message.includes('❌') ? 'error-message' : 'success-message'} style={{ marginTop: '1rem' }}>
              {message}
            </div>
          )}
        </div>
        
        <div className="profile-card">
          <h2 className="profile-title">
            👤 Your Profile Information
          </h2>
          <div className="profile-info">
            <div className="profile-item">
              <span className="profile-label">User ID</span>
              <span className="profile-value">#{user.id}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Full Name</span>
              <span className="profile-value">{user.name || 'Not provided'}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Email Address</span>
              <span className="profile-value">{user.email}</span>
            </div>
            <div className="profile-item">
              <span className="profile-label">Member Since</span>
              <span className="profile-value">{new Date(user.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/overview" element={<Overview />} />
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/connections" element={<Connections />} />
      </Routes>
    </Router>
  );
}

export default App;
