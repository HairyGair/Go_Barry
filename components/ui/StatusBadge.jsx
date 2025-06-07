

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors, { getStatusColor } from '../../constants/Colors';

const StatusBadge = ({ status }) => {
  const backgroundColor = getStatusColor(status);
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{status?.toUpperCase() || 'N/A'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default StatusBadge;