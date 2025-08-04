// Metro configuration for React Native
// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  
  // Block test files and backup files from bundling
  config.resolver = {
    ...config.resolver,
    blockList: exclusionList([
      /.*\/__tests__\/.*/,
      /.*\.test\.(js|jsx|ts|tsx)$/,
      /.*\.spec\.(js|jsx|ts|tsx)$/,
      /.*\.backup$/,
      /.*\.bak$/,
      /.*\.old$/,
    ]),
  };
  
  return config;
})();