/*
 * Go Barry - Chart Data Hook
 * Handles data processing and formatting for charts
 */

import { useState, useEffect, useMemo } from 'react';
import { formatTimeSeriesData, formatPieChartData, generateChartColors } from '../utils/chartHelpers.js';
import { statisticsTheme } from '../styles/statistics.styles.js';

export const useChartData = ({ data, chartType, options = {} }) => {
  const [processedData, setProcessedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Chart colors based on theme
  const chartColors = useMemo(() => {
    const count = options.colorCount || 5;
    return generateChartColors(count, statisticsTheme);
  }, [options.colorCount]);

  // Process data based on chart type
  useEffect(() => {
    if (!data) {
      setProcessedData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let processed;

      switch (chartType) {
        case 'line':
        case 'area':
          processed = formatTimeSeriesData(
            data, 
            options.timeKey || 'timestamp', 
            options.valueKey || 'value'
          );
          break;

        case 'pie':
        case 'doughnut':
          processed = formatPieChartData(
            data,
            options.labelKey || 'label',
            options.valueKey || 'value'
          ).map((item, index) => ({
            ...item,
            color: chartColors[index % chartColors.length]
          }));
          break;

        case 'bar':
        case 'column':
          processed = data.map((item, index) => ({
            name: item[options.nameKey || 'name'],
            value: item[options.valueKey || 'value'],
            color: chartColors[index % chartColors.length]
          }));
          break;

        case 'scatter':
          processed = data.map(item => ({
            x: item[options.xKey || 'x'],
            y: item[options.yKey || 'y'],
            size: item[options.sizeKey || 'size'] || 5
          }));
          break;

        default:
          processed = data;
      }

      setProcessedData(processed);
    } catch (err) {
      console.error('Error processing chart data:', err);
      setError(err.message);
      setProcessedData(null);
    } finally {
      setLoading(false);
    }
  }, [data, chartType, options, chartColors]);

  // Chart configuration based on type
  const chartConfig = useMemo(() => {
    const baseConfig = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#FFFFFF',
          bodyColor: '#FFFFFF',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12
        }
      }
    };

    switch (chartType) {
      case 'line':
        return {
          ...baseConfig,
          scales: {
            x: {
              grid: {
                color: statisticsTheme.charts.grid,
                drawBorder: false
              },
              ticks: {
                color: statisticsTheme.charts.text,
                font: { size: 11 }
              }
            },
            y: {
              grid: {
                color: statisticsTheme.charts.grid,
                drawBorder: false
              },
              ticks: {
                color: statisticsTheme.charts.text,
                font: { size: 11 }
              },
              beginAtZero: true
            }
          },
          elements: {
            line: {
              tension: 0.3,
              borderWidth: 2
            },
            point: {
              radius: 4,
              hoverRadius: 6
            }
          }
        };

      case 'bar':
        return {
          ...baseConfig,
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: statisticsTheme.charts.text,
                font: { size: 11 }
              }
            },
            y: {
              grid: {
                color: statisticsTheme.charts.grid,
                drawBorder: false
              },
              ticks: {
                color: statisticsTheme.charts.text,
                font: { size: 11 }
              },
              beginAtZero: true
            }
          },
          elements: {
            bar: {
              borderRadius: 4,
              borderSkipped: false
            }
          }
        };

      case 'pie':
      case 'doughnut':
        return {
          ...baseConfig,
          cutout: chartType === 'doughnut' ? '60%' : '0%',
          plugins: {
            ...baseConfig.plugins,
            legend: {
              ...baseConfig.plugins.legend,
              position: 'right'
            }
          }
        };

      default:
        return baseConfig;
    }
  }, [chartType]);

  // Helper function to get chart data in Chart.js format
  const getChartJSData = () => {
    if (!processedData) return null;

    switch (chartType) {
      case 'line':
      case 'area':
        return {
          labels: processedData.map(item => item.time),
          datasets: [{
            label: options.label || 'Value',
            data: processedData.map(item => item.value),
            borderColor: chartColors[0],
            backgroundColor: chartType === 'area' ? 
              `${chartColors[0]}20` : chartColors[0],
            fill: chartType === 'area'
          }]
        };

      case 'bar':
        return {
          labels: processedData.map(item => item.name),
          datasets: [{
            label: options.label || 'Value',
            data: processedData.map(item => item.value),
            backgroundColor: processedData.map(item => item.color),
            borderColor: processedData.map(item => item.color),
            borderWidth: 1
          }]
        };

      case 'pie':
      case 'doughnut':
        return {
          labels: processedData.map(item => item.name),
          datasets: [{
            data: processedData.map(item => item.value),
            backgroundColor: processedData.map(item => item.color),
            borderColor: '#FFFFFF',
            borderWidth: 2
          }]
        };

      default:
        return {
          datasets: [{
            data: processedData,
            backgroundColor: chartColors[0]
          }]
        };
    }
  };

  return {
    data: processedData,
    chartData: getChartJSData(),
    chartConfig,
    chartColors,
    loading,
    error
  };
};