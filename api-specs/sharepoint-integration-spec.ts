// SharePoint Integration Specification
// Project: Go BARRY Communications Platform
// Date: July 2, 2025
// Version: 1.0

export interface SharePointIntegrationSpec {
  authentication: {
    method: 'shared-session' | 'oauth2' | 'app-only';
    siteUrl: 'https://gonortheast.sharepoint.com';
    tenantId: string;
    permissions: {
      sites: ['Sites.Read.All', 'Sites.ReadWrite.All'];
      files: ['Files.Read.All', 'Files.ReadWrite.All'];
      lists: ['Sites.Manage.All'];
    };
    tokenHandling: {
      storage: 'session-only';
      refresh: 'automatic';
      expiry: 3600; // seconds
    };
  };

  targetSites: {
    operations: {
      url: '/sites/operations';
      libraries: ['Documents', 'Procedures', 'Forms', 'Reports'];
      lists: ['Incidents', 'Contacts', 'Resources'];
      permissions: 'read-write';
    };
    communications: {
      url: '/sites/communications';
      libraries: ['Templates', 'Media', 'Announcements'];
      lists: ['Distribution Lists', 'Message Archive'];
      permissions: 'read-write';
    };
    supervisors: {
      url: '/sites/supervisors';
      libraries: ['Handover Notes', 'Shift Reports', 'Training'];
      lists: ['Roster', 'Tasks', 'Alerts'];
      permissions: 'read-write';
    };
  };

  features: {
    documentLibrary: {
      enabled: true;
      operations: {
        browse: true;
        search: true;
        upload: true;
        download: true;
        share: true;
        version: true;
      };
      fileTypes: {
        allowed: ['.pdf', '.docx', '.xlsx', '.pptx', '.png', '.jpg', '.msg'];
        maxSize: '100MB';
        scanning: true;
      };
      metadata: {
        required: ['Title', 'Category', 'Date'];
        optional: ['Route', 'Location', 'Supervisor', 'Incident'];
        searchable: true;
      };
    };

    lists: {
      enabled: true;
      operations: {
        read: true;
        create: true;
        update: true;
        delete: false; // Admin only
      };
      customViews: {
        'My Items': 'Created By = [Me]',
        'Today': 'Created >= [Today]',
        'This Week': 'Created >= [Today]-7',
        'Urgent': 'Priority = High'
      };
    };

    quickAccess: {
      enabled: true;
      items: [
        {
          name: 'Daily Handover Template',
          type: 'document',
          path: '/sites/supervisors/Documents/Templates/Daily_Handover.docx',
          icon: 'document'
        },
        {
          name: 'Incident Report Form',
          type: 'form',
          path: '/sites/operations/Forms/Incident_Report.aspx',
          icon: 'form'
        },
        {
          name: 'Contact Directory',
          type: 'list',
          path: '/sites/operations/Lists/Contacts',
          icon: 'people'
        },
        {
          name: 'Shift Reports',
          type: 'library',
          path: '/sites/supervisors/Shift Reports',
          icon: 'folder'
        }
      ];
    };

    search: {
      enabled: true;
      scope: ['current-site', 'all-sites'];
      filters: ['file-type', 'modified-date', 'author', 'tags'];
      suggestions: true;
      recent: true;
    };
  };

  integration: {
    embedMethod: {
      documentViewer: 'iframe';
      listDisplay: 'api-rendered';
      formSubmission: 'api-direct';
    };

    reactComponents: {
      documentBrowser: {
        name: 'SharePointDocumentBrowser';
        props: {
          siteUrl: string;
          libraryName: string;
          folderPath?: string;
          view?: 'grid' | 'list' | 'compact';
          onFileSelect?: (file: SPFile) => void;
          onError?: (error: Error) => void;
          allowUpload?: boolean;
          allowDelete?: boolean;
        };
      };
      
      quickUploader: {
        name: 'SharePointQuickUpload';
        props: {
          targetLibrary: string;
          metadata?: Record<string, any>;
          onUploadComplete?: (file: SPFile) => void;
          onProgress?: (percent: number) => void;
          allowMultiple?: boolean;
        };
      };

      listViewer: {
        name: 'SharePointListViewer';
        props: {
          siteUrl: string;
          listName: string;
          viewName?: string;
          pageSize?: number;
          onItemClick?: (item: SPListItem) => void;
          allowEdit?: boolean;
        };
      };
    };

    apiEndpoints: {
      graph: {
        base: 'https://graph.microsoft.com/v1.0';
        sites: '/sites/{site-id}';
        drives: '/sites/{site-id}/drives';
        lists: '/sites/{site-id}/lists';
        search: '/search/query';
      };
      rest: {
        base: '{site-url}/_api';
        web: '/web';
        lists: '/web/lists';
        files: '/web/getfilebyserverrelativeurl';
      };
    };
  };

  workflows: {
    reportArchiving: {
      trigger: 'email-sent' | 'manual';
      actions: [
        'generate-pdf',
        'apply-metadata',
        'upload-to-library',
        'notify-subscribers'
      ];
      targetLibrary: '/sites/communications/Reports';
      naming: '{type}_{date}_{time}_{supervisor}.pdf';
    };

    incidentDocumentation: {
      trigger: 'incident-created';
      actions: [
        'create-folder',
        'copy-template',
        'update-metadata',
        'set-permissions'
      ];
      structure: {
        folder: '{date}/{incident-id}',
        files: ['incident-report', 'photos', 'correspondence', 'resolution']
      };
    };

    shiftHandover: {
      trigger: 'shift-end';
      actions: [
        'prompt-for-notes',
        'save-to-library',
        'notify-next-shift',
        'archive-previous'
      ];
      retention: '30 days';
    };
  };

  offlineSupport: {
    enabled: false; // SharePoint requires connection
    fallback: {
      queueActions: true;
      storeDrafts: 'local-storage';
      syncOnReconnect: true;
    };
  };

  performance: {
    caching: {
      metadata: '1 hour';
      fileList: '15 minutes';
      thumbnails: '24 hours';
      searchResults: '5 minutes';
    };
    
    lazyLoading: {
      documents: true;
      thumbnails: true;
      metadata: false;
    };

    pagination: {
      defaultPageSize: 30;
      maxPageSize: 100;
      scrolling: 'infinite' | 'paginated';
    };
  };

  security: {
    itemLevelPermissions: true;
    encryption: {
      inTransit: 'TLS 1.2+';
      atRest: 'AES-256';
      keys: 'managed-by-microsoft';
    };
    
    auditTrail: {
      enabled: true;
      events: ['view', 'download', 'upload', 'modify', 'delete', 'share'];
      retention: '7 years';
    };

    compliance: {
      gdpr: true;
      dataLocation: 'UK';
      backups: 'automatic';
      recovery: '14 days';
    };
  };

  userExperience: {
    branding: {
      maintainGoBarryTheme: true;
      customColors: {
        primary: '#3B82F6',
        secondary: '#10B981'
      };
      logo: '/assets/go-barry-logo.png';
    };

    navigation: {
      breadcrumbs: true;
      quickNav: true;
      recentItems: true;
      favorites: true;
    };

    responsiveDesign: {
      breakpoints: {
        mobile: '0-768px',
        tablet: '769px-1024px',
        desktop: '1025px+'
      };
      touchOptimized: true;
    };
  };

  costAnalysis: {
    licensing: 'Included in Office 365 E3/E5';
    storage: '1TB included per user';
    additionalCosts: 0;
    developmentEffort: '3 days';
    maintenanceEffort: 'minimal';
  };
}

// SharePoint file interface
export interface SPFile {
  id: string;
  name: string;
  size: number;
  modified: Date;
  modifiedBy: string;
  url: string;
  downloadUrl: string;
  mimeType: string;
  metadata: Record<string, any>;
}

// SharePoint list item interface
export interface SPListItem {
  id: number;
  title: string;
  created: Date;
  modified: Date;
  author: string;
  fields: Record<string, any>;
}

// Quick access to common SharePoint locations
export const sharePointQuickLinks = {
  operations: {
    procedures: '/sites/operations/Documents/Procedures',
    incidents: '/sites/operations/Lists/Incidents',
    contacts: '/sites/operations/Lists/Contacts'
  },
  communications: {
    templates: '/sites/communications/Templates',
    reports: '/sites/communications/Reports',
    archive: '/sites/communications/Message Archive'
  },
  supervisors: {
    handovers: '/sites/supervisors/Handover Notes',
    rosters: '/sites/supervisors/Lists/Roster',
    training: '/sites/supervisors/Training'
  }
};