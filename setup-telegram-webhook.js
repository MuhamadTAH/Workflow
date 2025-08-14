#!/usr/bin/env node

/**
 * Telegram Bot Webhook Setup for Single-Run Workflow Activation
 * 
 * This script sets up the Telegram bot webhook to point to the new single-run
 * workflow activation endpoint. Run this after deploying Step 4 changes.
 */

const axios = require('axios');

// Telegram Bot Configuration from CLAUDE.md
const TELEGRAM_BOT_TOKEN = '8148982414:AAEPKCLwwxiMp0KH3wKqrqdTnPI3W3E_0VQ';
const BOT_USERNAME = '@AI_MarketingTeambot';
const BACKEND_URL = 'https://workflow-lg9z.onrender.com';

// Test workflow ID (replace with actual workflow ID when testing)
const TEST_WORKFLOW_ID = '2'; // Using the workflow ID from logs

async function setupTelegramWebhook() {
  console.log('🤖 Setting up Telegram Bot Webhook for Single-Run Activation');
  console.log(`Bot: ${BOT_USERNAME}`);
  console.log(`Backend: ${BACKEND_URL}`);
  console.log(`Test Workflow: ${TEST_WORKFLOW_ID}`);
  console.log('');

  try {
    // Step 1: Get current bot info
    console.log('1️⃣ Getting bot information...');
    const botInfo = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    
    if (botInfo.data.ok) {
      console.log(`✅ Bot found: ${botInfo.data.result.first_name} (${botInfo.data.result.username})`);
    } else {
      throw new Error('Failed to get bot info');
    }

    // Step 2: Set webhook URL for single-run activation
    const webhookUrl = `${BACKEND_URL}/api/webhooks/telegram/${TEST_WORKFLOW_ID}`;
    console.log(`\n2️⃣ Setting webhook URL: ${webhookUrl}`);
    
    const webhookResponse = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`, {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    });

    if (webhookResponse.data.ok) {
      console.log('✅ Webhook set successfully!');
    } else {
      throw new Error(`Failed to set webhook: ${webhookResponse.data.description}`);
    }

    // Step 3: Verify webhook info
    console.log('\n3️⃣ Verifying webhook setup...');
    const webhookInfo = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
    
    if (webhookInfo.data.ok) {
      const info = webhookInfo.data.result;
      console.log('📋 Webhook Info:');
      console.log(`   URL: ${info.url}`);
      console.log(`   Has custom certificate: ${info.has_custom_certificate}`);
      console.log(`   Pending updates: ${info.pending_update_count}`);
      console.log(`   Last error date: ${info.last_error_date || 'None'}`);
      console.log(`   Last error message: ${info.last_error_message || 'None'}`);
      console.log(`   Max connections: ${info.max_connections}`);
      console.log(`   Allowed updates: ${info.allowed_updates?.join(', ') || 'All'}`);
    }

    console.log('\n🎉 Telegram webhook setup complete!');
    console.log('\n📝 Testing Instructions:');
    console.log(`1. Activate workflow ${TEST_WORKFLOW_ID} in the frontend`);
    console.log(`2. Send a message to ${BOT_USERNAME} on Telegram`);
    console.log(`3. Check backend logs for trigger reception`);
    console.log(`4. Workflow should execute once and auto-deactivate`);

  } catch (error) {
    console.error('❌ Error setting up Telegram webhook:', error.message);
    
    if (error.response?.data) {
      console.error('Telegram API Error:', error.response.data);
    }
    
    process.exit(1);
  }
}

// Run if script is executed directly
if (require.main === module) {
  setupTelegramWebhook();
}

module.exports = { setupTelegramWebhook };