// Flat ESLint config for the backend (Node.js, CommonJS).
//
// Scope:
//   - `eslint:recommended` baseline
//   - Node + ES2024 globals (Buffer, process, console, setTimeout, ...)
//   - CommonJS source type (`require`/`module.exports`)
//   - Skip node_modules and the schema/migration SQL helpers
//
// Out of scope (intentional):
//   - No TypeScript plugin — backend is plain JS.
//   - No Prettier integration — tracked in ROADMAP follow-ups.
//   - Style/preference rules (semicolons, quotes, etc.) — `recommended`
//     covers correctness, not style.

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/', 'database/', 'db-schema/'],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Backend logs heavily for now; revisit when the pino migration
      // (Effort 4) lands.
      'no-console': 'off',
      // Catch-block bindings are removed during the catch-cleanup sweep
      // when not used; allow leading-underscore opt-out for the rare
      // intentional name.
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      // Empty catch blocks are a real smell — flag them.
      'no-empty': ['error', { allowEmptyCatch: false }],
    },
  },
];
