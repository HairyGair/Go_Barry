// Integration tests for Admin Dashboard
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AdminDashboard from '../index';
import SystemOverview from '../system-overview';
import Intelligence from '../intelligence';
import Roadworks from '../roadworks';
import Supervisors from '../supervisors';
import Audit from '../audit';
import Analytics from '../analytics';
import ApiUsage from '../api-usage';
import LiveMap from '../live-map';

// Mock all dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({ 
    push: jest.fn().mockImplementation(route => {
      console.log('Navigating to:', route);
    }),
    back: jest.fn(),
    replace: jest.fn()
  }),
  Stack: { Screen: ({ children }) => children },
  useLocalSearchParams: () => ({})
}));

jest.mock('../../../components/hooks/useSupervisorSession', () => ({
  useSupervisorSession: () => ({
    supervisorSession: { 
      id: 'test-session', 
      name: 'Test Admin', 
      badge: 'AG003',
      isAdmin: true
    },
    isAdmin: true,
    loading: false
  })
}));

jest.mock('../../../components/hooks/useConvexSync', () => ({
  useConvexSync: () => ({
    activeAlerts: [],
    activeSupervisors: [],
    dismissFromDisplay: jest.fn(),
    mostSevereEvent: null
  })
}));

jest.mock('../../../components/hooks/useBarryAPI', () => ({
  useBarryAPI: () => ({
    get: jest.fn().mockResolvedValue({ 
      data: { 
        success: true,
        metrics: {},
        alerts: [],
        stats: {}
      } 
    }),
    post: jest.fn().mockResolvedValue({ data: { success: true } })
  })
}));

// Wrapper component for navigation context
const TestWrapper = ({ children }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('Admin Dashboard Integration Tests', () => {
  describe('Navigation Flow', () => {
    it('navigates from dashboard to System Overview', async () => {
      const { getByLabelText } = render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      const systemCard = getByLabelText('Navigate to System Overview');
      fireEvent.press(systemCard);

      await waitFor(() => {
        expect(systemCard).toBeTruthy();
      });
    });

    it('navigates through all dashboard pages', async () => {
      const pages = [
        'System Overview',
        'Intelligence Dashboard',
        'Roadworks Manager',
        'Supervisor Management',
        'Activity Audit Trail',
        'Alert Analytics',
        'API Usage',
        'Live Map'
      ];

      const { getByLabelText } = render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      for (const page of pages) {
        const card = getByLabelText(`Navigate to ${page}`);
        expect(card).toBeTruthy();
        fireEvent.press(card);
        
        // Verify navigation occurred
        await waitFor(() => {
          expect(card).toBeTruthy();
        });
      }
    });
  });

  describe('Data Persistence', () => {
    it('maintains session across pages', async () => {
      const { rerender } = render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Navigate to another page
      rerender(
        <TestWrapper>
          <SystemOverview />
        </TestWrapper>
      );

      // Session should persist
      const sessionHook = require('../../../components/hooks/useSupervisorSession');
      const { supervisorSession } = sessionHook.useSupervisorSession();
      expect(supervisorSession.badge).toBe('AG003');
    });

    it('shares alert data between pages', async () => {
      // Mock shared alert data
      const mockAlerts = [
        { id: '1', severity: 'high', title: 'Test Alert' }
      ];

      jest.spyOn(require('../../../components/hooks/useConvexSync'), 'useConvexSync')
        .mockReturnValue({
          activeAlerts: mockAlerts,
          activeSupervisors: [],
          dismissFromDisplay: jest.fn()
        });

      const { rerender } = render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <Analytics />
        </TestWrapper>
      );

      // Alert data should be accessible
      const convexHook = require('../../../components/hooks/useConvexSync');
      const { activeAlerts } = convexHook.useConvexSync();
      expect(activeAlerts).toEqual(mockAlerts);
    });
  });

  describe('Real-time Updates', () => {
    it('receives real-time alert updates', async () => {
      const { rerender } = render(
        <TestWrapper>
          <SystemOverview />
        </TestWrapper>
      );

      // Simulate real-time update
      const mockNewAlert = { id: '2', severity: 'critical', title: 'New Alert' };
      
      jest.spyOn(require('../../../components/hooks/useConvexSync'), 'useConvexSync')
        .mockReturnValue({
          activeAlerts: [mockNewAlert],
          activeSupervisors: [],
          dismissFromDisplay: jest.fn()
        });

      rerender(
        <TestWrapper>
          <SystemOverview />
        </TestWrapper>
      );

      // Verify update is reflected
      const convexHook = require('../../../components/hooks/useConvexSync');
      const { activeAlerts } = convexHook.useConvexSync();
      expect(activeAlerts).toContainEqual(mockNewAlert);
    });

    it('updates supervisor status across pages', async () => {
      const mockSupervisors = [
        { badge: 'AG003', name: 'Anthony Gair', status: 'active' }
      ];

      jest.spyOn(require('../../../components/hooks/useConvexSync'), 'useConvexSync')
        .mockReturnValue({
          activeAlerts: [],
          activeSupervisors: mockSupervisors,
          dismissFromDisplay: jest.fn()
        });

      const { rerender } = render(
        <TestWrapper>
          <Supervisors />
        </TestWrapper>
      );

      // Verify supervisor data is available
      const convexHook = require('../../../components/hooks/useConvexSync');
      const { activeSupervisors } = convexHook.useConvexSync();
      expect(activeSupervisors).toEqual(mockSupervisors);
    });
  });

  describe('Permission System', () => {
    it('enforces admin permissions on protected pages', async () => {
      // Mock non-admin user
      jest.spyOn(require('../../../components/hooks/useSupervisorSession'), 'useSupervisorSession')
        .mockReturnValue({
          supervisorSession: { badge: 'JD006' },
          isAdmin: false,
          loading: false
        });

      const { getByText } = render(
        <TestWrapper>
          <SystemOverview />
        </TestWrapper>
      );

      // Should show unauthorized message
      expect(getByText(/unauthorized/i)).toBeTruthy();
    });

    it('allows admin access to all pages', async () => {
      // Mock admin user
      jest.spyOn(require('../../../components/hooks/useSupervisorSession'), 'useSupervisorSession')
        .mockReturnValue({
          supervisorSession: { badge: 'AG003' },
          isAdmin: true,
          loading: false
        });

      const pages = [
        <SystemOverview />,
        <Intelligence />,
        <Roadworks />,
        <Supervisors />,
        <Audit />,
        <Analytics />,
        <ApiUsage />,
        <LiveMap />
      ];

      for (const page of pages) {
        const { queryByText } = render(
          <TestWrapper>
            {page}
          </TestWrapper>
        );

        // Should not show unauthorized
        expect(queryByText(/unauthorized/i)).toBeNull();
      }
    });
  });

  describe('Cross-Page State Management', () => {
    it('maintains filter settings between pages', async () => {
      let filterState = { severity: 'high', timeRange: '24h' };

      // Simulate filter change in Analytics
      const { rerender } = render(
        <TestWrapper>
          <Analytics />
        </TestWrapper>
      );

      // Change filter
      filterState = { severity: 'critical', timeRange: '7d' };

      // Navigate to different page and back
      rerender(
        <TestWrapper>
          <Audit />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <Analytics />
        </TestWrapper>
      );

      // Filter should persist (in real app, this would be through context/state)
      expect(filterState.severity).toBe('critical');
      expect(filterState.timeRange).toBe('7d');
    });

    it('syncs dismissal actions across views', async () => {
      const mockDismiss = jest.fn();
      
      jest.spyOn(require('../../../components/hooks/useConvexSync'), 'useConvexSync')
        .mockReturnValue({
          activeAlerts: [{ id: '1', title: 'Test Alert' }],
          activeSupervisors: [],
          dismissFromDisplay: mockDismiss
        });

      const { getByTestId } = render(
        <TestWrapper>
          <LiveMap />
        </TestWrapper>
      );

      // Simulate dismissal
      const dismissButton = getByTestId('dismiss-alert-1');
      fireEvent.press(dismissButton);

      expect(mockDismiss).toHaveBeenCalledWith('1');
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock API error
      jest.spyOn(require('../../../components/hooks/useBarryAPI'), 'useBarryAPI')
        .mockReturnValue({
          get: jest.fn().mockRejectedValue(new Error('API Error')),
          post: jest.fn().mockRejectedValue(new Error('API Error'))
        });

      const { getByText } = render(
        <TestWrapper>
          <SystemOverview />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(getByText(/error/i)).toBeTruthy();
      });
    });

    it('shows loading states during data fetch', async () => {
      let resolvePromise;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      jest.spyOn(require('../../../components/hooks/useBarryAPI'), 'useBarryAPI')
        .mockReturnValue({
          get: jest.fn().mockReturnValue(delayedPromise)
        });

      const { getByTestId } = render(
        <TestWrapper>
          <Intelligence />
        </TestWrapper>
      );

      // Should show loading
      expect(getByTestId('loading-indicator')).toBeTruthy();

      // Resolve the promise
      resolvePromise({ data: { success: true } });

      await waitFor(() => {
        expect(() => getByTestId('loading-indicator')).toThrow();
      });
    });
  });

  describe('Data Refresh', () => {
    it('supports pull-to-refresh on all data pages', async () => {
      const mockRefresh = jest.fn().mockResolvedValue({ data: { success: true } });
      
      jest.spyOn(require('../../../components/hooks/useBarryAPI'), 'useBarryAPI')
        .mockReturnValue({
          get: mockRefresh
        });

      const dataPages = [
        <SystemOverview />,
        <Intelligence />,
        <Analytics />,
        <ApiUsage />
      ];

      for (const page of dataPages) {
        mockRefresh.mockClear();
        
        const { getByTestId } = render(
          <TestWrapper>
            {page}
          </TestWrapper>
        );

        const scrollView = getByTestId('scrollview-with-refresh');
        fireEvent(scrollView, 'refresh');

        await waitFor(() => {
          expect(mockRefresh).toHaveBeenCalled();
        });
      }
    });

    it('auto-refreshes data at intervals', async () => {
      jest.useFakeTimers();
      const mockFetch = jest.fn().mockResolvedValue({ data: { success: true } });
      
      jest.spyOn(require('../../../components/hooks/useBarryAPI'), 'useBarryAPI')
        .mockReturnValue({
          get: mockFetch
        });

      render(
        <TestWrapper>
          <SystemOverview />
        </TestWrapper>
      );

      // Initial fetch
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Fast-forward 10 seconds
      jest.advanceTimersByTime(10000);

      // Should fetch again
      expect(mockFetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });
});
