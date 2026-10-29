// ESLint 9 flat config. Formatting is left to Prettier (`npm run format:check`).
const electronToolkit = require('@electron-toolkit/eslint-config')
const pluginVue = require('eslint-plugin-vue')
const skipFormatting = require('@vue/eslint-config-prettier/skip-formatting')

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'out/**', 'build/**', 'coverage/**', 'test-results/**', 'playwright-report/**']
  },
  electronToolkit,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    }
  },
  {
    rules: {
      'vue/require-default-prop': 'off',
      'vue/multi-word-component-names': 'off'
    }
  },
  skipFormatting
]
