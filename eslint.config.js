import { createConfigForNuxt } from '@nuxt/eslint-config/flat';

export default createConfigForNuxt({
  // options here
}).append(
  // TypeScript files configuration with type-aware rules
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.vue'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript strict rules - prevent any types and enforce type safety
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // Additional TypeScript rules for code quality
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  '@typescript-eslint/explicit-function-return-type': 'off', // Allow inference
  '@typescript-eslint/no-non-null-assertion': 'warn',
  'no-console': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],

  // General code quality rules
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Vue specific rules
      'vue/multi-word-component-names': 'off', // Allow single word components
      'vue/no-unused-vars': 'error',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
    },
  },
  // Override for test files - more lenient rules for TDD
  {
    files: ['tests/**/*.ts', 'tests/**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
      '@typescript-eslint/no-unsafe-assignment': 'off', // Allow unsafe assignments in tests
      '@typescript-eslint/no-unsafe-member-access': 'off', // Allow unsafe member access in tests
      '@typescript-eslint/no-unsafe-call': 'off', // Allow unsafe calls in tests
      '@typescript-eslint/no-unsafe-return': 'off', // Allow unsafe returns in tests
      '@typescript-eslint/no-unsafe-argument': 'off', // Allow unsafe arguments in tests
      '@typescript-eslint/no-unused-vars': ['off', { argsIgnorePattern: '^_' }], // Warn instead of error
      '@typescript-eslint/consistent-type-imports': 'off', // Allow regular imports in tests
      'no-console': 'off', // Allow console in tests
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions in tests
      '@typescript-eslint/prefer-nullish-coalescing': 'off', // Warn instead of error
      'prefer-const': 'warn', // Warn instead of error
    },
  },
  // Override for generated types files
  {
    files: ['types/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off', // Allow types in generated files
    },
  },
  // Override for Edge Functions - more lenient rules for Deno runtime
  {
    files: ['edge-functions/**/*.ts', 'supabase/functions/**/*.ts', 'src/workers/**/*.ts', 'src/lib/youtube/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn', // Allow any in edge functions
      '@typescript-eslint/no-unsafe-assignment': 'warn', // Allow unsafe assignments in edge functions
      '@typescript-eslint/no-unsafe-member-access': 'warn', // Allow unsafe member access in edge functions
      '@typescript-eslint/no-unsafe-call': 'warn', // Allow unsafe calls in edge functions
      '@typescript-eslint/no-unsafe-return': 'warn', // Allow unsafe returns in edge functions
      '@typescript-eslint/no-unsafe-argument': 'warn', // Allow unsafe arguments in edge functions
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn instead of error
      'no-console': 'off', // Allow console in edge functions
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow non-null assertions in edge functions
      '@typescript-eslint/prefer-nullish-coalescing': 'warn', // Warn instead of error
      'prefer-const': 'warn', // Warn instead of error
    },
  }
);
