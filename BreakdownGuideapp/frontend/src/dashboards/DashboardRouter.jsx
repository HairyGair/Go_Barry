import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

// Lazy-loaded Dashboard Components
const ControlRoomDisplay = lazy(() => import('./control-room/ControlRoomDisplay'));
const EngineeringDashboard = lazy(() => import('./engineering/EngineeringDashboard'));
const ManagementDashboard = lazy(() => import('./management/ManagementDashboard'));
const SDCDashboard = lazy(() => import('./sdc/SDCDashboard'));
const LiveRouteStatusDashboard = lazy(() => import('./gtfs/LiveRouteStatusDashboard'));
const RouteTimetableViewer = lazy(() => import('./gtfs/RouteTimetableViewer'));
const StopFinder = lazy(() => import('./gtfs/StopFinder'));
const FleetIntelligenceDashboard = lazy(() => import('./fleet-intelligence/FleetIntelligenceDashboard'));
const EngineerManagementPage = lazy(() => import('./engineering/EngineerManagementPage'));
const EVChargesDashboard = lazy(() => import('./ev-charges/EVChargesDashboard'));

const DashboardFallback = () => (
  <div className="loading-container" role="status" aria-live="polite">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Route guard: redirects engineering_manager away from non-engineering routes
const EngineeringGuard = ({ children }) => {
  const { currentUser } = useAuth();
  if (currentUser?.role === 'engineering_manager') {
    return <Navigate to="/dashboards/engineering/manage" replace />;
  }
  return children;
};

const DashboardRouter = () => {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <Routes>
        {/* Redirect old /breakdown route to /control-room */}
        <Route path="/" element={<Navigate to="/dashboards/control-room" replace />} />
        <Route path="/breakdown" element={<Navigate to="/dashboards/control-room" replace />} />

        {/* Engineering routes — accessible to all roles */}
        <Route path="/engineering" element={<EngineeringDashboard />} />
        <Route path="/engineering/manage" element={<EngineerManagementPage />} />

        {/* Non-engineering dashboards — guarded for engineering_manager */}
        <Route path="/control-room" element={<EngineeringGuard><ControlRoomDisplay /></EngineeringGuard>} />
        <Route path="/management" element={<EngineeringGuard><ManagementDashboard /></EngineeringGuard>} />
        <Route path="/sdc" element={<EngineeringGuard><SDCDashboard /></EngineeringGuard>} />
        <Route path="/gtfs/routes" element={<EngineeringGuard><LiveRouteStatusDashboard /></EngineeringGuard>} />
        <Route path="/gtfs/timetable" element={<EngineeringGuard><RouteTimetableViewer /></EngineeringGuard>} />
        <Route path="/gtfs/stops" element={<EngineeringGuard><StopFinder /></EngineeringGuard>} />
        <Route path="/fleet-defects" element={<EngineeringGuard><FleetIntelligenceDashboard /></EngineeringGuard>} />
        <Route path="/ev-charges" element={<EngineeringGuard><EVChargesDashboard /></EngineeringGuard>} />
      </Routes>
    </Suspense>
  );
};

export default DashboardRouter;
