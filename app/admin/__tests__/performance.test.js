// Performance tests for Admin Dashboard
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { performance } from 'perf_hooks';
import AdminDashboard from '../index';
import SystemOverview from '../system-overview';
import Intelligence from '../intelligence';
import Analytics from '../analytics';
import LiveMap from '../live-map';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  Stack: { Screen: ({ children }) => children }
}));

jest.mock('../../../components/hooks/useSupervisorSession', () => ({
  useSupervisorSession: () => ({
    supervisorSession: { badge: 'AG003' },
    isAdmin: true,
    loading: false
  })
}));

jest.mock('../../../components/hooks/useConvexSync', () => ({
  useConvexSync: () => ({
    activeAlerts: Array(100).fill(null).map((_, i) => ({
      id: `alert-${i}`,
      title: `Test Alert ${i}`,
      severity: ['low', 'medium', 'high', 'critical'][i % 4]
    })),
    activeSupervisors: []
  })
}));

jest.mock('../../../components/hooks/useBarryAPI', () => ({
  useBarryAPI: () => ({
    get: jest.fn().mockResolvedValue({ 
      data: { 
        success: true,
        metrics: {
          totalAlerts: 1000,
          avgResponseTime: 250,
          memoryUsage: 150000000 // 150MB
        }
      } 
    })
  })
}));

describe('Performance Tests', () => {
  describe('Load Times', () => {
    it('AdminDashboard loads in under 2 seconds', async () => {
      const startTime = performance.now();
      
      const { getByLabelText } = render(<AdminDashboard />);
      
      await waitFor(() => {
        expect(getByLabelText('Admin Dashboard')).toBeTruthy();
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(2000); // 2 seconds
    });

    it('System Overview loads in under 1.5 seconds', async () => {
      const startTime = performance.now();
      
      const { getByText } = render(<SystemOverview />);
      
      await waitFor(() => {
        expect(getByText('System Health')).toBeTruthy();
      });
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(1500); // 1.5 seconds
    });

    it('heavy pages load in under 3 seconds', async () => {
      const heavyPages = [
        { component: Intelligence, identifier: 'Intelligence Dashboard' },
        { component: Analytics, identifier: 'Alert Analytics' },
        { component: LiveMap, identifier: 'Live Traffic Map' }
      ];

      for (const { component: Component, identifier } of heavyPages) {
        const startTime = performance.now();
        
        const { getByText } = render(<Component />);
        
        await waitFor(() => {
          expect(getByText(identifier)).toBeTruthy();
        });
        
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        expect(loadTime).toBeLessThan(3000); // 3 seconds
      }
    });
  });

  describe('Memory Usage', () => {
    it('maintains memory usage below 200MB', () => {
      if (global.process && global.process.memoryUsage) {
        const memoryBefore = process.memoryUsage().heapUsed;
        
        // Render multiple heavy components
        const components = [];
        for (let i = 0; i < 5; i++) {
          components.push(render(<Analytics />));
        }
        
        const memoryAfter = process.memoryUsage().heapUsed;
        const memoryIncrease = memoryAfter - memoryBefore;
        
        // Memory increase should be less than 200MB
        expect(memoryIncrease).toBeLessThan(200 * 1024 * 1024);
        
        // Cleanup
        components.forEach(c => c.unmount());
      }
    });

    it('properly cleans up on unmount', () => {
      const memoryBefore = global.process?.memoryUsage?.().heapUsed || 0;
      
      const { unmount } = render(<SystemOverview />);
      unmount();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const memoryAfter = global.process?.memoryUsage?.().heapUsed || 0;
      
      // Memory should not significantly increase after unmount
      expect(memoryAfter - memoryBefore).toBeLessThan(10 * 1024 * 1024); // 10MB tolerance
    });
  });

  describe('Rendering Performance', () => {
    it('renders large alert lists efficiently', async () => {
      // Mock 1000 alerts
      const largeAlertList = Array(1000).fill(null).map((_, i) => ({
        id: `alert-${i}`,
        title: `Alert ${i}`,
        severity: 'high'
      }));

      jest.spyOn(require('../../../components/hooks/useConvexSync'), 'useConvexSync')
        .mockReturnValue({
          activeAlerts: largeAlertList,
          activeSupervisors: []
        });

      const startTime = performance.now();
      
      const { getByText } = render(<Analytics />);
      
      await waitFor(() => {
        expect(getByText('Alert Analytics')).toBeTruthy();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render efficiently even with large datasets
      expect(renderTime).toBeLessThan(500); // 500ms
    });

    it('chart rendering is smooth', async () => {
      const { getByTestId } = render(<Intelligence />);
      
      await waitFor(() => {
        expect(getByTestId('disruption-score-chart')).toBeTruthy();
      });
      
      // Simulate multiple re-renders
      const renderTimes = [];
      for (let i = 0; i < 10; i++) {
        const start = performance.now();
        
        // Force re-render by updating props
        const { rerender } = render(<Intelligence key={i} />);
        
        const end = performance.now();
        renderTimes.push(end - start);
      }
      
      // Average render time should be under 16ms (60fps)
      const avgRenderTime = renderTimes.reduce((a, b) => a + b) / renderTimes.length;
      expect(avgRenderTime).toBeLessThan(16);
    });
  });

  describe('API Response Times', () => {
    it('handles API responses efficiently', async () => {
      const mockAPI = {
        get: jest.fn().mockImplementation(() => {
          // Simulate network delay
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({ data: { success: true, metrics: {} } });
            }, 100);
          });
        })
      };

      jest.spyOn(require('../../../components/hooks/useBarryAPI'), 'useBarryAPI')
        .mockReturnValue(mockAPI);

      const startTime = performance.now();
      
      render(<SystemOverview />);
      
      await waitFor(() => {
        expect(mockAPI.get).toHaveBeenCalled();
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Total time including API call should be reasonable
      expect(totalTime).toBeLessThan(1000); // 1 second
    });
  });

  describe('Bundle Size', () => {
    it('component file sizes are optimized', () => {
      const fs = require('fs');
      const path = require('path');
      
      const componentFiles = [
        'index.jsx',
        'system-overview.jsx',
        'intelligence.jsx',
        'analytics.jsx'
      ];
      
      componentFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const fileSizeInKB = stats.size / 1024;
          
          // Each component should be under 100KB
          expect(fileSizeInKB).toBeLessThan(100);
        }
      });
    });
  });

  describe('Animation Performance', () => {
    it('loading animations are smooth', async () => {
      const { getByTestId } = render(<AdminDashboard />);
      
      // Trigger loading state
      const loadingOverlay = getByTestId('loading-overlay');
      expect(loadingOverlay).toBeTruthy();
      
      // Measure animation frame rate
      let frameCount = 0;
      const startTime = performance.now();
      
      const measureFrames = () => {
        frameCount++;
        if (performance.now() - startTime < 1000) {
          requestAnimationFrame(measureFrames);
        }
      };
      
      if (global.requestAnimationFrame) {
        measureFrames();
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Should achieve at least 30fps
        expect(frameCount).toBeGreaterThan(30);
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('handles multiple simultaneous API calls efficiently', async () => {
      const mockAPI = {
        get: jest.fn().mockResolvedValue({ data: { success: true } })
      };

      jest.spyOn(require('../../../components/hooks/useBarryAPI'), 'useBarryAPI')
        .mockReturnValue(mockAPI);

      const startTime = performance.now();
      
      // Render multiple data-heavy components simultaneously
      const components = [
        render(<SystemOverview />),
        render(<Intelligence />),
        render(<Analytics />),
        render(<ApiUsage />)
      ];
      
      await waitFor(() => {
        expect(mockAPI.get).toHaveBeenCalledTimes(4);
      });
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle concurrent operations efficiently
      expect(totalTime).toBeLessThan(2000); // 2 seconds for all
      
      // Cleanup
      components.forEach(c => c.unmount());
    });
  });

  describe('Search Performance', () => {
    it('filters large datasets efficiently', async () => {
      // Mock large supervisor list
      const largeSupervisorList = Array(1000).fill(null).map((_, i) => ({
        badge: `SV${i.toString().padStart(3, '0')}`,
        name: `Supervisor ${i}`,
        active: i % 2 === 0
      }));

      const { getByPlaceholderText } = render(<Supervisors />);
      
      const searchInput = getByPlaceholderText('Search supervisors...');
      
      const startTime = performance.now();
      
      // Simulate typing in search
      fireEvent.changeText(searchInput, 'Supervisor 999');
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;
      
      // Search should be near-instant
      expect(searchTime).toBeLessThan(50); // 50ms
    });
  });
});
