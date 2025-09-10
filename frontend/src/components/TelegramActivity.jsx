import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api.js';

const TelegramActivity = ({ onTimestampUpdate }) => {
  const [latestUser, setLatestUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLatestTelegramUser = async () => {
    let foundUser = null;
    
    try {
      // Get all telegram listeners for the user
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.activeListeners > 0) {
        const firstListener = result.listeners[0];
        if (firstListener) {
          // Get messages for the first active listener
          const messagesResponse = await fetch(`${API_BASE_URL}/api/telegram-listener/messages/${firstListener.listenerId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          const messagesResult = await messagesResponse.json();
          
          if (messagesResult.success && messagesResult.messages && messagesResult.messages.length > 0) {
            // Filter out bot messages and get unique users
            const userMessages = messagesResult.messages.filter(msg => !msg.isBotMessage && msg.fromUserId !== 'bot');
            
            if (userMessages.length > 0) {
              // Sort by date and get the most recent user message
              const sortedMessages = userMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
              const latestMessage = sortedMessages[0];
              
              foundUser = {
                fromName: latestMessage.fromName || 'Unknown User',
                fromUsername: latestMessage.fromUsername,
                text: latestMessage.text || 'No text',
                date: latestMessage.date,
                chatId: latestMessage.chatId
              };
              setLatestUser(foundUser);
              
              // Notify parent component of the timestamp
              if (onTimestampUpdate) {
                onTimestampUpdate(latestMessage.date);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching latest Telegram user:', error);
    } finally {
      setLoading(false);
      
      // If no user found after all attempts, notify with null timestamp
      if (onTimestampUpdate && !foundUser) {
        onTimestampUpdate(null);
      }
    }
  };

  useEffect(() => {
    fetchLatestTelegramUser();
    
    // Set up polling every 10 seconds to check for new messages
    const interval = setInterval(fetchLatestTelegramUser, 10000);
    
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

  if (loading) {
    return (
      <div className="activity-item">
        <div className="activity-icon info">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <div className="activity-content">
          <p className="activity-title">Loading Telegram activity...</p>
          <span className="activity-time">Checking for messages</span>
        </div>
      </div>
    );
  }

  if (!latestUser) {
    return (
      <div className="activity-item">
        <div className="activity-icon info">
          <i className="fab fa-telegram-plane"></i>
        </div>
        <div className="activity-content">
          <p className="activity-title">No Telegram messages yet</p>
          <span className="activity-time">Set up your bot to see activity</span>
        </div>
      </div>
    );
  }

  const handleClick = () => {
    // Store the latest user data in localStorage so TelegramListener can auto-select them
    if (latestUser) {
      localStorage.setItem('autoSelectUser', JSON.stringify({
        userId: latestUser.chatId, // Using chatId as userId for consistency with TelegramListener
        fromName: latestUser.fromName,
        fromUsername: latestUser.fromUsername,
        chatId: latestUser.chatId,
        timestamp: Date.now()
      }));
    }
    // Navigate to telegram listener page
    window.location.href = '/telegram-listener';
  };

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
        <i className="fab fa-telegram-plane"></i>
      </div>
      <div className="activity-content">
        <p className="activity-title">
          New message from {latestUser.fromName}
          {latestUser.fromUsername && <span style={{ color: '#718096', fontSize: '0.875rem' }}> (@{latestUser.fromUsername})</span>}
        </p>
        <span className="activity-time">{formatTimeAgo(latestUser.date)}</span>
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

export default TelegramActivity;