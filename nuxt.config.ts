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

  // Must manually import server utils - Nitro doesn't auto-import server-side code
  imports: {
    dirs: ['server/utils'],
  },

  nitro: {
    experimental: {
      openAPI: true,
    },
  },
})
