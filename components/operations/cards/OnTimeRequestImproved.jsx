// Go_BARRY/components/operations/cards/OnTimeRequestImproved.jsx
// Improved iframe-based SharePoint integration with better UX

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const OnTimeRequestImproved = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [viewMode, setViewMode] = useState('embedded'); // 'embedded' or 'external'

  // Auto-refresh only when document is first opened, not continuously
  useEffect(() => {
    // Only refresh once when component mounts
    setLastRefresh(new Date());
  }, []);

  // Improved SharePoint URL with better embedding parameters
  const sharePointUrl = 'https://goaheadgroup.sharepoint.com/:x:/r/sites/GNETS0011/_layouts/15/doc2.aspx?sourcedoc=%7B0D85361B-20DF-4F90-A0EF-C4A1C68B17DC%7D&file=On%20Time%20Request.xlsx&action=default&mobileredirect=true&DefaultItemOpen=1';
  
  // Enhanced embed URL for better iframe experience
  const embedUrl = sharePointUrl.replace('action=default', 'action=embedview&wdAllowInteractivity=True&wdHideGridlines=False&wdHideHeaders=False&wdDownloadButton=True&wdInConfigurator=True');

  const handleLoadStart = () => {
    console.log('📋 Loading On Time Request document...');
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    console.log('📋 On Time Request document loaded successfully');
    setIsLoading(false);
    setLastRefresh(new Date());
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('📋 OnTime Request WebView error:', nativeEvent);
    setError('Failed to load SharePoint document');
    setIsLoading(false);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    setLastRefresh(new Date());
    // Force reload by updating the URL with timestamp
  };

  const openInSharePoint = async () => {
    try {
      if (Platform.OS === 'web') {
        window.open(sharePointUrl, '_blank');
      } else {
        await Linking.openURL(sharePointUrl);
      }
    } catch (error) {
      console.error('Failed to open SharePoint URL:', error);
    }
  };

  const openInNewTab = () => {
    if (Platform.OS === 'web') {
      window.open(embedUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  };

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="clock-check" size={32} color="#ffffff" />
          <View style={styles.headerText}>
            <Text style={styles.title}>📋 On Time Request</Text>
            <Text style={styles.subtitle}>
              SharePoint Document • Opened: {lastRefresh.toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {Platform.OS === 'web' && (
            <Pressable
              style={styles.actionButton}
              onPress={openInNewTab}
              accessibilityLabel="Open in new tab"
            >
              <MaterialCommunityIcons name="open-in-new" size={20} color="#ffffff" />
            </Pressable>
          )}
          <Pressable
            style={styles.actionButton}
            onPress={openInSharePoint}
            accessibilityLabel="Open in SharePoint"
          >
            <MaterialCommunityIcons name="microsoft-sharepoint" size={20} color="#ffffff" />
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={handleRefresh}
            accessibilityLabel="Refresh document"
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#ffffff" />
          </Pressable>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close document"
          >
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Enhanced Status Bar */}
      {(isLoading || error) && (
        <View style={[styles.statusBar, error ? styles.statusBarError : styles.statusBarLoading]}>
          {isLoading && (
            <View style={styles.statusContent}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.statusText}>Loading SharePoint document...</Text>
            </View>
          )}
          {error && (
            <View style={styles.statusContent}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#ffffff" />
              <Text style={styles.statusText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={handleRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Improved Content Area */}
      <View style={styles.content}>
        {Platform.OS === 'web' ? (
          <iframe
            src={embedUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: error ? 'none' : 'block'
            }}
            onLoad={handleLoadEnd}
            onError={handleError}
            title="On Time Request - SharePoint Excel"
            allow="clipboard-read; clipboard-write; keyboard-map; autoplay; camera; fullscreen; microphone; display-capture"
            sandbox="allow-same-origin allow-scripts allow-forms allow-downloads allow-modals allow-pointer-lock"
          />
        ) : (
          <WebView
            source={{ 
              uri: embedUrl,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
            }}
            style={[styles.webview, { display: error ? 'none' : 'flex' }]}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            startInLoadingState={true}
            scalesPageToFit={Platform.OS === 'android'}
            showsHorizontalScrollIndicator={true}
            showsVerticalScrollIndicator={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={false}
            bounces={false}
            scrollEnabled={true}
            nestedScrollEnabled={true}
            overScrollMode="content"
            contentInsetAdjustmentBehavior="automatic"
          />
        )}

        {/* Overlay for error state */}
        {error && (
          <View style={styles.errorOverlay}>
            <MaterialCommunityIcons name="file-document-alert" size={64} color="#ef4444" />
            <Text style={styles.errorTitle}>Document Loading Failed</Text>
            <Text style={styles.errorDescription}>
              Unable to load the SharePoint document. This might be due to network issues or SharePoint access permissions.
            </Text>
            
            <View style={styles.errorActions}>
              <Pressable style={styles.openSharePointButton} onPress={openInSharePoint}>
                <MaterialCommunityIcons name="microsoft-sharepoint" size={20} color="#ffffff" />
                <Text style={styles.openSharePointButtonText}>Open in SharePoint</Text>
              </Pressable>
              
              <Pressable style={styles.retryMainButton} onPress={handleRefresh}>
                <MaterialCommunityIcons name="refresh" size={20} color="#0ea5e9" />
                <Text style={styles.retryMainButtonText}>Try Again</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>

      {/* Enhanced Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <MaterialCommunityIcons name="microsoft-sharepoint" size={16} color="#64748b" />
          <Text style={styles.footerText}>
            SharePoint Excel Document • Manual refresh available
          </Text>
        </View>
        
        <View style={styles.footerActions}>
          <Text style={styles.helpText}>
            💡 Use refresh button to get latest changes • Open in SharePoint for full editing
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#bae6fd',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBar: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  statusBarLoading: {
    backgroundColor: '#3b82f6',
  },
  statusBarError: {
    backgroundColor: '#ef4444',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    marginTop: 24,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  errorDescription: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
  errorActions: {
    marginTop: 32,
    flexDirection: 'row',
    gap: 16,
  },
  openSharePointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  openSharePointButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryMainButtonText: {
    color: '#0ea5e9',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  footerActions: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default OnTimeRequestImproved;