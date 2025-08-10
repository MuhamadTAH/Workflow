import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { tokenManager } from '../../../api';
import { FaUsers, FaEnvelope, FaPhone, FaCalendarAlt } from 'react-icons/fa';
import ShopLayout from '../components/ShopLayout/ShopLayout';
import './Customers.css';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    // Mock data - replace with real API
    setCustomers([
      { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1234567890', orders: 5, totalSpent: 450.00, lastOrder: '2025-07-25' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1234567891', orders: 3, totalSpent: 320.00, lastOrder: '2025-07-23' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+1234567892', orders: 8, totalSpent: 680.00, lastOrder: '2025-07-28' }
    ]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <ShopLayout title="Customers" subtitle="Manage your customer relationships">
        <div className="loading">Loading customers...</div>
      </ShopLayout>
    );
  }

  return (
    <ShopLayout title="Customers" subtitle="View and manage your customers">
      <div className="customers-page">
        <div className="customers-header">
          <h3>Customers ({customers.length})</h3>
        </div>

        {customers.length === 0 ? (
          <div className="no-customers-message">
            <FaUsers className="no-customers-icon" />
            <h3>No Customers Yet</h3>
            <p>When customers make purchases, they'll appear here!</p>
          </div>
        ) : (
          <div className="customers-grid">
            {customers.map((customer) => (
              <div key={customer.id} className="customer-card">
                <div className="customer-header">
                  <div className="customer-avatar">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="customer-info">
                    <h4 className="customer-name">{customer.name}</h4>
                    <p className="customer-email">
                      <FaEnvelope /> {customer.email}
                    </p>
                    {customer.phone && (
                      <p className="customer-phone">
                        <FaPhone /> {customer.phone}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="customer-stats">
                  <div className="stat">
                    <div className="stat-value">{customer.orders}</div>
                    <div className="stat-label">Orders</div>
                  </div>
                  <div className="stat">
                    <div className="stat-value">${customer.totalSpent.toFixed(2)}</div>
                    <div className="stat-label">Total Spent</div>
                  </div>
                </div>
                
                <div className="customer-footer">
                  <span className="last-order">
                    <FaCalendarAlt /> Last order: {customer.lastOrder}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ShopLayout>
  );
}

export default Customers;