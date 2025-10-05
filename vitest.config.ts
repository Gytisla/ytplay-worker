/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig({
  test: {
    // Environment and globals
    globals: true,
    environment: 'happy-dom',

    // Load environment variables
    env: loadEnv('', process.cwd(), ''),

    // Test file patterns
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.spec/**',
      '**/database/**' // Exclude database tests from main test run
    ],

    // Coverage configuration for >90% requirement
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        '.nuxt/',
        '.output/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        'tests/',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        'coverage/',
        '.github/',
        '.specify/',
        'supabase/migrations/',
        'supabase/functions/'
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      all: true,
      include: [
        'lib/**/*.{js,ts}',
        'server/**/*.{js,ts}',
        'types/**/*.{js,ts}'
      ]
    },

    // Mocking configuration
    setupFiles: ['./tests/setup.ts'],

    // Test timeout
    testTimeout: 10000,

    // TypeScript support
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    },

    // Reporter configuration
    reporters: process.env['CI'] ? ['verbose', 'github-actions'] : ['verbose']
  },

  // Resolve configuration for test environment
  resolve: {
    alias: {
      '~': new URL('./', import.meta.url).pathname,
      '@': new URL('./', import.meta.url).pathname,
      '#shared': new URL('./shared', import.meta.url).pathname
    }
  }
})