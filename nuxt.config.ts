// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  build: {
    transpile: ['vue-toastification'],
  },
  modules: [
    '@nuxtjs/supabase'
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
        '/user/password-recovery'
      ]
    }
  },
  css: ['~/assets/css/main.css']
})
