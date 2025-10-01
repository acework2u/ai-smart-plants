// Custom Metro config to alias react-native-linear-gradient to expo-linear-gradient
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add CSS support for NativeWind v5
config.resolver.sourceExts = [...(config.resolver?.sourceExts ?? []), 'css'];

config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native-linear-gradient': path.resolve(
    __dirname,
    'shims/react-native-linear-gradient'
  ),
  'expo-location': path.resolve(
    __dirname,
    'shims/expo-location'
  ),
};

module.exports = config;
