import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatWidget from '../components/ChatWidget.jsx';
import { API_BASE_URL } from '../config/api.js';

const ChatWidgetFrame = () => {
  const { widgetId } = useParams();
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWidgetConfig();
  }, [widgetId]);

  const loadWidgetConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/chat-widget/widget/${widgetId}/config`);
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      } else {
        setError('Widget not found');
      }
    } catch (error) {
      console.error('Error loading widget config:', error);
      setError('Failed to load widget');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        color: '#dc3545'
      }}>
        {error}
      </div>
    );
  }

  if (!config || !config.enabled) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        color: '#6c757d'
      }}>
        Chat widget is disabled
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      margin: 0, 
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* Custom styles for iframe mode */}
      <style>{`
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        .chat-widget {
          position: relative !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        .chat-window {
          position: relative !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          animation: none !important;
        }
        
        .chat-bubble {
          display: none !important;
        }
      `}</style>
      
      <ChatWidget 
        widgetId={widgetId} 
        config={{
          ...config,
          // Force the widget to be open in iframe mode
          forceOpen: true
        }} 
      />
    </div>
  );
};

export default ChatWidgetFrame;