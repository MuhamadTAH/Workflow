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
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#323232' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Key</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usage</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Spending</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#8E8E8E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#262626' }}>
                {apiKeys.map((key, index) => (
                  <tr key={key.id} style={{ borderBottom: index < apiKeys.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none' }}>
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#E0E0E0', marginBottom: '0.25rem' }}>{key.customer_name}</div>
                        <div style={{ fontSize: '0.875rem', color: '#A0A0A0' }}>{key.customer_email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <code style={{ fontSize: '0.875rem', backgroundColor: '#323232', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', color: '#E0E0E0' }}>
                          {maskAPIKey(key.api_key, selectedKey === key.id)}
                        </code>
                        <button
                          onClick={() => setSelectedKey(selectedKey === key.id ? null : key.id)}
                          style={{ color: '#8E8E8E', cursor: 'pointer', border: 'none', background: 'transparent', transition: 'color 0.2s' }}
                          onMouseEnter={(e) => e.target.style.color = '#A0A0A0'}
                          onMouseLeave={(e) => e.target.style.color = '#8E8E8E'}
                        >
                          {selectedKey === key.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                      <div style={{ color: '#E0E0E0', marginBottom: '0.25rem' }}>{(key.total_requests || 0).toLocaleString()} requests</div>
                      <div style={{ color: '#A0A0A0' }}>{(key.total_tokens || 0).toLocaleString()} tokens</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                      <div style={{ color: '#E0E0E0', marginBottom: '0.25rem' }}>{formatCurrency(key.total_spent)}</div>
                      <div style={{ color: '#A0A0A0' }}>Limit: {formatCurrency(key.monthly_spending_limit)}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        borderRadius: '9999px',
                        backgroundColor: key.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: key.is_active ? '#10b981' : '#ef4444'
                      }}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap', fontSize: '0.875rem', fontWeight: '500' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => toggleKeyStatus(key.api_key, key.is_active)}
                          style={{
                            color: key.is_active ? '#ef4444' : '#10b981',
                            cursor: 'pointer',
                            border: 'none',
                            background: 'transparent',
                            transition: 'color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
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
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <Key className="h-12 w-12" style={{ margin: '0 auto 1rem auto', color: '#8E8E8E' }} />
                <p style={{ color: '#A0A0A0', marginBottom: '1rem' }}>No API keys created yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{ 
                    color: '#4a90e2', 
                    cursor: 'pointer',
                    border: 'none',
                    background: 'transparent',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.color = '#3a7bc8'}
                  onMouseLeave={(e) => e.target.style.color = '#4a90e2'}
                >
                  Create your first API key
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Create API Key Modal */}
        {showCreateModal && (
          <div style={{ position: 'fixed', inset: '0', backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: '50' }}>
            <div style={{ backgroundColor: '#262626', borderRadius: '0.5rem', padding: '1.5rem', maxWidth: '28rem', width: '100%', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#E0E0E0', marginBottom: '1rem' }}>Create New API Key</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#A0A0A0', marginBottom: '0.25rem' }}>Customer Name *</label>
                  <input
                    type="text"
                    value={createForm.customer_name}
                    onChange={(e) => setCreateForm({...createForm, customer_name: e.target.value})}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#323232',
                      color: '#E0E0E0',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#A0A0A0', marginBottom: '0.25rem' }}>Email *</label>
                  <input
                    type="email"
                    value={createForm.customer_email}
                    onChange={(e) => setCreateForm({...createForm, customer_email: e.target.value})}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#323232',
                      color: '#E0E0E0',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#A0A0A0', marginBottom: '0.25rem' }}>Monthly Spending Limit ($)</label>
                  <input
                    type="number"
                    value={createForm.monthly_spending_limit}
                    onChange={(e) => setCreateForm({...createForm, monthly_spending_limit: parseFloat(e.target.value)})}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#323232',
                      color: '#E0E0E0',
                      fontSize: '0.875rem'
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#A0A0A0', marginBottom: '0.25rem' }}>Rate Limit (requests/minute)</label>
                  <input
                    type="number"
                    value={createForm.rate_limit_per_minute}
                    onChange={(e) => setCreateForm({...createForm, rate_limit_per_minute: parseInt(e.target.value)})}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#323232',
                      color: '#E0E0E0',
                      fontSize: '0.875rem'
                    }}
                    min="1"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#A0A0A0', marginBottom: '0.25rem' }}>Notes</label>
                  <textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({...createForm, notes: e.target.value})}
                    style={{
                      width: '100%',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '0.375rem',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#323232',
                      color: '#E0E0E0',
                      fontSize: '0.875rem',
                      resize: 'vertical',
                      minHeight: '4rem'
                    }}
                    rows="2"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  onClick={createAPIKey}
                  style={{ 
                    flex: '1',
                    backgroundColor: '#4a90e2', 
                    color: 'white', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#3a7bc8'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#4a90e2'}
                >
                  Create API Key
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{ 
                    flex: '1',
                    backgroundColor: '#323232', 
                    color: '#A0A0A0', 
                    padding: '0.5rem 1rem', 
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#404040';
                    e.target.style.color = '#E0E0E0';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#323232';
                    e.target.style.color = '#A0A0A0';
                  }}
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