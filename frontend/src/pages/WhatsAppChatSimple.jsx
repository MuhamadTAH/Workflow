import React, { useState, useEffect } from 'react';

function WhatsAppChatSimple() {
  const [activeUserId, setActiveUserId] = useState(null);
  const [isAutoReplyActive, setIsAutoReplyActive] = useState(false);
  const [users, setUsers] = useState({});

  // API Configuration
  const API_BASE = 'https://workflow-lg9z.onrender.com/api';

  // Fetch WhatsApp conversations from API
  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE}/whatsapp/conversations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.conversations) {
          const processedUsers = {};
          
          result.conversations.forEach(conv => {
            const phoneNumber = conv.customer_id || conv.phone_number;
            
            if (!processedUsers[phoneNumber]) {
              const firstName = (conv.customer_name || 'Unknown').split(' ')[0];
              processedUsers[phoneNumber] = {
                name: conv.customer_name || 'Unknown Customer',
                phoneNumber: phoneNumber,
                avatar: `https://placehold.co/64x64/e0e7ff/25d366?text=${firstName[0]?.toUpperCase() || 'U'}`,
                lastSeen: 'recently',
                status: 'online',
                lastMessage: conv.message_text,
                messages: []
              };
            }

            processedUsers[phoneNumber].messages.push({
              from: 'user',
              text: conv.message_text,
              timestamp: new Date(conv.created_at).toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              })
            });

            if (conv.response_text) {
              processedUsers[phoneNumber].messages.push({
                from: 'business',
                text: conv.response_text,
                timestamp: new Date(conv.created_at).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })
              });
            }
          });

          setUsers(processedUsers);
          
          // Set first user as active if none selected
          const userIds = Object.keys(processedUsers);
          if (userIds.length > 0 && (!activeUserId || !processedUsers[activeUserId])) {
            setActiveUserId(userIds[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching WhatsApp conversations:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
    
    // Poll for new messages every 5 seconds
    const pollInterval = setInterval(() => {
      fetchConversations();
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white p-4">
            <h1 className="text-2xl font-bold flex items-center">
              <span className="mr-3">💬</span>
              WhatsApp Business Chat
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 h-96">
            {/* Conversations List */}
            <div className="border-r border-gray-200 p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Conversations</h2>
              <div className="space-y-2">
                {Object.keys(users).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No WhatsApp conversations yet</p>
                  </div>
                ) : (
                  Object.keys(users).map((userId) => {
                    const user = users[userId];
                    return (
                      <div 
                        key={userId}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          userId === activeUserId ? 'bg-green-100' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveUserId(userId)}
                      >
                        <div className="flex items-center">
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full mr-3" />
                          <div className="flex-grow">
                            <p className="font-medium text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.phoneNumber}</p>
                            <p className="text-sm text-gray-500 truncate">{user.lastMessage}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="col-span-2 flex flex-col">
              {activeUserId && users[activeUserId] ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center">
                      <img src={users[activeUserId].avatar} alt={users[activeUserId].name} className="w-10 h-10 rounded-full mr-3" />
                      <div>
                        <h3 className="font-semibold text-gray-800">{users[activeUserId].name}</h3>
                        <p className="text-sm text-gray-500">{users[activeUserId].phoneNumber}</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-grow p-4 overflow-y-auto bg-gray-50">
                    <div className="space-y-4">
                      {users[activeUserId].messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.from === 'user' ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.from === 'user' 
                              ? 'bg-white text-gray-800' 
                              : 'bg-green-500 text-white'
                          }`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type a message..." 
                        className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-green-500" 
                      />
                      <button className="bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-colors">
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">💬</span>
                    <p className="text-lg">Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-sm text-gray-600">Status: {isAutoReplyActive ? 'Auto-Reply ON' : 'Manual Mode'}</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Total Chats: {Object.keys(users).length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhatsAppChatSimple;