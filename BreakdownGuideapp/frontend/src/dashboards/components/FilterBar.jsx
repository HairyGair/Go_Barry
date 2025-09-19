import React from 'react';
import { theme } from '@styles/theme';

const FilterBar = ({ 
  filters, 
  activeFilter, 
  onFilterChange,
  showCount = true,
  className = ''
}) => {
  return (
    <div className={`filter-bar ${className}`}>
      <div className="filters">
        {filters.map(filter => (
          <button
            key={filter.value}
            className={`filter-btn ${activeFilter === filter.value ? 'active' : ''}`}
            onClick={() => onFilterChange(filter.value)}
            data-filter={filter.value}
          >
            {filter.icon && <span className="filter-icon">{filter.icon}</span>}
            <span className="filter-label">{filter.label}</span>
            {showCount && filter.count !== undefined && (
              <span className="filter-count">{filter.count}</span>
            )}
          </button>
        ))}
      </div>

      <style jsx>{`
        .filter-bar {
          background: var(--bg-secondary);
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
        }
        
        .filters {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }
        
        .filter-btn {
          background: var(--bg-primary);
          color: var(--text-secondary);
          border: 1px solid var(--border);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: 14px;
          font-weight: 500;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        
        .filter-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--border-hover);
          transform: translateY(-1px);
        }
        
        .filter-btn.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
        
        .filter-btn.active:hover {
          background: var(--color-primary-dark);
          border-color: var(--color-primary-dark);
        }
        
        .filter-icon {
          font-size: 16px;
        }
        
        .filter-label {
          font-weight: 500;
        }
        
        .filter-count {
          background: var(--bg-tertiary);
          color: var(--text-primary);
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 12px;
          font-weight: 600;
          margin-left: var(--spacing-xs);
        }
        
        .filter-btn.active .filter-count {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }
        
        @media (max-width: 768px) {
          .filter-bar {
            padding: var(--spacing-xs);
          }
          
          .filters {
            gap: var(--spacing-xs);
          }
          
          .filter-btn {
            padding: var(--spacing-xs) var(--spacing-sm);
            font-size: 13px;
          }
          
          .filter-icon {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default FilterBar;
