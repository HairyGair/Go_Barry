import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Dashboard Components
import ControlRoomDisplay from './control-room/ControlRoomDisplay';
import EngineeringDashboard from './engineering/EngineeringDashboard';
import ManagementDashboard from './management/ManagementDashboard';
import SDCDashboard from './sdc/SDCDashboard';
import DashboardDebug from './DashboardDebug';
import TestDashboard from './TestDashboard';

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

      {/* Debug routes */}
      <Route path="/debug" element={<DashboardDebug />} />
      <Route path="/test" element={<TestDashboard />} />
    </Routes>
  );
};

export default DashboardRouter;
