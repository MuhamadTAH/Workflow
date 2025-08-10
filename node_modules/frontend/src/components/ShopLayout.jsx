import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaStore, FaPlus, FaEdit, FaEye, FaWhatsapp, FaTelegram, FaEnvelope, FaHome, FaBox, FaChartBar, FaCog, FaGlobe, FaTags, FaUsers, FaBars, FaTimes } from 'react-icons/fa';

function ShopLayout({ children, title, subtitle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const showComingSoon = (feature) => {
    setSuccessMessage(`${feature} feature coming soon!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="shop-dashboard">
      {/* Sidebar Toggle Button */}
      <button 
        className={`sidebar-toggle ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        onClick={toggleSidebar}
        title={sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
      >
        {sidebarOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar Navigation */}
      <div className={`shop-sidebar ${sidebarOpen ? 'sidebar-visible' : 'sidebar-hidden'}`}>
        <div className="sidebar-header">
          <FaStore className="sidebar-logo" />
          <h3>Shop Manager</h3>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <h4>Main</h4>
            <button 
              className={`nav-item ${isActivePage('/') ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              <FaHome /> Dashboard
            </button>
            <button 
              className={`nav-item ${isActivePage('/shop') ? 'active' : ''}`}
              onClick={() => navigate('/shop')}
            >
              <FaStore /> My Shop
            </button>
          </div>
          
          <div className="nav-section">
            <h4>Products</h4>
            <button 
              className={`nav-item ${isActivePage('/shop/add-product') ? 'active' : ''}`}
              onClick={() => navigate('/shop/add-product')}
            >
              <FaPlus /> Add Product
            </button>
            <button 
              className={`nav-item ${isActivePage('/shop/manage-products') ? 'active' : ''}`}
              onClick={() => navigate('/shop/manage-products')}
            >
              <FaBox /> Manage Products
            </button>
            <button 
              className={`nav-item ${isActivePage('/shop/categories') ? 'active' : ''}`}
              onClick={() => showComingSoon('Categories')}
            >
              <FaTags /> Categories
            </button>
          </div>
          
          <div className="nav-section">
            <h4>Store</h4>
            <button 
              className={`nav-item ${isActivePage('/shop/view-store') ? 'active' : ''}`}
              onClick={() => navigate('/shop/view-store')}
            >
              <FaGlobe /> View Store
            </button>
            <button 
              className={`nav-item ${isActivePage('/shop/analytics') ? 'active' : ''}`}
              onClick={() => navigate('/shop/analytics')}
            >
              <FaChartBar /> Analytics
            </button>
            <button 
              className={`nav-item ${isActivePage('/shop/customers') ? 'active' : ''}`}
              onClick={() => navigate('/shop/customers')}
            >
              <FaUsers /> Customers
            </button>
          </div>
          
          <div className="nav-section">
            <h4>Settings</h4>
            <button 
              className={`nav-item ${isActivePage('/shop/settings') ? 'active' : ''}`}
              onClick={() => navigate('/shop/settings')}
            >
              <FaCog /> Shop Settings
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className={`shop-main-content ${sidebarOpen ? 'content-with-sidebar' : 'content-full-width'}`}>
        <div className="shop-dashboard-container">
          {title && (
            <div className="shop-dashboard-header">
              <h1 className="shop-dashboard-title">
                <FaStore className="shop-icon" />
                {title}
              </h1>
              {subtitle && (
                <p className="shop-dashboard-subtitle">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
}

export default ShopLayout;