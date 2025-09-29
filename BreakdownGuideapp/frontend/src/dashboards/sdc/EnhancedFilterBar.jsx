import React, { useState } from 'react';

/**
 * Enhanced Filter Bar for SDC Dashboard
 * Shows detailed assessment information, supervisor names, progress percentages, and counts
 */
const EnhancedFilterBar = ({ 
  filters, 
  activeFilter, 
  onFilterChange,
  className = ''
}) => {
  const [hoveredFilter, setHoveredFilter] = useState(null);

  return (
    <div className={`enhanced-filter-bar ${className}`}>
      <div className="filters-container">
        {filters.map(filter => (
          <div
            key={filter.value}
            className={`filter-wrapper ${activeFilter === filter.value ? 'active' : ''}`}
            onMouseEnter={() => setHoveredFilter(filter.value)}
            onMouseLeave={() => setHoveredFilter(null)}
          >
            <button
              className={`enhanced-filter-btn ${activeFilter === filter.value ? 'active' : ''}`}
              onClick={() => onFilterChange(filter.value)}
              data-filter={filter.value}
            >
              <div className="filter-main">
                <div className="filter-header">
                  {filter.icon && <span className="filter-icon">{filter.icon}</span>}
                  <span className="filter-label">{filter.label}</span>
                  <span className="filter-count">{filter.count || 0}</span>
                </div>
                
                {filter.subtitle && (
                  <div className="filter-subtitle">{filter.subtitle}</div>
                )}
              </div>
              
              {/* Enhanced details for In Assessment filter */}
              {filter.value === 'in-assessment' && filter.details && (
                <div className="assessment-details">
                  {filter.details.supervisors.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Supervisors:</span>
                      <span className="detail-value">
                        {filter.details.supervisors.join(', ')}
                        {filter.details.supervisors.length >= 3 && ' +more'}
                      </span>
                    </div>
                  )}
                  {filter.details.types.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Types:</span>
                      <span className="detail-value">
                        {filter.details.types.map(type => type.replace('Wizard', '')).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="progress-bar-container">
                    <div className="progress-label">Avg Progress: {filter.details.avgProgress}%</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${filter.details.avgProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </button>
            
            {/* Tooltip for additional information */}
            {hoveredFilter === filter.value && filter.details && (
              <div className="filter-tooltip">
                <div className="tooltip-header">Assessment Details</div>
                <div className="tooltip-content">
                  <div className="tooltip-item">
                    <span className="tooltip-icon">👥</span>
                    <span>{filter.details.supervisors.length} active supervisor{filter.details.supervisors.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="tooltip-item">
                    <span className="tooltip-icon">📊</span>
                    <span>{filter.details.avgProgress}% average progress</span>
                  </div>
                  <div className="tooltip-item">
                    <span className="tooltip-icon">🔧</span>
                    <span>{filter.details.types.length} assessment type{filter.details.types.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .enhanced-filter-bar {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.9) 0%, 
            rgba(248, 250, 252, 0.95) 100%
          );
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          backdrop-filter: blur(10px);
          box-shadow: 
            0 4px 16px rgba(0, 0, 0, 0.04),
            0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        .filters-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .filter-wrapper {
          position: relative;
        }
        
        .enhanced-filter-btn {
          width: 100%;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.8) 0%, 
            rgba(248, 250, 252, 0.6) 100%
          );
          border: 1px solid rgba(226, 232, 240, 0.5);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          position: relative;
          overflow: hidden;
        }
        
        .enhanced-filter-btn:hover {
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.95) 0%, 
            rgba(248, 250, 252, 0.8) 100%
          );
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
          box-shadow: 
            0 8px 25px rgba(0, 0, 0, 0.08),
            0 3px 10px rgba(0, 0, 0, 0.1);
        }
        
        .enhanced-filter-btn.active {
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.1) 0%, 
            rgba(37, 99, 235, 0.05) 100%
          );
          border-color: rgba(59, 130, 246, 0.4);
          box-shadow: 
            0 4px 16px rgba(59, 130, 246, 0.15),
            0 2px 8px rgba(59, 130, 246, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
        }
        
        .filter-main {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .filter-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .filter-icon {
          font-size: 18px;
          min-width: 20px;
        }
        
        .filter-label {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          flex: 1;
        }
        
        .filter-count {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          min-width: 24px;
          text-align: center;
        }
        
        .enhanced-filter-btn.active .filter-count {
          background: linear-gradient(135deg, #1d4ed8, #1e40af);
        }
        
        .filter-subtitle {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
          line-height: 1.3;
        }
        
        .assessment-details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(226, 232, 240, 0.5);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }
        
        .detail-label {
          color: #6b7280;
          font-weight: 500;
        }
        
        .detail-value {
          color: #374151;
          font-weight: 600;
          font-family: 'Monaco', 'Consolas', monospace;
          max-width: 120px;
          text-align: right;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .progress-bar-container {
          margin-top: 6px;
        }
        
        .progress-label {
          font-size: 10px;
          color: #6b7280;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .progress-bar {
          height: 4px;
          background: rgba(226, 232, 240, 0.6);
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        
        .filter-tooltip {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%) translateY(-100%);
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.95) 0%, 
            rgba(30, 41, 59, 0.95) 100%
          );
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1000;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
        
        .filter-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(15, 23, 42, 0.95);
        }
        
        .tooltip-header {
          font-weight: 600;
          margin-bottom: 8px;
          color: #e2e8f0;
        }
        
        .tooltip-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .tooltip-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }
        
        .tooltip-icon {
          font-size: 12px;
        }
        
        @media (max-width: 768px) {
          .filters-container {
            grid-template-columns: 1fr;
          }
          
          .enhanced-filter-btn {
            padding: 12px;
          }
          
          .filter-tooltip {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 280px;
          }
          
          .detail-value {
            max-width: 100px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedFilterBar;