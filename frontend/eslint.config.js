import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',

      // Design system: colors, font sizes, spacing and radii must come from a
      // token. Arbitrary values bypass the theme, so changing a token stops
      // propagating. See docs/design-system.md for what to do when one is
      // missing. Layout one-offs (grid-cols-[...], aspect-[...]) and anything
      // wrapping var()/env()/calc() stay allowed on purpose.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\b(?:bg|text|border|ring|fill|stroke|shadow|outline|decoration|divide|accent|caret|from|via|to|rounded|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|gap|gap-x|gap-y|space-x|space-y)-\\[(?!var\\(|env\\(|calc\\()/]',
          message:
            'Arbitrary Tailwind value. Use a design system token instead (see docs/design-system.md); add the token if it is missing.',
        },
      ],
    },
  },
  prettier,
)
