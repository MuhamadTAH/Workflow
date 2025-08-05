import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager, shopAPI } from '../../../api';
import { FaCog, FaSave, FaStore, FaShoppingCart, FaPalette } from 'react-icons/fa';
import ShopLayout from '../components/ShopLayout/ShopLayout';
import './ShopSettings.css';

function ShopSettings() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    displayName: '',
    description: '',
    contactMethod: 'whatsapp',
    contactValue: '',
    currency: 'USD',
    timezone: 'UTC',
    language: 'en',
    theme: 'default',
    allowReviews: true,
    requireLogin: false,
    enableInventory: true,
    lowStockThreshold: 5
  });

  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    loadShopSettings();
  }, []);

  const loadShopSettings = async () => {
    try {
      const response = await shopAPI.getMyShop();
      const shopData = response.data.shop;
      
      if (shopData) {
        setShop(shopData);
        setFormData({
          displayName: shopData.displayName || '',
          description: shopData.description || '',
          contactMethod: shopData.contactMethod || 'whatsapp',
          contactValue: shopData.contactValue || '',
          currency: shopData.currency || 'USD',
          timezone: shopData.timezone || 'UTC',
          language: shopData.language || 'en',
          theme: shopData.theme || 'default',
          allowReviews: shopData.allowReviews !== false,
          requireLogin: shopData.requireLogin || false,
          enableInventory: shopData.enableInventory !== false,
          lowStockThreshold: shopData.lowStockThreshold || 5
        });
      }
    } catch (error) {
      console.error('Error loading shop settings:', error);
      setError('Failed to load shop settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await shopAPI.updateShop(shop.id, formData);
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ShopLayout title="Shop Settings" subtitle="Configure your shop preferences">
        <div className="loading">Loading settings...</div>
      </ShopLayout>
    );
  }

  if (!shop) {
    return (
      <ShopLayout title="Shop Settings" subtitle="Configure your shop preferences">
        <div className="no-shop-message">
          <FaStore className="no-shop-icon" />
          <h2>No Shop Found</h2>
          <p>Create a shop first to access settings.</p>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout title="Shop Settings" subtitle={`Settings for ${shop.displayName}`}>
      <div className="settings-page">
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

        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <FaStore /> General
          </button>
          <button 
            className={`tab-btn ${activeTab === 'store' ? 'active' : ''}`}
            onClick={() => setActiveTab('store')}
          >
            <FaShoppingCart /> Store
          </button>
          <button 
            className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <FaPalette /> Appearance
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="settings-form">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Information</h3>
              
              <div className="form-group">
                <label>Shop Name</label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
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
                  <label>Contact Method</label>
                  <select
                    name="contactMethod"
                    value={formData.contactMethod}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Contact Value</label>
                  <input
                    type="text"
                    name="contactValue"
                    value={formData.contactValue}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Store Settings */}
          {activeTab === 'store' && (
            <div className="settings-section">
              <h3>Store Configuration</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Currency</label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">EST</option>
                    <option value="PST">PST</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="allowReviews"
                    checked={formData.allowReviews}
                    onChange={handleInputChange}
                  />
                  Allow customer reviews
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="requireLogin"
                    checked={formData.requireLogin}
                    onChange={handleInputChange}
                  />
                  Require login to purchase
                </label>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="enableInventory"
                    checked={formData.enableInventory}
                    onChange={handleInputChange}
                  />
                  Enable inventory tracking
                </label>
              </div>

              {formData.enableInventory && (
                <div className="form-group">
                  <label>Low Stock Threshold</label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                  />
                </div>
              )}
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3>Store Appearance</h3>
              
              <div className="form-group">
                <label>Theme</label>
                <select
                  name="theme"
                  value={formData.theme}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="default">Default</option>
                  <option value="dark">Dark</option>
                  <option value="modern">Modern</option>
                  <option value="classic">Classic</option>
                </select>
              </div>

              <div className="form-group">
                <label>Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>
            </div>
          )}

          <div className="settings-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              <FaSave /> {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </ShopLayout>
  );
}

export default ShopSettings;