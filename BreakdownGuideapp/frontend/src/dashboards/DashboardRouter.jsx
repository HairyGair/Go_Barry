import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Dashboard Components
import ControlRoomDisplay from './control-room/ControlRoomDisplay';
import EngineeringDashboard from './engineering/EngineeringDashboard';
import ManagementDashboard from './management/ManagementDashboard';
import SDCDashboard from './sdc/SDCDashboard';
import LiveRouteStatusDashboard from './gtfs/LiveRouteStatusDashboard';
import RouteTimetableViewer from './gtfs/RouteTimetableViewer';
import StopFinder from './gtfs/StopFinder';
import FleetDefectIntelligence from './FleetDefectIntelligence';

const DashboardRouter = () => {
  return (
    <Routes>
      {/* Redirect old /breakdown route to /control-room */}
      <Route path="/" element={<Navigate to="/dashboards/control-room" replace />} />
      <Route path="/breakdown" element={<Navigate to="/dashboards/control-room" replace />} />

      {/* Main dashboards */}
      <Route path="/control-room" element={<ControlRoomDisplay />} />
      <Route path="/engineering" element={<EngineeringDashboard />} />
      <Route path="/management" element={<ManagementDashboard />} />
      <Route path="/sdc" element={<SDCDashboard />} />
      <Route path="/gtfs/routes" element={<LiveRouteStatusDashboard />} />
      <Route path="/gtfs/timetable" element={<RouteTimetableViewer />} />
      <Route path="/gtfs/stops" element={<StopFinder />} />
      <Route path="/fleet-defects" element={<FleetDefectIntelligence />} />
    </Routes>
  );
};

export default DashboardRouter;
