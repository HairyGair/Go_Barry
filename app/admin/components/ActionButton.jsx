/*
 * Go Barry - Traffic Intelligence Platform
 * ActionButton Component - Reusable action button
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkTheme } from '../styles/darkTheme';

const ActionButton = ({ 
  title,
  onPress,
  icon,
  variant = 'primary', // 'primary', 'danger', 'success', 'warning'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  style
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];
    
    if (variant === 'primary') baseStyle.push(styles.buttonPrimary);
    else if (variant === 'danger') baseStyle.push(styles.buttonDanger);
    else if (variant === 'success') baseStyle.push(styles.buttonSuccess);
    else if (variant === 'warning') baseStyle.push(styles.buttonWarning);
    
    if (disabled) baseStyle.push(styles.buttonDisabled);
    
    return baseStyle;
  };

  const getTextColor = () => {
    if (disabled) return darkTheme.textMuted;
    return darkTheme.button.text;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        ...getButtonStyle(),
        pressed && !disabled && styles.buttonPressed,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && (
            <MaterialCommunityIcons 
              name={icon} 
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20} 
              color={getTextColor()} 
            />
          )}
          <Text style={[
            styles.text,
            styles[`text_${size}`],
            { color: getTextColor() }
          ]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 8,
  },
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  button_medium: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  button_large: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  buttonPrimary: {
    backgroundColor: darkTheme.button.primary,
  },
  buttonDanger: {
    backgroundColor: darkTheme.button.danger,
  },
  buttonSuccess: {
    backgroundColor: darkTheme.button.success,
  },
  buttonWarning: {
    backgroundColor: darkTheme.button.warning,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  text: {
    fontWeight: '600',
  },
  text_small: {
    fontSize: 14,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
  },
});

export default ActionButton;
