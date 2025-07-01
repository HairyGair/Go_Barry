/*
 * Go Barry - Chart Helper Utilities
 * Common functions for chart formatting and data manipulation
 */

// Format time series data for charts
export const formatTimeSeriesData = (data, timeKey = 'timestamp', valueKey = 'value') => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    time: new Date(item[timeKey]).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    value: item[valueKey] || 0,
    timestamp: item[timeKey]
  }));
};

// Format data for pie charts
export const formatPieChartData = (data, labelKey = 'label', valueKey = 'value') => {
  if (!Array.isArray(data)) return [];
  
  const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  
  return data.map(item => ({
    name: item[labelKey],
    value: item[valueKey] || 0,
    percentage: total > 0 ? ((item[valueKey] || 0) / total * 100).toFixed(1) : 0
  }));
};

// Format data for bar charts
export const formatBarChartData = (data, xKey = 'x', yKey = 'y') => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    x: item[xKey],
    y: item[yKey] || 0
  }));
};

// Generate chart colors based on theme
export const generateChartColors = (count, theme) => {
  const baseColors = [
    theme.charts.primary,
    theme.charts.secondary,
    theme.charts.warning,
    theme.charts.danger,
    theme.charts.info
  ];
  
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
};

// Calculate trend from two values
export const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return { value: 0, direction: 'neutral' };
  
  const change = ((current - previous) / previous) * 100;
  const direction = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
  
  return {
    value: Math.abs(change).toFixed(1),
    direction,
    symbol: change > 0 ? '+' : change < 0 ? '-' : ''
  };
};

// Format chart tooltips
export const formatTooltip = (value, label, unit = '') => {
  return `${label}: ${value}${unit}`;
};

// Responsive chart dimensions
export const getChartDimensions = (containerWidth, containerHeight, aspectRatio = 1.5) => {
  const maxWidth = Math.min(containerWidth, 600);
  const width = maxWidth;
  const height = Math.min(width / aspectRatio, containerHeight);
  
  return { width, height };
};

// Chart animation configurations
export const chartAnimations = {
  line: {
    duration: 750,
    easing: 'ease-in-out'
  },
  bar: {
    duration: 500,
    easing: 'ease-out'
  },
  pie: {
    duration: 1000,
    easing: 'ease-in-out'
  }
};