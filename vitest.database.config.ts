/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig({
  test: {
    // Environment and globals
    globals: true,
    environment: 'happy-dom',

    // Load environment variables from all env files including .local
    env: loadEnv('', process.cwd(), ['SUPABASE_', 'DATABASE_']),

    // Test file patterns
    include: [
      'tests/unit/database/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],

    // Database-specific setup without MSW
    setupFiles: ['./tests/database-setup.ts'],

    // Test timeout
    testTimeout: 15000,

    // TypeScript support
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json'
    },

    // Reporter configuration
    reporters: ['verbose']
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