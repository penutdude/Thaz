import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // or '/' if deploying to the root domain
  server: {
    host: true, // Allow access from network devices (phones/tablets)
    port: 5173, // Default Vite port, can be changed if needed
  },
})
