import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project site: https://<user>.github.io/kana-flashcard/
  // PENTING: jika nama repo GitHub berbeda, ganti base ini agar sama persis.
  base: '/kana-flashcard/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Kana Flashcards',
        short_name: 'Kana',
        description: 'Flashcard hiragana, katakana, dan kanji dengan spaced repetition.',
        theme_color: '#faf7f0',
        background_color: '#faf7f0',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'id',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Offline-first: cache app shell + data saat pertama dibuka
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: { cacheName: 'pages' },
          },
        ],
      },
    }),
  ],
})
