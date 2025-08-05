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

// GET /api/shops/my-shop - Get user's shop
router.get('/my-shop', verifyToken, (req, res) => {
  try {
    db.get(
      `SELECT 
        s.*, 
        COUNT(p.id) as product_count
      FROM shops s
      LEFT JOIN products p ON s.id = p.shop_id AND p.is_active = 1
      WHERE s.user_id = ? AND s.is_active = 1
      GROUP BY s.id`,
      [req.user.userId],
      (err, shop) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (!shop) {
          return res.json({ shop: null });
        }

        res.json({
          shop: {
            id: shop.id,
            shopName: shop.shop_name,
            displayName: shop.shop_display_name,
            description: shop.description,
            contactMethod: shop.contact_method,
            contactValue: shop.contact_value,
            productCount: shop.product_count,
            createdAt: shop.created_at,
            updatedAt: shop.updated_at,
            shopUrl: `http://localhost:5174/shop/${shop.shop_name}`
          }
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/shops - Create new shop
router.post('/', verifyToken, (req, res) => {
  try {
    const { shopName, displayName, description, contactMethod, contactValue } = req.body;

    // Validate input
    if (!shopName || !displayName || !contactMethod || !contactValue) {
      return res.status(400).json({ 
        message: 'Shop name, display name, contact method, and contact value are required' 
      });
    }

    // Validate shop name format (letters, numbers, hyphens, underscores only)
    const shopNameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!shopNameRegex.test(shopName)) {
      return res.status(400).json({ 
        message: 'Shop name can only contain letters, numbers, hyphens, and underscores' 
      });
    }

    // Validate contact method
    const validContactMethods = ['whatsapp', 'telegram', 'email'];
    if (!validContactMethods.includes(contactMethod)) {
      return res.status(400).json({ 
        message: 'Contact method must be whatsapp, telegram, or email' 
      });
    }

    // Check if user already has a shop
    db.get('SELECT id FROM shops WHERE user_id = ? AND is_active = 1', [req.user.userId], (err, existingShop) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (existingShop) {
        return res.status(400).json({ message: 'You already have a shop. Each user can only have one shop.' });
      }

      // Check if shop name is already taken
      db.get('SELECT id FROM shops WHERE shop_name = ? AND is_active = 1', [shopName], (err, nameCheck) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (nameCheck) {
          return res.status(400).json({ message: 'Shop name is already taken. Please choose a different name.' });
        }

        // Create shop
        db.run(
          `INSERT INTO shops (user_id, shop_name, shop_display_name, description, contact_method, contact_value)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [req.user.userId, shopName, displayName, description || null, contactMethod, contactValue],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: 'Error creating shop' });
            }

            res.status(201).json({
              message: 'Shop created successfully',
              shop: {
                id: this.lastID,
                shopName,
                displayName,
                description,
                contactMethod,
                contactValue,
                productCount: 0,
                createdAt: new Date().toISOString(),
                shopUrl: `http://localhost:5174/shop/${shopName}`
              }
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/shops/:id - Update shop
router.put('/:id', verifyToken, (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, description, contactMethod, contactValue } = req.body;

    // Validate input
    if (!displayName || !contactMethod || !contactValue) {
      return res.status(400).json({ 
        message: 'Display name, contact method, and contact value are required' 
      });
    }

    // Validate contact method
    const validContactMethods = ['whatsapp', 'telegram', 'email'];
    if (!validContactMethods.includes(contactMethod)) {
      return res.status(400).json({ 
        message: 'Contact method must be whatsapp, telegram, or email' 
      });
    }

    // Verify ownership
    db.get('SELECT id FROM shops WHERE id = ? AND user_id = ? AND is_active = 1', [id, req.user.userId], (err, shop) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found or access denied' });
      }

      // Update shop
      db.run(
        `UPDATE shops 
         SET shop_display_name = ?, description = ?, contact_method = ?, contact_value = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [displayName, description || null, contactMethod, contactValue, id, req.user.userId],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Error updating shop' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: 'Shop not found' });
          }

          res.json({
            message: 'Shop updated successfully',
            shop: {
              id: parseInt(id),
              displayName,
              description,
              contactMethod,
              contactValue,
              updatedAt: new Date().toISOString()
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/shops/:shopName/products - Get products for a shop
router.get('/:shopName/products', verifyToken, (req, res) => {
  try {
    const { shopName } = req.params;

    // Verify shop ownership
    db.get('SELECT id FROM shops WHERE shop_name = ? AND user_id = ? AND is_active = 1', [shopName, req.user.userId], (err, shop) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found or access denied' });
      }

      // Get products
      db.all(
        'SELECT * FROM products WHERE shop_id = ? AND is_active = 1 ORDER BY created_at DESC',
        [shop.id],
        (err, products) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
          }

          res.json({
            products: products.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description,
              price: parseFloat(p.price),
              imageUrl: p.image_url,
              videos: p.videos ? JSON.parse(p.videos) : [],
              isVisible: p.is_visible === 1,
              createdAt: p.created_at,
              updatedAt: p.updated_at
            }))
          });
        }
      );
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/shops/:shopName/products - Add product to shop
router.post('/:shopName/products', verifyToken, (req, res) => {
  try {
    const { shopName } = req.params;
    const { title, description, price, imageUrl, videos } = req.body;

    // Validate input
    if (!title || !price) {
      return res.status(400).json({ message: 'Product title and price are required' });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    // Verify shop ownership
    db.get('SELECT id FROM shops WHERE shop_name = ? AND user_id = ? AND is_active = 1', [shopName, req.user.userId], (err, shop) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found or access denied' });
      }

      // Add product
      db.run(
        'INSERT INTO products (shop_id, title, description, price, image_url, videos) VALUES (?, ?, ?, ?, ?, ?)',
        [shop.id, title, description || null, parseFloat(price), imageUrl || null, videos ? JSON.stringify(videos) : null],
        function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Error adding product' });
          }

          res.status(201).json({
            message: 'Product added successfully',
            product: {
              id: this.lastID,
              title,
              description,
              price: parseFloat(price),
              imageUrl,
              createdAt: new Date().toISOString()
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/shops/public/:shopName - Public shop view (no authentication required)
router.get('/public/:shopName', (req, res) => {
  try {
    const { shopName } = req.params;
    
    // Get shop details with products
    db.get(
      `SELECT 
        s.id,
        s.shop_name,
        s.shop_display_name as displayName,
        s.description,
        s.contact_method as contactMethod,
        s.contact_value as contactValue,
        s.created_at as createdAt
      FROM shops s 
      WHERE s.shop_name = ? AND s.is_active = 1`,
      [shopName],
      (err, shop) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Server error' });
        }

        if (!shop) {
          return res.status(404).json({ message: 'Shop not found' });
        }

        // Get shop products
        db.all(
          `SELECT 
            id,
            title,
            description,
            price,
            image_url as imageUrl,
            created_at as createdAt
          FROM products 
          WHERE shop_id = ? AND is_active = 1 AND is_visible = 1
          ORDER BY created_at DESC`,
          [shop.id],
          (productErr, products) => {
            if (productErr) {
              console.error('Products database error:', productErr);
              return res.status(500).json({ message: 'Server error' });
            }

            res.json({
              shop: {
                ...shop,
                shopUrl: `http://localhost:5174/shop/${shop.shop_name}`,
                productCount: products.length
              },
              products: products || []
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