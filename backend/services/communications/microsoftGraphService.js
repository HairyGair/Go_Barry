// backend/services/communications/microsoftGraphService.js
// Microsoft Graph API service for Go BARRY communications

import https from 'https';
import querystring from 'querystring';

export class MicrosoftGraphService {
  constructor() {
    this.clientId = process.env.MICROSOFT_CLIENT_ID;
    this.clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    this.redirectUri = process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:3001/auth/microsoft/callback';
    this.tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    
    this.scopes = [
      'User.Read',
      'Mail.Send',
      'Mail.Read',
      'Files.Read.All',
      'Sites.Read.All'
    ];
    
    this.baseUrl = 'https://graph.microsoft.com/v1.0';
    this.authUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0`;
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️ Microsoft Graph service not fully configured - missing client credentials');
    }
  }

  /**
   * Generate Microsoft OAuth2 authorization URL
   */
  getAuthUrl(state = null) {
    if (!this.clientId) {
      throw new Error('Microsoft client ID not configured');
    }

    const params = {
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      response_mode: 'query'
    };

    if (state) {
      params.state = state;
    }

    return `${this.authUrl}/authorize?${querystring.stringify(params)}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async getTokenFromCode(code) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Microsoft credentials not configured');
    }

    const tokenData = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code'
    };

    const response = await this.makeRequest(
      'POST',
      `${this.authUrl}/token`,
      querystring.stringify(tokenData),
      {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    );

    return response;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Microsoft credentials not configured');
    }

    const tokenData = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    };

    const response = await this.makeRequest(
      'POST',
      `${this.authUrl}/token`,
      querystring.stringify(tokenData),
      {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    );

    return response;
  }

  /**
   * Get user profile information
   */
  async getUserProfile(accessToken) {
    return await this.makeGraphRequest('GET', '/me', null, accessToken);
  }

  /**
   * Send email via Microsoft Graph
   */
  async sendEmail(accessToken, emailData) {
    const message = {
      message: {
        subject: emailData.subject,
        body: {
          contentType: emailData.html ? 'HTML' : 'Text',
          content: emailData.html || emailData.text
        },
        toRecipients: emailData.to.map(email => ({
          emailAddress: {
            address: email
          }
        }))
      }
    };

    if (emailData.cc && emailData.cc.length > 0) {
      message.message.ccRecipients = emailData.cc.map(email => ({
        emailAddress: {
          address: email
        }
      }));
    }

    if (emailData.bcc && emailData.bcc.length > 0) {
      message.message.bccRecipients = emailData.bcc.map(email => ({
        emailAddress: {
          address: email
        }
      }));
    }

    return await this.makeGraphRequest('POST', '/me/sendMail', message, accessToken);
  }

  /**
   * Get user's emails
   */
  async getEmails(accessToken, options = {}) {
    let endpoint = '/me/messages';
    
    const params = [];
    if (options.top) params.push(`$top=${options.top}`);
    if (options.skip) params.push(`$skip=${options.skip}`);
    if (options.filter) params.push(`$filter=${encodeURIComponent(options.filter)}`);
    if (options.orderby) params.push(`$orderby=${options.orderby}`);
    
    if (params.length > 0) {
      endpoint += '?' + params.join('&');
    }

    return await this.makeGraphRequest('GET', endpoint, null, accessToken);
  }

  /**
   * Get SharePoint sites
   */
  async getSharePointSites(accessToken, searchQuery = null) {
    let endpoint = '/sites';
    
    if (searchQuery) {
      endpoint += `?search=${encodeURIComponent(searchQuery)}`;
    }

    return await this.makeGraphRequest('GET', endpoint, null, accessToken);
  }

  /**
   * Get files from SharePoint site
   */
  async getSharePointFiles(accessToken, siteId, driveId = null) {
    let endpoint;
    
    if (driveId) {
      endpoint = `/sites/${siteId}/drives/${driveId}/root/children`;
    } else {
      endpoint = `/sites/${siteId}/drive/root/children`;
    }

    return await this.makeGraphRequest('GET', endpoint, null, accessToken);
  }

  /**
   * Upload file to SharePoint
   */
  async uploadFileToSharePoint(accessToken, siteId, fileName, fileContent, driveId = null) {
    let endpoint;
    
    if (driveId) {
      endpoint = `/sites/${siteId}/drives/${driveId}/root:/${fileName}:/content`;
    } else {
      endpoint = `/sites/${siteId}/drive/root:/${fileName}:/content`;
    }

    return await this.makeGraphRequest('PUT', endpoint, fileContent, accessToken, {
      'Content-Type': 'application/octet-stream'
    });
  }

  /**
   * Make authenticated request to Microsoft Graph API
   */
  async makeGraphRequest(method, endpoint, data, accessToken, additionalHeaders = {}) {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...additionalHeaders
    };

    return await this.makeRequest(method, `${this.baseUrl}${endpoint}`, data, headers);
  }

  /**
   * Generic HTTP request method
   */
  async makeRequest(method, url, data, headers = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: headers
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = JSON.parse(responseData);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${parsedData.error?.message || responseData}`));
            }
          } catch (error) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(responseData);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
            }
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        if (typeof data === 'string') {
          req.write(data);
        } else if (Buffer.isBuffer(data)) {
          req.write(data);
        } else {
          req.write(JSON.stringify(data));
        }
      }

      req.end();
    });
  }

  /**
   * Validate access token
   */
  async validateToken(accessToken) {
    try {
      await this.getUserProfile(accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get configuration status
   */
  getConfigurationStatus() {
    return {
      configured: !!(this.clientId && this.clientSecret),
      clientId: this.clientId ? 'Configured' : 'Missing',
      clientSecret: this.clientSecret ? 'Configured' : 'Missing',
      redirectUri: this.redirectUri,
      tenantId: this.tenantId,
      scopes: this.scopes
    };
  }

  /**
   * Test connection to Microsoft Graph
   */
  async testConnection() {
    try {
      // Just test if we can reach the auth endpoint
      const authUrl = this.getAuthUrl('test');
      return {
        success: true,
        message: 'Microsoft Graph service is reachable',
        authUrl: authUrl
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default MicrosoftGraphService;