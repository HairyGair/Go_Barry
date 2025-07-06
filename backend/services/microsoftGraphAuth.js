// backend/services/microsoftGraphAuth.js
// Microsoft Graph API Authentication Service for SharePoint Excel Integration

import { ConfidentialClientApplication } from '@azure/msal-node';

class MicrosoftGraphAuth {
  constructor() {
    this.clientConfig = {
      auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
      },
    };

    this.cca = new ConfidentialClientApplication(this.clientConfig);

    // Required permissions for SharePoint Excel access
    this.requiredScopes = [
      'https://graph.microsoft.com/Files.ReadWrite.All',
      'https://graph.microsoft.com/Sites.ReadWrite.All',
      'https://graph.microsoft.com/User.Read',
    ];

    console.log('🔐 Microsoft Graph Auth initialized');
    console.log('🔐 Required scopes:', this.requiredScopes);
  }

  /**
   * Get authorization URL for user login
   */
  getAuthUrl(state = 'default') {
    const authCodeUrlParameters = {
      scopes: this.requiredScopes,
      redirectUri: process.env.AZURE_REDIRECT_URI || 'https://gobarry.co.uk/auth/callback',
      state: state,
      prompt: 'consent', // Force consent to ensure all permissions are granted
    };

    return this.cca.getAuthCodeUrl(authCodeUrlParameters);
  }

  /**
   * Exchange authorization code for access token
   */
  async getTokenFromCode(authCode, redirectUri) {
    try {
      const tokenRequest = {
        code: authCode,
        scopes: this.requiredScopes,
        redirectUri: redirectUri || process.env.AZURE_REDIRECT_URI,
      };

      const response = await this.cca.acquireTokenByCode(tokenRequest);
      
      console.log('🔐 Token acquired successfully');
      console.log('🔐 Expires at:', new Date(response.expiresOn));
      
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresOn: response.expiresOn,
        account: response.account,
        scopes: response.scopes,
      };
    } catch (error) {
      console.error('🔐 Token acquisition failed:', error);
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken, account) {
    try {
      const refreshTokenRequest = {
        refreshToken: refreshToken,
        scopes: this.requiredScopes,
        account: account,
      };

      const response = await this.cca.acquireTokenByRefreshToken(refreshTokenRequest);
      
      console.log('🔐 Token refreshed successfully');
      
      return {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresOn: response.expiresOn,
        account: response.account,
      };
    } catch (error) {
      console.error('🔐 Token refresh failed:', error);
      throw new Error(`Token refresh failed: ${error.message}`);
    }
  }

  /**
   * Get access token using client credentials (app-only access)
   * Useful for background operations without user interaction
   */
  async getAppOnlyToken() {
    try {
      const clientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
      };

      const response = await this.cca.acquireTokenByClientCredential(clientCredentialRequest);
      
      console.log('🔐 App-only token acquired');
      
      return {
        accessToken: response.accessToken,
        expiresOn: response.expiresOn,
        tokenType: response.tokenType,
      };
    } catch (error) {
      console.error('🔐 App-only token acquisition failed:', error);
      throw new Error(`App-only authentication failed: ${error.message}`);
    }
  }

  /**
   * Validate access token and check if it's still valid
   */
  isTokenValid(tokenData) {
    if (!tokenData || !tokenData.expiresOn) {
      return false;
    }

    const now = new Date();
    const expiresOn = new Date(tokenData.expiresOn);
    
    // Consider token invalid if it expires within the next 5 minutes
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return (expiresOn.getTime() - now.getTime()) > bufferTime;
  }

  /**
   * Get user info from Microsoft Graph
   */
  async getUserInfo(accessToken) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const userData = await response.json();
      
      console.log('🔐 User info retrieved:', userData.displayName);
      
      return userData;
    } catch (error) {
      console.error('🔐 Failed to get user info:', error);
      throw new Error(`Failed to retrieve user information: ${error.message}`);
    }
  }

  /**
   * Verify required environment variables are set
   */
  validateConfig() {
    const required = [
      'AZURE_CLIENT_ID',
      'AZURE_CLIENT_SECRET', 
      'AZURE_TENANT_ID',
      'AZURE_REDIRECT_URI'
    ];

    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    console.log('🔐 Azure configuration validated');
    return true;
  }
}

export default MicrosoftGraphAuth;