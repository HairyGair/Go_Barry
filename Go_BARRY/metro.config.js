const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Performance optimizations
config.resolver = {
  ...config.resolver,
  // Faster module resolution
  hasteImplModulePath: null,
  // Skip unused platforms
  platforms: ['web', 'ios', 'android'],
};

// Minification for production
config.transformer = {
  ...config.transformer,
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
    compress: {
      drop_console: process.env.NODE_ENV === 'production',
    },
  },
};

// Caching optimization
config.cacheVersion = '1.0';
config.resetCache = false;

module.exports = config;
