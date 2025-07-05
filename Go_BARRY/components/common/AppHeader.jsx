import React from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';

const AppHeader = () => {
  return (
    <View style={styles.header}>
      <Image 
        source={require('../../assets/gobarry-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      },
    }),
  },
  logo: {
    height: 40,
    width: 120,
  },
});

export default AppHeader;