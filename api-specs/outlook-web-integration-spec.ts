// Microsoft Outlook Web Access Integration Specification
// Project: Go BARRY Communications Platform
// Date: July 2, 2025
// Version: 1.0

export interface OutlookWebAccessSpec {
  authentication: {
    method: 'existing-browser-session' | 'oauth2-popup' | 'embedded-login';
    endpoints: {
      webmail: 'https://outlook.office.com/mail/';
      calendar: 'https://outlook.office.com/calendar/';
      people: 'https://outlook.office.com/people/';
    };
    singleSignOn: {
      enabled: boolean;
      provider: 'Azure AD' | 'ADFS' | 'Other';
      domain: '@gonortheast.co.uk';
    };
    sessionManagement: {
      shareWithBrowser: true;
      persistAcrossTabs: true;
      timeoutHandling: 'prompt-reauthentication';
    };
  };

  integration: {
    embedOptions: {
      method: 'iframe' | 'webview' | 'new-window';
      constraints: {
        maxWidth: '100%';
        minHeight: '600px';
        responsive: true;
      };
      urlModifiers: {
        simplified: '?simplified=true';
        hideNavigation: '&navpane=off';
        composeOnly: '&compose=true';
        readOnly: '&readonly=true';
      };
    };

    features: {
      compose: {
        quickCompose: true;
        templates: true;
        attachments: true;
        scheduling: true;
        signatures: true;
      };
      inbox: {
        display: 'simplified' | 'full';
        filtering: true;
        searching: true;
        sorting: true;
      };
      folders: {
        access: ['Inbox', 'Sent', 'Drafts', 'Templates'];
        customFolders: true;
        sharedMailboxes: true;
      };
      distributionLists: {
        access: true;
        create: false; // Managed by IT
        use: true;
        lists: {
          'All Supervisors': 'supervisors@gonortheast.co.uk',
          'Control Room': 'control@gonortheast.co.uk',
          'Management': 'management@gonortheast.co.uk',
          'Operations': 'operations@gonortheast.co.uk',
          'All Depots': 'depots@gonortheast.co.uk'
        };
      };
    };

    quickActions: {
      enabled: true;
      actions: [
        {
          id: 'incident-report',
          label: 'Send Incident Report',
          to: ['control@gonortheast.co.uk'],
          template: 'incident-template',
          priority: 'high'
        },
        {
          id: 'disruption-notice',
          label: 'Send Disruption Notice',
          to: ['supervisors@gonortheast.co.uk', 'control@gonortheast.co.uk'],
          template: 'disruption-template',
          priority: 'urgent'
        },
        {
          id: 'end-of-shift',
          label: 'End of Shift Report',
          to: ['management@gonortheast.co.uk'],
          template: 'shift-report-template',
          priority: 'normal'
        }
      ];
    };
  };

  templates: {
    storage: 'outlook-folders' | 'local-database';
    syncStrategy: 'on-demand' | 'cached';
    predefinedTemplates: [
      {
        id: 'incident-template',
        name: 'Incident Report',
        subject: 'INCIDENT: {route} - {location} - {time}',
        body: `
          INCIDENT REPORT
          
          Date/Time: {datetime}
          Location: {location}
          Route(s) Affected: {routes}
          Supervisor: {supervisor}
          
          Description:
          {description}
          
          Actions Taken:
          {actions}
          
          Expected Duration: {duration}
          
          Additional Notes:
          {notes}
        `,
        variables: ['datetime', 'location', 'routes', 'supervisor', 'description', 'actions', 'duration', 'notes']
      },
      {
        id: 'disruption-template',
        name: 'Service Disruption',
        subject: 'SERVICE DISRUPTION: {routes} - {reason}',
        body: `
          SERVICE DISRUPTION NOTICE
          
          Affected Routes: {routes}
          Reason: {reason}
          Location: {location}
          Start Time: {startTime}
          Expected End Time: {endTime}
          
          Diversion Details:
          {diversion}
          
          Customer Information:
          {customerInfo}
          
          Contact: {contactNumber}
        `,
        variables: ['routes', 'reason', 'location', 'startTime', 'endTime', 'diversion', 'customerInfo', 'contactNumber']
      }
    ];
  };

  implementation: {
    reactComponent: {
      name: 'OutlookWebClient';
      props: {
        mode: 'compose' | 'inbox' | 'full';
        height?: string | number;
        onEmailSent?: (messageId: string) => void;
        onError?: (error: Error) => void;
        defaultRecipients?: string[];
        defaultSubject?: string;
        defaultBody?: string;
        template?: string;
        attachments?: File[];
      };
    };

    iframeImplementation: {
      sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox';
      features: 'camera=no; microphone=no; geolocation=no';
      csp: {
        frameSrc: ['https://outlook.office.com', 'https://outlook.office365.com'];
        connectSrc: ['https://*.office.com', 'https://*.office365.com'];
      };
    };

    fallbackOptions: {
      iframeBlocked: {
        action: 'open-new-tab';
        message: 'Opening Outlook in a new tab...';
        preserveContext: true;
      };
      authenticationFailed: {
        action: 'redirect-to-login';
        returnUrl: true;
        message: 'Please log in to access email features';
      };
    };
  };

  dataHandling: {
    localStorage: {
      templates: true;
      drafts: false; // Stored in Outlook
      preferences: true;
      recentRecipients: true;
    };
    
    activityTracking: {
      logSentEmails: true;
      trackTemplateUsage: true;
      recordRecipients: true;
      auditTrail: true;
    };

    privacy: {
      emailContent: 'never-stored-locally';
      attachments: 'temporary-only';
      recipientData: 'anonymized';
    };
  };

  performance: {
    lazyLoading: true;
    preloadTemplates: true;
    cacheStrategy: {
      templates: '7-days';
      distributionLists: '24-hours';
      userPreferences: 'permanent';
    };
    optimizations: {
      minimizeIframeReloads: true;
      queueOfflineActions: false;
      compressAttachments: false; // Handled by Outlook
    };
  };

  userExperience: {
    loadingStates: {
      initial: 'show-skeleton';
      authentication: 'show-progress';
      compose: 'show-immediately';
    };
    
    responsiveBreakpoints: {
      mobile: {
        maxWidth: '768px';
        layout: 'stacked';
        simplifiedUI: true;
      };
      tablet: {
        minWidth: '769px';
        maxWidth: '1024px';
        layout: 'sidebar';
      };
      desktop: {
        minWidth: '1025px';
        layout: 'full';
      };
    };

    accessibility: {
      keyboardNavigation: true;
      screenReaderSupport: true;
      highContrastMode: 'inherit-from-outlook';
      focusManagement: true;
    };
  };

  costAnalysis: {
    additionalLicenses: 0; // Using existing Office 365
    developmentEffort: '2 days';
    maintenanceEffort: 'minimal';
    dependencies: ['Existing Office 365 subscription'];
  };
}

// Template variable definitions
export interface TemplateVariable {
  name: string;
  type: 'text' | 'datetime' | 'route' | 'location' | 'supervisor' | 'duration';
  required: boolean;
  defaultValue?: string;
  validation?: RegExp;
  placeholder?: string;
}

// Activity tracking interface
export interface EmailActivity {
  id: string;
  timestamp: Date;
  action: 'sent' | 'drafted' | 'template-used';
  subject: string;
  recipients: string[];
  template?: string;
  supervisor: string;
  success: boolean;
  error?: string;
}