import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { tokenManager, shopAPI } from '../../../api';
import { 
  FaPlus, 
  FaImage, 
  FaVideo, 
  FaTags, 
  FaDollarSign, 
  FaInfoCircle,
  FaSave,
  FaTimes,
  FaUpload,
  FaTrash,
  FaEye
} from 'react-icons/fa';
import ShopLayout from '../components/ShopLayout/ShopLayout';
import './AddProduct.css';

function AddProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Check if we're in edit mode
  const isEditMode = location.state?.editMode;
  const editProductData = location.state?.productData;
  
  const [productData, setProductData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    brand: '',
    sku: '',
    tags: [],
    images: [],
    videos: [],
    variants: [],
    specifications: {},
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    isActive: true,
    isFeatured: false,
    stock: '',
    weight: '',
    dimensions: {
      length: '',
      width: '',
      height: ''
    }
  });

  const [newTag, setNewTag] = useState('');
  const [newVariant, setNewVariant] = useState({ name: '', value: '', price: '' });
  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [activeTab, setActiveTab] = useState('basic');

  // Categories for dropdown
  const categories = [
    'Electronics', 'Clothing', 'Home & Garden', 'Books', 'Sports', 
    'Beauty', 'Toys', 'Food', 'Health', 'Automotive', 'Other'
  ];

  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    loadShop();
    
    // If in edit mode, populate form with existing product data
    if (isEditMode && editProductData) {
      setProductData({
        title: editProductData.title || '',
        description: editProductData.description || '',
        price: editProductData.price || '',
        category: editProductData.category || '',
        brand: editProductData.brand || '',
        sku: editProductData.sku || '',
        tags: editProductData.tags || [],
        images: editProductData.images || [],
        videos: editProductData.videos || [],
        variants: editProductData.variants || [],
        specifications: editProductData.specifications || {},
        seoTitle: editProductData.seoTitle || '',
        seoDescription: editProductData.seoDescription || '',
        seoKeywords: editProductData.seoKeywords || '',
        isActive: editProductData.isActive !== undefined ? editProductData.isActive : true,
        isFeatured: editProductData.isFeatured || false,
        stock: editProductData.stock || '',
        weight: editProductData.weight || '',
        dimensions: editProductData.dimensions || {
          length: '',
          width: '',
          height: ''
        }
      });
    }
  }, [isEditMode, editProductData]);

  const loadShop = async () => {
    try {
      const response = await shopAPI.getMyShop();
      setShop(response.data.shop);
      if (!response.data.shop) {
        setError('Please create a shop first before adding products.');
      }
    } catch (error) {
      console.error('Error loading shop:', error);
      setError('Unable to load shop data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested objects (like dimensions)
      const [parent, child] = name.split('.');
      setProductData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setProductData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !productData.tags.includes(newTag.trim())) {
      setProductData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setProductData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddVariant = () => {
    if (newVariant.name && newVariant.value) {
      setProductData(prev => ({
        ...prev,
        variants: [...prev.variants, { ...newVariant, id: Date.now() }]
      }));
      setNewVariant({ name: '', value: '', price: '' });
    }
  };

  const handleRemoveVariant = (variantId) => {
    setProductData(prev => ({
      ...prev,
      variants: prev.variants.filter(variant => variant.id !== variantId)
    }));
  };

  const handleAddSpecification = () => {
    if (newSpec.key && newSpec.value) {
      setProductData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [newSpec.key]: newSpec.value
        }
      }));
      setNewSpec({ key: '', value: '' });
    }
  };

  const handleRemoveSpecification = (key) => {
    setProductData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return {
        ...prev,
        specifications: newSpecs
      };
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('image', file);
        
        // Upload to backend
        const response = await fetch('http://localhost:3001/api/uploads/product-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenManager.getToken()}`
          },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          const imageData = {
            id: Date.now() + Math.random(),
            url: result.imageUrl,
            name: result.originalName,
            filename: result.filename
          };
          
          setProductData(prev => ({
            ...prev,
            images: [...prev.images, imageData]
          }));
        } else {
          console.error('Upload failed:', await response.text());
          setError('Failed to upload image. Please try again.');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setError('Failed to upload image. Please try again.');
      }
    }
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError(`Video file "${file.name}" is too large. Maximum size is 50MB.`);
        continue;
      }

      // Check file type
      if (!file.type.startsWith('video/')) {
        setError(`File "${file.name}" is not a video file.`);
        continue;
      }

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('video', file);
        
        console.log('Uploading video:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Try to upload to backend (will fail until server is restarted)
        const response = await fetch('/api/uploads/product-video', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenManager.getToken()}`
          },
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          const videoData = {
            id: Date.now() + Math.random(),
            url: result.videoUrl,
            name: result.originalName,
            filename: result.filename
          };
          
          setProductData(prev => ({
            ...prev,
            videos: [...prev.videos, videoData]
          }));
          
          console.log('Video uploaded successfully:', result);
        } else {
          const errorText = await response.text();
          console.error('Upload failed with status:', response.status, 'Error:', errorText);
          if (response.status === 404) {
            setError('Video upload endpoint not available. Please restart the backend server.');
          } else {
            setError(`Failed to upload video: ${errorText}`);
          }
        }
      } catch (error) {
        console.error('Upload error:', error);
        if (error.message.includes('ERR_CONNECTION_RESET') || error.message.includes('Failed to fetch')) {
          // Temporary fallback: use blob URL until server is restarted
          console.log('Using temporary blob URL as fallback');
          const videoData = {
            id: Date.now() + Math.random(),
            url: URL.createObjectURL(file),
            name: file.name,
            filename: null, // No server filename
            isTemporary: true // Mark as temporary
          };
          
          setProductData(prev => ({
            ...prev,
            videos: [...prev.videos, videoData]
          }));
          
          setError('Video stored temporarily. Please restart backend server for permanent storage.');
        } else {
          setError(`Failed to upload video: ${error.message}`);
        }
      }
    }
  };

  const handleRemoveImage = async (imageId) => {
    const imageToRemove = productData.images.find(img => img.id === imageId);
    
    // Remove from UI first
    setProductData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
    
    // If image has a filename (was uploaded to server), delete from server
    if (imageToRemove?.filename) {
      try {
        await fetch(`http://localhost:3001/api/uploads/product-image/${imageToRemove.filename}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokenManager.getToken()}`
          }
        });
      } catch (error) {
        console.error('Error deleting image from server:', error);
        // Don't show error to user as image is already removed from UI
      }
    }
  };

  const handleRemoveVideo = async (videoId) => {
    const videoToRemove = productData.videos.find(vid => vid.id === videoId);
    
    // Remove from UI first
    setProductData(prev => ({
      ...prev,
      videos: prev.videos.filter(vid => vid.id !== videoId)
    }));
    
    // If video has a filename (was uploaded to server), delete from server
    if (videoToRemove?.filename) {
      try {
        await fetch(`http://localhost:3001/api/uploads/product-video/${videoToRemove.filename}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokenManager.getToken()}`
          }
        });
      } catch (error) {
        console.error('Error deleting video from server:', error);
        // Don't show error to user as video is already removed from UI
      }
    }
  };

  const validateForm = () => {
    if (!productData.title.trim()) {
      setError('Product title is required');
      return false;
    }
    if (!productData.price || productData.price <= 0) {
      setError('Valid price is required');
      return false;
    }
    if (!productData.description.trim()) {
      setError('Product description is required');
      return false;
    }
    return true;
  };

  const handleSaveProduct = async () => {
    setError('');
    
    if (!validateForm()) {
      return;
    }

    if (!shop) {
      setError('Please create a shop first before adding products.');
      return;
    }

    setSaving(true);

    try {
      // Prepare product data for API
      const productPayload = {
        title: productData.title,
        description: productData.description,
        price: parseFloat(productData.price),
        imageUrl: productData.images[0]?.url || null, // Use first uploaded image URL
        videos: productData.videos || [], // Include videos array
        isVisible: productData.isActive // Map isActive to isVisible for backend
      };

      let response;
      if (isEditMode && editProductData) {
        // Update existing product
        response = await shopAPI.updateProduct(editProductData.id, productPayload);
        setSuccessMessage('Product updated successfully!');
      } else {
        // Create new product
        response = await shopAPI.addProduct(shop.shopName, productPayload);
        setSuccessMessage('Product added successfully!');
      }
      
      setTimeout(() => {
        navigate('/shop/manage-products');
      }, 2000);

    } catch (error) {
      console.error('Error saving product:', error);
      const errorMessage = error.response?.data?.message || 
        `Failed to ${isEditMode ? 'update' : 'save'} product`;
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    setSuccessMessage('Product preview feature coming soon! (Development Mode)');
  };

  if (loading) {
    return (
      <div className="loading">
        <div>Loading...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="error-container">
        <h2>Shop Required</h2>
        <p>You need to create a shop first before adding products.</p>
        <button className="btn btn-primary" onClick={() => navigate('/shop')}>
          Go to Shop Dashboard
        </button>
      </div>
    );
  }

  return (
    <ShopLayout 
      title={isEditMode ? `Edit Product` : `Add New Product`}
      subtitle={shop ? `${isEditMode ? 'Edit product in' : 'Add a product to'} ${shop.displayName}` : `${isEditMode ? 'Edit product in your shop' : 'Add a new product to your shop'}`}
    >
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

      <div className="add-product-page">
        <div className="add-product-container">
          <div className="add-product-header">
            <div className="header-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => navigate('/shop')}
              >
                <FaTimes /> Cancel
              </button>
              <button 
                className="btn btn-outline"
                onClick={handlePreview}
              >
                <FaEye /> Preview
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSaveProduct}
                disabled={saving}
              >
                <FaSave /> {saving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update Product' : 'Save Product')}
              </button>
            </div>
          </div>

        <div className="add-product-content">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveTab('basic')}
            >
              <FaInfoCircle /> Basic Info
            </button>
            <button 
              className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
              onClick={() => setActiveTab('media')}
            >
              <FaImage /> Media
            </button>
            <button 
              className={`tab-btn ${activeTab === 'variants' ? 'active' : ''}`}
              onClick={() => setActiveTab('variants')}
            >
              <FaTags /> Variants
            </button>
            <button 
              className={`tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
              onClick={() => setActiveTab('seo')}
            >
              <FaInfoCircle /> SEO & Details
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="tab-panel">
                <div className="form-section">
                  <h3>Product Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Product Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={productData.title}
                        onChange={handleInputChange}
                        placeholder="Enter product title"
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Price * ($)</label>
                      <input
                        type="number"
                        name="price"
                        value={productData.price}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      name="description"
                      value={productData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your product..."
                      className="form-textarea"
                      rows="4"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        name="category"
                        value={productData.category}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Brand</label>
                      <input
                        type="text"
                        name="brand"
                        value={productData.brand}
                        onChange={handleInputChange}
                        placeholder="Brand name"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>SKU</label>
                      <input
                        type="text"
                        name="sku"
                        value={productData.sku}
                        onChange={handleInputChange}
                        placeholder="Product SKU"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Stock Quantity</label>
                      <input
                        type="number"
                        name="stock"
                        value={productData.stock}
                        onChange={handleInputChange}
                        placeholder="Available quantity"
                        min="0"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Tags</label>
                    <div className="tags-input">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag"
                        className="form-input"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                      <button type="button" onClick={handleAddTag} className="btn btn-secondary">
                        Add
                      </button>
                    </div>
                    <div className="tags-display">
                      {productData.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="tag-remove">
                            <FaTimes />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input
                        type="number"
                        name="weight"
                        value={productData.weight}
                        onChange={handleInputChange}
                        placeholder="0.0"
                        step="0.1"
                        min="0"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Dimensions (cm)</label>
                      <div className="dimensions-input">
                        <input
                          type="number"
                          name="dimensions.length"
                          value={productData.dimensions.length}
                          onChange={handleInputChange}
                          placeholder="L"
                          className="form-input dimension-input"
                        />
                        <span>×</span>
                        <input
                          type="number"
                          name="dimensions.width"
                          value={productData.dimensions.width}
                          onChange={handleInputChange}
                          placeholder="W"
                          className="form-input dimension-input"
                        />
                        <span>×</span>
                        <input
                          type="number"
                          name="dimensions.height"
                          value={productData.dimensions.height}
                          onChange={handleInputChange}
                          placeholder="H"
                          className="form-input dimension-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={productData.isActive}
                          onChange={handleInputChange}
                        />
                        Product is active
                      </label>
                    </div>
                    <div className="form-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isFeatured"
                          checked={productData.isFeatured}
                          onChange={handleInputChange}
                        />
                        Featured product
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="tab-panel">
                <div className="form-section">
                  <h3>Product Images</h3>
                  <div className="media-upload">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="image-upload" className="upload-btn">
                      <FaUpload /> Upload Images
                    </label>
                    <p className="upload-hint">Supported formats: JPG, PNG, GIF. Max 5MB each.</p>
                  </div>
                  
                  <div className="media-grid">
                    {productData.images.map((image) => (
                      <div key={image.id} className="media-item">
                        <img src={image.url} alt={image.name} className="media-preview" />
                        <div className="media-overlay">
                          <button 
                            onClick={() => handleRemoveImage(image.id)}
                            className="media-remove"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <p className="media-name">{image.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <h3>Product Videos</h3>
                  <div className="media-upload">
                    <input
                      type="file"
                      id="video-upload"
                      multiple
                      accept="video/*"
                      onChange={handleVideoUpload}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="video-upload" className="upload-btn">
                      <FaVideo /> Upload Videos
                    </label>
                    <p className="upload-hint">Supported formats: MP4, MOV, AVI. Max 50MB each.</p>
                  </div>
                  
                  <div className="media-grid">
                    {productData.videos.map((video) => (
                      <div key={video.id} className="media-item">
                        <video src={video.url} className="media-preview" controls />
                        <div className="media-overlay">
                          <button 
                            onClick={() => handleRemoveVideo(video.id)}
                            className="media-remove"
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <p className="media-name">{video.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Variants Tab */}
            {activeTab === 'variants' && (
              <div className="tab-panel">
                <div className="form-section">
                  <h3>Product Variants</h3>
                  <p className="section-description">
                    Add variants like size, color, material, etc.
                  </p>
                  
                  <div className="variant-input">
                    <input
                      type="text"
                      value={newVariant.name}
                      onChange={(e) => setNewVariant({...newVariant, name: e.target.value})}
                      placeholder="Variant name (e.g., Size, Color)"
                      className="form-input"
                    />
                    <input
                      type="text"
                      value={newVariant.value}
                      onChange={(e) => setNewVariant({...newVariant, value: e.target.value})}
                      placeholder="Value (e.g., Large, Red)"
                      className="form-input"
                    />
                    <input
                      type="number"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant({...newVariant, price: e.target.value})}
                      placeholder="Price adjustment"
                      step="0.01"
                      className="form-input"
                    />
                    <button type="button" onClick={handleAddVariant} className="btn btn-secondary">
                      Add Variant
                    </button>
                  </div>

                  <div className="variants-list">
                    {productData.variants.map((variant) => (
                      <div key={variant.id} className="variant-item">
                        <span className="variant-name">{variant.name}</span>
                        <span className="variant-value">{variant.value}</span>
                        {variant.price && (
                          <span className="variant-price">+${variant.price}</span>
                        )}
                        <button 
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="variant-remove"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-section">
                  <h3>Product Specifications</h3>
                  <p className="section-description">
                    Add technical specifications and product details.
                  </p>
                  
                  <div className="spec-input">
                    <input
                      type="text"
                      value={newSpec.key}
                      onChange={(e) => setNewSpec({...newSpec, key: e.target.value})}
                      placeholder="Specification name"
                      className="form-input"
                    />
                    <input
                      type="text"
                      value={newSpec.value}
                      onChange={(e) => setNewSpec({...newSpec, value: e.target.value})}
                      placeholder="Value"
                      className="form-input"
                    />
                    <button type="button" onClick={handleAddSpecification} className="btn btn-secondary">
                      Add Spec
                    </button>
                  </div>

                  <div className="specs-list">
                    {Object.entries(productData.specifications).map(([key, value]) => (
                      <div key={key} className="spec-item">
                        <span className="spec-key">{key}</span>
                        <span className="spec-value">{value}</span>
                        <button 
                          onClick={() => handleRemoveSpecification(key)}
                          className="spec-remove"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <div className="tab-panel">
                <div className="form-section">
                  <h3>SEO Optimization</h3>
                  <p className="section-description">
                    Optimize your product for search engines.
                  </p>
                  
                  <div className="form-group">
                    <label>SEO Title</label>
                    <input
                      type="text"
                      name="seoTitle"
                      value={productData.seoTitle}
                      onChange={handleInputChange}
                      placeholder="SEO title for search engines"
                      className="form-input"
                      maxLength="60"
                    />
                    <small>{productData.seoTitle.length}/60 characters</small>
                  </div>

                  <div className="form-group">
                    <label>SEO Description</label>
                    <textarea
                      name="seoDescription"
                      value={productData.seoDescription}
                      onChange={handleInputChange}
                      placeholder="Meta description for search results"
                      className="form-textarea"
                      rows="3"
                      maxLength="160"
                    />
                    <small>{productData.seoDescription.length}/160 characters</small>
                  </div>

                  <div className="form-group">
                    <label>SEO Keywords</label>
                    <input
                      type="text"
                      name="seoKeywords"
                      value={productData.seoKeywords}
                      onChange={handleInputChange}
                      placeholder="Comma-separated keywords"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </ShopLayout>
  );
}

export default AddProduct;