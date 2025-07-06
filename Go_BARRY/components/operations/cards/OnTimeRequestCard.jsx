// Go_BARRY/components/operations/cards/OnTimeRequestCard.jsx
// SharePoint On Time Request viewer for daily supervisor review

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const OnTimeRequestCard = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // SharePoint document URL - modified for embed view
  const sharePointUrl = 'https://goaheadgroup.sharepoint.com/:x:/r/sites/GNETS0011/_layouts/15/doc2.aspx?sourcedoc=%7B0D85361B-20DF-4F90-A0EF-C4A1C68B17DC%7D&file=On%20Time%20Request.xlsx&action=default&mobileredirect=true&DefaultItemOpen=1';
  
  // For better embedding, we can try the embed URL format
  const embedUrl = sharePointUrl.replace('action=default', 'action=embedview&wdAllowInteractivity=False&wdHideGridlines=True&wdHideHeaders=True');

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    setError('Failed to load SharePoint document');
    setIsLoading(false);
  };

  // Get screen dimensions for responsive design
  const screenData = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📋 On Time Request</Text>
          <Text style={styles.subtitle}>Daily Driver Finish Request Sheet</Text>
        </View>
        <Text style={styles.instruction}>
          Review pending on-time finish requests
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading SharePoint document...</Text>
          </View>
        )}
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Unable to Load Document</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.fallbackText}>
              Please access directly: {'\n'}
              <Text style={styles.urlText}>
                goaheadgroup.sharepoint.com → GNETS0011 → On Time Request.xlsx
              </Text>
            </Text>
          </View>
        )}

        {!error && (
          <View style={styles.webViewContainer}>
            {isWeb ? (
              // For web, use iframe
              <iframe
                src={embedUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '8px'
                }}
                title="On Time Request SharePoint Document"
                onLoad={handleLoad}
                onError={handleError}
              />
            ) : (
              // For mobile, use WebView
              <WebView
                source={{ uri: sharePointUrl }}
                style={styles.webView}
                onLoad={handleLoad}
                onError={handleError}
                startInLoadingState={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                scrollEnabled={true}
                scalesPageToFit={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                // SharePoint authentication headers
                userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
              />
            )}
          </View>
        )}
      </View>

      {/* Footer with instructions */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💡 This document shows drivers requesting early finish times. 
          Review and approve/deny requests as per company policy.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#1e40af',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#bfdbfe',
    marginBottom: 12,
  },
  instruction: {
    fontSize: 14,
    color: '#dbeafe',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 20,
  },
  fallbackText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  urlText: {
    color: '#1e40af',
    fontWeight: '500',
  },
  webViewContainer: {
    flex: 1,
    margin: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  webView: {
    flex: 1,
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
  footerText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default OnTimeRequestCard;