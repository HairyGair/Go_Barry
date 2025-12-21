import React, { useMemo, useState, useRef, useEffect, memo } from 'react';
import PropTypes from 'prop-types';

/**
 * Virtualized Assessment List Component
 * Efficiently renders large lists of assessment items by only rendering visible items
 * Improves performance when dealing with hundreds of assessments
 */
const VirtualizedAssessmentList = memo(({
  items = [],
  renderItem,
  itemHeight = 120,
  containerHeight = 600,
  overscan = 5, // Number of items to render outside visible area
  className = '',
  onScroll,
  placeholder = null,
  threshold = 50 // Only use virtualization if items > threshold
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerRect, setContainerRect] = useState({ height: containerHeight });
  const containerRef = useRef(null);
  const scrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  // Don't virtualize if list is small
  const shouldVirtualize = items.length > threshold;

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (!shouldVirtualize) {
      return { start: 0, end: items.length };
    }

    const viewportHeight = containerRect.height;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    const end = Math.min(items.length, start + visibleCount + 2 * overscan);

    return { start, end };
  }, [scrollTop, containerRect.height, itemHeight, overscan, items.length, shouldVirtualize]);

  // Get visible items
  const visibleItems = useMemo(() => {
    if (!shouldVirtualize) {
      return items.map((item, index) => ({ item, index }));
    }

    return items
      .slice(visibleRange.start, visibleRange.end)
      .map((item, relativeIndex) => ({
        item,
        index: visibleRange.start + relativeIndex
      }));
  }, [items, visibleRange, shouldVirtualize]);

  // Calculate total height and offset
  const totalHeight = useMemo(() => {
    return shouldVirtualize ? items.length * itemHeight : 'auto';
  }, [items.length, itemHeight, shouldVirtualize]);

  const offsetY = useMemo(() => {
    return shouldVirtualize ? visibleRange.start * itemHeight : 0;
  }, [visibleRange.start, itemHeight, shouldVirtualize]);

  // Handle scroll events
  const handleScroll = (event) => {
    const newScrollTop = event.target.scrollTop;
    setScrollTop(newScrollTop);

    // Track scrolling state
    scrollingRef.current = true;
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set timeout to detect end of scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      scrollingRef.current = false;
    }, 150);

    // Call external scroll handler
    if (onScroll) {
      onScroll(event, {
        scrollTop: newScrollTop,
        visibleRange,
        isScrolling: true
      });
    }
  };

  // Observe container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerRect({
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Scroll to specific item
  const scrollToItem = (index, align = 'start') => {
    if (!containerRef.current || !shouldVirtualize) return;

    const container = containerRef.current;
    const itemTop = index * itemHeight;
    
    let scrollTo;
    switch (align) {
      case 'center':
        scrollTo = itemTop - (containerRect.height / 2) + (itemHeight / 2);
        break;
      case 'end':
        scrollTo = itemTop - containerRect.height + itemHeight;
        break;
      default: // 'start'
        scrollTo = itemTop;
    }

    container.scrollTo({
      top: Math.max(0, scrollTo),
      behavior: 'smooth'
    });
  };

  // Expose scroll methods via ref
  React.useImperativeHandle(React.forwardRef(), () => ({
    scrollToItem,
    scrollToTop: () => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
    scrollToBottom: () => containerRef.current?.scrollTo({ 
      top: containerRef.current.scrollHeight, 
      behavior: 'smooth' 
    }),
    getVisibleRange: () => visibleRange,
    isScrolling: () => scrollingRef.current
  }));

  // Render empty state
  if (items.length === 0) {
    return (
      <div className={`virtualized-list-empty ${className}`}>
        {placeholder || (
          <div className="empty-message">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No assessments to display</div>
          </div>
        )}
        
        <style jsx>{`
          .virtualized-list-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            height: ${containerHeight}px;
            background: linear-gradient(135deg, 
              rgba(255, 255, 255, 0.9) 0%, 
              rgba(248, 250, 252, 0.95) 100%
            );
            border: 1px solid rgba(226, 232, 240, 0.6);
            border-radius: 12px;
          }
          
          .empty-message {
            text-align: center;
          }
          
          .empty-icon {
            font-size: 48px;
            margin-bottom: 12px;
            opacity: 0.6;
          }
          
          .empty-text {
            font-size: 16px;
            color: #6b7280;
            font-weight: 500;
          }
        `}</style>
      </div>
    );
  }

  // Non-virtualized rendering for small lists
  if (!shouldVirtualize) {
    return (
      <div 
        ref={containerRef}
        className={`virtualized-list-simple ${className}`}
        style={{ maxHeight: containerHeight, overflowY: 'auto' }}
        onScroll={handleScroll}
      >
        {items.map((item, index) => (
          <div key={item.id || index} className="list-item">
            {renderItem(item, index, {
              isVisible: true,
              isScrolling: scrollingRef.current
            })}
          </div>
        ))}
        
        <style jsx>{`
          .virtualized-list-simple {
            background: transparent;
          }
          
          .list-item {
            margin-bottom: 8px;
          }
          
          .list-item:last-child {
            margin-bottom: 0;
          }
        `}</style>
      </div>
    );
  }

  // Virtualized rendering for large lists
  return (
    <div 
      ref={containerRef}
      className={`virtualized-list ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div 
        className="virtual-spacer-before"
        style={{ height: offsetY }}
      />
      
      <div className="virtual-items">
        {visibleItems.map(({ item, index }) => (
          <div 
            key={item.id || index}
            className="virtual-item"
            style={{ 
              height: itemHeight,
              minHeight: itemHeight
            }}
            data-index={index}
          >
            {renderItem(item, index, {
              isVisible: true,
              isScrolling: scrollingRef.current,
              virtualIndex: index
            })}
          </div>
        ))}
      </div>
      
      <div 
        className="virtual-spacer-after"
        style={{ 
          height: Math.max(0, totalHeight - offsetY - (visibleItems.length * itemHeight))
        }}
      />
      
      {/* Performance indicators (development only) */}
      {import.meta.env.DEV && (
        <div className="virtual-debug">
          <div className="debug-info">
            Items: {items.length} | Visible: {visibleItems.length} | 
            Range: {visibleRange.start}-{visibleRange.end}
          </div>
        </div>
      )}
      
      <style jsx>{`
        .virtualized-list {
          overflow-y: auto;
          overflow-x: hidden;
          position: relative;
          background: transparent;
        }
        
        .virtual-spacer-before,
        .virtual-spacer-after {
          flex-shrink: 0;
        }
        
        .virtual-items {
          position: relative;
        }
        
        .virtual-item {
          display: flex;
          flex-direction: column;
          justify-content: center;
          margin-bottom: 8px;
          position: relative;
        }
        
        .virtual-item:last-child {
          margin-bottom: 0;
        }
        
        .virtual-debug {
          position: sticky;
          bottom: 0;
          right: 0;
          z-index: 1000;
          pointer-events: none;
        }
        
        .debug-info {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          font-size: 11px;
          font-family: monospace;
          border-radius: 4px;
          margin: 8px;
          width: fit-content;
          margin-left: auto;
        }
        
        /* Smooth scrolling performance */
        .virtualized-list {
          scroll-behavior: smooth;
          will-change: scroll-position;
        }
        
        /* Hide scrollbar on webkit browsers for cleaner look */
        .virtualized-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .virtualized-list::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        
        .virtualized-list::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
        }
        
        .virtualized-list::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
});

VirtualizedAssessmentList.displayName = 'VirtualizedAssessmentList';

VirtualizedAssessmentList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    })
  ),
  renderItem: PropTypes.func.isRequired,
  itemHeight: PropTypes.number,
  containerHeight: PropTypes.number,
  overscan: PropTypes.number,
  className: PropTypes.string,
  onScroll: PropTypes.func,
  placeholder: PropTypes.node,
  threshold: PropTypes.number
};

VirtualizedAssessmentList.defaultProps = {
  items: [],
  itemHeight: 120,
  containerHeight: 600,
  overscan: 5,
  className: '',
  onScroll: null,
  placeholder: null,
  threshold: 50
};

export default VirtualizedAssessmentList;