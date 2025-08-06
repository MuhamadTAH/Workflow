import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { tokenManager, shopAPI } from '../../../api';
import { FaBox, FaEdit, FaTrash, FaEye, FaTimes, FaEyeSlash, FaGripVertical, FaImage } from 'react-icons/fa';
import ShopLayout from '../components/ShopLayout/ShopLayout';
import './ManageProducts.css';

function ManageProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shop, setShop] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [draggedProduct, setDraggedProduct] = useState(null);

  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // First get shop info
      const shopResponse = await shopAPI.getMyShop();
      setShop(shopResponse.data.shop);
      
      if (shopResponse.data.shop) {
        // Then get products for this shop
        const productsResponse = await shopAPI.getShopProducts(shopResponse.data.shop.shopName);
        setProducts(productsResponse.data.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (product) => {
    navigate(`/shop/product/${product.id}`);
  };

  const handleEditProduct = (product) => {
    // Navigate to Add Product page with the product data for editing
    navigate('/shop/add-product', { 
      state: { 
        editMode: true, 
        productData: product 
      } 
    });
  };

  const handleToggleVisibility = async (product) => {
    try {
      const updatedVisibility = !product.isVisible;
      await shopAPI.updateProduct(product.id, { isVisible: updatedVisibility });
      
      // Update local state
      setProducts(products.map(p => 
        p.id === product.id 
          ? { ...p, isVisible: updatedVisibility }
          : p
      ));
      
      setSuccessMessage(
        `Product "${product.title}" is now ${updatedVisibility ? 'visible' : 'hidden'} to customers`
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating product visibility:', error);
      setError('Failed to update product visibility');
    }
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`Are you sure you want to delete "${product.title}"? This action cannot be undone.`)) {
      setDeleteLoading(true);
      try {
        await shopAPI.deleteProduct(product.id);
        setProducts(products.filter(p => p.id !== product.id));
        setSuccessMessage(`Product "${product.title}" deleted successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Failed to delete product');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // Drag and Drop functionality
  const handleDragStart = (e, product) => {
    setDraggedProduct(product);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetProduct) => {
    e.preventDefault();
    
    if (!draggedProduct || draggedProduct.id === targetProduct.id) {
      setDraggedProduct(null);
      return;
    }

    const draggedIndex = products.findIndex(p => p.id === draggedProduct.id);
    const targetIndex = products.findIndex(p => p.id === targetProduct.id);
    
    const newProducts = [...products];
    const [movedProduct] = newProducts.splice(draggedIndex, 1);
    newProducts.splice(targetIndex, 0, movedProduct);
    
    // Update display order for all products
    const updatedProducts = newProducts.map((product, index) => ({
      ...product,
      displayOrder: index + 1
    }));
    
    setProducts(updatedProducts);
    setDraggedProduct(null);
    
    // Here you would typically save the new order to the backend
    updateProductOrder(updatedProducts);
  };

  const updateProductOrder = async (orderedProducts) => {
    try {
      // This would be an API call to update the display order
      await shopAPI.updateProductOrder(orderedProducts.map(p => ({
        id: p.id,
        displayOrder: p.displayOrder
      })));
      setSuccessMessage('Product order updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating product order:', error);
      setError('Failed to update product order');
    }
  };

  if (loading) {
    return (
      <ShopLayout title="Manage Products" subtitle="View and manage all your products">
        <div className="loading">Loading products...</div>
      </ShopLayout>
    );
  }

  if (!shop) {
    return (
      <ShopLayout title="Manage Products" subtitle="View and manage all your products">
        <div className="no-shop-message">
          <FaBox className="coming-soon-icon" />
          <h2>No Shop Found</h2>
          <p>You need to create a shop first before managing products.</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/shop'}>
            Create Shop
          </button>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout title="Manage Products" subtitle={`Managing products for ${shop.displayName}`}>
      <div className="manage-products-page">
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

        <div className="products-header">
          <h3>Your Products ({products.length})</h3>
          <button 
            className="btn btn-primary"
            onClick={() => window.location.href = '/shop/add-product'}
          >
            <FaBox /> Add New Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="no-products-message">
            <FaBox className="no-products-icon" />
            <h3>No Products Yet</h3>
            <p>Start by adding your first product to your shop!</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/shop/add-product'}
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <div 
                key={product.id} 
                className={`product-card ${draggedProduct?.id === product.id ? 'dragging' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, product)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, product)}
              >
                <div className="product-drag-handle">
                  <FaGripVertical />
                </div>
                
                <div className="product-image">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.title} />
                  ) : (
                    <div className="product-image-placeholder">
                      <FaImage />
                    </div>
                  )}
                </div>
                
                <div className="product-content">
                  <div className="product-header">
                    <h4 className="product-title">{product.title}</h4>
                    <div className="product-visibility">
                      {product.isVisible !== false ? (
                        <span className="visibility-badge visible">Visible</span>
                      ) : (
                        <span className="visibility-badge hidden">Hidden</span>
                      )}
                    </div>
                  </div>
                  
                  <p className="product-price">${product.price}</p>
                  
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                  
                  {/* Video indicator */}
                  {product.videos && product.videos.length > 0 && (
                    <div className="product-videos-indicator">
                      <span className="videos-count">
                        🎥 {product.videos.length} video{product.videos.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  
                  <div className="product-meta">
                    <span className="product-date">
                      Created: {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="product-actions">
                    <button 
                      className="btn-icon" 
                      title={product.isVisible !== false ? "Hide from customers" : "Show to customers"}
                      onClick={() => handleToggleVisibility(product)}
                    >
                      {product.isVisible !== false ? <FaEye /> : <FaEyeSlash />}
                    </button>
                    <button 
                      className="btn-icon" 
                      title="Edit Product"
                      onClick={() => handleEditProduct(product)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn-icon" 
                      title="View Details"
                      onClick={() => handleViewProduct(product)}
                    >
                      <FaBox />
                    </button>
                    <button 
                      className="btn-icon danger" 
                      title="Delete Product"
                      onClick={() => handleDeleteProduct(product)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}



      </div>
    </ShopLayout>
  );
}

export default ManageProducts;