import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// 🔥 Import the CSS engines directly
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
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
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
  // 🔥 THE HARDWIRE: Force Vite to compile our color overrides directly!
  css: {
    postcss: {
      plugins: [
        tailwindcss({
          content: [
            "./index.html",
            "./src/**/*.{js,ts,jsx,tsx}",
          ],
          theme: {
            extend: {
              colors: {
                indigo: {
                  50: 'rgb(var(--theme-primary-50) / <alpha-value>)',
                  100: 'rgb(var(--theme-primary-100) / <alpha-value>)',
                  200: 'rgb(var(--theme-primary-200) / <alpha-value>)',
                  300: 'rgb(var(--theme-primary-300) / <alpha-value>)',
                  400: 'rgb(var(--theme-primary-400) / <alpha-value>)',
                  500: 'rgb(var(--theme-primary-500) / <alpha-value>)',
                  600: 'rgb(var(--theme-primary-600) / <alpha-value>)',
                  900: 'rgb(var(--theme-primary-900) / <alpha-value>)',
                  950: 'rgb(var(--theme-primary-950) / <alpha-value>)',
                }
              }
            }
          }
        }),
        autoprefixer(),
      ],
    },
  },
})
