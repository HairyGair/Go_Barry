import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

// Dashboard Components
import ControlRoomDisplay from './control-room/ControlRoomDisplay';
import EngineeringDashboard from './engineering/EngineeringDashboard';
import ManagementDashboard from './management/ManagementDashboard';
import SDCDashboard from './sdc/SDCDashboard';
import LiveRouteStatusDashboard from './gtfs/LiveRouteStatusDashboard';
import RouteTimetableViewer from './gtfs/RouteTimetableViewer';
import StopFinder from './gtfs/StopFinder';
import FleetIntelligenceDashboard from './fleet-intelligence/FleetIntelligenceDashboard';
import EngineerManagementPage from './engineering/EngineerManagementPage';

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
    </Routes>
  );
};

export default DashboardRouter;
