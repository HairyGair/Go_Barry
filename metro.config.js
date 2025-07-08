// Metro configuration for React Native
// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Ensure operations-centre route is included
  config.resolver = {
    ...config.resolver,
    // Add any custom resolvers here if needed
  };

  return config;
})();
