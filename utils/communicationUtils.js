/**
 * Communication utilities for Disruption Database
 * Supports email, social media, and multi-channel distribution
 */

import { Platform } from 'react-native';

// Email templates for different communication types
const EMAIL_TEMPLATES = {
  disruption_alert: {
    subject: 'Go BARRY - Disruption Alert: {location}',
    body: `Dear Team,

A new disruption has been identified that may affect Go North East services:

DISRUPTION DETAILS:
- Type: {type}
- Location: {location}
- Status: {status}
- Priority: {priority}
- Description: {description}

AFFECTED ROUTES:
{routes}

TIMELINE:
- Reported: {createdAt}
- Last Updated: {lastUpdated}

Please review this disruption and take appropriate action for your services.

---
This alert was generated automatically by Go BARRY Traffic Intelligence Platform.
For more details, log into the system at: https://gobarry.co.uk

Best regards,
Go BARRY System`
  },
  
  status_update: {
    subject: 'Go BARRY - Status Update: {location}',
    body: `Dear Team,

The following disruption has been updated:

DISRUPTION: {title}
Location: {location}
New Status: {status}
Priority: {priority}

CHANGES:
{changes}

AFFECTED ROUTES:
{routes}

CURRENT IMPACT:
{description}

Please adjust your services accordingly.

---
This update was sent from Go BARRY Traffic Intelligence Platform.

Best regards,
Go BARRY System`
  },

  weekly_summary: {
    subject: 'Go BARRY - Weekly Disruption Summary',
    body: `Dear Team,

Here is your weekly summary of traffic disruptions affecting Go North East services:

SUMMARY STATISTICS:
- Total Disruptions: {totalCount}
- Active Disruptions: {activeCount}
- Resolved This Week: {resolvedCount}
- Average Resolution Time: {avgResolutionTime}

TOP AFFECTED AREAS:
{topAreas}

PRIORITY BREAKDOWN:
{priorityBreakdown}

UPCOMING PLANNED WORKS:
{plannedWorks}

For detailed information, please access the Go BARRY dashboard.

---
This summary was generated automatically by Go BARRY Traffic Intelligence Platform.

Best regards,
Go BARRY System`
  }
};

// Social media templates
const SOCIAL_TEMPLATES = {
  twitter: {
    disruption_alert: '🚌 #TrafficAlert: {type} reported at {location}. Routes {routes} may be affected. Status: {status}. Updates: https://gobarry.co.uk #GoNorthEast #TrafficUpdate',
    status_update: '🚌 #Update: {location} disruption now {status}. Routes {routes} affected. Check https://gobarry.co.uk for details #GoNorthEast',
    resolved: '✅ #Resolved: {location} disruption cleared. Normal service resuming on routes {routes}. Thanks for your patience! #GoNorthEast'
  },
  
  facebook: {
    disruption_alert: `🚌 TRAFFIC ALERT 🚌

We're aware of a {type} at {location} which may affect some of our services.

📍 Location: {location}
🚍 Affected Routes: {routes}
📊 Status: {status}
⏰ Reported: {createdAt}

We're monitoring the situation and will provide updates as they become available.

For real-time updates, visit: https://gobarry.co.uk

#GoNorthEast #TrafficUpdate`,

    status_update: `🚌 DISRUPTION UPDATE 🚌

Status update for the {type} at {location}:

📊 New Status: {status}
🚍 Affected Routes: {routes}
ℹ️ Details: {description}

We continue to monitor the situation.

For the latest information, visit: https://gobarry.co.uk

#GoNorthEast #TrafficUpdate`
  }
};

// Stakeholder groups for targeted communication
export const STAKEHOLDER_GROUPS = {
  control_room: {
    name: 'Control Room Staff',
    description: 'Operations control room supervisors',
    channels: ['email', 'sms'],
    urgency: 'immediate'
  },
  depot_managers: {
    name: 'Depot Managers',
    description: 'Depot and garage managers',
    channels: ['email'],
    urgency: 'high'
  },
  field_supervisors: {
    name: 'Field Supervisors', 
    description: 'On-road supervisors and inspectors',
    channels: ['sms', 'app_notification'],
    urgency: 'immediate'
  },
  customer_services: {
    name: 'Customer Services',
    description: 'Customer service team',
    channels: ['email', 'internal_chat'],
    urgency: 'medium'
  },
  social_media: {
    name: 'Social Media Team',
    description: 'Social media and communications team',
    channels: ['email', 'content_suggestions'],
    urgency: 'medium'
  },
  passengers: {
    name: 'Passengers',
    description: 'General public via social media',
    channels: ['twitter', 'facebook', 'website'],
    urgency: 'low'
  }
};

// Communication channels configuration
export const COMMUNICATION_CHANNELS = {
  email: {
    name: 'Email',
    icon: 'mail',
    description: 'Send email notifications',
    available: Platform.OS === 'web',
    color: '#3B82F6'
  },
  sms: {
    name: 'SMS',
    icon: 'phone-portrait',
    description: 'Send SMS alerts',
    available: false, // Requires SMS API integration
    color: '#10B981'
  },
  twitter: {
    name: 'Twitter/X',
    icon: 'logo-twitter',
    description: 'Share on Twitter',
    available: Platform.OS === 'web',
    color: '#1DA1F2'
  },
  facebook: {
    name: 'Facebook',
    icon: 'logo-facebook',
    description: 'Share on Facebook',
    available: Platform.OS === 'web',
    color: '#4267B2'
  },
  teams: {
    name: 'Microsoft Teams',
    icon: 'people',
    description: 'Send to Teams channel',
    available: Platform.OS === 'web',
    color: '#6264A7'
  },
  slack: {
    name: 'Slack',
    icon: 'chatbubbles',
    description: 'Send to Slack channel',
    available: false, // Requires Slack API integration
    color: '#4A154B'
  }
};

// Generate email content from template
export const generateEmailContent = (template, disruption, additionalData = {}) => {
  if (!EMAIL_TEMPLATES[template]) {
    throw new Error(`Unknown email template: ${template}`);
  }

  const templateData = EMAIL_TEMPLATES[template];
  let subject = templateData.subject;
  let body = templateData.body;

  // Basic replacement data
  const replacements = {
    type: disruption.type || 'Unknown',
    title: disruption.title || 'Untitled Disruption',
    location: disruption.location || 'Unknown Location',
    status: disruption.status || 'Unknown',
    priority: disruption.priority || 'Medium',
    description: disruption.description || 'No description available',
    routes: disruption.affectedRoutes ? disruption.affectedRoutes.join(', ') : 'None specified',
    createdAt: disruption.createdAt ? new Date(disruption.createdAt).toLocaleString('en-GB') : 'Unknown',
    lastUpdated: disruption.lastUpdated ? new Date(disruption.lastUpdated).toLocaleString('en-GB') : 'N/A',
    createdBy: disruption.createdBy || 'System',
    ...additionalData
  };

  // Replace placeholders in subject and body
  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value);
    body = body.replace(new RegExp(placeholder, 'g'), value);
  });

  return { subject, body };
};

// Generate social media content
export const generateSocialContent = (platform, template, disruption) => {
  if (!SOCIAL_TEMPLATES[platform] || !SOCIAL_TEMPLATES[platform][template]) {
    throw new Error(`Unknown social template: ${platform}.${template}`);
  }

  let content = SOCIAL_TEMPLATES[platform][template];

  const replacements = {
    type: disruption.type || 'disruption',
    location: disruption.location || 'unknown location',
    status: disruption.status || 'under review',
    routes: disruption.affectedRoutes ? 
      (disruption.affectedRoutes.length > 3 ? 
        `${disruption.affectedRoutes.slice(0, 3).join(', ')} +${disruption.affectedRoutes.length - 3} more` :
        disruption.affectedRoutes.join(', ')) : 
      'multiple',
    createdAt: disruption.createdAt ? new Date(disruption.createdAt).toLocaleString('en-GB') : 'recently',
    description: disruption.description || 'monitoring situation'
  };

  Object.entries(replacements).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });

  return content;
};

// Email sending function (web-based mailto)
export const sendEmail = async (recipients, subject, body) => {
  if (Platform.OS !== 'web') {
    throw new Error('Email sending is only supported on web platform');
  }
  
  if (typeof window === 'undefined') {
    throw new Error('Email sending requires web browser environment');
  }

  try {
    // Validate recipients
    if (!recipients || recipients.length === 0) {
      throw new Error('No email recipients specified');
    }
    
    const emailParams = new URLSearchParams({
      subject: subject || 'Go BARRY Disruption Alert',
      body: body || 'No message content'
    });

    const mailtoLink = `mailto:${recipients.join(',')}?${emailParams.toString()}`;
    
    // Open default email client
    window.open(mailtoLink);
    
    return { success: true, method: 'mailto' };
  } catch (error) {
    throw new Error(`Failed to open email client: ${error.message}`);
  }
};

// Social media sharing functions
export const shareOnTwitter = (content) => {
  if (Platform.OS !== 'web') {
    throw new Error('Twitter sharing is only supported on web platform');
  }
  
  if (typeof window === 'undefined') {
    throw new Error('Twitter sharing requires web browser environment');
  }

  if (!content || content.trim().length === 0) {
    throw new Error('No content provided for Twitter sharing');
  }

  const tweetText = encodeURIComponent(content.substring(0, 280)); // Twitter character limit
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;
  
  const popup = window.open(twitterUrl, '_blank', 'width=600,height=400');
  if (!popup) {
    throw new Error('Popup blocked - please allow popups for social media sharing');
  }
  
  return { success: true, platform: 'twitter' };
};

export const shareOnFacebook = (content) => {
  if (Platform.OS !== 'web') {
    throw new Error('Facebook sharing is only supported on web platform');
  }
  
  if (typeof window === 'undefined') {
    throw new Error('Facebook sharing requires web browser environment');
  }

  if (!content || content.trim().length === 0) {
    throw new Error('No content provided for Facebook sharing');
  }

  // Facebook sharing requires a URL, so we'll use a generic share dialog
  const shareText = encodeURIComponent(content);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?quote=${shareText}&u=https://gobarry.co.uk`;
  
  const popup = window.open(facebookUrl, '_blank', 'width=600,height=400');
  if (!popup) {
    throw new Error('Popup blocked - please allow popups for social media sharing');
  }
  
  return { success: true, platform: 'facebook' };
};

// Teams integration (opens Teams web app)
export const shareOnTeams = (content) => {
  if (Platform.OS !== 'web') {
    throw new Error('Teams sharing is only supported on web platform');
  }
  
  if (typeof window === 'undefined') {
    throw new Error('Teams sharing requires web browser environment');
  }

  if (!content || content.trim().length === 0) {
    throw new Error('No content provided for Teams sharing');
  }

  const message = encodeURIComponent(content);
  const teamsUrl = `https://teams.microsoft.com/l/chat/0/0?message=${message}`;
  
  const popup = window.open(teamsUrl, '_blank');
  if (!popup) {
    throw new Error('Popup blocked - please allow popups for Teams sharing');
  }
  
  return { success: true, platform: 'teams' };
};

// Multi-channel distribution
export const distributeMessage = async (channels, disruption, template = 'disruption_alert', additionalData = {}) => {
  const results = [];

  for (const channel of channels) {
    try {
      let result;

      switch (channel.type) {
        case 'email':
          const emailContent = generateEmailContent(template, disruption, additionalData);
          result = await sendEmail(channel.recipients, emailContent.subject, emailContent.body);
          break;

        case 'twitter':
          const twitterContent = generateSocialContent('twitter', template, disruption);
          result = shareOnTwitter(twitterContent);
          break;

        case 'facebook':
          const facebookContent = generateSocialContent('facebook', template, disruption);
          result = shareOnFacebook(facebookContent);
          break;

        case 'teams':
          const teamsContent = generateEmailContent(template, disruption, additionalData);
          result = shareOnTeams(`${teamsContent.subject}\n\n${teamsContent.body}`);
          break;

        default:
          throw new Error(`Unsupported channel type: ${channel.type}`);
      }

      results.push({
        channel: channel.name,
        success: true,
        ...result
      });

    } catch (error) {
      results.push({
        channel: channel.name,
        success: false,
        error: error.message
      });
    }
  }

  return results;
};

// Pre-defined communication workflows
export const COMMUNICATION_WORKFLOWS = {
  critical_alert: {
    name: 'Critical Alert',
    description: 'Immediate notification for critical disruptions',
    triggers: ['priority:critical', 'status:active'],
    channels: ['email', 'sms', 'teams'],
    stakeholders: ['control_room', 'field_supervisors', 'depot_managers'],
    template: 'disruption_alert'
  },

  status_change: {
    name: 'Status Update',
    description: 'Notify when disruption status changes',
    triggers: ['status_changed'],
    channels: ['email', 'twitter'],
    stakeholders: ['control_room', 'customer_services', 'passengers'],
    template: 'status_update'
  },

  resolution: {
    name: 'Resolution Notice',
    description: 'Notification when disruption is resolved',
    triggers: ['status:completed', 'status:closed'],
    channels: ['twitter', 'facebook', 'email'],
    stakeholders: ['passengers', 'customer_services'],
    template: 'resolved'
  },

  weekly_report: {
    name: 'Weekly Summary',
    description: 'Weekly disruption summary report',
    triggers: ['schedule:weekly'],
    channels: ['email'],
    stakeholders: ['depot_managers', 'customer_services'],
    template: 'weekly_summary'
  }
};

// Communication preferences
export const getDefaultCommunicationSettings = () => ({
  autoNotifyOnCritical: true,
  autoNotifyOnStatusChange: false,
  autoSocialMediaUpdates: false,
  emailRecipients: [
    'control.room@gonortheast.co.uk',
    'operations@gonortheast.co.uk'
  ],
  socialMediaChannels: ['twitter'],
  notificationThreshold: 'high'
});

// Validate communication setup
export const validateCommunicationSetup = (channels) => {
  const errors = [];
  const warnings = [];

  channels.forEach(channel => {
    const channelConfig = COMMUNICATION_CHANNELS[channel.type];
    
    if (!channelConfig) {
      errors.push(`Unknown channel type: ${channel.type}`);
      return;
    }

    if (!channelConfig.available) {
      warnings.push(`Channel ${channelConfig.name} is not currently available`);
    }

    if (channel.type === 'email' && (!channel.recipients || channel.recipients.length === 0)) {
      errors.push('Email channel requires at least one recipient');
    }
  });

  return { errors, warnings, isValid: errors.length === 0 };
};