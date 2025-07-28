import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager, shopAPI } from '../api';
import { FaStore, FaPlus, FaEdit, FaEye, FaCopy, FaWhatsapp, FaTelegram, FaEnvelope } from 'react-icons/fa';

function ShopDashboard() {
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

  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      const response = await shopAPI.getMyShop();
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
      setError('Failed to load shop data');
    } finally {
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
      </div>
    );
  }

  return (
    <div className="shop-dashboard">
      <div className="shop-dashboard-container">
        <div className="shop-dashboard-header">
          <h1 className="shop-dashboard-title">
            <FaStore className="shop-icon" />
            My Shop
          </h1>
          <p className="shop-dashboard-subtitle">
            Manage your online store and products
          </p>
        </div>

        {error && (
          <div className="error-message">
            {error}
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
          // Shop exists - show dashboard
          <div className="shop-overview">
            <div className="shop-info-card">
              <div className="shop-info-header">
                <div className="shop-info-main">
                  <h2 className="shop-name">{shop.displayName}</h2>
                  <p className="shop-url">
                    <strong>Shop URL:</strong> 
                    <span className="url-text">{shop.shopUrl}</span>
                    <button className="copy-btn" onClick={copyShopUrl} title="Copy URL">
                      <FaCopy />
                    </button>
                  </p>
                  {shop.description && (
                    <p className="shop-description">{shop.description}</p>
                  )}
                </div>
                <div className="shop-info-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowEditForm(true)}
                  >
                    <FaEdit /> Edit Shop
                  </button>
                  <a 
                    href={shop.shopUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    <FaEye /> View Shop
                  </a>
                </div>
              </div>

              <div className="shop-stats">
                <div className="stat-card">
                  <div className="stat-number">{shop.productCount}</div>
                  <div className="stat-label">Products</div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{getContactIcon(shop.contactMethod)}</div>
                  <div className="stat-label">{getContactLabel(shop.contactMethod)}</div>
                  <div className="stat-value">{shop.contactValue}</div>
                </div>
              </div>
            </div>

            {/* Edit Form Modal */}
            {showEditForm && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Edit Shop Information</h3>
                  <form onSubmit={handleUpdateShop} className="shop-form">
                    <div className="form-group">
                      <label>Display Name*</label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
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
                          required
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setShowEditForm(false)}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={formLoading}
                      >
                        {formLoading ? 'Updating...' : 'Update Shop'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button className="action-btn">
                  <FaPlus />
                  <span>Add Product</span>
                </button>
                <button className="action-btn">
                  <FaEdit />
                  <span>Manage Products</span>
                </button>
                <button className="action-btn">
                  <FaEye />
                  <span>View Analytics</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShopDashboard;