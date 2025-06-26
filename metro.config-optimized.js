const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add web platform support
config.resolver.platforms = ["web", "ios", "android", "native"];

// Enhanced production optimizations
if (process.env.NODE_ENV === 'production') {
  // Advanced minification settings
  config.transformer.minifierConfig = {
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      toplevel: true,
      properties: {
        regex: /^_/,  // Mangle private properties
      },
    },
    output: {
      comments: false,
      ascii_only: true,
    },
    compress: {
      arguments: true,
      booleans_as_integers: true,
      drop_console: true,  // Remove console logs in production
      drop_debugger: true,
      ecma: 2015,
      inline: 2,
      passes: 3,  // Multiple compression passes
      pure_funcs: ['console.log', 'console.info', 'console.debug'],
      reduce_vars: true,
      sequences: true,
      side_effects: true,
      unused: true,
    },
  };
  
  // Enable tree shaking
  config.transformer.unstable_allowRequireContext = true;
  
  // Optimize for web bundles
  config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];
}

// Web-specific optimizations
config.resolver.alias = {
  'react-native': 'react-native-web',
};

// Resolve modules that don't exist on web
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Exclude heavy dependencies not needed on web
config.resolver.blacklistRE = /node_modules\/.*\/(test|__tests__|__mocks__|.*\.test\.js$)/;

// Asset optimization
config.transformer.assetRegistryFormat = 'png';
config.transformer.publicPath = '/assets/';

// Bundle splitting for better caching
config.serializer.processModuleFilter = (module) => {
  // Split vendor modules into separate chunks
  if (module.path.includes('node_modules')) {
    return module.path.includes('@expo') || 
           module.path.includes('react') ||
           module.path.includes('react-native');
  }
  return true;
};

module.exports = config;