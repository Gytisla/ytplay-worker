// https://nuxt.com/docs/api/configuration/nuxt-config
/// <reference types="nuxt" />
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Compatibility date for Nitro
  compatibilityDate: '2025-10-19',

  // App configuration
  app: {
    head: {
      title: 'YTPlay.lt',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Discover Lithuanian YouTube videos and channels' }
      ],
      link: [
        // Favicon
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/favicon-48x48.png' },
        { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/favicon-64x64.png' },
        { rel: 'icon', type: 'image/png', sizes: '128x128', href: '/favicon-128x128.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/favicon-512x512.png' },
        // Apple Touch Icon
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' }
      ]
    }
  },

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
    compatibilityDate: '2025-10-19',
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
      fallbackLocale: 'lt'
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