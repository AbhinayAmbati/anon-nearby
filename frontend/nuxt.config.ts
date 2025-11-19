// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  runtimeConfig: {
    public: {
      socketUrl: 'http://localhost:3001'
    }
  },
  ssr: false, // Disable SSR for real-time features
  typescript: {
    typeCheck: false // Disable type checking for faster builds
  }
})
