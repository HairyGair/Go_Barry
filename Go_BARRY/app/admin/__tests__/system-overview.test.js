// Unit tests for System Overview page
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import SystemOverview from '../system-overview';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
  Stack: {
    Screen: ({ children }) => children
  }
}));

jest.mock('../../../components/hooks/useSupervisorSession', () => ({
  useSupervisorSession: () => ({
    supervisorSession: { id: 'test-session', name: 'Test Admin', badge: 'AG003' },
    isAdmin: true,
    supervisorName: 'Test Admin'
  })
}));

jest.mock('../../../components/hooks/useConvexSync', () => ({
  useConvexSync: () => ({
    activeAlerts: [
      { id: '1', title: 'Test Alert 1', severity: 'high', location: 'Newcastle' },
      { id: '2', title: 'Test Alert 2', severity: 'medium', location: 'Gateshead' }
    ],
    activeSupervisors: [
      { id: '1', name: 'John Doe', badge: 'JD001' }
    ]
  })
}));

jest.mock('../../../components/hooks/useBarryAPI', () => ({
  useBarryAPI: () => ({
    getTomTomKey: jest.fn().mockResolvedValue('test-key')
  })
}));

// Mock fetch
global.fetch = jest.fn();

describe('System Overview Page', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('renders without crashing', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        health: {
          backend: { status: 'active' },
          database: { status: 'active' },
          tomtom: { status: 'active' },
          nationalHighways: { status: 'active' }
        },
        performance: {
          cpu: 25,
          memory: { percentage: 45 },
          uptime: 86400
        }
      })
    });

    const { getByText } = render(<SystemOverview />);
    
    await waitFor(() => {
      expect(getByText('System Overview')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    const { getByTestId } = render(<SystemOverview />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('fetches system health data on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        health: {
          backend: { status: 'active' }
        }
      })
    });

    render(<SystemOverview />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/health-extended')
      );
    });
  });

  it('displays service health cards when data is loaded', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        health: {
          backend: { status: 'active', message: 'Backend running' },
          database: { status: 'active', message: 'Database connected' },
          tomtom: { status: 'warning', message: 'Rate limit approaching' },
          nationalHighways: { status: 'error', message: 'API unavailable' }
        }
      })
    });

    const { getByText } = render(<SystemOverview />);

    await waitFor(() => {
      expect(getByText('Backend API')).toBeTruthy();
      expect(getByText('Database')).toBeTruthy();
      expect(getByText('TomTom API')).toBeTruthy();
      expect(getByText('National Highways')).toBeTruthy();
    });
  });

  it('handles refresh action', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, health: {} })
    });

    const { getByTestId } = render(<SystemOverview />);

    // Wait for initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2); // health + coverage
    });

    // Trigger refresh
    const scrollView = getByTestId('system-overview-scroll');
    fireEvent(scrollView, 'refresh');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(4); // 2 more calls
    });
  });

  it('displays RAM usage correctly', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        performance: {
          memory: { percentage: 75, used: 1536, total: 2048 }
        }
      })
    });

    const { getByText } = render(<SystemOverview />);

    await waitFor(() => {
      expect(getByText(/75%/)).toBeTruthy();
      expect(getByText(/1536 MB \/ 2048 MB/)).toBeTruthy();
    });
  });

  it('shows error state when API call fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<SystemOverview />);

    await waitFor(() => {
      expect(getByText(/Error loading/i)).toBeTruthy();
    });
  });

  it('redirects non-admin users', () => {
    // Override the mock for this test
    jest.spyOn(require('../../../components/hooks/useSupervisorSession'), 'useSupervisorSession')
      .mockReturnValueOnce({
        supervisorSession: { id: 'test-session' },
        isAdmin: false
      });

    const mockReplace = jest.fn();
    jest.spyOn(require('expo-router'), 'useRouter')
      .mockReturnValueOnce({ replace: mockReplace });

    render(<SystemOverview />);

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('handles service restart action', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          health: {
            backend: { status: 'error', message: 'Service down' }
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

    const { getByText } = render(<SystemOverview />);

    await waitFor(() => {
      expect(getByText('Restart')).toBeTruthy();
    });

    fireEvent.press(getByText('Restart'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/restart/backend'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('displays coverage data correctly', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          alerts: [
            { location: 'Newcastle - City Centre', severity: 'high' },
            { location: 'Newcastle - West End', severity: 'medium' },
            { location: 'Gateshead - Town Centre', severity: 'low' }
          ]
        })
      });

    const { getByText } = render(<SystemOverview />);

    await waitFor(() => {
      expect(getByText('Newcastle')).toBeTruthy();
      expect(getByText('2 incidents')).toBeTruthy();
      expect(getByText('Gateshead')).toBeTruthy();
      expect(getByText('1 incident')).toBeTruthy();
    });
  });
});
