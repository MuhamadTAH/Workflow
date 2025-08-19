const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// GET /api/connections - Get user's connected accounts
router.get('/', verifyToken, (req, res) => {
  try {
    db.all(
      `SELECT 
        platform, 
        platform_user_id, 
        platform_username, 
        platform_profile_url,
        connected_at, 
        updated_at,
        is_active,
        access_token 
      FROM social_connections 
      WHERE user_id = ? AND is_active = 1`,
      [req.user.userId],
      (err, connections) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        // Transform to object format for easier frontend handling
        const connectionsObj = {};
        connections.forEach(conn => {
          connectionsObj[conn.platform] = {
            platform: conn.platform,
            username: conn.platform_username,
            userId: conn.platform_user_id,
            profileUrl: conn.platform_profile_url,
            connectedAt: conn.connected_at,
            updatedAt: conn.updated_at,
            isActive: conn.is_active,
            access_token: conn.access_token // Include access token for live chat
          };
        });

        res.json({
          connections: connectionsObj,
          total: connections.length
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/connections/:platform - Initiate connection
router.post('/:platform', verifyToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.userId;

    // Validate platform
    const validPlatforms = ['tiktok', 'youtube', 'facebook', 'instagram', 'telegram', 'whatsapp', 'twitter', 'linkedin'];
    if (!validPlatforms.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    // Handle Instagram connection with OAuth flow
    if (platform === 'instagram') {
      const { code, state } = req.body;
      
      if (!code) {
        // Generate OAuth URL for initial connection
        const { InstagramAPI } = require('../services/instagramAPI');
        const appId = process.env.FACEBOOK_APP_ID;
        const redirectUri = `${process.env.FRONTEND_URL || 'https://frontend-dpcg.onrender.com'}/connections/callback/instagram`;
        const stateParam = `${userId}_${Date.now()}`;
        
        if (!appId) {
          return res.status(500).json({ 
            message: 'Instagram connection not configured. Missing Facebook App ID.' 
          });
        }

        const authUrl = InstagramAPI.generateAuthUrl(appId, redirectUri, stateParam);
        
        return res.json({
          message: 'Instagram OAuth authorization required',
          authUrl: authUrl,
          redirectUri: redirectUri,
          state: stateParam
        });
      }

      // Handle OAuth callback with authorization code
      try {
        const { InstagramAPI } = require('../services/instagramAPI');
        const instagramAPI = new InstagramAPI();
        
        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;
        const redirectUri = `${process.env.FRONTEND_URL || 'https://frontend-dpcg.onrender.com'}/connections/callback/instagram`;

        if (!appId || !appSecret) {
          return res.status(500).json({ 
            message: 'Instagram connection not configured. Missing app credentials.' 
          });
        }

        // Exchange code for access token
        const tokenResult = await instagramAPI.exchangeCodeForToken(code, appId, appSecret, redirectUri);
        
        if (!tokenResult.success) {
          return res.status(400).json({ 
            message: 'Failed to exchange authorization code',
            error: tokenResult.error.message 
          });
        }

        const accessToken = tokenResult.data.access_token;

        // Get long-lived token
        const longLivedResult = await instagramAPI.getLongLivedToken(accessToken, appSecret);
        const finalToken = longLivedResult.success ? longLivedResult.data.access_token : accessToken;

        // Get Instagram accounts
        const accountsResult = await instagramAPI.getInstagramAccounts(finalToken);
        
        if (!accountsResult.success || accountsResult.data.length === 0) {
          return res.status(400).json({ 
            message: 'No Instagram business accounts found. Please connect an Instagram Business account to your Facebook page.',
            error: accountsResult.error?.message 
          });
        }

        // Use the first Instagram account found
        const instagramAccount = accountsResult.data[0];
        
        // Get account details
        const accountInfo = await instagramAPI.getAccountInfo(instagramAccount.instagram_account_id, finalToken);
        
        if (!accountInfo.success) {
          return res.status(400).json({ 
            message: 'Failed to retrieve Instagram account information',
            error: accountInfo.error.message 
          });
        }

        const accountData = accountInfo.data;
        const connection = {
          platform_user_id: accountData.id,
          platform_username: accountData.username,
          platform_profile_url: `https://instagram.com/${accountData.username}`,
          access_token: finalToken,
          refresh_token: null,
          token_expires_at: longLivedResult.data?.expires_in ? 
            new Date(Date.now() + (longLivedResult.data.expires_in * 1000)).toISOString() : null
        };

        // Insert or update connection
        db.run(
          `INSERT OR REPLACE INTO social_connections 
            (user_id, platform, access_token, refresh_token, token_expires_at, 
             platform_user_id, platform_username, platform_profile_url, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            userId,
            platform,
            connection.access_token,
            connection.refresh_token,
            connection.token_expires_at,
            connection.platform_user_id,
            connection.platform_username,
            connection.platform_profile_url
          ],
          function(err) {
            if (err) {
              console.error('Database error:', err);
              return res.status(500).json({ message: 'Error creating connection' });
            }

            res.json({
              message: 'Instagram account connected successfully',
              connection: {
                platform: platform,
                username: connection.platform_username,
                userId: connection.platform_user_id,
                profileUrl: connection.platform_profile_url,
                displayName: accountData.name,
                followersCount: accountData.followers_count,
                connectedAt: new Date().toISOString()
              }
            });
          }
        );
        return;

      } catch (error) {
        console.error('Instagram OAuth error:', error);
        return res.status(500).json({ 
          message: 'Instagram connection failed',
          error: error.message 
        });
      }
    }

    // Handle Telegram connection with real bot token validation
    if (platform === 'telegram') {
      const { botToken } = req.body;
      
      if (!botToken) {
        return res.status(400).json({ message: 'Bot token is required for Telegram connection' });
      }

      // Validate bot token using TelegramAPI
      const { TelegramAPI } = require('../services/telegramAPI');
      const telegramAPI = new TelegramAPI(botToken);
      const validation = await telegramAPI.validateToken();

      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid Telegram bot token',
          error: validation.error.message 
        });
      }

      const botInfo = validation.data;
      const connection = {
        platform_user_id: botInfo.id.toString(),
        platform_username: botInfo.username,
        platform_profile_url: `https://t.me/${botInfo.username}`,
        access_token: botToken,
        refresh_token: null,
        token_expires_at: null // Bot tokens don't expire
      };

      // Insert or update connection
      db.run(
        `INSERT OR REPLACE INTO social_connections 
          (user_id, platform, access_token, refresh_token, token_expires_at, 
           platform_user_id, platform_username, platform_profile_url, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          userId,
          platform,
          connection.access_token,
          connection.refresh_token,
          connection.token_expires_at,
          connection.platform_user_id,
          connection.platform_username,
          connection.platform_profile_url
        ],
        async function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Error creating connection' });
          }

          // Set webhook for live chat integration
          const webhookUrl = `${process.env.API_BASE_URL || 'https://workflow-lg9z.onrender.com'}/api/webhooks/telegram-livechat/${userId}`;
          
          try {
            const webhookResult = await telegramAPI.setWebhook(webhookUrl);
            console.log('✅ Telegram webhook set for live chat:', webhookUrl);
          } catch (webhookError) {
            console.warn('⚠️ Failed to set webhook for live chat:', webhookError.message);
            // Continue even if webhook setup fails
          }

          res.json({
            message: 'Telegram bot connected successfully',
            connection: {
              platform: platform,
              username: connection.platform_username,
              userId: connection.platform_user_id,
              profileUrl: connection.platform_profile_url,
              botName: botInfo.first_name,
              connectedAt: new Date().toISOString(),
              webhookUrl: webhookUrl
            }
          });
        }
      );
      return;
    }

    // For other platforms, create mock connections (implement OAuth later)
    const mockConnection = {
      platform_user_id: `mock_${platform}_${Date.now()}`,
      platform_username: `user_${platform}`,
      platform_profile_url: `https://${platform}.com/user_${platform}`,
      access_token: `mock_token_${platform}_${Date.now()}`,
      refresh_token: `mock_refresh_${platform}_${Date.now()}`,
      token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
    };

    // Insert or update connection
    db.run(
      `INSERT OR REPLACE INTO social_connections 
        (user_id, platform, access_token, refresh_token, token_expires_at, 
         platform_user_id, platform_username, platform_profile_url, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        platform,
        mockConnection.access_token,
        mockConnection.refresh_token,
        mockConnection.token_expires_at,
        mockConnection.platform_user_id,
        mockConnection.platform_username,
        mockConnection.platform_profile_url
      ],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error creating connection' });
        }

        res.json({
          message: 'Connection created successfully',
          connection: {
            platform: platform,
            username: mockConnection.platform_username,
            userId: mockConnection.platform_user_id,
            profileUrl: mockConnection.platform_profile_url,
            connectedAt: new Date().toISOString()
          }
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/connections/:platform - Disconnect account
router.delete('/:platform', verifyToken, (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.userId;

    db.run(
      'UPDATE social_connections SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND platform = ?',
      [userId, platform],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Error disconnecting account' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: 'Connection not found' });
        }

        res.json({
          message: 'Account disconnected successfully',
          platform: platform
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/connections/health - Check connection health and webhooks
router.get('/health', verifyToken, async (req, res) => {
  try {
    db.all(
      `SELECT platform, access_token, platform_username, is_active, updated_at
       FROM social_connections 
       WHERE user_id = ?`,
      [req.user.userId],
      async (err, connections) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        const healthStatus = {};
        
        for (const conn of connections) {
          if (conn.platform === 'telegram' && conn.access_token) {
            try {
              const { TelegramAPI } = require('../services/telegramAPI');
              const telegramAPI = new TelegramAPI(conn.access_token);
              const validation = await telegramAPI.validateToken();
              
              const webhookUrl = `${process.env.API_BASE_URL || 'https://workflow-lg9z.onrender.com'}/api/webhooks/telegram-livechat/${req.user.userId}`;
              const webhookInfo = await telegramAPI.getWebhookInfo();
              
              healthStatus[conn.platform] = {
                platform: conn.platform,
                username: conn.platform_username,
                isActive: conn.is_active === 1,
                tokenValid: validation.success,
                webhookSet: webhookInfo.success && webhookInfo.data.url === webhookUrl,
                webhookUrl: webhookInfo.success ? webhookInfo.data.url : null,
                expectedWebhookUrl: webhookUrl,
                lastUpdated: conn.updated_at
              };
            } catch (error) {
              healthStatus[conn.platform] = {
                platform: conn.platform,
                username: conn.platform_username,
                isActive: conn.is_active === 1,
                tokenValid: false,
                error: error.message,
                lastUpdated: conn.updated_at
              };
            }
          } else {
            healthStatus[conn.platform] = {
              platform: conn.platform,
              username: conn.platform_username,
              isActive: conn.is_active === 1,
              lastUpdated: conn.updated_at
            };
          }
        }

        res.json({
          success: true,
          health: healthStatus,
          userId: req.user.userId,
          checkedAt: new Date().toISOString()
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/connections/status - Check all connection statuses
router.get('/status', verifyToken, (req, res) => {
  try {
    db.all(
      'SELECT platform, is_active FROM social_connections WHERE user_id = ?',
      [req.user.userId],
      (err, connections) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        const statusObj = {};
        connections.forEach(conn => {
          statusObj[conn.platform] = conn.is_active === 1;
        });

        res.json({
          status: statusObj,
          total: connections.filter(c => c.is_active === 1).length
        });
      }
    );
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/connections/telegram-client/send-code - Send verification code
router.post('/telegram-client/send-code', verifyToken, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      });
    }

    // Get existing bot token for this user (to link with client API)
    const botTokenSql = `
      SELECT access_token FROM social_connections 
      WHERE user_id = ? AND platform = 'telegram' AND is_active = 1
      LIMIT 1
    `;
    
    const botConnection = await new Promise((resolve, reject) => {
      db.get(botTokenSql, [req.user.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!botConnection) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please connect your Telegram bot first before setting up Client API' 
      });
    }

    // Use real Telegram Client API to send verification code
    const telegramClientService = require('../services/telegramClientAPI');
    const result = await telegramClientService.sendVerificationCode(phoneNumber);
    
    if (result.success) {
      // Store phone code hash temporarily for verification
      const tempStoreSql = `
        INSERT OR REPLACE INTO telegram_temp_sessions 
        (user_id, phone_number, phone_code_hash, bot_token, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      db.run(tempStoreSql, [
        req.user.userId, 
        phoneNumber, 
        result.phoneCodeHash,
        botConnection.access_token
      ], (err) => {
        if (err) {
          console.error('Failed to store temp session:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to store verification session' 
          });
        }
        
        res.json({
          success: true,
          message: 'Verification code sent to your phone',
          phoneNumber: phoneNumber
        });
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send verification code: ' + error.message 
    });
  }
});

// POST /api/connections/telegram-client/verify-code - Verify code and connect
router.post('/telegram-client/verify-code', verifyToken, async (req, res) => {
  try {
    const { phoneNumber, verificationCode } = req.body;
    
    if (!phoneNumber || !verificationCode) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and verification code are required' 
      });
    }

    // Get the stored phone code hash
    const tempSessionSql = `
      SELECT phone_code_hash, bot_token FROM telegram_temp_sessions 
      WHERE user_id = ? AND phone_number = ?
      ORDER BY created_at DESC LIMIT 1
    `;
    
    const tempSession = await new Promise((resolve, reject) => {
      db.get(tempSessionSql, [req.user.userId, phoneNumber], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!tempSession) {
      return res.status(400).json({ 
        success: false, 
        error: 'No verification session found. Please request a new code.' 
      });
    }

    // Use real Telegram Client API to verify code
    const telegramClientService = require('../services/telegramClientAPI');
    const result = await telegramClientService.verifyCodeAndConnect(
      phoneNumber, 
      verificationCode, 
      tempSession.phone_code_hash
    );
    
    if (result.success) {
      // Store the client connection with session string and bot token
      const insertSql = `
        INSERT OR REPLACE INTO social_connections 
        (user_id, platform, access_token, refresh_token, platform_user_id, platform_username, 
         platform_profile_url, connected_at, updated_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
      `;
      
      db.run(insertSql, [
        req.user.userId,
        'telegram_client',
        result.sessionString, // Store session string for Client API
        tempSession.bot_token, // Store linked bot token in refresh_token field
        result.userInfo.id,
        result.userInfo.username || result.userInfo.firstName,
        `tg://user?id=${result.userInfo.id}`,
      ], function(error) {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to save connection' 
          });
        }
        
        // Clean up temp session
        db.run(`DELETE FROM telegram_temp_sessions WHERE user_id = ? AND phone_number = ?`, 
               [req.user.userId, phoneNumber]);
        
        res.json({
          success: true,
          message: 'Telegram Client API connected successfully',
          connection: {
            platform: 'telegram_client',
            phoneNumber: phoneNumber,
            userInfo: result.userInfo,
            linkedBotToken: tempSession.bot_token.substring(0, 10) + '...',
            connectedAt: new Date().toISOString()
          }
        });
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to verify code: ' + error.message 
    });
  }
});

module.exports = router;