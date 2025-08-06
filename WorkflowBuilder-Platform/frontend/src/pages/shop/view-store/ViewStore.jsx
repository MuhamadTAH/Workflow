import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager, shopAPI } from '../../../api';
import { FaStore, FaShoppingCart, FaEye, FaShare, FaHeart } from 'react-icons/fa';
import ShopLayout from '../components/ShopLayout/ShopLayout';
import './ViewStore.css';

function ViewStore() {
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop');

  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    loadShopData();
  }, []);

  const loadShopData = async () => {
    try {
      const shopResponse = await shopAPI.getMyShop();
      setShop(shopResponse.data.shop);
      
      if (shopResponse.data.shop) {
        const productsResponse = await shopAPI.getShopProducts(shopResponse.data.shop.shopName);
        // Filter only visible products for public view
        const visibleProducts = productsResponse.data.products?.filter(p => p.isVisible !== false) || [];
        setProducts(visibleProducts);
      }
    } catch (error) {
      console.error('Error loading shop data:', error);
      setError('Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  const copyShopUrl = () => {
    if (shop?.shopUrl) {
      navigator.clipboard.writeText(shop.shopUrl);
      alert('Shop URL copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <ShopLayout title="View Store" subtitle="Preview your public shop">
        <div className="loading">Loading store preview...</div>
      </ShopLayout>
    );
  }

  if (!shop) {
    return (
      <ShopLayout title="View Store" subtitle="Preview your public shop">
        <div className="no-shop-message">
          <FaStore className="no-shop-icon" />
          <h2>No Shop Found</h2>
          <p>You need to create a shop first to preview it.</p>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout title="View Store" subtitle={`Customer Preview: ${shop.displayName}`}>
      <div className="view-store-page">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Preview Controls */}
        <div className="preview-controls">
          <div className="preview-modes">
            <button 
              className={`preview-btn ${previewMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setPreviewMode('desktop')}
            >
              🖥️ Desktop
            </button>
            <button 
              className={`preview-btn ${previewMode === 'tablet' ? 'active' : ''}`}
              onClick={() => setPreviewMode('tablet')}
            >
              📱 Tablet
            </button>
            <button 
              className={`preview-btn ${previewMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setPreviewMode('mobile')}
            >
              📲 Mobile
            </button>
          </div>

          <div className="preview-actions">
            <button className="btn btn-secondary" onClick={copyShopUrl}>
              <FaShare /> Share Store
            </button>
            <a 
              href={shop.shopUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <FaEye /> Open Live Store
            </a>
          </div>
        </div>

        {/* Customer Store View - Exactly how customers see it */}
        <div className={`customer-store-view ${previewMode}`}>
          <div className="customer-store-frame">
            {/* Store Navigation Header */}
            <div className="customer-nav-header">
              <div className="customer-nav-content">
                <div className="store-logo-section">
                  <div className="store-logo">🏪</div>
                  <h1 className="customer-store-name">{shop.displayName}</h1>
                </div>
                <div className="customer-nav-actions">
                  <button className="customer-nav-btn">
                    <FaShoppingCart /> Cart (0)
                  </button>
                  <button className="customer-nav-btn">
                    Contact
                  </button>
                </div>
              </div>
            </div>

            {/* Store Hero Section */}
            <div className="customer-hero-section">
              <div className="customer-hero-content">
                <h2 className="customer-hero-title">Welcome to {shop.displayName}</h2>
                {shop.description && (
                  <p className="customer-hero-description">{shop.description}</p>
                )}
                <div className="customer-hero-stats">
                  <span className="customer-stat">
                    <strong>{products.length}</strong> Products Available
                  </span>
                  <span className="customer-stat">
                    <strong>Free</strong> Shipping
                  </span>
                  <span className="customer-stat">
                    <strong>24/7</strong> Support
                  </span>
                </div>
              </div>
            </div>

            {/* Products Section */}
            <div className="customer-products-section">
              <div className="customer-section-header">
                <h2>Our Products</h2>
                <div className="customer-filters">
                  <select className="customer-filter-select">
                    <option>All Categories</option>
                    <option>Featured</option>
                    <option>New Arrivals</option>
                  </select>
                  <select className="customer-sort-select">
                    <option>Sort by Price</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                    <option>Newest First</option>
                  </select>
                </div>
              </div>
              
              {products.length === 0 ? (
                <div className="customer-no-products">
                  <div className="customer-empty-state">
                    <div className="customer-empty-icon">🛍️</div>
                    <h3>Coming Soon!</h3>
                    <p>We're preparing amazing products for you. Check back soon!</p>
                    <button className="customer-notify-btn">Notify Me When Available</button>
                  </div>
                </div>
              ) : (
                <div className="customer-products-grid">
                  {products.map((product) => (
                    <div key={product.id} className="customer-product-card">
                      <div className="customer-product-image">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.title} />
                        ) : (
                          <div className="customer-product-placeholder">
                            <div className="placeholder-icon">📸</div>
                            <span>No Image</span>
                          </div>
                        )}
                        <div className="customer-product-overlay">
                          <button className="quick-view-btn">Quick View</button>
                        </div>
                      </div>
                      
                      <div className="customer-product-info">
                        <h3 className="customer-product-title">{product.title}</h3>
                        {product.description && (
                          <p className="customer-product-description">{product.description}</p>
                        )}
                        
                        {/* Video indicator for customers */}
                        {product.videos && product.videos.length > 0 && (
                          <div className="customer-product-videos">
                            <span className="customer-videos-badge">
                              🎥 {product.videos.length} video{product.videos.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        
                        <div className="customer-product-pricing">
                          <span className="customer-product-price">${product.price}</span>
                          <span className="customer-price-label">Free Shipping</span>
                        </div>
                        <div className="customer-product-actions">
                          <button className="customer-add-to-cart">
                            <FaShoppingCart /> Add to Cart
                          </button>
                          <button className="customer-wishlist">
                            <FaHeart />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Trust Section */}
            <div className="customer-trust-section">
              <div className="customer-trust-content">
                <h3>Why Shop With Us?</h3>
                <div className="customer-trust-features">
                  <div className="trust-feature">
                    <div className="trust-icon">🚚</div>
                    <h4>Free Shipping</h4>
                    <p>On all orders over $50</p>
                  </div>
                  <div className="trust-feature">
                    <div className="trust-icon">🔒</div>
                    <h4>Secure Payment</h4>
                    <p>100% secure transactions</p>
                  </div>
                  <div className="trust-feature">
                    <div className="trust-icon">📞</div>
                    <h4>24/7 Support</h4>
                    <p>Always here to help</p>
                  </div>
                  <div className="trust-feature">
                    <div className="trust-icon">↩️</div>
                    <h4>Easy Returns</h4>
                    <p>30-day return policy</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Contact Section */}
            <div className="customer-contact-section">
              <div className="customer-contact-content">
                <h3>Get in Touch</h3>
                <p>Have questions? We'd love to hear from you!</p>
                <div className="customer-contact-methods">
                  <a href="#" className="customer-contact-btn whatsapp">
                    📱 WhatsApp: {shop.contactValue}
                  </a>
                  <button className="customer-contact-btn email">
                    📧 Send Message
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Footer */}
            <div className="customer-footer">
              <div className="customer-footer-content">
                <div className="customer-footer-section">
                  <h4>{shop.displayName}</h4>
                  <p>Your trusted online store</p>
                </div>
                <div className="customer-footer-section">
                  <h4>Quick Links</h4>
                  <ul>
                    <li><a href="#">About Us</a></li>
                    <li><a href="#">Contact</a></li>
                    <li><a href="#">Shipping Info</a></li>
                    <li><a href="#">Returns</a></li>
                  </ul>
                </div>
                <div className="customer-footer-section">
                  <h4>Follow Us</h4>
                  <div className="customer-social-links">
                    <a href="#">📘 Facebook</a>
                    <a href="#">📷 Instagram</a>
                    <a href="#">🐦 Twitter</a>
                  </div>
                </div>
              </div>
              <div className="customer-footer-bottom">
                <p>&copy; 2025 {shop.displayName}. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}

export default ViewStore;