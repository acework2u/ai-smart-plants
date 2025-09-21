import Constants from 'expo-constants';

type NotificationsModule = typeof import('expo-notifications');

let cachedModule: NotificationsModule | null = null;
let attemptedLoad = false;

const loadModule = (): NotificationsModule | null => {
  if (attemptedLoad) {
    return cachedModule;
  }

  attemptedLoad = true;

  if (Constants.executionEnvironment === 'storeClient') {
    console.warn(
      '[notifications] expo-notifications is not available inside Expo Go. Notification scheduling will be disabled.'
    );
    cachedModule = null;
    return cachedModule;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    console.warn('[notifications] Failed to load expo-notifications module:', error);
    cachedModule = null;
  }

  return cachedModule;
};

export const getNotificationsModule = (): NotificationsModule | null => {
  return loadModule();
};

export const notificationsModule = loadModule();

export const notificationsAvailable = (): boolean => {
  return Boolean(loadModule());
};
