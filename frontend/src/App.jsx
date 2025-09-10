import { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import WorkflowsOverview from './pages/WorkflowsOverview';
import Connections from './pages/Connections';
import InstagramCallback from './pages/InstagramCallback';
import WorkflowBuilder from './pages/WorkflowBuilder';
import LanguageSwitcher from './components/LanguageSwitcher';
import LeftSidebar from './components/LeftSidebar';
import ThemeToggle from './components/ThemeToggle';
// Initialize i18n
import './i18n/i18n';
import './i18n/rtl.css';
// import WorkflowNode from './pages/workflownode/WorkflowNode'; // Removed - using WorkflowBuilder instead
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import PublicShop from './pages/PublicShop';
import TelegramListener from './pages/TelegramListener';
import WhatsAppReceiver from './pages/WhatsAppReceiver';
import WhatsAppReceiverTest from './pages/WhatsAppReceiverTest';
import SimpleInstagramWebhook from './pages/SimpleInstagramWebhook';
import SimpleMessengerWebhook from './pages/SimpleMessengerWebhook';
import ChatWidget from './pages/ChatWidget';
import BillingDashboard from './components/BillingDashboard';
import AdminDashboard from './components/AdminDashboard';
import APIKeysDashboard from './components/APIKeysDashboard';
import Settings from './pages/Settings';
import TelegramActivity from './components/TelegramActivity';
import WhatsAppActivity from './components/WhatsAppActivity';
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
import './styles.css';
import './styles/AuthStyles.css';
import './styles/DashboardDark.css';
import './components/LeftSidebar.css';

function Home() {
  const { t } = useTranslation();
  const { theme, colors } = useTheme();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState(false);
  const [gradientVariant, setGradientVariant] = useState(1);

  // Rotate gradient variants for freshness
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientVariant(prev => (prev >= 3 ? 1 : prev + 1));
    }, 30000); // Change every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (tokenManager.isLoggedIn()) {
          console.log('Fetching user profile...');
          // TODO: Integrate with n8n user management
          // For now, use mock user data
          const mockUser = {
            id: 2,
            name: "Muhammad tarq", 
            email: "mhamadtah548@gmail.com"
          };
          setUser(mockUser);
          console.log('Profile loaded (mock):', mockUser);
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
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your professional dashboard...</p>
      </div>
    );
  }

  if (!tokenManager.isLoggedIn() || !user) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <LeftSidebar />
      <div className={`professional-dashboard ${theme === 'dark' ? 'variant-1' : 'light-theme'}`} style={{ backgroundColor: colors.primaryBg, color: colors.primaryText }}>
        {/* Top Navigation Bar */}
      <nav className="dashboard-nav" style={{ backgroundColor: colors.secondaryBg, borderBottomColor: colors.border }}>
        <div className="nav-container">
          <div className="nav-brand">
            <h2 style={{ color: colors.primaryText }}>⚡ WorkflowPro</h2>
          </div>
          <div className="nav-user">
            <LanguageSwitcher className="mr-4" />
            <ThemeToggle className="mr-3" />
            <div className="user-avatar">
              {(user.name || user.email).charAt(0).toUpperCase()}
            </div>
            <span className="user-name" style={{ color: colors.primaryText }}>{user.name || user.email}</span>
            <button onClick={logout} className="logout-btn">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* Header Section */}
        <header className="dashboard-hero">
          <div className="hero-content">
            <h1 className="hero-title">
              🚀 AI Marketing Dashboard - UPDATED!
            </h1>
            <p className="hero-subtitle">
              Manage your automated marketing workflows and e-commerce operations
            </p>
            <div className="hero-actions" style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
              <Link 
                to="/admin" 
                className="hero-btn admin-btn"
                style={{ 
                  backgroundColor: '#6366f1',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#4f46e5';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#6366f1';
                  e.target.style.transform = 'translateY(0px)';
                }}
              >
                📊 Admin Dashboard
              </Link>
            </div>
          </div>
        </header>


        {/* Main Content Grid */}
        <div className="content-grid">

          {/* Recent Activity */}
          <div className="dashboard-card recent-activity">
            <div className="card-header">
              <h3><i className="fas fa-history"></i> Recent Activity</h3>
              <Link to="/workflows" className="view-all-link">View All</Link>
            </div>
            <div className="activity-list">
              <TelegramActivity />
            </div>
          </div>

          {/* Profile Information */}
          <div className="dashboard-card profile-section">
            <div className="card-header">
              <h3><i className="fas fa-user"></i> Profile Information</h3>
            </div>
            <div className="profile-details">
              <div className="profile-row">
                <span className="profile-key">User ID</span>
                <span className="profile-value">#{user.id}</span>
              </div>
              <div className="profile-row">
                <span className="profile-key">Full Name</span>
                <span className="profile-value">{user.name || 'Not provided'}</span>
              </div>
              <div className="profile-row">
                <span className="profile-key">Email</span>
                <span className="profile-value">{user.email}</span>
              </div>
              <div className="profile-row">
                <span className="profile-key">Member Since</span>
                <span className="profile-value">
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`status-alert ${message.includes('❌') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        {/* Footer */}
        <footer className="dashboard-footer">
          <div className="footer-content">
            <div className="footer-links">
              <Link to="/privacy" className="footer-link">
                <i className="fas fa-shield-alt"></i> Privacy Policy
              </Link>
              <Link to="/terms" className="footer-link">
                <i className="fas fa-file-contract"></i> Terms of Service
              </Link>
            </div>
            <p className="footer-text">
              &copy; 2025 WorkflowPro. Built for professionals who automate.
            </p>
          </div>
        </footer>
      </div>
    </div>

    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/workflows" element={<WorkflowsOverview />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/connections/callback/instagram" element={<InstagramCallback />} />
        <Route path="/workflow" element={<WorkflowBuilder />} />
        <Route path="/workflow-builder" element={<WorkflowBuilder />} />
        {/* <Route path="/workflownode" element={<WorkflowNode />} /> */}
        <Route path="/shop" element={<Suspense fallback={<div>Loading...</div>}><ShopDashboard /></Suspense>} />
        <Route path="/shop/add-product" element={<Suspense fallback={<div>Loading...</div>}><AddProduct /></Suspense>} />
        <Route path="/shop/manage-products" element={<Suspense fallback={<div>Loading...</div>}><ManageProducts /></Suspense>} />
        <Route path="/shop/product/:productId" element={<ProductDetail />} />
        <Route path="/shop/analytics" element={<Suspense fallback={<div>Loading...</div>}><ShopAnalytics /></Suspense>} />
        <Route path="/shop/view-store" element={<Suspense fallback={<div>Loading...</div>}><ViewStore /></Suspense>} />
        <Route path="/shop/categories" element={<Suspense fallback={<div>Loading...</div>}><Categories /></Suspense>} />
        <Route path="/shop/privacy" element={<Suspense fallback={<div>Loading...</div>}><ShopPrivacy /></Suspense>} />
        <Route path="/shop/terms" element={<Suspense fallback={<div>Loading...</div>}><ShopTerms /></Suspense>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/telegram-listener" element={<TelegramListener />} />
        <Route path="/whatsapp-receiver" element={<WhatsAppReceiver />} />
        <Route path="/whatsapp-test" element={<WhatsAppReceiverTest />} />
        <Route path="/instagram-comments" element={<SimpleInstagramWebhook />} />
        <Route path="/messenger-comments" element={<SimpleMessengerWebhook />} />
        <Route path="/chat-widget" element={<ChatWidget />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/settings/*" element={<Settings />} />
        <Route path="/shop/:shopName" element={<PublicShop />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
