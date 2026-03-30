import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', 
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'], 
      manifest: {
        name: 'Magister OS',
        short_name: 'Magister',
        description: 'Master your curriculum with Magister OS',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: "standalone",
        scope: "/",
        start_url: "/",
        orientation: "portrait",
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable' 
          }
        ],
        widgets: [
          {
            name: "Magister Study Hub",
            short_name: "Study Hub",
            description: "Track your daily targets and pathway progress.",
            tag: "magister-hub-widget",
            template: "hub-widget",
            ms_ac_template: "widgets/hub.json",
            data: { content: "daily-target" },
            type: "application/json",
            screenshots: [{ src: "/widget-preview.png", sizes: "300x300", label: "Study Hub Widget Preview" }],
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          }
        ]
      }
    })
  ],
  // 🔥 THE HARDWIRE: Force Vite to run Tailwind and read your config
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
})
