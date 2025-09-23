import React from 'react';
import { theme } from '@styles/theme';
import './StatsCard.css';

const StatsCard = ({ 
  value, 
  label, 
  change = null, 
  trend = null, 
  icon = null,
  variant = 'default',
  unit = null // Optional unit to display separately
}) => {
  // Parse value to separate number and unit if not provided separately
  const parseValue = (val) => {
    if (unit) {
      return { number: val, unit: unit };
    }
    
    // Try to parse common patterns like "19", "1m", "89%"
    const match = String(val).match(/^([0-9.,]+)\s*([a-zA-Z%]+)?$/);
    if (match) {
      return {
        number: match[1],
        unit: match[2] || ''
      };
    }
    return { number: val, unit: '' };
  };
  
  const { number, unit: displayUnit } = parseValue(value);
  
  // Variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          borderColor: theme.colors.danger,
          iconBackground: `rgba(220, 53, 69, 0.1)`,
          valueColor: theme.colors.danger
        };
      case 'warning':
        return {
          borderColor: theme.colors.warning,
          iconBackground: `rgba(255, 193, 7, 0.1)`,
          valueColor: theme.colors.warning
        };
      case 'success':
        return {
          borderColor: theme.colors.success,
          iconBackground: `rgba(40, 167, 69, 0.1)`,
          valueColor: theme.colors.success
        };
      case 'info':
        return {
          borderColor: theme.colors.info,
          iconBackground: `rgba(23, 162, 184, 0.1)`,
          valueColor: theme.colors.info
        };
      default:
        return {
          borderColor: theme.colors.border,
          iconBackground: theme.colors.bgTertiary,
          valueColor: theme.colors.textPrimary
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div 
      className="stat-card"
      style={{ borderLeftColor: variantStyles.borderColor }}
    >
      <div className="stat-content">
        {icon && (
          <div 
            className="stat-icon"
            style={{ background: variantStyles.iconBackground }}
          >
            {icon}
          </div>
        )}
        <div className="stat-details">
          <div 
            className="stat-value-wrapper"
            style={{ color: variantStyles.valueColor }}
          >
            <span className="stat-value-number">{number}</span>
            {displayUnit && <span className="stat-value-unit">{displayUnit}</span>}
          </div>
          <div className="stat-label">{label}</div>
        </div>
      </div>
      {change !== null && (
        <div className={`stat-change ${trend}`}>
          {trend === 'positive' && '↑ '}
          {trend === 'negative' && '↓ '}
          {change}
        </div>
      )}
    </div>
  );
};

export default StatsCard;
