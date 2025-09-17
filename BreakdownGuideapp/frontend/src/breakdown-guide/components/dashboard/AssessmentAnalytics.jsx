import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Clock, CheckCircle } from 'lucide-react';

const AssessmentAnalytics = ({ assessments, timeframe = 'today' }) => {
  // Calculate analytics data
  const analyticsData = useMemo(() => {
    // Decision distribution
    const decisionCounts = assessments.reduce((acc, assessment) => {
      const decision = assessment.severity || 'Pending';
      acc[decision] = (acc[decision] || 0) + 1;
      return acc;
    }, {});

    const decisionData = [
      { name: 'STOP', value: decisionCounts.STOP || 0, color: '#dc3545' },
      { name: 'AMBER', value: decisionCounts.AMBER || 0, color: '#ffc107' },
      { name: 'CONTINUE', value: decisionCounts.CONTINUE || 0, color: '#28a745' },
      { name: 'Pending', value: decisionCounts.Pending || 0, color: '#6c757d' }
    ];

    // Assessment types distribution
    const typeCounts = assessments.reduce((acc, assessment) => {
      const type = assessment.assessment_type || 'General';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const typeData = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 types

    // Hourly distribution
    const hourlyData = Array(24).fill(0).map((_, hour) => ({
      hour: `${hour}:00`,
      count: 0
    }));

    assessments.forEach(assessment => {
      const hour = new Date(assessment.created_at).getHours();
      hourlyData[hour].count++;
    });

    // Average assessment time
    const completedAssessments = assessments.filter(a => a.resolved_at);
    const avgTime = completedAssessments.reduce((acc, assessment) => {
      const start = new Date(assessment.created_at);
      const end = new Date(assessment.resolved_at);
      const minutes = (end - start) / (1000 * 60);
      return acc + minutes;
    }, 0) / (completedAssessments.length || 1);

    // Depot distribution
    const depotCounts = assessments.reduce((acc, assessment) => {
      const depot = assessment.depot_id || 'Unknown';
      acc[depot] = (acc[depot] || 0) + 1;
      return acc;
    }, {});

    const depotData = Object.entries(depotCounts)
      .map(([depot, count]) => ({ depot, count }))
      .sort((a, b) => b.count - a.count);

    return {
      decisionData,
      typeData,
      hourlyData,
      depotData,
      summary: {
        total: assessments.length,
        completed: completedAssessments.length,
        avgTime: Math.round(avgTime),
        stopPercentage: Math.round((decisionCounts.STOP || 0) / assessments.length * 100) || 0
      }
    };
  }, [assessments]);

  return (
    <div className="assessment-analytics">
      {/* Summary Cards */}
      <div className="analytics-summary">
        <div className="summary-card">
          <Activity className="icon" />
          <div className="content">
            <div className="value">{analyticsData.summary.total}</div>
            <div className="label">Total Assessments</div>
          </div>
        </div>
        
        <div className="summary-card">
          <CheckCircle className="icon" />
          <div className="content">
            <div className="value">{analyticsData.summary.completed}</div>
            <div className="label">Completed</div>
          </div>
        </div>
        
        <div className="summary-card">
          <Clock className="icon" />
          <div className="content">
            <div className="value">{analyticsData.summary.avgTime}m</div>
            <div className="label">Avg Time</div>
          </div>
        </div>
        
        <div className="summary-card">
          <TrendingUp className="icon" />
          <div className="content">
            <div className="value">{analyticsData.summary.stopPercentage}%</div>
            <div className="label">STOP Rate</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Decision Distribution Pie Chart */}
        <div className="chart-container">
          <h3>Decision Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={analyticsData.decisionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => 
                  value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analyticsData.decisionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Assessment Types Bar Chart */}
        <div className="chart-container full-width">
          <h3>Most Common Assessment Types</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#007bff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Distribution */}
        <div className="chart-container full-width">
          <h3>Assessments by Hour</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#28a745" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Depot Distribution */}
        <div className="chart-container">
          <h3>By Depot</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.depotData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="depot" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#ffc107" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style jsx>{`
        .assessment-analytics {
          height: 100%;
        }

        .analytics-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
          margin-bottom: 20px;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .summary-card .icon {
          width: 24px;
          height: 24px;
          color: #007bff;
        }

        .summary-card .value {
          font-size: 24px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .summary-card .label {
          font-size: 12px;
          color: #666;
          margin-top: 2px;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .chart-container {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
        }

        .chart-container.full-width {
          grid-column: span 2;
        }

        .chart-container h3 {
          margin: 0 0 10px;
          font-size: 16px;
          color: #1a1a1a;
        }

        @media (max-width: 768px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }

          .chart-container.full-width {
            grid-column: span 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AssessmentAnalytics;