import { Platform } from 'react-native';
import Constants from 'expo-constants';

// In Expo Go on Android, expo-notifications logs a console.error about remote push not being supported.
// This does not affect local notifications and is noisy during development.
// Silence only that specific message in dev to keep logs clean.
if (__DEV__ && Platform.OS === 'android' && Constants.appOwnership === 'expo') {
  const originalError = console.error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  console.error = (...args: any[]) => {
    const first = args?.[0];
    if (
      typeof first === 'string' &&
      first.startsWith(
        'expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go'
      )
    ) {
      return; // ignore this benign message in Expo Go
    }
    // Also silence noisy React warning that can spam logs and cause nested re-logs
    if (
      typeof first === 'string' &&
      first.startsWith('The result of getSnapshot should be cached')
    ) {
      return;
    }
    originalError(...args);
  };
}
