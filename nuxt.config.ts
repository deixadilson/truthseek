// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/supabase'
  ],
  supabase: {
    redirectOptions: {
      login: '/user/login',
      callback: '/user/confirm',
      exclude: ['/','/user/register']
    }
  },
  css: ['~/assets/css/main.css']
})
