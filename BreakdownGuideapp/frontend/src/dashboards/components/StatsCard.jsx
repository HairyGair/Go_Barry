import React from 'react';
import { theme } from '@styles/theme';

const StatsCard = ({ 
  value, 
  label, 
  change = null, 
  trend = null, 
  icon = null,
  variant = 'default'
}) => {
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
            className="stat-value"
            style={{ color: variantStyles.valueColor }}
          >
            {value}
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

      <style jsx>{`
        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-left: 4px solid;
          border-radius: var(--radius-md);
          padding: var(--spacing-lg);
          transition: all var(--transition-normal);
          height: 100%;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--border-hover);
        }
        
        .stat-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .stat-details {
          flex: 1;
        }
        
        .stat-value {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }
        
        .stat-label {
          font-size: 14px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        
        .stat-change {
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border);
          font-size: 14px;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .stat-change.positive {
          color: var(--color-success);
        }
        
        .stat-change.negative {
          color: var(--color-danger);
        }
        
        @media (max-width: 768px) {
          .stat-value {
            font-size: 24px;
          }
          
          .stat-icon {
            width: 40px;
            height: 40px;
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default StatsCard;
