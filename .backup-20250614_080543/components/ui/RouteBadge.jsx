

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

const RouteBadge = ({ route }) => (
  <View style={styles.badge}>
    <Text style={styles.text}>{route}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.route.background,
    borderColor: Colors.route.border,
    borderWidth: 1,
  },
  text: {
    color: Colors.route.text,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default RouteBadge;