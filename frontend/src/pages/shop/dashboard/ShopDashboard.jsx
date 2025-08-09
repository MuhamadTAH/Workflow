import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { tokenManager, shopAPI } from '../../../api';
import { FaStore, FaPlus, FaEdit, FaEye, FaCopy, FaWhatsapp, FaTelegram, FaEnvelope } from 'react-icons/fa';
import ShopLayout from '../components/ShopLayout/ShopLayout';
import './ShopDashboard.css';

function ShopDashboard() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    displayName: '',
    description: '',
    contactMethod: 'whatsapp',
    contactValue: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Enhanced shop metrics
  const [shopMetrics] = useState({
    totalRevenue: 12450,
    monthlyOrders: 89,
    avgOrderValue: 140,
    conversionRate: 3.2,
    topProduct: 'Premium Package',
    recentSales: [
      { id: 1, product: 'Premium Package', amount: 299, time: '2 hours ago' },
      { id: 2, product: 'Starter Bundle', amount: 99, time: '5 hours ago' },
      { id: 3, product: 'Professional Suite', amount: 199, time: '1 day ago' }
    ]
  });

  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    console.log('Loading shop data...');
    try {
      const response = await shopAPI.getMyShop();
      console.log('Shop API response:', response);
      setShop(response.data.shop);
      if (response.data.shop) {
        setFormData({
          shopName: response.data.shop.shopName,
          displayName: response.data.shop.displayName,
          description: response.data.shop.description || '',
          contactMethod: response.data.shop.contactMethod,
          contactValue: response.data.shop.contactValue
        });
      }
    } catch (error) {
      console.error('Error loading shop:', error);
      setError('Unable to connect to backend. Please check if the server is running.');
      setShop(null);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const response = await shopAPI.createShop(formData);
      setShop(response.data.shop);
      setShowCreateForm(false);
      setSuccessMessage('Shop created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Shop creation error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.statusText || 
                          error.message || 
                          'Failed to create shop';
      setError(`Error: ${errorMessage}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateShop = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const updateData = {
        displayName: formData.displayName,
        description: formData.description,
        contactMethod: formData.contactMethod,
        contactValue: formData.contactValue
      };
      
      await shopAPI.updateShop(shop.id, updateData);
      await loadShop(); // Reload shop data
      setShowEditForm(false);
      setSuccessMessage('Shop updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update shop');
    } finally {
      setFormLoading(false);
    }
  };

  const copyShopUrl = () => {
    if (shop?.shopUrl) {
      navigator.clipboard.writeText(shop.shopUrl);
      setSuccessMessage('Shop URL copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const getContactIcon = (method) => {
    switch (method) {
      case 'whatsapp': return <FaWhatsapp className="contact-icon whatsapp" />;
      case 'telegram': return <FaTelegram className="contact-icon telegram" />;
      case 'email': return <FaEnvelope className="contact-icon email" />;
      default: return <FaEnvelope className="contact-icon" />;
    }
  };

  const getContactLabel = (method) => {
    switch (method) {
      case 'whatsapp': return 'WhatsApp Number';
      case 'telegram': return 'Telegram Username';
      case 'email': return 'Email Address';
      default: return 'Contact';
    }
  };

  const getContactPlaceholder = (method) => {
    switch (method) {
      case 'whatsapp': return '+1234567890';
      case 'telegram': return '@username';
      case 'email': return 'contact@example.com';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading your shop...</div>
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
          If this takes too long, the backend might be starting up...
        </div>
      </div>
    );
  }

  return (
    <ShopLayout title="My Shop" subtitle="Manage your online store and products">
      <div>

        {error && (
          <div className="error-message">
            {error}
            {error.includes('Unable to connect') && (
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setError('');
                  setLoading(true);
                  loadShop();
                }}
                style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }}
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {!shop ? (
          // No shop exists - show create form
          <div className="no-shop-container">
            <div className="no-shop-card">
              <FaStore className="no-shop-icon" />
              <h2>Create Your Shop</h2>
              <p>You don't have a shop yet. Create one to start selling your products!</p>
              
              {!showCreateForm ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateForm(true)}
                >
                  <FaPlus /> Create My Shop
                </button>
              ) : (
                <form onSubmit={handleCreateShop} className="shop-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Shop Name (URL)*</label>
                      <input
                        type="text"
                        name="shopName"
                        value={formData.shopName}
                        onChange={handleInputChange}
                        placeholder="myshop (letters, numbers, -, _ only)"
                        required
                        className="form-input"
                      />
                      <small>This will be your shop URL: yourdomain.com/shop/{formData.shopName}</small>
                    </div>
                    <div className="form-group">
                      <label>Display Name*</label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        placeholder="My Awesome Shop"
                        required
                        className="form-input"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Tell customers about your shop..."
                      className="form-textarea"
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Contact Method*</label>
                      <select
                        name="contactMethod"
                        value={formData.contactMethod}
                        onChange={handleInputChange}
                        className="form-select"
                        required
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="telegram">Telegram</option>
                        <option value="email">Email</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>{getContactLabel(formData.contactMethod)}*</label>
                      <input
                        type="text"
                        name="contactValue"
                        value={formData.contactValue}
                        onChange={handleInputChange}
                        placeholder={getContactPlaceholder(formData.contactMethod)}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={formLoading}
                    >
                      {formLoading ? 'Creating...' : 'Create Shop'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          // Shop exists - show professional dashboard
          <div className="professional-shop-dashboard">
            {/* Hero Section with Shop Info */}
            <div className="shop-hero-card">
              <div className="shop-hero-content">
                <div className="shop-info-main">
                  <h1 className="shop-hero-title">
                    💎 {shop.displayName}
                  </h1>
                  <p className="shop-hero-subtitle">Your premium online store</p>
                  <div className="shop-url-section">
                    <span className="url-label">Store URL:</span>
                    <span className="url-text">{shop.shopUrl}</span>
                    <button className="premium-copy-btn" onClick={copyShopUrl} title="Copy URL">
                      <FaCopy />
                    </button>
                  </div>
                  {shop.description && (
                    <p className="shop-description">{shop.description}</p>
                  )}
                </div>
                <div className="shop-hero-actions">
                  <button
                    className="btn btn-premium"
                    onClick={() => navigate('/shop/view-store')}
                  >
                    <FaEye /> View Store
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowEditForm(true)}
                  >
                    <FaEdit /> Edit Shop
                  </button>
                </div>
              </div>
            </div>

            {/* Revenue Metrics Grid */}
            <div className="revenue-metrics-grid">
              <div className="metric-card revenue-card">
                <div className="metric-icon revenue">
                  <i className="fas fa-dollar-sign"></i>
                </div>
                <div className="metric-content">
                  <h3 className="metric-number">${shopMetrics.totalRevenue.toLocaleString()}</h3>
                  <p className="metric-label">Total Revenue</p>
                  <span className="metric-change positive">+24% this month</span>
                </div>
              </div>

              <div className="metric-card orders-card">
                <div className="metric-icon orders">
                  <i className="fas fa-shopping-cart"></i>
                </div>
                <div className="metric-content">
                  <h3 className="metric-number">{shopMetrics.monthlyOrders}</h3>
                  <p className="metric-label">Monthly Orders</p>
                  <span className="metric-change positive">+12 new orders</span>
                </div>
              </div>

              <div className="metric-card value-card">
                <div className="metric-icon value">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="metric-content">
                  <h3 className="metric-number">${shopMetrics.avgOrderValue}</h3>
                  <p className="metric-label">Avg Order Value</p>
                  <span className="metric-change positive">+$15 increase</span>
                </div>
              </div>

              <div className="metric-card conversion-card">
                <div className="metric-icon conversion">
                  <i className="fas fa-target"></i>
                </div>
                <div className="metric-content">
                  <h3 className="metric-number">{shopMetrics.conversionRate}%</h3>
                  <p className="metric-label">Conversion Rate</p>
                  <span className="metric-change positive">Above average</span>
                </div>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="shop-dashboard-grid">
              {/* Quick Actions Panel */}
              <div className="dashboard-panel quick-actions-panel">
                <div className="panel-header">
                  <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
                </div>
                <div className="premium-actions-grid">
                  <button 
                    className="premium-action-btn add-product"
                    onClick={() => navigate('/shop/add-product')}
                  >
                    <i className="fas fa-plus"></i>
                    <span>Add Product</span>
                    <div className="action-badge">HOT</div>
                  </button>
                  <button 
                    className="premium-action-btn manage-products"
                    onClick={() => navigate('/shop/manage-products')}
                  >
                    <i className="fas fa-boxes"></i>
                    <span>Manage Products</span>
                  </button>
                  <button 
                    className="premium-action-btn analytics"
                    onClick={() => navigate('/shop/analytics')}
                  >
                    <i className="fas fa-chart-bar"></i>
                    <span>Analytics</span>
                  </button>
                  <button 
                    className="premium-action-btn categories"
                    onClick={() => navigate('/shop/categories')}
                  >
                    <i className="fas fa-tags"></i>
                    <span>Categories</span>
                  </button>
                </div>
              </div>

              {/* Recent Sales Activity */}
              <div className="dashboard-panel sales-panel">
                <div className="panel-header">
                  <h3><i className="fas fa-money-bill-wave"></i> Recent Sales</h3>
                  <span className="sales-badge">{shopMetrics.recentSales.length} recent</span>
                </div>
                <div className="sales-list">
                  {shopMetrics.recentSales.map(sale => (
                    <div key={sale.id} className="sale-item">
                      <div className="sale-product">
                        <div className="product-icon">💎</div>
                        <div className="product-info">
                          <span className="product-name">{sale.product}</span>
                          <span className="sale-time">{sale.time}</span>
                        </div>
                      </div>
                      <div className="sale-amount">${sale.amount}</div>
                    </div>
                  ))}
                </div>
                <button className="view-all-sales-btn">
                  View All Sales <i className="fas fa-arrow-right"></i>
                </button>
              </div>

              {/* Store Performance */}
              <div className="dashboard-panel performance-panel">
                <div className="panel-header">
                  <h3><i className="fas fa-trophy"></i> Store Performance</h3>
                </div>
                <div className="performance-stats">
                  <div className="perf-stat">
                    <div className="perf-icon">📦</div>
                    <div className="perf-content">
                      <span className="perf-number">{shop.productCount}</span>
                      <span className="perf-label">Products</span>
                    </div>
                  </div>
                  <div className="perf-stat">
                    <div className="perf-icon">⭐</div>
                    <div className="perf-content">
                      <span className="perf-number">4.8</span>
                      <span className="perf-label">Rating</span>
                    </div>
                  </div>
                  <div className="perf-stat">
                    <div className="perf-icon">🔥</div>
                    <div className="perf-content">
                      <span className="perf-number">{shopMetrics.topProduct}</span>
                      <span className="perf-label">Top Product</span>
                    </div>
                  </div>
                </div>
                <div className="contact-info-section">
                  <div className="contact-display">
                    {getContactIcon(shop.contactMethod)}
                    <div className="contact-details">
                      <span className="contact-method">{getContactLabel(shop.contactMethod)}</span>
                      <span className="contact-value">{shop.contactValue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Edit Form Modal */}
            {showEditForm && (
              <div className="premium-modal-overlay">
                <div className="premium-modal-content">
                  <div className="modal-header">
                    <h3>✨ Edit Shop Information</h3>
                    <button 
                      className="modal-close-btn"
                      onClick={() => setShowEditForm(false)}
                    >
                      ×
                    </button>
                  </div>
                  <form onSubmit={handleUpdateShop} className="premium-shop-form">
                    <div className="form-group">
                      <label>Display Name*</label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        required
                        className="premium-form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="premium-form-textarea"
                        rows="3"
                        placeholder="Tell customers about your amazing store..."
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Contact Method*</label>
                        <select
                          name="contactMethod"
                          value={formData.contactMethod}
                          onChange={handleInputChange}
                          className="premium-form-select"
                          required
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="telegram">Telegram</option>
                          <option value="email">Email</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{getContactLabel(formData.contactMethod)}*</label>
                        <input
                          type="text"
                          name="contactValue"
                          value={formData.contactValue}
                          onChange={handleInputChange}
                          required
                          className="premium-form-input"
                          placeholder={getContactPlaceholder(formData.contactMethod)}
                        />
                      </div>
                    </div>

                    <div className="premium-form-actions">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setShowEditForm(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-premium"
                        disabled={formLoading}
                      >
                        {formLoading ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Updating...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save"></i>
                            Update Shop
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}

export default ShopDashboard;