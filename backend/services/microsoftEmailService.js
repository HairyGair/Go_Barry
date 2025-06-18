import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';

class MicrosoftEmailService {
  constructor() {
    this.tenantId = process.env.AZURE_TENANT_ID;
    this.clientId = process.env.AZURE_CLIENT_ID;
    this.clientSecret = process.env.AZURE_CLIENT_SECRET;
    this.senderEmail = process.env.M365_SENDER_EMAIL;
    
    this.credential = null;
    this.graphClient = null;
    
    this.initialize();
  }

  async initialize() {
    try {
      if (!this.tenantId || !this.clientId || !this.clientSecret) {
        throw new Error('Missing Microsoft 365 configuration. Check environment variables.');
      }

      // Create credential for app-only authentication
      this.credential = new ClientSecretCredential(
        this.tenantId,
        this.clientId,
        this.clientSecret
      );

      // Initialize Graph client
      this.graphClient = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: async () => {
            const tokenResponse = await this.credential.getToken([
              'https://graph.microsoft.com/.default'
            ]);
            return tokenResponse.token;
          }
        }
      });

      console.log('✅ Microsoft 365 Email Service initialized');
      
    } catch (error) {
      console.error('❌ Microsoft 365 Email Service initialization failed:', error);
      throw error;
    }
  }

  async sendRoadworkNotification(roadwork, recipients, emailGroups = []) {
    try {
      if (!this.graphClient) {
        throw new Error('Microsoft Graph client not initialized');
      }

      // Validate recipients
      if (!recipients || recipients.length === 0) {
        throw new Error('No recipients provided');
      }

      // Create email content
      const emailSubject = `🚧 Go BARRY Roadwork Alert: ${roadwork.title}`;
      const emailBody = this.createRoadworkEmailBody(roadwork);

      // Prepare recipients in Microsoft Graph format
      const toRecipients = recipients.map(email => ({
        emailAddress: {
          address: email.trim(),
          name: email.split('@')[0] // Use email prefix as display name
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
        from: {
          emailAddress: {
            address: this.senderEmail,
            name: 'Go BARRY Traffic Intelligence'
          }
        },
        importance: this.getEmailImportance(roadwork.severity),
        categories: ['Go BARRY', 'Traffic Alert', `Severity-${roadwork.severity}`]
      };

      // Add attachments if web link exists
      if (roadwork.web_link) {
        message.body.content += `
          <div style="margin-top: 20px; padding: 10px; background: #f0f8ff; border-radius: 5px;">
            <p><strong>📎 Additional Information:</strong></p>
            <p><a href="${roadwork.web_link}" style="color: #1565C0;">${roadwork.web_link}</a></p>
          </div>
        `;
      }

      // Send email using shared mailbox or service account
      await this.graphClient
        .api(`/users/${this.senderEmail}/sendMail`)
        .post({
          message: message,
          saveToSentItems: true
        });

      console.log(`✅ Microsoft 365 email sent for roadwork: ${roadwork.title} to ${recipients.length} recipients`);

      return {
        success: true,
        recipients: recipients,
        subject: emailSubject,
        sentAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Microsoft 365 send email error:', error);
      
      // Return detailed error for debugging
      return {
        success: false,
        error: error.message,
        details: error.code || 'Unknown error'
      };
    }
  }

  async sendTestEmail(testRecipient) {
    try {
      const testRoadwork = {
        id: 'test-001',
        title: 'Test Roadwork Alert',
        description: 'This is a test email from the Go BARRY system to verify Microsoft 365 integration.',
        location: 'Test Location - A1 Newcastle',
        status: 'pending',
        severity: 'medium',
        start_date: new Date().toISOString(),
        routes_affected: ['21', 'X21'],
        created_by_name: 'System Test',
        created_by_supervisor_id: 'TEST001',
        created_at: new Date().toISOString(),
        contact_info: 'test@gonortheast.co.uk'
      };

      const result = await this.sendRoadworkNotification(
        testRoadwork, 
        [testRecipient],
        ['Test Group']
      );

      return result;

    } catch (error) {
      console.error('❌ Test email error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async validateEmailAccess() {
    try {
      if (!this.graphClient) {
        return { success: false, error: 'Graph client not initialized' };
      }

      // Test access by getting user info
      const user = await this.graphClient
        .api(`/users/${this.senderEmail}`)
        .select('displayName,mail,mailboxSettings')
        .get();

      return {
        success: true,
        user: {
          displayName: user.displayName,
          email: user.mail,
          timeZone: user.mailboxSettings?.timeZone
        }
      };

    } catch (error) {
      console.error('❌ Email access validation error:', error);
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  createRoadworkEmailBody(roadwork) {
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
            <h1 style="margin: 0; font-size: 24px; font-weight: 600;">🚧 Go BARRY Traffic Alert</h1>
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
            
            <!-- Creator Information -->
            <div style="background: #f0f8ff; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; color: #333;">👤 Created By</h4>
              <p style="margin: 5px 0;"><strong>Supervisor:</strong> ${roadwork.created_by_name}</p>
              <p style="margin: 5px 0;"><strong>Badge ID:</strong> ${roadwork.created_by_supervisor_id}</p>
              <p style="margin: 5px 0;"><strong>Created:</strong> ${new Date(roadwork.created_at).toLocaleString('en-GB')}</p>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; color: #666; font-size: 12px; line-height: 1.5;">
              This alert was sent automatically by the Go BARRY Traffic Intelligence System.<br>
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