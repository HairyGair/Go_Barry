import React from 'react';
import { Link } from 'react-router-dom';

const DashboardDebug = () => {
  const [authStatus, setAuthStatus] = React.useState(null);
  const [apiStatus, setApiStatus] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // Check authentication
    try {
      const session = localStorage.getItem('supervisor_session');
      setAuthStatus(session ? JSON.parse(session) : null);
    } catch (e) {
      setError('Failed to parse auth session: ' + e.message);
    }

    // Check API
    fetch('https://breakdown-guide.onrender.com/api/breakdowns/live')
      .then(res => {
        setApiStatus({
          status: res.status,
          statusText: res.statusText,
          ok: res.ok
        });
        return res.json();
      })
      .then(data => {
        setApiStatus(prev => ({
          ...prev,
          data: data
        }));
      })
      .catch(err => {
        setApiStatus({
          error: err.message
        });
      });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Dashboard Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Navigation</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/dashboards/breakdown" style={{ color: 'blue' }}>Breakdown Dashboard</Link>
          <Link to="/dashboards/sdc" style={{ color: 'blue' }}>SDC Dashboard</Link>
          <Link to="/dashboards/engineering" style={{ color: 'blue' }}>Engineering Dashboard</Link>
          <Link to="/dashboards/management" style={{ color: 'blue' }}>Management Dashboard</Link>
        </div>
      </div>

      <div style={{ background: '#f3f4f6', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
        <h2>Authentication Status</h2>
        {authStatus ? (
          <>
            <p style={{ color: 'green' }}>✅ Authenticated</p>
            <pre style={{ background: 'white', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(authStatus, null, 2)}
            </pre>
          </>
        ) : (
          <p style={{ color: 'red' }}>❌ Not Authenticated - Please login first</p>
        )}
      </div>

      <div style={{ background: '#f3f4f6', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
        <h2>API Status</h2>
        {apiStatus ? (
          apiStatus.error ? (
            <p style={{ color: 'red' }}>❌ API Error: {apiStatus.error}</p>
          ) : (
            <>
              <p>Status: {apiStatus.status} {apiStatus.statusText}</p>
              <p style={{ color: apiStatus.ok ? 'green' : 'red' }}>
                {apiStatus.ok ? '✅ API Connected' : '❌ API Failed'}
              </p>
              {apiStatus.data && (
                <pre style={{ background: 'white', padding: '10px', overflow: 'auto' }}>
                  {JSON.stringify(apiStatus.data, null, 2)}
                </pre>
              )}
            </>
          )
        ) : (
          <p>Loading API status...</p>
        )}
      </div>

      {error && (
        <div style={{ background: '#fee2e2', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
          <h2>Error</h2>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      )}

      <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px' }}>
        <h2>Browser Console</h2>
        <p>Open your browser console (F12) to see any JavaScript errors or debug logs.</p>
      </div>
    </div>
  );
};

export default DashboardDebug;
