//vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/admin': 'http://localhost:5000',
      '/user': 'http://localhost:5000',
      '/signup': 'http://localhost:5000',
      '/login': 'http://localhost:5000',
      '/admin-login': 'http://localhost:5000',
      '/chat': 'http://localhost:5000',
        
    }
  }
})
