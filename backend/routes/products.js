const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// PUT /api/products/:id - Update product
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, imageUrl, isVisible, videos } = req.body;

    // Validate input - only require validation if title and price are provided
    // This allows for partial updates (like just isVisible)
    if (title !== undefined && !title) {
      return res.status(400).json({ message: 'Product title cannot be empty' });
    }

    if (price !== undefined && (isNaN(price) || price <= 0)) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    // Verify product ownership through shop
    db.get(
      `SELECT p.id, s.user_id 
       FROM products p 
       JOIN shops s ON p.shop_id = s.id 
       WHERE p.id = ? AND p.is_active = 1`,
      [id],
      (err, product) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        if (product.user_id !== req.user.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Build dynamic update query based on provided fields
        const updateFields = [];
        const updateValues = [];
        
        if (title !== undefined) {
          updateFields.push('title = ?');
          updateValues.push(title);
        }
        if (description !== undefined) {
          updateFields.push('description = ?');
          updateValues.push(description || null);
        }
        if (price !== undefined) {
          updateFields.push('price = ?');
          updateValues.push(parseFloat(price));
        }
        if (imageUrl !== undefined) {
          updateFields.push('image_url = ?');
          updateValues.push(imageUrl || null);
        }
        if (videos !== undefined) {
          updateFields.push('videos = ?');
          updateValues.push(videos ? JSON.stringify(videos) : null);
        }
        if (isVisible !== undefined) {
          updateFields.push('is_visible = ?');
          updateValues.push(isVisible ? 1 : 0);
        }
        
        // Always update the timestamp
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id); // Add ID at the end for WHERE clause
        
        if (updateFields.length === 1) { // Only timestamp update
          return res.status(400).json({ message: 'No fields to update' });
        }

        // Update product
        db.run(
          `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues,
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: 'Error updating product' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ message: 'Product not found' });
            }

            // Return updated fields
            const updatedProduct = {
              id: parseInt(id),
              updatedAt: new Date().toISOString()
            };
            
            if (title !== undefined) updatedProduct.title = title;
            if (description !== undefined) updatedProduct.description = description;
            if (price !== undefined) updatedProduct.price = parseFloat(price);
            if (imageUrl !== undefined) updatedProduct.imageUrl = imageUrl;
            if (isVisible !== undefined) updatedProduct.isVisible = isVisible;

            res.json({
              message: 'Product updated successfully',
              product: updatedProduct
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;

    // Verify product ownership through shop
    db.get(
      `SELECT p.id, s.user_id 
       FROM products p 
       JOIN shops s ON p.shop_id = s.id 
       WHERE p.id = ? AND p.is_active = 1`,
      [id],
      (err, product) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }

        if (product.user_id !== req.user.userId) {
          return res.status(403).json({ message: 'Access denied' });
        }

        // Soft delete product
        db.run(
          'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: 'Error deleting product' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ message: 'Product not found' });
            }

            res.json({
              message: 'Product deleted successfully',
              productId: parseInt(id)
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;