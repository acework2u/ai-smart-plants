import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo modules
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(),
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: {
    Balanced: 'balanced',
  },
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/directory/',
  writeAsStringAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  EncodingType: {
    UTF8: 'utf8',
    Base64: 'base64',
  },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(),
}));

// Mock react-native-skeleton-placeholder
jest.mock('react-native-skeleton-placeholder', () => {
  const React = require('react');
  const { View } = require('react-native');
  return ({ children }) => React.createElement(View, { testID: 'skeleton' }, children);
});

// Mock react-native-chart-kit
jest.mock('react-native-chart-kit', () => ({
  LineChart: () => null,
  BarChart: () => null,
  PieChart: () => null,
  ProgressChart: () => null,
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');

  const mockSvgComponent = (name) => {
    return React.forwardRef((props, ref) =>
      React.createElement(View, { ...props, ref, testID: name })
    );
  };

  return {
    Svg: mockSvgComponent('Svg'),
    Circle: mockSvgComponent('Circle'),
    Ellipse: mockSvgComponent('Ellipse'),
    G: mockSvgComponent('G'),
    Text: mockSvgComponent('SvgText'),
    TSpan: mockSvgComponent('TSpan'),
    TextPath: mockSvgComponent('TextPath'),
    Path: mockSvgComponent('Path'),
    Polygon: mockSvgComponent('Polygon'),
    Polyline: mockSvgComponent('Polyline'),
    Line: mockSvgComponent('Line'),
    Rect: mockSvgComponent('Rect'),
    Use: mockSvgComponent('Use'),
    Image: mockSvgComponent('SvgImage'),
    Symbol: mockSvgComponent('Symbol'),
    Defs: mockSvgComponent('Defs'),
    LinearGradient: mockSvgComponent('LinearGradient'),
    RadialGradient: mockSvgComponent('RadialGradient'),
    Stop: mockSvgComponent('Stop'),
    ClipPath: mockSvgComponent('ClipPath'),
    Pattern: mockSvgComponent('Pattern'),
    Mask: mockSvgComponent('Mask'),
  };
});

// Mock Appearance
jest.mock('react-native/Libraries/Utilities/Appearance', () => ({
  getColorScheme: jest.fn(() => 'light'),
  addChangeListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
}));

// Global test setup
global.__DEV__ = true;

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Date.now for consistent testing
const mockDate = new Date('2025-01-15T10:00:00.000Z');
global.Date.now = jest.fn(() => mockDate.getTime());

// Mock Math.random for consistent testing
global.Math.random = jest.fn(() => 0.5);
