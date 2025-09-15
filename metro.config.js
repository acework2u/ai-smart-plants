// Custom Metro config to alias react-native-linear-gradient to expo-linear-gradient
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native-linear-gradient': path.resolve(
    __dirname,
    'shims/react-native-linear-gradient'
  ),
};

module.exports = config;

