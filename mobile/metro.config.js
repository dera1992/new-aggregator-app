const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Configure resolver to use browser versions of packages
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Force axios to use browser build instead of node build
  if (moduleName === 'axios') {
    return context.resolveRequest(
      context,
      'axios/dist/browser/axios.cjs',
      platform
    );
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;