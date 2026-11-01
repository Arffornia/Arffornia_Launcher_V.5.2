// ESLint 9 flat config. Formatting is left to Prettier (`npm run format:check`).
const electronToolkit = require('@electron-toolkit/eslint-config')
const pluginVue = require('eslint-plugin-vue')
const skipFormatting = require('@vue/eslint-config-prettier/skip-formatting')

module.exports = [
  {
    ignores: ['node_modules/**', 'dist/**', 'out/**', 'build/**', 'coverage/**', 'test-results/**']
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
  {
    // Every player-visible string must come from src/renderer/src/i18n/locales/{en,fr}.json.
    files: ['src/renderer/**/*.vue'],
    rules: {
      'vue/no-bare-strings-in-template': [
        'error',
        {
          // Punctuation, symbols and emoji-only glyphs used as icons; never words.
          allowlist: [
            '(', ')', ',', '.', '&', '+', '-', '=', '*', '/', '#', '%', '!', '?', ':', ';',
            '[', ']', '{', '}', '<', '>', '·', '•', '‐', '–', '—', '−', '|', '×', '✕', '✓',
            '‹', '›', '❮', '❯', '…', '🔍'
          ],
          attributes: {
            '/.+/': ['title', 'aria-label', 'aria-placeholder', 'aria-roledescription', 'aria-valuetext'],
            // <input type="button" value="..."> renders its value as the button label.
            input: ['placeholder', 'value'],
            img: ['alt']
          },
          directives: ['v-text']
        }
      ]
    }
  },
  skipFormatting
]
