import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import EmailIntegration from './EmailIntegration';

const TestEmailIntegration = () => {
  const [showEmail, setShowEmail] = React.useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email Integration Test</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => setShowEmail(true)}
      >
        <Text style={styles.buttonText}>Open Email Integration</Text>
      </TouchableOpacity>

      {showEmail && (
        <EmailIntegration onClose={() => setShowEmail(false)} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#059669',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TestEmailIntegration;