import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Dashboard Components (to be created)
import BreakdownDashboard from './breakdown/BreakdownDashboard';
import EngineeringDashboard from './engineering/EngineeringDashboard';
import ManagementDashboard from './management/ManagementDashboard';
import SDCDashboard from './sdc/SDCDashboard';
import DashboardDebug from './DashboardDebug';
import TestDashboard from './TestDashboard';

const DashboardRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboards/breakdown" replace />} />
      <Route path="/breakdown" element={<BreakdownDashboard />} />
      <Route path="/engineering" element={<EngineeringDashboard />} />
      <Route path="/management" element={<ManagementDashboard />} />
      <Route path="/sdc" element={<SDCDashboard />} />
      <Route path="/debug" element={<DashboardDebug />} />
      <Route path="/test" element={<TestDashboard />} />
    </Routes>
  );
};

export default DashboardRouter;
