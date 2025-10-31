// https://nuxt.com/docs/api/configuration/nuxt-config
/// <reference types="nuxt" />
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Compatibility date for Nitro
  compatibilityDate: '2025-10-19',

  // App configuration
  app: {
    head: {
      title: 'ToPlay.lt',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Atrask lietuviškus YouTube vaizdo įrašus ir kanalus' },
        { name: 'theme-color', content: '#1f2937' },
        // Open Graph
        { property: 'og:title', content: 'ToPlay.lt' },
        { property: 'og:description', content: 'Atrask lietuviškus YouTube vaizdo įrašus ir kanalus' },
        { property: 'og:image', content: '/assets/logo.png' },
        { property: 'og:url', content: 'https://toplay.lt' },
        { property: 'og:type', content: 'website' },
        // Twitter Card
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'ToPlay.lt' },
        { name: 'twitter:description', content: 'Atrask lietuviškus YouTube vaizdo įrašus ir kanalus' },
        { name: 'twitter:image', content: '/assets/logo.png' }
      ],
      link: [
        // Favicon
        { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/favicon-48x48.png' },
        { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/favicon-64x64.png' },
        { rel: 'icon', type: 'image/png', sizes: '128x128', href: '/favicon-128x128.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/favicon-512x512.png' },
        // Apple Touch Icon
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        // Web App Manifest
        { rel: 'manifest', href: '/manifest.json' }
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
      registrationEnabled: process.env['REGISTRATION_ENABLED'] !== 'false', // Default to true
    },
  },

  // Server-side rendering enabled for SEO
  ssr: true,

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