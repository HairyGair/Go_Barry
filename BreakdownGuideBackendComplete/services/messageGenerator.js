// backend/services/messageGenerator.js
// AI-Powered Message Generator for Go Barry
// Generates platform-specific disruption messages with intelligent tone and content adaptation
import { analyzePassengerImpact } from './disruptionAI.js';

// Message generation configuration
const MESSAGE_CONFIG = {
  PLATFORMS: {
    TICKETER: {
      maxLength: 160,
      tone: 'professional',
      includeETA: true,
      includeRouteNumbers: true,
      format: 'plain_text'
    },
    BLINK_DISPLAY: {
      maxLength: 200,
      tone: 'clear',
      includeVisualElements: true,
      format: 'structured_display'
    },
    PASSENGER_CLOUD: {
      maxLength: 500,
      tone: 'empathetic',
      includeAlternatives: true,
      includeApology: true,
      format: 'rich_text'
    },
    SOCIAL_MEDIA: {
      maxLength: 280,
      tone: 'friendly',
      includeHashtags: true,
      format: 'social_post'
    },
    DRIVER_NOTIFICATION: {
      maxLength: 300,
      tone: 'operational',
      includeRouteDetails: true,
      format: 'operational_brief'
    },
    WEBSITE_BANNER: {
      maxLength: 100,
      tone: 'concise',
      includeUpdateTime: true,
      format: 'banner_alert'
    }
  },
  
  SEVERITY_ADJUSTMENTS: {
    LOW: { urgencyLevel: 1, empathyMultiplier: 1.0 },
    MEDIUM: { urgencyLevel: 2, empathyMultiplier: 1.2 },
    HIGH: { urgencyLevel: 3, empathyMultiplier: 1.5 },
    CRITICAL: { urgencyLevel: 4, empathyMultiplier: 2.0 }
  },
  
  TIME_EXPRESSIONS: {
    IMMEDIATE: ['now', 'currently', 'at this time'],
    SHORT_TERM: ['temporarily', 'for the next hour', 'until further notice'],
    EXTENDED: ['for an extended period', 'throughout the day', 'until this evening'],
    OVERNIGHT: ['overnight', 'until tomorrow morning', 'through the night']
  }
};

/**
 * Main function to generate disruption messages for all platforms
 */
export async function generateDisruptionMessages(incident, options = {}) {
  try {
    console.log(`📝 Generating messages for ${incident.type} on route ${incident.route}`);
    
    // Analyze incident context
    const context = await analyzeIncidentContext(incident);
    
    // Generate messages for each platform
    const messages = {
      ticketerMessage: generateTicketerMessage(incident, context),
      blinkDisplayPDF: generateBlinkDisplayMessage(incident, context),
      passengerCloudMessage: generatePassengerCloudMessage(incident, context),
      socialMediaPost: generateSocialMediaMessage(incident, context),
      driverNotification: generateDriverNotification(incident, context),
      websiteBanner: generateWebsiteBanner(incident, context),
      timestamp: new Date().toISOString(),
      incidentId: incident.id || generateIncidentId(),
      platforms: Object.keys(MESSAGE_CONFIG.PLATFORMS)
    };
    
    // Add message metadata
    messages.metadata = {
      severity: context.severity,
      estimatedDuration: context.estimatedDuration,
      affectedPassengers: context.passengerImpact?.impact?.estimatedPassengersAffected || 'Unknown',
      generationTime: new Date().toISOString(),
      messageVersion: '1.0'
    };
    
    // Validate messages
    const validation = validateMessages(messages);
    if (!validation.valid) {
      console.warn('⚠️ Message validation warnings:', validation.warnings);
    }
    
    return {
      success: true,
      messages: messages,
      validation: validation,
      context: context
    };
    
  } catch (error) {
    console.error('❌ Message generation failed:', error);
    return {
      success: false,
      error: error.message,
      fallbackMessages: generateFallbackMessages(incident)
    };
  }
}

/**
 * Generate operator-focused ticketer message
 */
function generateTicketerMessage(incident, context) {
  const config = MESSAGE_CONFIG.PLATFORMS.TICKETER;
  
  let message = `Route ${incident.route}`;
  
  // Add disruption type
  const disruption = formatDisruptionType(incident.type, 'short');
  message += ` ${disruption}`;
  
  // Add location (abbreviated)
  const location = abbreviateLocation(incident.location);
  message += ` ${location}`;
  
  // Add diversion info if available
  if (incident.diversion && incident.diversion.diversionVia) {
    const via = incident.diversion.diversionVia[0]; // First diversion point
    message += ` via ${via}`;
  }
  
  // Add estimated delay
  if (incident.estimatedDelay || context.estimatedDelay) {
    const delay = incident.estimatedDelay || context.estimatedDelay;
    message += `. Est delay ${delay} mins`;
  }
  
  // Add resolution time if known
  if (context.expectedResolution) {
    message += `. Normal service ${context.expectedResolution}`;
  }
  
  // Ensure within character limit
  if (message.length > config.maxLength) {
    message = message.substring(0, config.maxLength - 3) + '...';
  }
  
  return {
    text: message,
    platform: 'TICKETER',
    characterCount: message.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate structured display message for blink displays
 */
function generateBlinkDisplayMessage(incident, context) {
  const config = MESSAGE_CONFIG.PLATFORMS.BLINK_DISPLAY;
  
  // Create structured display content
  const title = `ROUTE ${incident.route} DISRUPTION`;
  
  let content = '';
  
  // Add main disruption info
  if (incident.diversion && incident.diversion.diversionVia) {
    content += `Diverted via ${incident.diversion.diversionVia[0]}\n`;
  } else {
    content += `${formatDisruptionType(incident.type, 'display')}\n`;
  }
  
  // Add timing info
  if (incident.estimatedDelay || context.estimatedDelay) {
    const delay = incident.estimatedDelay || context.estimatedDelay;
    content += `Extra ${delay} minutes\n`;
  }
  
  // Add resolution info
  if (context.expectedResolution) {
    content += `Normal service ${context.expectedResolution}`;
  } else {
    content += 'Updates to follow';
  }
  
  return {
    title: title,
    content: content.trim(),
    template: determineBannerTemplate(context.severity),
    backgroundColor: getBannerColor(context.severity),
    textColor: '#FFFFFF',
    fontSize: context.severity === 'CRITICAL' ? 'large' : 'medium',
    displayDuration: context.severity === 'CRITICAL' ? 30 : 20,
    platform: 'BLINK_DISPLAY',
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate detailed passenger cloud message
 */
function generatePassengerCloudMessage(incident, context) {
  const config = MESSAGE_CONFIG.PLATFORMS.PASSENGER_CLOUD;
  
  let message = '';
  
  // Start with empathetic acknowledgment for significant disruptions
  if (context.severity === 'HIGH' || context.severity === 'CRITICAL') {
    message += 'We apologise for the inconvenience. ';
  }
  
  // Main disruption description
  const disruption = formatDisruptionType(incident.type, 'detailed');
  message += `Due to ${disruption}`;
  
  // Add specific location
  if (incident.location) {
    message += ` ${incident.location}`;
  }
  
  // Add service impact
  message += `, Route ${incident.route} services are `;
  
  if (incident.diversion && incident.diversion.diversionVia) {
    message += `diverted via ${incident.diversion.diversionVia.join(', ')}`;
  } else {
    message += `experiencing disruption`;
  }
  
  // Add timing information
  if (incident.estimatedDelay || context.estimatedDelay) {
    const delay = incident.estimatedDelay || context.estimatedDelay;
    message += `. Please allow extra ${delay} minutes for your journey`;
  }
  
  // Add resolution expectation
  if (context.expectedResolution) {
    message += `. We expect normal service to resume ${context.expectedResolution}`;
  }
  
  // Add alternative routes if available
  if (incident.alternativeRoutes && incident.alternativeRoutes.length > 0) {
    message += `. Alternative routes: ${incident.alternativeRoutes.join(', ')}`;
  }
  
  // Add passenger-specific advice
  if (context.passengerImpact && context.passengerImpact.impact) {
    const impact = context.passengerImpact.impact;
    if (impact.wheelchairAccessAffected) {
      message += '. Wheelchair accessible services remain available on alternative routes';
    }
    
    if (impact.isPeakHour) {
      message += '. Please consider alternative travel times if possible';
    }
  }
  
  // Add appreciation
  message += '. Thank you for your patience and understanding.';
  
  // Ensure within character limit
  if (message.length > config.maxLength) {
    // Intelligently trim while preserving key information
    message = trimMessageIntelligently(message, config.maxLength);
  }
  
  return {
    text: message,
    platform: 'PASSENGER_CLOUD',
    characterCount: message.length,
    includesApology: message.includes('apologise'),
    includesAlternatives: incident.alternativeRoutes && incident.alternativeRoutes.length > 0,
    includesResolutionTime: !!context.expectedResolution,
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate social media post
 */
function generateSocialMediaMessage(incident, context) {
  const config = MESSAGE_CONFIG.PLATFORMS.SOCIAL_MEDIA;
  
  let message = '';
  
  // Friendly but informative opening
  message += `🚌 Route ${incident.route} Update: `;
  
  // Brief description
  const disruption = formatDisruptionType(incident.type, 'social');
  message += disruption;
  
  // Add location if space permits
  const shortLocation = abbreviateLocation(incident.location, 15);
  if (shortLocation) {
    message += ` ${shortLocation}`;
  }
  
  // Add diversion or delay info
  if (incident.estimatedDelay || context.estimatedDelay) {
    const delay = incident.estimatedDelay || context.estimatedDelay;
    message += `. Extra ${delay} mins journey time`;
  }
  
  // Add alternatives if available and space permits
  if (incident.alternativeRoutes && incident.alternativeRoutes.length > 0 && message.length < 200) {
    message += `. Try routes: ${incident.alternativeRoutes.slice(0, 2).join(', ')}`;
  }
  
  // Add hashtags if space permits
  if (message.length < 250) {
    message += ' #GoBARRY #TravelUpdate';
    
    if (context.severity === 'HIGH' || context.severity === 'CRITICAL') {
      message += ' #ServiceAlert';
    }
  }
  
  return {
    text: message,
    platform: 'SOCIAL_MEDIA',
    characterCount: message.length,
    hashtags: extractHashtags(message),
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate driver notification
 */
function generateDriverNotification(incident, context) {
  const config = MESSAGE_CONFIG.PLATFORMS.DRIVER_NOTIFICATION;
  
  let message = `ROUTE ${incident.route} OPERATIONAL UPDATE: `;
  
  // Add disruption details
  const disruption = formatDisruptionType(incident.type, 'operational');
  message += disruption;
  
  if (incident.location) {
    message += ` at ${incident.location}`;
  }
  
  // Add specific driver instructions
  if (incident.diversion && incident.diversion.diversionVia) {
    message += `. DIVERSION: Follow ${incident.diversion.diversionVia.join(' > ')}`;
    
    if (incident.diversion.missedStops && incident.diversion.missedStops.length > 0) {
      message += `. MISSED STOPS: ${incident.diversion.missedStops.join(', ')}`;
    }
  }
  
  // Add passenger communication guidance
  message += '. INFORM PASSENGERS of delay and apologise for inconvenience';
  
  // Add estimated resolution
  if (context.expectedResolution) {
    message += `. Normal service expected ${context.expectedResolution}`;
  }
  
  return {
    text: message,
    platform: 'DRIVER_NOTIFICATION',
    characterCount: message.length,
    includesDiversionInstructions: !!(incident.diversion && incident.diversion.diversionVia),
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate website banner
 */
function generateWebsiteBanner(incident, context) {
  const config = MESSAGE_CONFIG.PLATFORMS.WEBSITE_BANNER;
  
  let message = `Route ${incident.route}: `;
  
  // Brief status
  if (incident.diversion && incident.diversion.diversionVia) {
    message += 'Diverted';
  } else {
    message += formatDisruptionType(incident.type, 'banner');
  }
  
  // Add delay if significant
  if (incident.estimatedDelay && incident.estimatedDelay > 10) {
    message += ` (+${incident.estimatedDelay}m)`;
  }
  
  // Add update time
  const updateTime = new Date().toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  message += ` - Updated ${updateTime}`;
  
  return {
    text: message,
    platform: 'WEBSITE_BANNER',
    characterCount: message.length,
    urgencyLevel: context.severity,
    lastUpdated: updateTime,
    timestamp: new Date().toISOString()
  };
}

/**
 * Analyze incident context for message generation
 */
async function analyzeIncidentContext(incident) {
  const context = {
    severity: determineSeverity(incident),
    estimatedDuration: incident.estimatedDuration || estimateDuration(incident),
    expectedResolution: formatExpectedResolution(incident),
    timeOfDay: getTimeContext(),
    passengerImpact: null
  };
  
  // Get passenger impact analysis if route is available
  if (incident.route) {
    try {
      context.passengerImpact = await analyzePassengerImpact(
        incident.route, 
        incident.location, 
        context.estimatedDuration
      );
    } catch (error) {
      console.warn('Could not analyze passenger impact:', error.message);
    }
  }
  
  return context;
}

/**
 * Helper functions
 */

function determineSeverity(incident) {
  if (incident.severity) return incident.severity.toUpperCase();
  
  // Auto-determine severity based on incident characteristics
  let score = 0;
  
  if (incident.type === 'accident') score += 3;
  if (incident.type === 'breakdown') score += 2;
  if (incident.type === 'roadworks') score += 1;
  
  if (incident.estimatedDelay > 30) score += 2;
  if (incident.estimatedDelay > 15) score += 1;
  
  if (incident.location && incident.location.includes('city centre')) score += 1;
  
  if (score >= 4) return 'CRITICAL';
  if (score >= 3) return 'HIGH';
  if (score >= 2) return 'MEDIUM';
  return 'LOW';
}

function formatDisruptionType(type, format) {
  const formats = {
    'accident': {
      short: 'accident',
      display: 'Traffic incident',
      detailed: 'a traffic accident',
      social: 'traffic incident',
      operational: 'TRAFFIC ACCIDENT',
      banner: 'Incident'
    },
    'breakdown': {
      short: 'breakdown',
      display: 'Vehicle breakdown',
      detailed: 'a vehicle breakdown',
      social: 'vehicle breakdown',
      operational: 'VEHICLE BREAKDOWN',
      banner: 'Breakdown'
    },
    'roadworks': {
      short: 'roadworks',
      display: 'Road maintenance',
      detailed: 'planned roadworks',
      social: 'roadworks',
      operational: 'PLANNED ROADWORKS',
      banner: 'Roadworks'
    },
    'weather': {
      short: 'weather',
      display: 'Weather conditions',
      detailed: 'adverse weather conditions',
      social: 'weather conditions',
      operational: 'WEATHER CONDITIONS',
      banner: 'Weather'
    },
    'incident': {
      short: 'incident',
      display: 'Service disruption',
      detailed: 'an incident',
      social: 'service disruption',
      operational: 'SERVICE INCIDENT',
      banner: 'Disruption'
    }
  };
  
  return formats[type]?.[format] || formats['incident'][format];
}

function abbreviateLocation(location, maxLength = 25) {
  if (!location) return '';
  
  if (location.length <= maxLength) return location;
  
  // Common abbreviations for North East locations
  const abbreviations = {
    'Newcastle upon Tyne': 'Newcastle',
    'Gateshead': 'Gateshead',
    'Sunderland': 'Sunderland',
    'South Shields': 'S.Shields',
    'North Shields': 'N.Shields',
    'Northbound': 'NB',
    'Southbound': 'SB',
    'Eastbound': 'EB',
    'Westbound': 'WB',
    'Junction': 'Jct',
    'Road': 'Rd',
    'Street': 'St',
    'Avenue': 'Ave'
  };
  
  let abbreviated = location;
  for (const [full, abbrev] of Object.entries(abbreviations)) {
    abbreviated = abbreviated.replace(new RegExp(full, 'gi'), abbrev);
  }
  
  if (abbreviated.length > maxLength) {
    abbreviated = abbreviated.substring(0, maxLength - 3) + '...';
  }
  
  return abbreviated;
}

function formatExpectedResolution(incident) {
  if (incident.expectedResolution) return incident.expectedResolution;
  
  // Auto-generate based on incident type and time
  const currentHour = new Date().getHours();
  
  if (incident.type === 'roadworks') {
    return 'this evening';
  }
  
  if (incident.estimatedDuration) {
    const resolutionTime = new Date(Date.now() + incident.estimatedDuration * 60000);
    return resolutionTime.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }) + 'hrs';
  }
  
  // Default based on time of day
  if (currentHour < 12) return 'this afternoon';
  if (currentHour < 18) return 'this evening';
  return 'later today';
}

function getTimeContext() {
  const hour = new Date().getHours();
  
  if (hour >= 7 && hour <= 9) return 'MORNING_PEAK';
  if (hour >= 16 && hour <= 19) return 'AFTERNOON_PEAK';
  if (hour >= 6 && hour <= 22) return 'DAYTIME';
  return 'EVENING';
}

function determineBannerTemplate(severity) {
  switch (severity) {
    case 'CRITICAL': return 'emergency-alert';
    case 'HIGH': return 'high-priority';
    case 'MEDIUM': return 'standard-alert';
    default: return 'info-notice';
  }
}

function getBannerColor(severity) {
  switch (severity) {
    case 'CRITICAL': return '#DC2626'; // Red
    case 'HIGH': return '#EA580C'; // Orange
    case 'MEDIUM': return '#CA8A04'; // Amber
    default: return '#2563EB'; // Blue
  }
}

function trimMessageIntelligently(message, maxLength) {
  if (message.length <= maxLength) return message;
  
  // Remove least important sections first
  const sections = [
    /\. Thank you for your patience.*$/,
    /\. Please consider alternative travel times.*$/,
    /\. Wheelchair accessible services.*$/,
    /\. Alternative routes:.*$/
  ];
  
  for (const pattern of sections) {
    if (message.length <= maxLength) break;
    message = message.replace(pattern, '');
  }
  
  // If still too long, truncate and add ellipsis
  if (message.length > maxLength) {
    message = message.substring(0, maxLength - 3) + '...';
  }
  
  return message;
}

function extractHashtags(text) {
  return text.match(/#\w+/g) || [];
}

function estimateDuration(incident) {
  // Simple duration estimation based on incident type
  const durations = {
    'breakdown': 30,
    'accident': 45,
    'roadworks': 120,
    'weather': 60,
    'incident': 30
  };
  
  return durations[incident.type] || 30;
}

function validateMessages(messages) {
  const warnings = [];
  const platforms = Object.keys(MESSAGE_CONFIG.PLATFORMS);
  
  platforms.forEach(platform => {
    const platformKey = platform.toLowerCase().replace('_', '') + (platform === 'BLINK_DISPLAY' ? 'PDF' : platform === 'PASSENGER_CLOUD' ? 'Message' : 'Message');
    
    if (platform === 'TICKETER' && messages.ticketerMessage) {
      if (messages.ticketerMessage.characterCount > 160) {
        warnings.push(`Ticketer message exceeds 160 characters: ${messages.ticketerMessage.characterCount}`);
      }
    }
  });
  
  return {
    valid: warnings.length === 0,
    warnings: warnings
  };
}

function generateFallbackMessages(incident) {
  return {
    ticketerMessage: {
      text: `Route ${incident.route} disrupted. Updates to follow.`,
      platform: 'TICKETER'
    },
    passengerCloudMessage: {
      text: `We are currently experiencing disruption on Route ${incident.route}. We apologise for any inconvenience and will provide updates as soon as possible.`,
      platform: 'PASSENGER_CLOUD'
    }
  };
}

function generateIncidentId() {
  return `INC_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
}

/**
 * Generate message for a specific platform only
 */
export async function generateSinglePlatformMessage(incident, platform, options = {}) {
  try {
    const context = await analyzeIncidentContext(incident);
    
    switch (platform.toUpperCase()) {
      case 'TICKETER':
        return { success: true, message: generateTicketerMessage(incident, context) };
      case 'BLINK_DISPLAY':
        return { success: true, message: generateBlinkDisplayMessage(incident, context) };
      case 'PASSENGER_CLOUD':
        return { success: true, message: generatePassengerCloudMessage(incident, context) };
      case 'SOCIAL_MEDIA':
        return { success: true, message: generateSocialMediaMessage(incident, context) };
      case 'DRIVER_NOTIFICATION':
        return { success: true, message: generateDriverNotification(incident, context) };
      case 'WEBSITE_BANNER':
        return { success: true, message: generateWebsiteBanner(incident, context) };
      default:
        return { success: false, error: `Unknown platform: ${platform}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get message generation statistics
 */
export function getMessageGeneratorStats() {
  return {
    supportedPlatforms: Object.keys(MESSAGE_CONFIG.PLATFORMS),
    messageTypes: Object.keys(MESSAGE_CONFIG.PLATFORMS).length,
    severityLevels: Object.keys(MESSAGE_CONFIG.SEVERITY_ADJUSTMENTS),
    maxCharacterLimits: Object.fromEntries(
      Object.entries(MESSAGE_CONFIG.PLATFORMS).map(([platform, config]) => [
        platform, 
        config.maxLength
      ])
    ),
    features: {
      multiPlatform: true,
      intelligentTrimming: true,
      severityAdaptation: true,
      passengerImpactAnalysis: true,
      templateGeneration: true
    }
  };
}

export default {
  generateDisruptionMessages,
  generateSinglePlatformMessage,
  getMessageGeneratorStats
};
