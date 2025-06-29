// Cross-platform tests for Admin Dashboard
import React from 'react';
import { render, Platform } from '@testing-library/react-native';
import AdminDashboard from '../index';
import SystemOverview from '../system-overview';
import LiveMap from '../live-map';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  Stack: { Screen: ({ children }) => children }
}));

jest.mock('../../../components/hooks/useSupervisorSession', () => ({
  useSupervisorSession: () => ({
    supervisorSession: { badge: 'AG003' },
    isAdmin: true
  })
}));

jest.mock('../../../components/hooks/useConvexSync', () => ({
  useConvexSync: () => ({
    activeAlerts: [],
    activeSupervisors: []
  })
}));

// Mock Platform for testing
const mockPlatform = (OS, config = {}) => {
  Platform.OS = OS;
  Platform.select = jest.fn(obj => obj[OS] || obj.default);
  Platform.Version = config.version || (OS === 'ios' ? '14.0' : 28);
  Platform.isPad = config.isPad || false;
  Platform.isTV = config.isTV || false;
};

describe('Cross-Platform Tests', () => {
  describe('Web Platform', () => {
    beforeEach(() => {
      mockPlatform('web');
    });

    it('renders correctly on web', () => {
      const { getByLabelText } = render(<AdminDashboard />);
      expect(getByLabelText('Admin Dashboard')).toBeTruthy();
    });

    it('displays map component on web', () => {
      const { getByTestId } = render(<LiveMap />);
      expect(getByTestId('tomtom-traffic-map')).toBeTruthy();
    });

    it('uses web-specific scrollbar styles', () => {
      const { getByTestId } = render(<SystemOverview />);
      const scrollView = getByTestId('main-scroll-view');
      
      // Web should have custom scrollbar styles
      expect(scrollView.props.showsVerticalScrollIndicator).toBe(false);
    });

    it('handles web browser events', () => {
      // Mock window resize
      global.window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        innerWidth: 1920,
        innerHeight: 1080
      };

      render(<AdminDashboard />);
      
      // Should listen for resize events on web
      expect(global.window.addEventListener).toHaveBeenCalledWith(
        'resize',
        expect.any(Function)
      );
    });
  });

  describe('iOS Platform', () => {
    beforeEach(() => {
      mockPlatform('ios', { version: '15.0' });
    });

    it('renders correctly on iOS', () => {
      const { getByLabelText } = render(<AdminDashboard />);
      expect(getByLabelText('Admin Dashboard')).toBeTruthy();
    });

    it('shows iOS fallback for map', () => {
      const { getByText, queryByTestId } = render(<LiveMap />);
      
      // Should not show web map
      expect(queryByTestId('tomtom-traffic-map')).toBeNull();
      
      // Should show fallback message
      expect(getByText(/Map view is only available on web/i)).toBeTruthy();
    });

    it('uses iOS-specific safe area insets', () => {
      const { getByTestId } = render(<AdminDashboard />);
      const container = getByTestId('admin-container');
      
      // iOS should have safe area padding
      expect(container.props.style).toMatchObject(
        expect.objectContaining({
          paddingTop: expect.any(Number)
        })
      );
    });

    it('handles iOS-specific gestures', () => {
      const { getByTestId } = render(<SystemOverview />);
      const scrollView = getByTestId('main-scroll-view');
      
      // iOS should have bounce enabled
      expect(scrollView.props.bounces).toBe(true);
    });
  });

  describe('Android Platform', () => {
    beforeEach(() => {
      mockPlatform('android', { version: 30 });
    });

    it('renders correctly on Android', () => {
      const { getByLabelText } = render(<AdminDashboard />);
      expect(getByLabelText('Admin Dashboard')).toBeTruthy();
    });

    it('shows Android fallback for map', () => {
      const { getByText, queryByTestId } = render(<LiveMap />);
      
      // Should not show web map
      expect(queryByTestId('tomtom-traffic-map')).toBeNull();
      
      // Should show fallback message
      expect(getByText(/Map view is only available on web/i)).toBeTruthy();
    });

    it('uses Android-specific elevation styles', () => {
      const { getAllByTestId } = render(<AdminDashboard />);
      const cards = getAllByTestId(/dashboard-card-/);
      
      cards.forEach(card => {
        // Android uses elevation for shadows
        expect(card.props.style).toMatchObject(
          expect.objectContaining({
            elevation: expect.any(Number)
          })
        );
      });
    });

    it('handles Android back button', () => {
      const mockRouter = { back: jest.fn() };
      jest.spyOn(require('expo-router'), 'useRouter')
        .mockReturnValue(mockRouter);

      const { getByTestId } = render(<SystemOverview />);
      const backButton = getByTestId('back-button');
      
      fireEvent.press(backButton);
      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('Screen Sizes', () => {
    const testScreenSize = (width, height, deviceType) => {
      it(`renders correctly on ${deviceType} (${width}x${height})`, () => {
        // Mock dimensions
        jest.mock('react-native', () => ({
          ...jest.requireActual('react-native'),
          Dimensions: {
            get: jest.fn(() => ({ width, height }))
          }
        }));

        const { getByLabelText } = render(<AdminDashboard />);
        expect(getByLabelText('Admin Dashboard')).toBeTruthy();

        // Verify responsive layout adjustments
        const container = getByLabelText('Admin Dashboard');
        const style = container.props.style;

        if (width < 768) {
          // Mobile layout
          expect(style.flexDirection).toBe('column');
        } else {
          // Tablet/Desktop layout
          expect(style.flexDirection).toBe('row');
        }
      });
    };

    // Test various screen sizes
    testScreenSize(375, 812, 'iPhone X');
    testScreenSize(414, 896, 'iPhone 11 Pro Max');
    testScreenSize(360, 740, 'Android Phone');
    testScreenSize(768, 1024, 'iPad');
    testScreenSize(1024, 1366, 'iPad Pro');
    testScreenSize(1920, 1080, 'Desktop HD');
    testScreenSize(2560, 1440, 'Desktop 2K');
  });

  describe('Dark/Light OS Themes', () => {
    it('respects system dark mode', () => {
      // Mock dark mode
      jest.mock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Appearance: {
          getColorScheme: jest.fn(() => 'dark')
        }
      }));

      const { getByTestId } = render(<AdminDashboard />);
      const container = getByTestId('admin-container');
      
      // Should use dark theme colors
      expect(container.props.style.backgroundColor).toBe('#0a0a0f');
    });

    it('maintains dark theme regardless of system setting', () => {
      // Mock light mode
      jest.mock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Appearance: {
          getColorScheme: jest.fn(() => 'light')
        }
      }));

      const { getByTestId } = render(<AdminDashboard />);
      const container = getByTestId('admin-container');
      
      // Should still use dark theme (admin is always dark)
      expect(container.props.style.backgroundColor).toBe('#0a0a0f');
    });
  });

  describe('Browser Compatibility', () => {
    const browsers = [
      { name: 'Chrome', userAgent: 'Chrome/91.0.4472.124' },
      { name: 'Firefox', userAgent: 'Firefox/89.0' },
      { name: 'Safari', userAgent: 'Safari/14.1.1' },
      { name: 'Edge', userAgent: 'Edg/91.0.864.59' }
    ];

    browsers.forEach(({ name, userAgent }) => {
      it(`works correctly in ${name}`, () => {
        mockPlatform('web');
        
        // Mock user agent
        Object.defineProperty(global.navigator, 'userAgent', {
          value: userAgent,
          configurable: true
        });

        const { getByLabelText } = render(<AdminDashboard />);
        expect(getByLabelText('Admin Dashboard')).toBeTruthy();
      });
    });
  });

  describe('Platform-Specific Features', () => {
    it('uses correct date picker for platform', () => {
      // Test iOS
      mockPlatform('ios');
      let { getByTestId } = render(<Analytics />);
      let datePicker = getByTestId('date-range-picker');
      expect(datePicker.type).toBe('ios-date-picker');

      // Test Android
      mockPlatform('android');
      ({ getByTestId } = render(<Analytics />));
      datePicker = getByTestId('date-range-picker');
      expect(datePicker.type).toBe('android-date-picker');

      // Test Web
      mockPlatform('web');
      ({ getByTestId } = render(<Analytics />));
      datePicker = getByTestId('date-range-picker');
      expect(datePicker.type).toBe('web-select');
    });

    it('uses platform-appropriate icons', () => {
      const checkIcon = (platform, expectedIconSet) => {
        mockPlatform(platform);
        const { getByTestId } = render(<SystemOverview />);
        const icon = getByTestId('refresh-icon');
        expect(icon.props.name).toContain(expectedIconSet);
      };

      checkIcon('ios', 'ios-');
      checkIcon('android', 'md-');
      checkIcon('web', 'md-'); // Web uses material design
    });
  });

  describe('Responsive Design', () => {
    it('adjusts grid layout based on screen width', () => {
      const testResponsiveGrid = (width, expectedColumns) => {
        jest.mock('react-native', () => ({
          ...jest.requireActual('react-native'),
          Dimensions: {
            get: jest.fn(() => ({ width, height: 800 }))
          }
        }));

        const { getAllByTestId } = render(<AdminDashboard />);
        const cards = getAllByTestId(/dashboard-card-/);
        
        // Calculate actual columns based on card width
        const cardWidth = cards[0].props.style.width;
        const actualColumns = Math.floor(width / cardWidth);
        
        expect(actualColumns).toBe(expectedColumns);
      };

      testResponsiveGrid(320, 1);  // Mobile portrait
      testResponsiveGrid(768, 2);  // Tablet portrait
      testResponsiveGrid(1024, 3); // Tablet landscape
      testResponsiveGrid(1920, 4); // Desktop
    });

    it('shows/hides sidebar based on screen size', () => {
      // Small screen - no sidebar
      mockPlatform('web');
      jest.mock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Dimensions: {
          get: jest.fn(() => ({ width: 600, height: 800 }))
        }
      }));

      let { queryByTestId } = render(<Intelligence />);
      expect(queryByTestId('sidebar')).toBeNull();

      // Large screen - show sidebar
      jest.mock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Dimensions: {
          get: jest.fn(() => ({ width: 1400, height: 900 }))
        }
      }));

      ({ queryByTestId } = render(<Intelligence />));
      expect(queryByTestId('sidebar')).toBeTruthy();
    });
  });

  describe('Accessibility Across Platforms', () => {
    const platforms = ['web', 'ios', 'android'];

    platforms.forEach(platform => {
      it(`maintains accessibility features on ${platform}`, () => {
        mockPlatform(platform);
        
        const { getAllByRole, getByLabelText } = render(<AdminDashboard />);
        
        // All interactive elements should be accessible
        const buttons = getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
        
        buttons.forEach(button => {
          expect(button.props.accessible).toBe(true);
        });
        
        // Main areas should have labels
        expect(getByLabelText('Admin Dashboard')).toBeTruthy();
      });
    });
  });
});
