import React from 'react';

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

      <style>{`
        .filter-bar {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 15px 20px;
        }

        .filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
          white-space: nowrap;
        }

        .filter-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .filter-btn.active {
          background: #1e3a8a;
          color: white;
          border-color: #1e3a8a;
          box-shadow: 0 2px 8px rgba(30, 58, 138, 0.3);
        }

        .filter-btn.active:hover {
          background: #1e3a8a;
          border-color: #1e3a8a;
        }

        .filter-icon {
          font-size: 16px;
          display: inline-flex;
          align-items: center;
        }

        .filter-label {
          font-weight: 500;
        }

        .filter-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          background: #e5e7eb;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 4px;
        }

        .filter-btn.active .filter-count {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        /* Add some special styles for specific filter types */
        .filter-btn[data-filter="sla-risk"],
        .filter-btn[data-filter="critical"] {
          border-color: #fee2e2;
        }

        .filter-btn[data-filter="sla-risk"]:hover,
        .filter-btn[data-filter="critical"]:hover {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .filter-btn[data-filter="priority"] {
          border-color: #fef3c7;
        }

        .filter-btn[data-filter="priority"]:hover {
          background: #fefce8;
          border-color: #fde68a;
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .filter-bar {
            padding: 10px 15px;
          }

          .filters {
            gap: 6px;
          }

          .filter-btn {
            padding: 6px 12px;
            font-size: 13px;
          }

          .filter-icon {
            font-size: 14px;
          }
        }

        /* Animation for filter changes */
        .filter-btn {
          position: relative;
          overflow: hidden;
        }

        .filter-btn::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(30, 58, 138, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.3s, height 0.3s;
        }

        .filter-btn:active::after {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default FilterBar;
