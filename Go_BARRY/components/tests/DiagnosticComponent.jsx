import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Test imports
import offlineCoordinateCache from '../../services/offlineCoordinateCache';
import unifiedCoordinateService from '../../services/unifiedCoordinateService';

const DiagnosticComponent = () => {
  useEffect(() => {
    console.log('🔍 [DiagnosticComponent] Running import diagnostics...');
    
    // Check offlineCoordinateCache
    console.log('📦 offlineCoordinateCache:', {
      imported: !!offlineCoordinateCache,
      type: typeof offlineCoordinateCache,
      methods: offlineCoordinateCache ? Object.keys(offlineCoordinateCache) : 'undefined',
      hasSync: offlineCoordinateCache?.syncOfflineCache ? 'yes' : 'no'
    });
    
    // Check unifiedCoordinateService  
    console.log('📦 unifiedCoordinateService:', {
      imported: !!unifiedCoordinateService,
      type: typeof unifiedCoordinateService,
      methods: unifiedCoordinateService ? Object.keys(unifiedCoordinateService) : 'undefined'
    });
    
    // Test offlineCoordinateCache methods
    if (offlineCoordinateCache) {
      offlineCoordinateCache.getCacheStats()
        .then(stats => {
          console.log('✅ offlineCoordinateCache.getCacheStats() works:', stats);
        })
        .catch(err => {
          console.error('❌ offlineCoordinateCache.getCacheStats() error:', err);
        });
    }
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import Diagnostics</Text>
      <Text style={styles.text}>Check console for results</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: '#93c5fd',
  },
});

export default DiagnosticComponent;
