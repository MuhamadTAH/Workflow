import React, { useState, useEffect } from 'react';

const ConfigPanel = ({ node, onClose, nodes, edges }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (node) {
      setFormData(node.data || {});
    }
  }, [node]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onClose(formData);
  };

  const handleCancel = () => {
    onClose(null);
  };

  const renderNodeConfig = () => {
    switch (node.data.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <input
                type="text"
                value={formData.botToken || ''}
                onChange={(e) => handleInputChange('botToken', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Telegram bot token"
              />
            </div>
          </div>
        );

      case 'telegramSendMessage':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <input
                type="text"
                value={formData.botToken || ''}
                onChange={(e) => handleInputChange('botToken', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your Telegram bot token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chat ID
              </label>
              <input
                type="text"
                value={formData.chatId || ''}
                onChange={(e) => handleInputChange('chatId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Chat ID (e.g., 123456789)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={formData.message || ''}
                onChange={(e) => handleInputChange('message', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your message"
                rows={3}
              />
            </div>
          </div>
        );

      case 'aiAgent':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt
              </label>
              <textarea
                value={formData.systemPrompt || ''}
                onChange={(e) => handleInputChange('systemPrompt', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Enter system prompt for the AI agent"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Message Template
              </label>
              <textarea
                value={formData.userMessage || ''}
                onChange={(e) => handleInputChange('userMessage', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Template for user message (use {{variables}})"
                rows={3}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-500">
            Configuration for {node.data.label || node.data.type} node.
            <p className="mt-2 text-sm">This node type doesn't have specific configuration options yet.</p>
          </div>
        );
    }
  };

  if (!node) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Configure {node.data.label || node.data.type}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>

          <div className="mb-6">
            {renderNodeConfig()}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;