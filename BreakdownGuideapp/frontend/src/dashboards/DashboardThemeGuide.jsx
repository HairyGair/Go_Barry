// Theme Style Guide for Dashboards
// This file demonstrates how to apply the Go North East theme to dashboard components

// Option 1: CSS Variables in style jsx
export const themeStylesCSS = `
  /* Card Styles using CSS Variables */
  .dashboard-card {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--spacing-lg);
    transition: all var(--transition-normal);
  }
  
  .dashboard-card:hover {
    background-color: var(--bg-hover);
    border-color: var(--border-hover);
    box-shadow: var(--shadow-md);
  }
  
  /* Status Colors */
  .status-stop {
    color: var(--color-stop);
    background-color: rgba(228, 37, 27, 0.1);
  }
  
  .status-amber {
    color: var(--color-amber);
    background-color: rgba(255, 152, 0, 0.1);
  }
  
  .status-continue {
    color: var(--color-continue);
    background-color: rgba(40, 167, 69, 0.1);
  }
  
  /* Button Styles */
  .btn-primary {
    background-color: var(--color-primary);
    color: white;
    border: none;
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  
  .btn-primary:hover {
    background-color: var(--color-primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
`;

// Option 2: JavaScript theme usage
import { theme } from '@styles/theme';

export const themeStylesJS = {
  card: {
    backgroundColor: theme.colors.bgSecondary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    transition: theme.transitions.normal,
  },
  
  button: {
    backgroundColor: theme.colors.primary,
    color: 'white',
    border: 'none',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    borderRadius: theme.radius.sm,
    cursor: 'pointer',
    transition: theme.transitions.fast,
  },
  
  badge: (status) => ({
    backgroundColor: getStatusBackground(status),
    color: getStatusColor(status),
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.radius.full,
    fontSize: theme.fontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  }),
};

// Option 3: Pre-built theme classes
export const themeClasses = {
  card: 'theme-card',
  button: 'theme-btn theme-btn-primary',
  badge: {
    stop: 'theme-badge theme-badge-stop',
    amber: 'theme-badge theme-badge-amber',
    continue: 'theme-badge theme-badge-continue',
    danger: 'theme-badge theme-badge-danger',
    warning: 'theme-badge theme-badge-warning',
    success: 'theme-badge theme-badge-success',
  },
  input: 'theme-input',
  table: 'theme-table',
};

// Migration Examples
export const migrationExamples = {
  // Before
  oldStyle: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    border: '1px solid #333',
  },
  
  // After - CSS Variables
  newStyleCSS: `
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border);
  `,
  
  // After - JavaScript
  newStyleJS: {
    backgroundColor: theme.colors.bgSecondary,
    color: theme.colors.textPrimary,
    border: `1px solid ${theme.colors.border}`,
  },
  
  // After - Classes
  newStyleClass: 'theme-card',
};

// Color Reference Card Component
export const ColorReferenceCard = () => `
  <div class="theme-card">
    <h3 style="color: var(--text-primary)">Color Reference</h3>
    
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-md);">
      <!-- Primary Colors -->
      <div>
        <h4 style="color: var(--text-secondary)">Primary</h4>
        <div style="background: var(--color-primary); padding: var(--spacing-sm); border-radius: var(--radius-sm);">
          --color-primary
        </div>
      </div>
      
      <!-- Background Colors -->
      <div>
        <h4 style="color: var(--text-secondary)">Backgrounds</h4>
        <div style="background: var(--bg-primary); padding: var(--spacing-sm); border: 1px solid var(--border);">
          --bg-primary
        </div>
        <div style="background: var(--bg-secondary); padding: var(--spacing-sm); border: 1px solid var(--border);">
          --bg-secondary
        </div>
        <div style="background: var(--bg-tertiary); padding: var(--spacing-sm); border: 1px solid var(--border);">
          --bg-tertiary
        </div>
      </div>
      
      <!-- Status Colors -->
      <div>
        <h4 style="color: var(--text-secondary)">Status</h4>
        <span class="theme-badge theme-badge-stop">STOP</span>
        <span class="theme-badge theme-badge-amber">AMBER</span>
        <span class="theme-badge theme-badge-continue">CONTINUE</span>
      </div>
      
      <!-- Alert Colors -->
      <div>
        <h4 style="color: var(--text-secondary)">Alerts</h4>
        <span class="theme-badge theme-badge-danger">Danger</span>
        <span class="theme-badge theme-badge-warning">Warning</span>
        <span class="theme-badge theme-badge-success">Success</span>
        <span class="theme-badge theme-badge-info">Info</span>
      </div>
    </div>
  </div>
`;
