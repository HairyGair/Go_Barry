// Jest setup file for Admin Dashboard tests
import '@testing-library/jest-native/extend-expect';

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock expo modules
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn()
  })),
  Stack: {
    Screen: jest.fn(({ children }) => children)
  },
  useLocalSearchParams: jest.fn(() => ({}))
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'Icon',
  Ionicons: 'Icon'
}));

// Mock Platform
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Platform.OS = 'ios';
  RN.Platform.select = jest.fn(obj => obj.ios || obj.default);
  return RN;
});

// Mock async storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}));

// Global test utilities
global.mockSupervisorSession = (overrides = {}) => {
  return {
    supervisorSession: {
      id: 'test-session',
      name: 'Test Admin',
      badge: 'AG003',
      isAdmin: true,
      ...overrides
    },
    isAdmin: overrides.isAdmin !== undefined ? overrides.isAdmin : true,
    loading: false
  };
};

global.mockConvexSync = (overrides = {}) => {
  return {
    activeAlerts: [],
    activeSupervisors: [],
    dismissFromDisplay: jest.fn(),
    mostSevereEvent: null,
    ...overrides
  };
};

global.mockBarryAPI = (overrides = {}) => {
  return {
    get: jest.fn().mockResolvedValue({ data: { success: true } }),
    post: jest.fn().mockResolvedValue({ data: { success: true } }),
    put: jest.fn().mockResolvedValue({ data: { success: true } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true } }),
    ...overrides
  };
};

// Suppress console warnings in tests
const originalWarn = console.warn;
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ViewPropTypes will be removed')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
});

// Performance API mock
if (!global.performance) {
  global.performance = {
    now: () => Date.now()
  };
}

// RequestAnimationFrame mock
if (!global.requestAnimationFrame) {
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
}
