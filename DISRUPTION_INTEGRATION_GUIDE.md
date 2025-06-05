# Integration Guide: Adding Disruption Logging to BARRY

This guide shows you how to integrate the disruption logging components into your main BARRY app.

## Prerequisites ✅

Before integrating, make sure you have:

1. ✅ **Database Schema Created**: Run the SQL in `/backend/database/disruption_logs_schema.sql` in your Supabase dashboard
2. ✅ **Backend Running**: Your backend server with the new API endpoints 
3. ✅ **Dependencies Installed**: Make sure you have the required React Native dependencies

## Step 1: Install Required Dependencies

Add these dependencies to your React Native project if not already installed:

```bash
cd Go_BARRY
npm install @react-native-picker/picker
```

For iOS, also run:
```bash
cd ios && pod install
```

## Step 2: Add Environment Variable

Make sure your `.env` file (or environment config) includes:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3001  # Replace with your backend URL
```

## Step 3: Add Components to Your Main App

### Option A: Add to Enhanced Dashboard

Edit your `Go_BARRY/components/EnhancedDashboard.jsx` to include disruption logging:

```jsx
// Add these imports at the top
import DisruptionLogger from './DisruptionLogger';
import DisruptionLogViewer from './DisruptionLogViewer';
import DisruptionStatsDashboard from './DisruptionStatsDashboard';

// Add state for modal visibility in your component
const [showDisruptionLogger, setShowDisruptionLogger] = useState(false);
const [showDisruptionViewer, setShowDisruptionViewer] = useState(false);
const [showDisruptionStats, setShowDisruptionStats] = useState(false);

// Add supervisor info (you may already have this)
const supervisorInfo = {
  id: 'SUP001',           // Replace with actual supervisor ID
  name: 'John Smith',     // Replace with actual supervisor name
  depot: 'Gateshead',     // Replace with actual depot
  shift: 'Day Shift'      // Replace with actual shift
};

// Add buttons to your dashboard UI
<View style={styles.disruptionControls}>
  <TouchableOpacity
    style={styles.disruptionButton}
    onPress={() => setShowDisruptionLogger(true)}
  >
    <Text style={styles.disruptionButtonText}>📝 Log Disruption</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={styles.disruptionButton}
    onPress={() => setShowDisruptionViewer(true)}
  >
    <Text style={styles.disruptionButtonText}>📊 View Logs</Text>
  </TouchableOpacity>
  
  <TouchableOpacity
    style={styles.disruptionButton}
    onPress={() => setShowDisruptionStats(true)}
  >
    <Text style={styles.disruptionButtonText}>📈 Analytics</Text>
  </TouchableOpacity>
</View>

// Add the modal components at the bottom of your render method
<DisruptionLogger
  supervisorInfo={supervisorInfo}
  visible={showDisruptionLogger}
  onClose={() => setShowDisruptionLogger(false)}
  onLogSuccess={(logData) => {
    console.log('Disruption logged:', logData);
    // Optionally refresh your dashboard data
  }}
/>

<DisruptionLogViewer
  supervisorInfo={supervisorInfo}
  visible={showDisruptionViewer}
  onClose={() => setShowDisruptionViewer(false)}
/>

<DisruptionStatsDashboard
  supervisorInfo={supervisorInfo}
  visible={showDisruptionStats}
  onClose={() => setShowDisruptionStats(false)}
/>
```

### Option B: Create a Dedicated Disruption Screen

Create a new file `Go_BARRY/components/DisruptionManagement.jsx`:

```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DisruptionLogger from './DisruptionLogger';
import DisruptionLogViewer from './DisruptionLogViewer';
import DisruptionStatsDashboard from './DisruptionStatsDashboard';

const DisruptionManagement = ({ supervisorInfo, navigation }) => {
  const [showLogger, setShowLogger] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showStats, setShowStats] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚦 Disruption Management</Text>
        <Text style={styles.subtitle}>Log and track resolved disruptions</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.mainButton, styles.logButton]}
          onPress={() => setShowLogger(true)}
        >
          <Text style={styles.buttonIcon}>📝</Text>
          <Text style={styles.buttonTitle}>Log New Disruption</Text>
          <Text style={styles.buttonSubtitle}>Record a resolved incident</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainButton, styles.viewButton]}
          onPress={() => setShowViewer(true)}
        >
          <Text style={styles.buttonIcon}>📊</Text>
          <Text style={styles.buttonTitle}>View Logs</Text>
          <Text style={styles.buttonSubtitle}>Browse previous disruptions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainButton, styles.statsButton]}
          onPress={() => setShowStats(true)}
        >
          <Text style={styles.buttonIcon}>📈</Text>
          <Text style={styles.buttonTitle}>Analytics Dashboard</Text>
          <Text style={styles.buttonSubtitle}>Performance insights</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <DisruptionLogger
        supervisorInfo={supervisorInfo}
        visible={showLogger}
        onClose={() => setShowLogger(false)}
        onLogSuccess={() => {
          setShowLogger(false);
          // Optionally show success message or navigate
        }}
      />

      <DisruptionLogViewer
        supervisorInfo={supervisorInfo}
        visible={showViewer}
        onClose={() => setShowViewer(false)}
      />

      <DisruptionStatsDashboard
        supervisorInfo={supervisorInfo}
        visible={showStats}
        onClose={() => setShowStats(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    flex: 1,
  },
  mainButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
  },
  logButton: {
    borderLeftColor: '#34C759',
  },
  viewButton: {
    borderLeftColor: '#007AFF',
  },
  statsButton: {
    borderLeftColor: '#FF9500',
  },
  buttonIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  buttonSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default DisruptionManagement;
```

## Step 4: Add to Navigation (if using React Navigation)

If you're using React Navigation, add the disruption management screen to your navigation:

```jsx
// In your navigation setup
import DisruptionManagement from './components/DisruptionManagement';

// Add to your stack navigator
<Stack.Screen 
  name="DisruptionManagement" 
  component={DisruptionManagement}
  options={{
    title: 'Disruption Management',
    headerStyle: { backgroundColor: '#007AFF' },
    headerTintColor: '#fff',
  }}
/>
```

## Step 5: Testing the Integration

### Backend Testing
First, test your backend API:

```bash
cd backend
node test-disruption-api.js
```

This will verify all API endpoints are working correctly.

### Frontend Testing
1. **Start your backend**: `npm run dev` in the backend directory
2. **Start your React Native app**: `expo start` or `npx react-native run-ios/android`
3. **Test the components**:
   - Try logging a test disruption
   - View the logs to see it appears
   - Check the analytics dashboard

## Step 6: Customize for Your Needs

### Supervisor Authentication
If you have user authentication, update the `supervisorInfo` object with real data:

```jsx
const supervisorInfo = {
  id: currentUser.supervisorId,
  name: currentUser.fullName,
  depot: currentUser.depot,
  shift: currentUser.currentShift
};
```

### Styling
Customize the styles to match your app's design system:

```jsx
// Update colors, fonts, spacing to match your brand
const styles = StyleSheet.create({
  // Your custom styles
});
```

### API URL
For production, update your API URL:

```bash
# In production .env
EXPO_PUBLIC_API_URL=https://your-backend-url.com
```

## Step 7: Additional Features

### Push Notifications
Add push notifications when disruptions are logged:

```jsx
// In DisruptionLogger component, after successful log
import * as Notifications from 'expo-notifications';

const scheduleNotification = async (disruptionTitle) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Disruption Logged ✅',
      body: `Successfully logged: ${disruptionTitle}`,
    },
    trigger: { seconds: 1 },
  });
};
```

### Export Functionality
Add CSV export for disruption logs:

```jsx
// Add export button to DisruptionLogViewer
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const exportLogs = async (logs) => {
  const csvContent = generateCSV(logs);
  const fileUri = FileSystem.documentDirectory + 'disruption_logs.csv';
  
  await FileSystem.writeAsStringAsync(fileUri, csvContent);
  await Sharing.shareAsync(fileUri);
};
```

## Troubleshooting

### Common Issues

1. **"Network Error"**: Check your API URL and ensure backend is running
2. **"Table doesn't exist"**: Run the database schema SQL in Supabase
3. **"Authentication failed"**: Check your Supabase environment variables
4. **Components not showing**: Verify all imports and file paths

### Debug Mode
Enable debug logging in development:

```jsx
// Add to your component
const DEBUG = __DEV__;

if (DEBUG) {
  console.log('Supervisor info:', supervisorInfo);
  console.log('API URL:', process.env.EXPO_PUBLIC_API_URL);
}
```

## Next Steps

1. **Train your supervisors** on how to use the new disruption logging features
2. **Set up automated reports** using the statistics API
3. **Monitor usage** and gather feedback for improvements
4. **Consider adding more analytics** based on your specific needs

## Support

If you encounter issues:

1. Check the backend logs for API errors
2. Verify the database schema is correctly installed
3. Test the API endpoints using the test script
4. Review the component props and state management

The disruption logging system is now fully integrated into your BARRY app! 🎉
