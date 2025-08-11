const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/public/shop/:shopName - Get public shop data
router.get('/shop/:shopName', (req, res) => {
  try {
    const { shopName } = req.params;

    try {
      // Get shop information
      const shopStmt = db.prepare(
        `SELECT 
          s.id,
          s.shop_name,
          s.shop_display_name,
          s.description,
          s.contact_method,
          s.contact_value,
          s.created_at,
          u.name as owner_name,
          u.email as owner_email
        FROM shops s
        JOIN users u ON s.user_id = u.id
        WHERE s.shop_name = ? AND s.is_active = 1`
      );
      const shop = shopStmt.get(shopName);

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      // Get shop products
      const productsStmt = db.prepare('SELECT id, title, description, price, image_url, created_at FROM products WHERE shop_id = ? AND is_active = 1 ORDER BY created_at DESC');
      const products = productsStmt.all(shop.id);

      res.json({
        shop: {
          id: shop.id,
          shopName: shop.shop_name,
          displayName: shop.shop_display_name,
          description: shop.description,
          contactMethod: shop.contact_method,
          contactValue: shop.contact_value,
          ownerName: shop.owner_name,
          createdAt: shop.created_at,
          productCount: products.length
        },
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: parseFloat(p.price),
          imageUrl: p.image_url,
          createdAt: p.created_at
        }))
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ message: 'Database error' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/public/shop/:shopName/products - Get public shop products (alternative endpoint)
router.get('/shop/:shopName/products', (req, res) => {
  try {
    const { shopName } = req.params;

    try {
      // Get shop ID
      const shopStmt = db.prepare('SELECT id FROM shops WHERE shop_name = ? AND is_active = 1');
      const shop = shopStmt.get(shopName);

      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      // Get shop products
      const productsStmt = db.prepare('SELECT id, title, description, price, image_url, created_at FROM products WHERE shop_id = ? AND is_active = 1 ORDER BY created_at DESC');
      const products = productsStmt.all(shop.id);

      res.json({
        products: products.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          price: parseFloat(p.price),
          imageUrl: p.image_url,
          createdAt: p.created_at
        }))
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ message: 'Database error' });
    }
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;