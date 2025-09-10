import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const WhatsAppActivity = () => {
  const [latestUser, setLatestUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLatestWhatsAppUser = async () => {
    try {
      // Get WhatsApp messages
      const response = await fetch(`${API_BASE_URL}/api/whatsapp-receiver/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.messages && result.messages.length > 0) {
        // Filter out bot messages and get user messages only
        const userMessages = result.messages.filter(msg => 
          !msg.isBotMessage && msg.from && msg.from !== 'bot'
        );
        
        if (userMessages.length > 0) {
          // Sort by timestamp and get the most recent user message
          const sortedMessages = userMessages.sort((a, b) => 
            new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
          );
          const latestMessage = sortedMessages[0];
          
          setLatestUser({
            from: latestMessage.from,
            fromName: latestMessage.fromName || latestMessage.profile_name || 'WhatsApp User',
            text: latestMessage.text || latestMessage.body || 'No text',
            timestamp: latestMessage.timestamp || latestMessage.date,
            phoneNumber: latestMessage.from
          });
        }
      }
    } catch (error) {
      console.error('Error fetching latest WhatsApp user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestWhatsAppUser();
    
    // Set up polling every 10 seconds to check for new messages
    const interval = setInterval(fetchLatestWhatsAppUser, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const messageDate = new Date(dateString);
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return messageDate.toLocaleDateString();
  };

  const handleClick = () => {
    // Store the latest user data in localStorage so WhatsAppReceiver can auto-select them
    if (latestUser) {
      localStorage.setItem('autoSelectWhatsAppUser', JSON.stringify({
        from: latestUser.from,
        fromName: latestUser.fromName,
        phoneNumber: latestUser.phoneNumber,
        timestamp: Date.now()
      }));
    }
    // Navigate to WhatsApp receiver page
    window.location.href = '/whatsapp-receiver';
  };

  if (loading) {
    return (
      <div className="activity-item">
        <div className="activity-icon info">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <div className="activity-content">
          <p className="activity-title">Loading WhatsApp activity...</p>
          <span className="activity-time">Checking for messages</span>
        </div>
      </div>
    );
  }

  if (!latestUser) {
    return (
      <div className="activity-item">
        <div className="activity-icon success">
          <i className="fab fa-whatsapp"></i>
        </div>
        <div className="activity-content">
          <p className="activity-title">No WhatsApp messages yet</p>
          <span className="activity-time">Configure your webhook to see activity</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="activity-item"
      onClick={handleClick}
      style={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        borderRadius: '6px'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#f8f9fa';
        e.target.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = 'transparent';
        e.target.style.transform = 'translateY(0)';
      }}
    >
      <div className="activity-icon success">
        <i className="fab fa-whatsapp"></i>
      </div>
      <div className="activity-content">
        <p className="activity-title">
          New WhatsApp from {latestUser.fromName}
        </p>
        <span className="activity-time">{formatTimeAgo(latestUser.timestamp)}</span>
        {latestUser.text && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#718096', 
            marginTop: '0.25rem',
            fontStyle: 'italic',
            maxWidth: '250px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            "{latestUser.text}"
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsAppActivity;