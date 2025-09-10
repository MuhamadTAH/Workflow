import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const InstagramActivity = ({ onTimestampUpdate }) => {
  const [latestUser, setLatestUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLatestInstagramUser = async () => {
    let foundUser = null;
    
    try {
      // Get Instagram comments/messages
      const response = await fetch(`${API_BASE_URL}/api/instagram-comments/comments`);
      const result = await response.json();
      
      if (response.ok && result.success) {
        const messages = result.messages || [];
        const users = result.users || {};
        
        if (messages.length > 0) {
          // Filter out bot messages and get user messages only
          const userMessages = messages.filter(msg => 
            msg.sender?.id && msg.sender.id !== 'me' && !msg.isBotMessage
          );
          
          if (userMessages.length > 0) {
            // Sort by timestamp and get the most recent user message
            const sortedMessages = userMessages.sort((a, b) => 
              new Date(b.timestamp) - new Date(a.timestamp)
            );
            const latestMessage = sortedMessages[0];
            const senderId = latestMessage.sender?.id;
            const user = users[senderId];
            
            foundUser = {
              userId: senderId,
              username: user?.username || `user_${senderId?.slice(0, 8)}`,
              name: user?.name || 'Instagram User',
              text: latestMessage.text || 'No text',
              timestamp: latestMessage.timestamp,
              messageId: latestMessage.id
            };
            setLatestUser(foundUser);
            
            // Notify parent component of the timestamp
            if (onTimestampUpdate) {
              onTimestampUpdate(latestMessage.timestamp);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching latest Instagram user:', error);
    } finally {
      setLoading(false);
      
      // If no user found after all attempts, notify with null timestamp
      if (onTimestampUpdate && !foundUser) {
        onTimestampUpdate(null);
      }
    }
  };

  useEffect(() => {
    fetchLatestInstagramUser();
    
    // Set up polling every 10 seconds to check for new messages
    const interval = setInterval(fetchLatestInstagramUser, 10000);
    
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
    // Store the latest user data in localStorage so Instagram comments page can auto-select them
    if (latestUser) {
      localStorage.setItem('autoSelectInstagramUser', JSON.stringify({
        userId: latestUser.userId,
        username: latestUser.username,
        name: latestUser.name,
        timestamp: Date.now()
      }));
    }
    // Navigate to Instagram comments page
    window.location.href = '/instagram-comments';
  };

  if (loading) {
    return (
      <div className="activity-item">
        <div className="activity-icon info">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <div className="activity-content">
          <p className="activity-title">Loading Instagram activity...</p>
          <span className="activity-time">Checking for comments</span>
        </div>
      </div>
    );
  }

  if (!latestUser) {
    return (
      <div className="activity-item">
        <div className="activity-icon warning">
          <i className="fab fa-instagram"></i>
        </div>
        <div className="activity-content">
          <p className="activity-title">No Instagram comments yet</p>
          <span className="activity-time">Activate webhook to see activity</span>
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
      <div className="activity-icon warning">
        <i className="fab fa-instagram"></i>
      </div>
      <div className="activity-content">
        <p className="activity-title">
          New Instagram comment from {latestUser.name}
          {latestUser.username && <span style={{ color: '#718096', fontSize: '0.875rem' }}> (@{latestUser.username})</span>}
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

export default InstagramActivity;