/*
 * Go Barry - Data Formatting Utilities
 * Functions for formatting and transforming statistics data
 */

// Format numbers with appropriate units
export const formatNumber = (num, precision = 1) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(precision) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(precision) + 'K';
  }
  return num.toString();
};

// Format duration (minutes to human readable)
export const formatDuration = (minutes) => {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  } else if (minutes < 60) {
    return `${minutes.toFixed(1)} min${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }
};

// Format percentage with sign
export const formatPercentage = (value, includeSign = true) => {
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

// Format timestamp to relative time
export const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  return time.toLocaleDateString('en-GB');
};

// Format response time with color coding
export const formatResponseTime = (timeMs, thresholds = { good: 1000, warning: 3000 }) => {
  let status = 'good';
  if (timeMs > thresholds.warning) status = 'critical';
  else if (timeMs > thresholds.good) status = 'warning';

  const timeStr = timeMs < 1000 ? 
    `${timeMs}ms` : 
    `${(timeMs / 1000).toFixed(1)}s`;

  return { time: timeStr, status };
};

// Format route numbers with proper sorting
export const formatRouteNumber = (route) => {
  // Handle special route formats like X21, Q3, etc.
  const match = route.match(/^([A-Z]*)(\d+)([A-Z]*)$/);
  if (match) {
    const [, prefix, number, suffix] = match;
    return {
      formatted: route,
      sortKey: `${prefix}_${number.padStart(3, '0')}_${suffix}`
    };
  }
  return { formatted: route, sortKey: route };
};

// Sort routes in logical order
export const sortRoutes = (routes) => {
  return routes
    .map(route => ({
      ...route,
      ...formatRouteNumber(route.route || route.name || route)
    }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
};

// Format supervisor names consistently
export const formatSupervisorName = (name) => {
  if (!name) return 'Unknown';
  
  // Handle "FirstName LastName" format
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1].charAt(0)}.`;
  }
  
  return name;
};

// Format status with proper casing
export const formatStatus = (status) => {
  if (!status) return 'Unknown';
  
  return status
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format geographical coordinates
export const formatCoordinates = (lat, lng, precision = 4) => {
  if (!lat || !lng) return 'Unknown location';
  
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};

// Extract and format time ranges
export const formatTimeRange = (timeRange) => {
  const ranges = {
    'today': 'Today',
    'yesterday': 'Yesterday',
    'week': 'This Week',
    'month': 'This Month',
    'quarter': 'This Quarter',
    'year': 'This Year'
  };
  
  return ranges[timeRange] || timeRange;
};

// Format API error messages for display
export const formatErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  if (error.status) {
    switch (error.status) {
      case 404:
        return 'Data not found';
      case 500:
        return 'Server error - please try again';
      case 503:
        return 'Service temporarily unavailable';
      default:
        return `Error ${error.status}`;
    }
  }
  
  return 'An unexpected error occurred';
};

// Format export data for CSV
export const formatForExport = (data, type = 'csv') => {
  if (!Array.isArray(data)) return '';
  
  if (type === 'csv') {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }
  
  return JSON.stringify(data, null, 2);
};

// Calculate efficiency score
export const calculateEfficiency = (actions, responseTime, target = { actions: 20, responseTime: 5 }) => {
  const actionScore = Math.min(actions / target.actions, 1) * 50;
  const timeScore = Math.max(0, (target.responseTime - responseTime) / target.responseTime) * 50;
  
  return Math.round(actionScore + timeScore);
};