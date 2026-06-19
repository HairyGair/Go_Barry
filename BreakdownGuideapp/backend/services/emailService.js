/**
 * Email Service - Handles email notifications
 * Uses nodemailer to send emails via cPanel SMTP
 */

import nodemailer from 'nodemailer';

// Email configuration from environment variables
const emailConfig = {
  host: process.env.SMTP_HOST || 'mail.gobarry.co.uk',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true' || true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'noreply@gobarry.co.uk',
    pass: process.env.SMTP_PASSWORD || ''
  }
};

// Create reusable transporter
let transporter = null;

/**
 * Initialize email transporter
 */
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
}

/**
 * Send feedback notification email
 * @param {Object} feedbackData - The feedback/bug report data
 * @returns {Promise<Object>} - Email send result
 */
export async function sendFeedbackNotification(feedbackData) {
  try {
    const transport = getTransporter();

    // Determine emoji based on sentiment or type
    let emoji = '💬';
    if (feedbackData.description && feedbackData.description.includes('Sentiment: happy')) {
      emoji = '😊';
    } else if (feedbackData.description && feedbackData.description.includes('Sentiment: sad')) {
      emoji = '😞';
    } else if (feedbackData.type === 'error') {
      emoji = '❌';
    } else if (feedbackData.type === 'bug') {
      emoji = '🐛';
    }

    // Extract sentiment and message from description
    let sentiment = 'N/A';
    let userMessage = 'No additional message';
    if (feedbackData.description) {
      const sentimentMatch = feedbackData.description.match(/Sentiment: (\w+)/);
      const messageMatch = feedbackData.description.match(/Message: (.+)/);
      if (sentimentMatch) sentiment = sentimentMatch[1];
      if (messageMatch) userMessage = messageMatch[1];
    }

    // Build HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #6c5ce7, #a29bfe);
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f8f9fa;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-top: none;
    }
    .info-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-label {
      font-weight: 600;
      width: 140px;
      color: #555;
    }
    .info-value {
      flex: 1;
      color: #333;
    }
    .severity-high, .severity-critical {
      color: #d63031;
      font-weight: bold;
    }
    .severity-medium {
      color: #f39c12;
      font-weight: bold;
    }
    .severity-low {
      color: #27ae60;
    }
    .message-box {
      background: white;
      padding: 15px;
      margin: 15px 0;
      border-left: 4px solid #6c5ce7;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      color: #999;
      font-size: 12px;
    }
    .view-button {
      display: inline-block;
      background: #6c5ce7;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      margin: 15px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${emoji} New Feedback Received</h1>
  </div>

  <div class="content">
    <div class="info-row">
      <span class="info-label">Type:</span>
      <span class="info-value">${feedbackData.type || 'feedback'}</span>
    </div>

    <div class="info-row">
      <span class="info-label">Severity:</span>
      <span class="info-value severity-${feedbackData.severity}">${feedbackData.severity || 'low'}</span>
    </div>

    <div class="info-row">
      <span class="info-label">Sentiment:</span>
      <span class="info-value">${sentiment}</span>
    </div>

    <div class="info-row">
      <span class="info-label">Page:</span>
      <span class="info-value">${feedbackData.pageUrl || 'N/A'}</span>
    </div>

    <div class="info-row">
      <span class="info-label">Submitted:</span>
      <span class="info-value">${new Date().toLocaleString('en-GB')}</span>
    </div>

    ${feedbackData.reporterName ? `
    <div class="info-row">
      <span class="info-label">User:</span>
      <span class="info-value">${feedbackData.reporterName}${feedbackData.reporterBadge ? ` (${feedbackData.reporterBadge})` : ''}</span>
    </div>
    ` : ''}

    <div class="message-box">
      <strong>User Message:</strong>
      <p>${userMessage}</p>
    </div>

    ${feedbackData.errorMessage ? `
    <div class="message-box" style="border-left-color: #d63031;">
      <strong>Error Details:</strong>
      <p><strong>Message:</strong> ${feedbackData.errorMessage}</p>
      ${feedbackData.errorStack ? `<p style="font-size: 11px; color: #666;"><strong>Stack:</strong><br>${feedbackData.errorStack.substring(0, 200)}...</p>` : ''}
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 20px;">
      <a href="https://breakdowns.gobarry.co.uk" class="view-button">View Dashboard</a>
    </div>
  </div>

  <div class="footer">
    <p>Go BARRY Breakdown Management System</p>
    <p>This is an automated notification from the feedback system.</p>
  </div>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
${emoji} NEW FEEDBACK RECEIVED

Type: ${feedbackData.type || 'feedback'}
Severity: ${feedbackData.severity || 'low'}
Sentiment: ${sentiment}
Page: ${feedbackData.pageUrl || 'N/A'}
Submitted: ${new Date().toLocaleString('en-GB')}
${feedbackData.reporterName ? `User: ${feedbackData.reporterName}${feedbackData.reporterBadge ? ` (${feedbackData.reporterBadge})` : ''}` : ''}

USER MESSAGE:
${userMessage}

${feedbackData.errorMessage ? `
ERROR DETAILS:
${feedbackData.errorMessage}
${feedbackData.errorStack ? `\nStack: ${feedbackData.errorStack.substring(0, 200)}...` : ''}
` : ''}

---
Go BARRY Breakdown Management System
View Dashboard: https://breakdowns.gobarry.co.uk
    `;

    // Email options
    const mailOptions = {
      from: `"Go BARRY Feedback" <${emailConfig.auth.user}>`,
      to: 'gair@gobarry.co.uk',
      subject: `${emoji} ${feedbackData.title || 'New Feedback Received'}`,
      text: textContent,
      html: htmlContent,
      priority: feedbackData.severity === 'high' || feedbackData.severity === 'critical' ? 'high' : 'normal'
    };

    // Send email
    const info = await transport.sendMail(mailOptions);

    console.log('✅ Feedback email sent:', info.messageId);
    return {
      success: true,
      messageId: info.messageId
    };

  } catch (error) {
    console.error('❌ Error sending feedback email:', error);
    // Don't throw error - we don't want to fail the feedback submission if email fails
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send a sales/interest enquiry notification (from the public "I am interested" form)
 * @param {Object} enquiry - The enquiry data from a prospective operator
 * @returns {Promise<Object>} - Email send result
 */
export async function sendInterestNotification(enquiry) {
  try {
    const transport = getTransporter();

    const esc = (v) => String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const row = (label, value) => value
      ? `<div class="info-row"><span class="info-label">${label}:</span><span class="info-value">${esc(value)}</span></div>`
      : '';

    const features = Array.isArray(enquiry.features) ? enquiry.features.join(', ') : enquiry.features;
    const submittedAt = new Date().toLocaleString('en-GB');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00838F, #00BCD4); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { background: #f8f9fa; padding: 20px; border: 1px solid #e0e0e0; border-top: none; }
    .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .info-label { font-weight: 600; width: 180px; color: #555; }
    .info-value { flex: 1; color: #333; }
    .message-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #00838F; border-radius: 4px; }
    .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header"><h1>🚌 New Go BARRY Enquiry</h1></div>
  <div class="content">
    ${row('Contact name', enquiry.name)}
    ${row('Company / operator', enquiry.company)}
    ${row('Email', enquiry.email)}
    ${row('Phone', enquiry.phone)}
    ${row('Role', enquiry.role)}
    ${row('Fleet size', enquiry.fleetSize)}
    ${row('Number of depots', enquiry.depots)}
    ${row('Current process', enquiry.currentProcess)}
    ${row('Features of interest', features)}
    ${row('Submitted', submittedAt)}
    ${enquiry.message ? `<div class="message-box"><strong>Message:</strong><p>${esc(enquiry.message)}</p></div>` : ''}
  </div>
  <div class="footer">
    <p>Go BARRY Breakdown Management System</p>
    <p>Sent from the "I am interested" form on the public site.</p>
  </div>
</body>
</html>`;

    const textContent = `🚌 NEW GO BARRY ENQUIRY

Contact name: ${enquiry.name || ''}
Company / operator: ${enquiry.company || ''}
Email: ${enquiry.email || ''}
Phone: ${enquiry.phone || ''}
Role: ${enquiry.role || ''}
Fleet size: ${enquiry.fleetSize || ''}
Number of depots: ${enquiry.depots || ''}
Current process: ${enquiry.currentProcess || ''}
Features of interest: ${features || ''}
Submitted: ${submittedAt}

MESSAGE:
${enquiry.message || '(none)'}

---
Go BARRY Breakdown Management System
Sent from the "I am interested" form on the public site.`;

    const mailOptions = {
      from: `"Go BARRY Enquiry" <${emailConfig.auth.user}>`,
      to: process.env.INTEREST_NOTIFY_EMAIL || 'gair@gobarry.co.uk',
      replyTo: enquiry.email || undefined,
      subject: `🚌 New enquiry: ${enquiry.company || enquiry.name || 'Prospective operator'}`,
      text: textContent,
      html: htmlContent
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Interest enquiry email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending interest enquiry email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send test email to verify configuration
 * @returns {Promise<Object>} - Test result
 */
export async function sendTestEmail() {
  try {
    const transport = getTransporter();

    const mailOptions = {
      from: `"Go BARRY System" <${emailConfig.auth.user}>`,
      to: 'gair@gobarry.co.uk',
      subject: '✅ Email Service Test - Configuration OK',
      text: 'This is a test email from the Go BARRY email service. If you received this, the email configuration is working correctly!',
      html: '<h2>✅ Email Service Test</h2><p>This is a test email from the Go BARRY email service.</p><p>If you received this, the email configuration is working correctly!</p>'
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Test email sent:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      message: 'Test email sent successfully'
    };
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Verify email transporter configuration
 * @returns {Promise<boolean>} - True if configuration is valid
 */
export async function verifyEmailConfig() {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ Email transporter verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Email transporter verification failed:', error);
    return false;
  }
}

export default {
  sendFeedbackNotification,
  sendInterestNotification,
  sendTestEmail,
  verifyEmailConfig
};
