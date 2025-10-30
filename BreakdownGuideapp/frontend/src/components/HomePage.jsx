/**
 * Go BARRY Breakdown Management System
 *
 * Copyright © 2025 Anthony Gair. All Rights Reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying,
 * distribution, modification, or use is strictly prohibited.
 *
 * @author Anthony Gair
 * @license Proprietary
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import LiveActivityFeed from './LiveActivityFeed.jsx';
import { fetchDashboardData } from '../utils/fetchDashboardData.js';

const HomePage = ({ onStatsChange }) => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, isLoading, isSessionChecking } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeBreakdowns: 0,
      todayTotal: 0,
      avgResponseTime: 0,
      fleetHealth: 100
    },
    activityFeed: [],
    metadata: null
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isSessionChecking && !isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, isSessionChecking, navigate]);

  // Fetch dashboard data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('📊 HomePage: Loading dashboard data and setting up polling');
      loadDashboardData();
      // Refresh every 30 seconds
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 HomePage: Starting dashboard data fetch...');
      const data = await fetchDashboardData();
      console.log('✅ HomePage: Dashboard data received:', data);
      console.log('📊 Activity feed data:', data.activityFeed);
      console.log('📊 Activity feed length:', data.activityFeed?.length);
      
      // Ensure data has the correct structure
      const safeData = {
        stats: data.stats || {
          activeBreakdowns: 0,
          todayTotal: 0,
          avgResponseTime: 0,
          fleetHealth: 100
        },
        activityFeed: data.activityFeed || [],
        metadata: data.metadata || null
      };
      
      setDashboardData(safeData);
      if (onStatsChange && safeData.stats) {
        onStatsChange(safeData.stats.activeBreakdowns);
      }
    } catch (error) {
      console.error('❌ HomePage: Error fetching dashboard data:', error);
      console.error('❌ Error stack:', error.stack);
      
      // Set fallback data to prevent blank page
      setDashboardData({
        stats: {
          activeBreakdowns: 0,
          todayTotal: 0,
          avgResponseTime: 0,
          fleetHealth: 100
        },
        activityFeed: [],
        metadata: { error: error.message }
      });
    }
  };

  // Show loading while checking session
  if (isSessionChecking || isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Should not reach here if not authenticated (redirect happens above)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="homepage">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Welcome back, {currentUser?.name || 'Supervisor'}!</h1>
        <p className="subtitle">Go North East Breakdown Management System</p>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Active Breakdowns</h3>
            <p className="stat-value">{dashboardData.stats?.activeBreakdowns || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Today's Assessments</h3>
            <p className="stat-value">{dashboardData.stats?.todayTotal || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>Avg Response Time</h3>
            <p className="stat-value">{dashboardData.stats?.avgResponseTime || 0} min</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <button 
            className="action-card"
            onClick={() => navigate('/breakdown-guide')}
          >
            <div className="action-icon">🚨</div>
            <h3>Report Breakdown</h3>
            <p>Start a new breakdown assessment</p>
          </button>

          <button 
            className="action-card"
            onClick={() => navigate('/dashboards/breakdown')}
          >
            <div className="action-icon">📊</div>
            <h3>View Dashboard</h3>
            <p>Monitor active breakdowns</p>
          </button>

          <button 
            className="action-card"
            onClick={() => navigate('/dashboards/sdc')}
          >
            <div className="action-icon">🎛️</div>
            <h3>SDC Operations</h3>
            <p>Service Delivery Centre</p>
          </button>

          <button 
            className="action-card"
            onClick={() => navigate('/dashboards/engineering')}
          >
            <div className="action-icon">🔧</div>
            <h3>Engineering</h3>
            <p>Engineering dashboard</p>
          </button>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="activity-section">
        <h2>Recent Activity</h2>
        <div className="activity-feed-wrapper">
          {dashboardData.metadata?.error ? (
            <div className="activity-feed-error">
              <p>⚠️ Unable to load activity feed</p>
              <p className="error-detail">{dashboardData.metadata.error}</p>
              <button onClick={loadDashboardData} className="retry-button">
                🔄 Retry
              </button>
            </div>
          ) : (
            <LiveActivityFeed 
              activities={dashboardData.activityFeed || []} 
              embedded={true}
            />
          )}
        </div>
      </div>

      <style>{`
        .homepage {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3182ce;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .welcome-section {
          text-align: center;
          margin-bottom: 40px;
          padding: 40px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
        }

        .welcome-section h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          font-weight: 700;
        }

        .subtitle {
          margin: 0;
          opacity: 0.95;
          font-size: 16px;
        }

        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .stat-icon {
          font-size: 32px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .stat-content h3 {
          margin: 0 0 4px 0;
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
        }

        .stat-value {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }

        .quick-actions {
          margin-bottom: 40px;
        }

        .quick-actions h2 {
          margin: 0 0 20px 0;
          font-size: 24px;
          color: #111827;
        }

        .action-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .action-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .action-card:hover {
          border-color: #3182ce;
          background: #f0f9ff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(49, 130, 206, 0.15);
        }

        .action-icon {
          font-size: 36px;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 12px;
        }

        .action-card h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .action-card p {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
        }

        .activity-section {
          margin-bottom: 40px;
        }

        .activity-section h2 {
          margin: 0 0 20px 0;
          font-size: 24px;
          color: #111827;
        }

        .activity-feed-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          color: #991b1b;
        }

        .activity-feed-error p {
          margin: 0 0 8px 0;
        }

        .error-detail {
          font-size: 14px;
          color: #6b7280;
          font-family: monospace;
          margin-bottom: 16px !important;
        }

        .retry-button {
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .retry-button:hover {
          background: #b91c1c;
        }

        @media (max-width: 768px) {
          .homepage {
            padding: 16px;
          }

          .welcome-section h1 {
            font-size: 24px;
          }

          .dashboard-stats {
            grid-template-columns: 1fr;
          }

          .action-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .action-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;