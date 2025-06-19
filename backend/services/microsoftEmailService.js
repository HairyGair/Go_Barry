import { Client } from '@microsoft/microsoft-graph-client';

class MicrosoftEmailService {
  constructor() {
    this.tenantId = process.env.AZURE_TENANT_ID;
    this.clientId = process.env.AZURE_CLIENT_ID;
    this.clientSecret = process.env.AZURE_CLIENT_SECRET;
    this.redirectUri = process.env.AZURE_REDIRECT_URI || 'https://go-barry.onrender.com/auth/microsoft/callback';
    
    // Store active supervisor tokens
    this.supervisorTokens = new Map();
    
    console.log('✅ Microsoft 365 Email Service initialized (Delegated Authentication)');
  }

  // Generate Microsoft login URL for supervisor
  getMicrosoftLoginUrl(supervisorId, state = null) {
    const scopes = ['https://graph.microsoft.com/Mail.Send', 'https://graph.microsoft.com/User.Read'].join(' ');
    const stateParam = state || `supervisor_${supervisorId}_${Date.now()}`;
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: scopes,
      state: stateParam,
      prompt: 'select_account',
      domain_hint: 'gonortheast.co.uk' // Force @gonortheast.co.uk accounts
    });

    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code, supervisorId) {
    try {
      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
          code: code,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await response.json();

      if (tokenData.error) {
        throw new Error(`Token exchange failed: ${tokenData.error_description}`);
      }

      // Store token for supervisor
      this.supervisorTokens.set(supervisorId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        scope: tokenData.scope,
        obtainedAt: new Date().toISOString()
      });

      // Get user info to validate @gonortheast.co.uk domain
      const userInfo = await this.getSupervisorInfo(supervisorId);
      
      if (!userInfo.mail?.endsWith('@gonortheast.co.uk')) {
        this.supervisorTokens.delete(supervisorId);
        throw new Error('Only @gonortheast.co.uk accounts are allowed');
      }

      console.log(`✅ Microsoft token obtained for supervisor ${supervisorId} (${userInfo.mail})`);

      return {
        success: true,
        userInfo,
        tokenObtained: true
      };

    } catch (error) {
      console.error('❌ Token exchange error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Refresh access token using refresh token
  async refreshSupervisorToken(supervisorId) {
    try {
      const tokenInfo = this.supervisorTokens.get(supervisorId);
      if (!tokenInfo?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          scope: 'https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
          refresh_token: tokenInfo.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      const tokenData = await response.json();

      if (tokenData.error) {
        throw new Error(`Token refresh failed: ${tokenData.error_description}`);
      }

      // Update stored token
      this.supervisorTokens.set(supervisorId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || tokenInfo.refreshToken,
        expiresAt: Date.now() + (tokenData.expires_in * 1000),
        scope: tokenData.scope,
        obtainedAt: tokenInfo.obtainedAt,
        refreshedAt: new Date().toISOString()
      });

      console.log(`✅ Token refreshed for supervisor ${supervisorId}`);
      return true;

    } catch (error) {
      console.error(`❌ Token refresh failed for ${supervisorId}:`, error);
      this.supervisorTokens.delete(supervisorId);
      return false;
    }
  }

  // Get valid access token for supervisor
  async getValidAccessToken(supervisorId) {
    const tokenInfo = this.supervisorTokens.get(supervisorId);
    
    if (!tokenInfo) {
      throw new Error('Supervisor not logged in to Microsoft 365');
    }

    // Check if token is expired (with 5 minute buffer)
    if (Date.now() > (tokenInfo.expiresAt - 5 * 60 * 1000)) {
      console.log(`🔄 Token expiring soon for ${supervisorId}, refreshing...`);
      const refreshed = await this.refreshSupervisorToken(supervisorId);
      if (!refreshed) {
        throw new Error('Token expired and refresh failed. Please log in again.');
      }
      return this.supervisorTokens.get(supervisorId).accessToken;
    }

    return tokenInfo.accessToken;
  }

  // Create Graph client for supervisor
  async createGraphClient(supervisorId) {
    const accessToken = await this.getValidAccessToken(supervisorId);
    
    const authProvider = {
      getAccessToken: async () => {
        return accessToken;
      }
    };

    return Client.initWithMiddleware({ authProvider });
  }

  // Get supervisor info from Microsoft Graph
  async getSupervisorInfo(supervisorId) {
    try {
      const graphClient = await this.createGraphClient(supervisorId);
      
      const user = await graphClient
        .api('/me')
        .select('displayName,mail,jobTitle,department,officeLocation')
        .get();

      return {
        displayName: user.displayName,
        mail: user.mail,
        jobTitle: user.jobTitle,
        department: user.department,
        officeLocation: user.officeLocation
      };

    } catch (error) {
      console.error(`❌ Failed to get supervisor info for ${supervisorId}:`, error);
      throw error;
    }
  }

  // Send roadwork notification (from supervisor's account)
  async sendRoadworkNotification(roadwork, recipients, supervisorId, emailGroups = []) {
    try {
      const graphClient = await this.createGraphClient(supervisorId);
      const supervisorInfo = await this.getSupervisorInfo(supervisorId);

      // Validate recipients
      if (!recipients || recipients.length === 0) {
        throw new Error('No recipients provided');
      }

      // Create email content
      const emailSubject = `🚧 Roadwork Alert: ${roadwork.title}`;
      const emailBody = this.createRoadworkEmailBody(roadwork, supervisorInfo);

      // Prepare recipients in Microsoft Graph format
      const toRecipients = recipients.map(email => ({
        emailAddress: {
          address: email.trim(),
          name: email.split('@')[0]
        }
      }));

      // Create email message
      const message = {
        subject: emailSubject,
        body: {
          contentType: 'html',
          content: emailBody
        },
        toRecipients: toRecipients,
        importance: this.getEmailImportance(roadwork.severity),
        categories: ['Go BARRY', 'Roadwork Alert', `Severity-${roadwork.severity}`]
      };

      // Send email from supervisor's account
      await graphClient
        .api('/me/sendMail')
        .post({
          message: message,
          saveToSentItems: true
        });

      console.log(`✅ Roadwork email sent by ${supervisorInfo.displayName} (${supervisorInfo.mail})`);
      console.log(`📧 Subject: ${emailSubject}`);
      console.log(`👥 Recipients: ${recipients.length} addresses`);

      return {
        success: true,
        recipients: recipients,
        subject: emailSubject,
        sentBy: supervisorInfo.mail,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Send roadwork email error:', error);
      
      // Check if token issue
      if (error.message.includes('401') || error.message.includes('token') || error.message.includes('Unauthorized')) {
        return {
          success: false,
          error: 'Microsoft login expired. Please log in again.',
          requiresReauth: true
        };
      }
      
      return {
        success: false,
        error: error.message,
        details: error.code || 'Unknown error'
      };
    }
  }

  // Send test email
  async sendTestEmail(supervisorId, testRecipient) {
    try {
      const supervisorInfo = await this.getSupervisorInfo(supervisorId);

      const testRoadwork = {
        id: 'test-001',
        title: 'Test Roadwork Alert',
        description: 'This is a test email from the Go BARRY system to verify Microsoft 365 integration.',
        location: 'Test Location - A1 Newcastle',
        status: 'pending',
        severity: 'medium',
        start_date: new Date().toISOString(),
        routes_affected: ['21', 'X21'],
        created_by_name: supervisorInfo.displayName,
        created_by_supervisor_id: supervisorId,
        created_at: new Date().toISOString(),
        contact_info: supervisorInfo.mail
      };

      const result = await this.sendRoadworkNotification(
        testRoadwork, 
        [testRecipient],
        supervisorId,
        ['Test Group']
      );

      return result;

    } catch (error) {
      console.error('❌ Test email error:', error);
      return {
        success: false,
        error: error.message,
        requiresReauth: error.message.includes('not logged in')
      };
    }
  }

  // Check if supervisor is logged in to Microsoft
  isSupervisorLoggedIn(supervisorId) {
    const tokenInfo = this.supervisorTokens.get(supervisorId);
    return tokenInfo && Date.now() < tokenInfo.expiresAt;
  }

  // Get supervisor login status
  getSupervisorLoginStatus(supervisorId) {
    const tokenInfo = this.supervisorTokens.get(supervisorId);
    
    if (!tokenInfo) {
      return {
        loggedIn: false,
        requiresLogin: true
      };
    }

    const isExpired = Date.now() > tokenInfo.expiresAt;
    const expiresIn = Math.max(0, tokenInfo.expiresAt - Date.now());

    return {
      loggedIn: !isExpired,
      expiresIn: expiresIn,
      expiresInMinutes: Math.round(expiresIn / 1000 / 60),
      obtainedAt: tokenInfo.obtainedAt,
      requiresLogin: isExpired
    };
  }

  // Log out supervisor from Microsoft
  logoutSupervisor(supervisorId) {
    const tokenInfo = this.supervisorTokens.get(supervisorId);
    if (tokenInfo) {
      this.supervisorTokens.delete(supervisorId);
      console.log(`🚪 Supervisor ${supervisorId} logged out from Microsoft 365`);
      return true;
    }
    return false;
  }

  // Get all logged in supervisors
  getLoggedInSupervisors() {
    const loggedIn = [];
    
    for (const [supervisorId, tokenInfo] of this.supervisorTokens.entries()) {
      if (Date.now() < tokenInfo.expiresAt) {
        loggedIn.push({
          supervisorId,
          obtainedAt: tokenInfo.obtainedAt,
          expiresAt: new Date(tokenInfo.expiresAt).toISOString(),
          expiresInMinutes: Math.round((tokenInfo.expiresAt - Date.now()) / 1000 / 60)
        });
      }
    }

    return loggedIn;
  }

  createRoadworkEmailBody(roadwork, supervisorInfo) {
    const statusEmoji = {
      pending: '🟡',
      active: '🔴', 
      finished: '🟢'
    };

    const severityEmoji = {
      low: '🟢',
      medium: '🟡',
      high: '🔴'
    };

    const severityColor = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#ef4444'
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Go BARRY Roadwork Alert</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1565C0, #1976D2); color: white; padding: 25px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🚧 Go BARRY Roadwork Alert</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Go North East - Traffic Intelligence System</p>
          </div>
          
          <!-- Alert Banner -->
          <div style="background: ${severityColor[roadwork.severity]}; color: white; padding: 15px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px;">${severityEmoji[roadwork.severity]} ${roadwork.title}</h2>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 25px;">
            
            <!-- Status & Severity -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid ${severityColor[roadwork.severity]};">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span><strong>Status:</strong> ${statusEmoji[roadwork.status]} ${roadwork.status.toUpperCase()}</span>
                <span><strong>Severity:</strong> ${severityEmoji[roadwork.severity]} ${roadwork.severity.toUpperCase()}</span>
              </div>
            </div>
            
            <!-- Location & Details -->
            <div style="background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 15px 0; color: #333; font-size: 18px;">📍 Location & Details</h3>
              
              <p style="margin: 8px 0;"><strong>Location:</strong> ${roadwork.location}</p>
              
              ${roadwork.description ? `
                <div style="margin: 15px 0;">
                  <strong>Description:</strong>
                  <p style="margin: 8px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; line-height: 1.5;">
                    ${roadwork.description}
                  </p>
                </div>
              ` : ''}
              
              <div style="margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>🕐 Start:</strong> ${new Date(roadwork.start_date).toLocaleString('en-GB')}</p>
                ${roadwork.end_date ? `<p style="margin: 5px 0;"><strong>🕑 End:</strong> ${new Date(roadwork.end_date).toLocaleString('en-GB')}</p>` : ''}
                ${roadwork.all_day ? '<p style="margin: 5px 0; color: #666;"><em>All day event</em></p>' : ''}
              </div>
              
              ${roadwork.routes_affected?.length ? `
                <div style="margin: 15px 0;">
                  <strong>🚌 Routes Affected:</strong>
                  <div style="margin: 8px 0;">
                    ${roadwork.routes_affected.map(route => 
                      `<span style="background: #1565C0; color: white; padding: 4px 8px; border-radius: 4px; margin: 2px; display: inline-block; font-weight: bold;">${route}</span>`
                    ).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${roadwork.areas?.length ? `
                <p style="margin: 8px 0;"><strong>🏙️ Areas:</strong> ${roadwork.areas.join(', ')}</p>
              ` : ''}
            </div>
            
            <!-- Contact Information -->
            ${roadwork.contact_info || roadwork.web_link ? `
              <div style="background: #e3f2fd; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #1565C0;">📞 Contact Information</h4>
                ${roadwork.contact_info ? `<p style="margin: 5px 0;"><strong>Contact:</strong> ${roadwork.contact_info}</p>` : ''}
                ${roadwork.web_link ? `<p style="margin: 5px 0;"><strong>More Info:</strong> <a href="${roadwork.web_link}" style="color: #1565C0; text-decoration: none;">${roadwork.web_link}</a></p>` : ''}
              </div>
            ` : ''}
            
            <!-- Sent By Information -->
            <div style="background: #f0f8ff; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #333;">📤 Sent By</h4>
              <p style="margin: 5px 0;"><strong>Name:</strong> ${supervisorInfo.displayName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${supervisorInfo.mail}</p>
              ${supervisorInfo.jobTitle ? `<p style="margin: 5px 0;"><strong>Role:</strong> ${supervisorInfo.jobTitle}</p>` : ''}
              ${supervisorInfo.department ? `<p style="margin: 5px 0;"><strong>Department:</strong> ${supervisorInfo.department}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Sent:</strong> ${new Date().toLocaleString('en-GB')}</p>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; color: #666; font-size: 12px; line-height: 1.5;">
              This alert was sent by ${supervisorInfo.displayName} via the Go BARRY Traffic Intelligence System.<br>
              Go North East | Network Disruption Management<br>
              <em>For technical support, contact the Go BARRY team.</em>
            </p>
          </div>
          
        </div>
      </body>
      </html>
    `;
  }

  getEmailImportance(severity) {
    const importanceMap = {
      low: 'normal',
      medium: 'normal', 
      high: 'high'
    };
    return importanceMap[severity] || 'normal';
  }
}

// Export singleton instance
export default new MicrosoftEmailService();