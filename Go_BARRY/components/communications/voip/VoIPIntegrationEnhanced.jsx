/*
 * Go Barry - 8x8 VoIP Integration
 * Simple iframe integration for 8x8 SSO login
 * Keeps the session active in background for calls
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VoIPIntegrationEnhanced = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setError('Failed to load 8x8. Please check your connection and try again.');
  };

  // Keep iframe alive when component unmounts
  useEffect(() => {
    // Store reference to iframe in global scope to keep it alive
    if (Platform.OS === 'web' && iframeRef.current) {
      window.__8x8_iframe = iframeRef.current;
    }

    return () => {
      // Don't destroy the iframe on unmount - keep it alive for calls
      if (Platform.OS === 'web' && window.__8x8_iframe) {
        // Move iframe to hidden container instead of destroying it
        const hiddenContainer = document.getElementById('hidden-8x8-container');
        if (!hiddenContainer) {
          const container = document.createElement('div');
          container.id = 'hidden-8x8-container';
          container.style.position = 'absolute';
          container.style.left = '-9999px';
          container.style.width = '1px';
          container.style.height = '1px';
          container.style.overflow = 'hidden';
          document.body.appendChild(container);
        }
        
        const container = document.getElementById('hidden-8x8-container');
        if (container && window.__8x8_iframe) {
          container.appendChild(window.__8x8_iframe);
        }
      }
    };
  }, []);

  // Restore iframe if it exists
  useEffect(() => {
    if (Platform.OS === 'web' && window.__8x8_iframe && iframeRef.current === null) {
      const container = document.getElementById('8x8-iframe-container');
      if (container && window.__8x8_iframe) {
        container.appendChild(window.__8x8_iframe);
        setIsLoading(false);
      }
    }
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>8x8 VoIP System</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.notSupportedContainer}>
          <Ionicons name="desktop-outline" size={64} color="#666" />
          <Text style={styles.notSupportedText}>
            8x8 VoIP is only available on desktop browsers
          </Text>
          <Text style={styles.notSupportedSubtext}>
            Please access this feature from a computer
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Ionicons name="call" size={24} color="#7C3AED" />
          <Text style={styles.headerTitle}>8x8 VoIP System</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: isLoading ? '#FFA500' : '#10B981' }]} />
            <Text style={styles.statusText}>
              {isLoading ? 'Connecting...' : 'Connected'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={() => {
              if (iframeRef.current) {
                iframeRef.current.src = iframeRef.current.src;
                setIsLoading(true);
              }
            }}
          >
            <Ionicons name="refresh" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Instructions Bar */}
      <View style={styles.instructionsBar}>
        <Ionicons name="information-circle" size={20} color="#7C3AED" />
        <Text style={styles.instructionsText}>
          Log in with your 8x8 credentials. The session will remain active when you navigate away.
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#7C3AED" />
            <Text style={styles.loadingText}>Loading 8x8...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsLoading(true);
                if (iframeRef.current) {
                  iframeRef.current.src = iframeRef.current.src;
                }
              }}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        <div 
          id="8x8-iframe-container" 
          style={{
            width: '100%',
            height: '100%',
            display: error ? 'none' : 'block'
          }}
        >
          {!window.__8x8_iframe && (
            <iframe
              ref={iframeRef}
              src="https://sso.8x8.com/v2/login"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '8px'
              }}
              title="8x8 VoIP System"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="microphone; camera; autoplay"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            />
          )}
        </div>
      </View>

      {/* Footer with quick tips */}
      <View style={styles.footer}>
        <View style={styles.tipItem}>
          <Ionicons name="headset" size={16} color="#666" />
          <Text style={styles.tipText}>Use headset for best quality</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="mic" size={16} color="#666" />
          <Text style={styles.tipText}>Ensure microphone access</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="wifi" size={16} color="#666" />
          <Text style={styles.tipText}>Stable connection required</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerSpacer: {
    width: 40,
  },
  instructionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9D5FF',
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: '#6B21A8',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tipText: {
    fontSize: 12,
    color: '#6B7280',
  },
  notSupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notSupportedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 24,
    textAlign: 'center',
  },
  notSupportedSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default VoIPIntegrationEnhanced;
