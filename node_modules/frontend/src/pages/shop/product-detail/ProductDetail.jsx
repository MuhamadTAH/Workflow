import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tokenManager, shopAPI } from '../../../api';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaEye, 
  FaEyeSlash, 
  FaTag, 
  FaDollarSign, 
  FaBox, 
  FaWeight, 
  FaRuler,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import ShopLayout from '../components/ShopLayout/ShopLayout';
import './ProductDetail.css';

function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shop, setShop] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      // First get shop info
      const shopResponse = await shopAPI.getMyShop();
      setShop(shopResponse.data.shop);
      
      if (shopResponse.data.shop) {
        // Get all products and find the specific one
        const productsResponse = await shopAPI.getShopProducts(shopResponse.data.shop.shopName);
        const products = productsResponse.data.products || [];
        const foundProduct = products.find(p => p.id === parseInt(productId));
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          setError('Product not found');
        }
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setError('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = () => {
    navigate('/shop/add-product', { 
      state: { 
        editMode: true, 
        productData: product 
      } 
    });
  };

  const handleToggleVisibility = async () => {
    try {
      const updatedVisibility = !product.isVisible;
      await shopAPI.updateProduct(product.id, { isVisible: updatedVisibility });
      
      setProduct(prev => ({
        ...prev,
        isVisible: updatedVisibility
      }));
    } catch (error) {
      console.error('Error updating visibility:', error);
      setError('Failed to update product visibility');
    }
  };

  const handleDeleteProduct = async () => {
    if (window.confirm(`Are you sure you want to delete "${product.title}"?`)) {
      try {
        await shopAPI.deleteProduct(product.id);
        navigate('/shop/manage-products');
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Failed to delete product');
      }
    }
  };

  const handleImageNavigation = (direction) => {
    const images = product.images || [];
    if (direction === 'next') {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    } else {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="star filled" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star half" />);
    }
    
    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star empty" />);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <ShopLayout title="Loading Product..." subtitle="Please wait">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading product details...</p>
        </div>
      </ShopLayout>
    );
  }

  if (error || !product) {
    return (
      <ShopLayout title="Error" subtitle="Something went wrong">
        <div className="error-container">
          <h3>{error || 'Product not found'}</h3>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/shop/manage-products')}
          >
            <FaArrowLeft /> Back to Products
          </button>
        </div>
      </ShopLayout>
    );
  }

  // Handle both single imageUrl and images array for backwards compatibility
  const images = product.images || (product.imageUrl && !product.imageUrl.startsWith('blob:') ? [{ url: product.imageUrl, id: 1 }] : []);
  const currentImage = images[currentImageIndex];

  return (
    <ShopLayout 
      title={product.title}
      subtitle={`Product Details • ${shop?.displayName || 'Your Shop'}`}
    >
      <div className="product-detail-page">
        {/* Header Actions */}
        <div className="product-detail-header">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/shop/manage-products')}
          >
            <FaArrowLeft /> Back to Products
          </button>
          
          <div className="header-actions">
            <button 
              className="btn btn-outline"
              onClick={handleToggleVisibility}
            >
              {product.isVisible ? <FaEyeSlash /> : <FaEye />}
              {product.isVisible ? 'Hide Product' : 'Show Product'}
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleEditProduct}
            >
              <FaEdit /> Edit Product
            </button>
            <button 
              className="btn btn-danger"
              onClick={handleDeleteProduct}
            >
              <FaTrash /> Delete
            </button>
          </div>
        </div>

        {/* Product Content */}
        <div className="product-detail-content">
          {/* Left Column - Images */}
          <div className="product-images-section">
            <div className="main-image-container">
              {images.length > 0 ? (
                <>
                  <img 
                    src={currentImage?.url || '/api/placeholder/400/400'} 
                    alt={product.title}
                    className="main-product-image"
                  />
                  {images.length > 1 && (
                    <div className="image-navigation">
                      <button 
                        className="nav-btn prev"
                        onClick={() => handleImageNavigation('prev')}
                      >
                        <FaChevronLeft />
                      </button>
                      <button 
                        className="nav-btn next"
                        onClick={() => handleImageNavigation('next')}
                      >
                        <FaChevronRight />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-image-placeholder">
                  <FaBox />
                  <p>No image available</p>
                </div>
              )}
            </div>
            
            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="thumbnail-gallery">
                {images.map((image, index) => (
                  <img
                    key={image.id}
                    src={image.url}
                    alt={`${product.title} ${index + 1}`}
                    className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Videos Section */}
          {product.videos && product.videos.length > 0 && (
            <div className="product-videos-section">
              <h3>Product Videos</h3>
              <div className="videos-grid">
                {product.videos.map((video) => (
                  <div key={video.id} className="video-item">
                    <video 
                      src={video.url} 
                      controls
                      className="product-video"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                    <p className="video-name">{video.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right Column - Product Info */}
          <div className="product-info-section">
            <div className="product-header">
              <h1 className="product-title">{product.title}</h1>
              <div className="product-status">
                <span className={`status-badge ${product.isVisible ? 'visible' : 'hidden'}`}>
                  {product.isVisible ? 'Visible' : 'Hidden'}
                </span>
              </div>
            </div>

            <div className="product-price">
              <span className="price-symbol">$</span>
              <span className="price-amount">{parseFloat(product.price).toFixed(2)}</span>
            </div>

            {/* Product Rating (Mock for now) */}
            <div className="product-rating">
              <div className="stars">
                {renderStars(4.5)}
              </div>
              <span className="rating-text">4.5 (23 reviews)</span>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            {/* Product Specifications */}
            <div className="product-specs">
              <h3>Product Information</h3>
              <div className="specs-grid">
                {product.category && (
                  <div className="spec-item">
                    <FaTag className="spec-icon" />
                    <span className="spec-label">Category:</span>
                    <span className="spec-value">{product.category}</span>
                  </div>
                )}
                
                {product.brand && (
                  <div className="spec-item">
                    <FaBox className="spec-icon" />
                    <span className="spec-label">Brand:</span>
                    <span className="spec-value">{product.brand}</span>
                  </div>
                )}
                
                {product.sku && (
                  <div className="spec-item">
                    <FaBox className="spec-icon" />
                    <span className="spec-label">SKU:</span>
                    <span className="spec-value">{product.sku}</span>
                  </div>
                )}
                
                {product.stock && (
                  <div className="spec-item">
                    <FaBox className="spec-icon" />
                    <span className="spec-label">Stock:</span>
                    <span className="spec-value">{product.stock} units</span>
                  </div>
                )}
                
                {product.weight && (
                  <div className="spec-item">
                    <FaWeight className="spec-icon" />
                    <span className="spec-label">Weight:</span>
                    <span className="spec-value">{product.weight} kg</span>
                  </div>
                )}
                
                {product.dimensions && (product.dimensions.length || product.dimensions.width || product.dimensions.height) && (
                  <div className="spec-item">
                    <FaRuler className="spec-icon" />
                    <span className="spec-label">Dimensions:</span>
                    <span className="spec-value">
                      {product.dimensions.length || '?'} × {product.dimensions.width || '?'} × {product.dimensions.height || '?'} cm
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Product Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="product-tags">
                <h3>Tags</h3>
                <div className="tags-list">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="product-variants">
                <h3>Available Variants</h3>
                <div className="variants-list">
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="variant-option">
                      <span className="variant-name">{variant.name}:</span>
                      <span className="variant-value">{variant.value}</span>
                      {variant.price && (
                        <span className="variant-price">+${variant.price}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="additional-specs">
                <h3>Technical Specifications</h3>
                <div className="specs-table">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="spec-row">
                      <span className="spec-key">{key}:</span>
                      <span className="spec-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SEO Information (for admin view) */}
            {(product.seoTitle || product.seoDescription || product.seoKeywords) && (
              <div className="seo-info">
                <h3>SEO Information</h3>
                {product.seoTitle && (
                  <div className="seo-item">
                    <strong>SEO Title:</strong> {product.seoTitle}
                  </div>
                )}
                {product.seoDescription && (
                  <div className="seo-item">
                    <strong>SEO Description:</strong> {product.seoDescription}
                  </div>
                )}
                {product.seoKeywords && (
                  <div className="seo-item">
                    <strong>SEO Keywords:</strong> {product.seoKeywords}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}

export default ProductDetail;