import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api.js';

const TelegramListener = () => {
  const [botToken, setBotToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleSetupWebhook = async () => {
    if (!botToken.trim()) {
      setStatus('❌ Please enter a bot token');
      return;
    }

    setIsLoading(true);
    setStatus('🔧 Setting up webhook...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          botToken: botToken.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus(`✅ Webhook setup successful!`);
        setWebhookUrl(result.webhookUrl);
        console.log('Webhook setup result:', result);
      } else {
        setStatus(`❌ Setup failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Webhook setup error:', error);
      setStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!botToken.trim()) {
      setStatus('❌ Please enter a bot token');
      return;
    }

    setIsLoading(true);
    setStatus('🗑️ Removing webhook...');

    try {
      const response = await fetch(`${API_BASE_URL}/api/telegram-listener/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          botToken: botToken.trim()
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('✅ Webhook deleted successfully!');
        setWebhookUrl('');
      } else {
        setStatus(`❌ Delete failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Webhook delete error:', error);
      setStatus(`❌ Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            <i className="fab fa-telegram text-blue-500 mr-2"></i>
            Telegram Bot Listener
          </h1>
          
          <div className="space-y-6">
            {/* Token Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Enter your Telegram bot token (e.g., 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <p className="mt-1 text-sm text-gray-500">
                Get your bot token from @BotFather on Telegram
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleSetupWebhook}
                disabled={isLoading || !botToken.trim()}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '⏳ Setting up...' : '🚀 Setup Webhook'}
              </button>
              
              <button
                onClick={handleDeleteWebhook}
                disabled={isLoading || !botToken.trim()}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? '⏳ Deleting...' : '🗑️ Delete Webhook'}
              </button>
            </div>

            {/* Status */}
            {status && (
              <div className={`p-4 rounded-md ${
                status.includes('✅') ? 'bg-green-50 text-green-700' : 
                status.includes('❌') ? 'bg-red-50 text-red-700' : 
                'bg-blue-50 text-blue-700'
              }`}>
                {status}
              </div>
            )}

            {/* Webhook URL Display */}
            {webhookUrl && (
              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL
                </label>
                <code className="block w-full p-2 bg-gray-100 rounded text-sm break-all">
                  {webhookUrl}
                </code>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-md">
              <h3 className="font-medium text-blue-900 mb-2">📋 Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Get a bot token from @BotFather on Telegram</li>
                <li>Paste the token above and click "Setup Webhook"</li>
                <li>Send messages to your bot - they'll be received by the backend</li>
                <li>Check the browser console and backend logs to see incoming messages</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TelegramListener;