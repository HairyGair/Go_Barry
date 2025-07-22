import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const NotificationBanner = ({ notifications }) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  React.useEffect(() => {
    if (notifications && notifications.length > 0) {
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [notifications]);

  if (!notifications || notifications.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'alert': return 'warning';
      case 'message': return 'mail';
      case 'system': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'alert': return '#ef4444';
      case 'message': return '#8b5cf6';
      case 'system': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <Animated.View style={[
      styles.container,
      {
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      {notifications.map((notif, index) => (
        <View key={index} style={[
          styles.notification,
          { borderLeftColor: getColor(notif.type) }
        ]}>
          <Ionicons 
            name={getIcon(notif.type)} 
            size={20} 
            color={getColor(notif.type)} 
          />
          <View style={styles.content}>
            <Text style={styles.title}>{notif.title}</Text>
            <Text style={styles.message}>{notif.message}</Text>
          </View>
          <Text style={styles.time}>{notif.time}</Text>
        </View>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderLeftWidth: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    color: '#9ca3af',
  },
});