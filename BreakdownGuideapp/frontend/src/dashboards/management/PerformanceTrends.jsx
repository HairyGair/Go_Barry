import React, { useState } from 'react';

const PerformanceTrends = ({ trendData, period }) => {
  const [selectedChart, setSelectedChart] = useState('breakdowns');

  if (!trendData) return null;

  const chartOptions = [
    { key: 'breakdowns', label: 'Breakdowns', icon: '🔧' },
    { key: 'responseTime', label: 'Response Time', icon: '⏱️' },
    { key: 'slaCompliance', label: 'SLA Compliance', icon: '📊' }
  ];

  const currentData = trendData[selectedChart];

  // Simple line chart component
  const SimpleLineChart = ({ data, height = 250 }) => {
    if (!data || !data.datasets || data.datasets.length === 0) return null;

    const maxValue = Math.max(...data.datasets.flatMap(d => d.data));
    const minValue = Math.min(...data.datasets.flatMap(d => d.data));
    const range = maxValue - minValue;
    const padding = range * 0.1;
    const chartMax = maxValue + padding;
    const chartMin = Math.max(0, minValue - padding);
    const chartRange = chartMax - chartMin;

    return (
      <div className="simple-chart">
        <svg viewBox={`0 0 500 ${height}`} preserveAspectRatio="xMidYMid meet">
          {/* Y-axis labels */}
          {[0, 1, 2, 3, 4].map(i => {
            const value = chartMin + (chartRange * (1 - i/4));
            return (
              <g key={i}>
                <text
                  x="40"
                  y={20 + (i * (height - 40) / 4)}
                  textAnchor="end"
                  fill="#6b7280"
                  fontSize="11"
                >
                  {Math.round(value)}
                </text>
                <line
                  x1="50"
                  y1={20 + (i * (height - 40) / 4)}
                  x2="480"
                  y2={20 + (i * (height - 40) / 4)}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* Data lines */}
          {data.datasets.map((dataset, datasetIndex) => {
            const points = dataset.data.map((value, index) => {
              const x = 50 + (index * (430 / (dataset.data.length - 1)));
              const y = height - 20 - ((value - chartMin) / chartRange * (height - 40));
              return `${x},${y}`;
            }).join(' ');

            return (
              <g key={datasetIndex}>
                {/* Line */}
                <polyline
                  points={points}
                  fill="none"
                  stroke={dataset.color}
                  strokeWidth="2"
                />
                
                {/* Data points */}
                {dataset.data.map((value, index) => {
                  const x = 50 + (index * (430 / (dataset.data.length - 1)));
                  const y = height - 20 - ((value - chartMin) / chartRange * (height - 40));
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={dataset.color}
                    />
                  );
                })}

                {/* Target line if exists */}
                {dataset.target && (
                  <line
                    x1="50"
                    y1={height - 20 - ((dataset.target - chartMin) / chartRange * (height - 40))}
                    x2="480"
                    y2={height - 20 - ((dataset.target - chartMin) / chartRange * (height - 40))}
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
              </g>
            );
          })}

          {/* X-axis labels */}
          {data.labels.map((label, index) => (
            <text
              key={index}
              x={50 + (index * (430 / (data.labels.length - 1)))}
              y={height - 5}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="10"
            >
              {label}
            </text>
          ))}
        </svg>

        {/* Legend */}
        <div className="chart-legend">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: dataset.color }}
              ></div>
              <span>{dataset.label}</span>
              {dataset.target && (
                <span className="target-indicator">Target: {dataset.target}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="performance-trends">
      <div className="trends-header">
        <h2>Performance Trends</h2>
        <div className="chart-selector">
          {chartOptions.map(option => (
            <button
              key={option.key}
              className={`chart-btn ${selectedChart === option.key ? 'active' : ''}`}
              onClick={() => setSelectedChart(option.key)}
            >
              <span className="chart-icon">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-container">
        <SimpleLineChart data={currentData} />
      </div>

      <style jsx>{`
        .performance-trends {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 20px;
        }

        .trends-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        h2 {
          color: #1e3a8a;
          font-size: 24px;
          font-weight: 600;
        }

        .chart-selector {
          display: flex;
          gap: 10px;
        }

        .chart-btn {
          padding: 8px 16px;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .chart-btn:hover {
          background: #f9fafb;
        }

        .chart-btn.active {
          background: #1e3a8a;
          color: white;
          border-color: #1e3a8a;
        }

        .chart-icon {
          font-size: 16px;
        }

        .chart-container {
          position: relative;
          width: 100%;
        }

        .simple-chart {
          width: 100%;
        }

        .simple-chart svg {
          width: 100%;
          height: auto;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 15px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #4b5563;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .target-indicator {
          margin-left: 10px;
          color: #ef4444;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .trends-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .chart-selector {
            flex-wrap: wrap;
          }

          .chart-btn {
            font-size: 13px;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceTrends;
