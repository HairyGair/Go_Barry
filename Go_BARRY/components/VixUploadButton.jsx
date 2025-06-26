// Go_BARRY/components/VixUploadButton.jsx
// Button component for uploading VIX late runners data

import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';

const VixUploadButton = ({ onUpload, isLoading, lastUpdated, dataAge, stats }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('📄 File selected:', file.name);
      onUpload(file);
    }
  };

  const handlePress = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      )}
      
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handlePress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Text style={styles.buttonIcon}>📊</Text>
            <Text style={styles.buttonText}>Upload VIX</Text>
          </>
        )}
      </TouchableOpacity>

      {lastUpdated && (
        <View style={styles.status}>
          <Text style={styles.statusText}>
            Updated: {formatTime(lastUpdated)}
          </Text>
          {dataAge !== null && (
            <Text style={styles.ageText}>
              ({dataAge} min ago)
            </Text>
          )}
          {stats && (
            <Text style={styles.statsText}>
              {stats.totalLateRunners} late | {stats.criticalDelays} critical
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonIcon: {
    fontSize: 20
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  status: {
    flex: 1
  },
  statusText: {
    color: '#999999',
    fontSize: 14
  },
  ageText: {
    color: '#666666',
    fontSize: 12
  },
  statsText: {
    color: '#ffcc00',
    fontSize: 12,
    marginTop: 2
  }
});

export default VixUploadButton;