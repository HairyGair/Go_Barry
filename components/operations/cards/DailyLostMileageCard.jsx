// Go_BARRY/components/operations/cards/DailyLostMileageCard.jsx
// Daily Lost Mileage SharePoint Document Integration

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DailyLostMileageCard = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // SharePoint document URL - modified for embed view
  const sharePointUrl = 'https://goaheadgroup.sharepoint.com/:x:/r/sites/GNETS0011/_layouts/15/doc2.aspx?sourcedoc=%7B01D73A9C-5F4C-4688-BB15-54EEC40D1739%7D&file=Daily%20lost%20miles%20report%20-%20SDC.xlsx&action=default&mobileredirect=true&wdsle=0';
  
  // For better embedding, we can try the embed URL format
  const embedUrl = sharePointUrl.replace('action=default', 'action=embedview&wdAllowInteractivity=False&wdHideGridlines=True&wdHideHeaders=True');

  console.log('📊 Daily Lost Mileage URLs:');
  console.log('📊 Original:', sharePointUrl);
  console.log('📊 Embed:', embedUrl);

  const handleLoadStart = () => {
    console.log('📊 Loading Daily Lost Mileage report...');
    setIsLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    console.log('📊 Daily Lost Mileage report loaded successfully');
    setIsLoading(false);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('📊 Daily Lost Mileage WebView error:', nativeEvent);
    console.error('📊 Attempted URL:', embedUrl);
    setError('Failed to load SharePoint document');
    setIsLoading(false);
  };

  const openInBrowser = () => {
    if (Platform.OS === 'web') {
      window.open(sharePointUrl, '_blank');
    } else {
      // For mobile, we'll keep using the WebView
      console.log('Opening in external browser not supported on mobile');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="chart-line-variant" size={32} color="#ffffff" />
          <View style={styles.headerText}>
            <Text style={styles.title}>📊 Daily Lost Mileage</Text>
            <Text style={styles.subtitle}>SDC Report • Live SharePoint</Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          {Platform.OS === 'web' && (
            <Pressable
              style={styles.actionButton}
              onPress={openInBrowser}
            >
              <MaterialCommunityIcons name="open-in-new" size={20} color="#ffffff" />
            </Pressable>
          )}
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
          >
            <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.loadingText}>Loading Daily Lost Mileage Report...</Text>
            <Text style={styles.loadingSubtext}>Connecting to SharePoint</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons name="alert-circle" size={48} color="#dc2626" />
            <Text style={styles.errorTitle}>Unable to Load Document</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setIsLoading(true);
              }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {Platform.OS === 'web' ? (
          <iframe
            src={embedUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: isLoading || error ? 'none' : 'block'
            }}
            onLoad={handleLoadEnd}
            onError={handleError}
            title="Daily Lost Mileage Report"
          />
        ) : (
          <WebView
            source={{ uri: embedUrl }}
            style={[styles.webview, { display: error ? 'none' : 'flex' }]}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            startInLoadingState={true}
            scalesPageToFit={true}
            showsHorizontalScrollIndicator={true}
            showsVerticalScrollIndicator={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          />
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <MaterialCommunityIcons name="microsoft-sharepoint" size={16} color="#64748b" />
          <Text style={styles.footerText}>
            Live data from SharePoint • Last updated: {new Date().toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            })}
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
    backgroundColor: '#dc2626', // Red theme for lost mileage reports
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
    color: '#fecaca',
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
  content: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 32,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#dc2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
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
  },
  footerText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default DailyLostMileageCard;