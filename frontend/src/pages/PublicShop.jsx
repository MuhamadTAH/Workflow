import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaStore, FaWhatsapp, FaTelegram, FaEnvelope, FaPhone } from 'react-icons/fa';
import './PublicShop.css';

function PublicShop() {
  const { shopName } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadShop();
  }, [shopName]);

  const loadShop = async () => {
    try {
      const response = await fetch(`/api/shops/public/${shopName}`);
      const data = await response.json();
      
      if (response.ok) {
        setShop(data.shop);
        setProducts(data.products);
      } else {
        setError(data.message || 'Shop not found');
      }
    } catch (error) {
      console.error('Error loading shop:', error);
      setError('Unable to load shop. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getContactIcon = (method) => {
    switch (method) {
      case 'whatsapp': return <FaWhatsapp className="contact-icon whatsapp" />;
      case 'telegram': return <FaTelegram className="contact-icon telegram" />;
      case 'email': return <FaEnvelope className="contact-icon email" />;
      default: return <FaPhone className="contact-icon" />;
    }
  };

  const getContactLabel = (method) => {
    switch (method) {
      case 'whatsapp': return 'WhatsApp';
      case 'telegram': return 'Telegram';
      case 'email': return 'Email';
      default: return 'Contact';
    }
  };

  const getContactLink = (method, value) => {
    switch (method) {
      case 'whatsapp': 
        const cleanNumber = value.replace(/[^\d]/g, '');
        return `https://wa.me/${cleanNumber}`;
      case 'telegram': 
        const username = value.startsWith('@') ? value.slice(1) : value;
        return `https://t.me/${username}`;
      case 'email': 
        return `mailto:${value}`;
      default: 
        return `tel:${value}`;
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="public-shop-loading">
        <div className="loading-content">
          <FaStore className="loading-icon" />
          <h2>Loading Shop...</h2>
          <p>Please wait while we load the shop details.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-shop-error">
        <div className="error-content">
          <FaStore className="error-icon" />
          <h2>Shop Not Found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-shop">
      <div className="public-shop-container">
        {/* Shop Header */}
        <div className="shop-header">
          <div className="shop-header-content">
            <FaStore className="shop-header-icon" />
            <div className="shop-header-text">
              <h1>{shop.displayName}</h1>
              {shop.description && <p className="shop-description">{shop.description}</p>}
            </div>
          </div>
          
          <div className="shop-contact">
            <a 
              href={getContactLink(shop.contactMethod, shop.contactValue)}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-button"
            >
              {getContactIcon(shop.contactMethod)}
              <span>Contact via {getContactLabel(shop.contactMethod)}</span>
            </a>
          </div>
        </div>

        {/* Products Section */}
        <div className="products-section">
          <h2>Our Products</h2>
          
          {products.length === 0 ? (
            <div className="no-products">
              <p>No products available at the moment.</p>
              <p>Please check back later!</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map(product => (
                <div key={product.id} className="product-card">
                  {product.imageUrl && (
                    <div className="product-image">
                      <img src={product.imageUrl} alt={product.title} />
                    </div>
                  )}
                  <div className="product-info">
                    <h3 className="product-title">{product.title}</h3>
                    {product.description && (
                      <p className="product-description">{product.description}</p>
                    )}
                    <div className="product-price">{formatPrice(product.price)}</div>
                    <a 
                      href={getContactLink(shop.contactMethod, shop.contactValue)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inquiry-button"
                    >
                      Inquire About This Product
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shop-footer">
          <p>© 2025 {shop.displayName}. All rights reserved.</p>
          <p>Powered by Workflow Builder</p>
        </div>
      </div>
    </div>
  );
}

export default PublicShop;