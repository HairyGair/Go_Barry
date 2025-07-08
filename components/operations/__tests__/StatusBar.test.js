import React from 'react';
import { render } from '@testing-library/react-native';
import StatusBar from '../../../app/operations-centre/components/StatusBar';

describe('StatusBar', () => {
  const mockSystemStatus = {
    backend: { status: 'operational', latency: 45 },
    database: { status: 'operational' },
    websocket: { status: 'connected', connections: 5 },
    dataFreshness: 15000,
    activeAlerts: 23,
    supervisorsOnline: 3,
    lastSync: new Date().toISOString(),
  };

  it('renders all service indicators', () => {
    const { getByText } = render(<StatusBar systemStatus={mockSystemStatus} />);
    
    expect(getByText('Backend API')).toBeTruthy();
    expect(getByText('Database')).toBeTruthy();
    expect(getByText('WebSocket')).toBeTruthy();
    expect(getByText('Data Feed')).toBeTruthy();
  });

  it('displays correct status for operational services', () => {
    const { getByText } = render(<StatusBar systemStatus={mockSystemStatus} />);
    
    // Should show operational status
    expect(getByText('45ms')).toBeTruthy(); // Backend latency
    expect(getByText('5 connected')).toBeTruthy(); // WebSocket connections
    expect(getByText('Live (15s ago)')).toBeTruthy(); // Data freshness
  });

  it('handles error states correctly', () => {
    const errorStatus = {
      ...mockSystemStatus,
      backend: { status: 'error' },
      websocket: { status: 'disconnected', connections: 0 },
    };
    
    const { getByText } = render(<StatusBar systemStatus={errorStatus} />);
    
    expect(getByText('Error')).toBeTruthy();
    expect(getByText('0 connected')).toBeTruthy();
  });

  it('displays real-time stats', () => {
    const { getByText } = render(<StatusBar systemStatus={mockSystemStatus} />);
    
    expect(getByText('23 Active Alerts')).toBeTruthy();
    expect(getByText('3 Supervisors Online')).toBeTruthy();
  });

  it('formats last sync time correctly', () => {
    const { getByText } = render(<StatusBar systemStatus={mockSystemStatus} />);
    
    // Should show relative time
    const lastSyncText = getByText(/Last sync:/);
    expect(lastSyncText).toBeTruthy();
  });
});
