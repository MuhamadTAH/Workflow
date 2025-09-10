import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const MessengerActivity = () => {
  const [latestUser, setLatestUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLatestMessengerUser = async () => {
    try {
      // Get Messenger messages
      const response = await fetch(`${API_BASE_URL}/api/messenger/messages`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        const messages = result.messages || [];
        
        // Get users data
        const usersResponse = await fetch(`${API_BASE_URL}/api/messenger/users`);
        const usersResult = await usersResponse.json();
        const users = usersResult.success ? usersResult.users || {} : {};
        
        if (messages.length > 0) {
          // Filter out bot messages and get user messages only
          const userMessages = messages.filter(msg => 
            msg.sender?.id && msg.sender.id !== 'me' && !msg.isBotMessage
          );
          
          if (userMessages.length > 0) {
            // Sort by timestamp and get the most recent user message
            const sortedMessages = userMessages.sort((a, b) => 
              new Date(b.timestamp || b.created_time) - new Date(a.timestamp || a.created_time)
            );
            const latestMessage = sortedMessages[0];
            const senderId = latestMessage.sender?.id;
            const user = users[senderId];
            
            setLatestUser({
              userId: senderId,
              name: user?.name || latestMessage.sender?.name || 'Messenger User',
              firstName: user?.first_name || latestMessage.sender?.first_name,
              lastName: user?.last_name || latestMessage.sender?.last_name,
              text: latestMessage.text || latestMessage.message || 'No text',
              timestamp: latestMessage.timestamp || latestMessage.created_time,
              messageId: latestMessage.id
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching latest Messenger user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestMessengerUser();
    
    // Set up polling every 10 seconds to check for new messages
    const interval = setInterval(fetchLatestMessengerUser, 10000);
    
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
    // Store the latest user data in localStorage so Messenger comments page can auto-select them
    if (latestUser) {
      localStorage.setItem('autoSelectMessengerUser', JSON.stringify({
        userId: latestUser.userId,
        name: latestUser.name,
        firstName: latestUser.firstName,
        lastName: latestUser.lastName,
        timestamp: Date.now()
      }));
    }
    // Navigate to Messenger comments page
    window.location.href = '/messenger-comments';
  };

  if (loading) {
    return (
      <div className="activity-item">
        <div className="activity-icon info">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <div className="activity-content">
          <p className="activity-title">Loading Messenger activity...</p>
          <span className="activity-time">Checking for messages</span>
        </div>
      </div>
    );
  }

  if (!latestUser) {
    return (
      <div className="activity-item">
        <div className="activity-icon info">
          <i className="fab fa-facebook-messenger"></i>
        </div>
        <div className="activity-content">
          <p className="activity-title">No Messenger messages yet</p>
          <span className="activity-time">Configure webhook to see activity</span>
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
      <div className="activity-icon info">
        <i className="fab fa-facebook-messenger"></i>
      </div>
      <div className="activity-content">
        <p className="activity-title">
          New Messenger from {latestUser.name}
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

export default MessengerActivity;