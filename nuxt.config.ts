// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  build: {
    transpile: ['vue-toastification'],
  },
  modules: [
    '@nuxtjs/supabase'
  ],
  supabase: {
    redirectOptions: {
      login: '/user/login',
      callback: '/user/confirm',
      exclude: ['/', '/user/register', '/user/password-recovery']
    }
  },
  css: ['~/assets/css/main.css']
})
