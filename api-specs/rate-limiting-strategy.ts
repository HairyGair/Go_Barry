// Rate Limiting Strategy for Communications Platform
// Project: Go BARRY
// Date: July 2, 2025
// Version: 1.0

export interface RateLimitingStrategy {
  overview: {
    purpose: string;
    scope: string[];
    implementation: 'client-side' | 'server-side' | 'hybrid';
  };

  services: {
    email: EmailRateLimits;
    voip: VoipRateLimits;
    sharepoint: SharePointRateLimits;
    internal: InternalApiRateLimits;
  };

  implementation: {
    algorithm: 'token-bucket' | 'sliding-window' | 'fixed-window';
    storage: 'memory' | 'redis' | 'local-storage';
    monitoring: RateLimitMonitoring;
  };

  fallbackStrategies: {
    limitExceeded: FallbackStrategy;
    serviceDown: FallbackStrategy;
    networkIssues: FallbackStrategy;
  };
}

interface EmailRateLimits {
  service: 'Microsoft Outlook/Exchange';
  limits: {
    recipientLimit: {
      perMessage: 500;
      perDay: 10000;
      enforcement: 'microsoft-enforced';
    };
    sendingLimit: {
      perMinute: 30;
      perHour: 1000;
      perDay: 10000;
      enforcement: 'microsoft-enforced';
    };
    attachmentLimit: {
      sizePerFile: '25MB';
      totalPerMessage: '150MB';
      enforcement: 'microsoft-enforced';
    };
  };
  
  goBarryLimits: {
    templatedMessages: {
      perHour: 100;
      perDay: 500;
      perSupervisor: 50;
      reason: 'Prevent spam/misuse';
    };
    broadcastMessages: {
      perDay: 10;
      cooldownMinutes: 30;
      approvalRequired: true;
      reason: 'Critical communications only';
    };
  };

  implementation: {
    tracking: 'per-supervisor-session';
    storage: 'session-memory';
    reset: 'rolling-window';
    notification: 'warning at 80%, block at 100%';
  };
}

interface VoipRateLimits {
  service: '8x8 VoIP';
  limits: {
    concurrentCalls: {
      perUser: 1;
      perOrganization: 50;
      enforcement: '8x8-enforced';
    };
    callRate: {
      perMinute: 5;
      perHour: 100;
      emergencyExempt: true;
      enforcement: 'hybrid';
    };
    apiCalls: {
      perMinute: 60;
      perHour: 1000;
      enforcement: '8x8-enforced';
    };
  };

  goBarryLimits: {
    quickDial: {
      attemptsPerMinute: 10;
      reason: 'Prevent accidental spam dialing';
    };
    directoryLookup: {
      perMinute: 20;
      cached: true;
      cacheDuration: '5 minutes';
    };
  };

  emergencyOverride: {
    numbers: ['999', '112', '101'];
    bypassAllLimits: true;
    alertOnUse: true;
  };
}

interface SharePointRateLimits {
  service: 'SharePoint Online';
  limits: {
    userThrottle: {
      perMinute: 120;
      perDay: 200000;
      enforcement: 'sharepoint-enforced';
    };
    appThrottle: {
      perMinute: 600;
      perDay: 2000000;
      enforcement: 'sharepoint-enforced';
    };
    uploadLimit: {
      fileSize: '250GB';
      filesPerUpload: 100;
      enforcement: 'sharepoint-enforced';
    };
  };

  goBarryLimits: {
    documentSearch: {
      perMinute: 10;
      resultsPerPage: 50;
      maxPages: 10;
      reason: 'Performance optimization';
    };
    fileOperations: {
      uploadsPerHour: 100;
      downloadsPerHour: 200;
      batchSize: 10;
      reason: 'Network bandwidth management';
    };
  };

  optimization: {
    batchRequests: true;
    deltaSync: true;
    caching: {
      metadata: '15 minutes',
      searchResults: '5 minutes',
      fileList: '10 minutes'
    };
  };
}

interface InternalApiRateLimits {
  service: 'Go BARRY Internal APIs';
  
  endpoints: {
    '/api/alerts': {
      perMinute: 60;
      burst: 10;
      authenticated: false;
    };
    '/api/supervisor/*': {
      perMinute: 30;
      burst: 5;
      authenticated: true;
    };
    '/api/messages/*': {
      perMinute: 20;
      burst: 5;
      authenticated: true;
    };
    '/api/reports/*': {
      perMinute: 10;
      burst: 2;
      authenticated: true;
    };
  };

  globalLimits: {
    perIp: {
      requestsPerMinute: 100;
      requestsPerHour: 2000;
    };
    perUser: {
      requestsPerMinute: 60;
      requestsPerHour: 1000;
    };
  };

  implementation: {
    algorithm: 'sliding-window';
    storage: 'in-memory-lru-cache';
    keyGeneration: 'ip + user-id + endpoint';
    headers: {
      limit: 'X-RateLimit-Limit';
      remaining: 'X-RateLimit-Remaining';
      reset: 'X-RateLimit-Reset';
      retry: 'Retry-After';
    };
  };
}

interface RateLimitMonitoring {
  metrics: {
    track: [
      'requests_total',
      'requests_limited',
      'limit_violations',
      'service_availability'
    ];
    aggregation: '1min, 5min, 1hour';
    retention: '30 days';
  };

  alerts: {
    highViolationRate: {
      threshold: '10% of requests limited';
      window: '5 minutes';
      action: 'notify-ops-team';
    };
    userAbuse: {
      threshold: '50 violations per user';
      window: '1 hour';
      action: 'temporary-block';
    };
    serviceLimit: {
      threshold: '80% of service limit';
      window: '1 minute';
      action: 'scale-back-requests';
    };
  };

  dashboard: {
    realTime: true;
    historical: true;
    perUser: true;
    perEndpoint: true;
    exportable: true;
  };
}

interface FallbackStrategy {
  detection: string;
  response: string;
  userNotification: string;
  recovery: string;
}

// Implementation example
export const rateLimitConfig: RateLimitingStrategy = {
  overview: {
    purpose: 'Prevent service abuse and ensure fair usage across all supervisors',
    scope: ['email', 'voip', 'sharepoint', 'internal-apis'],
    implementation: 'hybrid'
  },

  services: {
    email: {
      service: 'Microsoft Outlook/Exchange',
      limits: {
        recipientLimit: {
          perMessage: 500,
          perDay: 10000,
          enforcement: 'microsoft-enforced'
        },
        sendingLimit: {
          perMinute: 30,
          perHour: 1000,
          perDay: 10000,
          enforcement: 'microsoft-enforced'
        },
        attachmentLimit: {
          sizePerFile: '25MB',
          totalPerMessage: '150MB',
          enforcement: 'microsoft-enforced'
        }
      },
      goBarryLimits: {
        templatedMessages: {
          perHour: 100,
          perDay: 500,
          perSupervisor: 50,
          reason: 'Prevent spam/misuse'
        },
        broadcastMessages: {
          perDay: 10,
          cooldownMinutes: 30,
          approvalRequired: true,
          reason: 'Critical communications only'
        }
      },
      implementation: {
        tracking: 'per-supervisor-session',
        storage: 'session-memory',
        reset: 'rolling-window',
        notification: 'warning at 80%, block at 100%'
      }
    },
    // ... other services
  },

  implementation: {
    algorithm: 'sliding-window',
    storage: 'memory',
    monitoring: {
      metrics: {
        track: [
          'requests_total',
          'requests_limited',
          'limit_violations',
          'service_availability'
        ],
        aggregation: '1min, 5min, 1hour',
        retention: '30 days'
      },
      alerts: {
        highViolationRate: {
          threshold: '10% of requests limited',
          window: '5 minutes',
          action: 'notify-ops-team'
        },
        userAbuse: {
          threshold: '50 violations per user',
          window: '1 hour',
          action: 'temporary-block'
        },
        serviceLimit: {
          threshold: '80% of service limit',
          window: '1 minute',
          action: 'scale-back-requests'
        }
      },
      dashboard: {
        realTime: true,
        historical: true,
        perUser: true,
        perEndpoint: true,
        exportable: true
      }
    }
  },

  fallbackStrategies: {
    limitExceeded: {
      detection: 'HTTP 429 or limit header',
      response: 'Queue request or show manual option',
      userNotification: 'Rate limit reached. Please wait {time} before retry.',
      recovery: 'Exponential backoff with jitter'
    },
    serviceDown: {
      detection: 'HTTP 5xx or timeout',
      response: 'Switch to alternative service',
      userNotification: 'Service temporarily unavailable. Using alternative method.',
      recovery: 'Health check every 30 seconds'
    },
    networkIssues: {
      detection: 'Network error or timeout',
      response: 'Retry with backoff',
      userNotification: 'Connection issues. Retrying...',
      recovery: 'Automatic retry up to 3 times'
    }
  }
};

// Utility functions
export const rateLimitUtils = {
  isLimitExceeded: (current: number, limit: number): boolean => {
    return current >= limit;
  },

  getResetTime: (windowMinutes: number): Date => {
    return new Date(Date.now() + windowMinutes * 60 * 1000);
  },

  calculateBackoff: (attempt: number, baseDelay: number = 1000): number => {
    return Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 1000, 30000);
  },

  formatLimitMessage: (remaining: number, resetTime: Date): string => {
    const minutes = Math.ceil((resetTime.getTime() - Date.now()) / 60000);
    return `${remaining} requests remaining. Resets in ${minutes} minutes.`;
  }
};