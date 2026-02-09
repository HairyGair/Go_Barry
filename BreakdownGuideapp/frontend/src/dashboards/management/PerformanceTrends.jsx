import React, { useState } from 'react';

const PerformanceTrends = ({ trendData, period }) => {
  const [selectedChart, setSelectedChart] = useState('breakdowns');

  if (!trendData) return null;

  const chartOptions = [
    {
      key: 'breakdowns',
      label: 'Breakdowns',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      )
    },
    {
      key: 'responseTime',
      label: 'Response Time',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      )
    },
    {
      key: 'slaCompliance',
      label: 'SLA Compliance',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10"/>
          <line x1="18" y1="20" x2="18" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="16"/>
        </svg>
      )
    }
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
      <div className="pt-simple-chart">
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
                  fill="#94A3B8"
                  fontSize="11"
                >
                  {Math.round(value)}
                </text>
                <line
                  x1="50"
                  y1={20 + (i * (height - 40) / 4)}
                  x2="480"
                  y2={20 + (i * (height - 40) / 4)}
                  stroke="#1E293B"
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
              fill="#94A3B8"
              fontSize="10"
            >
              {label}
            </text>
          ))}
        </svg>

        {/* Legend */}
        <div className="pt-chart-legend">
          {data.datasets.map((dataset, index) => (
            <div key={index} className="pt-legend-item">
              <div
                className="pt-legend-color"
                style={{ backgroundColor: dataset.color }}
              ></div>
              <span>{dataset.label}</span>
              {dataset.target && (
                <span className="pt-target-indicator">Target: {dataset.target}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="pt-performance-trends">
      <div className="pt-trends-header">
        <h2>Performance Trends</h2>
        <div className="pt-chart-selector">
          {chartOptions.map(option => (
            <button
              key={option.key}
              className={`pt-chart-btn ${selectedChart === option.key ? 'active' : ''}`}
              onClick={() => setSelectedChart(option.key)}
            >
              <span className="pt-chart-icon">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-chart-container">
        <SimpleLineChart data={currentData} />
      </div>

      <style jsx>{`
        .pt-performance-trends {
          background: #141D2B;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          margin-bottom: 20px;
        }

        .pt-trends-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        h2 {
          color: #0097A7;
          font-size: 24px;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
        }

        .pt-chart-selector {
          display: flex;
          gap: 10px;
        }

        .pt-chart-btn {
          padding: 8px 16px;
          border: 1px solid #1E293B;
          background: #0F1624;
          color: #94A3B8;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Inter', sans-serif;
        }

        .pt-chart-btn:hover {
          background: #1E293B;
        }

        .pt-chart-btn.active {
          background: linear-gradient(135deg, #0097A7, #00838F);
          color: white;
          border-color: #0097A7;
        }

        .pt-chart-icon {
          font-size: 16px;
          display: flex;
          align-items: center;
        }

        .pt-chart-container {
          position: relative;
          width: 100%;
        }

        .pt-simple-chart {
          width: 100%;
        }

        .pt-simple-chart svg {
          width: 100%;
          height: auto;
        }

        .pt-chart-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 15px;
          flex-wrap: wrap;
        }

        .pt-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #94A3B8;
          font-family: 'Inter', sans-serif;
        }

        .pt-legend-color {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }

        .pt-target-indicator {
          margin-left: 10px;
          color: #ef4444;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .pt-trends-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .pt-chart-selector {
            flex-wrap: wrap;
          }

          .pt-chart-btn {
            font-size: 13px;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default PerformanceTrends;
