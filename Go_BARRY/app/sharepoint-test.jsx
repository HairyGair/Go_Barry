import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { Stack } from 'expo-router';

const API_BASE = 'https://go-barry.onrender.com';

export default function SharePointTest() {
  const [status, setStatus] = useState('idle');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [accessToken, setAccessToken] = useState(null);

  const addResult = (message, type = 'info') => {
    setResults(prev => [...prev, {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testHealthCheck = async () => {
    setLoading(true);
    addResult('Testing communications health...', 'info');
    
    try {
      const response = await fetch(`${API_BASE}/api/communications/health`);
      const data = await response.json();
      
      if (data.success) {
        addResult('✅ Communications API is running', 'success');
        addResult(`Available endpoints: ${data.endpoints.join(', ')}`, 'info');
      } else {
        addResult('❌ Communications API health check failed', 'error');
      }
    } catch (error) {
      addResult(`❌ Health check error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testMicrosoftAuth = async () => {
    setLoading(true);
    addResult('Testing Microsoft authentication...', 'info');
    
    try {
      const response = await fetch(`${API_BASE}/api/communications/microsoft/auth-url`);
      const data = await response.json();
      
      if (data.success) {
        addResult('✅ Microsoft auth URL generated successfully', 'success');
        addResult('🔗 Ready for OAuth flow', 'info');
        
        if (Platform.OS === 'web') {
          addResult('Opening Microsoft login...', 'info');
          const authWindow = window.open(data.authUrl, 'Microsoft Login', 'width=600,height=700');
          
          // Listen for auth callback
          const handleMessage = (event) => {
            if (event.data.type === 'auth-callback') {
              addResult('🎉 Authentication callback received!', 'success');
              if (event.data.accessToken) {
                setAccessToken(event.data.accessToken);
                addResult('✅ Access token obtained', 'success');
              }
              authWindow.close();
              window.removeEventListener('message', handleMessage);
            }
          };
          
          window.addEventListener('message', handleMessage);
        }
      } else {
        addResult('❌ Failed to get auth URL', 'error');
        addResult(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      addResult(`❌ Auth test error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testSharePointConnection = async () => {
    if (!accessToken) {
      addResult('❌ No access token available. Please authenticate first.', 'error');
      return;
    }

    setLoading(true);
    addResult('Testing SharePoint connection...', 'info');
    
    try {
      const response = await fetch(`${API_BASE}/api/communications/sharepoint/site-info`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        addResult('✅ SharePoint site connection successful', 'success');
        addResult(`Site: ${data.site?.displayName || 'Unknown'}`, 'info');
        addResult(`URL: ${data.site?.webUrl || 'Unknown'}`, 'info');
      } else {
        addResult('❌ SharePoint connection failed', 'error');
        addResult(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      addResult(`❌ SharePoint test error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testSharePointLibraries = async () => {
    if (!accessToken) {
      addResult('❌ No access token available. Please authenticate first.', 'error');
      return;
    }

    setLoading(true);
    addResult('Testing SharePoint libraries...', 'info');
    
    try {
      const response = await fetch(`${API_BASE}/api/communications/sharepoint/libraries`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        addResult(`✅ Found ${data.libraries?.length || 0} document libraries`, 'success');
        data.libraries?.forEach(lib => {
          addResult(`📁 ${lib.name}`, 'info');
        });
      } else {
        addResult('❌ Failed to list libraries', 'error');
        addResult(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      addResult(`❌ Libraries test error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const checkEnvironmentVariables = () => {
    addResult('Checking environment configuration...', 'info');
    addResult('ℹ️ Required environment variables:', 'info');
    addResult('- MICROSOFT_CLIENT_ID', 'info');
    addResult('- MICROSOFT_CLIENT_SECRET', 'info');
    addResult('- MICROSOFT_TENANT_ID', 'info');
    addResult('- SHAREPOINT_TEAM_SITE_URL', 'info');
    addResult('- SHAREPOINT_SITE_ID (optional)', 'info');
    addResult('📖 See SHAREPOINT_SETUP_GUIDE.md for full setup instructions', 'info');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'SharePoint Integration Test',
          headerStyle: {
            backgroundColor: '#1a1a2e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>SharePoint Integration Test</Text>
          <Text style={styles.subtitle}>Test your Go Ahead Group SharePoint connection</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={checkEnvironmentVariables}
            disabled={loading}
          >
            <Text style={styles.buttonText}>📋 Check Configuration</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={testHealthCheck}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🏥 Health Check</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.authButton]}
            onPress={testMicrosoftAuth}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🔐 Test Authentication</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.sharePointButton]}
            onPress={testSharePointConnection}
            disabled={loading || !accessToken}
          >
            <Text style={styles.buttonText}>📁 Test SharePoint</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.librariesButton]}
            onPress={testSharePointLibraries}
            disabled={loading || !accessToken}
          >
            <Text style={styles.buttonText}>📚 List Libraries</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.clearButton]}
            onPress={clearResults}
            disabled={loading}
          >
            <Text style={styles.buttonText}>🗑️ Clear Results</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#30cfd0" />
            <Text style={styles.loadingText}>Running test...</Text>
          </View>
        )}

        <ScrollView style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          {results.map((result) => (
            <View key={result.id} style={[styles.resultItem, styles[`result${result.type}`]]}>
              <Text style={styles.resultTime}>{result.timestamp}</Text>
              <Text style={styles.resultMessage}>{result.message}</Text>
            </View>
          ))}
          
          {results.length === 0 && (
            <Text style={styles.noResults}>No test results yet. Run a test to see results here.</Text>
          )}
        </ScrollView>

        <View style={styles.statusContainer}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusValue, accessToken ? styles.authenticated : styles.notAuthenticated]}>
            {accessToken ? '🔓 Authenticated' : '🔒 Not Authenticated'}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
    minWidth: '48%',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#30cfd0',
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  authButton: {
    backgroundColor: '#FF9800',
  },
  sharePointButton: {
    backgroundColor: '#2196F3',
  },
  librariesButton: {
    backgroundColor: '#9C27B0',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    color: '#888',
    marginTop: 10,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  resultItem: {
    padding: 10,
    marginBottom: 8,
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  resultinfo: {
    backgroundColor: '#2a2a3e',
    borderLeftColor: '#30cfd0',
  },
  resultsuccess: {
    backgroundColor: '#1a4a1a',
    borderLeftColor: '#4CAF50',
  },
  resulterror: {
    backgroundColor: '#4a1a1a',
    borderLeftColor: '#F44336',
  },
  resultTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  resultMessage: {
    fontSize: 14,
    color: '#ffffff',
  },
  noResults: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: '#888',
    marginRight: 10,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  authenticated: {
    color: '#4CAF50',
  },
  notAuthenticated: {
    color: '#F44336',
  },
});