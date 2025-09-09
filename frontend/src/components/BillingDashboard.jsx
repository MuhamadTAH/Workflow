import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Zap, MessageSquare } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const BillingDashboard = () => {
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
  const [showAddCard, setShowAddCard] = useState(false);
  const [spendingLimitType, setSpendingLimitType] = useState('unlimited');
  const [customSpendingLimit, setCustomSpendingLimit] = useState('');

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load all billing data in parallel
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

      // Set spending limit state based on current value
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
        limit = null; // null = unlimited
      } else {
        // Handle custom amount
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
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', padding: '24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ animation: 'pulse 2s infinite' }}>
            <div style={{ height: '32px', backgroundColor: '#323232', borderRadius: '8px', width: '25%', marginBottom: '32px' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ backgroundColor: '#323232', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <div style={{ height: '16px', backgroundColor: '#262626', borderRadius: '8px', width: '75%', marginBottom: '16px' }}></div>
                  <div style={{ height: '32px', backgroundColor: '#262626', borderRadius: '8px', width: '50%' }}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', padding: '24px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ backgroundColor: '#323232', border: '1px solid rgba(255, 0, 0, 0.3)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <AlertCircle className="h-12 w-12" style={{ color: '#ef4444', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#E0E0E0', marginBottom: '8px' }}>Error Loading Billing Data</h2>
            <p style={{ color: '#A0A0A0', marginBottom: '16px' }}>{error}</p>
            <button 
              onClick={loadBillingData}
              style={{ backgroundColor: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const freeTokensUsed = billingData.freeTier.totalLimit - billingData.freeTier.remainingTokens;
  const freeTokensPercentage = (freeTokensUsed / billingData.freeTier.totalLimit) * 100;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', padding: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#E0E0E0', marginBottom: '8px' }}>Billing & Usage</h1>
          <p style={{ color: '#A0A0A0' }}>Manage your AI usage and billing preferences</p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Current Spending */}
          <div style={{ backgroundColor: '#323232', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DollarSign className="h-8 w-8" style={{ color: '#4a90e2' }} />
                <div style={{ marginLeft: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#A0A0A0' }}>This Month</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#E0E0E0' }}>
                    {formatCurrency(billingData.currentSpending.currentSpending)}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ width: '100%', backgroundColor: '#262626', borderRadius: '9999px', height: '8px' }}>
              <div 
                style={{ 
                  backgroundColor: '#4a90e2',
                  height: '8px',
                  borderRadius: '9999px',
                  width: billingData.currentSpending.spendingLimit === null 
                    ? '5px' // Small indicator for unlimited
                    : `${Math.min(billingData.currentSpending.percentage, 100)}%` 
                }}
              ></div>
            </div>
            <p style={{ fontSize: '12px', color: '#8E8E8E', marginTop: '8px' }}>
              {billingData.currentSpending.spendingLimit === null 
                ? 'No spending limit (unlimited)' 
                : `${billingData.currentSpending.percentage.toFixed(1)}% of ${formatCurrency(billingData.currentSpending.spendingLimit)} limit`
              }
            </p>
          </div>

          {/* Free Tier */}
          <div style={{ backgroundColor: '#323232', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Zap className="h-8 w-8" style={{ color: '#10b981' }} />
                <div style={{ marginLeft: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#A0A0A0' }}>Free Tokens</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#E0E0E0' }}>
                    {billingData.freeTier.remainingTokens}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ width: '100%', backgroundColor: '#262626', borderRadius: '9999px', height: '8px' }}>
              <div 
                style={{ 
                  backgroundColor: '#10b981',
                  height: '8px',
                  borderRadius: '9999px',
                  width: `${100 - freeTokensPercentage}%`
                }}
              ></div>
            </div>
            <p style={{ fontSize: '12px', color: '#8E8E8E', marginTop: '8px' }}>
              {freeTokensUsed} of {billingData.freeTier.totalLimit} used
            </p>
          </div>

          {/* Payment Method */}
          <div style={{ backgroundColor: '#323232', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CreditCard className="h-8 w-8" style={{ color: '#D4AF37' }} />
                <div style={{ marginLeft: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#A0A0A0' }}>Payment Method</p>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#E0E0E0' }}>
                    {billingData.billing?.hasPaymentMethod ? (
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <CheckCircle className="h-4 w-4" style={{ color: '#10b981', marginRight: '4px' }} />
                        •••• {billingData.billing.cardLastFour}
                      </span>
                    ) : (
                      <span style={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
                        <Clock className="h-4 w-4" style={{ marginRight: '4px' }} />
                        Not Set
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            {!billingData.billing?.hasPaymentMethod && (
              <button 
                onClick={() => setShowAddCard(true)}
                style={{ width: '100%', backgroundColor: '#D4AF37', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#B8941F'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#D4AF37'}
              >
                Add Card
              </button>
            )}
          </div>

          {/* AI Responses */}
          <div style={{ backgroundColor: '#323232', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <MessageSquare className="h-8 w-8" style={{ color: '#4a90e2' }} />
                <div style={{ marginLeft: '12px' }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#A0A0A0' }}>AI Responses</p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#E0E0E0' }}>
                    {billingData.responseCount.totalResponses}
                  </p>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#8E8E8E' }}>
              {billingData.responseCount.monthlyResponses} this month
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
          {/* Settings */}
          <div style={{ backgroundColor: '#323232', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#E0E0E0', marginBottom: '24px' }}>Billing Settings</h2>
            
            {/* Spending Limit */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#E0E0E0', marginBottom: '8px' }}>
                Monthly Spending Limit
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <select
                  value={spendingLimitType}
                  onChange={(e) => setSpendingLimitType(e.target.value)}
                  style={{ flex: '1', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#262626', color: '#E0E0E0', outline: 'none' }}
                >
                  <option value="unlimited">Unlimited</option>
                  <option value="custom">Custom Amount</option>
                </select>
                {spendingLimitType === 'custom' && (
                  <input
                    type="number"
                    value={customSpendingLimit}
                    onChange={(e) => setCustomSpendingLimit(e.target.value)}
                    style={{ width: '128px', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#262626', color: '#E0E0E0', outline: 'none' }}
                    placeholder="Amount"
                    min="0"
                    max="100000"
                  />
                )}
                <button
                  onClick={updateSpendingLimit}
                  style={{ backgroundColor: '#4a90e2', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#357abd'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#4a90e2'}
                >
                  Update
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#8E8E8E', marginTop: '4px' }}>
                {spendingLimitType === 'unlimited' 
                  ? 'No spending limit will be enforced'
                  : 'Enter a custom amount between $0-$100,000'
                }
              </p>
            </div>

            {/* AI Models & Pricing */}
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#E0E0E0', marginBottom: '16px' }}>AI Models & Pricing</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {billingData.models.map((model) => (
                  <div key={model.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#262626', borderRadius: '8px' }}>
                    <div>
                      <p style={{ fontWeight: '500', color: '#E0E0E0' }}>{model.name}</p>
                      <p style={{ fontSize: '14px', color: '#A0A0A0', textTransform: 'capitalize' }}>{model.provider}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '14px', fontWeight: '500', color: '#E0E0E0' }}>
                        ${(model.price_per_input_token * 1000000).toFixed(2)}/1M input
                      </p>
                      <p style={{ fontSize: '12px', color: '#A0A0A0' }}>
                        ${(model.price_per_output_token * 1000000).toFixed(2)}/1M output
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Usage */}
          <div style={{ backgroundColor: '#323232', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#E0E0E0', marginBottom: '24px' }}>Recent Usage</h2>
            
            {billingData.usage.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#8E8E8E' }}>
                <Zap className="h-12 w-12" style={{ margin: '0 auto 16px', opacity: '0.5' }} />
                <p>No usage data yet</p>
                <p style={{ fontSize: '14px' }}>Start using AI features to see your usage here</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {billingData.usage.slice(0, 10).map((day, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#262626', borderRadius: '8px' }}>
                    <div>
                      <p style={{ fontWeight: '500', color: '#E0E0E0' }}>{formatDate(day.usage_date)}</p>
                      <p style={{ fontSize: '14px', color: '#A0A0A0' }}>
                        {day.requests} requests • {day.tokens} tokens
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: '500', color: '#E0E0E0' }}>{formatCurrency(day.amount || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Billing History */}
        {billingData.history.length > 0 && (
          <div style={{ marginTop: '32px', backgroundColor: '#323232', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#E0E0E0', marginBottom: '24px' }}>Billing History</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#262626' }}>
                  <tr>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Billing Period
                    </th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Usage
                    </th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Amount
                    </th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Status
                    </th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: '#323232' }}>
                  {billingData.history.map((bill, index) => (
                    <tr key={index} style={{ borderTop: index > 0 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none' }}>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: '500', color: '#E0E0E0' }}>
                        {formatDate(bill.billing_month)}
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#A0A0A0' }}>
                        {bill.total_requests} requests • {bill.total_tokens} tokens
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#E0E0E0' }}>
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: '9999px',
                          backgroundColor: bill.billing_status === 'paid' 
                            ? 'rgba(16, 185, 129, 0.2)'
                            : bill.billing_status === 'pending'
                            ? 'rgba(245, 158, 11, 0.2)' 
                            : 'rgba(239, 68, 68, 0.2)',
                          color: bill.billing_status === 'paid' 
                            ? '#10b981'
                            : bill.billing_status === 'pending'
                            ? '#f59e0b' 
                            : '#ef4444'
                        }}>
                          {bill.billing_status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: '14px', color: '#4a90e2' }}>
                        {bill.invoice_url && (
                          <a href={bill.invoice_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#4a90e2' }}
                             onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                             onMouseOut={(e) => e.target.style.textDecoration = 'none'}>
                            View Invoice
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Payment Method Modal */}
        {showAddCard && (
          <div style={{ position: 'fixed', inset: '0', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: '50' }}>
            <div style={{ backgroundColor: '#323232', borderRadius: '12px', padding: '24px', maxWidth: '448px', width: '100%', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#E0E0E0', marginBottom: '16px' }}>Add Payment Method</h3>
              <p style={{ color: '#A0A0A0', marginBottom: '24px' }}>
                Add a credit card to enable automatic billing for AI usage beyond your free tier.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#E0E0E0', marginBottom: '8px' }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    style={{ width: '100%', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#262626', color: '#E0E0E0', outline: 'none' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#E0E0E0', marginBottom: '8px' }}>
                      Expiry
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      style={{ width: '100%', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#262626', color: '#E0E0E0', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#E0E0E0', marginBottom: '8px' }}>
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      style={{ width: '100%', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#262626', color: '#E0E0E0', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowAddCard(false)}
                  style={{ flex: '1', backgroundColor: '#262626', color: '#E0E0E0', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1a1a1a'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#262626'}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement Stripe payment method creation
                    alert('Payment method integration coming soon!');
                    setShowAddCard(false);
                  }}
                  style={{ flex: '1', backgroundColor: '#4a90e2', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#357abd'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#4a90e2'}
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingDashboard;