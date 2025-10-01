// React Native Platform Utilities
// Provides cross-platform abstractions for React Native compatibility

import { Platform } from 'react-native'

// Platform detection utilities
export const isWeb = Platform.OS === 'web'
export const isIOS = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'
export const isMobile = isIOS || isAndroid

// Screen dimensions and responsive utilities
export const getScreenDimensions = () => {
  if (isWeb) {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      scale: window.devicePixelRatio || 1
    }
  }
  
  // For React Native, this would import from react-native
  // import { Dimensions } from 'react-native'
  // return Dimensions.get('window')
  
  return {
    width: 375, // Default fallback
    height: 667,
    scale: 2
  }
}

// Storage abstraction (no localStorage in React Native)
export const storage = {
  async setItem(key, value) {
    if (isWeb) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
      } catch (error) {
        console.warn('localStorage not available:', error)
        return false
      }
    }
    
    // For React Native, would use AsyncStorage
    // import AsyncStorage from '@react-native-async-storage/async-storage'
    // return await AsyncStorage.setItem(key, JSON.stringify(value))
    
    console.warn('Storage not available on this platform')
    return false
  },

  async getItem(key) {
    if (isWeb) {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      } catch (error) {
        console.warn('localStorage read error:', error)
        return null
      }
    }
    
    // For React Native
    // const item = await AsyncStorage.getItem(key)
    // return item ? JSON.parse(item) : null
    
    return null
  },

  async removeItem(key) {
    if (isWeb) {
      try {
        localStorage.removeItem(key)
        return true
      } catch (error) {
        console.warn('localStorage remove error:', error)
        return false
      }
    }
    
    // For React Native
    // return await AsyncStorage.removeItem(key)
    
    return false
  }
}

// Navigation utilities
export const navigation = {
  // Web navigation
  navigate(url) {
    if (isWeb) {
      window.location.href = url
    } else {
      // React Native navigation would be handled by navigation prop
      console.warn('Navigation requires React Navigation on mobile')
    }
  },

  // Back navigation
  goBack() {
    if (isWeb) {
      window.history.back()
    } else {
      // React Native back
      console.warn('Back navigation requires navigation prop on mobile')
    }
  },

  // External URL opening
  openExternal(url) {
    if (isWeb) {
      window.open(url, '_blank')
    } else {
      // React Native would use Linking
      // import { Linking } from 'react-native'
      // Linking.openURL(url)
      console.warn('External linking requires Linking API on mobile')
    }
  }
}

// Clipboard utilities
export const clipboard = {
  async writeText(text) {
    if (isWeb && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (error) {
        console.warn('Clipboard write failed:', error)
        return false
      }
    }
    
    // React Native would use @react-native-clipboard/clipboard
    console.warn('Clipboard not available on this platform')
    return false
  },

  async readText() {
    if (isWeb && navigator.clipboard) {
      try {
        return await navigator.clipboard.readText()
      } catch (error) {
        console.warn('Clipboard read failed:', error)
        return null
      }
    }
    
    console.warn('Clipboard read not available on this platform')
    return null
  }
}

// Alert utilities (React Native doesn't have window.alert)
export const alerts = {
  alert(title, message) {
    if (isWeb) {
      window.alert(`${title}\n\n${message}`)
    } else {
      // React Native would use Alert
      // import { Alert } from 'react-native'
      // Alert.alert(title, message)
      console.log('Alert:', title, message)
    }
  },

  confirm(title, message) {
    if (isWeb) {
      return window.confirm(`${title}\n\n${message}`)
    } else {
      // React Native would use Alert.alert with buttons
      console.log('Confirm:', title, message)
      return false
    }
  }
}

// Vibration utilities
export const vibration = {
  vibrate(duration = 100) {
    if (isWeb && navigator.vibrate) {
      navigator.vibrate(duration)
    } else if (isMobile) {
      // React Native would use Vibration
      // import { Vibration } from 'react-native'
      // Vibration.vibrate(duration)
      console.log('Vibrate:', duration)
    }
  }
}

// Network status utilities  
export const network = {
  getConnectionInfo() {
    if (isWeb && navigator.connection) {
      return {
        type: navigator.connection.effectiveType,
        isConnected: navigator.onLine,
        details: {
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt,
          saveData: navigator.connection.saveData
        }
      }
    }
    
    if (isWeb) {
      return {
        type: 'unknown',
        isConnected: navigator.onLine,
        details: {}
      }
    }
    
    // React Native would use @react-native-netinfo/netinfo
    return {
      type: 'unknown',
      isConnected: true,
      details: {}
    }
  },

  onConnectionChange(callback) {
    if (isWeb) {
      const handleOnline = () => callback({ isConnected: true })
      const handleOffline = () => callback({ isConnected: false })
      
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
    
    // React Native would use NetInfo.addEventListener
    return () => {} // No-op cleanup function
  }
}

// Permissions utilities
export const permissions = {
  async requestLocationPermission() {
    if (isWeb && navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve('granted'),
          (error) => {
            console.warn('Location permission denied:', error)
            resolve('denied')
          },
          { timeout: 5000 }
        )
      })
    }
    
    // React Native would use react-native-permissions
    return 'denied'
  },

  async requestCameraPermission() {
    if (isWeb && navigator.mediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop()) // Clean up
        return 'granted'
      } catch (error) {
        console.warn('Camera permission denied:', error)
        return 'denied'
      }
    }
    
    return 'denied'
  }
}

// Device info utilities
export const deviceInfo = {
  getDeviceInfo() {
    if (isWeb) {
      return {
        platform: 'web',
        userAgent: navigator.userAgent,
        language: navigator.language,
        vendor: navigator.vendor || 'unknown',
        cookieEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack === '1'
      }
    }
    
    // React Native would use react-native-device-info
    return {
      platform: Platform.OS,
      version: Platform.Version,
      language: 'en', // Default fallback
      vendor: 'unknown',
      cookieEnabled: false,
      doNotTrack: false
    }
  },

  isTablet() {
    if (isWeb) {
      // Simple tablet detection for web
      const { width, height } = getScreenDimensions()
      const minDimension = Math.min(width, height)
      const maxDimension = Math.max(width, height)
      
      return minDimension >= 768 && maxDimension >= 1024
    }
    
    // React Native would use Device.deviceType or similar
    return false
  }
}

// App state utilities
export const appState = {
  getCurrentState() {
    if (isWeb) {
      return document.hidden ? 'background' : 'active'
    }
    
    // React Native would use AppState.currentState
    return 'active'
  },

  addEventListener(callback) {
    if (isWeb) {
      const handleVisibilityChange = () => {
        callback(document.hidden ? 'background' : 'active')
      }
      
      document.addEventListener('visibilitychange', handleVisibilityChange)
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
    
    // React Native would use AppState.addEventListener
    return () => {} // No-op cleanup
  }
}

// Export all utilities as default object
export default {
  isWeb,
  isIOS, 
  isAndroid,
  isMobile,
  getScreenDimensions,
  storage,
  navigation,
  clipboard,
  alerts,
  vibration,
  network,
  permissions,
  deviceInfo,
  appState
}