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
  const [spendingLimitInput, setSpendingLimitInput] = useState('');

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

      setSpendingLimitInput(
        billing.billing?.spendingLimit === null ? 'unlimited' : 
        billing.billing?.spendingLimit?.toString() || 'unlimited'
      );
    } catch (err) {
      setError('Failed to load billing data');
      console.error('Billing data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSpendingLimit = async () => {
    try {
      // Handle unlimited option
      let limit;
      if (spendingLimitInput.toLowerCase() === 'unlimited' || spendingLimitInput === '') {
        limit = null; // null = unlimited
      } else {
        limit = parseFloat(spendingLimitInput);
        if (isNaN(limit) || limit < 0 || limit > 100000) {
          alert('Please enter a valid spending limit between $0 and $100,000, or "unlimited"');
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Billing Data</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={loadBillingData}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Usage</h1>
          <p className="text-gray-600">Manage your AI usage and billing preferences</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Current Spending */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(billingData.currentSpending.currentSpending)}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ 
                  width: billingData.currentSpending.spendingLimit === null 
                    ? '5px' // Small indicator for unlimited
                    : `${Math.min(billingData.currentSpending.percentage, 100)}%` 
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {billingData.currentSpending.spendingLimit === null 
                ? 'No spending limit (unlimited)' 
                : `${billingData.currentSpending.percentage.toFixed(1)}% of ${formatCurrency(billingData.currentSpending.spendingLimit)} limit`
              }
            </p>
          </div>

          {/* Free Tier */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Free Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {billingData.freeTier.remainingTokens}
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${100 - freeTokensPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {freeTokensUsed} of {billingData.freeTier.totalLimit} used
            </p>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Payment Method</p>
                  <p className="text-lg font-bold text-gray-900">
                    {billingData.billing?.hasPaymentMethod ? (
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        •••• {billingData.billing.cardLastFour}
                      </span>
                    ) : (
                      <span className="flex items-center text-orange-600">
                        <Clock className="h-4 w-4 mr-1" />
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
                className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 transition-colors"
              >
                Add Card
              </button>
            )}
          </div>

          {/* AI Responses */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-indigo-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">AI Responses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {billingData.responseCount.totalResponses}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {billingData.responseCount.monthlyResponses} this month
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing Settings</h2>
            
            {/* Spending Limit */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Spending Limit
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={spendingLimitInput}
                  onChange={(e) => setSpendingLimitInput(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="unlimited or 100"
                />
                <button
                  onClick={updateSpendingLimit}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Update
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Set a monthly spending limit ($0-$100,000) or type "unlimited" for no limit
              </p>
            </div>

            {/* AI Models & Pricing */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">AI Models & Pricing</h3>
              <div className="space-y-3">
                {billingData.models.map((model) => (
                  <div key={model.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{model.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{model.provider}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${(model.price_per_input_token * 1000000).toFixed(2)}/1M input
                      </p>
                      <p className="text-xs text-gray-600">
                        ${(model.price_per_output_token * 1000000).toFixed(2)}/1M output
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Usage */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Usage</h2>
            
            {billingData.usage.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No usage data yet</p>
                <p className="text-sm">Start using AI features to see your usage here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {billingData.usage.slice(0, 10).map((day, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(day.usage_date)}</p>
                      <p className="text-sm text-gray-600">
                        {day.requests} requests • {day.tokens} tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(day.amount || 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Billing History */}
        {billingData.history.length > 0 && (
          <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Billing History</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingData.history.map((bill, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(bill.billing_month)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bill.total_requests} requests • {bill.total_tokens} tokens
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(bill.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          bill.billing_status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : bill.billing_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {bill.billing_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {bill.invoice_url && (
                          <a href={bill.invoice_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment Method</h3>
              <p className="text-gray-600 mb-6">
                Add a credit card to enable automatic billing for AI usage beyond your free tier.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowAddCard(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement Stripe payment method creation
                    alert('Payment method integration coming soon!');
                    setShowAddCard(false);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
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