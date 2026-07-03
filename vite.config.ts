import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // Custom configurations for Vite compilation
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills(),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  }
})
