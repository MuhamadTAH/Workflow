import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const ClientAgreements = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'completed'
  const [platform, setPlatform] = useState('all'); // 'all', 'telegram', 'whatsapp', 'messenger'

  // Fetch agreements on component mount
  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/client-agreements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAgreements(data.agreements || []);
      } else {
        console.error('Failed to fetch agreements');
      }
    } catch (error) {
      console.error('Error fetching agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter agreements based on selected filters
  const filteredAgreements = agreements.filter(agreement => {
    const statusMatch = filter === 'all' || agreement.status === filter;
    const platformMatch = platform === 'all' || agreement.platform === platform;
    return statusMatch && platformMatch;
  });

  // Open agreement details modal
  const openAgreementModal = async (agreement) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch detailed agreement data
      const response = await fetch(`${API_BASE_URL}/client-agreements/${agreement.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedAgreement(data.agreement);
        setShowModal(true);
      } else {
        console.error('Failed to fetch agreement details');
      }
    } catch (error) {
      console.error('Error fetching agreement details:', error);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedAgreement(null);
  };

  // Update agreement status
  const updateAgreementStatus = async (agreementId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/client-agreements/${agreementId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setAgreements(agreements.map(agreement => 
          agreement.id === agreementId 
            ? { ...agreement, status: newStatus }
            : agreement
        ));
        
        if (selectedAgreement && selectedAgreement.id === agreementId) {
          setSelectedAgreement({ ...selectedAgreement, status: newStatus });
        }
      } else {
        console.error('Failed to update agreement status');
      }
    } catch (error) {
      console.error('Error updating agreement status:', error);
    }
  };

  // Download agreement file
  const downloadAgreementFile = async (agreementId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/client-agreements/${agreementId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `agreement_${agreementId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download agreement file');
      }
    } catch (error) {
      console.error('Error downloading agreement file:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get status badge color
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get platform icon
  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'telegram': return 'fab fa-telegram';
      case 'whatsapp': return 'fab fa-whatsapp';
      case 'messenger': return 'fab fa-facebook-messenger';
      case 'instagram': return 'fab fa-instagram';
      default: return 'fas fa-comments';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <i className="fas fa-handshake mr-3 text-blue-600"></i>
            Client Agreements
          </h1>
          <p className="text-gray-600">
            Track and manage client agreements detected from conversations
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Filter
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Platforms</option>
                <option value="telegram">Telegram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="messenger">Messenger</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchAgreements}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <i className="fas fa-sync-alt mr-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Agreements List */}
        {loading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-500">Loading agreements...</p>
          </div>
        ) : filteredAgreements.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
            <i className="fas fa-handshake text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Agreements Found</h3>
            <p className="text-gray-500">
              {agreements.length === 0 
                ? "No client agreements have been detected yet." 
                : "No agreements match your current filters."
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAgreements.map((agreement) => (
              <div
                key={agreement.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openAgreementModal(agreement)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <i className={`${getPlatformIcon(agreement.platform)} text-xl text-blue-600`}></i>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {agreement.customer_name || 'Unknown Client'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          @{agreement.customer_username || 'N/A'} • {agreement.platform}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(agreement.status)}`}>
                        {agreement.status}
                      </span>
                      <div className="text-right text-sm text-gray-500">
                        <div>{formatDate(agreement.agreement_detected_at)}</div>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                          {Math.round(agreement.agreement_confidence * 100)}% confidence
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Service Requested</p>
                      <p className="text-sm text-gray-900">{agreement.service_requested || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Budget</p>
                      <p className="text-sm text-gray-900">{agreement.price_agreed || agreement.budget_mentioned || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Timeline</p>
                      <p className="text-sm text-gray-900">{agreement.timeline_mentioned || 'Not specified'}</p>
                    </div>
                  </div>

                  {agreement.agreement_summary && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 font-medium mb-1">Agreement Summary</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{agreement.agreement_summary}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agreement Details Modal */}
        {showModal && selectedAgreement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Agreement Details</h2>
                    <p className="text-gray-600">
                      {selectedAgreement.customer_name} • {selectedAgreement.platform}
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <i className="fas fa-times text-gray-500"></i>
                  </button>
                </div>

                {/* Agreement Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Name</label>
                        <p className="text-gray-900">{selectedAgreement.customer_name || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Username</label>
                        <p className="text-gray-900">@{selectedAgreement.customer_username || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-gray-900">{selectedAgreement.phone_number || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{selectedAgreement.email_address || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-gray-900">{selectedAgreement.location || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Agreement Details</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Service Requested</label>
                        <p className="text-gray-900">{selectedAgreement.service_requested || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Price Agreed</label>
                        <p className="text-gray-900">{selectedAgreement.price_agreed || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Timeline</label>
                        <p className="text-gray-900">{selectedAgreement.timeline_mentioned || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <select
                          value={selectedAgreement.status}
                          onChange={(e) => updateAgreementStatus(selectedAgreement.id, e.target.value)}
                          className="mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Agreement Summary */}
                {selectedAgreement.agreement_summary && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Agreement Summary</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedAgreement.agreement_summary}</p>
                    </div>
                  </div>
                )}

                {/* Conversation Summary */}
                {selectedAgreement.conversation_summary && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Conversation Summary</h3>
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedAgreement.conversation_summary}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4 border-t">
                  <button
                    onClick={() => downloadAgreementFile(selectedAgreement.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Download Agreement
                  </button>
                  
                  {selectedAgreement.client_portal_link && (
                    <a
                      href={selectedAgreement.client_portal_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <i className="fas fa-external-link-alt mr-2"></i>
                      Client Portal
                    </a>
                  )}
                  
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientAgreements;