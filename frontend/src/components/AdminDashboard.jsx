import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Activity, TrendingUp, Eye, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const AdminDashboard = () => {
  const [liveStats, setLiveStats] = useState({
    total_requests_today: 0,
    total_tokens_today: 0,
    total_revenue_today: 0,
    total_cost_today: 0,
    profit_today: 0,
    active_users_today: 0
  });

  const [userUsage, setUserUsage] = useState({
    recentUsage: [],
    userTotals: []
  });

  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      const [statsRes, usageRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/live-stats`),
        fetch(`${API_BASE_URL}/api/admin/user-usage`)
      ]);

      const stats = await statsRes.json();
      const usage = await usageRes.json();

      setLiveStats(stats);
      setUserUsage(usage);
    } catch (error) {
      console.error('Admin dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/user-usage/${userId}`);
      const data = await response.json();
      setUserDetails(data.userUsage || []);
      setSelectedUser(userId);
    } catch (error) {
      console.error('Error loading user details:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Monitor user AI usage and revenue in real-time</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
            
            <button
              onClick={loadData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {/* Today's Requests */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Requests Today</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(liveStats.total_requests_today)}
            </p>
          </div>

          {/* Tokens Used */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Tokens Today</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(liveStats.total_tokens_today)}
            </p>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Revenue Today</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(liveStats.total_revenue_today)}
            </p>
          </div>

          {/* Costs */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Costs Today</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(liveStats.total_cost_today)}
            </p>
          </div>

          {/* Profit */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Profit Today</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(liveStats.profit_today)}
            </p>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNumber(liveStats.active_users_today)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Totals */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Top Users by Spending</h2>
            
            {userUsage.userTotals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No user activity yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userUsage.userTotals.slice(0, 10).map((user) => (
                  <div 
                    key={user.user_id} 
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => loadUserDetails(user.user_id)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">User #{user.user_id}</p>
                      <p className="text-sm text-gray-600">
                        {formatNumber(user.total_requests)} requests • {formatNumber(user.total_tokens)} tokens
                      </p>
                      <p className="text-xs text-gray-500">
                        Last used: {formatDate(user.last_used)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(user.total_spent)}</p>
                      <Eye className="h-4 w-4 text-gray-400 ml-auto mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent AI Usage</h2>
            
            {userUsage.recentUsage.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userUsage.recentUsage.slice(0, 15).map((usage, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">User #{usage.user_id}</p>
                      <p className="text-sm text-gray-600">{usage.model_name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(usage.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatNumber(usage.total_tokens)} tokens
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatCurrency(usage.total_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Details Modal */}
        {selectedUser && userDetails.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  User #{selectedUser} - Detailed Usage
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {userDetails.map((detail, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatDate(detail.created_at)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {detail.model_name} ({detail.provider})
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatNumber(detail.total_tokens)}
                          <span className="text-xs text-gray-500 ml-1">
                            ({detail.input_tokens}↑ {detail.output_tokens}↓)
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatCurrency(detail.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;