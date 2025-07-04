# Go BARRY Message Distribution Centre - Implementation Plan

## ⚠️ IMPORTANT: File Structure Update (December 2024)

### Current Implementation Structure:
1. **Route**: `/communications-hub` (not `/browser-main`)
2. **Hub Component**: `/app/communications-hub.jsx` - Card-based interface
3. **Main Component**: `/components/communications/MessageDistributionEnhanced.jsx` - The actual message distribution interface
4. **NOT USED**: 
   - `/components/MessageDistributionCenter.jsx` (basic version)
   - `/components/MessageDistributionCentre.jsx` (older version)

### Navigation Flow:
- User accesses `/communications-hub`
- Sees card-based interface with multiple communication options
- Clicks "Message Distribution" card
- Opens `MessageDistributionEnhanced.jsx` as full-screen modal

### Key Features Already Implemented:
- Ticketer, Email, and Both channels integration
- Message categories and priorities
- Template system
- Recent messages display
- Smart reply engine integration
- Supervisor session integration
- Convex sync for logging

## 📋 Overview

Transform the Message Distribution Centre from a placeholder into a functional communication hub for Go North East supervisors. Integrate with existing Ticketer, Passenger Cloud, and Outlook systems via iframes, with smart message generation from active alerts and roadworks.

## 🎯 Core Requirements

- **Users:** 9 Go North East supervisors
- **Recipients:** Bus drivers (via Ticketer), customers (via Passenger Cloud), directors (via Outlook)
- **Integration:** iframe-based (no API access available)
- **Message Transfer:** Modal display with copy/paste functionality (no auto-population)
- **Templates:** Shared globally across all supervisors, add common scenarios as needed
- **Route Selection:** Manual selection with system-generated suggestions
- **Testing:** Real environment only, test accounts available, Anthony's account for testing
- **Character Limits:** None for Ticketer or Passenger Cloud
- **Permissions:** All supervisors can create/edit templates
- **Urgency Levels:** Not required
- **Language:** UK English throughout

## 🏗️ Architecture Overview

```
MessageDistribution.jsx (Main Component)
├── MessageTabs.jsx (Driver/Customer/Email tabs)
├── QuickActions.jsx (Alert-based message creation)
├── TemplateManager.jsx (Template system)
├── RouteAnalysis.jsx (GTFS integration)
└── MessageHistory.jsx (Sent messages log)
```

## 📅 Implementation Phases

---

## Phase 1: Core Interface Structure ✅❌

### 1.1 Create Main Component
**File:** `/Go_BARRY/components/communications/MessageDistributionEnhanced.jsx`

**Features:**
- Main layout with header "Message Distribution Centre"
- Tab navigation: "Driver Messages", "Customer Messages", "Email Centre"
- Quick action buttons section
- Template selector dropdown
- Message history sidebar
- **Message preview modal** for copy/paste functionality
- Template creation interface (supervisor-created templates shared globally)

**UI Structure:**
```
┌─────────────────────────────────────────────┐
│ 📢 Message Distribution Centre              │
├─────────────────────────────────────────────┤
│ [Driver Messages] [Customer] [Email Centre] │
├─────────────────────────────────────────────┤
│ Quick Actions:                              │
│ [Alert from Roadwork] [Alert from Incident] │
│ [Custom Message] [Template: High Level ▼]   │
├─────────────────────────────────────────────┤
│ Main Content Area (iframes)          │Hist│
│                                      │ory │
│                                      │    │
└─────────────────────────────────────────────┘
```

**Technical Requirements:**
- React Native components (View, Text, TouchableOpacity)
- StyleSheet for styling
- useState for tab management
- Platform.OS checks for web-only features
- Integration with useSupervisorSession hook

**Component Structure Example:**
```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSupervisorSession } from '../hooks/useSupervisorSession';
import MessageTabs from './messaging/MessageTabs';
import QuickActions from './messaging/QuickActions';
import TemplateManager from './messaging/TemplateManager';
import MessageHistory from './messaging/MessageHistory';

const MessageDistribution = () => {
  const { supervisor, loading } = useSupervisorSession();
  const [activeTab, setActiveTab] = useState('driver');

  if (loading) {
    return <Text>Loading...</Text>;
  }
  if (!supervisor) {
    return <Text>Access denied. Supervisor authentication required.</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📢 Message Distribution Centre</Text>
      <MessageTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <QuickActions />
      <TemplateManager />
      <View style={styles.contentArea}>
        {/* Main Content Area: iframe containers, etc. */}
        <MessageHistory />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', padding: 16 },
  contentArea: { flex: 1, flexDirection: 'row' },
});

export default MessageDistribution;
```
### 1.4 Supervisor Access Control
- Only authenticated supervisors (via useSupervisorSession) can access this interface.
- Badge-based login is enforced; unauthenticated users see a loading state or error.

### 1.2 Create Tab Component
**File:** `/Go_BARRY/components/MessageTabs.jsx`

**Features:**
- Three tabs with active state styling
- Smooth transitions between tabs
- Tab content area for iframe containers

### 1.3 Update Navigation
**File:** `/Go_BARRY/app/communications-hub.jsx`

**Status:** ✅ Already implemented
- Card-based hub interface
- "Message Distribution" card launches MessageDistributionEnhanced
- Proper navigation flow in place

---

## Phase 2: External System Integration ✅❌

### 2.1 Driver Messaging (Ticketer Integration)
**File:** `/Go_BARRY/components/messaging/DriverMessaging.jsx`

**Features:**
- iframe to `https://portal.ticketer.org.uk/DriverMessagingCompose/CreateOutboundMessage`
- iframe size: 100% width, 800px height
- Loading state while iframe loads
- Refresh button for iframe
- Pre-fill message button (when templates ready)

**Technical Implementation:**
```jsx
// Web-only component with Platform.OS check
if (Platform.OS === 'web') {
  return (
    <iframe
      src="https://portal.ticketer.org.uk/DriverMessagingCompose/CreateOutboundMessage"
      style={{ width: '100%', height: 800, border: 'none' }}
      title="Ticketer Driver Messaging"
    />
  );
}
```

### 2.2 Customer Messaging (Passenger Cloud Integration)
**File:** `/Go_BARRY/components/messaging/CustomerMessaging.jsx`

**Features:**
- iframe to `https://gonortheast.passenger-app.com/login`
- Same technical approach as Ticketer
- Instructions for supervisors on how to use

### 2.3 Email Centre (Outlook Integration)
**File:** `/Go_BARRY/components/messaging/EmailCentre.jsx`

**Features:**
- iframe to `https://outlook.office365.com/mail/`
- Integration with existing Microsoft 365 auth (reuse from roadworks)
- Full email functionality for director communications

---

## Phase 3: Template System ✅❌

### 3.1 Template Storage (Convex)
**File:** `/Go_BARRY/convex/schema.ts`

**New Table:**
```typescript
messageTemplates: defineTable({
  name: v.string(),
  category: v.string(), // "diversion", "closure", "incident", "custom"
  subject: v.string(),
  content: v.string(),
  routes: v.optional(v.array(v.string())), // Affected routes
  isUrgent: v.boolean(),
  createdBy: v.string(), // Supervisor badge
  createdAt: v.number(),
  lastUsed: v.optional(v.number()),
  useCount: v.number(),
})
```

### 3.2 Template Functions
**File:** `/Go_BARRY/convex/templates.ts`

**Functions:**
- `getTemplates()` - Get all templates
- `createTemplate()` - Create new template
- `updateTemplate()` - Edit existing template
- `deleteTemplate()` - Remove template
- `recordTemplateUsage()` - Track usage stats

### 3.3 Template Manager Component
**File:** `/Go_BARRY/components/messaging/TemplateManager.jsx`

**Features:**
- List all templates by category
- **Create/edit/delete templates** (all supervisors can create/edit)
- Preview template content
- Usage statistics
- High Level Bridge template (pre-loaded)
- **Global template sharing** - templates created by any supervisor available to all
- **Add templates as needed** - build common scenarios incrementally

### Component Interface
- Props: none (reads from Convex via useMessageTemplates hook)
- Internal State: templateList (filtered by category), selectedTemplate
- Dependencies: useMessageTemplates (Convex sync), StyleSheet, Text, View

### 3.4 Template Integration Hook
**File:** `/Go_BARRY/components/hooks/useMessageTemplates.js`

**Features:**
- React hook for template operations
- Real-time template sync via Convex
- Template usage tracking

---

## Phase 4: Alert Integration ✅❌

### 4.1 Quick Actions Component
**File:** `/Go_BARRY/components/messaging/QuickActions.jsx`

**Features:**
- "Alert from Roadwork" button - opens active roadworks list
- "Alert from Incident" button - opens active alerts list
- "Custom Message" button - blank template
- Template selector dropdown

### 4.2 Alert-to-Message Generator
**File:** `/Go_BARRY/components/messaging/AlertMessageGenerator.jsx`

**Features:**
- Select active alert/roadwork
- Auto-generate message content based on:
  - Location (road/junction)
  - Severity
  - **System-suggested routes** (via GTFS analysis)
  - Duration estimate
- **Manual route selection** by supervisor (final decision)
- **Preview generated message in modal** for copy/paste
- Route suggestions provided but supervisor makes final selection

### Component Flow
1. Supervisor selects an alert from the active list.
2. Component fetches metadata (location, severity) via API and GTFS matcher.
3. **System suggests affected routes** based on location analysis.
4. **Supervisor manually selects final routes** from suggestions + full route list.
5. Message content auto-generated and **displayed in modal for copy/paste**.
6. Supervisor copies message and pastes into appropriate iframe.

**Message Generation Logic:**
```javascript
// Example for roadwork alert
const generateRoadworkMessage = (roadwork) => {
  const subject = `ROADWORK DISRUPTION - ${roadwork.location}`;
  const content = `
ROADWORK NOTIFICATION:
Location: ${roadwork.location}
Affected Routes: ${affectedRoutes.join(', ')}
Duration: ${roadwork.startDate} to ${roadwork.endDate}
Severity: ${roadwork.priority}

Recommended Action: ${generateDiversion(roadwork.location)}
  `;
  return { subject, content };
};
```
## 🔄 Message Lifecycle Flow
1. Supervisor triggers message creation via quick action, template, or alert.
2. Message content is generated using alert metadata or templates.
3. **System suggests affected routes, supervisor manually selects final routes.**
4. **Message displayed in modal with copy button** for easy transfer.
5. **Supervisor copies message and pastes into iframe** (Ticketer/Passenger Cloud).
6. Message is saved in Convex `messageHistory`, including metadata.
7. `recordTemplateUsage()` updates template stats.
8. `messageAudit.js` logs activity with supervisor ID and timestamp.
## 🔐 Security & Permissions
- All components are restricted to authenticated supervisors.
- Microsoft 365 iframe inherits current session (no manual login required).
- Badge IDs must be validated before showing content.
- **All supervisors can create/edit/delete templates** (shared globally).
- **Testing restricted to Anthony's account** during development.
- **Test accounts available in Ticketer** for safe testing.

### 4.3 Backend API Endpoint
**File:** `/backend/routes/messageAPI.js`

**Endpoints:**
- `GET /api/messages/active-alerts` - Get alerts suitable for messaging
- `GET /api/messages/active-roadworks` - Get roadworks suitable for messaging
- `POST /api/messages/generate` - Generate message from alert/roadwork
- `GET /api/messages/history` - Get sent message history

---

## Phase 5: Route Analysis Integration ✅❌

### 5.1 Route Impact Analyzer
**File:** `/Go_BARRY/components/messaging/RouteImpactAnalyzer.jsx`

**Features:**
- Input: roadwork/incident location
- Output: list of affected Go North East routes
- Integration with existing enhancedGTFSMatcher.js
- Visual map showing affected routes (optional)

### 5.2 Enhanced GTFS Integration
**File:** `/backend/services/enhancedGTFSMatcher.js`

**New Function:**
```javascript
export const getAffectedRoutes = async (location, radius = 500) => {
  // Find routes within radius of incident
  // Return route numbers, affected stops, diversion suggestions
};
```

### 5.3 Diversion Suggestions
**File:** `/Go_BARRY/components/messaging/DiversionSuggestions.jsx`

**Features:**
- Based on location and affected routes
- Pre-written diversion instructions for common scenarios
- Integration with route shapes data
- Editable suggestions before sending

---

## Phase 6: Message History & Audit ✅❌

### 6.1 Message History Storage
**File:** `/Go_BARRY/convex/schema.ts`

**New Table:**
```typescript
messageHistory: defineTable({
  messageId: v.string(),
  type: v.string(), // "driver", "customer", "email"
  subject: v.string(),
  content: v.string(),
  recipients: v.array(v.string()),
  sentBy: v.string(), // Supervisor badge
  sentAt: v.number(),
  templateUsed: v.optional(v.string()),
  alertSource: v.optional(v.string()), // Alert/roadwork ID
  platform: v.string(), // "ticketer", "passenger-cloud", "outlook"
})
```

### 6.2 History Component
**File:** `/Go_BARRY/components/messaging/MessageHistory.jsx`

**Features:**
- Sidebar showing recent messages
- Filter by type, supervisor, date
- Search functionality
- Message preview/details
- Resend capability

### 6.3 Audit Trail Integration
**File:** `/backend/services/messageAudit.js`

**Features:**
- Log all message activities
- Integration with existing supervisor audit system
- Compliance reporting

---

## Phase 7: Polish & Advanced Features ✅❌

### 7.1 Real-time Collaboration
**Features:**
- Show which supervisor is composing messages
- Prevent duplicate messages
- Message coordination via Convex

### 7.2 Message Scheduling
**Features:**
- Schedule messages for future delivery
- Recurring message templates
- Bulk message operations

### 7.3 Message Analytics
**Features:**
- Template usage statistics
- Response time metrics
- Most common disruption types
- Supervisor activity dashboard

### 7.4 Mobile Optimisation
**Features:**
- Responsive design for mobile supervisors
- Touch-friendly interface
- Offline template caching

---

## 🔧 Technical Implementation Details

### File Structure
```
/Go_BARRY/components/
├── MessageDistribution.jsx (Main component)
├── messaging/
│   ├── MessageTabs.jsx
│   ├── DriverMessaging.jsx
│   ├── CustomerMessaging.jsx
│   ├── EmailCentre.jsx
│   ├── TemplateManager.jsx
│   ├── QuickActions.jsx
│   ├── AlertMessageGenerator.jsx
│   ├── RouteImpactAnalyzer.jsx
│   ├── DiversionSuggestions.jsx
│   └── MessageHistory.jsx
├── hooks/
│   └── useMessageTemplates.js
```

### Backend API Routes
```
/backend/routes/
└── messageAPI.js

Endpoints:
- GET /api/messages/templates
- POST /api/messages/templates
- PUT /api/messages/templates/:id
- DELETE /api/messages/templates/:id
- GET /api/messages/active-alerts
- GET /api/messages/active-roadworks
- POST /api/messages/generate
- GET /api/messages/history
- POST /api/messages/log
```

### Convex Schema Updates
```
/Go_BARRY/convex/
├── schema.ts (add messageTemplates, messageHistory)
├── templates.ts (template CRUD operations)
└── messages.ts (message history operations)
```

### Styling Guidelines
- Use StyleSheet.create()
- Maintain accessibility: high-contrast text, responsive tap areas
- Platform.OS checks required for iframe usage (web-only)
- Consistent with existing Go BARRY design
- Blue (#2563eb) for primary actions
- Red (#dc2626) for urgent messages
- Grey (#6b7280) for secondary elements
- Responsive design for different screen sizes

### Integration Points
- **useSupervisorSession:** Current supervisor context
- **useConvexSync:** Real-time alerts and roadworks
- **enhancedGTFSMatcher:** Route analysis
- **Microsoft 365 auth:** Email integration
- **Existing audit system:** Message logging

---

## 🧪 Testing Checklist

### Phase 1 Testing
- [ ] Component renders without errors
- [ ] Tab navigation works
- [ ] Responsive design on different screen sizes
- [ ] Integration with supervisor session

### Phase 2 Testing
- [ ] All iframes load correctly
- [ ] No CORS errors
- [ ] Iframe sizing appropriate
- [ ] Refresh functionality works

### Phase 3 Testing
- [ ] Templates save to Convex
- [ ] Template CRUD operations work
- [ ] High Level Bridge template pre-loaded
- [ ] Template sharing across supervisors

### Phase 4 Testing
- [ ] Alert selection populates message
- [ ] Roadwork selection populates message
- [ ] Generated messages are accurate
- [ ] UK English language throughout

### Phase 5 Testing
- [ ] Route analysis identifies correct routes
- [ ] GTFS integration works
- [ ] Diversion suggestions are logical
- [ ] Location input handles various formats

### Phase 6 Testing
- [ ] Message history saves correctly
- [ ] Audit trail captures all actions
- [ ] History search and filter work
- [ ] Supervisor attribution correct

### Phase 7 Testing
- [ ] Real-time features work across multiple browsers
- [ ] Performance acceptable with large message history
- [ ] Mobile interface usable
- [ ] All features accessible to supervisors

---

## 🚀 Deployment Plan

### Development Phase
1. Create components locally
2. Test with mock data
3. Integrate with Convex development environment
4. Test iframe integrations

### Staging Phase
1. Deploy to Convex production
2. Test with real supervisor accounts
3. Verify external system integrations
4. Load test with multiple supervisors

### Production Phase
1. Deploy to main Go BARRY application
2. Train supervisors on new functionality
3. Monitor usage and performance
4. Collect feedback for improvements

---

## 📝 Success Metrics

### Functional Metrics
- [ ] All 9 supervisors can access the system
- [ ] Templates load and save correctly
- [ ] Alert integration populates accurate messages
- [ ] Route analysis identifies correct affected routes
- [ ] Message history maintains full audit trail

### Performance Metrics
- [ ] Page loads in under 3 seconds
- [ ] Iframe integrations load in under 5 seconds
- [ ] Template operations complete in under 1 second
- [ ] System handles 20+ concurrent supervisors

### User Experience Metrics
- [ ] Supervisors can create messages in under 2 minutes
- [ ] Common scenarios (High Level Bridge) take under 30 seconds
- [ ] No need for external documentation/training
- [ ] Reduces time spent on manual message creation by 70%

---

## 🔄 Future Enhancements

### Phase 8: Advanced Automation
- AI-powered message suggestions
- Automatic template creation from frequent messages
- Integration with traffic prediction systems
- Voice-to-text message creation

### Phase 9: Customer Integration
- Two-way customer feedback system
- Real-time passenger information updates
- Social media integration
- Mobile app notifications

### Phase 10: Analytics & Reporting
- Message effectiveness tracking
- Customer satisfaction metrics
- Operational impact analysis
- Predictive messaging recommendations

---

## 📋 Implementation Checklist

Copy this checklist to track progress:

**Phase 1: Core Interface**
- [ ] MessageDistribution.jsx created
- [ ] MessageTabs.jsx created  
- [ ] Navigation updated
- [ ] Basic styling complete
- [ ] Tab switching works

**Phase 2: External Integration**
- [ ] DriverMessaging.jsx with Ticketer iframe
- [ ] CustomerMessaging.jsx with Passenger Cloud iframe
- [ ] EmailCentre.jsx with Outlook iframe
- [ ] All iframes load correctly
- [ ] Responsive sizing complete

**Phase 3: Template System**
- [ ] Convex schema updated
- [ ] Template CRUD functions created
- [ ] TemplateManager.jsx complete
- [ ] useMessageTemplates.js hook created
- [ ] High Level Bridge template loaded

**Phase 4: Alert Integration**
- [ ] QuickActions.jsx created
- [ ] AlertMessageGenerator.jsx complete
- [ ] Backend message API created
- [ ] Alert-to-message logic working
- [ ] Message preview functionality

**Phase 5: Route Analysis**
- [ ] RouteImpactAnalyzer.jsx created
- [ ] GTFS integration enhanced
- [ ] DiversionSuggestions.jsx complete
- [ ] Route analysis API endpoints
- [ ] Location parsing working

**Phase 6: History & Audit**
- [ ] Message history Convex schema
- [ ] MessageHistory.jsx complete
- [ ] Audit trail integration
- [ ] Search and filter functionality
- [ ] Message logging working

**Phase 7: Polish**
- [ ] Real-time collaboration features
- [ ] Mobile optimisation
- [ ] Performance optimisation
- [ ] User testing complete
- [ ] Documentation updated

**Testing & Deployment**
- [ ] All unit tests passing
- [ ] Integration tests complete
- [ ] Supervisor acceptance testing
- [ ] Production deployment
- [ ] Monitoring and feedback collection

---

Ready to begin implementation? Start with Phase 1: Core Interface Structure.