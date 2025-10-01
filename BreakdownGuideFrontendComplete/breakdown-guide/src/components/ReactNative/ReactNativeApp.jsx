// React Native Compatible Main App Component
// Works on both web and mobile platforms

import React, { useEffect, useState, Suspense } from 'react'
import { 
  View, 
  Text, 
  StatusBar, 
  Platform,
  SafeAreaView,
  KeyboardAvoidingView,
  Alert as RNAlert
} from 'react-native'

// Import React Native compatible stores and utilities
import { useSupervisorStore, useWizardStore, useFleetStore } from '../stores/reactNativeStore.js'
import { Button, LoadingSpinner, Alert, CustomModal } from './UIComponents.jsx'
import { colors, commonStyles, spacing } from './StyleUtils.js'
import { isWeb, isIOS, alerts, appState, network } from './PlatformUtils.js'

// Lazy load components for better performance
const SupervisorLogin = React.lazy(() => import('./SupervisorLogin.jsx'))
const FleetSelectionModal = React.lazy(() => import('./FleetSelectionModal.jsx'))
const WizardContainer = React.lazy(() => import('./WizardContainer.jsx'))
const OfflineIndicator = React.lazy(() => import('./OfflineIndicator.jsx'))

// Main App Component
export const ReactNativeApp = () => {
  // Store hooks
  const { 
    isAuthenticated, 
    supervisorSession, 
    login, 
    logout,
    checkSession,
    preferences 
  } = useSupervisorStore()

  const {
    currentWizard,
    selectedVehicle,
    showFleetModal,
    startWizard,
    cancelWizard,
    getProgress
  } = useWizardStore()

  const {
    loadFleetDatabase,
    isLoading: fleetLoading
  } = useFleetStore()

  // Local state
  const [isInitializing, setIsInitializing] = useState(true)
  const [networkStatus, setNetworkStatus] = useState({ isConnected: true })
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)
  const [appError, setAppError] = useState(null)

  // Initialize app
  useEffect(() => {
    initializeApp()
  }, [])

  // Network monitoring
  useEffect(() => {
    const unsubscribe = network.onConnectionChange((status) => {
      setNetworkStatus(status)
      
      if (!status.isConnected && !showOfflineAlert) {
        setShowOfflineAlert(true)
        alerts.alert(
          'No Internet Connection',
          'You are currently offline. Some features may not be available.'
        )
      }
    })

    return unsubscribe
  }, [showOfflineAlert])

  // App state monitoring
  useEffect(() => {
    const unsubscribe = appState.addEventListener((nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // Check session when app becomes active
        if (!checkSession()) {
          alerts.alert(
            'Session Expired', 
            'Your session has expired. Please log in again.'
          )
        }
      }
    })

    return unsubscribe
  }, [isAuthenticated, checkSession])

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing React Native App...')

      // Check existing session
      if (isAuthenticated) {
        const sessionValid = checkSession()
        if (!sessionValid) {
          console.log('⚠️ Session expired during initialization')
        }
      }

      // Load fleet database
      if (networkStatus.isConnected) {
        try {
          await loadFleetDatabase()
          console.log('✅ Fleet database loaded')
        } catch (error) {
          console.warn('⚠️ Failed to load fleet database:', error)
        }
      }

      // Initialize breakdown analytics
      if (window.BreakdownAnalytics) {
        window.BreakdownAnalytics.initialize({
          platform: Platform.OS,
          version: '2.0.0',
          networkStatus: networkStatus.isConnected
        })
        console.log('✅ Breakdown analytics initialized')
      }

      // Initialize supervisor breakdown logger
      if (window.SupervisorBreakdownLogger && supervisorSession) {
        window.SupervisorBreakdownLogger.setSupervisor(supervisorSession)
        console.log('✅ Supervisor breakdown logger initialized')
      }

      setIsInitializing(false)
      console.log('✅ App initialization complete')

    } catch (error) {
      console.error('❌ App initialization failed:', error)
      setAppError(error.message)
      setIsInitializing(false)
    }
  }

  const handleLogin = async (credentials) => {
    try {
      const result = await login(credentials)
      
      if (result.success) {
        // Initialize services after successful login
        if (window.SupervisorBreakdownLogger) {
          window.SupervisorBreakdownLogger.setSupervisor(result.data)
        }

        // Load fleet database if not already loaded
        if (!fleetLoading && networkStatus.isConnected) {
          await loadFleetDatabase()
        }

        alerts.alert(
          'Login Successful',
          `Welcome back, ${result.data.name}!`
        )
      } else {
        alerts.alert(
          'Login Failed',
          result.error || 'Invalid credentials'
        )
      }

      return result
    } catch (error) {
      console.error('Login error:', error)
      alerts.alert(
        'Login Error',
        'A network error occurred. Please try again.'
      )
      return { success: false, error: error.message }
    }
  }

  const handleLogout = () => {
    if (currentWizard) {
      RNAlert.alert(
        'Assessment in Progress',
        'You have an active assessment. Logging out will cancel it. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            style: 'destructive',
            onPress: () => {
              cancelWizard()
              logout()
            }
          }
        ]
      )
    } else {
      logout()
    }
  }

  const handleStartWizard = async (wizardType, vehicle) => {
    try {
      const assessmentId = await startWizard(wizardType, vehicle)
      console.log(`✅ Started ${wizardType} assessment:`, assessmentId)
    } catch (error) {
      console.error('Failed to start wizard:', error)
      alerts.alert(
        'Assessment Error',
        'Failed to start assessment. Please try again.'
      )
    }
  }

  // Error boundary fallback
  if (appError) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.gray[50]} />
        <View style={{ padding: spacing[6], alignItems: 'center' }}>
          <Text style={{ fontSize: 48, marginBottom: spacing[4] }}>⚠️</Text>
          <Text style={commonStyles.heading2}>Application Error</Text>
          <Text style={[commonStyles.bodyText, { textAlign: 'center', marginVertical: spacing[4] }]}>
            The app encountered an unexpected error. Please restart the application.
          </Text>
          <Button
            title="Restart App"
            onPress={() => {
              setAppError(null)
              setIsInitializing(true)
              initializeApp()
            }}
            variant="primary"
          />
          {__DEV__ && (
            <Text style={[commonStyles.caption, { marginTop: spacing[4], textAlign: 'center' }]}>
              Error: {appError}
            </Text>
          )}
        </View>
      </SafeAreaView>
    )
  }

  // Loading screen
  if (isInitializing) {
    return (
      <SafeAreaView style={[commonStyles.container, commonStyles.centerContent]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.gray[50]} />
        <LoadingSpinner 
          size="large" 
          text="Initializing Breakdown Guide..." 
        />
      </SafeAreaView>
    )
  }

  // Main app content
  const AppContent = () => (
    <KeyboardAvoidingView 
      style={commonStyles.container}
      behavior={isIOS ? 'padding' : 'height'}
    >
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={colors.gray[50]}
        translucent={false}
      />

      {/* Offline Indicator */}
      {!networkStatus.isConnected && (
        <Suspense fallback={null}>
          <OfflineIndicator />
        </Suspense>
      )}

      {/* Main Content */}
      {!isAuthenticated ? (
        // Login Screen
        <Suspense fallback={<LoadingSpinner text="Loading login..." />}>
          <SupervisorLogin onLogin={handleLogin} />
        </Suspense>
      ) : currentWizard ? (
        // Active Wizard
        <Suspense fallback={<LoadingSpinner text="Loading wizard..." />}>
          <WizardContainer
            wizardType={currentWizard}
            vehicle={selectedVehicle}
            progress={getProgress()}
            onCancel={cancelWizard}
          />
        </Suspense>
      ) : (
        // Main Dashboard
        <MainDashboard 
          supervisor={supervisorSession}
          onLogout={handleLogout}
          onStartWizard={handleStartWizard}
        />
      )}

      {/* Fleet Selection Modal */}
      {showFleetModal && (
        <Suspense fallback={null}>
          <FleetSelectionModal />
        </Suspense>
      )}

      {/* Offline Alert */}
      {showOfflineAlert && (
        <Alert
          type="warning"
          title="Offline Mode"
          message="You are currently offline. Some features may be limited."
          onDismiss={() => setShowOfflineAlert(false)}
        />
      )}
    </KeyboardAvoidingView>
  )

  return (
    <SafeAreaView style={commonStyles.container}>
      <AppContent />
    </SafeAreaView>
  )
}

// Main Dashboard Component
const MainDashboard = ({ supervisor, onLogout, onStartWizard }) => {
  const wizardTypes = [
    { key: 'Steering', title: 'Steering Issues', icon: '🚗', priority: 'high' },
    { key: 'Brakes', title: 'Brake Problems', icon: '🛑', priority: 'high' },
    { key: 'NonStarter', title: 'Vehicle Won\'t Start', icon: '🔑', priority: 'high' },
    { key: 'ABSLight', title: 'ABS Warning Light', icon: '⚠️', priority: 'medium' },
    { key: 'OilWarningLight', title: 'Oil Warning Light', icon: '🛢️', priority: 'medium' },
    { key: 'ExteriorLights', title: 'Exterior Lights', icon: '💡', priority: 'medium' },
    { key: 'InteriorLights', title: 'Interior Lights', icon: '🔦', priority: 'low' },
    { key: 'WheelchairRamp', title: 'Wheelchair Ramp', icon: '♿', priority: 'medium' }
  ]

  const { showFleetSelection } = useWizardStore()

  const handleWizardPress = (wizardType) => {
    showFleetSelection(wizardType)
  }

  const getPriorityColor = (priority) => {
    const priorityColors = {
      high: colors.error,
      medium: colors.warning,
      low: colors.info
    }
    return priorityColors[priority] || colors.gray[500]
  }

  return (
    <View style={commonStyles.container}>
      {/* Header */}
      <View style={{
        backgroundColor: colors.gne.navy,
        padding: spacing[6],
        paddingTop: spacing[8]
      }}>
        <View style={commonStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: colors.gray[50],
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold
            }}>
              Go North East
            </Text>
            <Text style={{
              color: colors.gray[300],
              fontSize: typography.fontSize.sm
            }}>
              Breakdown Assessment Guide
            </Text>
          </View>
          <Button
            title="Logout"
            onPress={onLogout}
            variant="outline"
            size="small"
            style={{ borderColor: colors.gray[300] }}
            textStyle={{ color: colors.gray[300] }}
          />
        </View>
        
        <Text style={{
          color: colors.gray[50],
          fontSize: typography.fontSize.base,
          marginTop: spacing[4]
        }}>
          Welcome back, {supervisor.name}
        </Text>
      </View>

      {/* Wizard Grid */}
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing[4] }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[commonStyles.heading3, { marginBottom: spacing[4] }]}>
          Select Assessment Type
        </Text>
        
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}>
          {wizardTypes.map((wizard) => (
            <TouchableOpacity
              key={wizard.key}
              style={{
                width: '48%',
                backgroundColor: colors.gray[50],
                borderRadius: borderRadius.xl,
                padding: spacing[4],
                marginBottom: spacing[4],
                ...shadows.md,
                borderLeftWidth: 4,
                borderLeftColor: getPriorityColor(wizard.priority)
              }}
              onPress={() => handleWizardPress(wizard.key)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 32, marginBottom: spacing[2] }}>
                {wizard.icon}
              </Text>
              <Text style={[commonStyles.heading3, { fontSize: typography.fontSize.base }]}>
                {wizard.title}
              </Text>
              <Text style={[commonStyles.caption, { marginTop: spacing[1] }]}>
                {wizard.priority.toUpperCase()} PRIORITY
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

export default ReactNativeApp