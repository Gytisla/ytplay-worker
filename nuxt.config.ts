// https://nuxt.com/docs/api/configuration/nuxt-config
/// <reference types="nuxt" />
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Source directory configuration
  srcDir: 'src/',

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true,
  },

  // CSS framework
  css: ['~/assets/css/main.css'],

  // Nitro server configuration
  nitro: {
    experimental: {
      wasm: true,
    },
  },

  // Runtime config for environment variables
  runtimeConfig: {
    // Private keys (only available on server-side)
    supabaseServiceKey: process.env['SUPABASE_SERVICE_ROLE_KEY'],
    youtubeApiKey: process.env['YOUTUBE_API_KEY'],
    apiKeySalt: process.env['API_KEY_SALT'],
    apiKeys: process.env['API_KEYS'],

    // Public keys (exposed to client-side)
    public: {
      supabaseUrl: process.env['SUPABASE_URL'],
      supabaseAnonKey: process.env['SUPABASE_ANON_KEY'],
    },
  },

  // Server-side rendering configuration (disabled for API-only app)
  ssr: false,

  // Build configuration
  build: {
    transpile: [],
  },

  // Modules
  modules: [
    '@nuxtjs/tailwindcss'
  ],

  // Development configuration
  devServer: {
    port: process.env['PORT'] ? parseInt(process.env['PORT']) : 3000,
    host: 'localhost',
  },

  // Experimental features
  experimental: {
    payloadExtraction: false,
  },
});
