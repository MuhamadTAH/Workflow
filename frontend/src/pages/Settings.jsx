import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles.css';
import '../styles/DashboardDark.css';
import { API_BASE_URL } from '../config/api';

// Billing Content Component
const BillingContent = () => {
  const [billingData, setBillingData] = useState({
    billing: null,
    currentSpending: { currentSpending: 0, spendingLimit: 100, percentage: 0 },
    freeTier: { remainingTokens: 1000, totalLimit: 1000 },
    responseCount: { totalResponses: 0, monthlyResponses: 0 },
    usage: [],
    history: [],
    models: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [spendingLimitType, setSpendingLimitType] = useState('unlimited');
  const [customSpendingLimit, setCustomSpendingLimit] = useState('');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      const [billingRes, spendingRes, freeTierRes, responseCountRes, usageRes, historyRes, modelsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/billing/info`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/billing/current-spending`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/billing/free-tier`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/billing/response-count`, { credentials: 'include' }).catch(() => ({ ok: false })),
        fetch(`${API_BASE_URL}/api/billing/usage`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/billing/history`, { credentials: 'include' }),
        fetch(`${API_BASE_URL}/api/billing/models`, { credentials: 'include' })
      ]);

      const [billing, spending, freeTier, responseCountResult, usage, history, models] = await Promise.all([
        billingRes.json(),
        spendingRes.json(),
        freeTierRes.json(),
        responseCountRes.ok ? responseCountRes.json() : { totalResponses: 0, monthlyResponses: 0 },
        usageRes.json(),
        historyRes.json(),
        modelsRes.json()
      ]);

      setBillingData({
        billing: billing.billing,
        currentSpending: spending,
        freeTier,
        responseCount: responseCountResult,
        usage: usage.usage || [],
        history: history.history || [],
        models: models.models || []
      });

      const currentLimit = billing.billing?.spendingLimit;
      if (currentLimit === null) {
        setSpendingLimitType('unlimited');
        setCustomSpendingLimit('');
      } else {
        setSpendingLimitType('custom');
        setCustomSpendingLimit(currentLimit.toString());
      }
    } catch (err) {
      setError('Failed to load billing data');
      console.error('Billing data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSpendingLimit = async () => {
    try {
      let limit;
      
      if (spendingLimitType === 'unlimited') {
        limit = null;
      } else {
        limit = parseFloat(customSpendingLimit);
        if (isNaN(limit) || limit < 0 || limit > 100000) {
          alert('Please enter a valid spending limit between $0 and $100,000');
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/billing/spending-limit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ limit })
      });

      if (response.ok) {
        const result = await response.json();
        loadBillingData();
        alert(result.message || 'Spending limit updated successfully');
      } else {
        alert('Failed to update spending limit');
      }
    } catch (err) {
      alert('Error updating spending limit');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="settings-section">
        <div className="card-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ 
            color: '#E0E0E0', 
            fontSize: '1.3rem', 
            fontWeight: '600',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="fas fa-credit-card" style={{ color: '#4a90e2' }}></i>
            Billing & Usage
          </h2>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#a0a0a0' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #262626', 
            borderTop: '3px solid #4a90e2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          Loading billing data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-section">
        <div className="card-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ 
            color: '#E0E0E0', 
            fontSize: '1.3rem', 
            fontWeight: '600',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="fas fa-credit-card" style={{ color: '#4a90e2' }}></i>
            Billing & Usage
          </h2>
        </div>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#262626',
          borderRadius: '10px',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ color: '#f44336', marginBottom: '1rem', fontSize: '2rem' }}>⚠️</div>
          <h3 style={{ color: '#f44336', marginBottom: '0.5rem' }}>Error Loading Billing Data</h3>
          <p style={{ color: '#a0a0a0', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={loadBillingData}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const freeTokensUsed = billingData.freeTier.totalLimit - billingData.freeTier.remainingTokens;
  const freeTokensPercentage = (freeTokensUsed / billingData.freeTier.totalLimit) * 100;

  return (
    <div className="settings-section">
      <div className="card-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h2 style={{ 
          color: '#E0E0E0', 
          fontSize: '1.3rem', 
          fontWeight: '600',
          margin: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <i className="fas fa-credit-card" style={{ color: '#4a90e2' }}></i>
          Billing & Usage
        </h2>
      </div>

      {/* Quick Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        {/* Current Spending */}
        <div style={{
          backgroundColor: '#262626',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(74, 144, 226, 0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4a90e2',
              fontSize: '1.25rem'
            }}>💰</div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#a0a0a0', margin: '0' }}>This Month</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E0E0E0', margin: '0' }}>
                {formatCurrency(billingData.currentSpending.currentSpending)}
              </p>
            </div>
          </div>
          <div style={{ width: '100%', backgroundColor: '#1a1a1a', borderRadius: '4px', height: '6px' }}>
            <div 
              style={{ 
                backgroundColor: '#4a90e2',
                height: '6px',
                borderRadius: '4px',
                width: billingData.currentSpending.spendingLimit === null 
                  ? '5px'
                  : `${Math.min(billingData.currentSpending.percentage, 100)}%`
              }}
            ></div>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#8E8E8E', margin: '0.5rem 0 0 0' }}>
            {billingData.currentSpending.spendingLimit === null 
              ? 'No spending limit (unlimited)' 
              : `${billingData.currentSpending.percentage.toFixed(1)}% of ${formatCurrency(billingData.currentSpending.spendingLimit)} limit`
            }
          </p>
        </div>

        {/* Free Tier */}
        <div style={{
          backgroundColor: '#262626',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
              fontSize: '1.25rem'
            }}>⚡</div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#a0a0a0', margin: '0' }}>Free Tokens</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E0E0E0', margin: '0' }}>
                {billingData.freeTier.remainingTokens}
              </p>
            </div>
          </div>
          <div style={{ width: '100%', backgroundColor: '#1a1a1a', borderRadius: '4px', height: '6px' }}>
            <div 
              style={{ 
                backgroundColor: '#10b981',
                height: '6px',
                borderRadius: '4px',
                width: `${100 - freeTokensPercentage}%`
              }}
            ></div>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#8E8E8E', margin: '0.5rem 0 0 0' }}>
            {freeTokensUsed} of {billingData.freeTier.totalLimit} used
          </p>
        </div>

        {/* AI Responses */}
        <div style={{
          backgroundColor: '#262626',
          padding: '1.5rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6366f1',
              fontSize: '1.25rem'
            }}>💬</div>
            <div>
              <p style={{ fontSize: '0.8rem', color: '#a0a0a0', margin: '0' }}>AI Responses</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E0E0E0', margin: '0' }}>
                {billingData.responseCount.totalResponses}
              </p>
            </div>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#8E8E8E', margin: '0' }}>
            {billingData.responseCount.monthlyResponses} this month
          </p>
        </div>
      </div>

      {/* Billing Settings */}
      <div style={{
        backgroundColor: '#262626',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ color: '#E0E0E0', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
          Monthly Spending Limit
        </h3>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
          <select
            value={spendingLimitType}
            onChange={(e) => setSpendingLimitType(e.target.value)}
            style={{
              flex: '1',
              padding: '0.75rem',
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#E0E0E0',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          >
            <option value="unlimited">Unlimited</option>
            <option value="custom">Custom Amount</option>
          </select>
          
          {spendingLimitType === 'custom' && (
            <input
              type="number"
              value={customSpendingLimit}
              onChange={(e) => setCustomSpendingLimit(e.target.value)}
              style={{
                width: '120px',
                padding: '0.75rem',
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#E0E0E0',
                fontSize: '0.9rem',
                outline: 'none'
              }}
              placeholder="Amount"
              min="0"
              max="100000"
            />
          )}
          
          <button
            onClick={updateSpendingLimit}
            style={{
              backgroundColor: '#4a90e2',
              color: 'white',
              padding: '0.75rem 1rem',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
          >
            Update
          </button>
        </div>
        
        <p style={{ fontSize: '0.75rem', color: '#8E8E8E', margin: '0' }}>
          {spendingLimitType === 'unlimited' 
            ? 'No spending limit will be enforced'
            : 'Enter a custom amount between $0-$100,000'
          }
        </p>
      </div>

      {/* Recent Usage */}
      {billingData.usage.length > 0 && (
        <div style={{
          backgroundColor: '#262626',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1.5rem'
        }}>
          <h3 style={{ color: '#E0E0E0', marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '600' }}>
            Recent Usage
          </h3>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {billingData.usage.slice(0, 10).map((day, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                backgroundColor: '#1a1a1a',
                borderRadius: '8px',
                marginBottom: '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div>
                  <p style={{ fontWeight: '500', color: '#E0E0E0', margin: '0', fontSize: '0.9rem' }}>
                    {formatDate(day.usage_date)}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#a0a0a0', margin: '0' }}>
                    {day.requests} requests • {day.tokens} tokens
                  </p>
                </div>
                <p style={{ fontWeight: '600', color: '#E0E0E0', margin: '0', fontSize: '0.9rem' }}>
                  {formatCurrency(day.amount || 0)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function Settings() {
  const { theme, colors } = useTheme();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: 'fas fa-cog' },
    { id: 'account', name: 'Account', icon: 'fas fa-user' },
    { id: 'notifications', name: 'Notifications', icon: 'fas fa-bell' },
    { id: 'security', name: 'Security', icon: 'fas fa-shield-alt' },
    { id: 'api', name: 'API Keys', icon: 'fas fa-key' },
    { id: 'billing', name: 'Billing', icon: 'fas fa-credit-card' }
  ];

  return (
    <div className={`professional-dashboard ${theme === 'dark' ? 'variant-1' : 'light-theme'}`} 
         style={{ backgroundColor: '#1a1a1a', color: '#E0E0E0', minHeight: '100vh', paddingLeft: '80px' }}>
      
      {/* Header */}
      <div className="dashboard-hero" style={{ 
        backgroundColor: '#323232', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 className="hero-title" style={{ 
            fontSize: '2.5rem', 
            fontWeight: '600', 
            margin: '0 0 0.5rem 0',
            color: '#E0E0E0'
          }}>
            ⚙️ Settings
          </h1>
          <p className="hero-subtitle" style={{ 
            color: '#a0a0a0', 
            fontSize: '1.1rem',
            margin: 0 
          }}>
            Manage your account preferences and application settings
          </p>
        </div>
      </div>

      <div className="dashboard-content" style={{ 
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 2rem 2rem 2rem'
      }}>
        <div className="content-grid" style={{
          display: 'grid',
          gridTemplateColumns: '280px 1fr',
          gap: '2rem'
        }}>
        
        {/* Settings Navigation */}
        <div className="dashboard-card" style={{
          backgroundColor: '#323232',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '1.5rem',
          height: 'fit-content',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)'
        }}>
          <div className="card-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ 
              color: '#E0E0E0',
              fontSize: '1.1rem',
              fontWeight: '600',
              margin: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-list" style={{ color: '#4a90e2' }}></i>
              Categories
            </h3>
          </div>
          <nav>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.75rem 1rem',
                  margin: '0.25rem 0',
                  backgroundColor: activeTab === tab.id ? 'rgba(74, 144, 226, 0.2)' : '#262626',
                  color: activeTab === tab.id ? '#4a90e2' : '#E0E0E0',
                  border: activeTab === tab.id ? '1px solid rgba(74, 144, 226, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = '#424242';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = '#262626';
                  }
                }}
              >
                <i className={tab.icon} style={{ color: activeTab === tab.id ? '#4a90e2' : '#a0a0a0' }}></i>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="dashboard-card" style={{
          backgroundColor: '#323232',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)'
        }}>
          {activeTab === 'billing' ? <BillingContent /> : (
            <div className="settings-section">
              <div className="card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{ 
                  color: '#E0E0E0', 
                  fontSize: '1.3rem', 
                  fontWeight: '600',
                  margin: '0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <i className={tabs.find(t => t.id === activeTab)?.icon} style={{ color: '#4a90e2' }}></i>
                  {tabs.find(t => t.id === activeTab)?.name}
                </h2>
              </div>
              
              <div style={{
                padding: '1.5rem',
                backgroundColor: '#262626',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚧</div>
                <h3 style={{ color: '#E0E0E0', marginBottom: '0.5rem' }}>Coming Soon</h3>
                <p style={{ color: '#a0a0a0', margin: '0' }}>
                  This section is under development and will be available soon.
                </p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;