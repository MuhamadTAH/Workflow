import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager } from '../../../api';
import { FaTags, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import ShopLayout from '../components/ShopLayout/ShopLayout';
import './Categories.css';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#667eea'
  });

  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // TODO: Implement category API calls
      setCategories([
        { id: 1, name: 'Electronics', productCount: 12, description: 'Electronic devices and accessories', color: '#3b82f6' },
        { id: 2, name: 'Clothing', productCount: 8, description: 'Fashion and apparel items', color: '#ef4444' },
        { id: 3, name: 'Home & Garden', productCount: 5, description: 'Home improvement and garden supplies', color: '#22c55e' }
      ]);
    } catch (error) {
      console.error('Error loading categories:', error);
      setError('Failed to load categories');
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

  const handleAddCategory = () => {
    setShowAddForm(true);
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#667eea' });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowAddForm(true);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#667eea'
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      // Update existing category
      const updatedCategories = categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...formData }
          : cat
      );
      setCategories(updatedCategories);
      setSuccessMessage('Category updated successfully!');
    } else {
      // Add new category
      const newCategory = {
        id: Date.now(),
        ...formData,
        productCount: 0
      };
      setCategories([...categories, newCategory]);
      setSuccessMessage('Category added successfully!');
    }
    setShowAddForm(false);
    setEditingCategory(null);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteCategory = (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== categoryId));
      setSuccessMessage('Category deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', color: '#667eea' });
  };

  if (loading) {
    return (
      <ShopLayout title="Categories" subtitle="Manage your product categories">
        <div className="loading">Loading categories...</div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout title="Categories" subtitle="Organize your products into categories">
      <div className="categories-page">
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

        <div className="categories-header">
          <h3>Product Categories ({categories.length})</h3>
          <button className="btn btn-primary" onClick={handleAddCategory}>
            <FaPlus /> Add Category
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="no-categories-message">
            <FaTags className="no-categories-icon" />
            <h3>No Categories Yet</h3>
            <p>Create categories to better organize your products!</p>
            <button className="btn btn-primary" onClick={handleAddCategory}>
              Add Your First Category
            </button>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category.id} className="category-card">
                <div className="category-content">
                  <div className="category-header">
                    <div className="category-name-section">
                      <div 
                        className="category-color-indicator" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <h4 className="category-name">{category.name}</h4>
                    </div>
                    <div className="category-count">
                      {category.productCount} products
                    </div>
                  </div>
                  
                  {category.description && (
                    <p className="category-description">{category.description}</p>
                  )}
                  
                  <div className="category-actions">
                    <button 
                      className="btn-icon" 
                      title="Edit Category"
                      onClick={() => handleEditCategory(category)}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn-icon danger" 
                      title="Delete Category"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Category Form Modal */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Category Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter category name"
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
                    placeholder="Optional description for this category"
                    className="form-textarea"
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Category Color</label>
                  <div className="color-input-section">
                    <input
                      type="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="color-input"
                    />
                    <span className="color-preview" style={{ backgroundColor: formData.color }}></span>
                    <small>Choose a color to help identify this category</small>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShopLayout>
  );
}

export default Categories;