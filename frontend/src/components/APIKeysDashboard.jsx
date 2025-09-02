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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-lg p-6 shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API Keys Management</h1>
            <p className="text-gray-600">Manage customer API keys and monitor usage</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create API Key</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Keys</p>
                <p className="text-2xl font-bold text-gray-900">{totalKeys}</p>
              </div>
              <Key className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Keys</p>
                <p className="text-2xl font-bold text-gray-900">{activeKeys}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                <p className="text-2xl font-bold text-gray-900">{totalTokens.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* API Keys Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">API Keys</h2>
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