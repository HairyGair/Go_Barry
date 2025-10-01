// React Native Compatible UI Components
// Cross-platform components that work on both web and mobile

import React, { useState, useRef, useEffect } from 'react'
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Modal,
  ActivityIndicator,
  Platform,
  Animated,
  Dimensions
} from 'react-native'

import { colors, typography, spacing, borderRadius, shadows, commonStyles } from './StyleUtils.js'
import { isWeb, alerts, vibration } from './PlatformUtils.js'

// Button component with loading and disabled states
export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  loading = false, 
  disabled = false,
  icon = null,
  style = {},
  textStyle = {},
  ...props 
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadius.lg,
      ...shadows.base
    }

    // Size variants
    const sizeStyles = {
      small: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2]
      },
      medium: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[3]
      },
      large: {
        paddingHorizontal: spacing[8],
        paddingVertical: spacing[4]
      }
    }

    // Color variants
    const variantStyles = {
      primary: {
        backgroundColor: disabled ? colors.gray[300] : colors.primary[600]
      },
      secondary: {
        backgroundColor: disabled ? colors.gray[100] : colors.gray[200]
      },
      success: {
        backgroundColor: disabled ? colors.gray[300] : colors.success
      },
      warning: {
        backgroundColor: disabled ? colors.gray[300] : colors.warning
      },
      error: {
        backgroundColor: disabled ? colors.gray[300] : colors.error
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: disabled ? colors.gray[300] : colors.primary[600]
      }
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: loading ? 0.7 : 1,
      ...style
    }
  }

  const getTextStyle = () => {
    const baseTextStyle = {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      textAlign: 'center'
    }

    const variantTextStyles = {
      primary: { color: colors.gray[50] },
      secondary: { color: colors.gray[700] },
      success: { color: colors.gray[50] },
      warning: { color: colors.gray[50] },
      error: { color: colors.gray[50] },
      outline: { color: disabled ? colors.gray[400] : colors.primary[600] }
    }

    return {
      ...baseTextStyle,
      ...variantTextStyles[variant],
      ...textStyle
    }
  }

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      vibration.vibrate(50) // Haptic feedback
      onPress()
    }
  }

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' ? colors.primary[600] : colors.gray[50]}
          style={{ marginRight: spacing[2] }}
        />
      )}
      {icon && !loading && (
        <View style={{ marginRight: spacing[2] }}>
          {icon}
        </View>
      )}
      <Text style={getTextStyle()}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}

// Input component with validation and error states
export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  multiline = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  editable = true,
  leftIcon = null,
  rightIcon = null,
  style = {},
  inputStyle = {},
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false)

  const getContainerStyle = () => ({
    marginBottom: spacing[4]
  })

  const getLabelStyle = () => ({
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing[2]
  })

  const getInputContainerStyle = () => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: error ? colors.error : (isFocused ? colors.primary[500] : colors.gray[300]),
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[4],
    ...(isFocused && shadows.base)
  })

  const getInputStyle = () => ({
    flex: 1,
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.base,
    color: colors.gray[900],
    textAlignVertical: multiline ? 'top' : 'center',
    ...inputStyle
  })

  const getErrorStyle = () => ({
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing[1]
  })

  return (
    <View style={[getContainerStyle(), style]}>
      {label && (
        <Text style={getLabelStyle()}>
          {label}
        </Text>
      )}
      <View style={getInputContainerStyle()}>
        {leftIcon && (
          <View style={{ marginRight: spacing[2] }}>
            {leftIcon}
          </View>
        )}
        <TextInput
          style={getInputStyle()}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <View style={{ marginLeft: spacing[2] }}>
            {rightIcon}
          </View>
        )}
      </View>
      {error && (
        <Text style={getErrorStyle()}>
          {error}
        </Text>
      )}
    </View>
  )
}

// Card component for content grouping
export const Card = ({ children, style = {}, ...props }) => {
  const cardStyle = {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    margin: spacing[2],
    ...shadows.md,
    ...style
  }

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  )
}

// Loading spinner component
export const LoadingSpinner = ({ size = 'large', color = colors.primary[600], text, style = {} }) => {
  return (
    <View style={[commonStyles.centerContent, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text style={[commonStyles.loadingText, { marginTop: spacing[4] }]}>
          {text}
        </Text>
      )}
    </View>
  )
}

// Modal component with enhanced features
export const CustomModal = ({ 
  visible, 
  onClose, 
  title, 
  children, 
  animationType = 'slide',
  style = {},
  ...props 
}) => {
  const modalStyle = {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4]
  }

  const contentStyle = {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    maxHeight: '90%',
    width: '100%',
    maxWidth: isWeb ? 500 : '100%',
    ...shadows.xl,
    ...style
  }

  const headerStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4]
  }

  const titleStyle = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900]
  }

  const closeButtonStyle = {
    padding: spacing[2],
    borderRadius: borderRadius.full
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={animationType}
      onRequestClose={onClose}
      {...props}
    >
      <View style={modalStyle}>
        <View style={contentStyle}>
          {title && (
            <View style={headerStyle}>
              <Text style={titleStyle}>{title}</Text>
              <TouchableOpacity
                style={closeButtonStyle}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: typography.fontSize.xl, color: colors.gray[500] }}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

// Alert component for notifications
export const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onDismiss, 
  actions = [],
  style = {} 
}) => {
  const getAlertStyle = () => {
    const baseStyle = {
      backgroundColor: colors.gray[50],
      borderRadius: borderRadius.lg,
      padding: spacing[4],
      margin: spacing[2],
      borderLeftWidth: 4,
      ...shadows.base
    }

    const typeStyles = {
      success: { borderLeftColor: colors.success },
      warning: { borderLeftColor: colors.warning },
      error: { borderLeftColor: colors.error },
      info: { borderLeftColor: colors.info }
    }

    return {
      ...baseStyle,
      ...typeStyles[type],
      ...style
    }
  }

  const getIconColor = () => {
    const iconColors = {
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info
    }
    return iconColors[type]
  }

  const getIcon = () => {
    const icons = {
      success: '✅',
      warning: '⚠️',
      error: '❌',
      info: 'ℹ️'
    }
    return icons[type]
  }

  return (
    <View style={getAlertStyle()}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Text style={{ fontSize: typography.fontSize.lg, marginRight: spacing[3] }}>
          {getIcon()}
        </Text>
        <View style={{ flex: 1 }}>
          {title && (
            <Text style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.gray[900],
              marginBottom: spacing[1]
            }}>
              {title}
            </Text>
          )}
          {message && (
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.gray[700],
              lineHeight: typography.lineHeight.normal
            }}>
              {message}
            </Text>
          )}
          {actions.length > 0 && (
            <View style={{ 
              flexDirection: 'row', 
              marginTop: spacing[3],
              gap: spacing[2] 
            }}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  title={action.text}
                  onPress={action.onPress}
                  variant={action.style || 'outline'}
                  size="small"
                />
              ))}
            </View>
          )}
        </View>
        {onDismiss && (
          <TouchableOpacity
            onPress={onDismiss}
            style={{ padding: spacing[1] }}
            activeOpacity={0.7}
          >
            <Text style={{ color: colors.gray[400], fontSize: typography.fontSize.lg }}>
              ×
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// Progress indicator component
export const ProgressBar = ({ 
  progress = 0, 
  height = 8, 
  color = colors.primary[600],
  backgroundColor = colors.gray[200],
  animated = true,
  style = {} 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false
      }).start()
    } else {
      animatedValue.setValue(progress)
    }
  }, [progress, animated])

  const containerStyle = {
    height,
    backgroundColor,
    borderRadius: height / 2,
    overflow: 'hidden',
    ...style
  }

  const progressStyle = {
    height: '100%',
    backgroundColor: color,
    borderRadius: height / 2
  }

  return (
    <View style={containerStyle}>
      <Animated.View
        style={[
          progressStyle,
          {
            width: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp'
            })
          }
        ]}
      />
    </View>
  )
}

// Status badge component
export const StatusBadge = ({ 
  status, 
  text, 
  size = 'medium',
  style = {} 
}) => {
  const getStatusColor = () => {
    const statusColors = {
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
      neutral: colors.gray[500]
    }
    return statusColors[status] || statusColors.neutral
  }

  const getSizeStyle = () => {
    const sizeStyles = {
      small: {
        paddingHorizontal: spacing[2],
        paddingVertical: spacing[1]
      },
      medium: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2]
      },
      large: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3]
      }
    }
    return sizeStyles[size]
  }

  const badgeStyle = {
    backgroundColor: getStatusColor(),
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    ...getSizeStyle(),
    ...style
  }

  const textStyle = {
    color: colors.gray[50],
    fontSize: size === 'small' ? typography.fontSize.xs : typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center'
  }

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>
        {text}
      </Text>
    </View>
  )
}

// Export all components
export default {
  Button,
  Input,
  Card,
  LoadingSpinner,
  CustomModal,
  Alert,
  ProgressBar,
  StatusBadge
}