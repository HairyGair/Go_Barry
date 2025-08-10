// Fleet lookup component is loaded via WebView in the HTML page
import React from 'react';
import { View, StyleSheet, SafeAreaView, Pressable, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function BreakdownGuidePage() {
  const router = useRouter();
  
  // For web platform, we'll use an iframe
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.push('/')} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Breakdown Guide</Text>
        </View>
        
        <View style={styles.webContainer}>
          <iframe
            src="/breakdown-guide/index.html"
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            title="Breakdown Guide"
          />
        </View>
      </SafeAreaView>
    );
  }
  
  // For mobile platforms, use WebView
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/')} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Breakdown Guide</Text>
      </View>
      
      <WebView
        source={{ uri: 'https://go-barry.onrender.com/breakdown-guide/index.html' }}
        style={styles.webview}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    backgroundColor: '#dc3545',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  webContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
