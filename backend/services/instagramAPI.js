const axios = require('axios');
const logger = require('./logger');

class InstagramAPI {
  constructor(accessToken = null) {
    this.accessToken = accessToken;
    this.baseURL = 'https://graph.instagram.com';
    this.graphURL = 'https://graph.facebook.com/v19.0';
  }

  /**
   * Generate Instagram OAuth authorization URL
   * @param {string} appId - Facebook App ID
   * @param {string} redirectUri - OAuth redirect URI
   * @param {string} state - CSRF protection state parameter
   * @returns {string} Authorization URL
   */
  static generateAuthUrl(appId, redirectUri, state) {
    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'pages_read_engagement'
    ].join(',');

    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      state: state
    });

    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   * @param {string} appId - Facebook App ID
   * @param {string} appSecret - Facebook App Secret
   * @param {string} redirectUri - OAuth redirect URI
   * @returns {object} Token exchange result
   */
  async exchangeCodeForToken(code, appId, appSecret, redirectUri) {
    try {
      const tokenUrl = 'https://graph.facebook.com/v19.0/oauth/access_token';
      
      const params = {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: code
      };

      const response = await axios.post(tokenUrl, null, {
        params: params,
        timeout: 10000
      });

      if (response.data && response.data.access_token) {
        logger.info('Instagram token exchange successful');
        return {
          success: true,
          data: {
            access_token: response.data.access_token,
            token_type: response.data.token_type || 'bearer',
            expires_in: response.data.expires_in
          }
        };
      } else {
        logger.warn('Instagram token exchange failed - no access token', {
          response: response.data
        });
        return {
          success: false,
          error: { message: 'No access token received' }
        };
      }
    } catch (error) {
      logger.logError(error, { 
        context: 'exchangeCodeForToken',
        code: code ? 'present' : 'missing'
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.error?.message || error.message || 'Token exchange failed'
        }
      };
    }
  }

  /**
   * Get user's Instagram accounts connected to Facebook
   * @param {string} accessToken - Facebook access token
   * @returns {object} Instagram accounts result
   */
  async getInstagramAccounts(accessToken) {
    try {
      const url = `${this.graphURL}/me/accounts`;
      
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          fields: 'id,name,instagram_business_account'
        },
        timeout: 10000
      });

      if (response.data && response.data.data) {
        const instagramAccounts = response.data.data
          .filter(account => account.instagram_business_account)
          .map(account => ({
            page_id: account.id,
            page_name: account.name,
            instagram_account_id: account.instagram_business_account.id
          }));

        logger.info('Instagram accounts retrieved successfully', {
          accountCount: instagramAccounts.length
        });

        return {
          success: true,
          data: instagramAccounts
        };
      } else {
        return {
          success: false,
          error: { message: 'No Instagram accounts found' }
        };
      }
    } catch (error) {
      logger.logError(error, { context: 'getInstagramAccounts' });
      return {
        success: false,
        error: { 
          message: error.response?.data?.error?.message || error.message || 'Failed to get Instagram accounts'
        }
      };
    }
  }

  /**
   * Get Instagram account information
   * @param {string} instagramAccountId - Instagram Business Account ID
   * @param {string} accessToken - Access token
   * @returns {object} Account info result
   */
  async getAccountInfo(instagramAccountId, accessToken) {
    try {
      const url = `${this.graphURL}/${instagramAccountId}`;
      
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          fields: 'id,username,name,profile_picture_url,followers_count,follows_count,media_count'
        },
        timeout: 10000
      });

      if (response.data) {
        logger.info('Instagram account info retrieved successfully', {
          username: response.data.username,
          accountId: instagramAccountId
        });

        return {
          success: true,
          data: response.data
        };
      } else {
        return {
          success: false,
          error: { message: 'No account information found' }
        };
      }
    } catch (error) {
      logger.logError(error, { 
        context: 'getAccountInfo',
        instagramAccountId: instagramAccountId
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.error?.message || error.message || 'Failed to get account info'
        }
      };
    }
  }

  /**
   * Validate access token by trying to get user info
   * @param {string} accessToken - Access token to validate
   * @returns {object} Validation result
   */
  async validateToken(accessToken) {
    try {
      const url = `${this.graphURL}/me`;
      
      const response = await axios.get(url, {
        params: {
          access_token: accessToken,
          fields: 'id,name'
        },
        timeout: 5000
      });

      if (response.data && response.data.id) {
        logger.info('Instagram token validated successfully', {
          userId: response.data.id,
          userName: response.data.name
        });
        return {
          success: true,
          data: response.data
        };
      } else {
        logger.warn('Instagram token validation failed', { 
          response: response.data 
        });
        return {
          success: false,
          error: { message: 'Invalid token response' }
        };
      }
    } catch (error) {
      logger.logError(error, { 
        context: 'validateToken',
        accessToken: accessToken ? 'present' : 'missing'
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.error?.message || error.message || 'Token validation failed'
        }
      };
    }
  }

  /**
   * Get long-lived access token from short-lived token
   * @param {string} shortLivedToken - Short-lived access token
   * @param {string} appSecret - Facebook App Secret
   * @returns {object} Long-lived token result
   */
  async getLongLivedToken(shortLivedToken, appSecret) {
    try {
      const url = `${this.graphURL}/oauth/access_token`;
      
      const response = await axios.get(url, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken
        },
        timeout: 10000
      });

      if (response.data && response.data.access_token) {
        logger.info('Long-lived token obtained successfully');
        return {
          success: true,
          data: {
            access_token: response.data.access_token,
            token_type: response.data.token_type || 'bearer',
            expires_in: response.data.expires_in
          }
        };
      } else {
        return {
          success: false,
          error: { message: 'Failed to get long-lived token' }
        };
      }
    } catch (error) {
      logger.logError(error, { context: 'getLongLivedToken' });
      return {
        success: false,
        error: { 
          message: error.response?.data?.error?.message || error.message || 'Long-lived token exchange failed'
        }
      };
    }
  }

  /**
   * Publish content to Instagram
   * @param {string} instagramAccountId - Instagram Business Account ID
   * @param {string} imageUrl - URL of image to post
   * @param {string} caption - Post caption
   * @param {string} accessToken - Access token
   * @returns {object} Publish result
   */
  async publishPost(instagramAccountId, imageUrl, caption, accessToken) {
    try {
      // Step 1: Create media container
      const containerUrl = `${this.graphURL}/${instagramAccountId}/media`;
      
      const containerResponse = await axios.post(containerUrl, {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken
      });

      if (!containerResponse.data || !containerResponse.data.id) {
        return {
          success: false,
          error: { message: 'Failed to create media container' }
        };
      }

      const containerId = containerResponse.data.id;

      // Step 2: Publish the media container
      const publishUrl = `${this.graphURL}/${instagramAccountId}/media_publish`;
      
      const publishResponse = await axios.post(publishUrl, {
        creation_id: containerId,
        access_token: accessToken
      });

      if (publishResponse.data && publishResponse.data.id) {
        logger.info('Instagram post published successfully', {
          postId: publishResponse.data.id,
          instagramAccountId: instagramAccountId
        });
        return {
          success: true,
          data: {
            post_id: publishResponse.data.id,
            container_id: containerId
          }
        };
      } else {
        return {
          success: false,
          error: { message: 'Failed to publish post' }
        };
      }
    } catch (error) {
      logger.logError(error, { 
        context: 'publishPost',
        instagramAccountId: instagramAccountId
      });
      return {
        success: false,
        error: { 
          message: error.response?.data?.error?.message || error.message || 'Post publishing failed'
        }
      };
    }
  }
}

module.exports = {
  InstagramAPI
};