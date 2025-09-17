// Minimal shim for expo-location to allow bundling without native module
export const Accuracy = {
  Lowest: 1,
  Low: 2,
  Balanced: 3,
  High: 4,
  Highest: 5,
  BestForNavigation: 6,
};

export async function requestForegroundPermissionsAsync() {
  return { status: 'granted', granted: true, canAskAgain: true, expires: 'never' };
}

export async function getCurrentPositionAsync(options = {}) {
  // Return default Bangkok coordinates with a slight jitter
  const latitude = 13.7563 + (Math.random() - 0.5) * 0.0002;
  const longitude = 100.5018 + (Math.random() - 0.5) * 0.0002;
  return {
    coords: {
      latitude,
      longitude,
      altitude: 0,
      accuracy: 10,
      altitudeAccuracy: null,
      heading: 0,
      speed: 0,
    },
    timestamp: Date.now(),
  };
}

export default {
  Accuracy,
  requestForegroundPermissionsAsync,
  getCurrentPositionAsync,
};

