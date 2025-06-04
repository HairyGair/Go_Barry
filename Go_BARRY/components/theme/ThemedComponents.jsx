// Go_BARRY/components/theme/ThemedComponents.jsx
// Modern, reusable components that follow the BARRY design system
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeContext';

// Themed Card Component
export const ThemedCard = ({ 
  children, 
  style, 
  elevated = false, 
  onPress,
  ...props 
}) => {
  const { theme, styles } = useTheme();
  const cardStyle = elevated ? styles.elevatedCard : styles.card;
  
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container 
      style={[cardStyle, style]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      {...props}
    >
      {children}
    </Container>
  );
};

// Themed Section Component
export const ThemedSection = ({ children, style, ...props }) => {
  const { styles } = useTheme();
  
  return (
    <View style={[styles.section, style]} {...props}>
      {children}
    </View>
  );
};

// Themed Text Components
export const ThemedText = ({ 
  children, 
  type = 'primary', 
  size = 'medium',
  weight = 'normal',
  style, 
  ...props 
}) => {
  const { theme } = useTheme();
  
  const getTextColor = () => {
    switch (type) {
      case 'primary': return theme.text.primary;
      case 'secondary': return theme.text.secondary;
      case 'light': return theme.text.light;
      case 'inverse': return theme.text.inverse;
      case 'accent': return theme.text.accent;
      default: return theme.text.primary;
    }
  };
  
  const getFontSize = () => {
    switch (size) {
      case 'small': return 12;
      case 'medium': return 14;
      case 'large': return 16;
      case 'xlarge': return 18;
      case 'title': return 20;
      case 'heading': return 24;
      case 'hero': return 28;
      default: return 14;
    }
  };
  
  const getFontWeight = () => {
    switch (weight) {
      case 'light': return '300';
      case 'normal': return '400';
      case 'medium': return '500';
      case 'semibold': return '600';
      case 'bold': return '700';
      default: return '400';
    }
  };
  
  return (
    <Text 
      style={[
        {
          color: getTextColor(),
          fontSize: getFontSize(),
          fontWeight: getFontWeight(),
        },
        style
      ]} 
      {...props}
    >
      {children}
    </Text>
  );
};

// Themed Button Components
export const ThemedButton = ({ 
  children, 
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  textStyle,
  onPress,
  ...props 
}) => {
  const { theme, styles, colors } = useTheme();
  
  const getButtonStyle = () => {
    const baseStyle = variant === 'secondary' ? styles.buttonSecondary : styles.button;
    
    const sizeStyles = {
      small: { paddingVertical: 8, paddingHorizontal: 12 },
      medium: { paddingVertical: 12, paddingHorizontal: 16 },
      large: { paddingVertical: 16, paddingHorizontal: 24 },
    };
    
    return [
      baseStyle,
      sizeStyles[size],
      disabled && { opacity: 0.5 },
      style
    ];
  };
  
  const getTextColor = () => {
    if (disabled) return colors.mediumGrey;
    if (variant === 'secondary') return colors.primary;
    return '#FFFFFF';
  };
  
  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="small" color={getTextColor()} />;
    }
    
    const textElement = (
      <ThemedText 
        style={[{ color: getTextColor(), fontWeight: '600' }, textStyle]}
      >
        {children}
      </ThemedText>
    );
    
    if (!icon) return textElement;
    
    const iconElement = (
      <Ionicons 
        name={icon} 
        size={16} 
        color={getTextColor()} 
        style={{ marginHorizontal: 4 }}
      />
    );
    
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// Themed Status Badge
export const ThemedStatusBadge = ({ 
  status, 
  children, 
  style,
  ...props 
}) => {
  const { theme, colors } = useTheme();
  
  const getStatusColor = () => {
    switch (status) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'info': return colors.info;
      case 'red': return colors.trafficAlert.active;
      case 'amber': return colors.trafficAlert.upcoming;
      case 'green': return colors.trafficAlert.planned;
      default: return colors.mediumGrey;
    }
  };
  
  const backgroundColor = getStatusColor();
  
  return (
    <View 
      style={[
        {
          backgroundColor,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          alignSelf: 'flex-start',
        },
        style
      ]}
      {...props}
    >
      <ThemedText 
        type="inverse" 
        size="small" 
        weight="semibold"
        style={{ textTransform: 'uppercase' }}
      >
        {children || status}
      </ThemedText>
    </View>
  );
};

// Themed Header Component
export const ThemedHeader = ({ 
  title, 
  subtitle, 
  rightComponent,
  style,
  ...props 
}) => {
  const { theme } = useTheme();
  
  return (
    <View 
      style={[
        {
          backgroundColor: theme.background.primary,
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.border.light,
        },
        style
      ]}
      {...props}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <ThemedText size="heading" weight="bold">
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText type="secondary" style={{ marginTop: 4 }}>
              {subtitle}
            </ThemedText>
          )}
        </View>
        {rightComponent && (
          <View style={{ marginLeft: 16 }}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
};

// Themed Loading Component
export const ThemedLoading = ({ 
  text = 'Loading...', 
  size = 'large',
  style,
  ...props 
}) => {
  const { theme, colors } = useTheme();
  
  return (
    <View 
      style={[
        {
          flex: 1,
          backgroundColor: theme.background.primary,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        },
        style
      ]}
      {...props}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      <ThemedText 
        type="secondary" 
        style={{ marginTop: 16, textAlign: 'center' }}
      >
        {text}
      </ThemedText>
    </View>
  );
};

// Themed Info Row (for settings, debug info, etc.)
export const ThemedInfoRow = ({ 
  label, 
  value, 
  icon,
  onPress,
  style,
  ...props 
}) => {
  const { theme } = useTheme();
  
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: theme.surface.secondary,
          borderRadius: 8,
          marginVertical: 4,
        },
        style
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      {...props}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={20} 
          color={theme.text.secondary} 
          style={{ marginRight: 12 }}
        />
      )}
      <View style={{ flex: 1 }}>
        <ThemedText type="secondary" size="small" weight="medium">
          {label}
        </ThemedText>
        <ThemedText style={{ marginTop: 2 }}>
          {value}
        </ThemedText>
      </View>
      {onPress && (
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={theme.text.light}
        />
      )}
    </Container>
  );
};

export default {
  ThemedCard,
  ThemedSection,
  ThemedText,
  ThemedButton,
  ThemedStatusBadge,
  ThemedHeader,
  ThemedLoading,
  ThemedInfoRow,
};
