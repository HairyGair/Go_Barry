import React from 'react';
import DashboardLayout from './components/DashboardLayout';

const TestDashboard = () => {
  return (
    <DashboardLayout title="Test Dashboard">
      <div style={{ padding: '20px' }}>
        <h2>Test Dashboard Working!</h2>
        <p>If you can see this, the dashboard infrastructure is working correctly.</p>
        <div style={{ background: '#10b981', color: 'white', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
          ✅ Dashboard is loading properly!
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TestDashboard;
