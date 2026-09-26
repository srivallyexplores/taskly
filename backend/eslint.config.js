import js from '@eslint/js';
import globals from 'globals';

/**
 * ESLint v9 flat config for the Taskly backend.
 *
 * The backend is Node.js ESM ("type": "module"). This config runs `npm run lint`
 * cleanly without rewriting business logic: it applies the recommended rule set
 * but relaxes rules that would otherwise produce large, no-op churn across the
 * existing codebase (e.g. unused vars are warnings, not errors).
 */
export default [
  {
    ignores: [
      'node_modules/**',
      'coverage/**',
      'placeholder.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Relax noisy rules to avoid churn on existing, working code.
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-constant-condition': ['warn', { checkLoops: false }],
      'no-useless-escape': 'warn',
      'no-useless-catch': 'warn',
      'no-control-regex': 'off',
      'no-prototype-builtins': 'off',
    },
  },
  {
    // Test files: enable Jest globals.
    files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    // CommonJS config files (.cjs) use require/module.
    files: ['**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
];
