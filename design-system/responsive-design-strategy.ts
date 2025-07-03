// Responsive Design Strategy for Communications Platform
// Based on Go BARRY Admin Dashboard patterns
// Version: 1.0
// Date: July 2, 2025

export interface ResponsiveDesignStrategy {
  breakpoints: BreakpointConfig;
  layoutAdaptations: LayoutAdaptations;
  componentBehavior: ComponentResponsiveness;
  performanceOptimizations: PerformanceStrategy;
  testing: TestingStrategy;
}

// === BREAKPOINT CONFIGURATION ===
interface BreakpointConfig {
  mobile: {
    min: 0;
    max: 767;
    label: 'Mobile devices';
    targetDevices: ['iPhone', 'Android phones'];
  };
  tablet: {
    min: 768;
    max: 1023;
    label: 'Tablets';
    targetDevices: ['iPad', 'Android tablets'];
  };
  desktop: {
    min: 1024;
    max: 1439;
    label: 'Desktop';
    targetDevices: ['Laptops', 'Small monitors'];
  };
  wide: {
    min: 1440;
    max: null;
    label: 'Wide screens';
    targetDevices: ['Large monitors', 'Control room displays'];
  };
}

// === LAYOUT ADAPTATIONS ===
interface LayoutAdaptations {
  // Navigation changes per breakpoint
  navigation: {
    mobile: {
      type: 'bottom-tabs' | 'hamburger-menu';
      position: 'bottom';
      visibility: 'icon-only';
      behavior: 'auto-hide on scroll';
    };
    tablet: {
      type: 'sidebar-collapsible';
      position: 'left';
      visibility: 'icon-and-label';
      defaultState: 'collapsed';
    };
    desktop: {
      type: 'sidebar-fixed';
      position: 'left';
      visibility: 'full';
      width: '240px';
    };
  };

  // Grid system adaptations
  gridLayouts: {
    mobile: {
      columns: 1;
      gap: '12px';
      padding: '16px';
    };
    tablet: {
      columns: 2;
      gap: '16px';
      padding: '20px';
    };
    desktop: {
      columns: 3;
      gap: '20px';
      padding: '24px';
    };
    wide: {
      columns: 4;
      gap: '24px';
      padding: '32px';
      maxWidth: '1440px';
    };
  };

  // Content prioritization
  contentPriority: {
    mobile: {
      show: ['essential-actions', 'active-alerts', 'quick-access'];
      hide: ['decorative-elements', 'extended-stats', 'preview-panes'];
      collapse: ['detailed-tables', 'secondary-info'];
    };
    tablet: {
      show: ['all-primary', 'most-secondary'];
      hide: ['some-decorative'];
      collapse: ['extended-details'];
    };
    desktop: {
      show: 'all';
      hide: 'none';
      collapse: 'none';
    };
  };
}

// === COMPONENT-SPECIFIC RESPONSIVE BEHAVIOR ===
interface ComponentResponsiveness {
  // Communications Hub Dashboard
  dashboard: {
    mobile: {
      layout: 'vertical-stack';
      cardDisplay: 'full-width';
      componentsPerRow: 1;
      iconSize: 32;
      showDescriptions: false;
    };
    tablet: {
      layout: 'grid-2x3';
      cardDisplay: 'half-width';
      componentsPerRow: 2;
      iconSize: 40;
      showDescriptions: true;
    };
    desktop: {
      layout: 'grid-3x2';
      cardDisplay: 'third-width';
      componentsPerRow: 3;
      iconSize: 48;
      showDescriptions: true;
    };
  };

  // Ticketer Component
  ticketer: {
    mobile: {
      routeSelection: 'dropdown';
      messageInput: 'full-screen-modal';
      characterLimit: 140;
      showRecentMessages: 3;
    };
    tablet: {
      routeSelection: 'chip-grid';
      messageInput: 'inline-expanded';
      characterLimit: 280;
      showRecentMessages: 5;
    };
    desktop: {
      routeSelection: 'checkbox-grid';
      messageInput: 'inline-textarea';
      characterLimit: 280;
      showRecentMessages: 10;
    };
  };

  // Email Integration
  emailIntegration: {
    mobile: {
      display: 'new-tab'; // Opens Outlook in new tab
      quickActions: 'bottom-sheet';
      templateAccess: 'dropdown';
    };
    tablet: {
      display: 'modal-overlay';
      quickActions: 'toolbar';
      templateAccess: 'sidebar';
    };
    desktop: {
      display: 'embedded-iframe';
      quickActions: 'toolbar';
      templateAccess: 'sidebar';
      defaultHeight: '600px';
    };
  };

  // 8x8 VoIP
  voipIntegration: {
    mobile: {
      display: 'new-window'; // Opens 8x8 in new window
      quickDial: 'floating-button';
      contactList: 'searchable-list';
    };
    tablet: {
      display: 'modal-overlay';
      quickDial: 'speed-dial-grid';
      contactList: 'categorized-list';
    };
    desktop: {
      display: 'split-view';
      quickDial: 'sidebar';
      contactList: 'searchable-tree';
      dialerPosition: 'right-panel';
    };
  };

  // SharePoint
  sharepoint: {
    mobile: {
      display: 'list-view';
      navigation: 'breadcrumb';
      filePreview: 'new-tab';
      uploadMethod: 'camera-roll';
    };
    tablet: {
      display: 'grid-view';
      navigation: 'tree-collapsed';
      filePreview: 'modal';
      uploadMethod: 'drag-drop';
    };
    desktop: {
      display: 'explorer-view';
      navigation: 'tree-expanded';
      filePreview: 'inline-panel';
      uploadMethod: 'drag-drop-zone';
    };
  };

  // Message Distribution
  messageDistribution: {
    mobile: {
      channelSelection: 'toggle-list';
      messageCompose: 'full-screen';
      historyView: 'compact-list';
      recipientSelection: 'modal';
    };
    tablet: {
      channelSelection: 'chip-selector';
      messageCompose: 'expandable-card';
      historyView: 'table-simple';
      recipientSelection: 'inline-multi';
    };
    desktop: {
      channelSelection: 'checkbox-cards';
      messageCompose: 'inline-form';
      historyView: 'table-detailed';
      recipientSelection: 'tree-selector';
    };
  };

  // Automated Reports
  automatedReports: {
    mobile: {
      scheduleView: 'list';
      reportPreview: 'download-only';
      actions: 'menu-dropdown';
      statsDisplay: 'summary-only';
    };
    tablet: {
      scheduleView: 'cards';
      reportPreview: 'modal-viewer';
      actions: 'inline-buttons';
      statsDisplay: 'key-metrics';
    };
    desktop: {
      scheduleView: 'table';
      reportPreview: 'inline-iframe';
      actions: 'toolbar';
      statsDisplay: 'full-dashboard';
    };
  };
}

// === PERFORMANCE OPTIMIZATIONS ===
interface PerformanceStrategy {
  // Lazy loading strategy
  lazyLoading: {
    mobile: {
      images: 'on-viewport-enter';
      iframes: 'on-user-request';
      heavyComponents: 'on-demand';
      preloadNext: false;
    };
    tablet: {
      images: 'on-viewport-approach';
      iframes: 'on-tab-focus';
      heavyComponents: 'on-route-enter';
      preloadNext: true;
    };
    desktop: {
      images: 'immediate';
      iframes: 'on-component-mount';
      heavyComponents: 'background-load';
      preloadNext: true;
    };
  };

  // Bundle optimization
  bundleStrategy: {
    mobile: {
      splitStrategy: 'aggressive';
      maxBundleSize: '200KB';
      criticalCSS: 'inline';
      fonts: 'system-only';
    };
    tablet: {
      splitStrategy: 'moderate';
      maxBundleSize: '400KB';
      criticalCSS: 'inline';
      fonts: 'subset-loaded';
    };
    desktop: {
      splitStrategy: 'balanced';
      maxBundleSize: '600KB';
      criticalCSS: 'external';
      fonts: 'full-loaded';
    };
  };

  // Network optimization
  networkStrategy: {
    mobile: {
      apiCalls: 'minimal-polling';
      caching: 'aggressive';
      imageQuality: 'compressed';
      offlineSupport: 'essential-only';
    };
    tablet: {
      apiCalls: 'smart-polling';
      caching: 'balanced';
      imageQuality: 'adaptive';
      offlineSupport: 'partial';
    };
    desktop: {
      apiCalls: 'real-time';
      caching: 'selective';
      imageQuality: 'full';
      offlineSupport: 'comprehensive';
    };
  };
}

// === TESTING STRATEGY ===
interface TestingStrategy {
  devices: {
    mobile: ['iPhone 12', 'iPhone SE', 'Samsung S21', 'Pixel 5'];
    tablet: ['iPad Air', 'iPad Mini', 'Samsung Tab S7'];
    desktop: ['1366x768', '1920x1080', '2560x1440'];
  };

  browsers: {
    mobile: ['Safari iOS', 'Chrome Android', 'Samsung Internet'];
    tablet: ['Safari iPadOS', 'Chrome', 'Firefox'];
    desktop: ['Chrome', 'Firefox', 'Safari', 'Edge'];
  };

  testScenarios: [
    'Component visibility at each breakpoint',
    'Touch targets minimum 44x44px on mobile',
    'Readable text without horizontal scroll',
    'Functional with 3G network speeds',
    'Gesture support on touch devices',
    'Keyboard navigation on desktop'
  ];

  automatedTests: {
    visual: 'Percy or Chromatic snapshots';
    functional: 'Cypress with viewport commands';
    performance: 'Lighthouse CI per breakpoint';
  };
}

// === IMPLEMENTATION EXAMPLES ===

// React Native responsive utilities
export const ResponsiveUtils = {
  // Get current breakpoint
  getBreakpoint: (width: number): string => {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    if (width < 1440) return 'desktop';
    return 'wide';
  },

  // Responsive value helper
  responsiveValue: <T,>(values: {
    mobile?: T;
    tablet?: T;
    desktop?: T;
    wide?: T;
    default: T;
  }, breakpoint: string): T => {
    return values[breakpoint] || values.default;
  },

  // Conditional rendering helper
  showOnBreakpoint: (
    current: string,
    showOn: string[]
  ): boolean => {
    return showOn.includes(current);
  },
};

// Media query helpers for web
export const MediaQueries = {
  mobile: '@media (max-width: 767px)',
  tablet: '@media (min-width: 768px) and (max-width: 1023px)',
  desktop: '@media (min-width: 1024px) and (max-width: 1439px)',
  wide: '@media (min-width: 1440px)',
  notMobile: '@media (min-width: 768px)',
  touch: '@media (hover: none) and (pointer: coarse)',
  mouse: '@media (hover: hover) and (pointer: fine)',
};

// Container query support (future)
export const ContainerQueries = {
  card: {
    compact: '@container (max-width: 300px)',
    normal: '@container (min-width: 301px) and (max-width: 500px)',
    expanded: '@container (min-width: 501px)',
  },
};

export default {
  breakpoints: {
    mobile: { min: 0, max: 767 },
    tablet: { min: 768, max: 1023 },
    desktop: { min: 1024, max: 1439 },
    wide: { min: 1440, max: null },
  },
  utils: ResponsiveUtils,
  queries: MediaQueries,
};