// Enhanced Action Button Component with Better CTAs
import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const ActionButton = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, danger, success, ghost
  size = 'medium', // small, medium, large
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  animated = true,
  badge,
  style,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated && variant === 'primary') {
      // Subtle glow animation for primary buttons
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [animated, variant]);

  const handlePressIn = () => {
    if (!disabled && animated) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const getVariantStyles = () => {
    const variants = {
      primary: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
        textColor: '#FFFFFF',
      },
      secondary: {
        backgroundColor: 'transparent',
        borderColor: '#3B82F6',
        textColor: '#3B82F6',
      },
      danger: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
        textColor: '#FFFFFF',
      },
      success: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        textColor: '#FFFFFF',
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        textColor: '#64748B',
      },
    };
    return variants[variant] || variants.primary;
  };

  const getSizeStyles = () => {
    const sizes = {
      small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        fontSize: 14,
        iconSize: 16,
      },
      medium: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        fontSize: 16,
        iconSize: 20,
      },
      large: {
        paddingVertical: 16,
        paddingHorizontal: 32,
        fontSize: 18,
        iconSize: 24,
      },
    };
    return sizes[size] || sizes.medium;
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const glowInterpolation = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(59, 130, 246, 0)', 'rgba(59, 130, 246, 0.3)'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        {
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {animated && variant === 'primary' && (
        <Animated.View
          style={[
            styles.glow,
            {
              backgroundColor: glowInterpolation,
            },
          ]}
        />
      )}
      
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: variantStyles.backgroundColor,
            borderColor: variantStyles.borderColor,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
          },
          variant === 'secondary' && styles.secondaryButton,
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.8}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={variantStyles.textColor} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && iconPosition === 'left' && (
              <Ionicons
                name={icon}
                size={sizeStyles.iconSize}
                color={variantStyles.textColor}
                style={styles.iconLeft}
              />
            )}
            
            <Text
              style={[
                styles.text,
                {
                  color: variantStyles.textColor,
                  fontSize: sizeStyles.fontSize,
                },
              ]}
            >
              {title}
            </Text>
            
            {icon && iconPosition === 'right' && (
              <Ionicons
                name={icon}
                size={sizeStyles.iconSize}
                color={variantStyles.textColor}
                style={styles.iconRight}
              />
            )}
            
            {badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Floating Action Button (FAB)
export const FloatingActionButton = ({
  icon = 'add',
  onPress,
  position = 'bottom-right',
  color = '#3B82F6',
  mini = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress();
  };

  const getPositionStyle = () => {
    const positions = {
      'bottom-right': { bottom: 24, right: 24 },
      'bottom-left': { bottom: 24, left: 24 },
      'top-right': { top: 24, right: 24 },
      'top-left': { top: 24, left: 24 },
    };
    return positions[position] || positions['bottom-right'];
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.fab,
        getPositionStyle(),
        mini && styles.fabMini,
        {
          transform: [{ scale: scaleAnim }, { rotate: rotation }],
          backgroundColor: color,
        },
      ]}
    >
      <TouchableOpacity onPress={handlePress} style={styles.fabButton}>
        <Ionicons name={icon} size={mini ? 20 : 24} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Button Group Component
export const ButtonGroup = ({ children, style }) => {
  return <View style={[styles.buttonGroup, style]}>{children}</View>;
};

// Quick Action Card
export const QuickActionCard = ({
  title,
  description,
  icon,
  color = '#3B82F6',
  onPress,
  badge,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.quickActionCard,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={24} color="#FFFFFF" />
          {badge && (
            <View style={styles.quickActionBadge}>
              <Text style={styles.quickActionBadgeText}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.quickActionTitle}>{title}</Text>
        {description && (
          <Text style={styles.quickActionDescription}>{description}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fullWidth: {
    width: '100%',
  },
  button: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  secondaryButton: {
    borderWidth: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  badge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 28,
  },

  // FAB Styles
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Button Group Styles
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
  },

  // Quick Action Card Styles
  quickActionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    minWidth: 100,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  quickActionBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActionTitle: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  quickActionDescription: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default ActionButton;