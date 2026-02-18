import React from 'react';
import DashboardLayout from './components/DashboardLayout';
import TrendsDefectsPanel from './sdc/TrendsDefectsPanel';

/**
 * Fleet Defect Intelligence Dashboard
 *
 * Standalone dashboard wrapping TrendsDefectsPanel inside the app's DashboardLayout.
 * All UI, data fetching, and real-time updates are handled by TrendsDefectsPanel.
 */
const FleetDefectIntelligence = () => (
  <DashboardLayout title="Fleet Defect Intelligence">
    <TrendsDefectsPanel />
  </DashboardLayout>
);

export default FleetDefectIntelligence;
