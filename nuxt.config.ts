// https://nuxt.com/docs/api/configuration/nuxt-config
/// <reference types="nuxt" />
export default defineNuxtConfig({
  devtools: { enabled: true },

  vite: {
    optimizeDeps: {
			include: ["@auth/core"],
		}
  },

  // Source directory configuration
  srcDir: 'src/',

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: false,
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
      supabase: {
        url: process.env['SUPABASE_URL'],
        key: process.env['SUPABASE_ANON_KEY'],
      },
    },
  },

  supabase: {
    redirect: false // ⛔ disables the module’s automatic auth redirects
  },

  // Server-side rendering configuration (disabled for API-only app)
  ssr: {
    noExternal: ['@supabase', '@nuxtjs/supabase', 'cookie']
  },

  // Build configuration
  build: {
    transpile: [],
  },

  // Modules
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@nuxtjs/i18n'
  ],

  // Internationalization configuration
  i18n: {
    locales: [
      {
        code: 'en',
        name: 'English',
        iso: 'en-US',
        file: 'en.json'
      },
      {
        code: 'lt',
        name: 'Lietuvių',
        iso: 'lt-LT',
        file: 'lt.json'
      }
    ],
    defaultLocale: 'lt',
    strategy: 'prefix_except_default',
    lazy: true,
    langDir: '../src/locales/',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'en'
    }
  },

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