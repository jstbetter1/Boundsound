const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['src/components/ui/PressableScale.tsx', 'src/components/ui/Sheet.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
  {
    files: ['src/components/ui/Sheet.tsx', 'src/components/music/TrackMenuHost.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
