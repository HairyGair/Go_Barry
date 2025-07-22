// Enhanced Card component with hover effects for web
import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';

export const EnhancedTouchableCard = ({ children, style, ...props }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity
        {...props}
        style={[
          style,
          isHovered && {
            transform: [{ translateY: -4 }],
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
          }
        ]}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={style} {...props}>
      {children}
    </TouchableOpacity>
  );
};