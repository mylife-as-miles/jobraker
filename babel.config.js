module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add reanimated plugin with proper configuration
      [
        'react-native-reanimated/plugin',
        {
          relativeSourceLocation: true,
        },
      ],
    ],
  };
};
