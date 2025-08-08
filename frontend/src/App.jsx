import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Overview from './pages/Overview';
import WorkflowsOverview from './pages/WorkflowsOverview';
import Connections from './pages/Connections';
import WorkflowBuilder from './pages/WorkflowBuilder';
// import WorkflowNode from './pages/workflownode/WorkflowNode'; // Removed - using WorkflowBuilder instead
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import PublicShop from './pages/PublicShop';
// Import shop components using the modular router
import { 
  ShopDashboard, 
  AddProduct, 
  ManageProducts, 
  Analytics as ShopAnalytics,
  ViewStore,
  Categories,
  Privacy as ShopPrivacy,
  Terms as ShopTerms
} from './pages/shop';
import ProductDetail from './pages/shop/product-detail/ProductDetail';
import { authAPI, tokenManager } from './api';
import DashboardChatbot from './components/DashboardChatbot';
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
          console.log('Fetching user profile...');
          const response = await authAPI.getProfile();
          setUser(response.data.user);
          console.log('Profile loaded:', response.data.user);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        tokenManager.removeToken();
      } finally {
        setLoading(false);
      }
    };
    const timeout = setTimeout(() => {
      console.log('Profile fetch timeout - setting loading to false');
      setLoading(false);
    }, 3000);
    fetchProfile().then(() => {
      clearTimeout(timeout);
    });
    return () => clearTimeout(timeout);
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
            <Link to="/workflows" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              🎯 My Workflows
            </Link>
            <Link to="/workflow" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              🔧 Workflow Builder
            </Link>
            <Link to="/connections" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              🔗 Connections
            </Link>
            <Link to="/shop" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              🛍️ My Shop
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

          <div className="legal-links" style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/privacy" className="legal-link" style={{ textDecoration: 'none', marginRight: '2rem' }}>
              🛡️ Privacy Policy
            </Link>
            <Link to="/terms" className="legal-link" style={{ textDecoration: 'none' }}>
              📄 Terms of Service
            </Link>
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
      
      {/* Dashboard Chatbot */}
      <DashboardChatbot />
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
        <Route path="/workflows" element={<WorkflowsOverview />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/workflow" element={<WorkflowBuilder />} />
        <Route path="/workflow-builder" element={<WorkflowBuilder />} />
        {/* <Route path="/workflownode" element={<WorkflowNode />} /> */}
        <Route path="/shop" element={<ShopDashboard />} />
        <Route path="/shop/add-product" element={<AddProduct />} />
        <Route path="/shop/manage-products" element={<ManageProducts />} />
        <Route path="/shop/product/:productId" element={<ProductDetail />} />
        <Route path="/shop/analytics" element={<ShopAnalytics />} />
        <Route path="/shop/view-store" element={<ViewStore />} />
        <Route path="/shop/categories" element={<Categories />} />
        <Route path="/shop/privacy" element={<ShopPrivacy />} />
        <Route path="/shop/terms" element={<ShopTerms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/shop/:shopName" element={<PublicShop />} />
      </Routes>
    </Router>
  );
}

export default App;
