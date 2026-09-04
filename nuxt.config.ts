// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  build: {
    transpile: ['vue-toastification'],
  },
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
      ],
    },
  },
  modules: [
    '@nuxtjs/supabase',
    '@nuxt/icon',
  ],
  // Canonical production origin for OG tags when the request host is unreliable
  // (set NUXT_PUBLIC_SITE_URL on Vercel, e.g. https://truthseek.network).
  runtimeConfig: {
    public: {
      siteUrl: '',
    },
  },
  // Crawlers (WhatsApp/Facebook/X) need HTML with og:* in the first response.
  // Client-only fetch leaves them with empty meta on Vercel + Supabase.
  routeRules: {
    '/post/**': { ssr: true },
  },
  supabase: {
    types: '~/types/supabase.ts',
    redirectOptions: {
      login: '/user/login',
      callback: '/user/confirm',
      exclude: [
        '/',
        '/faq',
        '/how-it-works',
        '/terms-of-service',
        '/user/register',
        '/user/password-recovery',
        // Public profiles (/user/:username); protected pages use auth middleware
        '/user/**',
        '/categories',
        // Group pages (open groups are browsable by guests)
        '/br/**',
        '/pt/**',
        '/us/**',
        // Individual posts (open-group posts browsable by guests)
        '/post/**',
      ]
    }
  },
  css: ['~/assets/css/main.css']
})
