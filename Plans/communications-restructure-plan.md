# Communications Platform Restructure - Enterprise Development Plan

**Project Code**: GOB-COMM-2025-001  
**Project**: Go BARRY Traffic Intelligence Platform  
**Initiative**: Communications Module Restructure & Enhancement  
**Date**: July 2, 2025  
**Version**: 1.0  
**Classification**: Internal Development  
**Estimated Duration**: 8-12 weeks  
**Team Size**: 1-2 developers  
**Priority**: P1 (High)

---

## 📋 Executive Summary

### Project Objective
Transform the existing "Supervisor Screen" into a streamlined "Communications Platform" that consolidates essential communication tools for Go North East bus supervisors into a unified, efficient interface.

**Final Platform Components**:
1. **Ticketer** - Primary driver messaging system
2. **Email Integration** - Outlook Web Access for broader communications
3. **8x8 VoIP** - Phone system using existing web login
4. **SharePoint** - Document collaboration and sharing
5. **Message Distribution** - Unified message tracking across channels
6. **Automated Reports** - Enhanced reporting and distribution

### Business Justification
- **Current Pain Point**: Fragmented communication tools across multiple interfaces
- **Solution**: Centralized communications hub with modern UI/UX
- **Expected ROI**: 40% reduction in communication workflow time
- **User Impact**: 9 active supervisors + control room staff
- **Strategic Alignment**: Part of Go BARRY digital transformation initiative

### High-Level Scope (UPDATED)
- **Remove**: 5 components (Admin Panel, Supervisor Control, Control Dashboard, Statistics Dashboard, Operations Centre)
- **Relocate**: 3 components to Disruptions screen (Incident Manager, Roadworks Manager, AI Disruption Manager)
- **Create**: 3 new integrations (Email/Outlook, 8x8 VoIP, SharePoint)
- **Enhance**: 2 existing components (Message Distribution, Automated Reports)
- **Retain**: 1 component as-is (Ticketer)
- **Migrate**: 1 component to Admin Dashboard (System Health)

---

## 📊 Current State Analysis

### Existing Architecture Assessment

#### Current Supervisor Screen Components (browser-main.jsx)
```typescript
interface SupervisorScreenComponent {
  id: string;
  shortcut: string;
  component: React.Component;
  status: 'active' | 'deprecated' | 'incomplete';
  usage: 'high' | 'medium' | 'low' | 'none';
  dependencies: string[];
}

const currentComponents: SupervisorScreenComponent[] = [
  { id: 'admin-panel', shortcut: 'Ctrl+1', status: 'deprecated', usage: 'none' },
  { id: 'supervisor-control', shortcut: 'Ctrl+2', status: 'active', usage: 'medium' },
  { id: 'control-dashboard', shortcut: 'Ctrl+3', status: 'active', usage: 'low' },
  { id: 'statistics-dashboard', shortcut: 'Ctrl+4', status: 'deprecated', usage: 'none' },
  { id: 'operations-centre', shortcut: 'Ctrl+5', status: 'active', usage: 'medium' },
  { id: 'ai-disruption-manager', shortcut: 'Ctrl+6', status: 'incomplete', usage: 'none' },
  { id: 'message-distribution', shortcut: 'Ctrl+7', status: 'active', usage: 'high' },
  { id: 'automated-reports', shortcut: 'Ctrl+8', status: 'active', usage: 'high' },
  { id: 'system-health', shortcut: 'Ctrl+9', status: 'active', usage: 'medium' },
  { id: 'training-help', shortcut: 'Ctrl+10', status: 'deprecated', usage: 'none' }
];
```

#### Technical Debt Assessment
- **Memory Usage**: Current implementation uses ~1.2GB (60% of limit)
- **Load Time**: Average 3.2s initial load
- **Component Coupling**: High interdependency (technical debt)
- **Code Duplication**: ~30% across communication components
- **Performance Issues**: Rendering lag with >5 concurrent components

#### User Experience Analysis
- **Navigation Efficiency**: 6.4s average task completion
- **User Satisfaction**: 3.2/5 (based on informal feedback)
- **Error Rate**: 12% mis-navigation incidents
- **Training Time**: 45 minutes average onboarding

---

## 🎯 Target Architecture Definition

### New "Communications Platform" Structure

#### Component Classification Matrix (UPDATED July 2, 2025)
```
┌─────────────────────┬──────────┬───────────┬─────────────┐
│ Component           │ Action   │ Priority  │ Complexity  │
├─────────────────────┼──────────┼───────────┼─────────────┤
│ Ticketer            │ RETAIN   │ P1        │ Low         │
│ Email Integration   │ CREATE   │ P1        │ Low         │
│ 8x8 VoIP           │ CREATE   │ P1        │ Low         │
│ SharePoint          │ CREATE   │ P2        │ Medium      │
│ Message Distribution│ ENHANCE  │ P1        │ Medium      │
│ Automated Reports   │ ENHANCE  │ P1        │ Medium      │
│ Admin Panel         │ REMOVE   │ N/A       │ N/A         │
│ Supervisor Control  │ REMOVE   │ N/A       │ N/A         │
│ Control Dashboard   │ REMOVE   │ N/A       │ N/A         │
│ Statistics Dashboard│ REMOVE   │ N/A       │ N/A         │
│ Operations Centre   │ REMOVE   │ N/A       │ N/A         │
│ System Health       │ MIGRATE  │ P2        │ Medium      │
│ Training & Help     │ REMOVE   │ N/A       │ N/A         │
│ Incident Manager    │ RELOCATE │ N/A       │ To Disruptions│
│ Roadworks Manager   │ RELOCATE │ N/A       │ To Disruptions│
│ AI Disruption Mgr   │ RELOCATE │ N/A       │ To Disruptions│
└─────────────────────┴──────────┴───────────┴─────────────┘
```

**Note**: 
- Email Integration simplified to use Outlook Web Access
- 8x8 VoIP will use existing work system with web login fallback
- SharePoint added as new integration requirement
- Operations Centre, Incident Manager, Roadworks Manager, and AI Disruption Manager moved to separate Disruptions screen

#### New Component Specifications

##### 1. Ticketer (Simplified)
```typescript
interface TicketerComponent {
  name: 'Ticketer';
  type: 'simplified-messaging';
  features: {
    quickMessage: boolean; // true
    templateLibrary: boolean; // false (removed)
    attachments: boolean; // false (removed)
    scheduling: boolean; // false (removed)
  };
  ui: {
    layout: 'single-button-primary';
    dimensions: '320x240px';
    colorScheme: 'blue-primary';
  };
  performance: {
    loadTime: '<0.5s';
    memoryUsage: '<50MB';
  };
}
```

##### 2. Email Integration (Outlook Web Access)
```typescript
interface EmailIntegrationComponent {
  name: 'Email Integration';
  type: 'outlook-web-embed';
  features: {
    quickCompose: boolean; // true
    templateLibrary: boolean; // true
    distributionLists: boolean; // true
    outlookWebAccess: boolean; // true
    attachmentSupport: boolean; // true
    auditLogging: boolean; // true
  };
  integrations: {
    outlookWeb: {
      method: 'iframe-embed' | 'popup-window';
      ssoEnabled: boolean; // true if possible
      fallbackAuth: 'manual-login';
    };
    internal: {
      supervisorAuth: 'convex-session';
      activityTracking: boolean; // true
      templateStorage: 'supabase';
    };
  };
  ui: {
    layout: 'embedded-outlook';
    dimensions: 'responsive';
    colorScheme: 'green-secondary';
  };
  performance: {
    loadTime: '<1s'; // simplified
    memoryUsage: '<100MB';
  };
}
```

##### 3. 8x8 VoIP Integration (Web Login)
```typescript
interface EightByEightComponent {
  name: '8x8 VoIP Integration';
  type: 'voip-web-client';
  features: {
    webLogin: boolean; // true - primary method
    quickDial: boolean; // true
    callHistory: boolean; // true
    contactDirectory: boolean; // true
    emergencyNumbers: boolean; // true
  };
  integrations: {
    eightByEight: {
      method: 'web-embed' | 'popup-window';
      loginUrl: 'https://8x8.com/web-login';
      ssoSupport: 'check-with-IT';
      fallback: 'manual-credentials';
    };
    internal: {
      supervisorAuth: 'convex-session';
      callLogging: 'basic-tracking';
      emergencyProtocol: boolean; // true
    };
  };
  ui: {
    layout: 'embedded-dialer';
    dimensions: '400x300px';
    colorScheme: 'purple-tertiary';
    quickAccessNumbers: string[]; // frequently used
  };
  performance: {
    loadTime: '<1s';
    memoryUsage: '<50MB';
  };
}
```

##### 4. SharePoint Integration (NEW)
```typescript
interface SharePointComponent {
  name: 'SharePoint Integration';
  type: 'document-collaboration';
  features: {
    documentLibrary: boolean; // true
    sharedCalendars: boolean; // true
    teamSites: boolean; // true
    lists: boolean; // true
    searchDocuments: boolean; // true
  };
  integrations: {
    sharePoint: {
      method: 'embed' | 'api';
      auth: 'existing-session' | 'oauth';
      siteUrl: 'gonortheast.sharepoint.com';
    };
    internal: {
      supervisorAuth: 'convex-session';
      documentTracking: boolean; // true
    };
  };
  ui: {
    layout: 'document-browser';
    dimensions: 'responsive';
    colorScheme: 'blue-primary';
  };
  performance: {
    loadTime: '<2s';
    memoryUsage: '<100MB';
  };
}
```

---

## 🏗️ Detailed Implementation Phases

### Phase 1: Discovery & Architecture (Week 1-2)

#### 1.1 Technical Discovery ✅ COMPLETED (July 2, 2025)
**Duration**: 3 days  
**Owner**: Lead Developer  
**Status**: COMPLETED
**Deliverables**: 
- ✅ System Health functionality audit report - `/logs/system_health_audit_report.json`
- ✅ Admin Dashboard capability assessment - `/logs/admin_dashboard_assessment.json`
- ✅ Current Message Distribution channel verification - `/logs/message_distribution_verification.json`
- ✅ Performance baseline measurements - `/logs/performance_baseline_measurements.json`
- ✅ Discovery summary report - `/logs/discovery_report.json`

**Key Findings**:
1. System Health has 80% overlap with Admin Dashboard - recommended for migration
2. Only Ticketer and Email channels are functional in Message Distribution
3. Current memory usage: 275MB with 100MB optimization potential
4. Automated Reports needs enhancement but core functionality exists

**Decisions Made**:
- Migrate System Health to Admin Dashboard (2 days effort)
- Focus Message Distribution on Ticketer + Email only
- Use web embeds for Email (Outlook) and 8x8 VoIP
- Add SharePoint as new integration

**Detailed Tasks**:
1. **System Health Audit** (Day 1)
   ```bash
   # Audit checklist
   - Map all System Health monitoring endpoints
   - Document current metrics being tracked
   - Identify overlaps with Admin Dashboard
   - Test performance monitoring accuracy
   - Document component dependencies
   ```

2. **Admin Dashboard Assessment** (Day 1)
   ```bash
   # Assessment checklist
   - Inventory existing monitoring capabilities
   - Identify integration points for System Health
   - Document current navigation structure
   - Test component loading performance
   - Map data flow architecture
   ```

3. **Message Distribution Verification** (Day 2)
   ```bash
   # Verification checklist
   - Test SMS gateway connectivity (Twilio/etc)
   - Verify WhatsApp Business API status
   - Test Microsoft Teams webhook integration
   - Document email template system
   - Map distribution list management
   ```

4. **Performance Baseline** (Day 3)
   ```bash
   # Metrics collection
   - Memory usage per component
   - Load time measurements
   - Network request analysis
   - Bundle size optimization opportunities
   - Real-time sync performance
   ```

**Acceptance Criteria**:
- [ ] Complete system audit document (>20 pages)
- [ ] Performance baseline report with metrics
- [ ] Component dependency map
- [ ] Integration feasibility assessment
- [ ] Risk assessment matrix

#### 1.2 API Research & Design
**Duration**: 4 days  
**Owner**: Lead Developer  
**Deliverables**: 
- 8x8 API integration specification
- Microsoft 365 enhanced integration plan
- Security & compliance review
- API rate limiting strategy

**Detailed Tasks**:
1. **8x8 VoIP API Research** (Day 1-2)
   ```typescript
   // Research deliverables
   interface EightByEightAPISpec {
     authentication: {
       method: 'OAuth 2.0' | 'API Key' | 'JWT';
       scopes: string[];
       refreshTokenStrategy: string;
     };
     endpoints: {
       voice: APIEndpoint[];
       directory: APIEndpoint[];
       analytics: APIEndpoint[];
       webhooks: WebhookSpec[];
     };
     rateLimits: {
       callsPerMinute: number;
       concurrentCalls: number;
       dataTransferLimits: string;
     };
     pricing: {
       setupCost: number;
       monthlyPerUser: number;
       perCallCost: number;
       additionalFeatures: PricingTier[];
     };
   }
   ```

2. **Microsoft 365 Enhancement Planning** (Day 2)
   ```typescript
   // Enhanced integration spec
   interface EnhancedMSIntegration {
     currentCapabilities: string[];
     newFeatures: {
       distributionListMgmt: boolean;
       scheduledEmail: boolean;
       templateLibrary: boolean;
       attachmentHandling: boolean;
       readReceiptTracking: boolean;
     };
     securityEnhancements: {
       encryptionInTransit: boolean;
       auditLogging: boolean;
       accessControls: RoleBasedAccess[];
     };
   }
   ```

3. **Security & Compliance Review** (Day 3)
   ```bash
   # Security checklist
   - GDPR compliance requirements
   - Data retention policies
   - Encryption requirements (at rest/in transit)
   - User consent management
   - Audit trail requirements
   - Emergency access protocols
   ```

4. **Rate Limiting Strategy** (Day 4)
   ```typescript
   interface RateLimitingStrategy {
     apiCallLimits: {
       email: '1000/hour';
       voip: '100/hour';
       sms: '500/hour';
     };
     backoffStrategy: 'exponential' | 'linear';
     failureHandling: {
       retryAttempts: number;
       circuitBreaker: boolean;
       fallbackMethods: string[];
     };
   }
   ```

**Acceptance Criteria**:
- [ ] Complete 8x8 API specification document
- [ ] Enhanced Microsoft 365 integration plan
- [ ] Security compliance checklist (100% complete)
- [ ] Rate limiting implementation strategy
- [ ] Cost-benefit analysis report

#### 1.3 UI/UX Design System
**Duration**: 3 days  
**Owner**: Lead Developer + UX Reviewer  
**Deliverables**: 
- Communications design system specification
- Component wireframes and mockups
- Responsive design strategy
- Accessibility compliance plan

**Detailed Tasks**:
1. **Design System Definition** (Day 1)
   ```css
   /* Communications Design System */
   :root {
     /* Primary Colors */
     --comm-primary: #2563eb;    /* Blue - Email/Primary */
     --comm-secondary: #059669;  /* Green - Success/Email */
     --comm-tertiary: #7c3aed;   /* Purple - VoIP */
     --comm-accent: #dc2626;     /* Red - Urgent/Emergency */
     
     /* Typography */
     --comm-font-primary: 'Inter', system-ui;
     --comm-font-mono: 'Fira Code', monospace;
     
     /* Spacing */
     --comm-spacing-xs: 0.25rem;
     --comm-spacing-sm: 0.5rem;
     --comm-spacing-md: 1rem;
     --comm-spacing-lg: 1.5rem;
     --comm-spacing-xl: 2rem;
     
     /* Border Radius */
     --comm-radius-sm: 0.375rem;
     --comm-radius-md: 0.5rem;
     --comm-radius-lg: 0.75rem;
     
     /* Shadows */
     --comm-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
     --comm-shadow-md: 0 4px 6px rgba(0,0,0,0.07);
     --comm-shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
   }
   ```

2. **Component Wireframing** (Day 2)
   ```typescript
   interface ComponentWireframe {
     component: string;
     dimensions: {
       mobile: { width: string; height: string };
       tablet: { width: string; height: string };
       desktop: { width: string; height: string };
     };
     layout: {
       header: ComponentSection;
       body: ComponentSection;
       footer: ComponentSection;
       sidebar?: ComponentSection;
     };
     interactions: UserInteraction[];
   }
   ```

3. **Responsive Strategy** (Day 2)
   ```typescript
   interface ResponsiveStrategy {
     breakpoints: {
       mobile: '0-767px';
       tablet: '768-1023px';
       desktop: '1024px+';
     };
     layoutAdaptations: {
       mobile: 'single-column-stack';
       tablet: 'two-column-grid';
       desktop: 'three-column-grid';
     };
     touchOptimizations: {
       buttonMinSize: '44px';
       touchTargetSpacing: '8px';
       gestureSupport: SwipeGesture[];
     };
   }
   ```

4. **Accessibility Compliance** (Day 3)
   ```typescript
   interface AccessibilitySpec {
     wcagLevel: 'AA';
     requirements: {
       keyboardNavigation: boolean;
       screenReaderSupport: boolean;
       colorContrastRatio: '4.5:1';
       focusIndicators: boolean;
       alternativeText: boolean;
       semanticHTML: boolean;
     };
     testing: {
       automatedTools: ['axe-core', 'lighthouse'];
       manualTesting: string[];
       userTesting: boolean;
     };
   }
   ```

**Acceptance Criteria**:
- [ ] Complete design system specification
- [ ] High-fidelity wireframes for all 6 components
- [ ] Responsive design documentation
- [ ] WCAG AA compliance checklist
- [ ] Design review approval from stakeholders

---

### Phase 2: Foundation & Infrastructure (Week 2-3)

#### 2.1 Development Environment Setup
**Duration**: 2 days  
**Owner**: Lead Developer  
**Deliverables**: 
- Enhanced development environment
- Testing infrastructure
- CI/CD pipeline updates
- Documentation framework

**Detailed Tasks**:
1. **Environment Enhancement** (Day 1)
   ```bash
   # Development setup checklist
   - Configure 8x8 API development sandbox
   - Setup Microsoft Graph API test tenant
   - Configure Convex development environment
   - Setup component testing framework
   - Configure performance monitoring
   ```

2. **Testing Infrastructure** (Day 2)
   ```typescript
   // Testing configuration
   interface TestingFramework {
     unitTesting: {
       framework: 'Jest + React Testing Library';
       coverage: '90%+';
       testTypes: ['component', 'hooks', 'utils', 'api'];
     };
     integrationTesting: {
       framework: 'Playwright';
       scenarios: E2ETestScenario[];
       crossBrowser: ['Chrome', 'Firefox', 'Safari'];
     };
     performanceTesting: {
       tools: ['Lighthouse', 'WebPageTest'];
       metrics: ['FCP', 'LCP', 'FID', 'CLS'];
       thresholds: PerformanceThreshold[];
     };
   }
   ```

**Acceptance Criteria**:
- [ ] Development environment fully configured
- [ ] All testing frameworks operational
- [ ] CI/CD pipeline updated for new components
- [ ] Performance monitoring baseline established

#### 2.2 Core Infrastructure Development
**Duration**: 3 days  
**Owner**: Lead Developer  
**Deliverables**: 
- Shared communication services
- Enhanced Convex schema
- API middleware layer
- Error handling framework

**Detailed Tasks**:
1. **Communication Services Layer** (Day 1)
   ```typescript
   // Core communication services
   interface CommunicationServices {
     emailService: {
       provider: 'Microsoft Graph API';
       features: ['send', 'receive', 'template', 'schedule'];
       authentication: 'OAuth 2.0';
       rateLimiting: 'token-bucket';
     };
     voipService: {
       provider: '8x8 Voice API';
       features: ['call', 'conference', 'record', 'transfer'];
       authentication: 'API Key + JWT';
       realTime: 'WebRTC';
     };
     messagingService: {
       providers: ['SMS', 'WhatsApp', 'Teams'];
       unifiedInterface: boolean;
       messageQueue: 'Redis-compatible';
     };
   }
   ```

2. **Enhanced Convex Schema** (Day 2)
   ```typescript
   // Enhanced schema for communications
   interface ConvexCommunicationsSchema {
     tables: {
       emailTemplates: EmailTemplateRecord[];
       communicationLogs: CommunicationLogRecord[];
       distributionLists: DistributionListRecord[];
       voipSessions: VoipSessionRecord[];
       messageQueues: MessageQueueRecord[];
     };
     indexes: {
       bySuperId: 'supervisorId';
       byTimestamp: 'createdAt';
       byType: 'communicationType';
       byStatus: 'status';
     };
   }
   ```

3. **API Middleware Layer** (Day 3)
   ```typescript
   interface APIMiddleware {
     authentication: {
       supervisorAuth: 'convex-session-verification';
       apiKeyValidation: 'rate-limited-verification';
       tokenRefresh: 'automatic-renewal';
     };
     rateLimiting: {
       strategy: 'sliding-window';
       limits: RateLimitConfig[];
       backoffPolicy: 'exponential';
     };
     errorHandling: {
       retryMechanism: 'circuit-breaker';
       fallbackServices: string[];
       errorLogging: 'structured-logging';
     };
   }
   ```

**Acceptance Criteria**:
- [ ] Communication services layer implemented
- [ ] Convex schema deployed and tested
- [ ] API middleware fully functional
- [ ] Error handling framework operational
- [ ] Integration tests passing (95%+)

---

### Phase 3: Component Development - Tier 1 (Week 3-5)

#### 3.1 Email Integration Component (Outlook Web)
**Duration**: 3 days (reduced from 5)  
**Owner**: Lead Developer  
**Deliverables**: 
- Outlook Web Access integration
- Email template library
- Quick compose features
- Activity tracking

**Detailed Implementation**:

**Day 1: Outlook Web Embed**
```typescript
// /components/communications/EmailIntegration.jsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useMicrosoftGraph } from '../hooks/useMicrosoftGraph';
import { useConvexSync } from '../hooks/useConvexSync';

interface EmailIntegrationProps {
  supervisorId: string;
  onEmailSent: (emailData: EmailData) => void;
  onError: (error: Error) => void;
}

const EmailIntegration: React.FC<EmailIntegrationProps> = ({
  supervisorId,
  onEmailSent,
  onError
}) => {
  const [composerState, setComposerState] = useState<EmailComposerState>({
    to: [],
    cc: [],
    bcc: [],
    subject: '',
    body: '',
    template: null,
    attachments: [],
    priority: 'normal',
    deliveryReceipt: false,
    readReceipt: false,
    scheduledSend: null
  });

  const {
    sendEmail,
    getTemplates,
    getDistributionLists,
    isAuthenticated,
    isLoading,
    error
  } = useMicrosoftGraph();

  const { logCommunication } = useConvexSync();

  // Component implementation...
};
```

**Day 2: Template Management System**
```typescript
// /components/communications/EmailTemplateManager.jsx
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: TemplateVariable[];
  category: 'alert' | 'report' | 'notification' | 'custom';
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'route' | 'supervisor';
  required: boolean;
  defaultValue?: string;
  description: string;
}

const EmailTemplateManager: React.FC = () => {
  // Template CRUD operations
  // Variable substitution engine
  // Template preview functionality
  // Import/export capabilities
};
```

**Day 3: Distribution List Management**
```typescript
// /components/communications/DistributionListManager.jsx
interface DistributionList {
  id: string;
  name: string;
  description: string;
  members: DistributionMember[];
  type: 'static' | 'dynamic';
  criteria?: DynamicCriteria;
  isActive: boolean;
  createdBy: string;
  lastSyncAt: Date;
}

interface DistributionMember {
  email: string;
  name: string;
  role: string;
  department: string;
  isActive: boolean;
  addedAt: Date;
}

const DistributionListManager: React.FC = () => {
  // List management UI
  // Member import/export
  // Dynamic list criteria
  // Sync with Microsoft 365 groups
};
```

**Day 4: Advanced Features Implementation**
```typescript
// Advanced email features
interface AdvancedEmailFeatures {
  scheduling: {
    component: EmailScheduler;
    timezone: 'Europe/London';
    recurringEmails: boolean;
    maxScheduleAhead: '30 days';
  };
  attachments: {
    maxSize: '25MB';
    allowedTypes: string[];
    virusScanning: boolean;
    cloudStorage: 'OneDrive' | 'SharePoint';
  };
  tracking: {
    deliveryReceipts: boolean;
    readReceipts: boolean;
    linkTracking: boolean;
    analytics: EmailAnalytics;
  };
}
```

**Day 5: Testing & Integration**
```typescript
// Comprehensive testing suite
describe('EmailIntegration Component', () => {
  describe('Authentication', () => {
    it('should authenticate with Microsoft Graph API');
    it('should handle token refresh automatically');
    it('should fallback gracefully on auth failure');
  });

  describe('Email Composition', () => {
    it('should validate email addresses');
    it('should support template selection');
    it('should handle variable substitution');
    it('should validate required fields');
  });

  describe('Distribution Lists', () => {
    it('should load distribution lists');
    it('should expand list members correctly');
    it('should handle dynamic list criteria');
  });

  describe('Error Handling', () => {
    it('should handle API rate limiting');
    it('should retry failed sends appropriately');
    it('should log errors for debugging');
  });
});
```

**Acceptance Criteria**:
- [ ] Email composition interface fully functional
- [ ] Template management system operational
- [ ] Distribution list management working
- [ ] Microsoft Graph API integration complete
- [ ] All tests passing (95%+ coverage)
- [ ] Performance benchmarks met (<2s load time)
- [ ] Accessibility compliance verified

#### 3.2 8x8 VoIP Integration Component (Web Login)
**Duration**: 3 days (reduced from 7)  
**Owner**: Lead Developer  
**Deliverables**: 
- 8x8 web login integration
- Quick dial features
- Emergency numbers
- Call tracking

**Detailed Implementation Schedule**:

**Day 1: 8x8 Web Integration**
```typescript
// /services/eightByEightAPI.js
class EightByEightAPIService {
  private apiKey: string;
  private baseURL: string = 'https://vcc-na6.8x8.com/api/v1';
  private jwt: string | null = null;

  async authenticate(): Promise<AuthResult> {
    // OAuth 2.0 flow implementation
    // JWT token management
    // Refresh token handling
  }

  async makeCall(to: string, from: string): Promise<CallSession> {
    // Initiate call via 8x8 API
    // Return call session object
    // Handle call state management
  }

  async createConference(participants: string[]): Promise<ConferenceSession> {
    // Create conference call
    // Manage participant list
    // Handle conference controls
  }

  private handleAPIErrors(error: any): APIError {
    // Standardized error handling
    // Rate limiting detection
    // Circuit breaker implementation
  }
}
```

**Day 3-4: VoIP Component Interface**
```typescript
// /components/communications/VoIPIntegration.jsx
interface VoIPIntegrationProps {
  supervisorId: string;
  onCallStatusChange: (status: CallStatus) => void;
  onError: (error: VoIPError) => void;
}

const VoIPIntegration: React.FC<VoIPIntegrationProps> = ({
  supervisorId,
  onCallStatusChange,
  onError
}) => {
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    currentCall: null,
    conferenceParticipants: [],
    callHistory: [],
    contactDirectory: []
  });

  // Component implementation with:
  // - Dialer interface
  // - Call controls (mute, hold, transfer)
  // - Conference management
  // - Call history
  // - Contact directory
  // - Emergency calling features
};
```

**Day 5: WebRTC Implementation**
```typescript
// /services/webRTCService.js
class WebRTCService {
  private peerConnection: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;

  async initializeWebRTC(): Promise<void> {
    // Initialize peer connection
    // Configure STUN/TURN servers
    // Setup media constraints
  }

  async startCall(to: string): Promise<CallSession> {
    // Create offer
    // Handle signaling
    // Establish connection
  }

  async answerCall(offer: RTCSessionDescription): Promise<void> {
    // Create answer
    // Set remote description
    // Start media streams
  }

  private handleConnectionStateChange(): void {
    // Monitor connection quality
    // Handle reconnection
    // Implement fallback strategies
  }
}
```

**Day 6: Advanced Features**
```typescript
// Advanced VoIP features
interface AdvancedVoIPFeatures {
  callRecording: {
    enabled: boolean;
    storage: 'cloud' | 'local';
    retention: '90 days';
    transcription: boolean;
  };
  analytics: {
    callQuality: CallQualityMetrics;
    usage: UsageStatistics;
    reporting: ReportingCapabilities;
  };
  integration: {
    crm: boolean;
    ticketing: boolean;
    calendar: boolean;
  };
}
```

**Day 7: Testing & Optimization**
```typescript
// VoIP testing suite
describe('VoIP Integration', () => {
  describe('Authentication', () => {
    it('should authenticate with 8x8 API');
    it('should handle token expiration');
  });

  describe('Call Management', () => {
    it('should initiate outbound calls');
    it('should receive inbound calls');
    it('should handle call transfers');
    it('should manage conference calls');
  });

  describe('WebRTC', () => {
    it('should establish peer connections');
    it('should handle media streams');
    it('should manage connection quality');
  });

  describe('Performance', () => {
    it('should maintain audio quality');
    it('should handle network fluctuations');
    it('should optimize bandwidth usage');
  });
});
```

**Acceptance Criteria**:
- [ ] 8x8 API integration fully functional
- [ ] VoIP component interface complete
- [ ] WebRTC implementation working
- [ ] Call quality meets standards (<50ms latency)
- [ ] All tests passing (90%+ coverage)
- [ ] Emergency calling features operational
- [ ] Security requirements met (AES-256 encryption)

---

### Phase 4: Component Development - Tier 2 (Week 5-6)

#### 4.1 Enhanced Message Distribution
**Duration**: 3 days  
**Owner**: Lead Developer  
**Deliverables**: 
- Focus on Ticketer (driver messaging)
- Email distribution via Outlook
- Template system
- Unified message tracking

#### 4.2 Enhanced Automated Reports
**Duration**: 3 days  
**Owner**: Lead Developer  
**Deliverables**: 
- Improved report generation
- Scheduled distribution
- Custom report templates
- Export to SharePoint

#### 4.3 SharePoint Integration
**Duration**: 2 days  
**Owner**: Lead Developer  
**Deliverables**: 
- Document library access
- Team site integration
- Report storage
- Shared resources

---

### Phase 5: Component Migration & Cleanup (Week 6-7)

#### 5.1 System Health Migration
**Duration**: 2 days  
**Acceptance Criteria**: System Health fully integrated into Admin Dashboard

#### 5.2 Obsolete Component Removal
**Duration**: 2 days  
**Acceptance Criteria**: All deprecated components removed, no broken references

#### 5.3 Ticketer Simplification
**Duration**: 1 day  
**Acceptance Criteria**: Ticketer reduced to single message button functionality

---

### Phase 6: UI/UX Implementation (Week 7-8)

#### 6.1 Design System Implementation
**Duration**: 3 days  
**Acceptance Criteria**: All components follow unified design system

#### 6.2 Responsive Design Implementation
**Duration**: 2 days  
**Acceptance Criteria**: All breakpoints working correctly

#### 6.3 Accessibility Implementation
**Duration**: 2 days  
**Acceptance Criteria**: WCAG AA compliance achieved

---

### Phase 7: Integration & Testing (Week 8-9)

#### 7.1 Component Integration Testing
**Duration**: 3 days  
**Acceptance Criteria**: All components work together seamlessly

#### 7.2 Performance Testing & Optimization
**Duration**: 2 days  
**Acceptance Criteria**: Performance benchmarks met

#### 7.3 Security Testing
**Duration**: 2 days  
**Acceptance Criteria**: Security requirements verified

---

### Phase 8: Documentation & Deployment (Week 9-10)

#### 8.1 Technical Documentation
**Duration**: 2 days  
**Deliverables**: Complete technical documentation

#### 8.2 User Documentation
**Duration**: 1 day  
**Deliverables**: User guides and training materials

#### 8.3 Deployment & Rollout
**Duration**: 2 days  
**Deliverables**: Production deployment with rollback plan

---

## 📋 Detailed Technical Specifications

### Performance Requirements
```typescript
interface PerformanceRequirements {
  loadTime: {
    initial: '<3s';
    componentSwitch: '<1s';
    apiResponse: '<2s';
  };
  memoryUsage: {
    maximum: '1.8GB'; // 90% of 2GB limit
    average: '1.2GB';
    componentIsolation: true;
  };
  networkOptimization: {
    bundleSize: '<2MB total';
    lazyLoading: true;
    caching: 'aggressive';
    compression: 'gzip + brotli';
  };
  realTimeSync: {
    latency: '<100ms';
    reliability: '99.9%';
    fallbackMechanism: true;
  };
}
```

### Security Requirements
```typescript
interface SecurityRequirements {
  authentication: {
    supervisorAuth: 'convex-session + MFA';
    apiKeyRotation: '90 days';
    sessionTimeout: '10 minutes idle';
  };
  dataProtection: {
    encryptionAtRest: 'AES-256';
    encryptionInTransit: 'TLS 1.3';
    dataRetention: 'GDPR compliant';
  };
  auditLogging: {
    allCommunications: true;
    accessLogs: true;
    errorLogs: true;
    retention: '7 years';
  };
  compliance: {
    gdpr: true;
    iso27001: true;
    soc2: 'Type II';
  };
}
```

### Scalability Architecture
```typescript
interface ScalabilityArchitecture {
  horizontalScaling: {
    loadBalancing: 'round-robin';
    autoScaling: 'demand-based';
    maxInstances: 10;
  };
  databaseOptimization: {
    indexing: 'optimized queries';
    caching: 'Redis-compatible';
    partitioning: 'by supervisor';
  };
  apiOptimization: {
    rateLimiting: 'per-user + global';
    caching: 'intelligent';
    compression: 'dynamic';
  };
}
```

---

## 🧪 Testing Strategy

### Unit Testing
```typescript
interface UnitTestingStrategy {
  framework: 'Jest + React Testing Library';
  coverage: {
    minimum: '90%';
    target: '95%';
    critical: '100%'; // auth, security, data handling
  };
  testTypes: {
    componentTesting: ComponentTest[];
    hookTesting: HookTest[];
    serviceTesting: ServiceTest[];
    utilityTesting: UtilityTest[];
  };
}
```

### Integration Testing
```typescript
interface IntegrationTestingStrategy {
  framework: 'Playwright + Custom Harness';
  scenarios: {
    userWorkflows: UserWorkflowTest[];
    apiIntegration: APIIntegrationTest[];
    crossComponent: CrossComponentTest[];
    errorHandling: ErrorHandlingTest[];
  };
  environments: {
    development: boolean;
    staging: boolean;
    production: boolean; // read-only tests
  };
}
```

### Performance Testing
```typescript
interface PerformanceTestingStrategy {
  tools: ['Lighthouse', 'WebPageTest', 'Artillery'];
  metrics: {
    loadTime: LoadTimeMetrics;
    memoryUsage: MemoryMetrics;
    networkPerformance: NetworkMetrics;
    userExperience: UXMetrics;
  };
  benchmarks: {
    baseline: PerformanceBenchmark;
    targets: PerformanceTarget[];
    thresholds: PerformanceThreshold[];
  };
}
```

---

## 🚀 Deployment Strategy

### Deployment Pipeline
```yaml
# .github/workflows/communications-deployment.yml
name: Communications Platform Deployment

on:
  push:
    branches: [main, staging]
    paths: ['app/communications/**', 'components/communications/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Run Unit Tests
        run: npm run test:unit:communications
      - name: Run Integration Tests
        run: npm run test:integration:communications
      - name: Performance Testing
        run: npm run test:performance:communications

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    steps:
      - name: Deploy to Staging
        run: npm run deploy:staging:communications
      - name: Run E2E Tests
        run: npm run test:e2e:communications

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: npm run deploy:production:communications
      - name: Health Check
        run: npm run healthcheck:communications
```

### Rollback Strategy
```typescript
interface RollbackStrategy {
  triggers: {
    performanceDegradation: '> 20% increase in load time';
    errorRate: '> 5% error rate';
    userReports: '> 3 critical issues';
    healthCheck: 'failed for > 2 minutes';
  };
  procedure: {
    automatic: boolean; // true for critical issues
    timeToRollback: '<5 minutes';
    dataIntegrity: 'preserved';
    userNotification: boolean;
  };
  validation: {
    postRollback: RollbackValidation[];
    userAcceptance: boolean;
    performanceVerification: boolean;
  };
}
```

---

## 📊 Success Metrics & KPIs

### Technical KPIs
```typescript
interface TechnicalKPIs {
  performance: {
    pageLoadTime: { target: '<3s', current: 'TBD' };
    componentLoadTime: { target: '<1s', current: 'TBD' };
    memoryUsage: { target: '<1.8GB', current: 'TBD' };
    apiResponseTime: { target: '<2s', current: 'TBD' };
  };
  reliability: {
    uptime: { target: '99.9%', current: 'TBD' };
    errorRate: { target: '<1%', current: 'TBD' };
    successfulDeployments: { target: '95%', current: 'TBD' };
  };
  security: {
    vulnerabilities: { target: '0 critical', current: 'TBD' };
    complianceScore: { target: '100%', current: 'TBD' };
    auditReadiness: { target: '100%', current: 'TBD' };
  };
}
```

### User Experience KPIs
```typescript
interface UserExperienceKPIs {
  usability: {
    taskCompletionTime: { target: '<4s', baseline: '6.4s' };
    userSatisfaction: { target: '4.5/5', baseline: '3.2/5' };
    errorRate: { target: '<5%', baseline: '12%' };
    trainingTime: { target: '<30min', baseline: '45min' };
  };
  adoption: {
    dailyActiveUsers: { target: '9/9 supervisors' };
    featureUtilization: { target: '>80%' };
    supportTickets: { target: '<2/week' };
  };
}
```

### Business KPIs
```typescript
interface BusinessKPIs {
  efficiency: {
    communicationWorkflowTime: { target: '40% reduction' };
    multichannelUsage: { target: '>70%' };
    automatedResponses: { target: '>50%' };
  };
  cost: {
    developmentCost: { budget: '£X,XXX' };
    operationalCost: { target: '<£XXX/month' };
    maintenanceCost: { target: '<£XXX/month' };
  };
  roi: {
    timeSavings: { target: '2 hours/supervisor/week' };
    errorReduction: { target: '60% fewer comm errors' };
    customerSatisfaction: { target: '10% improvement' };
  };
}
```

---

## 🔄 Post-Launch Support & Maintenance

### Immediate Post-Launch (Week 1-2)
```typescript
interface PostLaunchSupport {
  monitoring: {
    realTimeMetrics: '24/7 monitoring';
    alertThresholds: 'aggressive during initial period';
    escalationProcedure: 'immediate response < 15 minutes';
  };
  userSupport: {
    dedicatedSupport: 'primary developer available';
    responseTime: '<2 hours';
    knowledgeBase: 'comprehensive documentation';
  };
  bugTriage: {
    criticalBugs: 'hotfix within 4 hours';
    majorBugs: 'fix within 24 hours';
    minorBugs: 'fix within 1 week';
  };
}
```

### Long-term Maintenance (Month 1+)
```typescript
interface LongTermMaintenance {
  regularUpdates: {
    securityPatches: 'monthly';
    featureUpdates: 'quarterly';
    performanceOptimizations: 'as needed';
  };
  monitoring: {
    performanceReports: 'weekly';
    usageAnalytics: 'monthly';
    securityAudits: 'quarterly';
  };
  evolution: {
    userFeedbackReview: 'monthly';
    featureRequestEvaluation: 'quarterly';
    technologyStackReview: 'annually';
  };
}
```

---

## 🤔 Outstanding Questions & Decisions Required

### ✅ Decisions Made (July 2, 2025)

1. **Operations Centre Component**
   - **Decision**: REMOVE from Communications Platform
   - **Rationale**: Not communications-focused

2. **Incident Manager Component**
   - **Decision**: RELOCATE to Disruptions screen
   - **Rationale**: Better alignment with operational workflow

3. **Roadworks Manager Component**
   - **Decision**: RELOCATE to Disruptions screen
   - **Rationale**: Operational focus, not communications

4. **AI Disruption Manager**
   - **Decision**: RELOCATE to Disruptions screen
   - **Rationale**: Consolidates all disruption management

5. **8x8 VoIP Service Level**
   - **Decision**: Use existing work system with web login
   - **Rationale**: Already available, reduces complexity and cost

6. **Message Distribution Channels**
   - **Decision**: Focus on Ticketer (drivers) and Email (Outlook)
   - **Rationale**: These are the primary channels in use

7. **Automated Reports**
   - **Decision**: ENHANCE functionality
   - **Rationale**: Critical communications tool needing improvement

8. **SharePoint Integration**
   - **Decision**: ADD to platform
   - **Rationale**: Already in use for document sharing

---

**Next Steps**: 
1. Review and approve this comprehensive plan
2. Provide answers to outstanding questions
3. Confirm budget and timeline approval
4. Initiate Phase 1: Discovery & Architecture

**Estimated Total Timeline**: 6-8 weeks (reduced due to simpler integrations)  
**Estimated Development Effort**: 240-320 developer hours (reduced complexity)  
**Risk Level**: Low (using existing web systems)  
**Success Probability**: Very High (95%+) with simplified approach

**Key Simplifications**:
- Using web embeds/logins instead of full API integrations
- Leveraging existing workplace tools (8x8, Outlook, SharePoint)
- Focused scope on core communications only
- Removed complex operational components

# Communications Platform Restructure – Enterprise Development Plan (AI-Executable)

**Project Code:** GOB-COMM-2025-001  
**Project:** Go BARRY Traffic Intelligence Platform  
**Initiative:** Communications Module Restructure & Enhancement  
**Date:** July 2, 2025  
**Version:** 1.1 (AI-ready)  
**Classification:** Internal Development  
**Estimated Duration:** 8-12 weeks  
**Team Size:** 1-2 developers  
**Priority:** P1 (High)  
**Unique Plan ID:** comms-restructure-2025

---

## 📋 Executive Summary

### Project Objective
Transform the “Supervisor Screen” into a modular Communications Platform (single entry point, all messaging/call workflows, scalable, AI-interpretable structure).

### Business Justification
- Pain: Fragmented comms tools, slow onboarding, error-prone workflows.
- Solution: Unified comms hub with automated auditing, extensibility, and high accessibility.
- ROI: Target 40% reduction in workflow time, 4.5/5 user rating.
- User Base: 9 supervisors, control room staff, future APIs.
- Strategic: Central to Go BARRY digital transformation.

---

## 📊 Current State Analysis

### 1.0 Existing Architecture Assessment

#### 1.1 Component Index (Supervisor Screen)
```typescript
interface SupervisorScreenComponent {
  id: string;
  shortcut: string;
  component: React.ComponentType<any>;
  status: 'active' | 'deprecated' | 'incomplete';
  usage: 'high' | 'medium' | 'low' | 'none';
  dependencies: string[];
}
```
- All current components must be indexed in a single array for AI parsing.
- Example list preserved from previous version.

#### 1.2 Technical Debt & User Experience
- Memory usage: 1.2GB (60% of limit).
- Load time: 3.2s.
- Coupling: High, ~30% code duplication.
- User: 12% navigation error, 45min onboarding.
- Each component must declare all dependencies in metadata for automated migration.

- UX: 6.4s avg task, 3.2/5 rating.
- AI Note: New system must include explicit "success flow" and "error flow" diagrams for each core user task, saved in `/docs/userflows/` as Markdown or SVG.

---

## 🎯 Target Architecture Definition

### 2.0 Platform Overview
```
┌────────────┬───────────────────────┬─────────────┐
│ Platform   │ Module                │ Role        │
├────────────┼───────────────────────┼─────────────┤
│ GoBarry    │ Communications Hub    │ Home Route  │
│ GoBarry    │ Admin Dashboard       │ /admin      │
│ GoBarry    │ Disruptions Manager   │ /disruptions│
└────────────┴───────────────────────┴─────────────┘
```

**Communications Hub Components (UPDATED):**
- ✅ Ticketer (driver messaging)
- ✅ Email Integration (Outlook Web Access)
- ✅ 8x8 VoIP (web login)
- ✅ SharePoint (documents/collaboration)
- ✅ Message Distribution (unified)
- ✅ Automated Reports (enhanced)

- All modules use consistent, AI-readable, component schemas.

### 2.1 Components Matrix
```typescript
const communicationsComponents = [
  { moduleId: 'ticketer', action: 'RETAIN', priority: 'P1', complexity: 'Low' },
  { moduleId: 'email-outlook', action: 'CREATE', priority: 'P1', complexity: 'Low' },
  { moduleId: '8x8-voip', action: 'CREATE', priority: 'P1', complexity: 'Low' },
  { moduleId: 'sharepoint', action: 'CREATE', priority: 'P2', complexity: 'Medium' },
  { moduleId: 'message-dist', action: 'ENHANCE', priority: 'P1', complexity: 'Medium' },
  { moduleId: 'auto-reports', action: 'ENHANCE', priority: 'P1', complexity: 'Medium' }
];
```

### 2.2 Module Ownership Example
```typescript
interface ModuleOwnership {
  moduleId: string;
  owner: string;
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  testId: string;
}
```
- Each major component/module must export ownership metadata for AI task routing and maintainability.

---

## 🏗️ Implementation Phases (AI Ready)

### Phase 1: Discovery & Architecture (Week 1-2)

#### 1.1 Technical Discovery ✅ COMPLETED
- All checklist/audit results saved to `/logs/` as JSON files:
  - `system_health_audit_report.json` (auditId: SH-AUDIT-2025-001)
  - `admin_dashboard_assessment.json` (auditId: AD-ASSESS-2025-001)
  - `message_distribution_verification.json` (auditId: MD-VERIFY-2025-001)
  - `performance_baseline_measurements.json` (auditId: PERF-BASE-2025-001)
  - `discovery_report.json` (reportId: DISCOVERY-SUMMARY-2025-001)
- Every audit has unique auditId for traceability ✅

#### 1.2 API Research & Design ✅ COMPLETED
- All API specs saved as TypeScript/JSON files in `/api-specs/`:
  - `8x8-web-integration-spec.ts` - Web embed approach for VoIP
  - `outlook-web-integration-spec.ts` - Outlook Web Access iframe
  - `sharepoint-integration-spec.ts` - Document collaboration
  - `microsoft-365-integration-plan.json` - Unified MS approach
  - `security-compliance-review.json` - Low-Medium risk assessment
  - `rate-limiting-strategy.ts` - Hybrid rate limiting approach
- Security/compliance doc as machine-readable `security.json` ✅
- Each rate limit config ready for implementation ✅

#### 1.3 UI/UX Design System ✅ COMPLETED
- All design tokens exported to `/design-system/`:
  - `communications-design-system.css` - Web CSS framework
  - `communications-design-system.ts` - React Native styles  
  - `component-wireframes.md` - All 6 component layouts
  - `responsive-design-strategy.ts` - Breakpoint behaviors
  - `accessibility-compliance-plan.md` - WCAG 2.1 AA plan
- Wireframes match Admin Dashboard patterns ✅
- Accessibility testing procedures defined ✅

---

### Phase 2: Foundation & Infrastructure (Week 2-3)

#### 2.1 Development Environment
- Each step logs status to `/logs/dev-setup.log`.
- Testing config exported as `/config/testing.json`.

#### 2.2 Core Infrastructure
- Communication services layer exposes TypeScript interfaces for all CRUD actions.
- Convex schema in `convex-communications-schema.ts`.
- API middleware unit tested for each auth/rate/error path.

---

### Phase 3: Component Development – Tier 1 (Week 3-5)

#### 3.1 Email Integration
- Code stub for every prop and output event.
- State transitions logged with `console.info('state:...', {...})`.
- Template/Dist List/Advanced features: Each as own module with API boundary.
- All "onError" and "onSuccess" events emit full payload and handled globally.
- Tests for "happy path" and "error path" flows.

#### 3.2 8x8 VoIP Integration
- Authentication retries/fallbacks.
- VoIP state machine implemented and documented.
- WebRTC class fully doc-commented for AI comprehension.
- Advanced features behind feature flag.
- Test cases for degraded network and device error.

---

### Phase 4: Component Development – Tier 2 (Week 5-6)

#### 4.1 Message Distribution
- Document every supported channel and fallback logic.
- Template system interface re-used from Email Integration.

#### 4.2 AI Disruption Manager
- Automated regression tests required.
- Route impact and smart messaging as explicit workflow diagrams (`/docs/userflows/`).

---

### Phase 5: Migration & Cleanup (Week 6-7)

#### 5.1 System Health → Admin
- All moved endpoints/UI controls documented in `/docs/migration.md`.
- All deprecated components removed from imports and menus.

#### 5.2 Remove Deprecated
- Automated orphaned reference scan; output as `/logs/removed_components.json`.

#### 5.3 Ticketer Simplification
- Reduce to minimal version, all extra code removed.

---

### Phase 6: UI/UX Implementation (Week 7-8)

#### 6.1 Design System
- Styleguide published as `/docs/styleguide.html`.
- All tokens/colors referenced only from the design system.

#### 6.2 Responsive
- Breakpoints/layouts tested via visual regression suite; logs to `/logs/responsive.log`.

#### 6.3 Accessibility
- Lighthouse/axe output saved as `/logs/accessibility.log`.
- No "critical" or "serious" accessibility issues allowed.

---

### Phase 7: Integration & Testing (Week 8-9)

#### 7.1 Component Integration
- Automated smoke test for all module entry points.
- Full workflow script supplied for regression test.

#### 7.2 Performance
- Benchmark test results exported as `/logs/performance.json`.

#### 7.3 Security
- All new endpoints pen-tested; audit logs timestamped with user/session id.

---

### Phase 8: Documentation & Deployment (Week 9-10)

#### 8.1 Technical Documentation
- All major interfaces auto-generated to `/docs/`.
- README includes system diagram and dependency graph (ASCII or SVG).

#### 8.2 User Documentation
- Every new/changed component: user step list + screenshots.

#### 8.3 Deployment & Rollout
- Automated deploy, smoke, and rollback tests.
- On deploy failure: restore last known good build.

---

## 🧪 Testing & Success

- **Unit**: 90%+ coverage, per-module coverage reports.
- **Integration**: E2E scripts for all user journeys; logs for CI.
- **Performance**: Benchmarked, output as `/logs/performance-final.json`.
- **Accessibility**: WCAG AA, zero "critical" issues.
- **Success Metrics**: Baseline and target KPIs as `/logs/kpi-report.json`.
- **All output files parseable (JSON, markdown, TS types, or logs).**

---

## ✅ All Decisions Resolved (AI-Actionable)

```typescript
const projectDecisions: OutstandingDecision[] = [
  {
    id: 'ops-centre',
    title: 'Operations Centre Component',
    options: ['keep', 'remove'],
    recommendation: 'remove',
    deadline: '2025-07-02',
    status: 'approved' // REMOVED
  },
  {
    id: 'disruption-screens',
    title: 'Disruption Components Location',
    options: ['communications', 'disruptions-screen'],
    recommendation: 'disruptions-screen',
    deadline: '2025-07-02',
    status: 'approved' // RELOCATED
  },
  {
    id: '8x8-integration',
    title: '8x8 VoIP Integration Method',
    options: ['full-api', 'web-login'],
    recommendation: 'web-login',
    deadline: '2025-07-02',
    status: 'approved' // WEB LOGIN
  },
  {
    id: 'messaging-channels',
    title: 'Primary Messaging Channels',
    options: ['multi-channel', 'ticketer-email-only'],
    recommendation: 'ticketer-email-only',
    deadline: '2025-07-02',
    status: 'approved' // TICKETER + EMAIL
  }
];
```

---

## ✅ AI Coding Checklist

1. Never use deprecated props or patterns.
2. Explicitly declare all dependencies and outputs.
3. Always provide both “happy path” and “failure path” for any async workflow.
4. Store all test and run logs in predictable `/logs/` location.
5. Provide summary output (success/failure/metrics) for each phase as JSON or markdown.
6. All final outputs deterministic and reproducible.

---

**Next Steps (AI-Ready):**
1. ✅ Review completed discovery reports
2. ✅ Completed Phase 1.2: API Research & Design
3. ✅ Completed Phase 1.3: UI/UX Design System  
4. ⏳ Start Phase 2: Foundation & Infrastructure

**Completed Outputs Location**: 
- Discovery reports: `/Users/anthony/Go BARRY App/logs/`
- API specifications: `/Users/anthony/Go BARRY App/api-specs/`
- Design system: `/Users/anthony/Go BARRY App/design-system/`

**Phase 1 Complete**: All discovery, research, and design work finished in 2 days!

---

(End of plan)