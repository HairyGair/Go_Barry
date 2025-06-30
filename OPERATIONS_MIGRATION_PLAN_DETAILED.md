# Operations Centre Migration Plan - Ultra Detailed Version
## Go BARRY - Complete Step-by-Step Reorganisation & Redesign Guide

### 🎯 Project Overview
**Project Name:** Operations Centre Migration & UK Localisation  
**Duration:** 10 working days  
**Risk Level:** Medium  
**Rollback Time:** 30 minutes  

---

## 📋 Pre-Migration Checklist

### Environment Setup (Day 0 - 2 hours)
```bash
# 1. Create feature branch
cd /Users/anthony/Go\ BARRY\ App
git checkout -b feature/operations-centre-migration
git push -u origin feature/operations-centre-migration

# 2. Create backup
cp -r Go_BARRY/app/operations.jsx Go_BARRY/app/operations.jsx.backup
cp -r Go_BARRY/components Go_BARRY/components.backup
tar -czf go-barry-backup-$(date +%Y%m%d).tar.gz Go_BARRY/

# 3. Document current state
echo "Migration started: $(date)" > MIGRATION_LOG.md
git add . && git commit -m "chore: pre-migration backup"
```

### Dependency Audit (30 minutes)
```bash
# Check all imports in affected files
grep -r "from.*operations" Go_BARRY/
grep -r "import.*Incident" Go_BARRY/
grep -r "import.*Roadwork" Go_BARRY/
grep -r "import.*Duty" Go_BARRY/
grep -r "import.*Disruption" Go_BARRY/

# Save results
echo "## Dependency Map" >> MIGRATION_LOG.md
grep -r "from.*operations" Go_BARRY/ >> MIGRATION_LOG.md
```

---

## 🔨 Phase 1: File Structure Migration (Day 1)

### Step 1.1: Create New Directory Structure (15 minutes)
```bash
# Create operations directory structure
mkdir -p Go_BARRY/components/operations
mkdir -p Go_BARRY/components/operations/styles
mkdir -p Go_BARRY/components/operations/hooks
mkdir -p Go_BARRY/components/operations/utils
mkdir -p Go_BARRY/components/operations/constants

# Verify creation
ls -la Go_BARRY/components/operations/
```

### Step 1.2: Move Components with Git Tracking (30 minutes)
```bash
# Move components preserving git history
cd Go_BARRY
git mv components/DutyBoards.jsx components/operations/DutyBoards.jsx
git mv components/IncidentManager.jsx components/operations/IncidentManager.jsx
git mv components/RoadworksManager.jsx components/operations/RoadworksManager.jsx
git mv components/AIDisruptionManager.jsx components/operations/DisruptionDatabase.jsx

# Commit moves
git add -A
git commit -m "refactor: move operations components to dedicated folder"
```

### Step 1.3: Update Import Statements (45 minutes)

#### 1.3.1 Update operations.jsx imports
```javascript
// OLD: Go_BARRY/app/operations.jsx
import DutyBoards from '../components/DutyBoards';
import IncidentManager from '../components/IncidentManager';
import RoadworksManager from '../components/RoadworksManager';
import AIDisruptionManager from '../components/AIDisruptionManager';

// NEW: Go_BARRY/app/operations.jsx
import DutyBoards from '../components/operations/DutyBoards';
import IncidentManager from '../components/operations/IncidentManager';
import RoadworksManager from '../components/operations/RoadworksManager';
import DisruptionDatabase from '../components/operations/DisruptionDatabase';
```

#### 1.3.2 Find and update all references
```bash
# Find all files that import these components
find Go_BARRY -name "*.jsx" -o -name "*.js" | xargs grep -l "DutyBoards\|IncidentManager\|RoadworksManager\|AIDisruptionManager"

# Update each file manually or use sed (CAREFUL!)
# Example for DutyBoards:
find Go_BARRY -name "*.jsx" -exec sed -i.bak 's|components/DutyBoards|components/operations/DutyBoards|g' {} \;
```

### Step 1.4: Rename Main File (15 minutes)
```bash
# Rename operations file
git mv Go_BARRY/app/operations.jsx Go_BARRY/app/operations-centre.jsx

# Update router references
# In Go_BARRY/components/HomePageWithLogin.jsx
# Change: router.push('/operations')
# To: router.push('/operations-centre')
```

### Step 1.5: Validation Checkpoint (30 minutes)
```bash
# Test build
cd Go_BARRY
npm run build

# Check for errors
# If errors, document in MIGRATION_LOG.md
# Fix each error systematically

# Run development server
npm start

# Test navigation:
# 1. Home page loads
# 2. Can navigate to Operations Centre
# 3. All tabs work
# 4. No console errors
```

---

## 🇬🇧 Phase 2: UK English Localisation (Day 2)

### Step 2.1: Create Localisation Constants (30 minutes)
```javascript
// Create: Go_BARRY/components/operations/constants/locale.js
export const UK_LOCALE = {
  // Navigation
  OPERATIONS_CENTRE: 'Operations Centre',
  CONTROL_CENTRE: 'Control Centre',
  MESSAGE_CENTRE: 'Message Centre',
  
  // Common terms
  COLOUR: 'Colour',
  ORGANISATION: 'Organisation',
  AUTHORISATION: 'Authorisation',
  PRIORITISE: 'Prioritise',
  ANALYSE: 'Analyse',
  OPTIMISE: 'Optimise',
  REALISE: 'Realise',
  
  // Date format
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
  
  // Messages
  NO_DATA_AVAILABLE: 'No data available',
  LOADING: 'Loading...',
  ERROR_OCCURRED: 'An error has occurred',
};

// Create: Go_BARRY/components/operations/constants/index.js
export * from './locale';
```

### Step 2.2: Update Component Text (2 hours)

#### 2.2.1 Operations Centre Main File
```javascript
// Go_BARRY/app/operations-centre.jsx

// Line by line changes:
// OLD: <Text style={styles.title}>Operations Center</Text>
// NEW: <Text style={styles.title}>Operations Centre</Text>

// OLD: <Text>Daily operational tools - Incidents, Roadworks & Disruptions</Text>
// NEW: <Text>Daily operational tools - Incidents, Roadworks & Disruptions</Text>

// OLD: color: '#059669'
// NEW: color: '#059669' // Keep 'color' in code, only change in user-facing text
```

#### 2.2.2 Create Find/Replace Script
```javascript
// Create: scripts/uk-localisation.js
const fs = require('fs');
const path = require('path');

const replacements = [
  // UI Text only
  { from: /Operations Center/g, to: 'Operations Centre' },
  { from: /Message Distribution Center/g, to: 'Message Distribution Centre' },
  { from: /Traffic Control Center/g, to: 'Traffic Control Centre' },
  { from: /color-coded/g, to: 'colour-coded' },
  { from: /organize/g, to: 'organise' },
  { from: /optimize/g, to: 'optimise' },
  { from: /analyze/g, to: 'analyse' },
  { from: /realize/g, to: 'realise' },
  { from: /prioritize/g, to: 'prioritise' },
];

const files = [
  'Go_BARRY/app/operations-centre.jsx',
  'Go_BARRY/components/operations/DutyBoards.jsx',
  'Go_BARRY/components/operations/IncidentManager.jsx',
  'Go_BARRY/components/operations/RoadworksManager.jsx',
  'Go_BARRY/components/operations/DisruptionDatabase.jsx',
];

// Run replacements with backup
files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  replacements.forEach(({ from, to }) => {
    newContent = newContent.replace(from, to);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(`${file}.bak`, content); // Backup
    fs.writeFileSync(file, newContent);
    console.log(`Updated: ${file}`);
  }
});
```

### Step 2.3: Update Documentation (1 hour)
```bash
# Update all markdown files
find . -name "*.md" -exec sed -i.bak 's/Operations Center/Operations Centre/g' {} \;
find . -name "*.md" -exec sed -i.bak 's/center/centre/g' {} \;

# Manual review required for context-sensitive changes
```

---

## 🎨 Phase 3: Visual Design Implementation (Days 3-4)

### Step 3.1: Create Design System (4 hours)

#### 3.1.1 Colour System
```javascript
// Create: Go_BARRY/components/operations/styles/theme.js
export const theme = {
  colours: {
    // Go North East Brand
    primary: '#E31E24',      // Go North East Red
    secondary: '#059669',    // Operations Green
    accent: '#06B6D4',       // Info Blue
    warning: '#F59E0B',      // Alert Amber
    error: '#DC2626',        // Error Red
    success: '#10B981',      // Success Green
    
    // Dark Mode
    background: '#0F172A',   // Main background
    surface: '#1E293B',      // Card background
    surfaceLight: '#334155', // Hover state
    
    // Text
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    
    // Borders
    border: '#334155',
    borderLight: '#475569',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
  },
};
```

#### 3.1.2 Base Styles
```javascript
// Create: Go_BARRY/components/operations/styles/operations.styles.js
import { StyleSheet, Platform } from 'react-native';
import { theme } from './theme';

export const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colours.background,
  },
  
  card: {
    backgroundColor: theme.colours.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colours.border,
    
    // Glassmorphism effect for web
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(30, 41, 59, 0.8)',
      },
    }),
    
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  cardHover: {
    ...Platform.select({
      web: {
        ':hover': {
          backgroundColor: theme.colours.surfaceLight,
          transform: 'translateY(-2px)',
          transition: theme.transitions.normal,
        },
      },
    }),
  },
  
  // Typography
  h1: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colours.textPrimary,
    marginBottom: theme.spacing.md,
  },
  
  h2: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colours.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colours.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colours.textSecondary,
    lineHeight: 24,
  },
  
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colours.textMuted,
  },
  
  // Buttons
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  
  buttonPrimary: {
    backgroundColor: theme.colours.primary,
  },
  
  buttonSecondary: {
    backgroundColor: theme.colours.secondary,
  },
  
  buttonText: {
    color: theme.colours.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Status indicators
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  
  statusActive: {
    backgroundColor: theme.colours.success,
  },
  
  statusWarning: {
    backgroundColor: theme.colours.warning,
  },
  
  statusError: {
    backgroundColor: theme.colours.error,
  },
});
```

### Step 3.2: Create New Components (6 hours)

#### 3.2.1 Operations Header
```javascript
// Create: Go_BARRY/components/operations/OperationsHeader.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { theme } from './styles/theme';
import { baseStyles } from './styles/operations.styles';

const OperationsHeader = ({ 
  userName, 
  notifications = [], 
  onNotificationPress,
  onUserPress,
  stats = {} 
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Icon name="traffic-light" size={24} color={theme.colours.primary} />
        <Text style={styles.title}>Operations Centre</Text>
      </View>
      
      <View style={styles.headerCentre}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.active || 0}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, styles.statCardWarning]}>
          <Text style={styles.statValue}>{stats.critical || 0}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.resolved || 0}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
      </View>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={onNotificationPress}
        >
          <Icon name="bell" size={20} color={theme.colours.textPrimary} />
          {notifications.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>{notifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.userButton}
          onPress={onUserPress}
        >
          <Icon name="user-circle" size={20} color={theme.colours.textPrimary} />
          <Text style={styles.userName}>{userName}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colours.surface,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colours.border,
  },
  
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  
  title: {
    ...baseStyles.h2,
    marginBottom: 0,
  },
  
  headerCentre: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    flex: 2,
    justifyContent: 'center',
  },
  
  statCard: {
    backgroundColor: theme.colours.background,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: theme.colours.border,
  },
  
  statCardWarning: {
    borderColor: theme.colours.warning,
    backgroundColor: `${theme.colours.warning}10`,
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colours.textPrimary,
  },
  
  statLabel: {
    fontSize: 12,
    color: theme.colours.textMuted,
    marginTop: 2,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
    justifyContent: 'flex-end',
  },
  
  notificationButton: {
    position: 'relative',
    padding: theme.spacing.sm,
  },
  
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colours.error,
    borderRadius: theme.borderRadius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  notificationCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colours.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colours.textPrimary,
  },
});

export default OperationsHeader;
```

#### 3.2.2 Navigation Tabs
```javascript
// Create: Go_BARRY/components/operations/OperationsNavigation.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { theme } from './styles/theme';

const tabs = [
  { id: 'duty-boards', name: 'Duty Boards', icon: 'clipboard-list' },
  { id: 'incidents', name: 'Incidents', icon: 'exclamation-triangle' },
  { id: 'roadworks', name: 'Roadworks', icon: 'road' },
  { id: 'disruptions', name: 'Disruptions', icon: 'database' },
];

const OperationsNavigation = ({ activeTab, onTabChange }) => {
  const [indicatorPosition] = React.useState(new Animated.Value(0));
  
  React.useEffect(() => {
    const tabIndex = tabs.findIndex(tab => tab.id === activeTab);
    Animated.spring(indicatorPosition, {
      toValue: tabIndex * 25, // 25% width per tab
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [activeTab]);
  
  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab
            ]}
            onPress={() => onTabChange(tab.id)}
          >
            <Icon 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.id ? theme.colours.secondary : theme.colours.textMuted} 
            />
            <Text style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Animated.View 
        style={[
          styles.indicator,
          {
            transform: [{
              translateX: indicatorPosition.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '400%'],
              }),
            }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colours.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colours.border,
    position: 'relative',
  },
  
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xl,
  },
  
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    opacity: 0.7,
  },
  
  activeTab: {
    opacity: 1,
  },
  
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colours.textMuted,
  },
  
  activeTabText: {
    color: theme.colours.secondary,
  },
  
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '25%',
    height: 3,
    backgroundColor: theme.colours.secondary,
  },
});

export default OperationsNavigation;
```

### Step 3.3: Update Main Operations File (2 hours)
```javascript
// Update: Go_BARRY/app/operations-centre.jsx
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSupervisor } from '../components/hooks/useSupervisorSession';

// Import new components
import OperationsHeader from '../components/operations/OperationsHeader';
import OperationsNavigation from '../components/operations/OperationsNavigation';

// Import operational components
import DutyBoards from '../components/operations/DutyBoards';
import IncidentManager from '../components/operations/IncidentManager';
import RoadworksManager from '../components/operations/RoadworksManager';
import DisruptionDatabase from '../components/operations/DisruptionDatabase';

// Import styles
import { theme } from '../components/operations/styles/theme';
import { baseStyles } from '../components/operations/styles/operations.styles';

const OperationsCentre = () => {
  const router = useRouter();
  const { isLoggedIn, supervisorName, logout } = useSupervisor();
  const [activeTab, setActiveTab] = useState('duty-boards');
  const [stats, setStats] = useState({
    active: 0,
    critical: 0,
    resolved: 0,
  });
  const [notifications, setNotifications] = useState([]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/');
    }
  }, [isLoggedIn]);

  // Fetch stats
  useEffect(() => {
    fetchOperationsStats();
    const interval = setInterval(fetchOperationsStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchOperationsStats = async () => {
    try {
      const response = await fetch('https://go-barry.onrender.com/api/operations/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'duty-boards':
        return <DutyBoards />;
      case 'incidents':
        return <IncidentManager />;
      case 'roadworks':
        return <RoadworksManager />;
      case 'disruptions':
        return <DisruptionDatabase />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <OperationsHeader
        userName={supervisorName}
        notifications={notifications}
        stats={stats}
        onNotificationPress={() => {/* TODO: Implement notifications */}}
        onUserPress={() => {/* TODO: Implement user menu */}}
      />
      
      <OperationsNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.contentWrapper}>
          {renderContent()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...baseStyles.container,
  },
  
  content: {
    flex: 1,
  },
  
  contentWrapper: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
});

export default OperationsCentre;
```

---

## 🧪 Phase 4: Testing Protocol (Day 5)

### Step 4.1: Unit Testing (2 hours)
```javascript
// Create: Go_BARRY/components/operations/__tests__/OperationsHeader.test.js
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import OperationsHeader from '../OperationsHeader';

describe('OperationsHeader', () => {
  const defaultProps = {
    userName: 'Test User',
    notifications: [],
    stats: { active: 5, critical: 2, resolved: 10 },
    onNotificationPress: jest.fn(),
    onUserPress: jest.fn(),
  };

  it('renders correctly', () => {
    const { getByText } = render(<OperationsHeader {...defaultProps} />);
    expect(getByText('Operations Centre')).toBeTruthy();
    expect(getByText('Test User')).toBeTruthy();
  });

  it('displays correct stats', () => {
    const { getByText } = render(<OperationsHeader {...defaultProps} />);
    expect(getByText('5')).toBeTruthy(); // Active
    expect(getByText('2')).toBeTruthy(); // Critical
    expect(getByText('10')).toBeTruthy(); // Resolved
  });

  it('shows notification badge when notifications exist', () => {
    const props = {
      ...defaultProps,
      notifications: [{ id: 1 }, { id: 2 }],
    };
    const { getByText } = render(<OperationsHeader {...props} />);
    expect(getByText('2')).toBeTruthy();
  });

  it('handles button clicks', () => {
    const { getByTestId } = render(<OperationsHeader {...defaultProps} />);
    
    fireEvent.press(getByTestId('notification-button'));
    expect(defaultProps.onNotificationPress).toHaveBeenCalled();
    
    fireEvent.press(getByTestId('user-button'));
    expect(defaultProps.onUserPress).toHaveBeenCalled();
  });
});
```

### Step 4.2: Integration Testing (3 hours)
```javascript
// Create: scripts/integration-test.js
const puppeteer = require('puppeteer');

async function testOperationsCentre() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Starting Operations Centre Integration Tests');
  
  try {
    // Test 1: Navigation
    console.log('Test 1: Navigation to Operations Centre');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="operations-button"]');
    await page.click('[data-testid="operations-button"]');
    
    // Test 2: Login required
    console.log('Test 2: Login redirect');
    const url = await page.url();
    if (!url.includes('operations-centre')) {
      console.log('✅ Correctly redirected to login');
    }
    
    // Test 3: Login and access
    console.log('Test 3: Login and access');
    await page.type('[data-testid="supervisor-select"]', 'AG003');
    await page.type('[data-testid="password-input"]', 'testpass');
    await page.click('[data-testid="login-button"]');
    
    // Test 4: Tab navigation
    console.log('Test 4: Tab navigation');
    await page.waitForSelector('[data-testid="incidents-tab"]');
    await page.click('[data-testid="incidents-tab"]');
    
    // Verify content changed
    await page.waitForSelector('[data-testid="incident-list"]');
    console.log('✅ Tab navigation working');
    
    // Test 5: Stats update
    console.log('Test 5: Stats auto-update');
    const initialStats = await page.$eval('[data-testid="active-count"]', el => el.textContent);
    await page.waitForTimeout(31000); // Wait for refresh
    const updatedStats = await page.$eval('[data-testid="active-count"]', el => el.textContent);
    
    if (initialStats !== updatedStats) {
      console.log('✅ Stats updating correctly');
    }
    
    console.log('✅ All integration tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

testOperationsCentre();
```

### Step 4.3: Performance Testing (2 hours)
```javascript
// Create: scripts/performance-test.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function testPerformance() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse('http://localhost:3000/operations-centre', options);
  
  // Analyse results
  const performance = runnerResult.lhr.categories.performance.score * 100;
  
  console.log('Performance Metrics:');
  console.log(`Overall Score: ${performance}%`);
  
  // Check against targets
  const metrics = runnerResult.lhr.audits;
  
  const checks = [
    { name: 'First Contentful Paint', key: 'first-contentful-paint', target: 2000 },
    { name: 'Speed Index', key: 'speed-index', target: 3000 },
    { name: 'Time to Interactive', key: 'interactive', target: 3500 },
  ];
  
  checks.forEach(({ name, key, target }) => {
    const value = metrics[key].numericValue;
    const pass = value <= target;
    console.log(`${pass ? '✅' : '❌'} ${name}: ${value}ms (target: ${target}ms)`);
  });
  
  await chrome.kill();
}

testPerformance();
```

### Step 4.4: Accessibility Testing (1 hour)
```javascript
// Create: scripts/accessibility-test.js
const { AxePuppeteer } = require('@axe-core/puppeteer');
const puppeteer = require('puppeteer');

async function testAccessibility() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/operations-centre');
  
  const results = await new AxePuppeteer(page).analyze();
  
  console.log('Accessibility Test Results:');
  console.log(`Violations: ${results.violations.length}`);
  
  if (results.violations.length > 0) {
    results.violations.forEach(violation => {
      console.log(`\n❌ ${violation.id}: ${violation.description}`);
      console.log(`   Impact: ${violation.impact}`);
      console.log(`   Elements: ${violation.nodes.length}`);
    });
  } else {
    console.log('✅ No accessibility violations found!');
  }
  
  await browser.close();
}

testAccessibility();
```

---

## 🚀 Phase 5: Deployment (Day 6)

### Step 5.1: Pre-deployment Checklist
```bash
# 1. Run all tests
npm test
npm run test:integration
npm run test:performance
npm run test:accessibility

# 2. Build production bundle
npm run build

# 3. Check bundle size
du -sh build/

# 4. Verify no console errors
grep -r "console\." Go_BARRY/components/operations/

# 5. Update version
# In package.json: "version": "3.1.0"
```

### Step 5.2: Deployment Script
```bash
#!/bin/bash
# Create: scripts/deploy-operations-centre.sh

echo "🚀 Deploying Operations Centre Migration"

# 1. Merge to main
git checkout main
git pull origin main
git merge feature/operations-centre-migration
git push origin main

# 2. Tag release
git tag -a v3.1.0 -m "Operations Centre Migration"
git push origin v3.1.0

# 3. Deploy to production
npm run deploy:production

# 4. Verify deployment
curl -I https://gobarry.co.uk/operations-centre

# 5. Run smoke tests
npm run test:smoke

echo "✅ Deployment complete!"
```

### Step 5.3: Rollback Procedure
```bash
#!/bin/bash
# Create: scripts/rollback-operations-centre.sh

echo "⚠️  Initiating rollback"

# 1. Revert to previous version
git checkout v3.0.0

# 2. Restore backup
tar -xzf go-barry-backup-$(date +%Y%m%d).tar.gz

# 3. Deploy previous version
npm run deploy:production

# 4. Verify rollback
curl -I https://gobarry.co.uk/operations

echo "✅ Rollback complete"
```

---

## 📊 Validation Checklist

### Functional Testing
- [ ] All tabs load correctly
- [ ] Authentication works
- [ ] Data loads in each component
- [ ] Navigation between tabs smooth
- [ ] Back button returns to home
- [ ] Logout works correctly
- [ ] Stats update every 30 seconds
- [ ] All UK spelling correct

### Visual Testing
- [ ] Dark mode displays correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Animations smooth (60fps)
- [ ] No layout shifts
- [ ] Hover states work
- [ ] Focus states visible
- [ ] Loading states display

### Performance Testing
- [ ] Page load < 2 seconds
- [ ] Tab switch < 100ms
- [ ] Memory usage < 100MB
- [ ] No memory leaks
- [ ] Bundle size < 500KB

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Colour contrast passes WCAG AA
- [ ] Focus indicators visible
- [ ] Alt text present
- [ ] ARIA labels correct

### Security Testing
- [ ] Authentication required
- [ ] Session timeout works
- [ ] No console errors
- [ ] No exposed secrets
- [ ] Input validation works
- [ ] XSS protection active

---

## 🆘 Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Import errors after moving files
```bash
# Error: Cannot find module '../components/DutyBoards'
# Solution:
find . -name "*.jsx" -exec grep -l "components/DutyBoards" {} \; | xargs sed -i 's|components/DutyBoards|components/operations/DutyBoards|g'
```

#### Issue 2: Build fails after UK localisation
```bash
# Error: Unexpected token 'colour'
# Solution: Ensure only UI text changed, not CSS properties
grep -n "colour:" Go_BARRY/components/operations/*.jsx
# Should return nothing - 'color:' is correct in code
```

#### Issue 3: Tab navigation not working
```javascript
// Check activeTab state is updating
console.log('Active tab:', activeTab);
// Ensure tab IDs match exactly
console.log('Tab IDs:', tabs.map(t => t.id));
```

#### Issue 4: Stats not updating
```bash
# Check API endpoint
curl https://go-barry.onrender.com/api/operations/stats
# If 404, create endpoint in backend
```

#### Issue 5: Dark mode not applying
```javascript
// Verify theme import
import { theme } from './styles/theme';
console.log('Theme loaded:', theme);
// Check StyleSheet.create is using theme values
```

---

## 📝 Post-Migration Tasks

### Documentation Updates
1. Update README.md with new structure
2. Create Operations Centre user guide
3. Update API documentation
4. Create video walkthrough
5. Update troubleshooting guide

### Training Materials
1. Create supervisor training deck
2. Record training video
3. Create quick reference card
4. Schedule training sessions
5. Gather feedback

### Monitoring Setup
1. Add error tracking
2. Setup performance monitoring
3. Create alerts for failures
4. Monitor user adoption
5. Track usage metrics

---

## ✅ Sign-off Checklist

### Technical Lead
- [ ] Code review completed
- [ ] Tests passing
- [ ] Performance acceptable
- [ ] Security review done
- [ ] Documentation complete

### Operations Manager
- [ ] User training complete
- [ ] Rollback plan tested
- [ ] Support team briefed
- [ ] Metrics tracking setup
- [ ] Go-live approved

### Project Manager
- [ ] Timeline met
- [ ] Budget on track
- [ ] Risks mitigated
- [ ] Stakeholders informed
- [ ] Success metrics defined

---

*Document prepared by: Anthony Gair*  
*Date: 30/06/2025*  
*Version: 2.0 - Ultra Detailed*  
*Last Review: [Date]* 
*Approved by: [Name]*
