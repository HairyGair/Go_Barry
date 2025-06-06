const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add web platform support
config.resolver.platforms = ["web", "ios", "android", "native"];

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  // Enable minification for production builds
  config.transformer.minifierConfig = {
    mangle: true,
    output: {
      comments: false,
    },
  };
  
  // Enable tree shaking
  config.transformer.unstable_allowRequireContext = true;
}

// Web-specific optimizations
config.resolver.alias = {
  'react-native': 'react-native-web',
};

// Resolve modules that don't exist on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
