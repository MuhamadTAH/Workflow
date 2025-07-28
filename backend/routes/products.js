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
    const { title, description, price, imageUrl } = req.body;

    // Validate input
    if (!title || !price) {
      return res.status(400).json({ message: 'Product title and price are required' });
    }

    if (isNaN(price) || price <= 0) {
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

        // Update product
        db.run(
          `UPDATE products 
           SET title = ?, description = ?, price = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [title, description || null, parseFloat(price), imageUrl || null, id],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: 'Error updating product' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ message: 'Product not found' });
            }

            res.json({
              message: 'Product updated successfully',
              product: {
                id: parseInt(id),
                title,
                description,
                price: parseFloat(price),
                imageUrl,
                updatedAt: new Date().toISOString()
              }
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