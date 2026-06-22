// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions/ is Deno (URL imports + Deno globals); it is checked
    // by the Deno toolchain, not the React Native eslint/tsc config.
    ignores: ['dist/*', '.expo/*', 'supabase/functions/**'],
  },
]);
