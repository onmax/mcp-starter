// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/content', '@nuxt/eslint'],

  eslint: {
    config: {
      standalone: false,
    },
  },

  // Auto-import utilities
  imports: {
    dirs: ['server/utils'],
  },

  // Enable server routes
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
