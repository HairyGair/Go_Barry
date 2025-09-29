/**
 * SDCFilterBar Component
 * Enhanced filter bar with persistence and clear visual design
 */

import React, { useState, useEffect } from 'react';

const SDCFilterBar = ({ 
  filters = [],
  activeFilter = 'all',
  onFilterChange,
  onSearch,
  stats = {},
  persistKey = 'sdc-filters'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Load persisted filter on mount
  useEffect(() => {
    const saved = localStorage.getItem(persistKey);
    if (saved) {
      try {
        const { filter, search } = JSON.parse(saved);
        if (filter && filters.some(f => f.value === filter)) {
          onFilterChange(filter);
        }
        if (search) {
          setSearchQuery(search);
          setIsSearchExpanded(true);
        }
      } catch (error) {
        console.error('Failed to load saved filters:', error);
      }
    }
  }, []);

  // Save filter changes
  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify({
        filter: activeFilter,
        search: searchQuery,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save filters:', error);
    }
  }, [activeFilter, searchQuery, persistKey]);

  const handleFilterClick = (filterValue) => {
    onFilterChange(filterValue);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  // Get count for each filter
  const getFilterCount = (filterValue) => {
    switch (filterValue) {
      case 'all': return stats.total || 0;
      case 'critical': return stats.critical || 0;
      case 'pending': return stats.pending || 0;
      case 'in-assessment': return stats.inAssessment || 0;
      case 'my-breakdowns': return stats.myBreakdowns || 0;
      case 'priority-routes': return stats.priorityRoutes || 0;
      default: return 0;
    }
  };

  return (
    <div className="sdc-filter-bar">
      <div className="filter-section">
        <div className="filter-tabs">
          {filters.map(filter => {
            const count = getFilterCount(filter.value);
            const isActive = activeFilter === filter.value;
            
            return (
              <button
                key={filter.value}
                className={`filter-tab ${isActive ? 'active' : ''} ${count === 0 ? 'empty' : ''}`}
                onClick={() => handleFilterClick(filter.value)}
                title={filter.label}
              >
                <span className="tab-icon">{filter.icon}</span>
                <span className="tab-label">{filter.label}</span>
                {count > 0 && (
                  <span className="tab-count">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="filter-actions">
          <button
            className={`search-toggle ${isSearchExpanded ? 'expanded' : ''}`}
            onClick={() => setIsSearchExpanded(!isSearchExpanded)}
            title="Search breakdowns"
          >
            <span className="search-icon">🔍</span>
          </button>
        </div>
      </div>

      {isSearchExpanded && (
        <form className="search-section" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder="Search by ID, fleet number, location, or supervisor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search"
                onClick={handleClearSearch}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <button type="submit" className="search-submit">
            Search
          </button>
        </form>
      )}

      <style jsx>{`
        .sdc-filter-bar {
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 16px;
          margin-bottom: 20px;
        }

        .filter-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }

        .filter-tabs::-webkit-scrollbar {
          height: 4px;
        }

        .filter-tabs::-webkit-scrollbar-track {
          background: transparent;
        }

        .filter-tabs::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }

        .filter-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .filter-tab:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
        }

        .filter-tab.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .filter-tab.empty {
          opacity: 0.6;
        }

        .tab-icon {
          font-size: 14px;
        }

        .tab-count {
          background: rgba(0, 0, 0, 0.1);
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 600;
        }

        .filter-tab.active .tab-count {
          background: rgba(255, 255, 255, 0.2);
        }

        .filter-actions {
          display: flex;
          gap: 8px;
        }

        .search-toggle {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .search-toggle:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .search-toggle.expanded {
          background: #eff6ff;
          border-color: #3b82f6;
        }

        .search-icon {
          font-size: 16px;
        }

        .search-section {
          display: flex;
          gap: 8px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
        }

        .search-input {
          width: 100%;
          padding: 10px 16px;
          padding-right: 40px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: #374151;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          background: white;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .clear-search {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e5e7eb;
          border: none;
          border-radius: 50%;
          color: #6b7280;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .clear-search:hover {
          background: #d1d5db;
          color: #374151;
        }

        .search-submit {
          padding: 10px 20px;
          background: #3b82f6;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .search-submit:hover {
          background: #2563eb;
        }

        @media (max-width: 768px) {
          .sdc-filter-bar {
            padding: 12px;
          }

          .filter-section {
            flex-direction: column;
            align-items: stretch;
          }

          .filter-tabs {
            order: 2;
            margin-top: 12px;
          }

          .filter-actions {
            order: 1;
            justify-content: flex-end;
          }

          .filter-tab {
            font-size: 12px;
            padding: 6px 12px;
          }

          .search-section {
            flex-direction: column;
          }

          .search-submit {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SDCFilterBar;