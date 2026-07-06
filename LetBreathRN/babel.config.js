module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@': './src',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
    ],
    // react-native-worklets/plugin powers Reanimated 4 worklets and MUST be last.
    'react-native-worklets/plugin',
  ],
};
