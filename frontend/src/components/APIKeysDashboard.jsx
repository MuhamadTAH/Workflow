import React, { useState, useEffect } from 'react';
import { Key, Users, DollarSign, Activity, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const APIKeysDashboard = () => {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [createForm, setCreateForm] = useState({
    customer_name: '',
    customer_email: '',
    monthly_spending_limit: 1000,
    rate_limit_per_minute: 60,
    rate_limit_per_hour: 1000,
    notes: ''
  });

  useEffect(() => {
    loadAPIKeys();
  }, []);

  const loadAPIKeys = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/apikeys/list`);
      const data = await response.json();
      setApiKeys(data.api_keys || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAPIKey = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/apikeys/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateModal(false);
        setCreateForm({
          customer_name: '',
          customer_email: '',
          monthly_spending_limit: 1000,
          rate_limit_per_minute: 60,
          rate_limit_per_hour: 1000,
          notes: ''
        });
        loadAPIKeys();
        alert(`API Key created successfully!\n\nKey: ${data.api_key_info.api_key}\n\nPlease save this key - it won't be shown again!`);
      } else {
        alert('Error creating API key: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    }
  };

  const toggleKeyStatus = async (apiKey, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/apikeys/${apiKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });
      
      if (response.ok) {
        loadAPIKeys();
      } else {
        alert('Failed to update API key status');
      }
    } catch (error) {
      console.error('Error toggling API key status:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : 'Never';
  };

  const maskAPIKey = (key, show = false) => {
    if (!key) return 'N/A';
    if (show) return key;
    return key.substring(0, 8) + '•'.repeat(20) + key.slice(-4);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', padding: '1.5rem' }}>
        <div style={{ animation: 'pulse 2s infinite' }}>
          <div style={{ height: '2rem', backgroundColor: '#323232', borderRadius: '0.375rem', width: '33.333333%', marginBottom: '2rem' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ backgroundColor: '#262626', borderRadius: '0.5rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.5)' }}>
                <div style={{ height: '1rem', backgroundColor: '#323232', borderRadius: '0.375rem', width: '75%', marginBottom: '1rem' }}></div>
                <div style={{ height: '2rem', backgroundColor: '#323232', borderRadius: '0.375rem', width: '50%' }}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalKeys = apiKeys.length;
  const activeKeys = apiKeys.filter(k => k.is_active).length;
  const totalRevenue = apiKeys.reduce((sum, k) => sum + parseFloat(k.total_spent || 0), 0);
  const totalTokens = apiKeys.reduce((sum, k) => sum + parseInt(k.total_tokens || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', padding: '1.5rem' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#E0E0E0', marginBottom: '0.5rem' }}>API Keys Management</h1>
            <p style={{ color: '#A0A0A0' }}>Manage customer API keys and monitor usage</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              backgroundColor: '#4a90e2', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              borderRadius: '0.5rem', 
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#3a7bc8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#4a90e2'}
          >
            <Plus className="h-4 w-4" />
            <span>Create API Key</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: '#262626', borderRadius: '0.5rem', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#A0A0A0', marginBottom: '0.5rem' }}>Total Keys</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E0E0E0' }}>{totalKeys}</p>
              </div>
              <Key className="h-8 w-8" style={{ color: '#4a90e2' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#262626', borderRadius: '0.5rem', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#A0A0A0', marginBottom: '0.5rem' }}>Active Keys</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E0E0E0' }}>{activeKeys}</p>
              </div>
              <Users className="h-8 w-8" style={{ color: '#10b981' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#262626', borderRadius: '0.5rem', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#A0A0A0', marginBottom: '0.5rem' }}>Total Revenue</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E0E0E0' }}>{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8" style={{ color: '#D4AF37' }} />
            </div>
          </div>

          <div style={{ backgroundColor: '#262626', borderRadius: '0.5rem', padding: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#A0A0A0', marginBottom: '0.5rem' }}>Total Tokens</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#E0E0E0' }}>{totalTokens.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8" style={{ color: '#8b5cf6' }} />
            </div>
          </div>
        </div>

        {/* API Keys Table */}
        <div style={{ backgroundColor: '#262626', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#E0E0E0', margin: '0' }}>API Keys</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API Key</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spending</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((key, index) => (
                  <tr key={key.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{key.customer_name}</div>
                        <div className="text-sm text-gray-500">{key.customer_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {maskAPIKey(key.api_key, selectedKey === key.id)}
                        </code>
                        <button
                          onClick={() => setSelectedKey(selectedKey === key.id ? null : key.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {selectedKey === key.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{(key.total_requests || 0).toLocaleString()} requests</div>
                      <div className="text-gray-500">{(key.total_tokens || 0).toLocaleString()} tokens</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatCurrency(key.total_spent)}</div>
                      <div className="text-gray-500">Limit: {formatCurrency(key.monthly_spending_limit)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        key.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleKeyStatus(key.api_key, key.is_active)}
                          className={`${
                            key.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {key.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {apiKeys.length === 0 && (
              <div className="text-center py-12">
                <Key className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No API keys created yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-500"
                >
                  Create your first API key
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create API Key Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name *</label>
                  <input
                    type="text"
                    value={createForm.customer_name}
                    onChange={(e) => setCreateForm({...createForm, customer_name: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={createForm.customer_email}
                    onChange={(e) => setCreateForm({...createForm, customer_email: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Monthly Spending Limit ($)</label>
                  <input
                    type="number"
                    value={createForm.monthly_spending_limit}
                    onChange={(e) => setCreateForm({...createForm, monthly_spending_limit: parseFloat(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rate Limit (requests/minute)</label>
                  <input
                    type="number"
                    value={createForm.rate_limit_per_minute}
                    onChange={(e) => setCreateForm({...createForm, rate_limit_per_minute: parseInt(e.target.value)})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows="2"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={createAPIKey}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Create API Key
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIKeysDashboard;