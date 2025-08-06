import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager, shopAPI } from '../../../api';
import { FaChartLine, FaUsers, FaDollarSign, FaBox, FaCalendarAlt } from 'react-icons/fa';
import ShopLayout from '../components/ShopLayout/ShopLayout';
import './Analytics.css';

function Analytics() {
  const [shop, setShop] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30days');

  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const shopResponse = await shopAPI.getMyShop();
      setShop(shopResponse.data.shop);
      
      // Mock analytics data - replace with real API call
      setAnalytics({
        totalViews: 1247,
        totalOrders: 23,
        totalRevenue: 1850.50,
        totalProducts: shopResponse.data.shop?.productCount || 0,
        viewsChange: 12.5,
        ordersChange: -5.2,
        revenueChange: 18.7,
        productsChange: 8.3,
        recentOrders: [
          { id: 1, customerName: 'John Doe', amount: 125.00, date: '2025-07-28', status: 'completed' },
          { id: 2, customerName: 'Jane Smith', amount: 89.99, date: '2025-07-27', status: 'pending' },
          { id: 3, customerName: 'Bob Johnson', amount: 245.50, date: '2025-07-26', status: 'completed' }
        ],
        topProducts: [
          { id: 1, name: 'Product A', sales: 15, revenue: 450.00 },
          { id: 2, name: 'Product B', sales: 8, revenue: 320.00 },
          { id: 3, name: 'Product C', sales: 5, revenue: 125.00 }
        ]
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ShopLayout title="Analytics" subtitle="Track your shop performance">
        <div className="loading">Loading analytics...</div>
      </ShopLayout>
    );
  }

  if (!shop) {
    return (
      <ShopLayout title="Analytics" subtitle="Track your shop performance">
        <div className="no-shop-message">
          <FaChartLine className="no-shop-icon" />
          <h2>No Shop Found</h2>
          <p>Create a shop to start tracking analytics.</p>
        </div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout title="Analytics" subtitle={`Performance metrics for ${shop.displayName}`}>
      <div className="analytics-page">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Time Range Selector */}
        <div className="analytics-controls">
          <div className="time-range-selector">
            <button 
              className={`time-btn ${timeRange === '7days' ? 'active' : ''}`}
              onClick={() => setTimeRange('7days')}
            >
              Last 7 Days
            </button>
            <button 
              className={`time-btn ${timeRange === '30days' ? 'active' : ''}`}
              onClick={() => setTimeRange('30days')}
            >
              Last 30 Days
            </button>
            <button 
              className={`time-btn ${timeRange === '90days' ? 'active' : ''}`}
              onClick={() => setTimeRange('90days')}
            >
              Last 90 Days
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon views">
              <FaChartLine />
            </div>
            <div className="metric-content">
              <h3>Store Views</h3>
              <div className="metric-value">{analytics.totalViews.toLocaleString()}</div>
              <div className={`metric-change ${analytics.viewsChange >= 0 ? 'positive' : 'negative'}`}>
                {analytics.viewsChange >= 0 ? '+' : ''}{analytics.viewsChange}%
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon orders">
              <FaUsers />
            </div>
            <div className="metric-content">
              <h3>Total Orders</h3>
              <div className="metric-value">{analytics.totalOrders}</div>
              <div className={`metric-change ${analytics.ordersChange >= 0 ? 'positive' : 'negative'}`}>
                {analytics.ordersChange >= 0 ? '+' : ''}{analytics.ordersChange}%
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon revenue">
              <FaDollarSign />
            </div>
            <div className="metric-content">
              <h3>Total Revenue</h3>
              <div className="metric-value">${analytics.totalRevenue.toFixed(2)}</div>
              <div className={`metric-change ${analytics.revenueChange >= 0 ? 'positive' : 'negative'}`}>
                {analytics.revenueChange >= 0 ? '+' : ''}{analytics.revenueChange}%
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon products">
              <FaBox />
            </div>
            <div className="metric-content">
              <h3>Total Products</h3>
              <div className="metric-value">{analytics.totalProducts}</div>
              <div className={`metric-change ${analytics.productsChange >= 0 ? 'positive' : 'negative'}`}>
                {analytics.productsChange >= 0 ? '+' : ''}{analytics.productsChange}%
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders & Top Products */}
        <div className="analytics-details">
          <div className="recent-orders">
            <h3>Recent Orders</h3>
            <div className="orders-list">
              {analytics.recentOrders.map((order) => (
                <div key={order.id} className="order-item">
                  <div className="order-customer">{order.customerName}</div>
                  <div className="order-amount">${order.amount.toFixed(2)}</div>
                  <div className="order-date">{order.date}</div>
                  <div className={`order-status ${order.status}`}>
                    {order.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="top-products">
            <h3>Top Products</h3>
            <div className="products-list">
              {analytics.topProducts.map((product) => (
                <div key={product.id} className="product-item">
                  <div className="product-name">{product.name}</div>
                  <div className="product-sales">{product.sales} sales</div>
                  <div className="product-revenue">${product.revenue.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}

export default Analytics;