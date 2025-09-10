import React, { useState, useEffect } from 'react';
import TelegramActivity from './TelegramActivity';
import WhatsAppActivity from './WhatsAppActivity';
import InstagramActivity from './InstagramActivity';
import MessengerActivity from './MessengerActivity';

const DynamicActivityList = () => {
  const [activityTimestamps, setActivityTimestamps] = useState({
    telegram: null,
    whatsapp: null,
    instagram: null,
    messenger: null
  });

  // Helper function to update timestamps
  const updateTimestamp = (platform, timestamp) => {
    setActivityTimestamps(prev => ({
      ...prev,
      [platform]: timestamp
    }));
  };

  // Sort activities by most recent timestamp
  const getSortedActivities = () => {
    const activities = [
      { 
        platform: 'telegram', 
        component: <TelegramActivity key="telegram" onTimestampUpdate={(ts) => updateTimestamp('telegram', ts)} />,
        timestamp: activityTimestamps.telegram 
      },
      { 
        platform: 'whatsapp', 
        component: <WhatsAppActivity key="whatsapp" onTimestampUpdate={(ts) => updateTimestamp('whatsapp', ts)} />,
        timestamp: activityTimestamps.whatsapp 
      },
      { 
        platform: 'instagram', 
        component: <InstagramActivity key="instagram" onTimestampUpdate={(ts) => updateTimestamp('instagram', ts)} />,
        timestamp: activityTimestamps.instagram 
      },
      { 
        platform: 'messenger', 
        component: <MessengerActivity key="messenger" onTimestampUpdate={(ts) => updateTimestamp('messenger', ts)} />,
        timestamp: activityTimestamps.messenger 
      }
    ];

    // Sort by timestamp (most recent first), platforms without messages go to bottom
    return activities.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0;
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  };

  const sortedActivities = getSortedActivities();

  return (
    <>
      {sortedActivities.map(activity => activity.component)}
    </>
  );
};

export default DynamicActivityList;