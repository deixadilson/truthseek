// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  build: {
    transpile: ['vue-toastification'],
  },
  modules: [
    '@nuxtjs/supabase',
    '@nuxt/icon',
  ],
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
